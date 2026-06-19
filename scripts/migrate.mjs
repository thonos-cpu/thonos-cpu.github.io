import { readFile } from "node:fs/promises";
import path from "node:path";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing. Add it to .env.local before running the migration.");
}

const schema = await readFile(path.join(process.cwd(), "database", "schema.sql"), "utf8");
const sql = postgres(process.env.DATABASE_URL, { max: 1, ssl: "require" });

try {
  await sql.unsafe(schema);
  console.log("Analytics schema is ready.");
} finally {
  await sql.end();
}
