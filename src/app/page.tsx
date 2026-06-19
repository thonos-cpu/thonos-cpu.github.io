import { ArrowDownToLine, ArrowRight } from "lucide-react";

import { CodeLab } from "@/components/code-lab";
import { Orbit } from "@/components/orbit";
import { ThanosGPT } from "@/components/thanos-gpt";
import { WorkArchive } from "@/components/work-archive";
import { getGitHubData } from "@/lib/github";

const capabilities = [
  ["Distributed Systems", "Scalable architecture, consistency, replication and fault tolerance."],
  ["Data Engineering", "Pipelines, transformation, analysis and production-grade data systems."],
  ["Scientific Computing", "ROOT, numerical analysis, time-series work and detector data."],
  ["HPC", "Slurm, Lustre, parallel processing and performance engineering."],
  ["AI / ML", "Information retrieval, ranking, clustering and ML foundations."],
];

export default async function HomePage() {
  const { repositories } = await getGitHubData();
  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
          <a className="mark" href="#top" aria-label="Athanasios Tasis, home">AT</a>
          <nav className="nav" aria-label="Primary navigation">
            <a href="#work">/work</a><a href="#lab">/lab</a><a href="#about">/about</a><a href="#thanosgpt">/ask-thanosgpt</a><a className="nav-contact" href="#contact">/contact →</a>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="shell hero" id="top" aria-labelledby="hero-title">
          <div className="hero-intro">
            <h1 className="hero-title" id="hero-title"><span>Athanasios</span><span>Tasis</span></h1>
            <p className="hero-copy">Software engineer building reliable systems from data, algorithms, and careful engineering.</p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">Explore the work <ArrowRight size={17} /></a>
              <a className="button" href="https://github.com/thonos-cpu/cv/blob/main/Athanasios_Tasis_CV_2026.pdf" target="_blank" rel="noreferrer">Download CV <ArrowDownToLine size={17} /></a>
            </div>
          </div>
          <Orbit />
        </section>

        <section className="shell experience" id="about" aria-label="Experience and education">
          <div className="section-label">Trajectory / 2021—now</div>
          <div className="timeline">
            <article className="timeline-row"><h3>ALICE Collaboration · GSI Helmholtz Centre</h3><p>Data Analysis Intern · 2026—Present · ROOT, RDataFrame, detector data and HPC workflows</p></article>
            <article className="timeline-row"><h3>University of Patras</h3><p>MEng Computer Engineering &amp; Informatics · 2021—2027</p></article>
          </div>
        </section>

        <WorkArchive repositories={repositories} />
        <CodeLab />
        <ThanosGPT />

        <section className="capabilities" aria-label="Capabilities">
          <div className="shell capability-grid">
            {capabilities.map(([title, description]) => <article className="capability" key={title}><h3>{title}</h3><p>{description}</p></article>)}
          </div>
        </section>

        <section className="shell contact" id="contact" aria-labelledby="contact-title">
          <h2 id="contact-title">Let’s build something that holds up<span className="signal">.</span></h2>
          <div className="contact-links">
            <a href="mailto:athanasios@tasis.info">athanasios@tasis.info</a>
            <a href="https://github.com/thonos-cpu" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://links.tasis.info/home" target="_blank" rel="noreferrer">Links</a>
            <a href="/privacy">Privacy</a>
          </div>
        </section>
      </main>
      <footer className="shell footer"><span>Athanasios Tasis · engineering observatory</span><span>© {new Date().getFullYear()} · First-party analytics · <a href="/privacy">Privacy controls</a></span></footer>
    </>
  );
}
