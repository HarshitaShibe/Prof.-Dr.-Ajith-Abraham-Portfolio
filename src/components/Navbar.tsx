import { useEffect, useState, type CSSProperties, type MouseEvent } from 'react'
import { motion } from 'motion/react'

/* ==========================================================================
   Floating navbar: logo + name on the left, a smaller glass pill centred on
   the page. Active tab follows the section in view (scroll-spy).
   Styles are plain CSS (injected below), so no Tailwind is needed.
   ========================================================================== */

const PJS = '"Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
const EASE = [0.16, 1, 0.3, 1] as const

const ITEMS = [
  { label: 'Career and Leadership', id: 'career' },
  { label: 'Publications', id: 'publications' },
  { label: 'Journals and Publishers', id: 'journals' },
  { label: 'Contact', id: 'contact' },
]

const CSS = `
.nv-header {
  position: fixed; left: 0; right: 0; top: 30px; z-index: 50;
  padding: 0 14px; font-family: ${PJS};
  box-sizing: border-box;
}
@media (min-width: 640px) { .nv-header { top: 34px; padding: 0 20px; } }

.nv-row {
  position: relative; max-width: 1200px; margin: 0 auto;
  display: flex; align-items: center; justify-content: space-between; min-height: 32px;
}

/* Logo + name (left) */
.nv-brand {
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  text-decoration: none; color: #fff;
  transition: opacity .3s ease, transform .3s ease, visibility .3s;
}
/* the name is only shown on the hero; it fades out once the visitor scrolls past it */
.nv-brand.is-hidden { opacity: 0; visibility: hidden; pointer-events: none; transform: translateY(-6px); }
.nv-name {
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: .8rem; font-weight: 500; font-style: normal;
  letter-spacing: -.01em; color: #fff; white-space: nowrap;
  text-shadow: 0 2px 10px rgba(18,36,60,.6);
}

/* Glass pill (centred on the page) */
.nv-nav {
  position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
  min-width: 0; max-width: calc(100% - 64px);
}
.nv-pill {
  list-style: none; margin: 0; padding: 2px;
  display: flex; align-items: center;
  overflow-x: auto; scrollbar-width: none;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.16);
  background: linear-gradient(135deg, rgba(36,71,107,.5) 0%, rgba(36,71,107,.3) 100%);
  backdrop-filter: blur(22px) saturate(180%);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  box-shadow:
    0 10px 30px -10px rgba(18,36,60,.6),
    inset 0 1px 0 rgba(255,255,255,.22);
}
.nv-pill::-webkit-scrollbar { display: none; }
.nv-item { display: flex; align-items: center; flex-shrink: 0; }
.nv-sep {
  width: 1px; height: 12px; margin: 0 1px;
  background: rgba(255,255,255,.35);
  transition: opacity .3s;
}
.nv-link {
  position: relative; display: block; white-space: nowrap;
  padding: 4px 9px; border-radius: 999px;
  font-size: .66rem; font-weight: 400; text-decoration: none;
  color: rgba(255,255,255,.92);
  text-shadow: 0 1px 8px rgba(18,36,60,.5);
  transition: color .3s;
}
.nv-link:hover { color: #fff; }
.nv-link.is-active { color: #fff; }
.nv-link-bg {
  position: absolute; inset: 0; border-radius: 999px;
  background: #24476B;
  border: 1px solid rgba(255,255,255,.3);
  box-shadow: 0 6px 18px -6px rgba(18,36,60,.7), inset 0 1px 0 rgba(255,255,255,.3);
}
.nv-link-text { position: relative; z-index: 1; }
@media (min-width: 640px) { .nv-link { padding: 4px 10px; font-size: .68rem; } }

/* Career page only (html.on-career): dark brand text + darker pill, for the light background */
.on-career .nv-brand .nv-name { color: #24476B; text-shadow: none; font-weight: 600; }
/* Publications page only: brand name in the hero blue */
.on-career .nv-pill {
  background: #24476B;
  border-color: rgba(255,255,255,.14);
}

/* Publications page only: after the hero, the pill turns dark and the name stays visible in dark blue */
.on-publications .nv-header.is-scrolled .nv-pill, .on-journals .nv-header.is-scrolled .nv-pill { background: #24476B; border-color: rgba(255,255,255,.14); }

/* ---- Phones and small tablets (below 768px): the pill becomes a menu button + dropdown ---- */
.nv-burger, .nv-menu { display: none; }
@media (max-width: 767px) {
  .nv-nav { display: none; }
  .nv-name { font-size: .78rem; }
  .nv-burger {
    display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
    width: 38px; height: 38px; padding: 0; margin: 0; border-radius: 50%; cursor: pointer; flex-shrink: 0;
    background: #24476B; border: 1px solid rgba(255,255,255,.28); box-shadow: 0 8px 22px -10px rgba(18,36,60,.8), inset 0 1px 0 rgba(255,255,255,.25);
    -webkit-tap-highlight-color: transparent;
  }
  .nv-burger:focus-visible { outline: 2px solid #cdd9ff; outline-offset: 3px; }
  .nv-burger span { display: block; width: 16px; height: 1.5px; border-radius: 2px; background: #fff; transition: transform .3s cubic-bezier(.16,1,.3,1), opacity .2s; }
  .nv-burger.is-open span:nth-child(1) { transform: translateY(5.5px) rotate(45deg); }
  .nv-burger.is-open span:nth-child(2) { opacity: 0; }
  .nv-burger.is-open span:nth-child(3) { transform: translateY(-5.5px) rotate(-45deg); }

  .nv-menu {
    display: flex; flex-direction: column; gap: 2px; position: absolute; right: 0; top: calc(100% + 10px);
    width: min(280px, 100%); margin: 0; padding: 8px; list-style: none; box-sizing: border-box;
    border-radius: 20px; background: #24476B; border: 1px solid rgba(255,255,255,.2);
    box-shadow: 0 22px 44px -16px rgba(18,36,60,.85), inset 0 1px 0 rgba(255,255,255,.2);
    opacity: 0; visibility: hidden; transform: translateY(-8px) scale(.98); transform-origin: top right; pointer-events: none;
    transition: opacity .25s ease, transform .3s cubic-bezier(.16,1,.3,1), visibility .25s;
  }
  .nv-menu.is-open { opacity: 1; visibility: visible; transform: none; pointer-events: auto; }
  .nv-menu a {
    display: block; padding: 13px 16px; border-radius: 14px; color: rgba(255,255,255,.9); text-decoration: none;
    font-size: .86rem; font-weight: 400; -webkit-tap-highlight-color: transparent; transition: background-color .2s, color .2s;
  }
  .nv-menu a:hover, .nv-menu a:active { background: rgba(255,255,255,.1); color: #fff; }
  .nv-menu a.is-active { background: rgba(255,255,255,.16); color: #fff; font-weight: 500; }
  .nv-menu a:focus-visible { outline: 2px solid #cdd9ff; outline-offset: -2px; }
}
@media (prefers-reduced-motion: reduce) { .nv-menu, .nv-burger span { transition: none; } }
}
`

// Scroll to a section so its heading lands just under the floating navbar
const PAGES = ['career', 'publications', 'journals', 'contact']
const goTo = (id: string) => (e: MouseEvent<HTMLAnchorElement>) => {
  if (PAGES.includes(id)) return // separate pages: let the hash change open them
  const el = document.getElementById(id)
  if (!el) return
  e.preventDefault()
  const top = el.getBoundingClientRect().top + window.scrollY - 96
  window.scrollTo({ top, behavior: 'smooth' })
  window.history.replaceState(null, '', `#${id}`)
}

export default function Navbar() {
  const [active, setActive] = useState('')
  const [pastHero, setPastHero] = useState(false)
  const [brandOpacity, setBrandOpacity] = useState(1)
  const [open, setOpen] = useState(false)

  // Hide the name on the left once the visitor has scrolled past the hero
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      setPastHero(window.scrollY > window.innerHeight * 0.8)
      // the name fades out gradually as the hero scrolls away (gone after about half a screen)
      setBrandOpacity(Math.max(0, 1 - window.scrollY / (window.innerHeight * 0.5)))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Separate pages: the tab is active only while that page is open (clears when we go back to the top / home)
  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1)
      if (PAGES.includes(h)) setActive(h)
      else setActive('')
      setOpen(false)
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  // Mobile menu: closes on Escape, on a tap outside, or when the screen grows to desktop width
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const onDown = (e: PointerEvent) => {
      if (!(e.target as Element).closest('.nv-menu, .nv-burger')) setOpen(false)
    }
    const onResize = () => window.innerWidth >= 768 && setOpen(false)
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    window.addEventListener('resize', onResize)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
      window.removeEventListener('resize', onResize)
    }
  }, [open])

  // Scroll-spy: jo section screen ke beech mein ho, uska tab active ho
  useEffect(() => {
    const sections = ITEMS.map((i) => document.getElementById(i.id)).filter(
      (el): el is HTMLElement => el !== null,
    )
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id)
        })
      },
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  return (
    <header className={`nv-header${pastHero ? ' is-scrolled' : ''}`}>
      <style>{CSS}</style>
      <div className="nv-row">
        <a
          href="#top"
          className={`nv-brand${pastHero || brandOpacity === 0 ? ' is-hidden' : ''}`}
          aria-label="Home"
          style={{ opacity: brandOpacity } as CSSProperties}
          tabIndex={pastHero || brandOpacity === 0 ? -1 : 0}
        >
          <span className="nv-name">Prof. Ajith Abraham</span>
        </a>

        <nav aria-label="Main navigation" className="nv-nav">
          <ul className="nv-pill">
            {ITEMS.map((item, i) => {
              const isActive = active === item.id
              const prevActive = i > 0 && active === ITEMS[i - 1].id
              return (
                <li key={item.id} className="nv-item">
                  {i > 0 && (
                    <span
                      aria-hidden="true"
                      className="nv-sep"
                      style={{ opacity: isActive || prevActive ? 0 : 1 } as CSSProperties}
                    />
                  )}
                  <a
                    href={`#${item.id}`}
                    onClick={(e) => {
                      setActive(item.id)
                      goTo(item.id)(e)
                    }}
                    aria-current={isActive ? 'true' : undefined}
                    className={`nv-link${isActive ? ' is-active' : ''}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="nav-pill"
                        className="nv-link-bg"
                        transition={{ type: 'spring', stiffness: 380, damping: 32, ease: EASE }}
                      />
                    )}
                    <span className="nv-link-text">{item.label}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </nav>

        <button
          type="button"
          className={`nv-burger${open ? ' is-open' : ''}`}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="nv-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul id="nv-menu" className={`nv-menu${open ? ' is-open' : ''}`}>
          {ITEMS.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                tabIndex={open ? 0 : -1}
                className={active === item.id ? 'is-active' : undefined}
                aria-current={active === item.id ? 'true' : undefined}
                onClick={(e) => {
                  setActive(item.id)
                  setOpen(false)
                  goTo(item.id)(e)
                }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}