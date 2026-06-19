import type { Metadata } from "next";
import Link from "next/link";

import { PrivacyControls } from "@/components/privacy-controls";

export const metadata: Metadata = { title: "Privacy", description: "How tasis.info stores first-party analytics and tool submissions." };

export default function PrivacyPage() {
  return (
    <main className="shell privacy-page" id="main">
      <header><Link href="/">AT</Link><span>Privacy &amp; data</span></header>
      <h1>Useful history, without pretending data is harmless.</h1>
      <p className="privacy-lead">This site uses a small first-party analytics system to understand traffic and improve the portfolio. Data is stored in Athanasios’s own database and is not sold or used for advertising.</p>
      <PrivacyControls />
      <section><h2>Anonymous visit history</h2><p>The site records page views, which long-page sections enter the viewport, approximate foreground time, device class, coarse country code when supplied by the host, and live activity within a two-minute window. Network address and user-agent are transformed into a one-way keyed hash; the raw values are not stored.</p></section>
      <section><h2>Compiler and ThanosGPT submissions</h2><p>When you deliberately submit code or a question, that content may be retained for abuse review and product improvement. Common API-key and password formats are redacted before the payload is encrypted with AES-256-GCM. Do not submit secrets, private source code, personal records, or anything you do not have permission to share.</p></section>
      <section><h2>Retention and access</h2><p>Anonymous analytics default to 730 days. GPT and compiler records default to 30 days. Only the authenticated administrator can view the dashboard or decrypt stored submissions. Retention can be shortened through server configuration.</p></section>
      <section><h2>Your choice</h2><p>Disabling anonymous analytics above stores the preference in your browser. Expensive tools still retain deliberately submitted content for security and abuse review; the disclosure appears next to each submission control.</p></section>
      <footer><a href="mailto:athanasios@tasis.info">Questions: athanasios@tasis.info</a><Link href="/">Return to portfolio</Link></footer>
    </main>
  );
}
