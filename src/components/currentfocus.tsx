/* ==========================================================================
   Current Focus: five short cards shown just before "Moments & Milestones".
   Edit the FOCUS list below to change the text.
   ========================================================================== */

const FOCUS = [
  { title: 'AI & Education', text: 'Transforming higher education through AI-enabled learning.' },
  { title: 'AI & Healthcare', text: 'Intelligent systems for healthcare and medical decision support.' },
  { title: 'AI & Society', text: 'Responsible and human-centred AI.' },
  { title: 'Research & Innovation', text: 'Building interdisciplinary research ecosystems.' },
  { title: 'University Leadership', text: 'Advancing liberal education, entrepreneurship and industry-academia collaboration.' },
]

const CSS = `
.cf-wrap {
  padding: 50px 30px 60px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .cf-wrap { padding: 70px 56px 80px; } }

.cf-title {
  margin: 0 0 40px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
@media (max-width: 639px) { .cf-title { margin-bottom: 28px; } }

.cf-grid { list-style: none; margin: 0; padding: 0; display: grid; gap: 16px; grid-template-columns: 1fr; }
@media (min-width: 640px) { .cf-grid { grid-template-columns: repeat(2, 1fr); gap: 20px; } }
@media (min-width: 1100px) { .cf-grid { grid-template-columns: repeat(6, 1fr); }
  .cf-card { grid-column: span 2; }
  .cf-card:nth-child(4) { grid-column: 2 / span 2; }
  .cf-card:nth-child(5) { grid-column: 4 / span 2; } }

.cf-card {
  display: flex; flex-direction: column; gap: 10px; padding: 26px 24px; border-radius: 20px; box-sizing: border-box;
  background: linear-gradient(145deg, rgba(255,255,255,.16) 0%, rgba(255,255,255,.07) 100%);
  border: 1px solid rgba(255,255,255,.28);
  -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px);
  box-shadow: 0 10px 30px -14px rgba(8,22,40,.5), inset 0 1px 0 rgba(255,255,255,.3);
  transition: transform .3s cubic-bezier(.16,1,.3,1), background .3s;
}
.cf-card:hover { transform: translateY(-4px); background: linear-gradient(145deg, rgba(255,255,255,.24) 0%, rgba(255,255,255,.1) 100%); }
.cf-num { font-size: .72rem; font-weight: 500; letter-spacing: .16em; color: #cdd9ff; }
.cf-h { margin: 0; font-size: 1.15rem; font-weight: 600; letter-spacing: -.02em; color: #fff; }
.cf-p { margin: 0; font-size: .92rem; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.88); }
@media (max-width: 639px) { .cf-p { font-size: .9rem; } .cf-h { font-size: 1.1rem; } }
@media (prefers-reduced-motion: reduce) { .cf-card { transition: none; } .cf-card:hover { transform: none; } }
`

export default function CurrentFocus() {
  return (
    <section id="current-focus" className="cf-wrap" aria-labelledby="cf-title">
      <style>{CSS}</style>
      <h2 id="cf-title" className="cf-title">Current Focus</h2>
      <ul className="cf-grid">
        {FOCUS.map((f, i) => (
          <li key={f.title} className="cf-card">
            <span className="cf-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="cf-h">{f.title}</h3>
            <p className="cf-p">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
