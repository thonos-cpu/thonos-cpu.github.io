import { consumeRateLimit, noStoreJson, storeSensitiveLog } from "@/lib/server-security";

export const runtime = "nodejs";
export const maxDuration = 45;

type Command = [string, string[]];
type Runtime = { file: string; commands: Command[] };
type SandboxInstance = {
  writeFiles(files: Array<{ path: string; content: Buffer }>): Promise<void>;
  runCommand(command: string, args: string[], options: { timeoutMs: number }): Promise<{
    exitCode: number;
    stdout(): Promise<string>;
    stderr(): Promise<string>;
  }>;
  stop(): Promise<unknown>;
};

const runtimes: Record<string, Runtime> = {
  python: { file: "main.py", commands: [["python3", ["main.py"]]] },
  javascript: { file: "main.js", commands: [["node", ["main.js"]]] },
  typescript: { file: "main.ts", commands: [["tsx", ["main.ts"]]] },
  java: { file: "Main.java", commands: [["javac", ["Main.java"]], ["java", ["Main"]]] },
  c: { file: "main.c", commands: [["gcc", ["main.c", "-O2", "-o", "main"]], ["./main", []]] },
  cpp: { file: "main.cpp", commands: [["g++", ["main.cpp", "-O2", "-o", "main"]], ["./main", []]] },
  rust: { file: "main.rs", commands: [["rustc", ["main.rs", "-O", "-o", "main"]], ["./main", []]] },
  go: { file: "main.go", commands: [["go", ["run", "main.go"]]] },
  csharp: { file: "Program.cs", commands: [["dotnet", ["new", "console", "--force", "--output", "app"]], ["cp", ["Program.cs", "app/Program.cs"]], ["dotnet", ["run", "--project", "app", "--no-restore"]]] },
  kotlin: { file: "Main.kt", commands: [["kotlinc", ["Main.kt", "-include-runtime", "-d", "main.jar"]], ["java", ["-jar", "main.jar"]]] },
  swift: { file: "main.swift", commands: [["swift", ["main.swift"]]] },
  php: { file: "main.php", commands: [["php", ["main.php"]]] },
  ruby: { file: "main.rb", commands: [["ruby", ["main.rb"]]] },
  bash: { file: "main.sh", commands: [["bash", ["main.sh"]]] },
  lua: { file: "main.lua", commands: [["lua", ["main.lua"]]] },
};

export async function POST(request: Request) {
  let sandbox: SandboxInstance | undefined;
  try {
    if (!await consumeRateLimit(request, "execute", 8, 60)) return noStoreJson({ error: "Execution limit reached. Try again shortly." }, 429);
    const body = await request.json().catch(() => null) as { language?: unknown; code?: unknown; sessionId?: unknown } | null;
    const language = typeof body?.language === "string" ? body.language : "";
    const code = typeof body?.code === "string" ? body.code : "";
    const selected = runtimes[language];
    if (!selected || !code || Buffer.byteLength(code, "utf8") > 20_000) return noStoreJson({ error: "Invalid execution request." }, 400);
    const snapshotId = process.env.VERCEL_SANDBOX_SNAPSHOT_ID;
    if (!snapshotId) return noStoreJson({ error: "The Vercel compiler snapshot has not been configured." }, 503);

    const moduleName = "@vercel/" + "sandbox";
    const { Sandbox } = await import(moduleName) as { Sandbox: { create(options: Record<string, unknown>): Promise<SandboxInstance> } };
    sandbox = await Sandbox.create({
      source: { type: "snapshot", snapshotId },
      persistent: false,
      timeout: 30_000,
      networkPolicy: "deny-all",
      resources: { vcpus: 1 },
    });
    await sandbox.writeFiles([{ path: selected.file, content: Buffer.from(code) }]);
    const chunks: string[] = [];
    let exitCode = 0;
    for (const [command, args] of selected.commands) {
      const result = await sandbox.runCommand(command, args, { timeoutMs: 7_000 });
      chunks.push(await result.stdout(), await result.stderr());
      exitCode = result.exitCode;
      if (exitCode !== 0) break;
    }
    const output = chunks.filter(Boolean).join("\n").slice(0, 12_000);
    await storeSensitiveLog({
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
      kind: "compiler",
      payload: { language, source: code },
      metadata: { sourceBytes: Buffer.byteLength(code, "utf8"), exitCode, executor: "vercel-sandbox" },
    });
    return noStoreJson({ output, exitCode });
  } catch (error) {
    console.error("execute_failed", error);
    return noStoreJson({ error: "The Vercel execution sandbox is unavailable right now." }, 502);
  } finally {
    if (sandbox) await sandbox.stop().catch(() => undefined);
  }
}
