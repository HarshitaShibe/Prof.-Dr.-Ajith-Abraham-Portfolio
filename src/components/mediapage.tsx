import { useEffect, useRef, useState } from 'react'
import DriftWall, { WALL_ITEMS } from './driftwall'
import { BrandBadge } from './brandicons'

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
.md-ic { display: inline-flex; }
.md-ct { font-size: 1rem; font-weight: 600; letter-spacing: -.01em; margin-top: 4px; }
.md-cd { font-size: .82rem; font-weight: 300; line-height: 1.6; color: rgba(255,255,255,.85); }
.md-go { margin-top: auto; align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 12px; font-size: .7rem; font-weight: 500; background: #fff; color: #24476B; }
.md-arr { display: inline-block; transition: transform .15s; }
.md-card:hover .md-arr { transform: translate(3px,-3px); }
@media (max-width: 639px) { .md-go { padding: 5px 10px; font-size: .64rem; gap: 5px; border-radius: 10px; } }
@media (prefers-reduced-motion: reduce) { .md-card { opacity: 1; transform: none; transition: none; } }
@media (max-width: 860px) { .md-grid { grid-template-columns: 1fr; max-width: 460px; } .md-links { padding: 56px 20px 72px; } }
/* Hovering (or focusing) a photo on the drifting wall enlarges it */
.on-media .drift-wall__tile.is-active .drift-wall__inner,
.on-media .drift-wall__tile:focus-visible .drift-wall__inner { transform: translateZ(var(--dw-lift)) scale(1.16); }

/* ---- Scrollable photo strip below "Watch & Follow" ---- */
.md-gallery { background: #24476B; color: #fff; padding: 0 0 80px; font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif; }
.md-gallery .md-lh { margin: 0 0 28px; }
.md-strip { display: flex; gap: 18px; overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; padding: 4px 24px 6px; scrollbar-width: none; }
.md-strip::-webkit-scrollbar { display: none; }
.md-shot { flex: 0 0 auto; margin: 0; min-width: 180px; scroll-snap-align: center; border-radius: 18px; overflow: hidden; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.16); box-shadow: 0 16px 36px -18px rgba(0,0,0,.55); }
.md-shot img { display: block; width: auto; max-width: 78vw; height: 290px; object-fit: cover; transition: transform .45s cubic-bezier(.22,1,.36,1); }
.md-shot:hover img { transform: scale(1.06); }
.md-nav { display: flex; justify-content: center; gap: 14px; margin-top: 26px; }
.md-navbtn { width: 36px; height: 36px; border-radius: 50%; border: 1px solid rgba(255,255,255,.42); background: rgba(255,255,255,.08); color: #fff; font-size: 1.1rem; line-height: 1; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: background .2s, border-color .2s, transform .2s; }
.md-navbtn:hover { background: rgba(255,255,255,.18); border-color: rgba(255,255,255,.78); }
.md-navbtn:active { transform: scale(.93); }
.md-navbtn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
@media (max-width: 639px) { .md-shot { min-width: 140px; } .md-shot img { height: 200px; max-width: 80vw; } }
`

const LINKS = [
  { href: 'https://www.youtube.com/@ajith_abraham', icon: <BrandBadge brand="youtube" size={44} />, title: 'YouTube Channel', desc: 'Talks, lectures and conversations from Prof. Dr. Ajith Abraham.', cta: 'Watch on YouTube' },
  { href: 'https://www.linkedin.com/posts/ajithabraham_artificialintelligence-researchcollaboration-activity-7482763604186812417-U-ao', icon: <BrandBadge brand="linkedin" size={44} />, title: 'LinkedIn Post', desc: 'Artificial intelligence and research collaboration.', cta: 'View on LinkedIn' },
  { href: 'https://www.linkedin.com/posts/ajithabraham_activity-7491104519578148864-ynSd', icon: <BrandBadge brand="linkedin" size={44} />, title: 'LinkedIn Post', desc: 'Latest update shared by Prof. Dr. Ajith Abraham.', cta: 'View on LinkedIn' },
]

/* The gallery strip below "Watch & Follow": every photo in public/wall/ (1.jpg ... 141.jpg) */
export const TOTAL_PHOTOS = 141
const PHOTOS = Array.from({ length: TOTAL_PHOTOS }, (_, i) => `/wall/${i + 1}.jpg`)

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

  // desktop: size the tiles so exactly 4 columns fit across the screen (the wall is drawn at 1.18x)
  const [vw, setVw] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1440))
  useEffect(() => {
    const on = () => setVw(window.innerWidth)
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  const WALL_GAP = 14
  const tileW = phone ? 320 : Math.max(180, Math.round(vw / 4 / 1.18 - WALL_GAP))
  const tileH = phone ? 210 : Math.round(tileW * 0.66)

  const gridRef = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = gridRef.current
    if (!el || typeof IntersectionObserver === 'undefined') { setShown(true); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShown(true); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const stripRef = useRef<HTMLDivElement>(null)
  const scrollStrip = (dir: number) => {
    const el = stripRef.current
    if (!el) return
    const first = el.querySelector('.md-shot') as HTMLElement | null
    const step = first ? first.offsetWidth + 18 : Math.round(el.clientWidth * 0.9)
    el.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

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
        columns={phone ? 1 : 6}
        tileWidth={tileW}
        tileHeight={tileH}
        radius={4}
        gap={phone ? 22 : WALL_GAP}
        tilt={0}
        turn={0}
        perspective={1200}
        depth={0}
        speed={phone ? 12 : 13}
        direction="up"
        variance={phone ? 0 : 0.3}
        parallax={0}
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

      <section className="md-gallery" aria-label="Photo gallery">
        <h2 className="md-lh">Gallery</h2>
        <div className="md-strip" ref={stripRef}>
          {PHOTOS.map((src, i) => (
            <figure className="md-shot" key={src}>
              <img src={src} alt={`Moment ${i + 1}`} loading={i < 3 ? 'eager' : 'lazy'} decoding="async" />
            </figure>
          ))}
        </div>
        <div className="md-nav">
          <button type="button" className="md-navbtn" aria-label="Previous photos" onClick={() => scrollStrip(-1)}>&lsaquo;</button>
          <button type="button" className="md-navbtn" aria-label="Next photos" onClick={() => scrollStrip(1)}>&rsaquo;</button>
        </div>
      </section>
    </main>
  )
}