import { useEffect, useMemo, useState } from 'react'
import funding from '../data/funding.json'
import LineWaves from './LineWaves'
import FundedAgencies from './fundedagencies'

/* ==========================================================================
   Research Funding & Projects. The list comes from the CV and lives in
   src/data/funding.json: edit or add entries there, not in this component.
   ========================================================================== */

type Project = { role: string; agency: string; topic: string; project?: string; period: string; grant?: string; country: string; kind?: string }
const PROJECTS = funding.projects as Project[]
const yearsOf = (period: string) => (period.match(/\d{4}/g) ?? []).map(Number)
const span = (p: Project) => { const y = yearsOf(p.period); return [Math.min(...y), Math.max(...y)] }
const uniq = (a: string[]) => Array.from(new Set(a)).sort((x, y) => x.localeCompare(y))
const COUNTRIES = uniq(PROJECTS.map((p) => p.country))
const AGENCY_LIST = uniq(PROJECTS.map((p) => p.agency))
const ALL_YEARS = PROJECTS.flatMap((p) => span(p))
const YEARS: number[] = []
for (let y = Math.max(...ALL_YEARS); y >= Math.min(...ALL_YEARS); y--) YEARS.push(y)
const AGENCIES = new Set(PROJECTS.map((p) => p.agency)).size

type StatDef = { parts: number[]; prefix?: string; suffix?: string; label: string }
const PI_N = PROJECTS.filter((p) => p.role === 'Principal Investigator').length
const CO_N = PROJECTS.filter((p) => p.role === 'Co-Investigator').length
const STATS: StatDef[] = [
  { parts: [110], prefix: '$', suffix: 'M+', label: 'Programmes led or co-led' },
  { parts: [PROJECTS.length], label: 'Grants listed' },
  { parts: [PI_N, CO_N], label: 'As PI · as Co-I' },
  { parts: [AGENCIES], label: 'Funding agencies' },
]
function useCount(target: number, start: boolean) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 1800)
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, start])
  return v
}
function Count({ n, start }: { n: number; start: boolean }) { return <>{useCount(n, start).toLocaleString('en-US')}</> }
function StatItem({ stat, index, start }: { stat: StatDef; index: number; start: boolean }) {
  return (
    <div className="fp-st" style={{ animationDelay: `${1.2 + index * 0.08}s` }}>
      <div className="fp-num">
        {stat.prefix}
        {stat.parts.map((n, i) => <span key={i}>{i > 0 && ' · '}<Count n={n} start={start} /></span>)}
        {stat.suffix}
      </div>
      <div className="fp-lab">{stat.label}</div>
    </div>
  )
}

const CSS = `
.fp-wrap {
  min-height: 100svh; box-sizing: border-box; background: #EEF4FA; color: #24476B;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.fp-wrap { position: relative; overflow-x: clip; }
.fp-waves { position: absolute; top: 0; left: 0; right: 0; height: 820px; z-index: 0; pointer-events: none; opacity: .22; -webkit-mask-image: linear-gradient(#000 60%, transparent); mask-image: linear-gradient(#000 60%, transparent); }
.fp-wrap section { position: relative; z-index: 1; padding: 44px 30px; box-sizing: border-box; }
@media (min-width: 640px) { .fp-wrap section { padding: 56px 56px; } }
.fp-in { max-width: 1100px; margin: 0 auto; }
.fp-hero { min-height: 100svh; display: flex; flex-direction: column; justify-content: center; padding-top: 110px !important; padding-bottom: 60px !important; }
.fp-stats { width: 100%; padding: 0; box-sizing: border-box; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px 0; max-width: 1100px; margin: 96px auto 0; }
@media (min-width: 760px) { .fp-stats { grid-template-columns: repeat(4, 1fr); } }
.fp-st { text-align: center; padding: 10px 8px; opacity: 0; transform: translateY(14px); animation: fp-up .7s cubic-bezier(.16,1,.3,1) forwards; }
@keyframes fp-up { to { opacity: 1; transform: none; } }
@media (prefers-reduced-motion: reduce) { .fp-st { animation: none; opacity: 1; transform: none; } }
.fp-hero .fp-in { text-align: center; }
.fp-title { margin: 0; font-size: clamp(2.1rem, 4.6vw, 3.8rem); font-weight: 500; line-height: 1.05; letter-spacing: -.045em; color: #24476B; animation: fp-drop 1.1s cubic-bezier(.16,1,.3,1) .2s both; }
@keyframes fp-drop { from { opacity: 0; transform: translateY(-34px); } to { opacity: 1; transform: none; } }
.fp-lede { margin: 18px auto 0; max-width: 36rem; font-size: clamp(.84rem, 1.05vw, .92rem); font-weight: 300; line-height: 1.75; color: #3a5a7a; text-align: justify; text-align-last: center; hyphens: none; animation: fp-drop 1.1s cubic-bezier(.16,1,.3,1) .6s both; }
@media (prefers-reduced-motion: reduce) { .fp-title, .fp-lede { animation: none; } }

.fp-glass {
  background: linear-gradient(145deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.07) 100%);
  border: 1px solid rgba(255,255,255,.28); border-radius: 20px; box-sizing: border-box;
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px -14px rgba(8,22,40,.5), inset 0 1px 0 rgba(255,255,255,.3);
}
.fp-sum { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
@media (min-width: 760px) { .fp-sum { grid-template-columns: repeat(4, 1fr); gap: 18px; } }
.fp-stat { padding: 20px 14px; text-align: center; }
.fp-num { font-size: clamp(1.8rem, 3.4vw, 2.7rem); font-weight: 500; letter-spacing: -.02em; color: #24476B; font-variant-numeric: tabular-nums; line-height: 1.1; }
.fp-lab { margin-top: 7px; font-size: .88rem; font-weight: 400; color: #3a5a7a; }

.fp-h2 { margin: 0 0 26px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.fp-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
.fp-item { display: grid; grid-template-columns: 1fr; gap: 8px; padding: 22px 22px; }
@media (min-width: 760px) { .fp-item { grid-template-columns: 170px 1fr; gap: 28px; padding: 24px 28px; } }
.fp-per { font-size: .85rem; font-weight: 500; letter-spacing: .04em; color: #cdd9ff; }
.fp-ag { margin: 0; font-size: 1.02rem; font-weight: 600; letter-spacing: -.01em; color: #fff; }
.fp-pr { margin: 4px 0 0; font-size: .82rem; font-weight: 400; color: #cdd9ff; }
.fp-tp { margin: 8px 0 0; font-size: .92rem; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.9); }
.fp-gr { margin: 6px 0 0; font-size: .8rem; font-weight: 300; color: rgba(255,255,255,.7); }
.fp-filters { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .fp-filters { grid-template-columns: repeat(4, 1fr); } }
@media (min-width: 900px) { .fp-filters { grid-template-columns: repeat(5, auto); align-items: end; } }
.fp-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; font-size: .74rem; font-weight: 500; letter-spacing: 0; text-transform: none; color: #3a5a7a; }
.fp-field select { height: 42px; padding: 0 12px; border-radius: 12px; border: 1px solid #c3d6e6; background: #fff; color: #24476B; font: inherit; font-size: .82rem; letter-spacing: 0; text-transform: none; min-width: 0; text-overflow: ellipsis; }
.fp-field select { -webkit-appearance: none; appearance: none; padding-right: 36px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' fill='none' stroke='%2324476B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 16px center; }
.fp-field select option { color: #14304d; }
.fp-clear { height: 42px; padding: 0 18px; border-radius: 999px; border: 1px solid rgba(36,71,107,.5); background: transparent; color: #24476B; font: inherit; font-size: .85rem; cursor: pointer; }
.fp-clear:hover { background: rgba(36,71,107,.08); }
.fp-tw { overflow-x: auto; border: 1px solid #DCE8F1; border-radius: 4px; background: #fff; }
.fp-tbl { width: 100%; min-width: 760px; border-collapse: collapse; font-size: .8rem; line-height: 1.5; text-align: left; }
.fp-tbl th { padding: 11px 14px; font-weight: 600; color: #24476B; background: #DCE8F1; border-bottom: 1px solid #c3d6e6; white-space: nowrap; }
.fp-tbl td { padding: 11px 14px; font-weight: 400; color: #2f4f6e; border-bottom: 1px solid #DCE8F1; vertical-align: middle; }
.fp-tbl tbody tr:last-child td { border-bottom: 0; }
.fp-tbl tbody tr:hover td { background: #f3f8fc; }
.fp-tbl td:first-child { white-space: nowrap; }
.fp-tbl td.fp-t-proj { text-align: justify; hyphens: none; }
.fp-t-ag { font-weight: 600 !important; color: #24476B !important; }
.fp-t-pr { font-weight: 600; color: #24476B; }
.fp-t-kind { display: block; text-align: left; margin-top: 3px; font-size: .72rem; color: #5b7a99; }
.fp-count { margin: 14px 0 0; font-size: .85rem; font-weight: 400; color: #3a5a7a; }
.fp-co { margin: 6px 0 0; font-size: .8rem; font-weight: 400; color: rgba(255,255,255,.7); }
.fp-tag { display: inline-block; margin-top: 8px; padding: 3px 10px; border-radius: 999px; font-size: .72rem; font-weight: 500; color: #24476B; background: #dce8f1; }
.fp-empty { margin: 0; font-size: .95rem; font-weight: 400; color: #3a5a7a; }
.fp-wrap section.fp-grp { padding-top: 64px; padding-bottom: 64px; }
.fp-wrap section.fp-agencies { padding-bottom: 110px; }
.fp-wrap section[aria-label="Filter grants"] { padding-bottom: 0; }
.fp-wrap section[aria-label="Filter grants"] + section.fp-grp { padding-top: 22px; }
.fp-wrap section.fp-foot { margin-top: -48px; padding-top: 0; padding-bottom: 90px; }
.fp-note { margin: 0; font-size: .74rem; font-weight: 400; color: #3a5a7a; }
`

export default function FundingPage() {
  useEffect(() => {
    document.documentElement.classList.add('on-funding')
    return () => document.documentElement.classList.remove('on-funding')
  }, [])

  const [role, setRole] = useState('')
  const [country, setCountry] = useState('')
  const [agency, setAgency] = useState('')
  const [year, setYear] = useState('')
  const filtered = useMemo(() => PROJECTS.filter((p) => {
    const [a, b] = span(p)
    return (!role || p.role === role) && (!country || p.country === country) && (!agency || p.agency === agency) &&
      (!year || (Number(year) >= a && Number(year) <= b))
  }), [role, country, agency, year])
  const groups = ['Principal Investigator', 'Co-Investigator']
    .map((r) => ({ role: r, items: filtered.filter((p) => p.role === r).sort((x, y) => span(y)[1] - span(x)[1] || span(y)[0] - span(x)[0]) }))
    .filter((g) => g.items.length > 0)
  const active = !!(role || country || agency || year)
  const clearAll = () => { setRole(''); setCountry(''); setAgency(''); setYear('') }

  const [counting, setCounting] = useState(false)
  useEffect(() => { const t = window.setTimeout(() => setCounting(true), 1300); return () => window.clearTimeout(t) }, [])

  return (
    <main id="funding-page" className="fp-wrap" aria-labelledby="fp-title">
      <style>{CSS}</style>
      <div className="fp-waves" aria-hidden="true">
        <LineWaves lightMode color1="#4A86C8" color2="#6391BD" color3="#24476B" speed={0.3} lineCount={72} lineWidth={1.3} enableMouseInteraction={false} clickRipple={false} edgeFade={0.15} />
      </div>

      <section className="fp-hero">
        <div className="fp-in">
          <h1 id="fp-title" className="fp-title">Research Funding &amp; Projects</h1>
          <p className="fp-lede">{funding.totalNote.replace("Asia-Pacific", "Asia\u2011Pacific")}</p>
        </div>
        <div className="fp-stats" aria-label="Funding at a glance">
          {STATS.map((st, k) => <StatItem key={st.label} stat={st} index={k} start={counting} />)}
        </div>
      </section>

      <section aria-label="Funded agencies" className="fp-agencies">
        <div className="fp-in">
          <FundedAgencies light />
        </div>
      </section>

      <section aria-label="Filter grants">
        <div className="fp-in">
          <div className="fp-filters">
            <label className="fp-field">Role
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="">All roles</option><option>Principal Investigator</option><option>Co-Investigator</option>
              </select></label>
            <label className="fp-field">Country
              <select value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="">All countries</option>{COUNTRIES.map((c) => <option key={c}>{c}</option>)}
              </select></label>
            <label className="fp-field">Funding agency
              <select value={agency} onChange={(e) => setAgency(e.target.value)}>
                <option value="">All agencies</option>{AGENCY_LIST.map((a) => <option key={a}>{a}</option>)}
              </select></label>
            <label className="fp-field">Year
              <select value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">All years</option>{YEARS.map((y) => <option key={y}>{y}</option>)}
              </select></label>
            {active ? <button type="button" className="fp-clear" onClick={clearAll}>Clear filters</button> : null}
          </div>
          <p className="fp-count" aria-live="polite">Showing {filtered.length} of {PROJECTS.length} grants, newest first</p>
        </div>
      </section>

      {groups.length === 0 ? <section><div className="fp-in"><p className="fp-empty">No grants match these filters.</p></div></section> : null}

      {groups.map((g) => (
        <section key={g.role} className="fp-grp" aria-label={g.role}>
          <div className="fp-in">
            <h2 className="fp-h2">Research grants as {g.role}</h2>
            <div className="fp-tw">
              <table className="fp-tbl">
                <thead>
                  <tr><th>Period</th><th>Funding agency</th><th>Project</th><th>Country</th>{g.items.some((p) => p.grant) ? <th>Grant number</th> : null}</tr>
                </thead>
                <tbody>
                  {g.items.map((p, i) => (
                    <tr key={g.role + i}>
                      <td>{p.period}</td>
                      <td className="fp-t-ag">{p.agency}</td>
                      <td className="fp-t-proj">{p.project ? <span className="fp-t-pr">{p.project}<br /></span> : null}{p.topic}{p.kind ? <span className="fp-t-kind">{p.kind}</span> : null}</td>
                      <td>{p.country}</td>
                      {g.items.some((q) => q.grant) ? <td>{p.grant ?? '–'}</td> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ))}

      <section className="fp-foot">
        <div className="fp-in">
          <p className="fp-note">As of {funding.asOf}.</p>
        </div>
      </section>
    </main>
  )
}
