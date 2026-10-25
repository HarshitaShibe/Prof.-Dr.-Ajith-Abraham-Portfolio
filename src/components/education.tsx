import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ==========================================================================
   Education timeline, shown below the biography. The section pins while you
   scroll and a horizontal track slides across, with the line and dots
   drawing in step with scroll. Needs: npm install gsap
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger)

interface EduItem {
  id: string
  year: string
  degree: string
  institution: string
  detail: string
}

const EDUCATION: EduItem[] = [
  {
    id: 'btech-1990',
    year: '1990',
    degree: 'B.Tech. in Electrical & Electronics Engineering',
    institution: 'University of Calicut, Kerala, India',
    detail: 'First Class Honors (First in class of 50)',
  },
  {
    id: 'msc-1998',
    year: '1998',
    degree: 'M.Sc. in Control and Automation',
    institution: 'Nanyang Technological University, Singapore',
    detail: 'Thesis: Reliability Modeling and Optimization',
  },
  {
    id: 'phd-2001',
    year: '2001',
    degree: 'Ph.D. in Computer Science',
    institution: 'Monash University, Melbourne, Australia',
    detail: 'Thesis: Hybrid Soft Computing: Architecture Optimization',
  },
]

const CSS = `
.edu-section {
  position: relative; color: #fff; box-sizing: border-box;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.edu-sticky {
  height: 100vh; height: 100svh; overflow: hidden; box-sizing: border-box;
  display: flex; flex-direction: column; justify-content: center; gap: 22px;
}
.edu-head { padding: 0 25px; }
@media (min-width: 640px) { .edu-head { padding: 0 58px; } }

.edu-eyebrow {
  margin: 0 0 10px; font-size: .75rem; font-weight: 500;
  letter-spacing: .18em; text-transform: uppercase; color: #cdd9ff;
}
.edu-title {
  color: #fff; margin: 0;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  letter-spacing: -.04em; line-height: 1.15;
}
.edu-period { margin: 8px 0 0; font-size: .85rem; color: #fff; }

.edu-track {
  position: relative; display: flex; width: max-content; height: 32vh;
  padding-left: 25px; box-sizing: border-box;
}
@media (min-width: 640px) { .edu-track { padding-left: 58px; } }

.edu-line {
  position: absolute; left: 0; right: 0; top: 50%; height: 1px;
  background: rgba(255,255,255,.7); transform-origin: left center;
}

.edu-item {
  position: relative; flex-shrink: 0; height: 100%;
  width: 78vw; margin-right: 6vw;
}
@media (min-width: 640px) { .edu-item { width: 36vw; min-width: 280px; margin-right: 8vw; } }

.edu-dot {
  position: absolute; left: 0; top: 50%; width: 12px; height: 12px;
  margin-top: -6px; border-radius: 50%; background: #cdd9ff;
  box-shadow: 0 0 0 4px rgba(205,217,255,.25);
}
.edu-year {
  position: absolute; left: 0; bottom: calc(50% + 22px); margin: 0;
  font-size: clamp(1.4rem, 2.4vw, 1.9rem); font-weight: 500; letter-spacing: -.02em;
}
.edu-text {
  position: absolute; left: 0; top: calc(50% + 22px); width: 88%;
}
.edu-degree { color: #fff; margin: 0 0 4px; font-size: .95rem; font-weight: 500; line-height: 1.3; }
.edu-inst { margin: 0 0 4px; font-size: .8rem; color: rgba(255,255,255,.95); }
.edu-detail { margin: 0; font-size: .75rem; font-style: italic; color: rgba(255,255,255,.9); }

/* Reduced motion: no pinning, the track simply scrolls sideways */
@media (prefers-reduced-motion: reduce) {
  .edu-sticky { height: auto; overflow-x: auto; padding: 60px 0; }
}
`

export default function Education() {
  const sectionRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const section = sectionRef.current
    const sticky = stickyRef.current
    const track = trackRef.current
    const line = lineRef.current
    if (!section || !sticky || !track || !line) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const ctx = gsap.context(() => {
      // How far the track has to travel sideways while the section is pinned
      const distance = () => Math.max(0, track.scrollWidth - sticky.clientWidth)

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${distance() * 1.6}`,
          pin: sticky,
          scrub: 1.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      tl.to(track, { x: () => -distance(), ease: 'none', duration: 1 }, 0)
      tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, ease: 'none', duration: 1 }, 0)

      const items = section.querySelectorAll<HTMLElement>('.edu-item')
      const dots = section.querySelectorAll<HTMLElement>('.edu-dot')
      const step = 1 / EDUCATION.length

      EDUCATION.forEach((_, i) => {
        tl.fromTo(dots[i], { scale: 0 }, { scale: 1, duration: 0.15, ease: 'back.out(2)' }, i * step)
        tl.fromTo(items[i], { opacity: i === 0 ? 1 : 0.4 }, { opacity: 1, duration: 0.2, ease: 'none' }, i * step)
      })
    }, section)

    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} id="education" className="edu-section" aria-labelledby="edu-title">
      <style>{CSS}</style>
      <div ref={stickyRef} className="edu-sticky">
        <div className="edu-head">
          <h2 id="edu-title" className="edu-title">Academic Journey</h2>
          <p className="edu-period">1990 – 2001</p>
        </div>

        <div ref={trackRef} className="edu-track">
          <div ref={lineRef} className="edu-line" />
          {EDUCATION.map((item) => (
            <div key={item.id} className="edu-item">
              <span className="edu-dot" />
              <p className="edu-year">{item.year}</p>
              <div className="edu-text">
                <h3 className="edu-degree">{item.degree}</h3>
                <p className="edu-inst">{item.institution}</p>
                <p className="edu-detail">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}