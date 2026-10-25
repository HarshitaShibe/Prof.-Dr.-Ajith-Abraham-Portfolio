import { useEffect, useState } from 'react'

/* ==========================================================================
   Back-to-top button: a round light-blue button (same #DCE8F1 as the cards)
   that fades in once the visitor scrolls below the hero and scrolls the page
   back to the top when clicked.
   ========================================================================== */

const CSS = `
.bt-btn {
  position: fixed; right: 20px; bottom: 20px; z-index: 30;
  width: 32px; height: 32px; padding: 0; border: 0; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  background: #DCE8F1; color: #24476B;
  box-shadow: 0 10px 24px -10px rgba(18,36,60,.55);
  opacity: 0; visibility: hidden; transform: translateY(12px);
  transition: opacity .35s ease, transform .35s cubic-bezier(.16,1,.3,1), visibility .35s, background-color .25s;
}
@media (min-width: 640px) { .bt-btn { right: 28px; bottom: 28px; width: 36px; height: 36px; } }
.bt-btn.is-shown { opacity: 1; visibility: visible; transform: none; }
.bt-btn:hover { background: #fff; }
.bt-btn:active { transform: scale(.94); }
.bt-btn:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.bt-btn svg { width: 15px; height: 15px; }

/* Career page only (html.on-career): dark button on the light background */
.on-career .bt-btn { background: #24476B; color: #fff; }
.on-publications .bt-btn { background: #24476B; color: #fff; }
.on-journals .bt-btn { background: #24476B; color: #fff; }
.on-contact .bt-btn { background: #24476B; color: #fff; }
.on-career .bt-btn:hover { background: #1b3652; }
.on-publications .bt-btn:hover { background: #1b3652; }
.on-journals .bt-btn:hover { background: #1b3652; }
.on-contact .bt-btn:hover { background: #1b3652; }
.on-career .bt-btn:focus-visible { outline-color: #24476B; }
.on-publications .bt-btn:focus-visible { outline-color: #24476B; }
.on-journals .bt-btn:focus-visible { outline-color: #24476B; }
.on-contact .bt-btn:focus-visible { outline-color: #24476B; }
@media (prefers-reduced-motion: reduce) { .bt-btn { transition: opacity .2s; transform: none; } }
`

export default function BackToTop() {
  const [shown, setShown] = useState(false)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      // show once the visitor has scrolled past most of the first screen (the hero)
      setShown(window.scrollY > window.innerHeight * 0.8)
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

  const goTop = () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <>
      <style>{CSS}</style>
      <button
        type="button"
        className={`bt-btn${shown ? ' is-shown' : ''}`}
        onClick={goTop}
        aria-label="Back to top"
        tabIndex={shown ? 0 : -1}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
    </>
  )
}