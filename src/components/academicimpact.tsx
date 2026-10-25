/* ==========================================================================
   Academic Impact at a Glance: heading in the Key Pillars style, then five
   compact glass cards (figure, label, short line). Figures from the CV.
   ========================================================================== */

const FACTS = [
  { value: '300+', label: 'Scholarly Talks', text: 'Plenary lectures, keynotes and tutorials delivered at international conferences, universities and research forums across more than 20 countries.' },
  { value: '9', label: 'Best Paper Awards', text: 'Best paper recognitions received at international conferences, honouring the quality and impact of his published research.' },
  { value: 'Top 2%', label: 'Scientist', text: 'Consistent inclusion in the Stanford–Elsevier list of the world’s top 2% most-cited scientists, reflecting sustained research influence.' },
  { value: 'Top 0.01%', label: 'Researcher', text: 'In 2025, ScholarGPS ranked him among the top 0.01% of researchers worldwide in Engineering and Computer Science.' },
  { value: '100+', label: 'Countries', text: 'Connected through the MIR Labs global research network, bringing together researchers, universities and institutional partners.' },
]

const CSS = `
.ai-wrap {
  padding: 50px 30px 60px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .ai-wrap { padding: 70px 56px 80px; } }

.ai-title {
  margin: 0 0 56px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}

@media (max-width: 639px) {
  .ai-title { margin-bottom: 32px; text-wrap: balance; }
  .ai-grid { gap: 14px; }
  .ai-fact { padding: 20px 20px 22px; }
}
.ai-grid { display: grid; grid-template-columns: 1fr; grid-auto-rows: 1fr; gap: 32px 16px; }
@media (min-width: 640px) { .ai-grid { grid-template-columns: repeat(2, 1fr); } }
@media (min-width: 900px) {
  .ai-grid { grid-template-columns: repeat(6, 1fr); }
  .ai-fact { grid-column: span 2; }
  .ai-fact:nth-child(4) { grid-column: 2 / span 2; }
  .ai-fact:nth-child(5) { grid-column: 4 / span 2; }
}

.ai-fact {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 22px 24px 24px; justify-content: flex-start; box-sizing: border-box; border-radius: 16px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2);
  -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px);
  transition: border-color .3s, box-shadow .3s;
}
.ai-fact:hover { border-color: rgba(255,255,255,.85); box-shadow: 0 0 0 1px rgba(255,255,255,.85); }

.ai-value {
  font-size: 1.1rem; font-weight: 600; letter-spacing: -.01em;
  line-height: 1.3; color: #cdd9ff; white-space: nowrap;
}
.ai-head { display: flex; align-items: baseline; justify-content: center; flex-wrap: wrap; gap: 4px 8px; }
.ai-label { font-size: 1.1rem; font-weight: 500; line-height: 1.3; letter-spacing: -.01em; color: #cdd9ff; }
.ai-text { margin: 18px 0 0; font-size: .78rem; font-weight: 250; line-height: 1.6; color: rgba(255,255,255,.85); }
`

export default function AcademicImpact() {
  return (
    <section id="academic-impact" className="ai-wrap" aria-labelledby="ai-title">
      <style>{CSS}</style>
      <h2 id="ai-title" className="ai-title">Academic Impact at a Glance</h2>

      <div className="ai-grid">
        {FACTS.map((f) => (
          <div key={f.label} className="ai-fact">
            <div className="ai-head">
              <span className="ai-value">{f.value}</span>
              <span className="ai-label">{f.label}</span>
            </div>
            <p className="ai-text">{f.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}