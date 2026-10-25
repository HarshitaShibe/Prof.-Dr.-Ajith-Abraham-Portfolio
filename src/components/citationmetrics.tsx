import { useEffect, useRef, useState } from 'react'
import metrics from '../data/metrics.json'

/* ==========================================================================
   Citation Metrics: one compact card per index, numbers count up when
   scrolled into view. All figures live in src/data/metrics.json: edit that
   file to update the numbers, no need to touch this component.
   ========================================================================== */

const SOURCES = metrics.sources

// Prof. Ajith Abraham's profile on each index (name must match "name" in metrics.json)
const PROFILE_LINKS: Record<string, string> = {
  'Google Scholar': 'https://scholar.google.com/citations?user=i95DGLQAAAAJ',
  Scopus: 'https://www.scopus.com/authid/detail.uri?authorId=7202760099',
  'Web of Science': 'https://www.webofscience.com/wos/author/record/A-1416-2008',
}

const CSS = `
.cm-wrap {
  padding: 50px 30px 60px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .cm-wrap { padding: 70px 56px 70px; } }

.cm-title {
  margin: 0 0 56px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
@media (max-width: 639px) {
  .cm-title { margin-bottom: 32px; }
  .cm-grid { gap: 14px; }
}
.cm-grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
@media (min-width: 900px) { .cm-grid { grid-template-columns: repeat(3, 1fr); } }

.cm-card {
  display: flex; flex-direction: column; padding: 20px 22px 18px; box-sizing: border-box;
  border-radius: 16px;
}
.cm-light { background: #DCE8F1; color: #24476B; box-shadow: 0 10px 30px -18px rgba(18,36,60,.5); }

.cm-source { margin: 0 0 16px; font-size: 1.1rem; font-weight: 600; line-height: 1.3; letter-spacing: -.01em; }
.cm-light .cm-source { color: #24476B; }
.cm-source a { color: inherit; text-decoration: none; border-bottom: 1px solid transparent; transition: border-color .2s; }
.cm-source a:hover, .cm-source a:focus-visible { border-bottom-color: currentColor; }

.cm-card { container-type: inline-size; }
.cm-total {
  display: flex; align-items: baseline; flex-wrap: nowrap; white-space: nowrap; gap: .3em; margin: 0 0 14px;
  font-size: clamp(.95rem, 1.8vw, 1.4rem);
  font-size: clamp(.95rem, 5.6cqi, 1.4rem);
  font-weight: 600; letter-spacing: -.02em; line-height: 1.05; font-variant-numeric: tabular-nums;
}
.cm-total-label, .cm-citations { font-size: inherit; font-weight: inherit; margin: 0; }
.cm-total-label { font-weight: 500; letter-spacing: 0; }
.cm-light .cm-total-label { color: #24476B; }

.cm-rows { margin: 0; padding: 0; list-style: none; }
.cm-row { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; padding: 6px 0; }
.cm-row-label { font-size: .82rem; font-weight: 400; }
.cm-light .cm-row-label { color: #2f4d68; }
.cm-row-value { font-size: .9rem; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }

.cm-note { margin: 22px 0 0; font-size: .8rem; font-weight: 400; color: rgba(255,255,255,.9); }
`

function CountUp({ value, duration = 1600 }: { value: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const m = value.match(/^(\D*)([\d,]+)(\D*)$/)
  const target = m ? parseInt(m[2].replace(/,/g, ''), 10) : 0
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!m) return
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(target)
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
          setN(Math.round(target * (1 - Math.pow(1 - p, 3))))
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
  }, [target, duration])

  if (!m) return <span>{value}</span>
  return (
    <span ref={ref}>
      {m[1]}
      {n.toLocaleString('en-US')}
      {m[3]}
    </span>
  )
}

export default function CitationMetrics() {
  return (
    <section id="citation-metrics" className="cm-wrap" aria-labelledby="cm-title">
      <style>{CSS}</style>
      <h2 id="cm-title" className="cm-title">Citation Metrics</h2>

      <div className="cm-grid">
        {SOURCES.map((src) => (
          <article key={src.name} className="cm-card cm-light">
            <h3 className="cm-source">
              {PROFILE_LINKS[src.name] ? (
                <a href={PROFILE_LINKS[src.name]} target="_blank" rel="noopener noreferrer">
                  {src.name}
                </a>
              ) : (
                src.name
              )}
            </h3>
            <p className="cm-total">
              <span className="cm-total-label">Total citations :</span>
              <span className="cm-citations"><CountUp value={src.citations} /></span>
            </p>
            <ul className="cm-rows">
              {src.stats.map((st) => (
                <li key={st.label} className="cm-row">
                  <span className="cm-row-label">{st.label}</span>
                  <span className="cm-row-value"><CountUp value={st.value} /></span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <p className="cm-note">Citation data as of {metrics.updated}.</p>
    </section>
  )
}