import { useEffect, useState } from 'react'
import research from '../data/research.json'
import metrics from '../data/metrics.json'
import funding from '../data/funding.json'
import home from '../data/home.json'
import ResearchNetwork from './researchnetwork'
import ResearchInsights from './researchinsights'
import KeyPillars from './keypillars'
import MicroSlats from './MicroSlats'
import { BrandBadge } from './brandicons'
import scholarTop from '../data/scholar-top.json'

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

const DOM_GRAD: [string, string][] = [
  ['#3d6ba0', '#24476B'],
  ['#4A86C8', '#2f5887'],
  ['#5a93cf', '#356aa0'],
  ['#24476B', '#17304f'],
  ['#4A86C8', '#24476B'],
  ['#2f5887', '#16304f'],
  ['#5a93cf', '#2f5887'],
]
const DOM_SPAN = ['dom-xl', 'dom-sm', 'dom-sm', 'dom-sm', 'dom-sm', 'dom-md', 'dom-md']

function parseStat(v: string) {
  const m = v.match(/^([^\d]*)([\d,]+)(.*)$/)
  if (!m) return null
  return { prefix: m[1], target: parseInt(m[2].replace(/,/g, ''), 10), suffix: m[3] }
}

function StatNum({ prefix, target, suffix, active }: { prefix: string; target: number; suffix: string; active: boolean }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    if (!active) { setN(0); return }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(target); return }
    let raf = 0
    const t0 = performance.now()
    const dur = 850
    const tick = (t: number) => {
      const prog = Math.min(1, (t - t0) / dur)
      const eased = 1 - Math.pow(1 - prog, 3)
      setN(Math.round(eased * target))
      if (prog < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [active, target])
  return <>{prefix}{n.toLocaleString('en-US')}{suffix}</>
}

function FolderStat({ value, label }: Impact) {
  const [open, setOpen] = useState(false)
  const parsed = parseStat(value)
  return (
    <li>
      <button
        type="button"
        className="rs-folder"
        data-open={open ? '' : undefined}
        aria-expanded={open}
        aria-label={`${label}: ${value}`}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="rs-folder-paper" aria-hidden={!open}>
          {parsed ? <StatNum {...parsed} active={open} /> : value}
        </span>
        <span className="rs-folder-back" aria-hidden="true" />
        <span className="rs-folder-front" aria-hidden="true">
          <span className="rs-folder-label">{label}</span>
        </span>
      </button>
    </li>
  )
}

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
.rs-hero .rs-title span { color: #4A86C8; }
.rs-hero .rs-lede { color: #3a5a7a; }
.rs-title { margin: 0; font-size: clamp(2.4rem, 6vw, 5rem); font-weight: 500; line-height: 1.02; letter-spacing: -.045em; color: #24476B; }
.rs-hero .rs-lede { font-size: .98rem; font-weight: 400; line-height: 1.7; max-width: min(46rem, 100%); text-wrap: balance; margin: 18px auto 0; }
.rs-ctas { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 34px; }
.rs-btn { position: relative; display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 34px; padding: 0 14px; border-radius: 11px; font-size: .73rem; font-weight: 600; font-family: inherit; text-decoration: none; white-space: nowrap; color: #24476B; border: 1px solid #4A86C8; background: #fff; box-shadow: 0 8px 20px -14px rgba(18,36,60,.4); transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s, background .22s, border-color .22s; }
.rs-btn:hover { transform: translateY(-2px); background: #F4F9FE; border-color: #3F7CC0; box-shadow: 0 14px 26px -14px rgba(18,36,60,.5); }
@media (max-width: 639px) { .rs-title { font-size: 3.4rem; } .rs-ctas { gap: 14px 24px; } .rs-btn { height: auto; padding: 2px 0; border: 0; border-radius: 0; background: none; color: #24476B; font-size: .8rem; font-weight: 500; text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px; } .rs-btn:hover { background: none; } .rs-hero .rs-lede { font-size: .84rem; line-height: 1.7; max-width: 330px; } }
.rs-lede { margin: 18px 0 0; max-width: 46rem; font-size: clamp(.95rem, 1.5vw, 1.1rem); font-weight: 300; line-height: 1.7; color: #3a5a7a; }

.rs-h2 { margin: 0 0 32px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.rs-dark { background: #EEF4FA; }
.rs-dark .rs-h2 { color: #24476B; }
.rs-dark .rs-prose { max-width: none; }
.rs-dark .rs-prose p { font-size: .9rem; font-weight: 300; line-height: 1.7; letter-spacing: -.01em; text-align: justify; text-justify: inter-word; color: #2f4f6e; }
@media (max-width: 639px) { .rs-dark .rs-prose p { text-align: left; font-size: .9rem; line-height: 1.75; } }
.rs-asof { margin: -18px 0 28px; font-size: .85rem; font-weight: 300; color: #5b7893; }
.rs-h2-mid { text-align: center; }
.rs-imp-hint { margin: -24px 0 54px; text-align: left; font-size: .8rem; font-weight: 300; font-style: italic; letter-spacing: .01em; color: #6b86a3; font-synthesis: style; }

.rs-glass {
  background: #fff; border: 1px solid #DCE8F1; border-radius: 20px; box-sizing: border-box;
  box-shadow: 0 8px 24px -14px rgba(36,71,107,.28);
}

.rs-doms { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 700px) { .rs-doms { grid-template-columns: repeat(6, 1fr); gap: 18px; } }
.rs-dom { position: relative; overflow: hidden; border-radius: 24px; padding: 26px; display: flex; flex-direction: column; gap: 18px; min-height: 196px; transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s; }
.rs-dom--grad { color: #fff; box-shadow: 0 18px 40px -22px rgba(18,36,60,.75); }
.rs-dom--grad::before { content: ''; position: absolute; right: -40px; top: -40px; width: 150px; height: 150px; border-radius: 50%; background: rgba(255,255,255,.18); filter: blur(34px); pointer-events: none; }
.rs-dom:hover { transform: translateY(-4px); }
.rs-dom-body { margin-top: auto; }
.rs-dom h3 { margin: 0 0 18px; font-size: 1.3rem; font-weight: 600; letter-spacing: -.02em; }
.rs-dom p { margin: 0; font-size: .8rem; font-weight: 300; line-height: 1.6; text-align: justify; }
.rs-dom--grad p { color: rgba(255,255,255,.9); }
@media (min-width: 700px) {
  .rs-dom.dom-xl { grid-column: span 4; min-height: 232px; }
  .rs-dom.dom-sm { grid-column: span 2; }
  .rs-dom.dom-md { grid-column: span 3; }
  .rs-dom.dom-xl h3 { font-size: 2rem; }
  .rs-dom.dom-xl p { font-size: .88rem; max-width: 36rem; }
}

.rs-imp { list-style: none; margin: 0 auto; padding: 0; max-width: 940px; display: flex; flex-wrap: wrap; justify-content: center; gap: 52px 40px; }
.rs-folder { position: relative; width: 205px; height: 152px; margin: 20px 0 0; padding: 0; border: 0; background: none; cursor: pointer; font: inherit; -webkit-tap-highlight-color: transparent; }
.rs-folder-back { position: absolute; inset: 0; z-index: 0; border-radius: 15px; background: linear-gradient(160deg, #2f5887, #24476B); box-shadow: 0 16px 30px -18px rgba(18,36,60,.6); }
.rs-folder-back::before { content: ''; position: absolute; top: -15px; left: 0; width: 46%; height: 19px; border-radius: 10px 10px 0 0; background: inherit; }
.rs-folder-paper { position: absolute; left: 8%; right: 8%; bottom: 52px; z-index: 1; display: flex; align-items: flex-start; justify-content: center; height: 60%; padding-top: 14px; box-sizing: border-box; border-radius: 9px; background: #fff; color: #24476B; font-size: 1.75rem; font-weight: 600; letter-spacing: -.02em; font-variant-numeric: tabular-nums; box-shadow: 0 -6px 16px rgba(18,36,60,.18); opacity: 0; transform: translateY(18px); transition: transform .5s cubic-bezier(.23,1,.32,1), opacity .35s ease; }
.rs-folder-front { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2; display: flex; align-items: flex-end; justify-content: center; height: 72%; padding: 0 14px 16px; box-sizing: border-box; border-radius: 15px; background: linear-gradient(180deg, #4A86C8, #3d6ba0); color: #fff; box-shadow: 0 -8px 20px rgba(18,36,60,.28); transform: perspective(700px) rotateX(-14deg); transform-origin: 50% 100%; transition: transform .5s cubic-bezier(.23,1,.32,1), filter .25s ease; }
.rs-folder-label { font-size: .84rem; font-weight: 500; line-height: 1.3; text-align: center; text-wrap: balance; }
.rs-folder:hover .rs-folder-front { filter: brightness(1.05); }
.rs-folder[data-open] .rs-folder-front { transform: perspective(700px) rotateX(-52deg); }
.rs-folder[data-open] .rs-folder-paper { opacity: 1; transform: translateY(0); }
@media (prefers-reduced-motion: reduce) { .rs-folder-front, .rs-folder-paper { transition: opacity .2s ease; } }

.rs-two { display: flex; flex-direction: column; gap: 20px; align-items: stretch; }
@media (min-width: 900px) { .rs-two { flex-direction: row; align-items: stretch; } }
.rs-two .rs-box { min-width: 0; transition: flex-grow .55s cubic-bezier(.16,1,.3,1), box-shadow .4s ease; outline: none; }
@media (min-width: 900px) {
  .rs-two .rs-men-postdoc { flex: 2 1 0; }
  .rs-two .rs-men-phd { flex: 3 1 0; }
  .rs-two .rs-men-postdoc:hover, .rs-two .rs-men-postdoc:focus-within { flex-grow: 3.2; box-shadow: 0 20px 44px -18px rgba(36,71,107,.42); }
  .rs-two .rs-men-phd:hover, .rs-two .rs-men-phd:focus-within { flex-grow: 4.2; box-shadow: 0 20px 44px -18px rgba(36,71,107,.42); }
}
.rs-men-lede { margin: -18px 0 26px; font-size: .9rem; font-weight: 300; color: #5b7893; }
.rs-men-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
.rs-men-num { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 50px; height: 50px; border-radius: 50%; background: #24476B; color: #fff; font-size: 1.1rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.rs-men-ix { margin: 2px 0 6px; font-size: 1.05rem; font-weight: 600; letter-spacing: -.015em; color: #24476B; }
.rs-men-head .rs-note { margin: 0; text-wrap: balance; }
.rs-box { padding: 26px 24px; }
.rs-box h3 { margin: 0 0 6px; font-size: 1.15rem; font-weight: 600; letter-spacing: -.02em; }
.rs-note { margin: 0 0 16px; font-size: .84rem; font-weight: 300; color: #5b7893; }
.rs-ppl { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: 1fr; gap: 2px 24px; }
@media (min-width: 480px) { .rs-ppl { grid-template-columns: 1fr 1fr; } }
.rs-ppl li { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid #DCE8F1; font-size: .9rem; font-weight: 500; color: #24476B; }
.rs-ppl li span { color: #4A86C8; font-weight: 300; flex-shrink: 0; }
.rs-ppl.rs-ppl-stack { grid-template-columns: 1fr !important; }
.rs-ppl-stack li { flex-direction: column; gap: 2px; }
.rs-ppl-stack li span { font-size: .82rem; }

.rs-prose { max-width: 52rem; }
.rs-prose + .rs-prose { margin-top: 0; }
.rs-prose p { margin: 0 0 18px; font-size: clamp(.95rem, 1.5vw, 1.08rem); font-weight: 400; line-height: 1.7; color: #2f4d68; }
@media (max-width: 639px) { .rs-prose p { font-size: .9rem; line-height: 1.75; } }

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
          <h1 id="rs-title" className="rs-title">Research in Action</h1>
          <div className="rs-ctas">
            <a className="rs-btn" href={(scholarTop as { profileUrl: string }).profileUrl} target="_blank" rel="noopener noreferrer"><BrandBadge brand="scholar" size={20} />Google Scholar</a>
            <a className="rs-btn" href="https://www.scopus.com/authid/detail.uri?authorId=7202760099" target="_blank" rel="noopener noreferrer"><BrandBadge brand="scopus" size={20} />Scopus</a>
            <a className="rs-btn" href="https://www.webofscience.com/wos/author/record/A-1416-2008" target="_blank" rel="noopener noreferrer"><BrandBadge brand="wos" size={20} />Web of Science</a>
            <a className="rs-btn" href="https://orcid.org/0000-0002-0169-6738" target="_blank" rel="noopener noreferrer"><BrandBadge brand="orcid" size={20} />ORCID</a>
            <a className="rs-btn" href="/Ajith-Abraham-CV.pdf" download>Download CV (PDF)</a>
          </div>
          <p className="rs-lede">{research.intro}</p>
        </div>
      </section>

      <div className="rs-dark">
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
      </div>

      <section aria-labelledby="rs-imp-h">
        <div className="rs-in">
          <h2 id="rs-imp-h" className="rs-h2">Research Impact</h2>
          <p className="rs-imp-hint">Hover over a folder to reveal the figure inside.</p>
          <ul className="rs-imp">
            {IMPACT.map((s) => (
              <FolderStat key={s.label} value={s.value} label={s.label} />
            ))}
          </ul>
        </div>
      </section>

      <ResearchInsights />

      <section aria-labelledby="rs-dom-h">
        <div className="rs-in">
          <h2 id="rs-dom-h" className="rs-h2">Research Domains</h2>
          <ul className="rs-doms">
            {research.domains.map((d, i) => {
              const grad = DOM_GRAD[i % DOM_GRAD.length]
              const span = DOM_SPAN[i % DOM_SPAN.length]
              return (
                <li
                  key={d.name}
                  className={`rs-dom rs-dom--grad ${span}`}
                  style={{ background: `linear-gradient(145deg, ${grad[0]}, ${grad[1]})` }}
                >
                  <div className="rs-dom-body">
                    <h3>{d.name}</h3>
                    <p>{d.text}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      <KeyPillars />

      <section aria-labelledby="rs-men-h">
        <div className="rs-in">
          <h2 id="rs-men-h" className="rs-h2">Academic Mentorship</h2>
          <p className="rs-men-lede">A record of research mentorship and doctoral supervision.</p>
          <div className="rs-two">
            {POSTDOCS.length > 0 && (
              <div className="rs-glass rs-box rs-men-postdoc" tabIndex={0}>
                <header className="rs-men-head">
                  <div>
                    <p className="rs-men-ix">Postdoctoral Researchers</p>
                    <p className="rs-note">Former postdoctoral researchers mentored by him.</p>
                  </div>
                  <span className="rs-men-num">{POSTDOCS.length}</span>
                </header>
                <ul className="rs-ppl rs-ppl-stack">
                  {POSTDOCS.map((p) => (
                    <li key={p.name}>{p.name}{p.detail ? <span>{p.detail}</span> : null}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="rs-glass rs-box rs-men-phd" tabIndex={0} style={POSTDOCS.length === 0 ? { width: '100%' } : undefined}>
              <header className="rs-men-head">
                <div>
                  <p className="rs-men-ix">{research.phd.title}</p>
                  <p className="rs-note">{research.phd.note}</p>
                </div>
                <span className="rs-men-num">{research.phd.students.length}</span>
              </header>
              <ul className="rs-ppl">
                {research.phd.students.map((s) => (
                  <li key={s.name}>{s.name}<span>{s.year}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <ResearchNetwork />

      <section className="rs-links">
        <div className="rs-in" style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a className="rs-link" href="#funding">Explore research funding</a>
          <a className="rs-link" href="#entrepreneurship">Explore entrepreneurship</a>
          <a className="rs-link" href="#mostcited">Explore most cited papers</a>
          <a className="rs-link" href="#publications">Explore all publications</a>
        </div>
      </section>
    </main>
  )
}
