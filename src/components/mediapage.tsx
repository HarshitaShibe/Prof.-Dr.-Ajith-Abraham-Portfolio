import { useEffect, useState } from 'react'
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
`

export default function MediaPage() {
  // fewer, narrower columns on phones so the photos stay a good size
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  return (
    <main id="media-page" className="md-wrap" aria-labelledby="md-title">
      <style>{CSS}</style>
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
    </main>
  )
}