"use client";

import { ChevronRight, Copy, Folder, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { projectDetails } from "@/lib/portfolio-data";
import type { Repository } from "@/lib/types";

const featured = [
  { name: "Distributed_Systems", title: "Distributed Hash Table", subtitle: "Chord routing, replication, consistent hashing", fact: "O(log N) routing" },
  { name: "TFIDF-Search-Engine", title: "TF-IDF Search Engine", subtitle: "1,239 medical documents, ranking and evaluation", fact: "MAP 0.2750" },
  { name: "quadtrees", title: "Spatial Indexing", subtitle: "R-Tree, Octree, MinHash + LSH", fact: "3D range queries" },
];

function ProjectDiagram({ kind }: { kind: number }) {
  if (kind === 0) return (
    <svg className="project-diagram" viewBox="0 0 220 90" role="img" aria-label="Chord ring routing diagram">
      <circle cx="110" cy="45" r="34" /><path d="M110 11c31 0 45 22 32 44-13 22-45 24-64 3" strokeDasharray="4 4" />
      <circle className="diagram-node" cx="110" cy="11" r="4" /><circle className="diagram-node" cx="144" cy="45" r="4" /><circle className="diagram-node" cx="110" cy="79" r="4" /><circle className="diagram-node" cx="76" cy="45" r="4" />
      <path className="diagram-signal" d="M78 42c14-22 38-25 61-5" /><path className="diagram-signal" d="m136 32 5 6-8 2" />
    </svg>
  );
  if (kind === 1) return (
    <svg className="project-diagram" viewBox="0 0 220 90" role="img" aria-label="TF-IDF retrieval pipeline diagram">
      <rect x="5" y="28" width="28" height="34" /><path d="M13 37h13M13 44h13M13 51h9M34 45h22M49 40l7 5-7 5" />
      <rect x="62" y="25" width="35" height="40" /><path d="M73 25v40M85 25v40M62 38h35M62 51h35M98 45h23M114 40l7 5-7 5" />
      <circle cx="143" cy="45" r="18" /><path d="M130 45h26M143 32v26M162 45h24M179 40l7 5-7 5" />
      <path className="diagram-signal" d="M193 30h22v30h-22zM198 39h12M198 46h12M198 53h8" />
    </svg>
  );
  return (
    <svg className="project-diagram" viewBox="0 0 220 90" role="img" aria-label="R-Tree and Octree spatial partition diagram">
      <rect x="10" y="13" width="72" height="64" /><rect x="18" y="22" width="29" height="24" /><rect x="45" y="37" width="28" height="31" />
      <circle className="diagram-node" cx="29" cy="34" r="3" /><circle className="diagram-node" cx="60" cy="51" r="3" /><circle className="diagram-node" cx="27" cy="63" r="3" />
      <path d="M117 23h58v52h-58zM117 23l18-12h58l-18 12M175 23l18-12v52l-18 12M146 17v52M117 49h58M135 11v52" />
      <circle className="diagram-signal" cx="146" cy="38" r="3" /><circle className="diagram-signal" cx="169" cy="61" r="3" />
    </svg>
  );
}

function fallbackReadme(repo: Repository): string {
  return projectDetails[repo.name]?.readme
    || `${repo.name}\n\n${repo.description || "A public repository by Athanasios Tasis."}\n\nLanguage: ${repo.language || "Mixed"}\nClone: ${repo.cloneUrl}`;
}

export function WorkArchive({ repositories }: { repositories: Repository[] }) {
  const initial = repositories.find((repo) => repo.name === "TFIDF-Search-Engine") || repositories[0];
  const [selected, setSelected] = useState<Repository>(initial);
  const [query, setQuery] = useState("");
  const [readme, setReadme] = useState(() => fallbackReadme(initial));
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const filtered = useMemo(() => {
    const needle = deferredQuery.trim().toLowerCase();
    if (!needle) return repositories;
    return repositories.filter((repo) => `${repo.name} ${repo.description || ""} ${repo.language || ""}`.toLowerCase().includes(needle));
  }, [deferredQuery, repositories]);

  async function choose(repo: Repository) {
    setSelected(repo);
    setReadme(fallbackReadme(repo));
    setLoading(true);
    document.querySelector("#repository-archive")?.scrollIntoView({ behavior: "smooth", block: "start" });
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repo.name)}`);
      if (response.ok) {
        const data = await response.json() as { readme?: string };
        if (data.readme) setReadme(data.readme);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyClone() {
    await navigator.clipboard.writeText(selected.cloneUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <section className="paper-section" id="work" aria-labelledby="work-title">
        <div className="shell work">
          <div className="work-layout">
            <h2 className="section-title" id="work-title">Selected systems</h2>
            <div>
              {featured.map((project, index) => {
                const repo = repositories.find((item) => item.name === project.name) || initial;
                return (
                  <article className="project-row" key={project.name}>
                    <div className="project-index">0{index + 1}</div>
                    <div>
                      <h3 className="project-name">{project.title}</h3>
                      <p className="project-sub">{project.subtitle}</p>
                      <p className="project-sub signal">{project.fact}</p>
                    </div>
                    <ProjectDiagram kind={index} />
                    <button className="project-action" type="button" onClick={() => choose(repo)}>Open case file →</button>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section id="repository-archive" aria-labelledby="archive-title">
        <div className="shell archive">
          <div className="archive-head">
            <h2 id="archive-title">Repository archive</h2>
            <p>Every public project opens here—README, technical context, and clone command included. No trip to another tab required.</p>
          </div>
          <div className="archive-panel">
            <aside className="repo-sidebar" aria-label="Repository list">
              <label className="repo-search-wrap">
                <Search size={16} aria-hidden="true" />
                <span className="sr-only">Search repositories</span>
                <input className="repo-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search repositories" />
              </label>
              <div className="repo-list">
                {filtered.map((repo) => (
                  <button key={repo.id} type="button" className={`repo-item ${repo.id === selected.id ? "active" : ""}`} onClick={() => choose(repo)} aria-pressed={repo.id === selected.id}>
                    <Folder size={15} aria-hidden="true" />
                    <span className="repo-name">{repo.name}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                  </button>
                ))}
              </div>
            </aside>
            <article className="repo-detail" aria-live="polite">
              <h3>{selected.name}</h3>
              <div className="repo-meta">
                <span>{selected.language || "Mixed stack"}</span>
                <span>{selected.stars} stars</span>
                <span>{selected.forks} forks</span>
                <span>Updated {new Date(selected.updatedAt).toLocaleDateString("en-GB", { year: "numeric", month: "short" })}</span>
              </div>
              <div className="clone-line">
                <code>git clone {selected.cloneUrl}</code>
                <button className="icon-button" type="button" onClick={copyClone} aria-label={copied ? "Clone command copied" : "Copy clone command"} title="Copy clone command"><Copy size={16} /></button>
              </div>
              <div className="readme-label">README {loading ? "· loading live copy" : ""}</div>
              <pre className="readme">{readme}</pre>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
