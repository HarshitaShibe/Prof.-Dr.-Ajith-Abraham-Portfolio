import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react'
import { FileText, GraduationCap, Mail } from 'lucide-react'
import Navbar from '../Navbar'

/* ==========================================================================
   Everything for the hero lives in this file: photos, camera moves, overlays,
   content and buttons. App.tsx only needs to render <Home />.
   ========================================================================== */

// Put the real Google Scholar profile link here.
const SCHOLAR_URL = 'https://scholar.google.com/scholar?q=Ajith+Abraham'

/* Background photos (4). Files sit in /public, so they are served from "/". */
const IMG_BASE = '/'
type Mo = 'zoomIn' | 'zoomOut' | 'panLeft' | 'panRight'
const SLIDES: { src: string; mo: Mo }[] = [
  { src: `${IMG_BASE}first_home.jpg`, mo: 'zoomIn' },
  { src: `${IMG_BASE}Second_home.jpg`, mo: 'panLeft' },
  { src: `${IMG_BASE}third_home.jpg`, mo: 'zoomOut' },
  { src: `${IMG_BASE}fourth_home.jpg`, mo: 'panRight' },
]

const EASE = [0.16, 1, 0.3, 1] as const
const HOLD = 7000 // ms each photo stays
const FADE = 1.4 // s crossfade
const MOVE = (HOLD + FADE * 1000) / 1000 // slow camera duration

/* Same font as hero_home.tsx / App.tsx (Plus Jakarta Sans) */
const PJS = '"Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

/* Blues. Main colour is #24476B. Tweak here to retune the whole hero. */
const BLUE = '36,71,107' // #24476B  -> background, tint + buttons
const BLUE_DEEP = '0,0,120' // deeper blue, only for text shadows / readability
const BLUE_SOFT = '#cdd9ff' // light blue for name gradient + highlights (high contrast on #24476B)

/* Photos are shown zoomed out: scale stays below 1, so more of the picture is
   visible. A blurred copy of the same photo fills the revealed edges. */
const BASE = 0.94
function frame(mo: Mo, active: boolean) {
  const start = {
    zoomIn: { scale: BASE, x: '0%' },
    zoomOut: { scale: BASE + 0.04, x: '0%' },
    panLeft: { scale: BASE + 0.02, x: '0%' },
    panRight: { scale: BASE + 0.02, x: '0%' },
  }[mo]
  const end = {
    zoomIn: { scale: BASE + 0.04, x: '0%' },
    zoomOut: { scale: BASE, x: '0%' },
    panLeft: { scale: BASE + 0.02, x: '-1.5%' },
    panRight: { scale: BASE + 0.02, x: '1.5%' },
  }[mo]
  return active ? end : start
}

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='140'%20height='140'%3E%3Cfilter%20id='n'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.9'%20numOctaves='2'%20stitchTiles='stitch'/%3E%3CfeColorMatrix%20type='saturate'%20values='0'/%3E%3C/filter%3E%3Crect%20width='100%25'%20height='100%25'%20filter='url(%23n)'/%3E%3C/svg%3E\")"

/* ==========================================================================
   Content
   ========================================================================== */
const BADGE = 'Stanford/Elsevier Top 2% Scientist'
const NAME = 'Prof. Ajith Abraham'
const AFFILIATIONS = [
  'Vice Chancellor · Humanitarian · Academician',
  'Advancing Research & Innovation · Transformative Education · Global Impact',
  'Vice Chancellor, Sai University, Chennai · Founding Director, MIR Labs, USA',
]

/* Rotating topics in the tagline */
const TOPICS = [
  'Data Mining',
  'Cybersecurity',
  'Healthcare',
  'Industry 4.0 and IoT',
  'Evolutionary Optimization',
  'Neural Computing',
  'Generative AI in Education',
]
const TOPIC_MS = 2600

const btnBase =
  'inline-flex h-10 items-center justify-center gap-2 rounded-full border px-4 text-[0.82rem] font-semibold whitespace-nowrap no-underline transition-colors duration-300 sm:h-11 sm:px-5 sm:text-[0.88rem]'
const btnPrimary = `${btnBase} border-white bg-white text-[#24476B] hover:bg-[#e3e8ff] hover:border-[#e3e8ff]`

const textShadow = `0 2px 18px rgba(${BLUE_DEEP},0.75), 0 1px 3px rgba(${BLUE_DEEP},0.7)`

/* ==========================================================================
   Component
   ========================================================================== */
export default function Home() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  // Only current + upcoming photo are mounted at first; the rest load one by one.
  const [mountedCount, setMountedCount] = useState(() => Math.min(2, SLIDES.length))

  const [topic, setTopic] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTopic((t) => (t + 1) % TOPICS.length), TOPIC_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length)
      setMountedCount((c) => Math.min(SLIDES.length, c + 1))
    }, HOLD)
    return () => window.clearInterval(id)
  }, [reduce])

  const content: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.11, delayChildren: 0.35 } },
  }
  const item: Variants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE } },
  }

  return (
    <>
      <Navbar />
      <section
      id="top"
      aria-labelledby="home-title"
      className="relative isolate m-2 h-[calc(100svh-1rem)] min-h-[600px] overflow-hidden rounded-[22px] bg-[#24476B] text-white antialiased sm:m-3 sm:h-[calc(100svh-1.5rem)] sm:rounded-[28px]"
      style={{ fontFamily: PJS }}
    >
      {/* Background carousel: crossfade + slow camera move, photo shown zoomed out */}
      {SLIDES.slice(0, mountedCount).map((s, i) => {
        const active = i === index
        const f = frame(s.mo, active)
        return (
          <motion.div
            key={s.src}
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            initial={{ opacity: i === 0 ? 1 : 0, ...frame(s.mo, i === 0) }}
            animate={
              reduce
                ? { opacity: active ? 1 : 0, scale: BASE, x: '0%' }
                : { opacity: active ? 1 : 0, scale: f.scale, x: f.x }
            }
            transition={{
              opacity: { duration: FADE, ease: 'easeInOut' },
              scale: { duration: MOVE, ease: 'linear' },
              x: { duration: MOVE, ease: 'linear' },
            }}
          >
            {/* Blurred copy fills the edges revealed by zooming out */}
            <img
              src={s.src}
              alt=""
              className="absolute inset-0 h-full w-full scale-125 object-cover object-center blur-2xl"
              draggable={false}
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
            />
            <img
              src={s.src}
              alt=""
              className="relative h-full w-full object-cover object-center"
              draggable={false}
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'}
            />
          </motion.div>
        )
      })}

      {/* Cinematic overlays (hero_home style), all built on #24476B:
          solid blue wash, centre glow behind the text, bottom fade, vignette, grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `rgba(${BLUE},0.55)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: `radial-gradient(75% 65% at 50% 50%, rgba(${BLUE},0.72) 0%, rgba(${BLUE},0.5) 55%, rgba(${BLUE},0.15) 100%)`,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `linear-gradient(to top, rgba(${BLUE},0.6) 0%, rgba(${BLUE},0) 45%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{ background: `radial-gradient(120% 115% at 50% 45%, transparent 55%, rgba(18,36,60,0.45) 100%)` }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06] mix-blend-overlay"
        style={{ backgroundImage: GRAIN, backgroundSize: '140px 140px' }}
      />

      {/* Content (centred) */}
      <div className="flex h-full flex-col items-center justify-center px-6 pt-16 pb-10 text-center sm:px-12 sm:pt-20 lg:pt-0">
        <motion.div
          variants={content}
          initial={reduce ? false : 'hidden'}
          animate="show"
          className="flex w-full max-w-[860px] flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div variants={item}>
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-4 py-1.5 text-[0.7rem] font-normal tracking-[0.01em] text-white backdrop-blur-md sm:text-[0.76rem]"
              style={{ textShadow }}
            >
              {BADGE}
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1
            id="home-title"
            variants={item}
            className="mt-5 bg-clip-text pb-[0.08em] text-center font-medium leading-[1.05] tracking-[-0.035em] text-transparent sm:mt-6"
            style={{
              fontSize: 'clamp(2rem, 5.6vw, 4.1rem)',
              backgroundImage: `linear-gradient(90deg, #fff 55%, ${BLUE_SOFT} 100%)`,
              filter: `drop-shadow(0 2px 14px rgba(${BLUE_DEEP},0.75))`,
            }}
          >
            {NAME}
          </motion.h1>

          {/* Tagline with rotating topics (always one line) */}
          <motion.div
            variants={item}
            className="mt-4 flex items-baseline justify-center gap-[0.35em] whitespace-nowrap text-center font-normal tracking-[-0.01em] text-white sm:mt-5"
            style={{ textShadow, fontSize: 'min(1.15rem, 2.7vw)' }}
            aria-live="polite"
          >
            <span>Building intelligent systems for</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={TOPICS[topic]}
                className="inline-block font-semibold"
                style={{ color: BLUE_SOFT }}
                initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                {TOPICS[topic]}
              </motion.span>
            </AnimatePresence>
          </motion.div>

          {/* Affiliations */}
          <motion.ul variants={item} className="mt-6 flex flex-col items-center gap-1 sm:mt-8">
            {AFFILIATIONS.map((text) => (
              <li
                key={text}
                className="text-center text-[0.76rem] font-normal text-white sm:text-[0.86rem]"
                style={{ textShadow }}
              >
                {text}
              </li>
            ))}
          </motion.ul>

          {/* Buttons */}
          <motion.div
            variants={item}
            className="mt-7 flex flex-wrap items-center justify-center gap-2.5 sm:mt-9 sm:gap-3"
          >
            <a href={SCHOLAR_URL} target="_blank" rel="noopener noreferrer" className={btnPrimary}>
              <GraduationCap aria-hidden="true" className="size-[17px] shrink-0" strokeWidth={1.75} />
              Google Scholar
            </a>
            <a href="#research" className={btnPrimary}>
              Explore research
              
            </a>
            <a href="#publications" className={btnPrimary}>
              <FileText aria-hidden="true" className="size-[16px] shrink-0" strokeWidth={1.75} />
              Publications
            </a>
            <a href="#contact" className={btnPrimary}>
              <Mail aria-hidden="true" className="size-[16px] shrink-0" strokeWidth={1.75} />
              Contact
            </a>
          </motion.div>
        </motion.div>
      </div>
      </section>
    </>
  )
}