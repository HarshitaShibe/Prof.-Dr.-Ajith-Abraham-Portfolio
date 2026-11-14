import { useEffect } from 'react'
import research from '../data/research.json'
import metrics from '../data/metrics.json'
import funding from '../data/funding.json'
import home from '../data/home.json'
import ResearchNetwork from './researchnetwork'
import KeyPillars from './keypillars'
import MicroSlats from './MicroSlats'

/* ==========================================================================
   Research page: domains, impact in numbers, mentoring, current research and
   "Research Excellence & Influence". All text and numbers come from
   src/data/research.json (plus metrics.json, funding.json and home.json),
   so edit those files, not this component.
   ========================================================================== */

type Impact = { value: string; label: string }

const scholar = metrics.sources.find((s) => s.name === 'Google Scholar') ?? metrics.sources[0]
const hIndex = scholar.stats.find((s) => s.label === 'H-index')?.value ?? ''
const publications = (home.stats as { value: number; label: string }[]).find((s) => /publications/i.test(s.label))?.value
const books = (home.stats as { value: number; label: string }[]).find((s) => /books/i.test(s.label))?.value
const patents = (research as { impact?: { patents?: string } }).impact?.patents

const IMPACT: Impact[] = [
  publications ? { value: publications.toLocaleString('en-US'), label: 'Publications' } : null,
  { value: scholar.citations, label: 'Citations (Google Scholar)' },
  { value: hIndex, label: 'H-index' },
  patents ? { value: patents, label: 'Patents' } : null,
  { value: String(funding.projects.length), label: 'Funded research projects' },
  { value: '$110M+', label: 'Research funding led or co-led' },
  { value: String(research.phd.students.length), label: 'PhD students supervised' },
  books ? { value: String(books), label: 'Authored books' } : null,
].filter(Boolean) as Impact[]

const POSTDOCS = (research as { postdocs?: { name: string; detail?: string }[] }).postdocs ?? []

const CSS = `
.rs-wrap {
  min-height: 100svh; box-sizing: border-box; background: #EEF4FA; color: #24476B;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.rs-wrap section { padding: 44px 30px; box-sizing: border-box; }
@media (min-width: 640px) { .rs-wrap section { padding: 60px 56px; } }
.rs-in { max-width: 1100px; margin: 0 auto; }

.rs-hero { position: relative; overflow: hidden; min-height: 100svh; display: flex; align-items: center; background: #EEF4FA;
  padding-top: 120px !important; padding-bottom: 80px !important; }
.rs-slats { position: absolute; inset: 0; z-index: 0; }
.rs-hero .rs-in { position: relative; z-index: 1; width: 100%; text-align: center; }
.rs-hero .rs-lede { margin-left: auto; margin-right: auto; }
.rs-hero .rs-title { color: #24476B; }
.rs-hero .rs-lede { color: #3a5a7a; }
.rs-title { margin: 0; font-size: clamp(2.4rem, 6vw, 4rem); font-weight: 500; line-height: 1.05; letter-spacing: -.04em; color: #24476B; }
.rs-lede { margin: 18px 0 0; max-width: 46rem; font-size: clamp(.95rem, 1.5vw, 1.1rem); font-weight: 300; line-height: 1.7; color: #3a5a7a; }

.rs-h2 { margin: 0 0 32px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.rs-asof { margin: -18px 0 28px; font-size: .85rem; font-weight: 300; color: #5b7893; }

.rs-glass {
  background: #fff; border: 1px solid #DCE8F1; border-radius: 20px; box-sizing: border-box;
  box-shadow: 0 8px 24px -14px rgba(36,71,107,.28);
}

.rs-doms { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .rs-doms { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1000px) { .rs-doms { grid-template-columns: repeat(3, 1fr); } }
.rs-dom { padding: 24px; display: flex; flex-direction: column; gap: 10px; }
.rs-dom h3 { margin: 0; font-size: 1.1rem; font-weight: 600; letter-spacing: -.02em; color: #24476B; }
.rs-dom p { margin: 0; font-size: .9rem; font-weight: 300; line-height: 1.65; color: #3a5a7a; }

.rs-imp { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (min-width: 760px) { .rs-imp { grid-template-columns: repeat(4, 1fr); gap: 18px; } }
.rs-stat { padding: 22px 16px; text-align: center; }
.rs-num { display: block; font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 500; letter-spacing: -.02em; color: #24476B; }
.rs-lab { display: block; margin-top: 6px; font-size: .8rem; font-weight: 300; line-height: 1.4; color: #5b7893; }

.rs-two { display: grid; gap: 20px; grid-template-columns: 1fr; }
@media (min-width: 900px) { .rs-two { grid-template-columns: 1fr 1fr; } }
.rs-box { padding: 26px 24px; }
.rs-box h3 { margin: 0 0 6px; font-size: 1.15rem; font-weight: 600; letter-spacing: -.02em; }
.rs-note { margin: 0 0 16px; font-size: .84rem; font-weight: 300; color: #5b7893; }
.rs-ppl { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 2px 24px; }
@media (min-width: 480px) { .rs-ppl { grid-template-columns: 1fr 1fr; } }
.rs-ppl li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #DCE8F1; font-size: .9rem; font-weight: 400; color: #24476B; }
.rs-ppl li span { color: #4A86C8; font-weight: 300; flex-shrink: 0; }
.rs-ppl.rs-ppl-stack { grid-template-columns: 1fr !important; }
.rs-ppl-stack li { flex-direction: column; gap: 2px; }
.rs-ppl-stack li span { font-size: .82rem; }

.rs-prose { max-width: 52rem; }
.rs-prose p { margin: 0 0 18px; font-size: .98rem; font-weight: 300; line-height: 1.8; color: #2f4f6e; }
@media (max-width: 639px) { .rs-prose p { font-size: .9rem; line-height: 1.75; } .rs-dom p { font-size: .9rem; } }

.rs-links { display: flex; flex-wrap: wrap; gap: 12px; padding-bottom: 90px !important; }
.rs-link { display: inline-flex; align-items: center; gap: 8px; height: 44px; padding: 0 20px; border-radius: 999px; background: #24476B; color: #fff;
  font-size: .86rem; font-weight: 600; text-decoration: none; transition: background .25s; }
.rs-link:hover { background: #1b3652; }
.rs-link:focus-visible { outline: 2px solid #4A86C8; outline-offset: 2px; }

/* Key Pillars (shared with the landing page) on this light page */
.rs-wrap .kp-title { color: #24476B; }
.rs-wrap .kp-card { background: #fff; border: 1px solid #DCE8F1; box-shadow: 0 8px 24px -14px rgba(36,71,107,.28); }
`

export default function ResearchOverview() {
  useEffect(() => {
    document.documentElement.classList.add('on-research-overview')
    return () => document.documentElement.classList.remove('on-research-overview')
  }, [])

  return (
    <main id="research-overview" className="rs-wrap" aria-labelledby="rs-title">
      <style>{CSS}</style>

      <section className="rs-hero">
        <div className="rs-slats" aria-hidden="true">
          <MicroSlats
            preset="swell"
            color="#BBD6EC"
            glintColor="#7FB0DB"
            backgroundColor="#EEF4FA"
            slatWidth={10}
            slatHeight={25}
            gap={3}
            roundness={0.75}
            interactive
            cursorStrength={1}
            cursorSize={40}
            trail={1.4}
            fog={0}
            contrast={0.9}
            glint={0.4}
            intro
          />
        </div>
        <div className="rs-in">
          <h1 id="rs-title" className="rs-title">Research</h1>
          <p className="rs-lede">{research.intro}</p>
        </div>
      </section>

      <section aria-labelledby="rs-dom-h">
        <div className="rs-in">
          <h2 id="rs-dom-h" className="rs-h2">Research Domains</h2>
          <ul className="rs-doms">
            {research.domains.map((d) => (
              <li key={d.name} className="rs-glass rs-dom">
                <h3>{d.name}</h3>
                <p>{d.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="rs-imp-h">
        <div className="rs-in">
          <h2 id="rs-imp-h" className="rs-h2">Research Impact</h2>
          <p className="rs-asof">Summary in numbers, as of {research.asOf}</p>
          <ul className="rs-imp">
            {IMPACT.map((s) => (
              <li key={s.label} className="rs-glass rs-stat">
                <span className="rs-num">{s.value}</span>
                <span className="rs-lab">{s.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <KeyPillars />

      <section aria-labelledby="rs-men-h">
        <div className="rs-in">
          <h2 id="rs-men-h" className="rs-h2">Mentoring</h2>
          <div className="rs-two">
            {POSTDOCS.length > 0 && (
              <div className="rs-glass rs-box">
                <h3>Post Doctoral Fellows</h3>
                <p className="rs-note">Researchers who worked with him after their doctorate.</p>
                <ul className="rs-ppl rs-ppl-stack">
                  {POSTDOCS.map((p) => (
                    <li key={p.name}>{p.name}{p.detail ? <span>{p.detail}</span> : null}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rs-glass rs-box" style={POSTDOCS.length === 0 ? { gridColumn: '1 / -1' } : undefined}>
              <h3>{research.phd.title}</h3>
              <p className="rs-note">{research.phd.note}</p>
              <ul className="rs-ppl">
                {research.phd.students.map((s) => (
                  <li key={s.name}>{s.name}<span>{s.year}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="rs-cur-h">
        <div className="rs-in">
          <h2 id="rs-cur-h" className="rs-h2">{research.currentResearchTitle}</h2>
          <div className="rs-prose">
            {research.currentResearch.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      <section aria-labelledby="rs-exc-h">
        <div className="rs-in">
          <h2 id="rs-exc-h" className="rs-h2">{research.excellenceTitle}</h2>
          <div className="rs-prose">
            {research.excellence.map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
      </section>

      <ResearchNetwork />

      <section className="rs-links">
        <div className="rs-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a className="rs-link" href="#funding">Research funding &amp; projects →</a>
          <a className="rs-link" href="#entrepreneurship">Entrepreneurship &amp; innovation →</a>
          <a className="rs-link" href="#mostcited">Most cited papers →</a>
          <a className="rs-link" href="#publications">All publications →</a>
        </div>
      </section>
    </main>
  )
}
