import { useEffect, useMemo, useRef, useState } from 'react'
import MagicRings from './MagicRings'
import data from '../data/journals.json'
import manual from '../data/journals.manual.json'
import network from '../data/network.json'
import coauthors from '../data/coauthors.json'

/* ==========================================================================
   Journals & Publishers. Reads src/data/journals.json only (no API calls in
   the browser). Regenerate it with:  npm run journals:build
   ========================================================================== */

type Paper = { title: string; year: number | null; citations: number; doi: string | null; url: string | null }
type Journal = {
  key: string
  name: string
  publisher: string | null
  homepage: string | null
  sourceUrl: string | null
  verifiedPublications: number
  totalCitations: number
  topPapers: Paper[]
  status: string
}

type ManualFile = { footerNote?: string; journals?: Manual[] }
type Manual = { name: string; publisher?: string; homepage?: string; publications?: number; citations?: number; topPapers?: Paper[] }
const MANUAL = ((manual as ManualFile).journals ?? []).filter((m) => m && m.name)
// Journals with no verified records are not shown at all
const JOURNALS = (data.journals as Journal[]).filter((j) => j.verifiedPublications > 0)
const EDITOR_IN_CHIEF = new Set(['eaai'])
const META = data.meta
const fmt = (n: number) => n.toLocaleString('en-US')
const retrieved = new Date(META.retrievedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

const CSS = `
.jn-wrap { position: relative; isolation: isolate; min-height: 100svh; color: #24476B; background: #EEF4FA;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.jn-wrap *, .jn-wrap *::before, .jn-wrap *::after { box-sizing: border-box; }
.jn-wrap :focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
.jn-in { max-width: 1100px; margin: 0 auto; }

.jn-hero { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; justify-content: center;
  min-height: 100vh; padding: 120px 30px; background: #24476B; color: #fff; text-align: center; }
@media (min-width: 640px) { .jn-hero { padding: 130px 56px; } }
.jn-ascii { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; }
.jn-hero-in { position: relative; z-index: 1; pointer-events: none; }
.jn-title { margin: 0; text-align: center; font-size: clamp(2rem, 4.6vw, 3.6rem); font-weight: 500; line-height: 1.02; letter-spacing: -.045em; color: #fff; }
.jn-lede { margin: 14px auto 0; max-width: 660px; font-size: .8rem; font-weight: 400; line-height: 1.65; color: rgba(255,255,255,.82); text-wrap: balance; }
.jn-tally { margin: 22px auto 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.jn-pill { padding: 6px 14px; border-radius: 999px; font-size: .74rem; font-weight: 600; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); }

.jn-body { padding: 56px 30px 80px; }
@media (min-width: 640px) { .jn-body { padding: 72px 56px 96px; } }
.jn-grid { display: grid; grid-template-columns: 1fr; gap: 28px; }

.jn-sec { margin: 0 0 56px; }
.jn-sec-title { margin: 0; color: #24476B; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; }
.jn-sec-sub { margin: 16px 0 0; font-size: .9rem; line-height: 1.6; color: #2f4d68; }
@media (min-width: 900px) { .jn-sec-sub { white-space: nowrap; } }

.jn-card { font-weight: 300; display: flex; flex-direction: column; padding: 32px 32px 26px; border-radius: 16px; background: #24476B; color: #fff; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
.jn-top { display: flex; align-items: flex-start; }
.jn-head { min-width: 0; }
.jn-badge { margin: 12px 0 0; display: inline-flex; align-items: center; padding: 5px 14px; border-radius: 999px; color: #fff; font-size: .72rem; font-weight: 500; letter-spacing: .01em;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: inset 0 1px 0 rgba(255,255,255,.22); }
.jn-name { margin: 0; color: #fff; font-size: 1.25rem; font-weight: 500; line-height: 1.3; letter-spacing: -.015em; }
.jn-pub { margin: 6px 0 0; font-weight: 300; font-size: .82rem; color: rgba(255,255,255,.72); }
.jn-nums { margin: 18px 0 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.jn-num { margin: 0; padding: 16px 18px; border-radius: 12px; background: rgba(255,255,255,.1); text-align: center; }
.jn-num strong { display: block; font-size: 1.9rem; font-weight: 500; letter-spacing: -.03em; line-height: 1.1; font-variant-numeric: tabular-nums; color: #fff; }
.jn-num > span { display: block; font-weight: 300; margin-top: 4px; font-size: .74rem; line-height: 1.35; color: rgba(255,255,255,.72); }
.jn-h { margin: 24px 0 12px; font-size: .84rem; font-weight: 500; color: rgba(255,255,255,.72); }
.jn-papers { margin: 0; padding: 0; list-style: none; display: grid; gap: 20px; }
.jn-paper { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 14px; align-items: baseline; font-size: .84rem; line-height: 1.45; }
.jn-paper a { color: #fff; font-weight: 500; text-decoration: none; overflow-wrap: anywhere; transition: opacity .2s; }
.jn-paper a:hover, .jn-links a:hover { opacity: .75; }
/* a light underline once a link has been clicked / focused */
.jn-paper a:active, .jn-paper a:focus, .jn-links a:active, .jn-links a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.jn-paper small { grid-column: 1; margin-top: 2px; font-weight: 300; color: rgba(255,255,255,.65); font-size: .74rem; }
.jn-cites { grid-row: 1; grid-column: 2; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.jn-links { margin: auto 0 0; padding-top: 26px; display: flex; flex-wrap: wrap; gap: 8px 22px; font-size: .8rem; }
.jn-links a { font-weight: 500; color: #fff; text-decoration: none; transition: opacity .2s; }

.jn-tag { margin: 8px 0 0; display: inline-block; align-self: flex-start; padding: 2px 10px; border-radius: 999px; background: rgba(255,255,255,.16); color: #fff; font-size: .7rem; font-weight: 500; }

.jn-net { margin-top: 96px; }
.jn-net-title { margin: 0; color: #24476B; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; }
.jn-net-sub { margin: 16px 0 0; font-size: .9rem; line-height: 1.6; color: #2f4d68; }
.jn-net-h { margin: 44px 0 16px; font-size: .84rem; font-weight: 500; color: #3a5f86; }

.jn-chips { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 10px; }
.jn-chip { display: inline-flex; align-items: center; gap: 10px; min-height: 40px; padding: 0 16px 0 8px; border-radius: 999px; background: #24476B; color: #fff; font-size: .82rem; font-weight: 400;
  box-shadow: 0 8px 20px -12px rgba(18,36,60,.7); transition: transform .3s cubic-bezier(.16,1,.3,1); }
.jn-chip:hover { transform: translateY(-2px); }
.jn-cc { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); font-size: .6rem; font-weight: 600; letter-spacing: .02em; }
.jn-chip em { font-style: normal; font-size: .74rem; font-weight: 300; color: rgba(255,255,255,.7); font-variant-numeric: tabular-nums; }
.jn-chip-h { display: none; }
@media (max-width: 639px) {
  .jn-chips { flex-direction: column; flex-wrap: nowrap; gap: 0; padding: 4px 18px; border-radius: 16px; background: #24476B; }
  .jn-chips .jn-chip-h { display: flex; justify-content: space-between; padding: 12px 0 10px; font-size: .72rem; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.65); border-bottom: 1px solid rgba(255,255,255,.28); }
  .jn-chips .jn-chip { display: flex; align-items: center; gap: 12px; min-height: 0; padding: 11px 0; border-radius: 0; background: transparent; font-size: .95rem; border-bottom: 1px solid rgba(255,255,255,.14); }
  .jn-chips .jn-chip:last-child { border-bottom: 0; }
  .jn-chips .jn-chip:hover { transform: none; }
  .jn-chips .jn-chip em { margin-left: auto; font-size: .95rem; font-weight: 500; color: #fff; }
}

.jn-co-sub { margin: -4px 0 16px; }
.jn-co-tools { scroll-margin-top: 96px; display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 14px; }
.jn-co-search { flex: 1 1 240px; height: 44px; padding: 0 16px; border-radius: 6px; border: 1px solid rgba(36,71,107,.3); background: #fff; color: #24476B; font: inherit; font-size: .84rem; }
.jn-co-search:focus-visible { outline: 2px solid #24476B; outline-offset: 2px; }
.jn-co-total { font-size: .84rem; color: #3a5f86; }
.jn-net-title + .jn-net-h { margin-top: 18px; }
.jn-tw { overflow-x: auto; border-radius: 6px; background: #fff; border: 1px solid rgba(36,71,107,.14); box-shadow: 0 14px 34px -24px rgba(18,36,60,.45); }
.jn-tbl { width: 100%; border-collapse: collapse; font-size: .78rem; color: #24476B; }
.jn-tbl thead th { padding: 14px 18px; background: #24476B; color: #fff; text-align: center; font-size: .78rem; font-weight: 500; white-space: nowrap; }
.jn-tbl tbody th, .jn-tbl tbody td { padding: 13px 18px; text-align: center; font-weight: 400; border-top: 1px solid #DCE8F1; vertical-align: top; }
.jn-tbl tbody th { font-weight: 500; }
.jn-tbl tbody tr:nth-child(even) { background: #F5F9FD; }
.jn-tbl tbody tr:hover { background: #EAF2FA; }
.jn-tbl .jn-t-n { text-align: center; font-variant-numeric: tabular-nums; font-weight: 500; white-space: nowrap; }
.jn-t-sub { display: none; margin-top: 3px; font-size: .74rem; line-height: 1.5; font-weight: 400; color: #5b7a99; }
@media (max-width: 759px) {
  .jn-t-hide { display: none; }
  .jn-t-sub { display: block; }
  .jn-tbl thead th, .jn-tbl tbody th, .jn-tbl tbody td { padding: 12px 14px; }
}
.jn-co-sel { flex: 0 1 200px; height: 44px; padding: 0 36px 0 12px; border-radius: 6px; border: 1px solid rgba(36,71,107,.3); background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5l5 5 5-5' fill='none' stroke='%2324476B' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") no-repeat right 16px center; -webkit-appearance: none; appearance: none; color: #24476B; font: inherit; font-size: .84rem; cursor: pointer; }
.jn-co-sel:focus-visible, .jn-co-clear:focus-visible, .jn-pg-b:focus-visible { outline: 2px solid #24476B; outline-offset: 2px; }
.jn-co-clear { height: 44px; padding: 0 18px; border-radius: 6px; border: 1px solid rgba(36,71,107,.3); background: transparent; color: #24476B; font: inherit; font-size: .84rem; font-weight: 500; cursor: pointer; }
.jn-co-clear:hover { background: #DCE8F1; }
.jn-co-empty { margin: 18px 0 0; padding: 28px; border-radius: 14px; background: #fff; border: 1px solid rgba(36,71,107,.12); text-align: center; font-size: .9rem; color: #3a5f86; }
.jn-pgw { margin-top: 18px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 18px; border-radius: 6px; background: #fff; border: 1px solid rgba(36,71,107,.14); }
.jn-pg-info { margin: 0; font-size: .84rem; color: #2f4d68; }
.jn-pg { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
.jn-pg-rows { display: inline-flex; align-items: center; gap: 10px; font-size: .84rem; color: #3a5f86; }
.jn-pg-b { height: 38px; padding: 0 16px; border: 1px solid rgba(36,71,107,.28); border-radius: 6px; background: #fff; color: #24476B; font: inherit; font-size: .84rem; font-weight: 500; cursor: pointer; }
.jn-pg-b:hover:not(:disabled) { background: #DCE8F1; }
.jn-pg-b:disabled { color: rgba(36,71,107,.35); border-color: rgba(36,71,107,.14); cursor: default; }
.jn-pg-of { font-size: .84rem; font-weight: 500; color: #24476B; white-space: nowrap; }
.jn-pg-sel { height: 38px; flex: none; width: auto; }
@media (max-width: 639px) { .jn-pgw { justify-content: center; text-align: center; } .jn-pg { justify-content: center; } .jn-pg-info { width: 100%; } }
@media (max-width: 639px) { .jn-co-sel { flex: 1 1 100%; } }
.jn-people { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 760px) { .jn-people { grid-template-columns: repeat(2, 1fr); } }
.jn-person { position: relative; display: flex; align-items: center; gap: 18px; padding: 22px 26px; border-radius: 16px; background: #24476B; color: #fff; overflow: hidden;
  box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; }
.jn-person:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -18px rgba(18,36,60,.8); }
.jn-av { flex: none; width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-size: .76rem; font-weight: 500; }
.jn-pinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.jn-pinfo a { font-size: .98rem; font-weight: 500; color: #fff; text-decoration: none; transition: opacity .2s; }
.jn-pinfo a:hover { opacity: .75; }
.jn-pinfo a:active, .jn-pinfo a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.jn-pinfo small { font-size: .76rem; font-weight: 300; color: rgba(255,255,255,.68); overflow-wrap: anywhere; }
.jn-pn { flex: none; min-width: 64px; text-align: center; font-size: 1.35rem; font-weight: 500; line-height: 1.1; font-variant-numeric: tabular-nums; }
.jn-pn small { display: block; margin-top: 2px; font-size: .68rem; font-weight: 300; color: rgba(255,255,255,.68); }
.jn-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255,255,255,.08); }
.jn-bar span { display: block; height: 100%; background: rgba(205,217,255,.75); border-radius: 0 2px 2px 0; }
@media (max-width: 639px) {
  .jn-people { gap: 0; padding: 4px 18px; border-radius: 16px; background: #24476B; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
  .jn-people .jn-person { gap: 12px; padding: 14px 0; border-radius: 0; background: transparent; box-shadow: none; border-bottom: 1px solid rgba(255,255,255,.14); overflow: visible; }
  .jn-people .jn-person:last-child { border-bottom: 0; }
  .jn-people .jn-person:hover { transform: none; box-shadow: none; }
  .jn-people .jn-av { width: 38px; height: 38px; font-size: .7rem; }
  .jn-people .jn-pinfo a { font-size: .95rem; }
  .jn-people .jn-pinfo small { font-size: .78rem; line-height: 1.35; }
  .jn-people .jn-pn { min-width: 48px; font-size: 1.2rem; }
  .jn-people .jn-bar { display: none; }
}

.jn-foot { margin: 36px 0 0; font-size: .74rem; line-height: 1.6; color: #2f4d68; }

/* One wide card per row: identity and numbers on the left, most-cited papers on the right */
@media (min-width: 900px) {
  .jn-card { display: grid; grid-template-columns: 360px minmax(0, 1fr); grid-template-rows: auto auto 1fr; column-gap: 64px; padding: 44px 48px; }
  .jn-card > * { grid-column: 1; }
  .jn-card > .jn-right { grid-column: 2; grid-row: 1 / span 3; padding-left: 64px; border-left: 1px solid rgba(255,255,255,.16); }
  .jn-card .jn-nums { margin-top: 32px; }
  .jn-card .jn-links { align-self: end; }
  .jn-right .jn-h { margin-top: 0; }
}
`

/* Numbers count up when scrolled into view (same behaviour as Citation Metrics) */
function CountUp({ value, duration = 1600 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration)
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])
  return <span ref={ref}>{fmt(n)}</span>
}

// Footer line: edit "footerNote" in src/data/journals.manual.json ({date} is replaced by the last-updated date)
const DEFAULT_NOTE = `${META.note} Source: OpenAlex. Last updated: {date}.`
const FOOTER = (((manual as ManualFile).footerNote || DEFAULT_NOTE) as string).replace('{date}', retrieved)

type CoAuthor = { name: string; papers: number; institution?: string; country?: string }
const CO_ALL = coauthors as CoAuthor[]
const PAGE_SIZES = [10, 25, 50, 100]
const BUCKETS: { key: string; label: string; test: (n: number) => boolean }[] = [
  { key: 'all', label: 'Any number', test: () => true },
  { key: '50', label: '50+ papers', test: (n) => n >= 50 },
  { key: '10', label: '10 to 49 papers', test: (n) => n >= 10 && n < 50 },
  { key: '3', label: '3 to 9 papers', test: (n) => n >= 3 && n < 10 },
  { key: '2', label: '2 papers', test: (n) => n === 2 },
  { key: '1', label: '1 paper', test: (n) => n === 1 },
]
const REGION = typeof Intl !== 'undefined' && 'DisplayName' + 's' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null
const countryName = (c: string) => {
  try {
    return c.length === 2 && REGION ? REGION.of(c) ?? c : c
  } catch {
    return c
  }
}


export default function JournalsPage() {
  const [coQ, setCoQ] = useState('')
  const [coCountry, setCoCountry] = useState('all')
  const [coBucket, setCoBucket] = useState('all')
  const [coPage, setCoPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const coTop = useRef<HTMLDivElement>(null)
  const countryOpts = useMemo(() => {
    const m = new Map<string, number>()
    for (const c of CO_ALL) if (c.country) m.set(c.country, (m.get(c.country) ?? 0) + 1)
    return [...m.entries()].sort((x, y) => y[1] - x[1] || countryName(x[0]).localeCompare(countryName(y[0])))
  }, [])
  const coList = (() => {
    const t = coQ.trim().toLowerCase()
    const test = BUCKETS.find((x) => x.key === coBucket)?.test ?? (() => true)
    return CO_ALL.filter((c) =>
      (!t || c.name.toLowerCase().includes(t) || (c.institution ?? '').toLowerCase().includes(t)) &&
      (coCountry === 'all' || c.country === coCountry) && test(c.papers))
  })()
  const coPages = Math.max(1, Math.ceil(coList.length / pageSize))
  const page = Math.min(coPage, coPages)
  const coFiltered = coQ.trim() !== '' || coCountry !== 'all' || coBucket !== 'all'
  const goPage = (n: number) => {
    setCoPage(n)
    coTop.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  useEffect(() => {
    document.documentElement.classList.add('on-journals')
    return () => document.documentElement.classList.remove('on-journals')
  }, [])

  return (
    <main id="journals" className="jn-wrap" aria-labelledby="jn-title">
      <style>{CSS}</style>

      <section className="jn-hero">
        <div className="jn-ascii">
          <MagicRings
            color="#ffffff"
            colorTwo="#cdd9ff"
            motion="pulse"
            ringCount={6}
            baseRadius={0.46}
            speed={1}
            lineThickness={2}
            glow={1}
            hoverScale={1.2}
            clickBurst={true}
            theme="dark"
          />
        </div>
        <div className="jn-hero-in jn-in">
          <h1 id="jn-title" className="jn-title">Journals &amp; Publishers</h1>
          <p className="jn-lede">His most-cited work appears in leading IEEE, Elsevier and Springer journals, and he has served as Editor-in-Chief of Engineering Applications of Artificial Intelligence.</p>
          <div className="jn-tally">
            <span className="jn-pill">{fmt(META.verifiedJournalWorks)} verified articles</span>
            <span className="jn-pill">Source: OpenAlex</span>
          </div>
        </div>
      </section>

      <section className="jn-body">
        <div className="jn-in">
          <div className="jn-sec">
            <h2 id="jn-sec-title" className="jn-sec-title">Journals</h2>
            <p className="jn-sec-sub">Journals where Prof. Dr. Abraham's work is published, with verified article counts and combined citations.</p>
          </div>
          <div className="jn-grid">
            {JOURNALS.map((j) => (
              <article key={j.key} className="jn-card" aria-labelledby={`jn-${j.key}`}>
                <div className="jn-top">
                  <div className="jn-head">
                    <h3 id={`jn-${j.key}`} className="jn-name">{j.name}</h3>
                    {j.publisher && <p className="jn-pub">{j.publisher}</p>}
                    {EDITOR_IN_CHIEF.has(j.key) && <p className="jn-badge">Editor-in-Chief</p>}
                  </div>
                </div>

                {j.verifiedPublications > 0 ? (
                  <>
                    <dl className="jn-nums" style={{ margin: '18px 0 0' }}>
                      <div className="jn-num"><strong><CountUp value={j.verifiedPublications} /></strong><span>Verified publications</span></div>
                      <div className="jn-num"><strong><CountUp value={j.totalCitations} /></strong><span>Citations (OpenAlex)</span></div>
                    </dl>
                    <div className="jn-right">
                    <h3 className="jn-h">Most-cited papers</h3>
                    <ol className="jn-papers">
                      {j.topPapers.map((p) => (
                        <li key={p.doi ?? p.title} className="jn-paper">
                          {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a> : <span>{p.title}</span>}
                          <span className="jn-cites">{fmt(p.citations)}</span>
                          <small>{p.year ?? ''}{p.doi ? ` · DOI ${p.doi}` : ''}</small>
                        </li>
                      ))}
                    </ol>
                    </div>
                  </>
                ) : null}

                <p className="jn-links">
                  {j.homepage && <a href={j.homepage} target="_blank" rel="noopener noreferrer">Journal website</a>}
                  {j.sourceUrl && <a href={j.sourceUrl} target="_blank" rel="noopener noreferrer">OpenAlex record</a>}
                </p>
              </article>
            ))}
            {MANUAL.map((m) => (
              <article key={`m-${m.name}`} className="jn-card" aria-label={m.name}>
                <div className="jn-top">
                  <div className="jn-head">
                    <h3 className="jn-name">{m.name}</h3>
                    {m.publisher && <p className="jn-pub">{m.publisher}</p>}
                  </div>
                </div>
                <p className="jn-tag">Added manually</p>
                {(m.publications != null || m.citations != null) && (
                  <dl className="jn-nums" style={{ margin: '14px 0 0' }}>
                    {m.publications != null && <div className="jn-num"><strong><CountUp value={m.publications} /></strong><span>Publications</span></div>}
                    {m.citations != null && <div className="jn-num"><strong><CountUp value={m.citations} /></strong><span>Citations</span></div>}
                  </dl>
                )}
                {m.topPapers && m.topPapers.length > 0 && (
                  <ol className="jn-papers jn-right">
                    {m.topPapers.map((p) => (
                      <li key={p.title} className="jn-paper">
                        {p.url ? <a href={p.url} target="_blank" rel="noopener noreferrer">{p.title}</a> : <span>{p.title}</span>}
                        <span className="jn-cites">{p.citations != null ? fmt(p.citations) : ''}</span>
                        <small>{p.year ?? ''}{p.doi ? ` · DOI ${p.doi}` : ''}</small>
                      </li>
                    ))}
                  </ol>
                )}
                <p className="jn-links">{m.homepage && <a href={m.homepage} target="_blank" rel="noopener noreferrer">Journal website</a>}</p>
              </article>
            ))}
          </div>

          <p className="jn-foot">{FOOTER}</p>

          <section className="jn-net" aria-labelledby="jn-net-title">
            <h2 id="jn-net-title" className="jn-net-title">Research network</h2>

            <h3 className="jn-net-h">All co-authors</h3>
            <p className="jn-net-sub jn-co-sub">{fmt(CO_ALL.length)} co-authors from the publication list, ranked by joint papers. Affiliations are shown where available.</p>
            <div className="jn-co-tools" ref={coTop}>
              <input className="jn-co-search" type="search" placeholder="Search co-author or institution" aria-label="Search co-authors"
                value={coQ} onChange={(e) => { setCoQ(e.target.value); setCoPage(1) }} />
              <select className="jn-co-sel" aria-label="Filter by country" value={coCountry} onChange={(e) => { setCoCountry(e.target.value); setCoPage(1) }}>
                <option value="all">All countries</option>
                {countryOpts.map(([code, n]) => <option key={code} value={code}>{countryName(code)} ({n})</option>)}
              </select>
              <select className="jn-co-sel" aria-label="Filter by joint papers" value={coBucket} onChange={(e) => { setCoBucket(e.target.value); setCoPage(1) }}>
                {BUCKETS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
              {coFiltered && (
                <button type="button" className="jn-co-clear" onClick={() => { setCoQ(''); setCoCountry('all'); setCoBucket('all'); setCoPage(1) }}>Clear</button>
              )}
              <span className="jn-co-total">{fmt(coList.length)} shown</span>
            </div>
            {coList.length === 0 ? (
              <p className="jn-co-empty">No co-authors match these filters.</p>
            ) : (
              <div className="jn-tw">
                <table className="jn-tbl">
                  <thead>
                    <tr><th scope="col">Co-author</th><th scope="col" className="jn-t-hide">Institution</th><th scope="col" className="jn-t-hide">Country</th><th scope="col" className="jn-t-n">Joint papers</th></tr>
                  </thead>
                  <tbody>
                    {coList.slice((page - 1) * pageSize, page * pageSize).map((c) => (
                      <tr key={c.name}>
                        <th scope="row">{c.name}{(c.institution || c.country) && <small className="jn-t-sub">{[c.institution, c.country ? countryName(c.country) : ''].filter(Boolean).join(' · ')}</small>}</th>
                        <td className="jn-t-hide">{c.institution || '-'}</td>
                        <td className="jn-t-hide">{c.country ? countryName(c.country) : '-'}</td>
                        <td className="jn-t-n">{c.papers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {coList.length > 0 && (
              <div className="jn-pgw">
                <p className="jn-pg-info">Showing {fmt((page - 1) * pageSize + 1)} to {fmt(Math.min(page * pageSize, coList.length))} of {fmt(coList.length)} co-authors</p>
                <div className="jn-pg">
                  <label className="jn-pg-rows">Rows per page
                    <select className="jn-co-sel jn-pg-sel" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCoPage(1) }}>
                      {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <button type="button" className="jn-pg-b" disabled={page === 1} onClick={() => goPage(page - 1)}>&lsaquo; Previous</button>
                  <span className="jn-pg-of">Page {fmt(page)} of {fmt(coPages)}</span>
                  <button type="button" className="jn-pg-b" disabled={page === coPages} onClick={() => goPage(page + 1)}>Next &rsaquo;</button>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}