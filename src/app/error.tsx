"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="shell contact">
      <h1>That signal dropped<span className="signal">.</span></h1>
      <p className="hero-copy">The page hit an unexpected error. Nothing you entered was stored.</p>
      <button className="button button-primary" type="button" onClick={reset}>Try again</button>
    </main>
  );
}
