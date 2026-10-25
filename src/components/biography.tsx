import { useEffect, useRef, useState, type ReactNode } from 'react'

/* ==========================================================================
   Biography section, shown below the hero. One heading ("Biography"),
   justified body text, Plus Jakarta Sans. Each block fades up when it
   scrolls into view.
   ========================================================================== */

const PARAGRAPHS = [
  'Professor Ajith Abraham is an internationally distinguished Artificial Intelligence scientist and higher education leader serving as the Vice Chancellor of Sai University, Chennai. With nearly three decades of global academic leadership and research experience spanning Asia, Africa, Europe, Australia, and North America, he has established a strong reputation for advancing research-intensive universities, fostering international scientific collaboration, and integrating emerging technologies into higher education systems.',
  'As Vice Chancellor, Professor Abraham leads Sai University’s strategic transformation towards becoming a globally benchmarked research university. His leadership prioritizes academic excellence, interdisciplinary innovation, institutional governance, and international engagement. Under his direction, the university has strengthened outcome-based academic frameworks, expanded global research partnerships, enhanced faculty research productivity, and initiated institutional reforms aligned with international quality assurance and ranking standards.',
  'His vision positions universities as engines of innovation that combine technological advancement with societal responsibility and ethical leadership. He is also the Founding Director of Machine Intelligence Research Labs (MIR Labs), an international nonprofit research network headquartered in Seattle, USA, connecting researchers across more than 100 countries.',
]

const CSS = `
.bio-wrap {
  padding: 130px 30px 0; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) { .bio-wrap { padding: 160px 56px 0; } }

.bio-inner { max-width: 1180px; margin: 0 auto; text-align: left; }

.bio-title {
  margin: 0 0 28px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff;
}
.bio-p {
  margin: 0 0 16px; font-size: .875rem; font-weight: 300; line-height: 1.7;
  letter-spacing: -.01em; text-align: justify; text-justify: inter-word;
  color: rgba(255,255,255,.9); text-shadow: 0 1px 12px rgba(18,36,60,.5);
}

@media (max-width: 639px) {
  .bio-title { margin-bottom: 20px; }
  .bio-p { font-size: .9rem; text-align: left; line-height: 1.75; margin-bottom: 18px; }
}

.bio-reveal {
  opacity: 0; transform: translateY(24px);
  transition: opacity .9s cubic-bezier(.16,1,.3,1), transform .9s cubic-bezier(.16,1,.3,1);
}
.bio-reveal.is-in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .bio-reveal { opacity: 1; transform: none; transition: none; }
}
`

/* Fades its child up the first time it scrolls into view */
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`bio-reveal${inView ? ' is-in' : ''}`}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </div>
  )
}

export default function Biography() {
  return (
    <section id="biography" className="bio-wrap" aria-labelledby="bio-title">
      <style>{CSS}</style>
      <div className="bio-inner">
        <Reveal>
          <h2 id="bio-title" className="bio-title">Biography</h2>
        </Reveal>

        {PARAGRAPHS.map((text, i) => (
          <Reveal key={i} delay={i * 0.1}>
            <p className="bio-p">{text}</p>
          </Reveal>
        ))}
      </div>
    </section>
  )
}