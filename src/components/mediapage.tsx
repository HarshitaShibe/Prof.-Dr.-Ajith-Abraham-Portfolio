import { useEffect, useRef, useState } from 'react'
import DriftWall, { WALL_ITEMS } from './driftwall'

/* ==========================================================================
   Media page: the whole page is the DriftWall of photos, edge to edge.
   Photos come from public/wall/ (see driftwall.tsx for the count).
   ========================================================================== */

const CSS = `
.md-wrap { position: relative; width: 100%; height: 100vh; height: 100svh; overflow: hidden; background: #24476B; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
.md-over { position: absolute; inset: 0; z-index: 2; pointer-events: none; text-align: center; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 24px;
  background: radial-gradient(ellipse 60% 22% at 50% 50%, rgba(36,71,107,.5) 0%, rgba(36,71,107,.34) 55%, rgba(36,71,107,0) 100%); }
@media (min-width: 640px) { .md-over { padding: 0 56px; } }
.md-title { margin: 0; font-size: clamp(1.5rem, 3vw, 2.1rem); font-weight: 600; line-height: 1.12; letter-spacing: -.04em; color: #fff; text-wrap: balance; }
.md-sub { margin: 14px auto 0; max-width: 560px; font-size: .8rem; font-style: italic; font-weight: 300; line-height: 1.65; color: rgba(255,255,255,.88); text-wrap: balance; }
@media (min-width: 640px) { .md-sub { font-size: .9rem; } }
@media (max-width: 639px) {
  .md-over { padding: 0 20px; background: radial-gradient(ellipse 90% 15% at 50% 50%, rgba(36,71,107,.55) 0%, rgba(36,71,107,.38) 60%, rgba(36,71,107,0) 100%); }
  .md-title { font-size: 2.1rem; }
  .md-sub { margin-top: 14px; font-size: 1.02rem; line-height: 1.6; max-width: 350px; color: rgba(255,255,255,.94); }
}
.md-links { background: #24476B; color: #fff; padding: 72px 24px 72px; font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif; }
.md-lh { margin: 0 0 40px; color: #fff; text-align: center; font-size: clamp(1.4rem, 2.6vw, 1.8rem); font-weight: 600; letter-spacing: -.04em; }
.md-grid { max-width: 1040px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.md-eb { display: inline-flex; align-items: center; gap: 8px; margin: 0 auto 18px; padding: 6px 16px; border-radius: 999px; font-size: .78rem; font-weight: 500;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.2); color: #fff; }
.md-top { text-align: center; }
.md-card { display: flex; flex-direction: column; gap: 10px; padding: 30px 28px; border-radius: 28px; text-decoration: none; color: #fff;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.22); opacity: 0; transform: translateY(18px);
  transition: opacity .6s cubic-bezier(.22,1,.36,1), transform .25s cubic-bezier(.22,1,.36,1), background .2s, box-shadow .2s; }
.md-grid.in .md-card { opacity: 1; transform: none; }
.md-grid.in .md-card:nth-child(2) { transition-delay: .08s, 0s, 0s, 0s; }
.md-grid.in .md-card:nth-child(3) { transition-delay: .16s, 0s, 0s, 0s; }
.md-grid.in .md-card:hover, .md-grid.in .md-card:focus-visible { background: rgba(255,255,255,.15); transform: scale(1.03); box-shadow: 0 0 0 4px rgba(255,255,255,.14); outline: none; transition-delay: 0s; }
.md-ic { display: inline-flex; width: 48px; height: 48px; align-items: center; justify-content: center; border-radius: 14px; background: rgba(255,255,255,.14); }
.md-ct { font-size: 1rem; font-weight: 600; letter-spacing: -.01em; margin-top: 4px; }
.md-cd { font-size: .82rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,.85); }
.md-go { margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 999px; font-size: .78rem; font-weight: 500; background: #fff; color: #24476B; }
.md-arr { display: inline-block; transition: transform .15s; }
.md-card:hover .md-arr { transform: translate(3px,-3px); }
@media (prefers-reduced-motion: reduce) { .md-card { opacity: 1; transform: none; transition: none; } }
@media (max-width: 860px) { .md-grid { grid-template-columns: 1fr; max-width: 460px; } .md-links { padding: 56px 20px 72px; } }
`

const YT = (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.900.5A3 3 0 0 0 1 7.200C.5 9.100.5 12 .5 12s0 2.900.5 4.800a3 3 0 0 0 2.100 2.100c1.900.5 8.900.5 8.900.5s7 0 8.900-.5a3 3 0 0 0 2.100-2.100c.5-1.900.5-4.800.5-4.800s0-2.900-.5-4.800ZM9.800 15.500v-7l6 3.500-6 3.500Z"/></svg>
)
const LI = (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.400 20.400h-3.500v-5.600c0-1.300 0-3-1.800-3s-2.100 1.400-2.100 2.900v5.700H9.500V9h3.400v1.600h.1c.5-.9 1.600-1.800 3.400-1.800 3.600 0 4.300 2.400 4.300 5.500v6.100ZM5.300 7.400a2 2 0 1 1 0-4.100 2 2 0 0 1 0 4.100ZM7.100 20.400H3.600V9h3.500v11.400Z"/></svg>
)
const LINKS = [
  { href: 'https://www.youtube.com/@ajith_abraham', icon: YT, title: 'YouTube Channel', desc: 'Talks, lectures and conversations from Prof. Ajith Abraham.', cta: 'Watch on YouTube' },
  { href: 'https://www.linkedin.com/posts/ajithabraham_artificialintelligence-researchcollaboration-activity-7482763604186812417-U-ao', icon: LI, title: 'LinkedIn Post', desc: 'Artificial intelligence and research collaboration.', cta: 'View on LinkedIn' },
  { href: 'https://www.linkedin.com/posts/ajithabraham_activity-7491104519578148864-ynSd', icon: LI, title: 'LinkedIn Post', desc: 'Latest update shared by Prof. Ajith Abraham.', cta: 'View on LinkedIn' },
]

export default function MediaPage() {
  // fewer, narrower columns on phones so the photos stay a good size
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    document.documentElement.classList.add('on-media')
    return () => document.documentElement.classList.remove('on-media')
  }, [])

  const gridRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = gridRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <main id="media-page" aria-labelledby="md-title">
      <style>{CSS}</style>
      <section className="md-wrap">
      <div className="md-over">
        <h1 id="md-title" className="md-title">Moments &amp; Milestones</h1>
        <p className="md-sub">Conferences, awards and collaborations from nearly three decades of research and academic leadership across the world.</p>
      </div>
      <DriftWall
        items={WALL_ITEMS}
        columns={phone ? 1 : 9}
        tileWidth={phone ? 320 : 240}
        tileHeight={phone ? 210 : 132}
        gap={phone ? 22 : 18}
        tilt={phone ? 0 : 16}
        turn={phone ? 0 : -14}
        perspective={1200}
        depth={phone ? 0 : 120}
        speed={phone ? 38 : 42}
        direction="up"
        variance={phone ? 0 : 0.45}
        parallax={phone ? 0 : 0.6}
        lift={phone ? 0 : 64}
        fade={0.3}
        dim={phone ? 0.8 : 0.92}
        overlayColor="#24476B"
      />
      </section>
      <section className="md-links" aria-label="Watch and follow">
        <h2 className="md-lh">Watch &amp; Follow</h2>
        <div ref={gridRef} className={'md-grid' + (shown ? ' in' : '')}>
          {LINKS.map((l) => (
            <a key={l.href} className="md-card" href={l.href} target="_blank" rel="noopener noreferrer">
              <span className="md-ic" aria-hidden="true">{l.icon}</span>
              <span className="md-ct">{l.title}</span>
              <span className="md-cd">{l.desc}</span>
              <span className="md-go">{l.cta} <span className="md-arr" aria-hidden="true">↗</span></span>
            </a>
          ))}
        </div>
      </section>
    </main>
  )
}