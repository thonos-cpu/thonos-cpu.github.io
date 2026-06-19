import Link from "next/link";

export default function NotFound() {
  return (
    <main className="shell contact">
      <h1>404<span className="signal">.</span></h1>
      <p className="hero-copy">This coordinate is outside the observatory.</p>
      <Link className="button button-primary" href="/">Return home</Link>
    </main>
  );
}
