/**
 * The constellation: a small force-directed graph of repositories, linked by
 * shared language and orbiting a central hub. Hand-written (no d3) to keep the
 * payload tiny. Honours prefers-reduced-motion (renders a settled static layout)
 * and pauses when scrolled out of view.
 */
interface RawNode {
  id: string;
  label: string;
  slug: string | null;
  url: string;
  category: string;
  weight: number;
  stars: number;
  language: string | null;
}
interface RawLink {
  source: string;
  target: string;
  strength: number;
}
interface Payload {
  nodes: RawNode[];
  links: RawLink[];
  hub: string;
}

interface SimNode extends RawNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isHub: boolean;
  fixed: boolean;
}

const CAT_VAR: Record<string, string> = {
  'data-ml': '--cat-data-ml',
  systems: '--cat-systems',
  web: '--cat-web',
  algorithms: '--cat-algorithms',
  research: '--cat-research',
};

const root = document.querySelector<HTMLElement>('[data-constellation]');
const canvas = root?.querySelector<HTMLCanvasElement>('[data-constellation-canvas]');
const tip = root?.querySelector<HTMLElement>('[data-constellation-tip]');
const payloadEl = document.querySelector<HTMLElement>('[data-constellation-payload]');

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

if (root && canvas && payloadEl) {
  const ctx = canvas.getContext('2d')!;
  const data = JSON.parse(payloadEl.textContent || '{}') as Payload;

  let W = 0;
  let H = 0;
  let dpr = Math.min(devicePixelRatio || 1, 2);

  const colors = {
    text: '#fff',
    line: 'rgba(255,255,255,.1)',
    accent: '#79c6e4',
    bg: '#0a0b0d',
    cat: {} as Record<string, string>,
  };

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const hsl = (v: string) => {
      const raw = cs.getPropertyValue(v).trim();
      return raw ? `hsl(${raw})` : '#888';
    };
    colors.text = cs.getPropertyValue('--text').trim() || '#fff';
    colors.line = cs.getPropertyValue('--line').trim() || 'rgba(255,255,255,.1)';
    colors.accent = cs.getPropertyValue('--accent').trim() || '#79c6e4';
    colors.bg = cs.getPropertyValue('--bg').trim() || '#0a0b0d';
    for (const [cat, varName] of Object.entries(CAT_VAR)) colors.cat[cat] = hsl(varName);
  }
  readColors();

  // ---- build sim nodes ------------------------------------------------------
  const nodes: SimNode[] = data.nodes.map((n, i) => {
    const isHub = n.id === data.hub;
    const angle = (i / data.nodes.length) * Math.PI * 2;
    return {
      ...n,
      isHub,
      fixed: false,
      r: isHub ? 15 : 4 + n.weight * 1.5,
      x: Math.cos(angle) * 120 * Math.random(),
      y: Math.sin(angle) * 120 * Math.random(),
      vx: 0,
      vy: 0,
    };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const links = data.links
    .map((l) => ({ s: byId.get(l.source), t: byId.get(l.target), strength: l.strength }))
    .filter((l) => l.s && l.t) as { s: SimNode; t: SimNode; strength: number }[];

  const neighbors = new Map<string, Set<string>>();
  for (const l of links) {
    if (!neighbors.has(l.s.id)) neighbors.set(l.s.id, new Set());
    if (!neighbors.has(l.t.id)) neighbors.set(l.t.id, new Set());
    neighbors.get(l.s.id)!.add(l.t.id);
    neighbors.get(l.t.id)!.add(l.s.id);
  }

  // ---- interaction state ----------------------------------------------------
  const pointer = { x: -9999, y: -9999, active: false };
  let hovered: SimNode | null = null;
  let dragging: SimNode | null = null;
  let alpha = 1;

  function size() {
    const rect = root!.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas!.width = W * dpr;
    canvas!.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  size();

  // ---- physics --------------------------------------------------------------
  function step() {
    const cx = W / 2;
    const cy = H / 2;
    // repulsion (O(n^2), n is tiny here)
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        const d2 = dx * dx + dy * dy || 0.01;
        const min = (a.r + b.r + 30) ** 2;
        if (d2 < 90000) {
          const force = (d2 < min ? 1400 : 900) / d2;
          const d = Math.sqrt(d2);
          dx /= d;
          dy /= d;
          a.vx += dx * force;
          a.vy += dy * force;
          b.vx -= dx * force;
          b.vy -= dy * force;
        }
      }
    }
    // springs
    for (const l of links) {
      const rest = l.s.isHub || l.t.isHub ? 120 : 90 + (10 - l.strength) * 6;
      let dx = l.t.x - l.s.x;
      let dy = l.t.y - l.s.y;
      const d = Math.hypot(dx, dy) || 0.01;
      const f = (d - rest) * 0.015 * l.strength;
      dx /= d;
      dy /= d;
      l.s.vx += dx * f;
      l.s.vy += dy * f;
      l.t.vx -= dx * f;
      l.t.vy -= dy * f;
    }
    // gravity to centre + pointer repulsion + integrate
    for (const n of nodes) {
      n.vx += -n.x * 0.004 * (n.isHub ? 3 : 1);
      n.vy += -n.y * 0.004 * (n.isHub ? 3 : 1);

      if (pointer.active && n !== dragging) {
        const dx = n.x + cx - pointer.x;
        const dy = n.y + cy - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 14000 && d2 > 0.01) {
          const f = 1600 / d2;
          const d = Math.sqrt(d2);
          n.vx += (dx / d) * f;
          n.vy += (dy / d) * f;
        }
      }

      if (n === dragging) continue;
      n.vx *= 0.86;
      n.vy *= 0.86;
      n.x += n.vx * alpha;
      n.y += n.vy * alpha;
    }
  }

  // ---- render ---------------------------------------------------------------
  function draw() {
    const cx = W / 2;
    const cy = H / 2;
    ctx.clearRect(0, 0, W, H);

    const hoveredNeighbors = hovered ? neighbors.get(hovered.id) : null;
    const dim = (id: string) =>
      hovered ? (id === hovered.id || hoveredNeighbors?.has(id) ? 1 : 0.18) : 1;

    // links
    for (const l of links) {
      const active = hovered && (l.s.id === hovered.id || l.t.id === hovered.id);
      ctx.beginPath();
      ctx.moveTo(l.s.x + cx, l.s.y + cy);
      ctx.lineTo(l.t.x + cx, l.t.y + cy);
      ctx.strokeStyle = active ? colors.accent : colors.line;
      ctx.globalAlpha = active ? 0.7 : hovered ? 0.06 : 0.4;
      ctx.lineWidth = active ? 1.1 : 0.6;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // nodes
    for (const n of nodes) {
      const px = n.x + cx;
      const py = n.y + cy;
      const col = n.isHub ? colors.accent : colors.cat[n.category] || colors.text;
      const a = dim(n.id);
      const isFocus = hovered === n;

      // glow on hub / focus
      if (n.isHub || isFocus) {
        ctx.beginPath();
        ctx.arc(px, py, n.r + 9, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.12 * a;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(px, py, n.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.globalAlpha = a;
      ctx.fill();

      if (n.isHub) {
        ctx.beginPath();
        ctx.arc(px, py, n.r + 5, 0, Math.PI * 2);
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.4;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // labels: hub always, others on focus / large
      if (n.isHub || isFocus || n.weight >= 8) {
        ctx.globalAlpha = isFocus || n.isHub ? a : 0.5 * a;
        ctx.fillStyle = colors.text;
        ctx.font = `${n.isHub ? 600 : 500} ${n.isHub ? 13 : 11}px "Geist Variable", system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(n.isHub ? n.label : n.label.replace(/[_-]/g, ' '), px, py + n.r + 6);
      }
      ctx.globalAlpha = 1;
    }
  }

  // ---- loop -----------------------------------------------------------------
  let raf = 0;
  let running = false;
  function frame() {
    if (alpha > 0.02) alpha *= 0.992;
    step();
    draw();
    raf = requestAnimationFrame(frame);
  }
  function start() {
    if (running || reduceMotion) return;
    running = true;
    frame();
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  if (reduceMotion) {
    // Settle to a static layout and paint once — no animation.
    for (let i = 0; i < 400; i++) step();
    draw();
  } else {
    // Animate immediately so the graph is always alive on load…
    start();
    // …and merely pause it while fully scrolled out of view (battery/perf).
    if ('IntersectionObserver' in window) {
      const vis = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) start();
            else stop();
          }
        },
        { threshold: 0 },
      );
      vis.observe(root);
    }
  }

  // ---- pointer --------------------------------------------------------------
  function pick(mx: number, my: number): SimNode | null {
    const cx = W / 2;
    const cy = H / 2;
    let best: SimNode | null = null;
    let bestD = Infinity;
    for (const n of nodes) {
      const dx = n.x + cx - mx;
      const dy = n.y + cy - my;
      const d = dx * dx + dy * dy;
      const hit = (n.r + 10) ** 2;
      if (d < hit && d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return best;
  }

  function moveTip(n: SimNode) {
    if (!tip) return;
    const cx = W / 2;
    const cy = H / 2;
    tip.style.transform = `translate(${n.x + cx}px, ${n.y + cy}px) translate(-50%, calc(-100% - 14px))`;
    tip.querySelector('.constellation__tip-cat')!.textContent = n.isHub
      ? 'profile'
      : n.category.replace('-', ' / ');
    tip.querySelector('.constellation__tip-name')!.textContent = n.label.replace(/[_-]/g, ' ');
    tip.querySelector('.constellation__tip-meta')!.textContent = n.isHub
      ? 'github.com/thonos-cpu'
      : `${n.language ?? '—'}${n.stars ? ` · ★ ${n.stars}` : ''}`;
    tip.hidden = false;
  }

  function pointerPos(e: PointerEvent) {
    const rect = canvas!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  canvas.addEventListener('pointermove', (e) => {
    const { x, y } = pointerPos(e);
    pointer.x = x;
    pointer.y = y;
    pointer.active = true;
    if (dragging) {
      dragging.x = x - W / 2;
      dragging.y = y - H / 2;
      dragging.vx = dragging.vy = 0;
      alpha = Math.max(alpha, 0.6);
      moveTip(dragging);
      return;
    }
    const hit = pick(x, y);
    hovered = hit;
    canvas!.style.cursor = hit ? 'pointer' : 'grab';
    if (hit) moveTip(hit);
    else if (tip) tip.hidden = true;
    if (reduceMotion) draw();
  });

  canvas.addEventListener('pointerdown', (e) => {
    const { x, y } = pointerPos(e);
    const hit = pick(x, y);
    if (hit) {
      dragging = hit;
      dragging.fixed = true;
      canvas!.setPointerCapture(e.pointerId);
    }
  });

  canvas.addEventListener('pointerup', (e) => {
    if (dragging) {
      // A clean click (no real drag) opens the repo.
      const moved = Math.hypot(dragging.vx, dragging.vy);
      const target = dragging;
      dragging = null;
      if (moved < 0.5 && !target.isHub && target.url) {
        window.open(target.url, '_blank', 'noopener');
      }
      canvas!.releasePointerCapture?.(e.pointerId);
    }
  });

  canvas.addEventListener('pointerleave', () => {
    pointer.active = false;
    pointer.x = pointer.y = -9999;
    hovered = null;
    if (tip) tip.hidden = true;
    if (reduceMotion) draw();
  });

  // ---- resize / theme -------------------------------------------------------
  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = window.setTimeout(() => {
      size();
      alpha = Math.max(alpha, 0.4);
      if (reduceMotion) draw();
    }, 150);
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('themechange', () => {
    readColors();
    if (reduceMotion) draw();
  });
}
