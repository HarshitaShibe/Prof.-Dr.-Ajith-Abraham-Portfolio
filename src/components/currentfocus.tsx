/* ==========================================================================
   Current Focus: a dashed-grid "blueprint" bento of focus areas, with a large
   closing statement in the bottom-right. Edit FOCUS / the headline below.
   ========================================================================== */

type Focus = { title: string; text: string }

const FOCUS: Focus[] = [
  {
    title: 'AI & Education',
    text: 'Advancing the future of higher education through artificial intelligence, intelligent learning environments and technology-enabled pedagogy. Exploring innovative approaches that enhance teaching, strengthen academic outcomes and make education more adaptive, accessible and effective.',
  },
  {
    title: 'AI & Healthcare',
    text: 'Exploring the intersection of artificial intelligence and healthcare through medical imaging, predictive analytics, clinical decision-support systems and intelligent diagnostics. Focusing on developing reliable, evidence-driven technologies that support better clinical understanding and healthcare delivery.',
  },
  {
    title: 'AI & Society',
    text: 'Examining the broader implications of artificial intelligence in an increasingly technology-driven world. Emphasising responsible innovation, explainable systems and human-centred approaches that address societal challenges while ensuring technology remains inclusive, ethical and beneficial.',
  },
  {
    title: 'Research & Innovation',
    text: 'Driving interdisciplinary research that connects emerging technologies with practical applications. Fostering collaboration across academic domains, exploring new research directions and translating scientific inquiry into innovative solutions with the potential for meaningful real-world applications.',
  },
  {
    title: 'Academic Leadership',
    text: 'Strengthening higher education through institutional development, academic excellence and international collaboration. Promoting entrepreneurship, interdisciplinary engagement and industry–academia partnerships while fostering an environment that encourages knowledge exchange, research advancement and educational transformation.',
  },
]

const HEAD = {
  line1: 'Where research meets',
  line2: 'real-world impact.',
  body1: 'From advancing computational intelligence and exploring emerging technologies to addressing complex challenges in healthcare, education and society, the focus is on research that extends beyond theoretical exploration.',
  body2: 'By bringing together interdisciplinary expertise, technological innovation and evidence-driven approaches, the aim is to translate new ideas into practical applications, strengthen research collaborations and contribute to solutions that create meaningful, measurable and lasting impact.',
}

const CSS = `
.cf-wrap {
  padding: 50px 30px 100px; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .cf-wrap { padding: 70px 56px 80px; } }

.cf-title {
  margin: 0 0 40px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
@media (max-width: 639px) { .cf-title { margin-bottom: 28px; } }

.cf-grid {
  --line: rgba(255,255,255,.16);
  display: grid; grid-template-columns: 1fr;
  border-top: 1px dashed var(--line); border-left: 1px dashed var(--line);
}
@media (min-width: 760px) {
  .cf-grid {
    grid-template-columns: repeat(12, 1fr);
    grid-auto-rows: minmax(150px, auto);
  }
}

.cf-cell {
  position: relative; padding: 24px 26px 28px; box-sizing: border-box;
  border-right: 1px dashed var(--line); border-bottom: 1px dashed var(--line);
  transition: background .35s ease;
}
.cf-cell::before {
  content: '+'; position: absolute; top: -9px; left: -8px; z-index: 1;
  font-size: 15px; line-height: 1; font-weight: 400; color: rgba(255,255,255,.32);
}
.cf-feat:hover { background: rgba(255,255,255,.04); }

.cf-num { display: block; margin-bottom: 8px; font-size: .68rem; font-weight: 600; letter-spacing: .16em; color: rgba(255,255,255,.5); }
.cf-h { margin: 0 0 9px; font-size: 1.1rem; font-weight: 600; letter-spacing: -.01em; color: #fff; text-wrap: balance; }
.cf-p { margin: 0; font-size: .78rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,.72); text-align: justify; -webkit-hyphens: auto; hyphens: auto; }

.cf-head { display: flex; flex-direction: column; justify-content: flex-end; }
.cf-head-h { margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.25; letter-spacing: -.01em; color: #fff; }
.cf-head-p { margin: 16px 0 0; font-size: .8rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,.62); text-align: justify; -webkit-hyphens: auto; hyphens: auto; }
.cf-head-p + .cf-head-p { margin-top: 12px; }

/* placement (desktop) */
@media (min-width: 760px) {
  .cf-cell.cf-c1 { grid-area: 1 / 1 / 2 / 6; }        /* AI & Education — a touch wider */
  .cf-cell.cf-c2 { grid-area: 1 / 6 / 2 / 13; }       /* AI & Healthcare — extends to the end */
  .cf-cell.cf-c3 { grid-area: 2 / 1 / 3 / 7; }        /* AI & Society — extends right */
  .cf-cell.cf-c4 { grid-area: 2 / 7 / 3 / 13; }       /* Research & Innovation — extends right */
  .cf-cell.cf-c5 { grid-area: 3 / 1 / 4 / 6; }        /* Academic Leadership */
  .cf-cell.cf-head { grid-area: 3 / 6 / 4 / 13; }     /* statement */
}
@media (max-width: 759px) {
  .cf-cell.cf-empty { display: none; }
  .cf-head { padding-top: 34px; }
}
@media (prefers-reduced-motion: reduce) { .cf-cell { transition: none; } }
`

export default function CurrentFocus() {
  return (
    <section id="current-focus" className="cf-wrap" aria-labelledby="cf-title">
      <style>{CSS}</style>
      <h2 id="cf-title" className="cf-title">Current Focus</h2>
      <div className="cf-grid">
        {FOCUS.map((f, i) => (
          <div key={f.title} className={`cf-cell cf-feat cf-c${i + 1}`}>
            <span className="cf-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
            <h3 className="cf-h">{f.title}</h3>
            <p className="cf-p">{f.text}</p>
          </div>
        ))}
        <div className="cf-cell cf-head">
          <h3 className="cf-head-h">{HEAD.line1} {HEAD.line2}</h3>
          <p className="cf-head-p">{HEAD.body1}</p>
          <p className="cf-head-p">{HEAD.body2}</p>
        </div>
      </div>
    </section>
  )
}
