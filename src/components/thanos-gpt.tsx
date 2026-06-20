"use client";

import { Send, ShieldCheck } from "lucide-react";
import { FormEvent, useState } from "react";

import { analyticsSessionId } from "@/lib/analytics-client";

const prompts = ["What is your experience?", "What is your education?", "Show your repositories.", "How can I clone a repository?"];

export function ThanosGPT() {
  const [question, setQuestion] = useState("What does the TF-IDF project do?");
  const [answer, setAnswer] = useState("It ranks 1,239 medical documents using custom TF-IDF, cosine similarity, clustering, and retrieval evaluation.");
  const [loading, setLoading] = useState(false);

  async function ask(event?: FormEvent) {
    event?.preventDefault();
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer("Checking the portfolio record…");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: question.trim(), sessionId: analyticsSessionId() }),
      });
      const data = await response.json() as { answer?: string; error?: string };
      if (!response.ok) throw new Error(data.error || "ThanosGPT is unavailable right now.");
      setAnswer(data.answer || "I could not find that in the portfolio record.");
    } catch (error) {
      setAnswer(error instanceof Error ? error.message : "ThanosGPT is unavailable right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="shell chat" id="thanosgpt" aria-labelledby="chat-title">
      <div className="chat-head">
        <div><h2 id="chat-title">ThanosGPT</h2><p>Ask about Athanasios, his work, education, or repositories.</p></div>
        <div className="guardrail-note"><ShieldCheck size={18} /><span>Grounded in public portfolio facts.<br />One question at a time.</span></div>
      </div>
      <div className="chat-frame">
        <p className="submission-notice light">Questions are encrypted and retained briefly for abuse review. Do not submit private information. <a href="/privacy">Privacy details</a>.</p>
        <form className="chat-form" onSubmit={ask}>
          <label className="sr-only" htmlFor="thanos-question">Question for ThanosGPT</label>
          <input id="thanos-question" className="chat-input" maxLength={320} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask about Athanasios…" />
          <button className="icon-button" type="submit" disabled={loading} aria-label="Ask ThanosGPT"><Send size={17} /></button>
        </form>
        <div className="chat-answer"><div className="chat-prompt">›_</div><p className="chat-response" aria-live="polite">{answer}</p></div>
        <div className="suggestions">
          {prompts.map((prompt) => <button type="button" className="suggestion" key={prompt} onClick={() => setQuestion(prompt)}>{prompt} ↵</button>)}
        </div>
      </div>
    </section>
  );
}
