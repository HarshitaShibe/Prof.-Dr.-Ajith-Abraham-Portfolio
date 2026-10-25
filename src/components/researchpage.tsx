import { useEffect, useMemo, useState } from 'react'
import MagicRings from './MagicRings'
import top from '../data/scholar-top.json'
import cfg from '../data/research-trends.json'

/* ==========================================================================
   Research and Trends. Two views of Prof. Abraham's 20 most-cited papers
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

/* ---- bubble layout: deterministic, simple collision relaxation ---- */
const BW = 640
const BH = 440
function pack() {
  const max = Math.max(...stats.map((s) => s.citations))
  const nodes = stats.map((s, i) => ({
    key: s.key,
    r: Math.max(46, 128 * Math.sqrt(s.citations / max)),
    x: BW / 2 + Math.cos(i * 2.4) * (30 + i * 24),
    y: BH / 2 + Math.sin(i * 2.4) * (30 + i * 24),
  }))
  for (let it = 0; it < 500; it++) {
    for (const n of nodes) {
      n.x += (BW / 2 - n.x) * 0.02
      n.y += (BH / 2 - n.y) * 0.02
    }
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        const dist = Math.hypot(dx, dy) || 0.01
        const min = a.r + b.r + 8
        if (dist < min) {
          dx /= dist
          dy /= dist
          const push = (min - dist) / 2
          a.x -= dx * push
          a.y -= dy * push
          b.x += dx * push
          b.y += dy * push
        }
      }
    }
    for (const n of nodes) {
      n.x = Math.min(BW - n.r - 4, Math.max(n.r + 4, n.x))
      n.y = Math.min(BH - n.r - 4, Math.max(n.r + 4, n.y))
    }
  }
  return nodes
}
const BUBBLES = pack()

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
.rt-rings { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; }
.rt-hero-in { position: relative; z-index: 1; pointer-events: none; }
.rt-title { margin: 0; text-align: center; font-size: clamp(2rem, 4.6vw, 3.6rem); font-weight: 500; line-height: 1.02; letter-spacing: -.045em; color: #fff; }
.rt-lede { margin: 14px auto 0; max-width: 620px; font-size: .8rem; font-weight: 400; line-height: 1.65; color: rgba(255,255,255,.82); text-wrap: balance; }
.rt-tally { margin: 22px auto 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.rt-pill { padding: 6px 14px; border-radius: 999px; font-size: .74rem; font-weight: 500; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.28); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); }

.rt-body { padding: 72px 30px 90px; text-align: left; }
@media (min-width: 640px) { .rt-body { padding: 96px 56px 110px; } }
.rt-sec + .rt-sec { margin-top: 110px; }
.rt-eyebrow { margin: 0 0 12px; font-size: .74rem; font-weight: 500; letter-spacing: .02em; color: #3a5f86; }
.rt-h2 { margin: 0; color: #24476B; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; }
.rt-h2 span { color: #6b84a0; }
.rt-sub { margin: 16px 0 0; max-width: 620px; font-size: .9rem; line-height: 1.6; color: #2f4d68; }

/* ---- domains ---- */
.rt-uni { margin-top: 44px; display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 960px) { .rt-uni { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; } .rt-canvas { position: sticky; top: 100px; } }
.rt-canvas { padding: 12px; border-radius: 20px; background: #fff; border: 1px solid rgba(36,71,107,.12); box-shadow: 0 14px 34px -22px rgba(18,36,60,.45); }
.rt-canvas svg { display: block; width: 100%; height: auto; }
.rt-bub { cursor: pointer; outline: none; }
.rt-bub circle { fill: #24476B; transition: fill .3s, transform .35s cubic-bezier(.16,1,.3,1); transform-box: fill-box; transform-origin: center; }
.rt-bub:hover circle { transform: scale(1.03); }
.rt-bub.is-on circle { fill: #3d6ba0; }
.rt-bub:focus-visible circle { stroke: #24476B; stroke-width: 3; stroke-dasharray: 6 4; }
.rt-bub.is-off circle { fill: #7f9fc6; }
.rt-bub text { fill: #fff; text-anchor: middle; pointer-events: none; }
.rt-bub .n { font-size: 15px; font-weight: 500; }
.rt-bub .c { font-size: 11px; font-weight: 300; opacity: .8; }
.rt-hint { margin: 8px 6px 2px; font-size: .74rem; color: #3a5f86; }

.rt-panel { display: flex; flex-direction: column; padding: 32px; border-radius: 20px; background: #24476B; color: #fff; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
.rt-panel h3 { margin: 0; font-size: 1.35rem; font-weight: 500; letter-spacing: -.02em; }
.rt-panel p { margin: 12px 0 0; font-size: .86rem; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.82); }
.rt-topics { margin: 18px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.rt-topic { padding: 4px 12px; border-radius: 999px; font-size: .72rem; font-weight: 400; background: rgba(255,255,255,.1); border: 1px solid rgba(255,255,255,.2); }
.rt-nums { margin: 22px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rt-num { margin: 0; padding: 14px 16px; border-radius: 12px; background: rgba(255,255,255,.1); text-align: center; }
.rt-num strong { display: block; font-size: 1.7rem; font-weight: 500; letter-spacing: -.02em; line-height: 1.1; font-variant-numeric: tabular-nums; }
.rt-num span { display: block; margin-top: 4px; font-size: .72rem; font-weight: 300; color: rgba(255,255,255,.72); }
.rt-list { margin: 22px 0 0; padding: 0; list-style: none; display: grid; gap: 16px; }
.rt-item { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 2px 14px; align-items: baseline; font-size: .84rem; line-height: 1.45; }
.rt-item a { color: #fff; font-weight: 500; text-decoration: none; transition: opacity .2s; }
.rt-item a:hover { opacity: .75; }
.rt-item a:active, .rt-item a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.rt-item b { font-weight: 500; font-variant-numeric: tabular-nums; }
.rt-item small { grid-column: 1; font-size: .72rem; font-weight: 300; color: rgba(255,255,255,.65); }

/* ---- trends ---- */
.rt-chips { margin: 36px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.rt-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 14px; border-radius: 999px; border: 1px solid rgba(36,71,107,.28); background: #fff; color: #24476B; font: 400 .8rem inherit; font-family: inherit; cursor: pointer; transition: background-color .2s, color .2s, border-color .2s; }
.rt-chip:hover { border-color: #24476B; }
.rt-chip[aria-pressed="true"] { background: #24476B; border-color: #24476B; color: #fff; }
.rt-chip i { font-style: normal; font-size: .72rem; opacity: .7; }
.rt-chart { margin-top: 18px; padding: 14px 14px 10px; border-radius: 20px; background: #fff; border: 1px solid rgba(36,71,107,.12); box-shadow: 0 14px 34px -22px rgba(18,36,60,.45); }
.rt-chart svg { display: block; width: 100%; height: auto; overflow: visible; }
.rt-chart text { font-family: inherit; fill: #3a5f86; }
.rt-grid { stroke: rgba(36,71,107,.12); stroke-width: 1; }
.rt-era-t { font-size: 10.5px; font-weight: 500; letter-spacing: .02em; }
.rt-dot { fill: #24476B; cursor: pointer; transition: opacity .3s, r .25s; outline: none; }
.rt-dot.is-dim { opacity: .14; }
.rt-dot:hover, .rt-dot.is-sel { stroke: #7f9fc6; stroke-width: 4; }
.rt-dot:focus-visible { stroke: #7f9fc6; stroke-width: 4; }
.rt-lab { font-size: 11px; fill: #24476B !important; font-weight: 500; }
.rt-pick { margin: 6px 6px 4px; min-height: 44px; font-size: .84rem; line-height: 1.5; color: #2f4d68; }
.rt-pick a { color: #24476B; font-weight: 600; text-decoration: none; }
.rt-pick a:active, .rt-pick a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(36,71,107,.5); }

.rt-eras { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 800px) { .rt-eras { grid-template-columns: repeat(3, 1fr); } }
.rt-era { padding: 26px 28px; border-radius: 16px; background: #24476B; color: #fff; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
.rt-era small { display: block; font-size: .74rem; font-weight: 300; color: rgba(255,255,255,.7); }
.rt-era strong { display: block; margin-top: 10px; font-size: 1.5rem; font-weight: 500; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
.rt-era strong span { font-size: .84rem; font-weight: 300; color: rgba(255,255,255,.75); letter-spacing: 0; }
.rt-era p { margin: 12px 0 0; font-size: .82rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,.82); }

.rt-foot { margin: 56px 0 0; font-size: .74rem; line-height: 1.6; color: #2f4d68; }
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
  .rt-bub .n { font-size: 19px; }
  .rt-bub .c { font-size: 14px; }
  .rt-panel { padding: 24px 20px; border-radius: 16px; }
  .rt-nums { gap: 10px; }
  .rt-num strong { font-size: 1.4rem; }
  .rt-chips { margin-top: 26px; flex-wrap: nowrap; overflow-x: auto; margin-left: -22px; margin-right: -22px; padding: 2px 22px 8px; scrollbar-width: none; }
  .rt-chips::-webkit-scrollbar { display: none; }
  .rt-chips li { flex: 0 0 auto; }
  .rt-chart { overflow-x: auto; padding: 12px 10px 8px; border-radius: 16px; }
  .rt-chart svg { min-width: 640px; }
  .rt-pick { position: sticky; left: 0; }
  .rt-era { padding: 22px 22px; }
  .rt-foot { margin-top: 40px; }
}
@media (prefers-reduced-motion: reduce) { .rt-bub circle, .rt-dot { transition: none; } }
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
  const bubble = useMemo(() => new Map(BUBBLES.map((b) => [b.key, b])), [])

  const chipCount = (key: string) => stats.find((s) => s.key === key)?.papers.length ?? 0

  return (
    <main id="research-page" className="rt-wrap" aria-labelledby="rt-title">
      <style>{CSS}</style>

      <section className="rt-hero">
        <div className="rt-rings">
          <MagicRings color="#ffffff" colorTwo="#cdd9ff" motion="pulse" ringCount={6} baseRadius={0.46} speed={1} lineThickness={2} glow={0.5} hoverScale={1.2} clickBurst={true} theme="dark" />
        </div>
        <div className="rt-hero-in rt-in">
          <h1 id="rt-title" className="rt-title">Research and Trends</h1>
          <p className="rt-lede">Twenty of his most-cited papers, grouped by research domain and placed on a timeline to show how the focus moved over 25 years.</p>
          <div className="rt-tally">
            <span className="rt-pill">{PAPERS.length} landmark papers</span>
            <span className="rt-pill">{fmt(PAPERS.reduce((s, p) => s + p.citations, 0))} citations</span>
            <span className="rt-pill">Source: Google Scholar</span>
          </div>
        </div>
      </section>

      <div className="rt-body">
        <div className="rt-in">
          <section className="rt-sec" aria-labelledby="rt-dom-title">
            <p className="rt-eyebrow">Research universe</p>
            <h2 id="rt-dom-title" className="rt-h2">{stats.length} domains, <span>one mission</span></h2>
            <p className="rt-sub">Each bubble is a research domain, sized by the citations of its landmark papers. Tap a bubble to explore it.</p>

            <div className="rt-uni">
              <div className="rt-canvas">
                <svg viewBox={`0 0 ${BW} ${BH}`} role="group" aria-label="Research domains sized by citations">
                  {stats.map((s) => {
                    const b = bubble.get(s.key)!
                    const on = s.key === domain.key
                    const [l1, l2] = s.name.length > 16 ? [s.name.split(' ').slice(0, -1).join(' '), s.name.split(' ').slice(-1)[0]] : [s.name, '']
                    return (
                      <g
                        key={s.key}
                        className={`rt-bub${on ? ' is-on' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={on}
                        aria-label={`${s.name}, ${fmt(s.citations)} citations`}
                        onClick={() => setDomainKey(s.key)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDomainKey(s.key) } }}
                      >
                        <circle cx={b.x} cy={b.y} r={b.r} />
                        <text className="n" x={b.x} y={b.y - (l2 ? 12 : 4)}>{l1}</text>
                        {l2 && <text className="n" x={b.x} y={b.y + 6}>{l2}</text>}
                        <text className="c" x={b.x} y={b.y + (l2 ? 26 : 18)}>{fmt(s.citations)} cites</text>
                      </g>
                    )
                  })}
                </svg>
                <p className="rt-hint">Bubble area follows the combined citations of the domain's papers in the top 20.</p>
              </div>

              <aside className="rt-panel" aria-live="polite">
                <h3>{domain.name}</h3>
                <p>{domain.blurb}</p>
                <ul className="rt-topics">{domain.topics.map((t) => <li key={t} className="rt-topic">{t}</li>)}</ul>
                <dl className="rt-nums" style={{ margin: '22px 0 0' }}>
                  <div className="rt-num"><strong>{fmt(domain.citations)}</strong><span>Citations from top papers</span></div>
                  <div className="rt-num"><strong>{domain.papers.length}</strong><span>of the top {PAPERS.length} papers</span></div>
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
            <p className="rt-eyebrow">Research trends</p>
            <h2 id="rt-trend-title" className="rt-h2">25 years of <span>evolving ideas</span></h2>
            <p className="rt-sub">Each dot is one of his {PAPERS.length} most-cited papers, placed by the year it was published and how often it has been cited. Pick a domain to see how the focus moved.</p>

            <ul className="rt-chips" aria-label="Filter by domain">
              <li><button type="button" className="rt-chip" aria-pressed={filter === null} onClick={() => setFilter(null)}>All domains</button></li>
              {stats.map((s) => (
                <li key={s.key}>
                  <button type="button" className="rt-chip" aria-pressed={filter === s.key} onClick={() => setFilter(filter === s.key ? null : s.key)}>
                    {s.name} <i>{chipCount(s.key)}</i>
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
                      <text className="rt-era-t" x={(xAt(from) + xAt(to)) / 2} y={M.t - 8} textAnchor="middle">{e.label.toUpperCase()}</text>
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
                <text x={M.l - 10} y={M.t - 28} textAnchor="end" fontSize="10.5">CITATIONS</text>

                {PAPERS.map((p) => {
                  const d = DOMAIN_OF.get(p.id)
                  const dim = filter !== null && d?.key !== filter
                  const x = xAt(p.year)
                  const y = yAt(p.citations)
                  return (
                    <g key={p.id}>
                      <circle
                        className={`rt-dot${dim ? ' is-dim' : ''}${picked === p.id ? ' is-sel' : ''}`}
                        cx={x} cy={y} r={7}
                        tabIndex={dim ? -1 : 0}
                        role="button"
                        aria-label={`${p.title}, ${p.year}, ${fmt(p.citations)} citations`}
                        onClick={() => setPicked(picked === p.id ? null : p.id)}
                        onMouseEnter={() => setPicked(p.id)}
                        onFocus={() => setPicked(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPicked(p.id) } }}
                      />
                      {LABELLED.has(p.id) && !dim && (
                        <text className="rt-lab" x={x + (x > CW * 0.7 ? -12 : 12)} y={y + 4} textAnchor={x > CW * 0.7 ? 'end' : 'start'}>
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
                  <p>{e.label}{e.lead.length ? `. Led by ${e.lead.join(' and ')}.` : '.'}</p>
                </article>
              ))}
            </div>
          </section>

          <p className="rt-foot">Citation counts are from the Google Scholar profile, retrieved {retrieved}. Grouping of papers into domains and eras is editorial and can be changed in src/data/research-trends.json.</p>
        </div>
      </div>
    </main>
  )
}