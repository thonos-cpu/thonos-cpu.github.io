/**
 * Client behaviour: smooth scroll, scroll-reveal, theme toggle and lightweight,
 * privacy-friendly engagement analytics (section views + scroll depth) reported
 * through GoatCounter events. All of it degrades gracefully and respects
 * prefers-reduced-motion.
 */
import Lenis from 'lenis';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ----------------------------------------------------------- smooth scroll */
let lenis: Lenis | null = null;
if (!reduceMotion) {
  lenis = new Lenis({ duration: 1.05, smoothWheel: true });
  const raf = (time: number) => {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);

  // Same-page hash links glide via Lenis; cross-page links (e.g. /#work from a
  // sub-page) fall through to normal navigation.
  document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]').forEach((a) => {
    const url = new URL(a.href, location.href);
    if (!url.hash || url.origin !== location.origin || url.pathname !== location.pathname) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      lenis?.scrollTo(target as HTMLElement, { offset: -80 });
      history.replaceState(null, '', url.hash);
    });
  });
}

/* ------------------------------------------------------------ scroll reveal */
const revealEls = document.querySelectorAll('[data-reveal]');
if ('IntersectionObserver' in window && revealEls.length) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add('is-in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-in'));
}

/* ------------------------------------------------------------- theme toggle */
const toggle = document.getElementById('theme-toggle');
toggle?.addEventListener('click', () => {
  const root = document.documentElement;
  const next = root.dataset.theme === 'light' ? 'dark' : 'light';
  root.dataset.theme = next;
  try {
    localStorage.setItem('theme', next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent('themechange', { detail: next }));
});

/* --------------------------------------------------------------- analytics */
type GC = { count: (o: { path: string; title?: string; event: boolean }) => void };
const gc = () => (window as unknown as { goatcounter?: GC }).goatcounter;

function track(path: string, title: string) {
  const api = gc();
  if (api && typeof api.count === 'function') api.count({ path, title, event: true });
}

// Section views — fired once per section, so the weekly report shows interest by area.
const sections = document.querySelectorAll<HTMLElement>('[data-section]');
if ('IntersectionObserver' in window && sections.length) {
  const seen = new Set<string>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.section!;
        if (entry.isIntersecting && !seen.has(id)) {
          seen.add(id);
          track(`section-${id}`, `Section: ${id}`);
        }
      }
    },
    { threshold: 0.4 },
  );
  sections.forEach((s) => io.observe(s));
}

// Scroll-depth milestones.
const milestones = [25, 50, 75, 100];
const fired = new Set<number>();
const onScroll = () => {
  const doc = document.documentElement;
  const scrolled = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
  for (const m of milestones) {
    if (scrolled >= m && !fired.has(m)) {
      fired.add(m);
      track(`scroll-${m}`, `Scroll depth ${m}%`);
    }
  }
};
window.addEventListener('scroll', onScroll, { passive: true });
