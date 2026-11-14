import { useEffect, useMemo, useState } from 'react'
import MagnetLines from './MagnetLines'
import top from '../data/scholar-top.json'
import cfg from '../data/research-trends.json'

/* ==========================================================================
   Research and Trends. Two views of Prof. Dr. Abraham's 20 most-cited papers
   (src/data/scholar-top.json, Google Scholar):
     1. Research domains: bubbles sized by citations, tap one to explore it.
     2. Trends: every paper on a timeline, filter by domain, three eras.
   How papers are grouped into domains and eras lives in
   src/data/research-trends.json; all numbers are computed from the papers.
   ========================================================================== */

type Paper = { id: string; title: string; authors: string; venue: string; year: number; citations: number }
type Domain = { key: string; name: string; blurb: string; topics: string[]; paperIds: string[] }
type Era = { label: string; from: number; to: number | null }

const PAPERS = top.items as Paper[]
const DOMAINS = cfg.domains as Domain[]
const ERAS = cfg.eras as Era[]
const BY_ID = new Map(PAPERS.map((p) => [p.id, p]))
const DOMAIN_OF = new Map<string, Domain>()
DOMAINS.forEach((d) => d.paperIds.forEach((id) => DOMAIN_OF.set(id, d)))

const fmt = (n: number) => n.toLocaleString('en-US')
const scholarLink = (id: string) => `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${top.scholarId}&citation_for_view=${top.scholarId}:${id}`
const retrieved = new Date(top.retrieved).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const titleCase = (s: string) => (s === s.toLowerCase() ? s.replace(/(^|[\s:(-])([a-z])/g, (_, a, b) => a + b.toUpperCase()) : s)

const stats = DOMAINS.map((d) => {
  const papers = d.paperIds.map((id) => BY_ID.get(id)).filter(Boolean) as Paper[]
  papers.sort((a, b) => b.citations - a.citations)
  return { ...d, papers, citations: papers.reduce((s, p) => s + p.citations, 0) }
}).sort((a, b) => b.citations - a.citations)

const PALETTE = ['#14305A', '#2B6CD4', '#3FA9F5', '#6C7BDB', '#8FD3F4']
const COLOR_OF = new Map(stats.map((s, i) => [s.key, PALETTE[i % PALETTE.length]]))
const LIGHT = new Set(stats.filter((_, i) => ['#3FA9F5', '#8FD3F4'].includes(PALETTE[i % PALETTE.length])).map((s) => s.key))
const TOTAL_CITES = PAPERS.reduce((s, p) => s + p.citations, 0)
const TOTAL_CITES_DOM = stats.reduce((s, d) => s + d.citations, 0)

/* ---- donut geometry ---- */
const DS = 420
const DR = 148
const DW = 46
const DC = 2 * Math.PI * DR
const GAP = 5
let acc = 0
const SEGS = stats.map((d) => {
  const share = d.citations / TOTAL_CITES_DOM
  const seg = { key: d.key, share, start: acc * DC, len: Math.max(0, share * DC - GAP) }
  acc += share
  return seg
})

/* ---- timeline geometry ---- */
const CW = 900
const CH = 400
const M = { l: 60, r: 28, t: 44, b: 44 }
const YEARS = PAPERS.map((p) => p.year)
const X0 = Math.min(...YEARS) - 1
const X1 = Math.max(...YEARS) + 1
const cites = PAPERS.map((p) => p.citations)
const Y0 = Math.floor(Math.min(...cites) / 200) * 200 - 0
const Y1 = Math.ceil(Math.max(...cites) / 200) * 200
const xAt = (y: number) => M.l + ((y - X0) / (X1 - X0)) * (CW - M.l - M.r)
const yAt = (c: number) => CH - M.b - ((c - Y0) / (Y1 - Y0)) * (CH - M.t - M.b)
const yTicks = Array.from({ length: Math.floor((Y1 - Y0) / 400) + 1 }, (_, i) => Y0 + i * 400)
const xTicks = Array.from({ length: Math.floor((X1 - X0) / 5) + 1 }, (_, i) => Math.ceil(X0 / 5) * 5 + i * 5).filter((y) => y >= X0 && y <= X1)
const LABELLED = new Set([...PAPERS].sort((a, b) => b.citations - a.citations).slice(0, 3).map((p) => p.id))

const shortTitle = (s: string) => {
  const head = titleCase(s).split(':')[0]
  if (head.length <= 40) return head
  const cut = head.slice(0, 40)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

const eraOf = (y: number) => ERAS.findIndex((e) => y >= e.from && (e.to === null || y <= e.to))
const eraRange = (e: Era) => `${e.from} – ${e.to ?? 'today'}`
const eraStats = ERAS.map((e, i) => {
  const papers = PAPERS.filter((p) => eraOf(p.year) === i)
  const byDomain = new Map<string, number>()
  papers.forEach((p) => { const d = DOMAIN_OF.get(p.id); if (d) byDomain.set(d.name, (byDomain.get(d.name) ?? 0) + 1) })
  const lead = [...byDomain.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2).map(([n]) => n)
  return { ...e, count: papers.length, citations: papers.reduce((s, p) => s + p.citations, 0), lead }
})

const CSS = `
.rt-wrap { position: relative; isolation: isolate; min-height: 100svh; color: #24476B; background: #EEF4FA;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.rt-wrap *, .rt-wrap *::before, .rt-wrap *::after { box-sizing: border-box; }
.rt-wrap :focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
.rt-in { max-width: 1100px; margin: 0 auto; }

.rt-hero { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; justify-content: center;
  min-height: 100vh; padding: 120px 30px; background: #24476B; color: #fff; text-align: center; }
@media (min-width: 640px) { .rt-hero { padding: 130px 56px; } }
.rt-rings { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; opacity: .45; }
.rt-hero-in { position: relative; z-index: 1; pointer-events: none; }
.rt-title { margin: 0; text-align: center; font-size: clamp(2rem, 4.6vw, 3.6rem); font-weight: 500; line-height: 1.02; letter-spacing: -.045em; color: #fff; }
.rt-lede { margin: 14px auto 0; max-width: 760px; font-size: .8rem; font-weight: 400; line-height: 1.65; color: rgba(255,255,255,.82); text-wrap: balance; }
.rt-tally { margin: 22px auto 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.rt-pill { padding: 6px 14px; border-radius: 999px; font-size: .74rem; font-weight: 500; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }

.rt-body { padding: 72px 30px 90px; text-align: left; }
@media (min-width: 640px) { .rt-body { padding: 96px 56px 110px; } }
.rt-sec + .rt-sec { margin-top: 180px; }
.rt-h2-c { text-align: center; font-weight: 700; font-style: italic; font-synthesis: style; }
.rt-eyebrow { margin: 0 0 12px; font-size: .74rem; font-weight: 500; letter-spacing: .02em; color: #3a5f86; }
.rt-h2 { margin: 0; color: #24476B; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; }
.rt-h2 span { color: #6b84a0; }
.rt-sub { margin: 16px auto 0; max-width: 760px; font-size: .9rem; line-height: 1.6; color: #2f4d68; text-align: center; text-wrap: balance; }

/* ---- domains ---- */
.rt-uni { margin-top: 44px; display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 820px) {
  .rt-canvas { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 12px 80px; padding: 28px 36px 18px; }
  .rt-canvas .rt-donut { margin: 0; width: 340px; flex: 0 0 340px; }
  .rt-canvas .rt-legend { margin: 0; width: 440px; flex: 0 0 440px; }
  .rt-canvas .rt-hint { flex: 0 0 100%; margin: 4px 0 0; text-align: center; }
  .rt-uni .rt-panel { display: grid; grid-template-columns: minmax(0, 1fr) 330px; grid-template-rows: repeat(3, max-content) 1fr auto; column-gap: 48px; }
  .rt-uni .rt-panel > * { grid-column: 1; }
  .rt-uni .rt-panel > .rt-nums { grid-column: 2; grid-row: 1 / span 4; align-self: center; margin: 0 !important; grid-template-columns: 1fr 1fr; }
  .rt-uni .rt-panel > .rt-topics { align-self: start; }
  .rt-list li:nth-child(odd):nth-last-child(2) { border-bottom: 0; padding-bottom: 0; }
  .rt-uni .rt-panel > .rt-list { grid-column: 1 / -1; grid-template-columns: 1fr 1fr; column-gap: 48px; margin-top: 28px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,.18); }
}
.rt-canvas { padding: 12px; }
.rt-canvas svg { display: block; width: 100%; height: auto; }
.rt-donut { display: block; width: 100%; max-width: 360px; margin: 6px auto 0; height: auto; }
.rt-seg { fill: none; cursor: pointer; outline: none; opacity: .9; transition: opacity .3s, stroke-width .35s cubic-bezier(.16,1,.3,1); }
.rt-seg:hover { opacity: 1; }
.rt-seg.is-on { opacity: 1; stroke-width: 58px; }
.rt-seg:focus-visible { stroke-dasharray: none; }
.rt-dc-n { font-size: 17px; font-weight: 500; fill: #24476B; text-anchor: middle; }
.rt-dc-v { font-size: 34px; font-weight: 600; letter-spacing: -.02em; fill: #24476B; text-anchor: middle; font-variant-numeric: tabular-nums; }
.rt-dc-s { font-size: 12px; font-weight: 400; fill: #3a5f86; text-anchor: middle; }
.rt-legend { list-style: none; margin: 14px 4px 4px; padding: 0; display: grid; gap: 4px; }
.rt-leg { display: grid; grid-template-columns: 12px 1fr auto auto; align-items: center; gap: 10px; width: 100%; padding: 9px 12px; border: 0; border-radius: 10px; background: transparent; color: #24476B; font: inherit; font-size: .82rem; text-align: left; cursor: pointer; transition: background .2s; }
.rt-leg:hover { background: #EEF4FA; }
.rt-leg[aria-pressed="true"] { background: #DCE8F1; font-weight: 600; }
.rt-leg i { width: 12px; height: 12px; border-radius: 50%; }
.rt-leg b { font-weight: 500; font-variant-numeric: tabular-nums; }
.rt-leg small { min-width: 38px; text-align: right; font-size: .74rem; color: #3a5f86; font-variant-numeric: tabular-nums; }
.rt-hint { margin: 8px 6px 2px; font-size: .74rem; color: #3a5f86; }

.rt-panel { display: flex; flex-direction: column; padding: 32px; border-top: 6px solid var(--dc, #3F7CC0); border-radius: 14px; background: #24476B; color: #fff; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
.rt-panel h3 { margin: 0; font-size: 1.35rem; font-weight: 500; letter-spacing: -.02em; }
.rt-panel p { margin: 12px 0 0; font-size: .86rem; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.82); text-align: justify; max-width: 33rem; }
.rt-topics { margin: 18px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.rt-topic { padding: 4px 12px; border-radius: 999px; font-size: .72rem; font-weight: 400; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); }
.rt-nums { margin: 22px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rt-num { margin: 0; padding: 0; border-radius: 0; background: none; color: #fff; text-align: center; }
.rt-num strong { display: flex; align-items: center; justify-content: center; width: 72px; height: 72px; margin: 0 auto; border-radius: 50%; background: #DCE8F1; color: #24476B; font-size: 1.15rem; font-weight: 500; letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; }
.rt-num span { display: block; margin-top: 12px; white-space: nowrap; font-size: .78rem; font-weight: 300; color: #DCE8F1; }
.rt-list { margin: 22px 0 0; padding: 0; list-style: none; display: grid; gap: 14px; }
.rt-list li:last-child { border-bottom: 0; padding-bottom: 0; }
.rt-item { align-content: start; padding-bottom: 14px; border-bottom: 1px solid rgba(255,255,255,.12); display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 14px; align-items: baseline; font-size: .84rem; line-height: 1.45; }
.rt-item a { color: #fff; font-weight: 500; text-decoration: none; transition: opacity .2s; }
.rt-item a:hover { opacity: .75; }
.rt-item a:active, .rt-item a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.rt-item b { font-weight: 500; font-variant-numeric: tabular-nums; }
.rt-item small { grid-column: 1; font-size: .72rem; font-weight: 300; color: rgba(255,255,255,.65); }

/* ---- trends ---- */
.rt-chips { margin: 36px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.rt-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(36,71,107,.28); background: #fff; color: #24476B; font: 400 .8rem inherit; font-family: inherit; cursor: pointer; transition: background-color .2s, color .2s, border-color .2s; }
.rt-chip:hover { border-color: #24476B; }
.rt-chip { --c: #24476B; --fg: #fff; position: relative; overflow: hidden; isolation: isolate; }
.rt-chip[aria-pressed="true"] { color: var(--fg); background: var(--c); border-color: var(--c); }
.rt-cd { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.rt-chip[aria-pressed="true"] .rt-cd { box-shadow: 0 0 0 2px rgba(255,255,255,.85); }
.rt-chip i { font-style: normal; font-size: .72rem; opacity: .7; }
.rt-chart { margin-top: 18px; padding: 14px 0 10px; }
.rt-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.rt-chart text { font-family: inherit; fill: #3a5f86; }
.rt-grid { stroke: rgba(36,71,107,.12); stroke-width: 1; }
.rt-era-t { font-size: 10.5px; font-weight: 500; letter-spacing: .02em; }
.rt-dot { cursor: pointer; fill-opacity: .88; transition: opacity .3s, r .25s; outline: none; }
.rt-dot.is-dim { opacity: .14; }
.rt-dot:hover, .rt-dot.is-sel { stroke: #24476B; stroke-opacity: .35; stroke-width: 5; fill-opacity: 1; }
.rt-dot:focus-visible { stroke: #24476B; stroke-opacity: .5; stroke-width: 5; }
.rt-lab { font-size: 11px; fill: #24476B !important; font-weight: 500; }
.rt-pick { text-align: center; margin: 6px 6px 4px; min-height: 44px; font-size: .84rem; line-height: 1.5; color: #2f4d68; }
.rt-pick a { color: #24476B; font-weight: 600; text-decoration: none; }
.rt-pick a:active, .rt-pick a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(36,71,107,.5); }

.rt-eras { margin-top: 110px; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 800px) { .rt-eras { grid-template-columns: repeat(3, 1fr); } }
.rt-era { padding: 26px 24px; border-radius: 16px; background: #fff; color: #24476B; border: 1px solid rgba(36,71,107,.1); box-shadow: 0 14px 34px -22px rgba(18,36,60,.35); }
.rt-era small { display: block; font-size: .74rem; font-weight: 300; color: #3a5f86; }
.rt-era strong { display: block; margin-top: 10px; font-size: 1.5rem; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.rt-era strong span { font-size: .84rem; font-weight: 300; color: #3a5f86; letter-spacing: 0; }
.rt-era-bar { margin-top: 16px; height: 4px; border-radius: 4px; background: #DCE8F1; overflow: hidden; }
.rt-era-bar i { display: block; height: 100%; border-radius: 4px; background: #4A86C8; }
.rt-era-pct { margin: 8px 0 0 !important; font-size: .72rem !important; color: #3a5f86 !important; }
.rt-era p { margin: 12px 0 0; font-size: .78rem; font-weight: 300; line-height: 1.6; color: #2f4d68; text-align: justify; }

.rt-foot { margin: 28px 0 0; font-size: .74rem; line-height: 1.6; color: #2f4d68; }
@media (max-width: 639px) {
  .rt-hero { padding: 120px 24px 72px; min-height: 92svh; }
  .rt-title { font-size: 3rem; text-wrap: balance; }
  .rt-lede { margin-top: 18px; max-width: 320px; }
  .rt-tally { margin-top: 26px; gap: 8px; }
  .rt-body { padding: 56px 22px 72px; }
  .rt-sec + .rt-sec { margin-top: 80px; }
  .rt-h2 { text-wrap: balance; }
  .rt-sub { margin-top: 14px; }
  .rt-uni { margin-top: 30px; }
  .rt-canvas { padding: 8px; border-radius: 16px; }
  .rt-panel { padding: 24px 20px; border-radius: 12px; }
  .rt-nums { gap: 10px; }
  .rt-num strong { width: 60px; height: 60px; font-size: 1rem; }
  .rt-chips { margin-top: 26px; flex-wrap: nowrap; overflow-x: auto; margin-left: -22px; margin-right: -22px; padding: 2px 22px 8px; scrollbar-width: none; }
  .rt-chips::-webkit-scrollbar { display: none; }
  .rt-chips li { flex: 0 0 auto; }
  .rt-chart { overflow-x: auto; padding: 12px 10px 8px; border-radius: 16px; }
  .rt-chart svg { min-width: 640px; }
  .rt-pick { position: sticky; left: 0; }
  .rt-era { padding: 22px 22px; }
  .rt-foot { margin-top: 40px; }
}
@media (prefers-reduced-motion: reduce) { .rt-seg, .rt-dot { transition: none; } }
`

export default function ResearchPage() {
  useEffect(() => {
    document.documentElement.classList.add('on-research')
    return () => document.documentElement.classList.remove('on-research')
  }, [])

  const [domainKey, setDomainKey] = useState(stats[0].key)
  const [filter, setFilter] = useState<string | null>(null)
  const [picked, setPicked] = useState<string | null>(null)

  const domain = stats.find((s) => s.key === domainKey) ?? stats[0]
  const pickedPaper = picked ? BY_ID.get(picked) ?? null : null

  const chipCount = (key: string) => stats.find((s) => s.key === key)?.papers.length ?? 0

  return (
    <main id="research-page" className="rt-wrap" aria-labelledby="rt-title">
      <style>{CSS}</style>

      <section className="rt-hero">
        <div className="rt-rings">
          <MagnetLines lineColor="#6391BD" accentColor="#BBD6EC" spacing={34} lineWidth={2} lineHeight={18} mode="orbit" shape="line" radius={200} fade={0.75} stretch={0.4} baseAngle={-10} edgeFade={0.15} idle />
        </div>
        <div className="rt-hero-in rt-in">
          <h1 id="rt-title" className="rt-title">Most Cited Research Papers</h1>
          <p className="rt-lede">The ideas that defined a career: his most influential papers, grouped by research domain and traced across 25 years of evolving research.</p>
          <div className="rt-tally">
            <span className="rt-pill">{stats.length} research domains</span>
            <span className="rt-pill">Source: Google Scholar</span>
          </div>
        </div>
      </section>

      <div className="rt-body">
        <div className="rt-in">
          <section className="rt-sec" aria-labelledby="rt-dom-title">
            <h2 id="rt-dom-title" className="rt-h2 rt-h2-c">Where his research <span>has made its mark</span></h2>

            <div className="rt-uni">
              <div className="rt-canvas">
                <svg className="rt-donut" viewBox={`0 0 ${DS} ${DS}`} role="group" aria-label="Research domains by share of citations">
                  <circle cx={DS / 2} cy={DS / 2} r={DR} fill="none" stroke="#EEF4FA" strokeWidth={DW} />
                  <g transform={`rotate(-90 ${DS / 2} ${DS / 2})`}>
                    {stats.map((s, i) => {
                      const g = SEGS[i]
                      const on = s.key === domain.key
                      return (
                        <circle
                          key={s.key}
                          className={`rt-seg${on ? ' is-on' : ''}`}
                          cx={DS / 2} cy={DS / 2} r={DR}
                          stroke={COLOR_OF.get(s.key)}
                          strokeWidth={DW}
                          strokeDasharray={`${g.len} ${DC - g.len}`}
                          strokeDashoffset={-(g.start + GAP / 2)}
                          role="button"
                          tabIndex={0}
                          aria-pressed={on}
                          aria-label={`${s.name}, ${fmt(s.citations)} citations`}
                          onClick={() => setDomainKey(s.key)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDomainKey(s.key) } }}
                        />
                      )
                    })}
                  </g>
                  <text className="rt-dc-n" x={DS / 2} y={DS / 2 - (domain.name.length > 18 ? 36 : 26)}>{domain.name.length > 18 ? domain.name.split(' ').slice(0, -1).join(' ') : domain.name}</text>
                  {domain.name.length > 18 && <text className="rt-dc-n" x={DS / 2} y={DS / 2 - 12}>{domain.name.split(' ').slice(-1)[0]}</text>}
                  <text className="rt-dc-v" x={DS / 2} y={DS / 2 + (domain.name.length > 18 ? 34 : 28)}>{fmt(domain.citations)}</text>
                  <text className="rt-dc-s" x={DS / 2} y={DS / 2 + (domain.name.length > 18 ? 64 : 58)}>{Math.round((domain.citations / TOTAL_CITES_DOM) * 100)}% of citations</text>
                </svg>
                <ul className="rt-legend">
                  {stats.map((s) => (
                    <li key={s.key}>
                      <button type="button" className="rt-leg" aria-pressed={s.key === domain.key} onClick={() => setDomainKey(s.key)}>
                        <i style={{ background: COLOR_OF.get(s.key) }} />
                        <span>{s.name}</span>
                        <b>{fmt(s.citations)}</b>
                        <small>{Math.round((s.citations / TOTAL_CITES_DOM) * 100)}%</small>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="rt-hint">Segment length follows the combined citations of each domain's most-cited papers.</p>
              </div>

              <aside className="rt-panel" aria-live="polite" style={{ ['--dc' as string]: COLOR_OF.get(domain.key) }}>
                <h3>{domain.name}</h3>
                <p>{domain.blurb.replace(/-/g, '\u2011')}</p>
                <ul className="rt-topics">{domain.topics.map((t) => <li key={t} className="rt-topic">{t}</li>)}</ul>
                <dl className="rt-nums" style={{ margin: '22px 0 0' }}>
                  <div className="rt-num"><strong>{fmt(domain.citations)}</strong><span>Citations from top papers</span></div>
                  <div className="rt-num"><strong>{domain.papers.length}</strong><span>Most-cited papers</span></div>
                </dl>
                <ol className="rt-list">
                  {domain.papers.map((p) => (
                    <li key={p.id} className="rt-item">
                      <a href={scholarLink(p.id)} target="_blank" rel="noopener noreferrer">{titleCase(p.title)}</a>
                      <b>{fmt(p.citations)}</b>
                      <small>{p.year} · {titleCase(p.venue)}</small>
                    </li>
                  ))}
                </ol>
              </aside>
            </div>
          </section>

          <section className="rt-sec" aria-labelledby="rt-trend-title">
            <h2 id="rt-trend-title" className="rt-h2 rt-h2-c">25 years of <span>evolving ideas</span></h2>
            <p className="rt-sub">Each dot is one of his most-cited papers, placed by the year it was published and how often it has been cited. Pick a domain to see how the focus moved.</p>

            <ul className="rt-chips" aria-label="Filter by domain">
              <li><button type="button" className="rt-chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>All domains</button></li>
              {stats.map((s) => (
                <li key={s.key}>
                  <button type="button" className="rt-chip" style={{ ['--c' as string]: COLOR_OF.get(s.key), ['--fg' as string]: LIGHT.has(s.key) ? '#14305A' : '#fff' }} aria-pressed={filter === s.key} onClick={() => setFilter(filter === s.key ? null : s.key)}>
                    <span className="rt-cd" style={{ background: COLOR_OF.get(s.key) }} />{s.name} <i>{chipCount(s.key)}</i>
                  </button>
                </li>
              ))}
            </ul>

            <div className="rt-chart">
              <svg viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label="Most-cited papers by year and citations">
                {ERAS.map((e, i) => {
                  const from = Math.max(e.from - 0.5, X0)
                  const to = e.to === null ? X1 : Math.min(e.to + 0.5, X1)
                  return (
                    <g key={e.label}>
                      <rect x={xAt(from)} y={M.t - 24} width={xAt(to) - xAt(from)} height={CH - M.b - M.t + 24} fill={i % 2 ? 'rgba(36,71,107,.05)' : 'rgba(36,71,107,.02)'} />
                      <text className="rt-era-t" x={(xAt(from) + xAt(to)) / 2} y={M.t - 8} textAnchor="middle">{e.label}</text>
                    </g>
                  )
                })}
                {yTicks.map((v) => (
                  <g key={v}>
                    <line className="rt-grid" x1={M.l} x2={CW - M.r} y1={yAt(v)} y2={yAt(v)} />
                    <text x={M.l - 10} y={yAt(v) + 4} textAnchor="end" fontSize="11">{fmt(v)}</text>
                  </g>
                ))}
                {xTicks.map((v) => (
                  <text key={v} x={xAt(v)} y={CH - M.b + 22} textAnchor="middle" fontSize="11">{v}</text>
                ))}
                <text x={M.l - 10} y={M.t - 28} textAnchor="end" fontSize="10.5">Citations</text>

                {PAPERS.map((p) => {
                  const d = DOMAIN_OF.get(p.id)
                  const dim = filter !== null && d?.key !== filter
                  const x = xAt(p.year)
                  const y = yAt(p.citations)
                  return (
                    <g key={p.id}>
                      <circle
                        className={`rt-dot${dim ? ' is-dim' : ''}${picked === p.id ? ' is-sel' : ''}`}
                        cx={x} cy={y} r={3 + 4 * Math.sqrt(p.citations / Math.max(...cites))} fill={d ? COLOR_OF.get(d.key) : '#24476B'}
                        tabIndex={dim ? -1 : 0}
                        role="button"
                        aria-label={`${p.title}, ${p.year}, ${fmt(p.citations)} citations`}
                        onClick={() => setPicked(picked === p.id ? null : p.id)}
                        onMouseEnter={() => setPicked(p.id)}
                        onFocus={() => setPicked(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPicked(p.id) } }}
                      />
                      {LABELLED.has(p.id) && !dim && (
                        <text className="rt-lab" x={x + (x > CW * 0.7 ? -17 : 17)} y={y + 4} textAnchor={x > CW * 0.7 ? 'end' : 'start'}>
                          {shortTitle(p.title)} · {fmt(p.citations)}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
              <p className="rt-pick" aria-live="polite">
                {pickedPaper ? (
                  <>
                    <a href={scholarLink(pickedPaper.id)} target="_blank" rel="noopener noreferrer">{titleCase(pickedPaper.title)}</a>
                    <br />
                    {pickedPaper.year} · {titleCase(pickedPaper.venue)} · {fmt(pickedPaper.citations)} citations · {DOMAIN_OF.get(pickedPaper.id)?.name}
                  </>
                ) : (
                  'Hover or tap a dot to see the paper.'
                )}
              </p>
            </div>

            <div className="rt-eras">
              {eraStats.map((e) => (
                <article key={e.label} className="rt-era">
                  <small>{eraRange(e)}</small>
                  <strong>{e.count} papers <span>· {fmt(e.citations)} citations</span></strong>
                  <div className="rt-era-bar" aria-hidden="true"><i style={{ width: `${(e.citations / TOTAL_CITES) * 100}%` }} /></div>
                  <p className="rt-era-pct">{Math.round((e.citations / TOTAL_CITES) * 100)}% of the combined citations</p>
                  <p>{`${e.label}${e.lead.length ? `. Led\u00A0by ${e.lead.join(' and ')}.` : '.'}`.replace(/-/g, '\u2011')}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="rt-foot">Citation counts are from the Google Scholar profile, retrieved {retrieved}.</p>
        </div>
      </div>
    </main>
  )
}