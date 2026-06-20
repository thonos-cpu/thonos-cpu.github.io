import { noStoreJson, consumeRateLimit, storeSensitiveLog } from "@/lib/server-security";

export const runtime = "nodejs";
export const maxDuration = 10;

const allowedTopics = /athanasios|thanos|tasis|experience|education|university|patras|gsi|alice|intern|work|skill|project|repo|github|clone|tf.?idf|distributed|dht|chord|tree|spatial|hotel|vehicle|contact|email|linkedin|hpc|root|data|ai|machine learning|software|language|python|c\+\+/i;
const blockedIntent = /write (me )?code|solve (this|my)|homework|essay|ignore (all|your|previous)|system prompt|jailbreak|roleplay|politic|medical advice|legal advice|financial advice|harm|weapon|malware/i;

function answerFor(message: string): string {
  const value = message.toLowerCase();
  if (/clone/.test(value)) return "Use the Copy clone command button in the repository archive. The general command is: git clone https://github.com/thonos-cpu/REPOSITORY_NAME.git";
  if (/education|university|study/.test(value)) return "Athanasios is completing an MEng in Computer Engineering & Informatics at the University of Patras (2021–2027).";
  if (/experience|intern|gsi|alice|work/.test(value)) return "Since 2026, Athanasios has worked as a Data Analysis Intern with the ALICE Collaboration at GSI Helmholtz Centre, processing detector data with ROOT and RDataFrame in HPC environments.";
  if (/tf.?idf|search engine/.test(value)) return "The TF-IDF project ranks 1,239 medical documents using custom weighting, cosine similarity, clustering, and evaluation with Precision, Recall, F1, and MAP.";
  if (/distributed|dht|chord/.test(value)) return "His distributed-systems project is a Chord-inspired key-value store exploring O(log N) routing, consistent hashing, replication, and multiprocessing ingestion.";
  if (/repo|github|project/.test(value)) return "His featured repositories cover distributed systems, medical-document retrieval, spatial indexing, data analysis, and software engineering. They can be inspected and cloned inside this site.";
  if (/contact|email|linkedin/.test(value)) return "You can reach Athanasios at athanasios@tasis.info or through github.com/thonos-cpu.";
  return "I can help with Athanasios’s experience, education, skills, repositories, project details, contact information, or clone instructions.";
}

export async function POST(request: Request) {
  try {
    if (!await consumeRateLimit(request, "chat", 10, 60)) return noStoreJson({ error: "Question limit reached. Try again shortly." }, 429);
    const body = await request.json().catch(() => null) as { message?: unknown; sessionId?: unknown } | null;
    const question = typeof body?.message === "string" ? body.message.trim().slice(0, 320) : "";
    if (question.length < 2) return noStoreJson({ error: "Please ask one short question." }, 400);
    const refused = !allowedTopics.test(question) || blockedIntent.test(question);
    const answer = refused
      ? "I’m scoped to Athanasios—his experience, education, skills, repositories, and how to use or clone them."
      : answerFor(question);
    await storeSensitiveLog({
      sessionId: typeof body?.sessionId === "string" ? body.sessionId : null,
      kind: "gpt",
      payload: { question, answer },
      metadata: { outcome: refused ? "refused" : "answered", engine: "deterministic-portfolio" },
    });
    return noStoreJson({ answer });
  } catch (error) {
    console.error("chat_failed", error);
    return noStoreJson({ error: "ThanosGPT is unavailable right now." }, 503);
  }
}
