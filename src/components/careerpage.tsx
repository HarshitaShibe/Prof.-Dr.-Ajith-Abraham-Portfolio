import { useEffect, useRef, useState } from 'react'
import career from '../data/career.json'
import { GridPulse } from '../components/GridPulse'

/* ==========================================================================
   Career page (opens when "Career" is clicked in the Navbar or Footer).
   Top: centred heading + 2 CTAs (view / download resume) over the GridPulse
   background. Below: a vertical timeline. Where several roles were held at one
   university, they are grouped LinkedIn-style (latest first).

   All entries live in src/data/career.json. An entry is either
     { period, role, institution, current? }              (a single role)
     { period, institution, roles: [{ period, role }] }   (roles grouped under one university)
   ========================================================================== */

interface Role {
  period: string
  role: string
}
interface Entry {
  period: string
  institution: string
  role?: string
  roles?: Role[]
  current?: boolean
  /** path(s) under public/, e.g. "/logos/sai-university.png" */
  logo?: string | string[]
}

const ENTRIES = career.entries as Entry[]

// PDF sits in the project's public/ folder, so it is served from "/".
const CV_URL = '/Ajith-Abraham-CV.pdf'

const CSS = `
.cr-wrap {
  position: relative; isolation: isolate; min-height: 100svh; box-sizing: border-box; color: #24476B; background: #EEF4FA; overflow-x: clip;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

/* ---- Top: heading + CTAs over the grid ---- */
.cr-hero {
  position: relative; z-index: 1; isolation: isolate; overflow: hidden; box-sizing: border-box;
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center; text-align: left;
  min-height: 100svh; padding: 130px 24px 72px;
}
@media (min-width: 640px) { .cr-hero { padding: 170px 56px 110px; } }
.cr-hero-in { position: relative; z-index: 1; max-width: 1100px; display: flex; flex-direction: column; align-items: flex-start; }

.cr-title {
  margin: 0; font-size: clamp(2.4rem, 6vw, 5rem); font-weight: 500;
  line-height: 1.02; letter-spacing: -.045em; color: #24476B; text-align: left;
}

.cr-ctas { margin-top: 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-start; gap: 12px; }
.cr-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; height: 30px; padding: 0 12px;
  border-radius: 9px; font-family: inherit; font-size: .7rem; font-weight: 500; text-decoration: none; white-space: nowrap;
  transition: background-color .25s, border-color .25s, color .25s;
}
.cr-btn svg { width: 13px; height: 13px; flex-shrink: 0; }
.cr-btn:focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
/* both buttons: same dark blue; on hover they turn white with a blue border */
.cr-primary, .cr-ghost { background: #24476B; border: 1px solid #24476B; color: #fff; }
.cr-primary:hover, .cr-ghost:hover { background: #fff; border-color: #24476B; color: #24476B; }

/* ---- Timeline ---- */
.cr-body { position: relative; z-index: 1; padding: 24px 22px 72px; }
@media (min-width: 640px) { .cr-body { padding: 40px 56px 110px; } }

.tl { --date-w: 170px; --gap: 56px; margin: 0; padding: 0; list-style: none; max-width: 1100px; }

.tl-item { position: relative; padding: 0 0 40px 30px; }
.tl-item::before {            /* the thin vertical line */
  content: ''; position: absolute; left: 5px; top: 14px; bottom: -10px; width: 1px;
  background: rgba(36,71,107,.3);
}
.tl-item:last-child { padding-bottom: 0; }
.tl-item:last-child::before { display: none; }
/* dark fill that follows the scroll: grows down the line, dots turn dark once reached */
.tl-item::after {
  content: ''; position: absolute; left: 4.5px; top: 14px; bottom: -10px; width: 2px; background: #24476B;
  transform-origin: top; transform: scaleY(var(--fill, 0)); transition: transform .15s linear;
}
.tl-item:last-child::after { display: none; }
.tl-item.is-reached .tl-dot { background: #24476B; }
.tl-dot {                     /* the small marker */
  z-index: 1; transition: background-color .3s, box-shadow .3s;
  position: absolute; left: 0; top: 6px; width: 11px; height: 11px; box-sizing: border-box;
  border-radius: 50%; background: #EEF4FA; border: 2px solid #24476B;
}
.tl-item.is-current .tl-dot { background: #24476B; box-shadow: 0 0 0 4px rgba(36,71,107,.18); }

.tl-date { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 6px;
  font-size: .85rem; font-weight: 500; line-height: 1.4; color: #3a5f86; }
.tl-now { padding: 2px 10px; border-radius: 999px; background: #24476B; color: #fff; font-size: .68rem; font-weight: 600; letter-spacing: .02em; }

.tl-role { margin: 0; font-size: 1.1rem; font-weight: 600; line-height: 1.35; letter-spacing: -.01em; color: #24476B; }
.tl-inst { margin: 4px 0 0; font-size: .88rem; font-weight: 400; line-height: 1.5; color: #2f4d68; }

@media (min-width: 760px) {
  .tl-item { display: grid; grid-template-columns: var(--date-w) 1fr; column-gap: var(--gap); padding-left: 0; }
  .tl-item::before { left: calc(var(--date-w) + var(--gap) / 2); }
  .tl-item::after { left: calc(var(--date-w) + var(--gap) / 2 - .5px); }
  .tl-dot { left: calc(var(--date-w) + var(--gap) / 2 - 5.5px); }
  .tl-date { justify-content: flex-end; text-align: right; margin: 2px 0 0; }
}

/* ---- University logos ---- */
.tl-main { display: flex; align-items: center; }
.tl-main.is-grouped { align-items: flex-start; }
.tl-logos { display: flex; gap: 8px; flex-shrink: 0; }
.tl-logos:not(:empty) { margin-right: 18px; }
.tl-logo {
  width: 96px; height: 96px; box-sizing: border-box; padding: 10px; border-radius: 12px; background: #fff;
  border: 1px solid rgba(36,71,107,.22); box-shadow: 0 10px 22px -14px rgba(36,71,107,.45);
  display: flex; align-items: center; justify-content: center;
}
.tl-logo img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; }
.tl-text { min-width: 0; }

/* Phones: logo above the text so the text gets the full width */
@media (max-width: 759px) {
  .tl-item { padding-left: 26px; }
  .tl-main, .tl-main.is-grouped { flex-direction: column; align-items: flex-start; }
  .tl-logos:not(:empty) { margin: 0 0 12px; }
  .tl-logo { width: 72px; height: 72px; padding: 8px; border-radius: 10px; }
  .tl-text { width: 100%; }
  .tl-role { font-size: 1.02rem; }
  .gp-title { font-size: .92rem; }
}

/* Phones: larger title, resume actions as underlined text links */
@media (max-width: 639px) {
  .cr-title { font-size: 3.4rem; }
  .cr-ctas { margin-top: 34px; gap: 14px 24px; }
  .cr-btn { height: auto; padding: 2px 0; border: 0; border-radius: 0; background: none; color: #24476B; font-size: .8rem;
    text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 5px; text-decoration-color: rgba(36,71,107,.55); }
  .cr-primary:hover, .cr-ghost:hover { background: none; border: 0; color: #24476B; text-decoration-color: #24476B; }
}

/* ---- Several roles at one university (LinkedIn style) ---- */
.gp-roles { margin: 12px 0 0; padding: 0; list-style: none; }
.gp-role { position: relative; padding: 0 0 16px 22px; }
.gp-role:last-child { padding-bottom: 0; }
.gp-role::before {            /* small marker */
  content: ''; position: absolute; left: 0; top: 7px; width: 8px; height: 8px; box-sizing: border-box;
  border-radius: 50%; border: 2px solid #24476B; background: #EEF4FA; transition: background-color .3s;
}
.gp-role.is-reached::before { background: #24476B; }
.gp-role::after {             /* thin line joining the roles */
  content: ''; position: absolute; left: 3.5px; top: 18px; bottom: -3px; width: 1px;
  background: linear-gradient(#24476B, #24476B) top / 100% calc(var(--fill, 0) * 100%) no-repeat, rgba(36,71,107,.3);
}
.gp-role:last-child::after { display: none; }
.gp-title { margin: 0; font-size: .95rem; font-weight: 600; line-height: 1.4; color: #24476B; }
.gp-period { margin: 2px 0 0; font-size: .8rem; font-weight: 400; line-height: 1.4; color: #3a5f86; }
`

function LogoImg({ src }: { src: string }) {
  const [ok, setOk] = useState(true)
  if (!ok) return null // file missing -> show nothing instead of a broken icon
  return (
    <span className="tl-logo">
      <img src={src} alt="" loading="lazy" decoding="async" draggable={false} onError={() => setOk(false)} />
    </span>
  )
}
function Logos({ logo }: { logo?: string | string[] }) {
  const list = !logo ? [] : Array.isArray(logo) ? logo : [logo]
  return <div className="tl-logos">{list.map((src) => <LogoImg key={src} src={src} />)}</div>
}

export default function CareerPage() {
  const listRef = useRef<HTMLOListElement>(null)

  // Scroll progress: the lines fill dark going down and each dot (main and small role dots) turns dark once reached.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const items = Array.from(list.querySelectorAll<HTMLElement>('.tl-item, .gp-role'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => {
        el.style.setProperty('--fill', '1')
        el.classList.add('is-reached')
      })
      return
    }
    let raf = 0
    const update = () => {
      raf = 0
      const trigger = window.innerHeight * 0.6
      items.forEach((el) => {
        const r = el.getBoundingClientRect()
        const p = Math.min(1, Math.max(0, (trigger - r.top) / r.height))
        el.style.setProperty('--fill', p.toFixed(3))
        el.classList.toggle('is-reached', r.top + 12 < trigger)
      })
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Tells the shared Navbar, Footer and Back-to-top to switch to their dark look, only while this page is open.
  useEffect(() => {
    document.documentElement.classList.add('on-career')
    return () => document.documentElement.classList.remove('on-career')
  }, [])

  return (
    <main id="career" className="cr-wrap" aria-labelledby="cr-title">
      <style>{CSS}</style>

      <section className="cr-hero">
        <GridPulse />

        <div className="cr-hero-in">
          <h1 id="cr-title" className="cr-title" data-grid-avoid>
            Career &amp; Leadership
          </h1>

          <div className="cr-ctas">
            <a className="cr-btn cr-primary" href={CV_URL} target="_blank" rel="noopener noreferrer" data-grid-avoid>
              View Resume
            </a>
            <a className="cr-btn cr-ghost" href={CV_URL} download target="_blank" rel="noopener noreferrer" data-grid-avoid>
              Download Resume
            </a>
          </div>
        </div>
      </section>

      <div className="cr-body">
        <ol className="tl" ref={listRef}>
          {ENTRIES.map((e) => (
            <li key={`${e.period}-${e.institution}`} className={`tl-item${e.current ? ' is-current' : ''}`}>
              <span className="tl-dot" aria-hidden="true" />

              <div className="tl-date">
                {e.period}
              </div>

              <div className={`tl-main${e.roles ? ' is-grouped' : ''}`}>
                <Logos logo={e.logo} />
                <div className="tl-text">
                    {e.roles ? (
                      <div>
                        <h2 className="tl-role">{e.institution}</h2>
                        <ul className="gp-roles">
                          {e.roles.map((r) => (
                            <li key={`${r.period}-${r.role}`} className="gp-role">
                              <p className="gp-title">{r.role}</p>
                              <p className="gp-period">{r.period}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div>
                        <h2 className="tl-role">{e.role}</h2>
                        <p className="tl-inst">{e.institution}</p>
                      </div>
                    )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </main>
  )
}