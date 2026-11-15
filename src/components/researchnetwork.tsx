import { useEffect, useRef, useState } from 'react'
import sdg from '../data/sdg.json'

/* ==========================================================================
   Research page: "Sustainable Development Goals" summary.
   Data: src/data/sdg.json, generated from the CV publications by
   scripts/build-sdg-coauthors.py (keyword match on title/venue). The same
   mapping drives the SDG chips and filter on the Publications page.
   ========================================================================== */

const MAXG = Math.max(1, ...sdg.goals.map((g) => g.count))
const fmt = (n: number) => n.toLocaleString('en-US')

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (value === 0) { setN(0); return }
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(value); return }
    let started = false
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => {
        if (e.isIntersecting && !started) {
          started = true
          const dur = 900
          const t0 = performance.now()
          const tick = (t: number) => {
            const prog = Math.min(1, (t - t0) / dur)
            const eased = 1 - Math.pow(1 - prog, 3)
            setN(Math.round(eased * value))
            if (prog < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
          io.disconnect()
        }
      })
    }, { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [value])
  return <span ref={ref} className="rn-count" aria-label={`${value} publications`}>{fmt(n)}</span>
}

const CSS = `
.rn-in { max-width: 1100px; margin: 0 auto; }
.rn-sec { padding: 44px 30px; box-sizing: border-box; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; color: #24476B; }
.rn-sec .rn-h2 { color: #24476B; margin: 0 0 12px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; }
.rn-sub { margin: 0 0 28px; max-width: none; font-size: .92rem; font-weight: 300; line-height: 1.6; color: #3a5a7a; text-align: justify; }
.rn-sdg { display: grid; grid-template-columns: 1fr; gap: 12px; }
@media (min-width: 640px) { .rn-sdg { grid-template-columns: 1fr 1fr; } }
@media (min-width: 1000px) { .rn-sdg { grid-template-columns: 1fr 1fr 1fr; } }
.rn-card { position: relative; overflow: hidden; padding: 16px 18px 16px 18px; border-radius: 16px; border: 1px solid #DCE8F1;
  background: #fff; box-shadow: 0 8px 24px -14px rgba(36,71,107,.28); }
.rn-card::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 5px; background: var(--c); }
.rn-top { display: flex; align-items: center; gap: 12px; }
.rn-ico { flex: none; width: 82px; height: 82px; border-radius: 6px; object-fit: cover; }
.rn-num { flex: none; width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; background: var(--c); color: #fff; font-weight: 700; font-size: 1rem; }
.rn-name { flex: 1; font-size: .9rem; font-weight: 600; line-height: 1.3; text-wrap: balance; }
.rn-count { flex: none; display: inline-flex; align-items: center; justify-content: center; min-width: 44px; height: 44px; padding: 0 10px; border-radius: 999px; background: #24476B; color: #fff; font-size: 1rem; font-weight: 600; font-variant-numeric: tabular-nums; }
.rn-bar { margin-top: 12px; height: 5px; border-radius: 999px; background: #DCE8F1; overflow: hidden; }
.rn-bar i { display: block; height: 100%; border-radius: 999px; background: var(--c); }
.rn-ex { margin: 10px 0 0; padding: 0; list-style: none; font-size: .74rem; line-height: 1.5; font-weight: 300; color: #5b7893; }
.rn-ex li { margin-top: 6px; text-align: justify; }
.rn-ex li::before { content: '•'; color: var(--c); margin-right: 6px; }
.rn-empty { margin: 10px 0 0; font-size: .74rem; font-weight: 300; font-style: italic; color: #8aa0b8; }
.rn-note { margin: 18px 0 0; font-size: .78rem; font-weight: 300; color: #5b7893; }
.rn-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 16px; }
.rn-search { flex: 1 1 240px; height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid #C5D7E6; background: #fff; color: #24476B; font: inherit; font-size: .9rem; }
.rn-search::placeholder { color: #7f98ae; }
.rn-search:focus-visible { outline: 2px solid #4A86C8; outline-offset: 2px; }
.rn-total { font-size: .85rem; font-weight: 300; color: #5b7893; }
.rn-list { margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: 1fr; gap: 8px; }
@media (min-width: 700px) { .rn-list { grid-template-columns: 1fr 1fr; } }
.rn-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 14px; border: 1px solid #DCE8F1;
  background: #fff; }
.rn-who { flex: 1; min-width: 0; }
.rn-who b { display: block; font-size: .9rem; font-weight: 600; }
.rn-who small { display: block; margin-top: 2px; font-size: .74rem; font-weight: 300; color: #5b7893; }
.rn-p { flex: none; text-align: right; font-size: 1.05rem; font-weight: 700; line-height: 1; }
.rn-p small { display: block; margin-top: 3px; font-size: .62rem; font-weight: 400; color: #5b7893; }
.rn-more { margin-top: 18px; height: 44px; padding: 0 22px; border-radius: 999px; border: 0; background: #24476B; color: #fff; font: inherit; font-size: .9rem; font-weight: 600; cursor: pointer; }
.rn-more:hover { background: #1b3652; }
.rn-more:focus-visible { outline: 2px solid #4A86C8; outline-offset: 2px; }
`

export default function ResearchNetwork() {
  return (
    <>
      <style>{CSS}</style>
      <section className="rn-sec" aria-labelledby="rn-sdg-h">
        <div className="rn-in">
          <h2 id="rn-sdg-h" className="rn-h2">Sustainable Development Goals</h2>
          <p className="rn-sub">
            Publications mapped to the UN&rsquo;s 17 Sustainable Development Goals, based on their titles and keywords.
          </p>
          <div className="rn-sdg">
            {sdg.goals.map((g) => (
              <article key={g.n} className="rn-card" style={{ ['--c' as string]: g.color }}>
                <div className="rn-top">
                  <img className="rn-ico" src={`/sdg/${g.n}.png`} alt={`SDG ${g.n}`} width={82} height={82} loading="lazy" />
                  <span className="rn-name">{g.name}</span>
                  <CountUp value={g.count} />
                </div>
                <div className="rn-bar" aria-hidden="true"><i style={{ width: `${(g.count / MAXG) * 100}%` }} /></div>
                {g.examples.length > 0 ? (
                  <ul className="rn-ex">{g.examples.slice(0, 3).map((t, i) => <li key={i}>{t}</li>)}</ul>
                ) : (
                  <p className="rn-empty">No publications mapped to this goal yet.</p>
                )}
              </article>
            ))}
          </div>
          <p className="rn-note">{fmt(sdg.mapped)} of {fmt(sdg.total)} publications matched at least one goal.</p>
        </div>
      </section>
    </>
  )
}
