import { useEffect, useState } from 'react'
import metrics from '../data/metrics.json'
import home from '../data/home.json'

/* ==========================================================================
   Stats strip shown below the hero. Numbers count up when the strip scrolls
   into view. Plain CSS (injected below), Plus Jakarta Sans.
   ========================================================================== */

interface StatDef {
  value: number
  label: string
  prefix?: string
  suffix?: string
}

// Citations and H-index come from metrics.json (Google Scholar), so they stay
// in sync with the Citation Metrics section. The other figures are in home.json.
const toNumber = (text: string | undefined) => parseInt((text ?? '0').replace(/[^\d]/g, ''), 10) || 0
const scholar = metrics.sources.find((s) => s.name === 'Google Scholar') ?? metrics.sources[0]
const hIndex = scholar.stats.find((s) => s.label === 'H-index')?.value

const STATS: StatDef[] = [
  { value: toNumber(scholar.citations), suffix: '+', label: 'Google Scholar citations' },
  { value: toNumber(hIndex), label: 'H-index' },
  ...(home.stats as StatDef[]),
]

const DURATION = 1800 // ms for the count-up
const FLOAT_DELAY = 1.3 // s: stats float up after the name appears
const COUNT_DELAY = 1500 // ms: numbers start counting after the float-in

const CSS = `
.st-wrap {
  position: absolute; left: 0; right: 0; bottom: 16px; z-index: 2;
  padding: 0 14px; box-sizing: border-box;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .st-wrap { bottom: 24px; padding: 0 58px; } }

.st-card {
  display: grid; grid-template-columns: repeat(2, 1fr); overflow: hidden;
  background: transparent; border-radius: 22px;
}
@media (min-width: 900px) { .st-card { grid-template-columns: repeat(5, 1fr); } }

.st-item {
  position: relative; padding: 16px 18px; text-align: center;
  opacity: 0; transform: translateY(14px);
  animation: st-up .7s cubic-bezier(.16,1,.3,1) forwards;
  transition: background .4s;
}


.st-num {
  font-size: clamp(1.25rem, 2.3vw, 1.85rem); font-weight: 500; letter-spacing: -.02em;
  color: #fff; font-variant-numeric: tabular-nums; line-height: 1.1;
}
.st-label { margin-top: 4px; font-size: .74rem; font-weight: 250; white-space: pre-line; color: rgba(255,255,255,.85); }

@media (max-width: 639px) {
  .st-item { padding: 14px 8px; }
  .st-item:last-child:nth-child(odd) { grid-column: 1 / -1; }
}

@keyframes st-up { to { opacity: 1; transform: none; } }

@media (prefers-reduced-motion: reduce) {
  .st-item { animation: none; opacity: 1; transform: none; }
}
`

function useCountUp(target: number, start: boolean) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!start) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setV(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / DURATION)
      const eased = 1 - Math.pow(1 - p, 3)
      setV(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, start])
  return v
}

function StatItem({ stat, index, start }: { stat: StatDef; index: number; start: boolean }) {
  const v = useCountUp(stat.value, start)
  return (
    <div className="st-item" style={{ animationDelay: `${FLOAT_DELAY + index * 0.08}s` }}>
      <div className="st-num">
        {stat.prefix ?? ''}
        {v.toLocaleString('en-US')}
        {stat.suffix ?? ''}
      </div>
      <div className="st-label">{stat.label}</div>
    </div>
  )
}

export default function Stats() {
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const t = window.setTimeout(() => setInView(true), COUNT_DELAY)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <section className="st-wrap" aria-label="Key metrics">
      <style>{CSS}</style>
      <div className="st-card">
        {STATS.map((stat, i) => (
          <StatItem key={stat.label} stat={stat} index={i} start={inView} />
        ))}
      </div>
    </section>
  )
}