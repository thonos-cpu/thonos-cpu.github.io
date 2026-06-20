import { readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const roots = ["src", "supabase", "next.config.ts", ".env.example", "README.md", "SECURITY.md"];
const forbidden = [
  ["cloud", "flare"].join(""),
  ["turn", "stile"].join(""),
  ["open", "ai"].join(""),
  ["pis", "ton"].join(""),
  ["anthro", "pic"].join(""),
  ["fire", "base"].join(""),
  ["sen", "try"].join(""),
];
const extensions = new Set([".ts", ".tsx", ".js", ".mjs", ".md", ".css"]);

async function filesAt(path) {
  const entries = await readdir(path, { withFileTypes: true }).catch(() => null);
  if (!entries) return [path];
  const nested = await Promise.all(entries.map((entry) => filesAt(join(path, entry.name))));
  return nested.flat();
}

const files = (await Promise.all(roots.map(filesAt))).flat().filter((file) => extensions.has(extname(file)) || file.endsWith(".example"));
const violations = [];
for (const file of files) {
  const text = (await readFile(file, "utf8")).toLowerCase();
  for (const service of forbidden) if (text.includes(service)) violations.push(`${file}: ${service}`);
}
if (violations.length) {
  console.error(`Only Vercel, Supabase, and GitHub are allowed.\n${violations.join("\n")}`);
  process.exit(1);
}
console.log("Service boundary verified: Vercel + Supabase + GitHub only.");
