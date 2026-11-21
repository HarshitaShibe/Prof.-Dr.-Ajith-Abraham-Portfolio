import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import Navbar from './components/Navbar'
import Stats from './components/Stats'
import Biography from './components/biography'
import Education from './components/education'
import KeyPillars from './components/keypillars'
import DriftWall, { WALL_ITEMS } from './components/driftwall'
import FundedAgencies from './components/fundedagencies'
import ResearchAreas from './components/researchareas'
import AcademicImpact from './components/academicimpact'
import CitationMetrics from './components/citationmetrics'
import Publications from './components/publications'
import Footer from './components/footer'
import Collaborations from './components/collaborations'
import CurrentFocus from './components/currentfocus'
import CareerPage from './components/careerpage'
import JournalsPage from './components/journalspage'
import ContactPage from './components/contactpage'
import ResearchOverview from './components/researchoverview'
import FundingPage from './components/fundingpage'
import EntrepreneurshipPage from './components/entrepreneurshippage'
import ResearchPage from './components/researchpage'
import MediaPage from './components/mediapage'
import BackToTop from './components/backtotop'
import home from './data/home.json'


// Apna asli Google Scholar profile link yahan paste kar dena.
const SCHOLAR_URL = 'https://scholar.google.com/scholar?q=Ajith+Abraham'

const SLIDES: { src: string; mo: Mo }[] = [
  { src: '/first_home.jpg', mo: 'zoomIn' },
  { src: '/Second_home.jpg', mo: 'panLeft' },
  { src: '/third_home.jpg', mo: 'zoomOut' },
  { src: '/fourth_home.jpg', mo: 'panRight' },
]

// Hero text (badge, name, topics, affiliations) lives in src/data/home.json
const TOPICS = home.topics
// Phones show a tighter version of the ranking line (same facts). Add "rankingShort" to home.json to override it.
const RANKING_SHORT =
  ((home as Record<string, unknown>).rankingShort as string | undefined) ??
  'Stanford–Elsevier World’s Top 2% Scientists: ranked within the top 0.037% of researchers worldwide for career-long scientific impact, and the top 0.118% globally for research performance in 2025.'
const TOPIC_MS = 2600 // ms: har topic kitni der dikhe

const HOLD = 7000 // ms: har photo kitni der rukti hai
const FADE = 1.4 // s: crossfade
const MOVE = (HOLD + FADE * 1000) / 1000 // s: slow camera move

type Mo = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight'
type Route = 'home' | 'career' | 'research' | 'funding' | 'entrepreneurship' | 'mostcited' | 'publications' | 'journals' | 'media' | 'contact'

function frame(mo: Mo, active: boolean) {
  const start = {
    zoomIn: { scale: 1, x: 0 },
    zoomOut: { scale: 1.08, x: 0 },
    panLeft: { scale: 1.06, x: 0 },
    panRight: { scale: 1.06, x: 0 },
  }[mo]
  const end = {
    zoomIn: { scale: 1.08, x: 0 },
    zoomOut: { scale: 1, x: 0 },
    panLeft: { scale: 1.06, x: -3 },
    panRight: { scale: 1.06, x: 3 },
  }[mo]
  return active ? end : start
}

/* ----- Icons (inline, koi library nahi) ----------------------------------- */
const Svg = ({ children }: { children: ReactNode }) => (
  <svg
    className="hm-icon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
)
const IconCap = () => (
  <Svg>
    <path d="M22 9 12 4 2 9l10 5 10-5Z" />
    <path d="M6 11.5V16c0 1.2 2.7 3 6 3s6-1.8 6-3v-4.5" />
  </Svg>
)
const IconArrow = () => (
  <Svg>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
const IconFile = () => (
  <Svg>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
    <path d="M14 3v5h5M9 13h6M9 17h6" />
  </Svg>
)
const IconMail = () => (
  <Svg>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
)

/* ----- Styles ------------------------------------------------------------- */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&display=swap');
:root, html, body { margin: 0; padding: 0; background: #24476B; }
/* no sideways scrollbar: anything slightly wider than the screen is clipped */
body { overflow-x: hidden; }
body { display: block; min-height: 0; }
#root { width: 100%; max-width: none; margin: 0; padding: 0; border: 0; text-align: left; display: flow-root; background: #24476B; }

.hm-hero, .hm-hero * { box-sizing: border-box; }
.hm-hero {
  position: relative; isolation: isolate; overflow: hidden;
  margin: 8px; height: calc(100svh - 16px); min-height: 600px;
  border-radius: 22px; background: #24476B; color: #fff; box-shadow: 0 30px 70px -30px rgba(18,36,60,.75);
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
@media (min-width: 640px) {
  .hm-hero { margin: 12px; height: calc(100svh - 24px); border-radius: 28px; }
}

.hm-slide { position: absolute; inset: 0; z-index: -3; will-change: transform, opacity;
  transition: opacity ${FADE}s ease-in-out, transform ${MOVE}s linear; }
.hm-slide img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }

.hm-ov { position: absolute; inset: 0; pointer-events: none; z-index: -2; }
.hm-ov1 { background: rgba(36,71,107,.5); }
.hm-ov2 { background: radial-gradient(60% 55% at 50% 50%, rgba(36,71,107,.28) 0%, rgba(36,71,107,.16) 55%, rgba(36,71,107,0) 100%); }
.hm-ov3 { background: linear-gradient(to top, rgba(36,71,107,.55) 0%, rgba(36,71,107,0) 45%), radial-gradient(120% 115% at 50% 45%, transparent 60%, rgba(18,36,60,.3) 100%); }

.hm-content { height: 100%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;
  padding: 5vh 25px 50px; }
@media (min-width: 640px) { .hm-content { padding: 5vh 58px 50px; } }
@media (min-width: 1024px) { .hm-content { padding-top: 1vh; } }
.hm-inner { width: 100%; max-width: 1100px; display: flex; flex-direction: column; align-items: center; text-align: center; }

.hm-in { opacity: 0; transform: translateY(16px); animation: hm-up .8s cubic-bezier(.16,1,.3,1) forwards; animation-delay: var(--d, 0s); }
@keyframes hm-up { to { opacity: 1; transform: none; } }

.hm-badge { display: inline-block; font-weight: 400; font-size: .78rem; letter-spacing: .02em; color: #fff;
  text-shadow: 0 2px 14px rgba(18,36,60,.9), 0 1px 3px rgba(18,36,60,.85); }

.hm-hero h1.hm-name { margin: 16px 0 0; padding-bottom: .18em; font-weight: 400; line-height: 1.12; letter-spacing: -.04em;
  font-size: clamp(2.1rem, 5.6vw, 4.1rem); text-align: center;
  background: linear-gradient(90deg, #fff 55%, #cdd9ff 100%); -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent; filter: drop-shadow(0 2px 12px rgba(18,36,60,.9)); }

.hm-tag { margin: 12px 0 0; display: flex; align-items: baseline; justify-content: center; gap: .35em; white-space: nowrap;
  font-size: min(1.15rem, 2.7vw); font-weight: 400; color: #fff; text-align: center;
  text-shadow: 0 2px 14px rgba(18,36,60,.9), 0 1px 3px rgba(18,36,60,.85); }
.hm-topic { display: inline-block; color: #cdd9ff; font-weight: 600; animation: hm-topic .4s cubic-bezier(.16,1,.3,1) both; }
@keyframes hm-topic { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

.hm-aff { list-style: none; margin: 18px 0 0; padding: 0; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.hm-aff li { display: flex; align-items: flex-start; justify-content: center; font-size: .76rem; font-weight: 400; color: #fff; text-align: center;
  text-shadow: 0 2px 14px rgba(18,36,60,.9), 0 1px 3px rgba(18,36,60,.85); }

.hm-icon { width: 17px; height: 17px; flex-shrink: 0; }

.hm-more { margin-top: 18px; max-width: 820px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.hm-more p { margin: 0; text-align: center; color: #fff; }
.hm-kw { font-size: .92rem; font-weight: 500; letter-spacing: .02em; color: #cdd9ff !important; }
.hm-exp { font-size: .92rem; font-weight: 400; }
.hm-rank { margin: 0 auto !important; max-width: 820px; font-size: .72rem; line-height: 1.55; font-weight: 300; font-style: italic; text-align: center; text-wrap: balance; color: rgba(255,255,255,.82) !important; }
.hm-pill-wrap { margin: 18px 0 0; display: flex; justify-content: center; }
.hm-pill { display: inline-flex; align-items: center; justify-content: center; text-align: center; width: min(560px, 92vw); min-height: 36px; padding: 7px 16px; box-sizing: border-box; border-radius: 7px; background: #fff; color: #24476B; font-size: .76rem; font-weight: 500; line-height: 1.3; overflow: hidden; }
.hm-rank-short { display: none; }
.hm-pill-txt { display: inline-block; animation: hm-topic .45s cubic-bezier(.16,1,.3,1) both; }
.hm-btns { margin-top: 32px; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 10px; }
.hm-btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px;
  border-radius: 10px; border: 1px solid #fff; background: #fff; color: #24476B; font: 600 .82rem inherit; font-family: inherit; text-decoration: none; white-space: nowrap;
  transition: background-color .3s, border-color .3s; }
.hm-btn:hover { background: #e3e8ff; border-color: #e3e8ff; }
.hm-btn:focus-visible { outline: 2px solid #cdd9ff; outline-offset: 2px; }

@media (min-width: 640px) {
  .hm-name-wrap { }
  .hm-hero h1.hm-name { margin-top: 16px; }
  .hm-badge { font-size: .85rem; }
  .hm-tag { margin-top: 12px; }
  .hm-aff { margin-top: 20px; }
  .hm-aff li { align-items: center; font-size: .86rem; }
  .hm-btns { margin-top: 40px; gap: 12px; }
  .hm-btn { height: 44px; padding: 0 20px; font-size: .88rem; }
}

/* Phones + tablets: the hero is a flex column (text block, then the stats strip in normal flow).
   Its height follows its content, so the text and the stats never overlap or drift on any screen. */
@media (max-width: 899px) {
  .hm-hero { display: flex; flex-direction: column; height: auto; min-height: calc(100svh - 16px); }
  /* equal breathing room above and below the text block: leftover height is split evenly between
     (navbar -> text) and (text -> stats) */
  .hm-content { height: auto; flex: 1 0 auto; padding-top: 64px; padding-bottom: 20px; }
}
@media (min-width: 640px) and (max-width: 899px) {
  .hm-hero { min-height: calc(100svh - 24px); }
  .hm-content { padding-top: 84px; }
}
@media (max-width: 639px) {
  .hm-badge { font-size: 1rem; }
  .hm-hero h1.hm-name { font-size: min(2.9rem, 8.7vw); margin-top: 26px; white-space: nowrap; letter-spacing: -.045em; }
  .hm-tag { font-size: min(1.15rem, 5.4vw); flex-direction: column; align-items: center; white-space: nowrap; row-gap: 2px; margin-top: 20px; line-height: 1.4; }
  .hm-tag > span:first-child { white-space: nowrap; }
  .hm-aff { margin-top: 32px; gap: 10px; }
  .hm-aff li { font-size: 1rem; line-height: 1.5; }
  .hm-aff li:first-child { white-space: nowrap; font-size: calc((100vw - 56px) / 23.5); }
  .hm-more { margin-top: 24px; gap: 8px; }
  .hm-kw { font-size: .9rem; line-height: 1.5; }
  .hm-exp { font-size: min(.8rem, 3.5vw); white-space: nowrap; }
  /* ranking paragraph: use the full width, justified (last line centred), no ugly gaps or lonely last words */
  .hm-rank-full { display: none; }
  .hm-rank-short { display: inline; }
  .hm-rank { width: calc(100% + 12px); max-width: none; font-size: .74rem; line-height: 1.55; text-align: justify; text-align-last: center;
    text-wrap: pretty; hyphens: auto; -webkit-hyphens: auto; word-spacing: -.02em; }
  .hm-pill-wrap { margin-top: 14px; }
  .hm-pill { width: min(420px, 80vw); height: 48px; min-height: 0; padding: 4px 14px; font-size: .72rem; line-height: 1.3; }
}
@media (max-width: 380px) {
  .hm-hero h1.hm-name { font-size: 8.5vw; }
  .hm-badge { font-size: .92rem; }
  .hm-tag { font-size: min(1.05rem, 5.4vw); margin-top: 16px; }
  .hm-aff { margin-top: 24px; gap: 8px; }
  .hm-aff li { font-size: .92rem; }
  .hm-aff li:first-child { font-size: calc((100vw - 56px) / 23.5); }
}
/* Compact hero for small / short phones (e.g. Galaxy S8+ 360x740): smaller text and tighter gaps so
   the whole hero, stats included, fits on one screen */
@media (max-width: 380px), (max-width: 639px) and (max-height: 760px) {
  .hm-content { padding-top: 64px; padding-bottom: 20px; }
  .hm-rank { font-size: .68rem; line-height: 1.5; }
  .hm-hero h1.hm-name { margin-top: 14px; }
  .hm-tag { margin-top: 12px; font-size: min(1rem, 5vw); line-height: 1.35; }
  .hm-aff { margin-top: 16px; gap: 6px; }
  .hm-aff li { font-size: .85rem; }
  .hm-aff li:first-child { font-size: calc((100vw - 56px) / 25); }
  .hm-more { margin-top: 14px; gap: 6px; }
  .hm-kw { font-size: .78rem; line-height: 1.45; }
  .hm-exp { font-size: min(.74rem, 3.3vw); }
  .hm-pill-wrap { margin-top: 12px; }
  .hm-pill { height: 46px; min-height: 0; padding: 4px 12px; font-size: .7rem; }
}

/* Heading sits over the faded top of the DriftWall photos (same style as the other section titles) */
.mm-over { position: absolute; top: 0; left: 0; right: 0; z-index: 2; pointer-events: none; text-align: center;
  padding: 90px 30px 0; box-sizing: border-box; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
@media (min-width: 640px) { .mm-over { padding: 130px 56px 0; } }
.mm-sec { position: relative; width: 100%; height: calc(100vh + 260px); background: #24476B; overflow: hidden; }
.mm-wall { position: absolute; inset: 260px 0 0 0; }
@media (max-width: 639px) {
  .mm-sec { height: calc(100svh + 40px); }
  .mm-wall { inset: 150px 0 0 0; }
}
.mm-title { margin: 0; text-align: center; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600;
  line-height: 1.15; letter-spacing: -.04em; color: #fff; }
.mm-title-link { pointer-events: auto; display: inline-flex; flex-direction: column; align-items: center; gap: 16px; text-decoration: none; cursor: pointer; }
.mm-title-cta { font-size: .72rem; font-weight: 500; letter-spacing: .02em; color: rgba(255,255,255,.92); border: 1px solid rgba(255,255,255,.42); padding: 6px 15px; border-radius: 999px; transition: background .2s ease, border-color .2s ease, transform .2s ease; }
.mm-title-link:hover .mm-title-cta, .mm-title-link:focus-visible .mm-title-cta { background: rgba(255,255,255,.16); border-color: rgba(255,255,255,.75); }
.mm-title-link:hover .mm-title { text-decoration: underline; text-underline-offset: 5px; text-decoration-thickness: 1px; }
.mm-title-link:focus-visible { outline: 2px solid rgba(255,255,255,.85); outline-offset: 6px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hm-slide { transition: opacity .4s linear; transform: none !important; }
  .hm-in { animation: none; opacity: 1; transform: none; }
}
`

const delay = (s: number) => ({ '--d': `${s}s` }) as CSSProperties

/* ----- Component ---------------------------------------------------------- */
function App() {
  const [index, setIndex] = useState(0)
  const [topic, setTopic] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTopic((t) => (t + 1) % TOPICS.length), TOPIC_MS)
    return () => window.clearInterval(id)
  }, [])
  const [pill, setPill] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setPill((p) => (p + 1) % home.affiliations.length), 3200)
    return () => window.clearInterval(id)
  }, [])
  // Shuru mein sirf 2 photos load hoti hain, baaki ek-ek karke.
  const [mountedCount, setMountedCount] = useState(Math.min(2, SLIDES.length))
  // phones: 3 narrower columns on the Moments wall
  const [phone, setPhone] = useState(() => typeof window !== 'undefined' && window.innerWidth < 640)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const on = () => setPhone(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
      setMountedCount((c) => Math.min(SLIDES.length, c + 1))
    }, HOLD)
    return () => window.clearInterval(id)
  }, [])

  // Tiny hash router: "#career" shows the Career page, any other hash shows the
  // home page (and scrolls to that section).
  const ROUTES: Route[] = ['career', 'research', 'funding', 'entrepreneurship', 'mostcited', 'publications', 'journals', 'media', 'contact']
  const routeFromHash = (): Route => {
    const h = window.location.hash.slice(1) as Route
    return ROUTES.includes(h) ? h : 'home'
  }
  const [route, setRoute] = useState<Route>(routeFromHash)
  useEffect(() => {
    const onHash = () => setRoute(routeFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  useEffect(() => {
    if (route !== 'home') {
      window.scrollTo(0, 0)
      return
    }
    const id = window.location.hash.slice(1)
    if (!id) return
    document.getElementById(id)?.scrollIntoView()
  }, [route])

  if (route === 'career') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <CareerPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'research') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <ResearchOverview />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'funding') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <FundingPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'entrepreneurship') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <EntrepreneurshipPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'mostcited') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <ResearchPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'publications') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <Publications />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'journals') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <JournalsPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'media') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <MediaPage />
        <Footer />
        <BackToTop />
      </>
    )
  }

  if (route === 'contact') {
    return (
      <>
        <style>{CSS}</style>
        <Navbar />
        <ContactPage />
        <BackToTop />
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>

      <Navbar />

      <section id="top" className="hm-hero" aria-labelledby="home-title">
        {SLIDES.slice(0, mountedCount).map((s, i) => {
          const active = i === index
          const f = frame(s.mo, active)
          return (
            <div
              key={s.src}
              aria-hidden="true"
              className="hm-slide"
              style={{ opacity: active ? 1 : 0, transform: `translateX(${f.x}%) scale(${f.scale})` }}
            >
              <img
                src={s.src}
                alt=""
                draggable={false}
                decoding="async"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </div>
          )
        })}

        <div className="hm-ov hm-ov1" aria-hidden="true" />
        <div className="hm-ov hm-ov2" aria-hidden="true" />
        <div className="hm-ov hm-ov3" aria-hidden="true" />

        <div className="hm-content">
          <div className="hm-inner">
            <p className="hm-rank hm-in" lang="en" style={delay(0.4)}>
              <span className="hm-rank-full">{home.ranking}</span>
              <span className="hm-rank-short">{RANKING_SHORT}</span>
            </p>

            <h1 id="home-title" className="hm-name hm-in" style={delay(0.46)}>
              {home.name}
            </h1>

            <div className="hm-tag hm-in" style={delay(0.57)} aria-live="polite">
              <span>{home.taglinePrefix}</span>
              <span key={TOPICS[topic]} className="hm-topic">{TOPICS[topic]}</span>
            </div>

            <div className="hm-pill-wrap hm-in" style={delay(0.68)} aria-live="polite">
              <div className="hm-pill">
                <span key={home.affiliations[pill]} className="hm-pill-txt">{home.affiliations[pill]}</span>
              </div>
            </div>

            <div className="hm-more hm-in" style={delay(0.8)}>
              <p className="hm-kw">{home.keywords}</p>
              <p className="hm-exp">{home.experience}</p>
            </div>
          </div>
        </div>
        <Stats />
      </section>

      <Biography />

      <Education />

      <KeyPillars />

      <ResearchAreas />

      <AcademicImpact />

      <CitationMetrics />

      <FundedAgencies />

      <Collaborations />

      <CurrentFocus />

      <section id="moments" className="mm-sec" aria-labelledby="mm-title">
        <div className="mm-over">
          <a href="#media" className="mm-title-link" aria-label="Open the Moments & Milestones gallery">
            <h2 id="mm-title" className="mm-title">Moments &amp; Milestones</h2>
            <span className="mm-title-cta">View the gallery</span>
          </a>
        </div>
        <div className="mm-wall">
        <DriftWall
          items={WALL_ITEMS}
          columns={phone ? 3 : 9}
          tileWidth={phone ? 104 : 240}
          tileHeight={phone ? 104 : 132}
          gap={phone ? 12 : 18}
          tilt={phone ? 12 : 16}
          turn={phone ? 0 : -14}
          perspective={1200}
          depth={120}
          speed={42}
          direction="up"
          variance={0.45}
          parallax={0.6}
          lift={64}
          fade={0.3}
          dim={0.92}
          overlayColor="#24476B"
        />
        </div>
      </section>

      <Footer />
      <BackToTop />
    </>
  )
}

export default App