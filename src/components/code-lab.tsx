"use client";

import { Play } from "lucide-react";
import { useCallback, useState } from "react";

import { Turnstile } from "@/components/turnstile";
import { analyticsSessionId } from "@/lib/analytics-client";

const languages = [
  ["python", "Python", "print(\"Hello from Athanasios's Code Lab\")\n\nvalues = [3, 8, 13, 21]\nprint(\"sum:\", sum(values))"],
  ["javascript", "JavaScript", "const values = [3, 8, 13, 21];\nconsole.log('sum:', values.reduce((a, b) => a + b, 0));"],
  ["typescript", "TypeScript", "const values: number[] = [3, 8, 13, 21];\nconsole.log('sum:', values.reduce((a, b) => a + b, 0));"],
  ["java", "Java", "class Main { public static void main(String[] args) { System.out.println(\"Hello from Java\"); } }"],
  ["c", "C", "#include <stdio.h>\nint main(void) { printf(\"Hello from C\\n\"); return 0; }"],
  ["cpp", "C++", "#include <iostream>\nint main() { std::cout << \"Hello from C++\\n\"; }"],
  ["rust", "Rust", "fn main() { println!(\"Hello from Rust\"); }"],
  ["go", "Go", "package main\nimport \"fmt\"\nfunc main() { fmt.Println(\"Hello from Go\") }"],
  ["csharp", "C#", "using System;\nclass Program { static void Main() { Console.WriteLine(\"Hello from C#\"); } }"],
  ["kotlin", "Kotlin", "fun main() { println(\"Hello from Kotlin\") }"],
  ["swift", "Swift", "print(\"Hello from Swift\")"],
  ["php", "PHP", "<?php\necho \"Hello from PHP\\n\";"],
  ["ruby", "Ruby", "puts 'Hello from Ruby'"],
  ["bash", "Bash", "values=(3 8 13 21)\nsum=0\nfor n in \"${values[@]}\"; do ((sum+=n)); done\necho \"sum: $sum\""],
  ["lua", "Lua", "local values = {3, 8, 13, 21}\nlocal sum = 0\nfor _, value in ipairs(values) do sum = sum + value end\nprint('sum:', sum)"],
] as const;

export function CodeLab() {
  const [language, setLanguage] = useState<string>(languages[0][0]);
  const [code, setCode] = useState<string>(languages[0][2]);
  const [output, setOutput] = useState("Ready. Choose a language, edit the source, then run it.");
  const [status, setStatus] = useState("Ready");
  const [running, setRunning] = useState(false);
  const [token, setToken] = useState("");

  const onToken = useCallback((value: string) => setToken(value), []);

  function changeLanguage(value: string) {
    const next = languages.find(([id]) => id === value) || languages[0];
    setLanguage(next[0]);
    setCode(next[2]);
    setOutput(`Ready to run ${next[1]}.`);
  }

  async function run() {
    setRunning(true);
    setStatus("Executing");
    setOutput("Compiling and running in an isolated sandbox…");
    const started = performance.now();
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-analytics-session": analyticsSessionId() },
        body: JSON.stringify({ language, code, turnstileToken: token }),
      });
      const data = await response.json() as { output?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "Execution failed");
      setOutput(data.output || "Program completed without output.");
      setStatus(`Done · ${Math.round(performance.now() - started)} ms`);
    } catch (error) {
      setOutput(error instanceof Error ? error.message : "Execution failed");
      setStatus("Error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <section className="shell lab" id="lab" aria-labelledby="lab-title">
      <div className="lab-head">
        <h2 id="lab-title">Code Lab</h2>
        <p>Run real code in 15 languages. Source is sent only when you press Run, then executed by an isolated Piston worker.</p>
      </div>
      <div className="tool-frame">
        <div className="tool-bar">
          <div className="tool-title">LAB_01 / WEB COMPILER</div>
          <div className="tool-controls">
            <label>
              <span className="sr-only">Programming language</span>
              <select className="select" value={language} onChange={(event) => changeLanguage(event.target.value)}>
                {languages.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
              </select>
            </label>
            <button className="button button-primary" type="button" onClick={run} disabled={running || (Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) && !token)}><Play size={15} fill="currentColor" /> {running ? "Running" : "Run"}</button>
          </div>
        </div>
        <Turnstile onToken={onToken} />
        <p className="submission-notice">Submitted source is redacted for common secrets, encrypted, and retained for abuse review. Do not paste private or proprietary code. <a href="/privacy">Privacy details</a>.</p>
        <div className="editor-grid">
          <textarea className="code-editor" value={code} onChange={(event) => setCode(event.target.value)} spellCheck={false} aria-label="Source code" />
          <div className="output-wrap">
            <div className="output-label">Output</div>
            <pre className="output" aria-live="polite">{output}</pre>
          </div>
        </div>
        <div className="tool-status"><span>Language: {languages.find(([id]) => id === language)?.[1]}</span><span>Timeout: 5s</span><span>Source limit: 20KB</span><span>Status: <b className="signal">{status}</b></span></div>
      </div>
    </section>
  );
}
