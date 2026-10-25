/* ==========================================================================
   Research Areas: a normal section heading, followed by a
   horizontal strip of the research areas that moves continuously. The strip
   pauses on hover.
   ========================================================================== */

const AREAS = [
  'Computational Intelligence',
  'Machine Learning',
  'Hybrid Intelligent Systems',
  'Global Optimization',
  'Neural Networks',
  'Data Mining and Big Data Analytics',
  'Web Intelligence',
  'Information Security',
  'Intelligent Decision Support Systems',
  'Internet of Things (IoT)',
  'Healthcare AI and Medical Image Analysis',
  'Evolutionary Computing',
  'Swarm Intelligence',
  'Soft Computing',
  'Intelligent Systems Design',
]

const CSS = `
.ra-wrap {
  padding: 36px 30px 40px; box-sizing: border-box; color: #fff; overflow: hidden;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.ra-title {
  margin: 0 0 40px; text-align: center; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
.ra-strip {
  margin-top: 28px; width: 100%; overflow: hidden; padding: 4px 0;
  border-top: 1px solid rgba(205,217,255,.22); border-bottom: 1px solid rgba(205,217,255,.22);
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
          mask-image: linear-gradient(90deg, transparent, #000 4%, #000 96%, transparent);
}
.ra-track { display: flex; width: max-content; animation: ra-scroll 46s linear infinite; }
.ra-strip:hover .ra-track { animation-play-state: paused; }
.ra-item {
  flex-shrink: 0; display: flex; align-items: center; padding: 16px 0;
  font-size: .95rem; font-weight: 500; letter-spacing: .01em; color: #ffffff;
  white-space: nowrap; transition: color .3s;
}
.ra-item::after {
  content: ''; width: 5px; height: 5px; margin: 0 34px; flex-shrink: 0;
  background: #cdd9ff; opacity: .7; transform: rotate(45deg);
}
.ra-item:hover { color: #ffffff; }
@media (min-width: 640px) { .ra-wrap { padding: 44px 56px 48px; } }
@keyframes ra-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@media (prefers-reduced-motion: reduce) { .ra-track { animation: none; } }
`

export default function ResearchAreas() {
  const loop = [...AREAS, ...AREAS]

  return (
    <section id="research-areas" className="ra-wrap" aria-labelledby="ra-title">
      <style>{CSS}</style>

      <h2 id="ra-title" className="ra-title">Research Areas</h2>

      <div className="ra-strip">
        <div className="ra-track">
          {loop.map((area, i) => (
            <span key={i} className="ra-item" aria-hidden={i >= AREAS.length ? true : undefined}>
              {area}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}