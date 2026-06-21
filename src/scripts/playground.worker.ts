/**
 * Playground execution worker.
 *
 * Runs visitor code off the main thread so an infinite loop can be killed by the
 * page (which terminates this worker on timeout). Everything is client-side —
 * no API, no server. Heavy runtimes (Lua, SQLite) are dynamically imported only
 * when that language is actually run, and their WASM is self-hosted under
 * /playground/ (no third-party CDN).
 */
interface Msg {
  lang: 'javascript' | 'lua' | 'sql';
  code: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sqlPromise: Promise<any> | null = null;

function fmt(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

async function runJS(code: string, emit: (...a: unknown[]) => void) {
  const consoleShim = { log: emit, info: emit, warn: emit, error: emit, debug: emit };
  // Wrap in an async IIFE so top-level `await` and `return` work.
  const fn = new Function('console', `"use strict"; return (async () => {\n${code}\n})();`);
  const result = await fn(consoleShim);
  if (result !== undefined) emit(result);
}

async function runLua(code: string, emit: (...a: unknown[]) => void) {
  const { LuaFactory } = await import('wasmoon');
  const factory = new LuaFactory('/playground/glue.wasm');
  const lua = await factory.createEngine();
  try {
    lua.global.set('print', (...args: unknown[]) => emit(...args));
    await lua.doString(code);
  } finally {
    lua.global.close();
  }
}

async function runSQL(code: string, emit: (...a: unknown[]) => void) {
  const initSqlJs = (await import('sql.js')).default;
  if (!sqlPromise) {
    // Fetch the wasm ourselves and hand sql.js the bytes — more reliable than
    // locateFile inside a bundled ES-module worker.
    const wasmUrl = new URL('/playground/sql-wasm.wasm', self.location.origin).href;
    const wasmBinary = await (await fetch(wasmUrl)).arrayBuffer();
    sqlPromise = initSqlJs({ wasmBinary });
  }
  const SQL = await sqlPromise;
  const db = new SQL.Database();
  try {
    const res = db.exec(code);
    if (!res.length) {
      emit('(statement executed — no rows returned)');
      return;
    }
    for (const r of res) {
      emit(r.columns.join(' | '));
      emit(r.columns.map(() => '---').join(' | '));
      for (const row of r.values)
        emit(row.map((c: unknown) => (c === null ? 'NULL' : String(c))).join(' | '));
    }
  } finally {
    db.close();
  }
}

self.onmessage = async (e: MessageEvent<Msg>) => {
  const { lang, code } = e.data;
  const out: string[] = [];
  const emit = (...a: unknown[]) => out.push(a.map(fmt).join(' '));
  try {
    if (lang === 'javascript') await runJS(code, emit);
    else if (lang === 'lua') await runLua(code, emit);
    else if (lang === 'sql') await runSQL(code, emit);
    self.postMessage({ output: out.join('\n') });
  } catch (err) {
    self.postMessage({
      output: out.join('\n'),
      error: err instanceof Error ? err.message : String(err),
    });
  }
};
