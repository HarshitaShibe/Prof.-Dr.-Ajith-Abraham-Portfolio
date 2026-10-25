import { useEffect, useRef, useState } from 'react'
import MagicRings from './MagicRings'
import data from '../data/journals.json'
import manual from '../data/journals.manual.json'
import network from '../data/network.json'

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
.jn-wrap { position: relative; isolation: isolate; min-height: 100vh; min-height: 100svh; overflow-x: clip; color: #24476B; background: #EEF4FA;
  -webkit-text-size-adjust: 100%; text-size-adjust: 100%;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.jn-wrap *, .jn-wrap *::before, .jn-wrap *::after { box-sizing: border-box; }
.jn-wrap :focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
.jn-in { max-width: 1100px; margin: 0 auto; width: 100%; }

/* ---------- Hero (phone first) ---------- */
.jn-hero { position: relative; isolation: isolate; overflow: hidden; display: flex; flex-direction: column; justify-content: center;
  min-height: 100vh; min-height: 100svh; text-align: center; background: #24476B; color: #fff;
  padding: 96px max(20px, env(safe-area-inset-right)) 72px max(20px, env(safe-area-inset-left)); }
@media (min-width: 640px) { .jn-hero { padding: 120px max(40px, env(safe-area-inset-right)) 96px max(40px, env(safe-area-inset-left)); } }
@media (min-width: 1024px) { .jn-hero { padding: 130px 56px; } }
/* short landscape phones: don't force a full-screen hero with huge padding */
@media (max-height: 520px) and (orientation: landscape) { .jn-hero { min-height: 0; padding-top: 84px; padding-bottom: 56px; } }
.jn-ascii { position: absolute; inset: 0; z-index: 0; width: 100%; height: 100%; }
.jn-hero-in { position: relative; z-index: 1; pointer-events: none; }
.jn-title { margin: 0; text-align: center; text-wrap: balance; font-size: clamp(1.9rem, 1.2rem + 3.4vw, 3.6rem); font-weight: 500; line-height: 1.05; letter-spacing: -.04em; color: #fff; }
.jn-lede { margin: 14px auto 0; max-width: 660px; font-size: clamp(.88rem, .8rem + .3vw, 1rem); font-weight: 400; line-height: 1.65; color: rgba(255,255,255,.85); text-wrap: balance; }
.jn-tally { margin: 22px auto 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
.jn-pill { padding: 7px 14px; border-radius: 999px; font-size: .76rem; font-weight: 600; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.28); }

/* ---------- Body ---------- */
.jn-body { padding: 48px max(20px, env(safe-area-inset-right)) 72px max(20px, env(safe-area-inset-left)); }
@media (min-width: 640px) { .jn-body { padding: 64px max(40px, env(safe-area-inset-right)) 88px max(40px, env(safe-area-inset-left)); } }
@media (min-width: 1024px) { .jn-body { padding: 72px 56px 96px; } }
.jn-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 20px; }
@media (min-width: 640px) { .jn-grid { gap: 24px; } }
@media (min-width: 1024px) { .jn-grid { gap: 28px; } }

.jn-sec { margin: 0 0 36px; }
@media (min-width: 640px) { .jn-sec { margin-bottom: 48px; } }
@media (min-width: 1024px) { .jn-sec { margin-bottom: 56px; } }
.jn-sec-title { margin: 0; color: #24476B; font-size: clamp(1.6rem, 1.2rem + 1.8vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.035em; }
.jn-sec-sub { margin: 12px 0 0; max-width: 62ch; font-size: .9rem; line-height: 1.6; color: #2f4d68; }
/* one-line subtitle only where the container is wide enough to hold it */
@media (min-width: 1180px) { .jn-sec-sub { max-width: none; white-space: nowrap; } }

/* ---------- Journal card (stacked on phone + tablet) ---------- */
.jn-card { font-weight: 300; display: flex; flex-direction: column; min-width: 0; padding: 24px 20px 20px; border-radius: 16px; background: #24476B; color: #fff; box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); }
@media (min-width: 480px) { .jn-card { padding: 28px 28px 24px; } }
@media (min-width: 640px) { .jn-card { padding: 34px 36px 28px; border-radius: 18px; } }
.jn-top { display: flex; align-items: flex-start; }
.jn-head { min-width: 0; }
.jn-badge { margin: 12px 0 0; display: inline-flex; align-items: center; padding: 5px 14px; border-radius: 999px; color: #fff; font-size: .72rem; font-weight: 500; letter-spacing: .01em;
  background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.3); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); box-shadow: inset 0 1px 0 rgba(255,255,255,.22); }
.jn-name { margin: 0; color: #fff; font-size: clamp(1.1rem, 1rem + .6vw, 1.35rem); font-weight: 500; line-height: 1.3; letter-spacing: -.015em; overflow-wrap: anywhere; text-wrap: balance; }
.jn-pub { margin: 6px 0 0; font-weight: 300; font-size: .82rem; color: rgba(255,255,255,.72); overflow-wrap: anywhere; }
.jn-nums { margin: 18px 0 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
@media (min-width: 640px) { .jn-nums { gap: 12px; } }
.jn-num { margin: 0; min-width: 0; padding: 14px 8px; border-radius: 12px; background: rgba(255,255,255,.1); text-align: center; }
@media (min-width: 480px) { .jn-num { padding: 16px 14px; } }
.jn-num strong { display: block; font-size: clamp(1.4rem, 1rem + 2.2vw, 1.9rem); font-weight: 500; letter-spacing: -.03em; line-height: 1.1; font-variant-numeric: tabular-nums; color: #fff; }
.jn-num > span { display: block; font-weight: 300; margin-top: 4px; font-size: .74rem; line-height: 1.35; color: rgba(255,255,255,.72); }
.jn-h { margin: 22px 0 12px; font-size: .84rem; font-weight: 500; color: rgba(255,255,255,.72); }
.jn-papers { margin: 0; padding: 0; list-style: none; display: grid; gap: 18px; }
@media (min-width: 640px) { .jn-papers { gap: 20px; } }
.jn-paper { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 4px 14px; align-items: baseline; font-size: .84rem; line-height: 1.5; }
.jn-paper a { color: #fff; font-weight: 500; text-decoration: none; overflow-wrap: anywhere; transition: opacity .2s; }
.jn-paper a:hover, .jn-links a:hover { opacity: .75; }
/* a light underline once a link has been clicked / focused */
.jn-paper a:active, .jn-paper a:focus, .jn-links a:active, .jn-links a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.jn-paper small { grid-column: 1; margin-top: 2px; font-weight: 300; color: rgba(255,255,255,.65); font-size: .74rem; overflow-wrap: anywhere; }
.jn-cites { grid-row: 1; grid-column: 2; font-weight: 500; font-variant-numeric: tabular-nums; white-space: nowrap; }
.jn-links { margin: auto 0 0; padding-top: 22px; display: flex; flex-wrap: wrap; gap: 4px 22px; font-size: .8rem; }
/* comfortable tap targets on touch screens */
.jn-links a { display: inline-flex; align-items: center; min-height: 40px; font-weight: 500; color: #fff; text-decoration: none; transition: opacity .2s; }
@media (hover: hover) and (pointer: fine) { .jn-links a { min-height: 0; } .jn-links { gap: 8px 22px; } }

.jn-tag { margin: 8px 0 0; display: inline-block; align-self: flex-start; padding: 2px 10px; border-radius: 999px; background: rgba(255,255,255,.16); color: #fff; font-size: .7rem; font-weight: 500; }

/* ---------- Research network ---------- */
.jn-net { margin-top: 64px; }
@media (min-width: 640px) { .jn-net { margin-top: 80px; } }
@media (min-width: 1024px) { .jn-net { margin-top: 96px; } }
.jn-net-title { margin: 0; color: #24476B; font-size: clamp(1.6rem, 1.2rem + 1.8vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.035em; }
.jn-net-sub { margin: 12px 0 0; max-width: 62ch; font-size: .9rem; line-height: 1.6; color: #2f4d68; }
.jn-net-h { margin: 32px 0 14px; font-size: .84rem; font-weight: 500; color: #3a5f86; }
@media (min-width: 640px) { .jn-net-h { margin: 40px 0 16px; } }

.jn-chips { margin: 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
@media (min-width: 640px) { .jn-chips { gap: 10px; } }
.jn-chip { display: inline-flex; align-items: center; gap: 8px; max-width: 100%; min-height: 40px; padding: 0 14px 0 7px; border-radius: 999px; background: #24476B; color: #fff; font-size: .8rem; font-weight: 400; line-height: 1.25;
  box-shadow: 0 8px 20px -12px rgba(18,36,60,.7); transition: transform .3s cubic-bezier(.16,1,.3,1); }
@media (min-width: 640px) { .jn-chip { gap: 10px; padding: 0 16px 0 8px; font-size: .82rem; } }
@media (hover: hover) { .jn-chip:hover { transform: translateY(-2px); } }
/* phone: centre the whole research-network block so the chips never look ragged on the left */
@media (max-width: 639px) {
  .jn-net-title, .jn-net-sub, .jn-net-h { text-align: center; }
  .jn-net-sub { margin-left: auto; margin-right: auto; }
  .jn-chips { justify-content: center; }
}
.jn-cc { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.14); border: 1px solid rgba(255,255,255,.22); font-size: .6rem; font-weight: 600; letter-spacing: .02em; }
.jn-chip em { font-style: normal; font-size: .74rem; font-weight: 300; color: rgba(255,255,255,.7); font-variant-numeric: tabular-nums; }

/* 1 column on phone + tablet portrait, 2 columns once there is real room */
.jn-people { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: minmax(0, 1fr); gap: 12px; }
@media (min-width: 640px) { .jn-people { gap: 16px; } }
@media (min-width: 900px) { .jn-people { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.jn-person { position: relative; display: flex; align-items: center; gap: 12px; padding: 18px 16px 20px; border-radius: 16px; background: #24476B; color: #fff; overflow: hidden;
  box-shadow: 0 14px 34px -18px rgba(18,36,60,.7); transition: transform .35s cubic-bezier(.16,1,.3,1), box-shadow .35s; }
@media (min-width: 480px) { .jn-person { gap: 16px; padding: 20px 22px 22px; } }
@media (min-width: 640px) { .jn-person { gap: 18px; padding: 22px 26px 24px; } }
@media (hover: hover) { .jn-person:hover { transform: translateY(-3px); box-shadow: 0 20px 40px -18px rgba(18,36,60,.8); } }
.jn-av { flex: none; width: 40px; height: 40px; border-radius: 50%; display: grid; place-items: center; background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.25); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); font-size: .72rem; font-weight: 500; }
@media (min-width: 640px) { .jn-av { width: 44px; height: 44px; font-size: .76rem; } }
.jn-pinfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
.jn-pinfo a { font-size: .95rem; font-weight: 500; color: #fff; text-decoration: none; transition: opacity .2s; overflow-wrap: anywhere; }
.jn-pinfo a:hover { opacity: .75; }
.jn-pinfo a:active, .jn-pinfo a:focus { text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 4px; text-decoration-color: rgba(255,255,255,.55); }
.jn-pinfo small { font-size: .76rem; line-height: 1.4; font-weight: 300; color: rgba(255,255,255,.68); overflow-wrap: anywhere; }
.jn-pn { flex: none; min-width: 52px; text-align: center; font-size: 1.2rem; font-weight: 500; line-height: 1.1; font-variant-numeric: tabular-nums; }
@media (min-width: 640px) { .jn-pn { min-width: 64px; font-size: 1.35rem; } }
.jn-pn small { display: block; margin-top: 2px; font-size: .66rem; font-weight: 300; color: rgba(255,255,255,.68); }
.jn-bar { position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: rgba(255,255,255,.08); }
.jn-bar span { display: block; height: 100%; background: rgba(205,217,255,.75); border-radius: 0 2px 2px 0; }

.jn-foot { margin: 28px 0 0; font-size: .74rem; line-height: 1.6; color: #2f4d68; max-width: 80ch; }
@media (min-width: 640px) { .jn-foot { margin-top: 36px; } }

/* ---------- Desktop / large tablet landscape: identity left, papers right ---------- */
@media (min-width: 1024px) {
  .jn-card { display: grid; grid-template-columns: minmax(260px, 340px) minmax(0, 1fr); grid-template-rows: auto auto 1fr; column-gap: 40px; padding: 44px 44px; }
  .jn-card > * { grid-column: 1; }
  .jn-card > .jn-right { grid-column: 2; grid-row: 1 / span 3; padding-left: 40px; border-left: 1px solid rgba(255,255,255,.16); }
  .jn-card .jn-nums { margin-top: 32px; }
  .jn-card .jn-links { align-self: end; }
  .jn-right .jn-h { margin-top: 0; }
}
@media (min-width: 1280px) {
  .jn-card { grid-template-columns: 360px minmax(0, 1fr); column-gap: 64px; padding: 44px 48px; }
  .jn-card > .jn-right { padding-left: 64px; }
}

@media (prefers-reduced-motion: reduce) {
  .jn-chip, .jn-person { transition: none; }
  .jn-chip:hover, .jn-person:hover { transform: none; }
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

const TOP_PAPERS = Math.max(1, ...network.collaborators.map((p) => p.papers))
const netDate = new Date(network.retrievedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/* true on phone-sized screens; used to lighten the hero animation */
function useIsPhone() {
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setPhone(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return phone
}

export default function JournalsPage() {
  const isPhone = useIsPhone()
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
            ringCount={isPhone ? 4 : 6}
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
            <p className="jn-sec-sub">Journals where Prof. Abraham's work is published, with verified article counts and combined citations.</p>
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
            <p className="jn-net-sub">{fmt(network.coAuthors)} co-authors across {network.countries} countries. Source: OpenAlex. Last updated: {netDate}.</p>

            <h3 className="jn-net-h">Top countries by co-authors</h3>
            <ul className="jn-chips">
              {network.countryList.map((c) => (
                <li key={c.code} className="jn-chip"><span className="jn-cc">{c.code}</span>{c.name}<em>{fmt(c.coAuthors)}</em></li>
              ))}
            </ul>

            <h3 className="jn-net-h">Frequent collaborators</h3>
            <ul className="jn-people">
              {network.collaborators.map((p) => (
                <li key={p.openAlex} className="jn-person">
                  <span className="jn-av" aria-hidden="true">{p.name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase()}</span>
                  <span className="jn-pinfo">
                    <a href={p.openAlex} target="_blank" rel="noopener noreferrer">{p.name}</a>
                    <small>{p.institution || 'Affiliation not listed'}{p.country ? ` · ${p.country}` : ''}</small>
                  </span>
                  <span className="jn-pn">{p.papers}<small>papers</small></span>
                  <span className="jn-bar" aria-hidden="true"><span style={{ width: `${Math.max(4, (p.papers / TOP_PAPERS) * 100)}%` }} /></span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  )
}