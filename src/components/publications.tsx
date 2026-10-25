import { useCallback, useDeferredValue, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import scholarTop from '../data/scholar-top.json'
import localPapers from '../data/local-papers.generated.json'
import FIGURES_DATA from '../data/publication-figures.json'
import PER_YEAR from '../data/publications-per-year.json'
import GradientASCII from './GradientASCII'

/* ==========================================================================
   Publications page (opens when "Publications" is clicked in the Navbar or
   Footer; route "#publications" in App.tsx).

   Top: heading, two CTAs and a count per publication type, on the page
   background. Then a chart of publications per year (click a bar to filter),
   the most-cited papers on Google Scholar, and the full searchable list.

   Data
   - src/data/publications.json: every entry in the publication list of the CV
     (public/Ajith-Abraham-CV.pdf). Generated, do not edit by hand:
       pip install pymupdf
       npm run publications:update
     It is loaded only when this page opens, so the home page stays light.
   - src/data/scholar-top.json: the 20 most-cited papers and their citation
     counts on Google Scholar, with the date they were retrieved.
   - src/data/publication-links.json: DOI / publisher links (confident Crossref
     matches only) and legal open-access copies (Unpaywall, PDF files checked).
     Generated: npm run publications:links you@example.org
     Loaded together with the list.
   - src/data/publication-citations.json: citation counts. Google Scholar
     first (Prof. Abraham's profile, matched by verified title, year, journal
     and pages); OpenAlex for papers not on the profile (DOI first, then
     title). Unmatched or ambiguous entries have no count (see the review
     file), and zero counts are not shown.
     Generated: npm run publications:citations you@example.org
   - src/data/local-papers.generated.json: PDFs in public/papers/ that are
     listed, with their permission, in src/data/local-papers.json. Written
     before every build by scripts/check-local-papers.mjs; a PDF appears only
     when it is both authorised and present.
   ========================================================================== */

type PubType = 'journal' | 'conference' | 'proceedings' | 'chapter' | 'edited-book' | 'book' | 'other'

interface Publication {
  id: string
  type: PubType
  title: string
  authors: string[]
  venue: string
  /** Null when the CV gives no year for the entry. */
  year: number | null
}

interface PublicationData {
  source: string
  asOf: string | null
  counts: Record<PubType, number>
  items: Publication[]
}

interface ScholarPaper {
  id: string
  title: string
  authors: string
  venue: string
  year: number
  citations: number
}

interface OpenAccess {
  /** A PDF that was downloaded and checked; null when only a web page is free. */
  pdf: string | null
  landing: string | null
  version: string | null
  license: string | null
  host: string | null
  checked: string | null
}
interface LinkInfo {
  doi: string
  match: string
  oa?: OpenAccess
}
interface LinksData {
  generated: string | null
  items: Record<string, LinkInfo | undefined>
}
interface LocalPaper {
  href: string
  version: string
  sizeKB: number
}

interface Citation {
  /** Where the count comes from. Older files have no source: OpenAlex. */
  source?: 'scholar' | 'openalex'
  /** Google Scholar article id, e.g. "i95DGLQAAAAJ:qjMakFHDy7sC". */
  scholar?: string
  /** OpenAlex work id, e.g. "W2104277766". */
  work?: string
  cites: number
  method: 'doi' | 'title' | 'manual'
}
interface CitationsData {
  generated: string | null
  items: Record<string, Citation | undefined>
}

type Sort = 'newest' | 'oldest' | 'title' | 'citations'
type Access = 'all' | 'doi' | 'free'

// Order of the filters and of the counts at the top: largest group first.
const TYPES: { id: PubType; label: string; one: string }[] = [
  { id: 'journal', label: 'Journal articles', one: 'Journal article' },
  { id: 'conference', label: 'Conference papers', one: 'Conference paper' },
  { id: 'proceedings', label: 'Edited proceedings', one: 'Edited proceedings' },
  { id: 'chapter', label: 'Book chapters', one: 'Book chapter' },
  { id: 'edited-book', label: 'Edited books', one: 'Edited book' },
  { id: 'book', label: 'Authored books', one: 'Authored book' },
  { id: 'other', label: 'Other articles', one: 'Invited or short article' },
]
const TYPE_ONE = Object.fromEntries(TYPES.map((t) => [t.id, t.one])) as Record<PubType, string>

const PAGE = 25 // entries per page

const CV_URL = '/Ajith-Abraham-CV.pdf'
const SCHOLAR = scholarTop as { profileUrl: string; scholarId: string; retrieved: string; items: ScholarPaper[] }
const scholarPaperUrl = (id: string) =>
  `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${SCHOLAR.scholarId}&citation_for_view=${SCHOLAR.scholarId}:${id}`
/** A Scholar article page from its full id ("user:article"). */
const scholarArticleUrl = (fullId: string) =>
  `https://scholar.google.com/citations?view_op=view_citation&hl=en&user=${fullId.split(':')[0]}&citation_for_view=${fullId}`
const scholarSearchUrl = (title: string) =>
  `https://scholar.google.com/scholar?q=${encodeURIComponent(`"${title}"`)}`

const LOCAL = localPapers as Record<string, LocalPaper | undefined>
const doiUrl = (doi: string) => `https://doi.org/${doi}`

const OA_VERSION: Record<string, string> = {
  publishedVersion: 'Published version',
  acceptedVersion: 'Accepted manuscript',
  submittedVersion: 'Preprint',
}
/** "cc-by-nc-nd" -> "CC BY-NC-ND"; other licence codes are not shown. */
const licenceLabel = (l: string | null) => (l && l.startsWith('cc') ? l.toUpperCase().replace(/^CC-?/, 'CC ') : null)

const nf = new Intl.NumberFormat('en-GB')

/* The numbers in the box at the top. Edit them in src/data/publication-figures.json.
   A figure that is missing or null falls back to the count of the loaded list. */
const FIGURES = FIGURES_DATA as Partial<Record<PubType | 'total', number | null>>

/** A number that counts up from 0 the first time it scrolls into view. */
function CountUp({ value, duration = 1600 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [n, setN] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setN(value)
      return
    }
    let raf = 0
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min(1, (t - t0) / duration)
          setN(Math.round(value * (1 - Math.pow(1 - p, 3))))
          if (p < 1) raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      },
      { threshold: 0.4 },
    )
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [value, duration])

  return <span ref={ref}>{nf.format(n)}</span>
}
const fileSize = (kb: number) => (kb < 1024 ? `${Math.max(1, kb)} KB` : `${(kb / 1024).toFixed(1)} MB`)
const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

/** Lower case, accents removed, so "Koppen" finds "Köppen". */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
/** Letters and digits only, for matching a CV title to a Scholar title. */
const titleKey = (s: string) => norm(s).replace(/[^a-z0-9]/g, '')

const CSS = `
.pb-wrap {
  position: relative; isolation: isolate; min-height: 100svh; box-sizing: border-box; color: #24476B; background: #EEF4FA;
  font-family: "Plus Jakarta Sans", Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
.pb-wrap *, .pb-wrap *::before, .pb-wrap *::after { box-sizing: border-box; }
.pb-wrap :focus-visible { outline: 2px solid #24476B; outline-offset: 3px; }
.pb-in { max-width: 1100px; margin: 0 auto; }

/* ---- Top: heading, CTAs, counts ---- */
.pb-hero { position: relative; z-index: 1; isolation: isolate; overflow: hidden; padding: 150px 30px 14vh; display: flex; flex-direction: column; justify-content: flex-end; min-height: 100vh; background: #24476B; color: #fff; }
@media (min-width: 640px) { .pb-hero { padding: 170px 56px 14vh; } }
.pb-hero-in { position: relative; z-index: 1; }
.pb-ascii { position: absolute; top: 0; left: 0; right: 0; bottom: 0; z-index: 0; pointer-events: none; }
.pb-hero-in { margin: 0 auto; text-align: center; }
.pb-hero .pb-ctas { justify-content: center; margin-top: 34px; gap: 8px; animation: pb-rise 1.1s cubic-bezier(.16,1,.3,1) .45s both; }
.pb-hero .pb-btn { height: 30px; padding: 0 12px; font-size: .72rem; background: #24476B; color: #fff; border-color: #24476B; }
.pb-hero .pb-btn:hover { background: #3d6ba0; border-color: #3d6ba0; color: #fff; }
.pb-hero .pb-lede { font-size: .82rem; line-height: 1.6; max-width: 560px; margin: 14px auto 0; color: rgba(255,255,255,.9); animation: pb-rise 1.1s cubic-bezier(.16,1,.3,1) .45s both; }
.pb-hero .pb-title { color: #fff; text-align: center; animation: pb-rise 1.1s cubic-bezier(.16,1,.3,1) .45s both; }
@keyframes pb-rise { from { opacity: 0; transform: translateY(26px); } to { opacity: 1; transform: none; } }
.pb-title { margin: 0; font-size: clamp(2.4rem, 6vw, 5rem); font-weight: 500; line-height: 1.02; letter-spacing: -.045em; }
.pb-lede { margin: 20px 0 0; max-width: 40rem; font-size: clamp(.95rem, 1.5vw, 1.08rem); line-height: 1.6; color: #2f4d68; }

.pb-ctas { margin-top: 32px; display: flex; flex-wrap: wrap; gap: 12px; }
.pb-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 7px; height: 38px; padding: 0 16px;
  border-radius: 10px; font: 600 .78rem inherit; font-family: inherit; text-decoration: none; white-space: nowrap;
  background: #24476B; border: 1px solid #24476B; color: #fff; cursor: pointer;
  transition: background-color .25s, border-color .25s, color .25s;
}
.pb-btn svg { width: 15px; height: 15px; flex-shrink: 0; }
.pb-btn:hover { background: #fff; color: #24476B; }

.pb-counts { margin: 48px auto 0; width: 100%; max-width: 1000px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px;
  border: 1px solid #24476B; border-radius: 20px; overflow: hidden; background: #24476B; min-height: 260px; }
@media (min-width: 700px) { .pb-counts { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.pb-count, .pb-count.is-total { margin: 0; padding: 32px 20px; background: #24476B; color: #fff; text-align: center;
  display: flex; flex-direction: column; align-items: center; justify-content: center; }
.pb-count dt, .pb-count.is-total dt { margin: 0; font-size: .92rem; font-weight: 500; color: rgba(255,255,255,.85); }
.pb-count dd, .pb-count.is-total dd { margin: 10px 0 0; font-size: clamp(1.8rem, 3.2vw, 2.6rem); font-weight: 600; letter-spacing: -.02em; line-height: 1; font-variant-numeric: tabular-nums; color: #fff; }

/* ---- Body ---- */
.pb-body { position: relative; z-index: 1; padding: 8px 30px 100px; }
@media (min-width: 640px) { .pb-body { padding: 8px 56px 120px; } }
.pb-section { margin-top: 56px; }
.pb-section:first-child { margin-top: 0; }
.pb-h2 { margin: 0 0 14px; font-size: clamp(1.8rem, 3.6vw, 2.6rem); font-weight: 600; line-height: 1.15; letter-spacing: -.04em; color: #24476B; }
.pb-sub { margin: 6px 0 0; font-size: .84rem; line-height: 1.5; color: #3a5f86; }
.pb-center { text-align: center; }
.pb-center .pb-sub { margin: 6px auto 0; }
.pb-center-h { text-align: center; }
/* More room above and below the two section headings ("Publications per year", "All publications"). */
.pb-section.pb-gap { margin-top: 96px; }
.pb-gap .pb-h2 { margin-bottom: 40px; }
.pb-gap .pb-sub { margin: 0 auto 8px; }
/* Tighter gap between "Publications per year" and its subtitle only. */
.pb-gap #pb-years { margin-bottom: 16px; }
.pb-gap .pb-card { margin-top: 96px; }
.pb-gap .ls-controls { margin-top: 96px; }
@media (max-width: 639px) { .pb-section.pb-gap { margin-top: 72px; } .pb-gap .ls-controls { margin-top: 64px; } .pb-gap .pb-card { margin-top: 64px; } .pb-gap .pb-h2 { margin-bottom: 28px; } }
.pb-card { margin-top: 20px; padding: 22px 22px 18px; border-radius: 16px; background: #fff;
  border: 1px solid rgba(36,71,107,.14); box-shadow: 0 10px 30px -20px rgba(18,36,60,.45); }
@media (min-width: 640px) { .pb-card { padding: 26px 28px 22px; } }
.pb-two { display: grid; gap: 56px; }
@media (min-width: 1000px) { .pb-two { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); gap: 32px; } .pb-two .pb-section { margin-top: 0; } }

/* ---- Chart: publications per year ---- */
.ch { --h: 150px; position: relative; }
@media (min-width: 1000px) { .ch { --h: 300px; } }
.ch-plot { position: relative; height: var(--h); margin-left: 34px; }
.ch-grid { position: absolute; left: 0; right: 0; height: 0; border-top: 1px solid rgba(36,71,107,.1); }
.ch-grid span { position: absolute; right: calc(100% + 8px); top: -.55em; font-size: .68rem; color: #3a5f86; font-variant-numeric: tabular-nums; }
.ch-base { border-top-color: rgba(36,71,107,.45); }
.ch-bars { position: absolute; inset: 0; display: flex; align-items: flex-end; gap: 2px; }
.ch-col { position: relative; flex: 1 1 0; min-width: 0; height: 100%; padding: 0; border: 0; background: none; cursor: pointer;
  display: flex; align-items: flex-end; }
.ch-bar { display: block; width: 100%; border-radius: 4px 4px 0 0; background: #24476B; min-height: 0;
  transition: background-color .15s; }
.ch-col:hover .ch-bar, .ch-col:focus-visible .ch-bar { background: #142B44; }
.ch.has-sel .ch-bar { background: #A9BCD0; }
.ch.has-sel .ch-col.is-sel .ch-bar, .ch.has-sel .ch-col:hover .ch-bar { background: #24476B; }
.ch-col:focus-visible { outline-offset: 1px; border-radius: 4px; }
/* Glass chart card and glossy bars (per-year chart only) */
.pb-glass {
  position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(255,255,255,.82) 0%, rgba(214,228,242,.42) 100%);
  backdrop-filter: blur(18px) saturate(160%); -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255,255,255,.85);
  box-shadow: 0 24px 56px -26px rgba(36,71,107,.42), inset 0 1px 0 rgba(255,255,255,.95);
}
.pb-glass::before {
  content: ''; position: absolute; top: -40%; left: -20%; width: 60%; height: 80%; pointer-events: none;
  background: radial-gradient(closest-side, rgba(255,255,255,.7), rgba(255,255,255,0));
}
.pb-glass .ch-bar {
  background: linear-gradient(180deg, #5f8fc4 0%, #24476B 100%);
  border-radius: 6px 6px 0 0;
  box-shadow: 0 8px 16px -8px rgba(18,36,60,.55), inset 0 1px 0 rgba(255,255,255,.45);
  transition: background .3s, box-shadow .3s;
}
.pb-glass .ch-col:hover .ch-bar, .pb-glass .ch-col:focus-visible .ch-bar {
  background: linear-gradient(180deg, #a9c8ee 0%, #3d6ba0 100%);
  box-shadow: 0 12px 22px -8px rgba(36,71,107,.6), inset 0 1px 0 rgba(255,255,255,.6);
}
.pb-glass .ch.has-sel .ch-bar { background: linear-gradient(180deg, #7f9fc6 0%, #4f7aa8 100%); box-shadow: none; }
.pb-glass .ch.has-sel .ch-col.is-sel .ch-bar, .pb-glass .ch.has-sel .ch-col:hover .ch-bar {
  background: linear-gradient(180deg, #7fa6d6 0%, #142B44 100%);
  box-shadow: 0 12px 22px -8px rgba(18,36,60,.6), inset 0 1px 0 rgba(255,255,255,.4);
}

.ch-tip { position: absolute; bottom: calc(var(--y) + 6px); left: 50%; transform: translateX(-50%); z-index: 2;
  display: flex; align-items: baseline; gap: 7px; padding: 7px 11px; border-radius: 9px; background: #142B44; color: #fff;
  font-family: "Plus Jakarta Sans", Inter, system-ui, sans-serif; font-size: .8rem; font-weight: 400; line-height: 1; letter-spacing: 0; white-space: nowrap; box-shadow: 0 6px 16px rgba(20,43,68,.28);
  pointer-events: none; opacity: 0; transition: opacity .12s; font-variant-numeric: tabular-nums; }
.ch-tip::after { content: ""; position: absolute; left: 50%; top: 100%; width: 8px; height: 8px; background: #142B44; transform: translate(-50%, -4px) rotate(45deg); border-radius: 1px; }
.ch-tip-y { font-weight: 400; color: rgba(255,255,255,.72); }
.ch-tip-n { font-weight: 400; }
.ch-tip-n small { font-size: .72rem; font-weight: 400; color: rgba(255,255,255,.72); margin-left: 3px; }
.ch-col:hover .ch-tip, .ch-col:focus-visible .ch-tip, .ch.is-single .ch-col.is-sel .ch-tip { opacity: 1; }
.ch-axis { position: relative; height: 22px; margin-left: 34px; }
.ch-axis span { position: absolute; top: 6px; transform: translateX(-50%); font-size: .68rem; color: #3a5f86; font-variant-numeric: tabular-nums; }
.ch-foot { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; font-size: .76rem; color: #3a5f86; }
.pb-link { padding: 0; border: 0; background: none; font: inherit; font-weight: 600; color: #24476B; cursor: pointer;
  text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px; }
.pb-link:hover { text-decoration-thickness: 2px; }

/* ---- Most cited ---- */
.mc { margin: 0; padding: 0; list-style: none; counter-reset: mc; }
.mc-item { display: grid; grid-template-columns: 1.6rem minmax(0, 1fr) auto; gap: 4px 12px; padding: 12px 0; border-top: 1px solid rgba(36,71,107,.1); }
.mc-item:first-child { border-top: 0; padding-top: 0; }
.mc-rank { font-size: .76rem; font-weight: 600; color: #3a5f86; font-variant-numeric: tabular-nums; padding-top: 2px; }
.mc-title { margin: 0; font-size: .9rem; font-weight: 600; line-height: 1.4; letter-spacing: -.01em; }
.mc-title a { color: #24476B; text-decoration: none; background: linear-gradient(currentColor, currentColor) 0 100% / 0 1px no-repeat; transition: background-size .2s; }
.mc-title a:hover, .mc-title a:focus-visible { background-size: 100% 1px; }
.mc-meta { margin: 3px 0 0; font-size: .74rem; line-height: 1.45; color: #3a5f86; }
.mc-cites { text-align: right; font-size: .9rem; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
.mc-cites small { display: block; font-size: .66rem; font-weight: 500; color: #3a5f86; }
.mc-bar { grid-column: 2 / 4; height: 3px; border-radius: 2px; background: rgba(36,71,107,.1); overflow: hidden; }
.mc-bar span { display: block; height: 100%; border-radius: 2px; background: #24476B; }

/* ---- List: controls ---- */
.ls-controls { margin-top: 10px; display: grid; gap: 6px; }
@media (min-width: 760px) { .ls-controls { grid-template-columns: minmax(0, 1fr) auto auto; align-items: end; } }
@media (min-width: 1000px) { .ls-controls { grid-template-columns: minmax(0, 1fr) auto auto auto; } }
.ls-range { margin: 0; padding: 0; border: 0; min-inline-size: 0; }
.ls-range legend { padding: 0; margin-bottom: 6px; }
.ls-range-row { display: flex; align-items: center; gap: 6px; color: #3a5f86; }
.ls-range-row .ls-select { width: 6.5rem; }
.ls-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.ls-label { font-size: .74rem; font-weight: 600; color: #3a5f86; }
.ls-search { position: relative; }
.ls-search svg { position: absolute; left: 14px; top: 50%; width: 17px; height: 17px; transform: translateY(-50%); color: #3a5f86; pointer-events: none; }
.ls-input, .ls-select {
  width: 100%; height: 44px; border-radius: 10px; border: 1px solid rgba(36,71,107,.28); background: #fff; color: #24476B;
  font: 500 .88rem inherit; font-family: inherit; transition: border-color .2s, box-shadow .2s;
}
.ls-input { padding: 0 40px 0 42px; }
.ls-input::placeholder { color: #6b84a0; }
.ls-select { padding: 0 34px 0 14px; appearance: none; -webkit-appearance: none; cursor: pointer;
  background: #fff url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2324476B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E") no-repeat right 12px center / 14px; }
.ls-input:hover, .ls-select:hover { border-color: rgba(36,71,107,.5); }
.ls-input:focus-visible, .ls-select:focus-visible { outline: none; border-color: #24476B; box-shadow: 0 0 0 3px rgba(36,71,107,.18); }
.ls-clear-q { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); width: 32px; height: 32px; border: 0; border-radius: 8px;
  background: none; color: #3a5f86; cursor: pointer; display: grid; place-items: center; }
.ls-clear-q:hover { background: #EEF4FA; color: #24476B; }
.ls-clear-q svg { position: static; transform: none; width: 15px; height: 15px; }

.ls-chips { margin: 14px 0 0; padding: 0; list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
.ls-chip { display: inline-flex; align-items: center; gap: 8px; min-height: 36px; padding: 0 14px; border-radius: 999px;
  border: 1px solid rgba(36,71,107,.28); background: #fff; color: #24476B; font: 500 .8rem inherit; font-family: inherit; cursor: pointer;
  transition: background-color .2s, border-color .2s, color .2s; }
.ls-chip:hover { border-color: #24476B; }
.ls-chip[aria-pressed="true"] { background: #24476B; border-color: #24476B; color: #fff; }
.ls-chip-n { font-size: .72rem; font-weight: 600; opacity: .75; font-variant-numeric: tabular-nums; }
.ls-chip:disabled { opacity: .45; cursor: default; }
.ls-chip:disabled:hover { border-color: rgba(36,71,107,.28); }
.ls-chips-end { margin-left: auto; }
.ls-clearall { display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; border-radius: 999px;
  border: 1px dashed rgba(36,71,107,.5); background: transparent; color: #24476B; font: 600 .8rem inherit; font-family: inherit; cursor: pointer;
  transition: background-color .2s, border-color .2s, color .2s, opacity .2s; }
.ls-clearall svg { width: 13px; height: 13px; flex-shrink: 0; }
.ls-clearall:hover:not(:disabled) { background: #24476B; border-color: #24476B; color: #fff; }
.ls-clearall:disabled { opacity: .4; cursor: default; }

.ls-status { margin: 22px 0 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 14px; font-size: .84rem; color: #2f4d68; }
.ls-status strong { color: #24476B; font-variant-numeric: tabular-nums; }

/* ---- List: entries ---- */
.ls-groups { margin: 8px 0 0; padding: 0; list-style: none; }
.ls-year { position: sticky; top: 0; z-index: 1; margin: 0; padding: 22px 0 8px; background: #EEF4FA;
  font-size: .82rem; font-weight: 600; letter-spacing: .02em; color: #3a5f86; border-bottom: 1px solid rgba(36,71,107,.16); }
.ls-list { margin: 0; padding: 0; list-style: none; }
.ls-item { padding: 18px 0; border-bottom: 1px solid rgba(36,71,107,.1); }
@media (min-width: 760px) { .ls-item { display: grid; grid-template-columns: 9.5rem minmax(0, 1fr); column-gap: 28px; } }
.ls-kind { margin: 0 0 6px; font-size: .72rem; font-weight: 600; color: #3a5f86; }
.ls-kind span { font-weight: 500; }
.ls-kind-year::before { content: " · "; display: inline-block; text-decoration: none; }
@media (min-width: 760px) { .ls-kind { margin: 3px 0 0; } .ls-kind span { display: block; margin-top: 2px; } .ls-kind-year::before { content: none; } }
.ls-title { margin: 0; font-size: 1rem; font-weight: 600; line-height: 1.42; letter-spacing: -.012em; color: #24476B; }
.ls-authors { margin: 6px 0 0; font-size: .84rem; line-height: 1.55; color: #2f4d68; }
.ls-authors strong { font-weight: 600; color: #24476B; }
.ls-venue { margin: 4px 0 0; font-size: .82rem; line-height: 1.55; color: #3a5f86; overflow-wrap: anywhere; }
.ls-links { margin: 8px 0 0; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 16px; font-size: .78rem; }
.ls-links a { display: inline-flex; align-items: center; gap: 4px; font-weight: 600; color: #24476B; text-underline-offset: 4px; text-decoration-thickness: 1px; }
.ls-links svg { width: 13px; height: 13px; }
.ls-cites { display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: 999px; background: #DCE8F1; color: #24476B; font-weight: 600; font-variant-numeric: tabular-nums; }
.ls-links a.ls-cites { text-decoration: none; }
.ls-links a.ls-cites:hover { background: #c9dbe9; }
.ls-cites-src { font-weight: 500; font-size: .7rem; opacity: .8; }
.pb-wrap mark { background: #DCE8F1; color: inherit; border-radius: 3px; padding: 0 1px; }

.ls-dl, .ls-free { display: inline-flex; align-items: center; flex-wrap: wrap; gap: 4px 6px; min-height: 32px; padding: 4px 12px; border-radius: 8px;
  text-decoration: none; font-weight: 600; transition: background-color .2s, border-color .2s, color .2s; }
.ls-links .ls-dl { background: #24476B; color: #fff; border: 1px solid #24476B; }
.ls-links .ls-dl:hover { background: #fff; color: #24476B; }
.ls-links .ls-free { background: #fff; color: #24476B; border: 1px solid rgba(36,71,107,.4); }
.ls-links .ls-free:hover { border-color: #24476B; background: #EEF4FA; }
.ls-dl-meta { font-weight: 500; opacity: .85; }
.ls-dl-meta::before { content: "·"; margin-right: 6px; display: inline-block; text-decoration: none; }
.ls-doi { font-weight: 500; color: #3a5f86; overflow-wrap: anywhere; }
.ls-doi::before { content: "·"; margin: 0 6px 0 2px; display: inline-block; text-decoration: none; }
.pb-h2[tabindex="-1"]:focus { outline: none; }
.pb-h2[tabindex="-1"]:focus-visible { outline: 2px solid #24476B; outline-offset: 4px; border-radius: 4px; }

/* ---- Pagination ---- */
.pg { margin-top: 28px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; }
.pg-list { margin: 0; padding: 0; list-style: none; display: none; align-items: center; gap: 4px; }
@media (min-width: 640px) { .pg-list { display: flex; } .pg-of { display: none; } }
.pg-btn { min-width: 40px; height: 40px; padding: 0 12px; border-radius: 10px; border: 1px solid rgba(36,71,107,.28); background: #fff;
  color: #24476B; font: 600 .82rem inherit; font-family: inherit; font-variant-numeric: tabular-nums; cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px; transition: background-color .2s, border-color .2s, color .2s; }
.pg-btn:hover:not(:disabled) { border-color: #24476B; }
.pg-btn[aria-current="page"] { background: #24476B; border-color: #24476B; color: #fff; }
.pg-btn:disabled { opacity: .4; cursor: default; }
.pg-btn svg { width: 15px; height: 15px; }
.pg-gap { min-width: 24px; text-align: center; color: #3a5f86; }
.pg-of { font-size: .84rem; color: #2f4d68; font-variant-numeric: tabular-nums; }
.ls-empty { margin-top: 24px; padding: 28px; border-radius: 16px; border: 1px dashed rgba(36,71,107,.3); text-align: center; font-size: .9rem; color: #2f4d68; }
.ls-empty p { margin: 0 0 12px; }

.pb-loading { margin-top: 20px; font-size: .9rem; color: #3a5f86; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

/* ---- Phones: larger title, glass link pills, compact filters ---- */
@media (max-width: 639px) {
  .pb-hero .pb-title { font-size: 3.4rem; }
  .pb-hero .pb-ctas { gap: 14px 24px; margin-top: 34px; }
  .pb-hero .pb-btn { height: auto; padding: 2px 0; border: 0; border-radius: 0; background: none; color: #fff; box-shadow: none;
    font-size: .8rem; font-weight: 500; text-decoration: underline; text-decoration-thickness: 1px; text-underline-offset: 5px; text-decoration-color: rgba(255,255,255,.6);
    backdrop-filter: none; -webkit-backdrop-filter: none; }
  .pb-hero .pb-btn:hover { background: none; border: 0; color: #fff; text-decoration-color: #fff; }
  .pb-hero .pb-btn svg { width: 13px; height: 13px; }
  .pb-hero .pb-lede { font-size: .84rem; line-height: 1.7; max-width: 330px; margin-top: 32px; text-wrap: balance; }

  /* Counts: total on top, then two per row; number first, label under it so the numbers line up */
  .pb-counts { margin-top: 36px; min-height: 0; border-radius: 18px; }
  .pb-count, .pb-count.is-total { padding: 22px 10px; }
  .pb-count dd, .pb-count.is-total dd { order: 1; margin: 0; font-size: 1.7rem; }
  .pb-count dt, .pb-count.is-total dt { order: 2; margin-top: 8px; font-size: .74rem; line-height: 1.35; }
  .pb-count.is-total { grid-column: 1 / -1; padding: 28px 10px; }
  .pb-count.is-total dd { font-size: 2.6rem; }
  .pb-count.is-total dt { font-size: .82rem; }
  .pb-count:last-child:nth-child(even) { grid-column: 1 / -1; }

  .ls-controls { grid-template-columns: 1fr 1fr; gap: 10px 8px; }
  .ls-controls > .ls-field:first-child, .ls-controls > .ls-range { grid-column: 1 / -1; }
  .ls-field, .ls-range { gap: 4px; }
  .ls-range legend { margin-bottom: 4px; }
  .ls-label { font-size: .68rem; }
  .ls-input, .ls-select { height: 38px; border-radius: 9px; font-size: .78rem; }
  .ls-input { padding: 0 36px 0 36px; }
  .ls-search svg { left: 11px; width: 15px; height: 15px; }
  .ls-select { padding: 0 28px 0 11px; background-position: right 10px center; background-size: 12px; }
  .ls-range-row { gap: 6px; }
  .ls-range-row .ls-select { width: 100%; flex: 1; }
  .ls-chips { margin-top: 12px; gap: 6px; }
  .ls-chip, .ls-clearall { min-height: 30px; padding: 0 11px; font-size: .72rem; gap: 6px; }
  .ls-chips-end { margin-left: 0; }
  .ls-status { margin-top: 16px; font-size: .78rem; }
  /* Publisher link: "Publisher page ↗" stays on one line, the DOI drops to its own line below */
  .ls-links a.ls-pub { flex-wrap: wrap; gap: 2px 6px; white-space: nowrap; }
  .ls-pub svg { order: 2; }
  .ls-pub .ls-doi { order: 3; flex-basis: 100%; white-space: normal; overflow-wrap: anywhere; font-size: .74rem; }
  .ls-pub .ls-doi::before { content: none; }
}

@media (prefers-reduced-motion: reduce) {
  .pb-wrap *, .pb-wrap *::before, .pb-wrap *::after { transition: none !important; }
}
`

/* ----- Icons (inline, like the rest of the site) --------------------------- */
const Icon = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
const DownloadIcon = () => (
  <Icon>
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </Icon>
)
const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </Icon>
)
const CloseIcon = () => (
  <Icon>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
)
const OutIcon = () => (
  <Icon>
    <path d="M7 17 17 7M8 7h9v9" />
  </Icon>
)

/* ----- Helpers -------------------------------------------------------------- */

/** Wraps the parts of `text` that match the search in <mark>. */
function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim()
  if (q.length < 2) return <>{text}</>
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part))}
    </>
  )
}

function Authors({ names, query }: { names: string[]; query: string }) {
  return (
    <>
      {names.map((n, i) => (
        <span key={`${n}-${i}`}>
          {i > 0 ? ', ' : null}
          {/Ajith\s+Abraham/.test(n) ? <strong>{n}</strong> : <Highlight text={n} query={query} />}
        </span>
      ))}
    </>
  )
}

/** Page numbers to show: first, last, and two either side of the current one. */
function pageItems(page: number, pages: number): (number | 'gap')[] {
  const keep = new Set([1, pages, page - 2, page - 1, page, page + 1, page + 2])
  const out: (number | 'gap')[] = []
  for (let n = 1; n <= pages; n++) {
    if (keep.has(n)) out.push(n)
    else if (out[out.length - 1] !== 'gap') out.push('gap')
  }
  return out
}

const PrevIcon = () => (
  <Icon>
    <path d="m15 6-6 6 6 6" />
  </Icon>
)
const NextIcon = () => (
  <Icon>
    <path d="m9 6 6 6-6 6" />
  </Icon>
)

function Pagination({ page, pages, onPage }: { page: number; pages: number; onPage: (n: number) => void }) {
  return (
    <nav className="pg" aria-label="Pages of results">
      <button type="button" className="pg-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>
        <PrevIcon />
        Previous
      </button>
      <span className="pg-of">
        Page {page} of {pages}
      </span>
      <ul className="pg-list">
        {pageItems(page, pages).map((n, i) =>
          n === 'gap' ? (
            <li key={`gap-${i}`} className="pg-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <button
                type="button"
                className="pg-btn"
                aria-current={n === page ? 'page' : undefined}
                aria-label={`Page ${n}`}
                onClick={() => n !== page && onPage(n)}
              >
                {n}
              </button>
            </li>
          ),
        )}
      </ul>
      <button type="button" className="pg-btn" onClick={() => onPage(page + 1)} disabled={page === pages}>
        Next
        <NextIcon />
      </button>
    </nav>
  )
}

/** A round axis maximum: 10, 20, 25, 50, 100, 150, ... at or above `v`. */
function niceMax(v: number) {
  if (v <= 5) return 5
  const pow = 10 ** Math.floor(Math.log10(v))
  for (const step of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (step * pow >= v) return step * pow
  return 10 * pow
}

/* ----- Page ------------------------------------------------------------------ */

export default function Publications() {
  useEffect(() => {
    document.documentElement.classList.add('on-publications')
    return () => document.documentElement.classList.remove('on-publications')
  }, [])

  const [data, setData] = useState<PublicationData | null>(null)
  const [links, setLinks] = useState<LinksData | null>(null)
  const [cites, setCites] = useState<CitationsData | null>(null)
  const [failed, setFailed] = useState(false)

  const [query, setQuery] = useState('')
  const [type, setType] = useState<PubType | 'all'>('all')
  const [yearFrom, setYearFrom] = useState<number | null>(null)
  const [yearTo, setYearTo] = useState<number | null>(null)
  const [access, setAccess] = useState<Access>('all')
  const [sort, setSort] = useState<Sort>('newest')
  const [page, setPage] = useState(1)
  const q = useDeferredValue(query)
  const ids = useId()
  const listTop = useRef<HTMLHeadingElement>(null)

  // The full list and its links are separate files, fetched when this page opens.
  useEffect(() => {
    let alive = true
    Promise.all([
      import('../data/publications.json'),
      import('../data/publication-links.json'),
      import('../data/publication-citations.json'),
    ])
      .then(([list, linkFile, citeFile]) => {
        if (!alive) return
        setData(list.default as unknown as PublicationData)
        setLinks(linkFile.default as unknown as LinksData)
        setCites(citeFile.default as unknown as CitationsData)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  // Shared Navbar, Footer and Back-to-top use their dark look on light pages
  // (the class is named after the Career page, which introduced it).
  useEffect(() => {
  }, [])

  const items = useMemo(() => data?.items ?? [], [data])

  // Citation counts for CV entries that are among the most cited on Scholar.
  // Matched on the exact title (ignoring case and punctuation) only.
  const citations = useMemo(() => {
    const byTitle = new Map(SCHOLAR.items.map((p) => [titleKey(p.title), p]))
    const out = new Map<string, ScholarPaper>()
    for (const it of items) {
      const hit = byTitle.get(titleKey(it.title))
      // Same title and (nearly) the same year: guards against short generic titles.
      if (hit && it.year !== null && Math.abs(hit.year - it.year) <= 1) out.set(it.id, hit)
    }
    return out
  }, [items])

  // Only counts above zero are shown: a zero usually means "not yet counted by
  // this source", not "never cited".
  const citeOf = useMemo(() => {
    const all = cites?.items ?? {}
    return (id: string) => {
      const c = all[id]
      return c && c.cites > 0 ? c : undefined
    }
  }, [cites])
  const citeTotals = useMemo(() => {
    const t = { scholar: 0, openalex: 0 }
    for (const c of Object.values(cites?.items ?? {})) if (c && c.cites > 0) t[c.source === 'scholar' ? 'scholar' : 'openalex']++
    return t
  }, [cites])
  const hasCites = citeTotals.scholar + citeTotals.openalex > 0

  const linkOf = useMemo(() => {
    const all = links?.items ?? {}
    return (id: string) => all[id]
  }, [links])

  /** Free to read: a checked open-access PDF or page, or an authorised local PDF. */
  const isFree = useCallback((id: string) => Boolean(LOCAL[id] || linkOf(id)?.oa), [linkOf])

  const searchIndex = useMemo(
    () => items.map((it) => norm(`${it.title} ${it.authors.join(' ')} ${it.venue} ${it.year ?? ''} ${linkOf(it.id)?.doi ?? ''}`)),
    [items, linkOf],
  )

  // Filtering in steps, so each control can show counts for the others.
  const inYears = useCallback(
    (it: Publication) =>
      (yearFrom === null || (it.year !== null && it.year >= yearFrom)) && (yearTo === null || (it.year !== null && it.year <= yearTo)),
    [yearFrom, yearTo],
  )
  const inAccess = useCallback(
    (it: Publication) => access === 'all' || (access === 'doi' ? Boolean(linkOf(it.id)) : isFree(it.id)),
    [access, linkOf, isFree],
  )

  const byQuery = useMemo(() => {
    const terms = norm(q).split(/\s+/).filter(Boolean)
    if (!terms.length) return items
    return items.filter((_, i) => terms.every((t) => searchIndex[i].includes(t)))
  }, [items, searchIndex, q])

  const typeCounts = useMemo(() => {
    const c = Object.fromEntries(TYPES.map((t) => [t.id, 0])) as Record<PubType, number>
    for (const it of byQuery) if (inYears(it) && inAccess(it)) c[it.type]++
    return c
  }, [byQuery, inYears, inAccess])

  const accessCounts = useMemo(() => {
    const c = { all: 0, doi: 0, free: 0 }
    for (const it of byQuery) {
      if (!((type === 'all' || it.type === type) && inYears(it))) continue
      c.all++
      if (linkOf(it.id)) c.doi++
      if (isFree(it.id)) c.free++
    }
    return c
  }, [byQuery, type, inYears, linkOf, isFree])

  const years = useMemo(() => {
    const ys = items.map((it) => it.year).filter((y): y is number => y !== null)
    if (!ys.length) return []
    const lo = Math.min(...ys)
    const hi = Math.max(...ys)
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)
  }, [items])

  const perYear = useMemo(
    () => new Map<number, number>(Object.entries(PER_YEAR.perYear).map(([y, v]) => [Number(y), v])),
    [],
  )

  const results = useMemo(() => {
    const list = byQuery.filter((it) => (type === 'all' || it.type === type) && inYears(it) && inAccess(it))
    const y = (it: Publication, missing: number) => it.year ?? missing
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' }))
    // Most cited first; entries without a count follow, newest first.
    if (sort === 'citations')
      return [...list].sort((a, b) => (citeOf(b.id)?.cites ?? -1) - (citeOf(a.id)?.cites ?? -1) || y(b, 0) - y(a, 0))
    // The CV lists each category newest first, so ties keep its order.
    if (sort === 'oldest') return [...list].sort((a, b) => y(a, 9999) - y(b, 9999))
    return [...list].sort((a, b) => y(b, 0) - y(a, 0))
  }, [byQuery, type, inYears, inAccess, sort, citeOf])

  const pages = Math.max(1, Math.ceil(results.length / PAGE))
  const current = Math.min(page, pages)
  const first = (current - 1) * PAGE
  const shown = results.slice(first, first + PAGE)
  const groups = useMemo(() => {
    if (sort === 'title' || sort === 'citations') return [{ key: 'all', label: null as string | null, list: shown }]
    const out: { key: string; label: string | null; list: Publication[] }[] = []
    for (const it of shown) {
      const label = it.year === null ? 'Year not given' : String(it.year)
      const last = out[out.length - 1]
      if (last && last.label === label) last.list.push(it)
      else out.push({ key: label, label, list: [it] })
    }
    return out
  }, [shown, sort])

  const yearSet = yearFrom !== null || yearTo !== null
  const filtered = query.trim() !== '' || type !== 'all' || yearSet || access !== 'all'
  const resetPaging = () => setPage(1)
  const clearAll = () => {
    setQuery('')
    setType('all')
    setYearFrom(null)
    setYearTo(null)
    setAccess('all')
    resetPaging()
  }
  /** One year from the chart: select it, or clear it when it was the only one selected. */
  const pickYear = (y: number) => {
    const only = yearFrom === y && yearTo === y
    setYearFrom(only ? null : y)
    setYearTo(only ? null : y)
    resetPaging()
  }
  const goToPage = (n: number) => {
    setPage(n)
    // Back to the top of the list, and tell assistive technology where it is.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    listTop.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    listTop.current?.focus({ preventScroll: true })
  }
  const yearLabel =
    yearFrom !== null && yearFrom === yearTo
      ? String(yearFrom)
      : yearSet
        ? `${yearFrom ?? years[0]}–${yearTo ?? years[years.length - 1]}`
        : null
  const inRange = (y: number) => (yearFrom === null || y >= yearFrom) && (yearTo === null || y <= yearTo)

  const maxY = niceMax(Math.max(1, ...perYear.values()))
  const typeLabel = type === 'all' ? 'All types' : TYPES.find((t) => t.id === type)?.label
  const listId = `${ids}-list`

  return (
    <main id="publications" className="pb-wrap" aria-labelledby="pb-title">
      <style>{CSS}</style>

      <section className="pb-hero">
        <div className="pb-ascii" aria-hidden="true">
          <GradientASCII colors={['#1b3a5e', '#24476B', '#3d6ba0', '#7fa6d6', '#cdd9ff']} shape="horizon" cellSize={14} density={0.85} glyphOpacity={0.9} glow={0.35} softness={0.7} flicker={0.3} />
        </div>
        <div className="pb-hero-in pb-in">
          <h1 id="pb-title" className="pb-title" data-grid-avoid>
            Publications
          </h1>
          <div className="pb-ctas">
            <a className="pb-btn" href={SCHOLAR.profileUrl} target="_blank" rel="noopener noreferrer" data-grid-avoid>
              Google Scholar
            </a>
            <a className="pb-btn" href="https://www.scopus.com/authid/detail.uri?authorId=7202760099" target="_blank" rel="noopener noreferrer" data-grid-avoid>
              Scopus
            </a>
            <a className="pb-btn" href="https://www.webofscience.com/wos/author/record/A-1416-2008" target="_blank" rel="noopener noreferrer" data-grid-avoid>
              Web of Science
            </a>
            <a className="pb-btn" href="https://orcid.org/0000-0002-0169-6738" target="_blank" rel="noopener noreferrer" data-grid-avoid>
              ORCID
            </a>
            <a className="pb-btn" href={CV_URL} download data-grid-avoid>
              Download CV (PDF)
            </a>
          </div>

          <p className="pb-lede" data-grid-avoid>
            Journal articles, conference papers, books and edited volumes by Prof. Ajith Abraham, with links to each publisher and free copies where legally available.
          </p>

        </div>
      </section>

      <div className="pb-body">
        <div className="pb-in">
          <dl className="pb-counts" data-grid-avoid>
            <div className="pb-count is-total">
              <dt>Publications listed</dt>
              <dd>
                <CountUp value={FIGURES.total ?? items.length} />
              </dd>
            </div>
            {TYPES.map((t) => (
              <div key={t.id} className="pb-count">
                <dt>{t.label}</dt>
                <dd>
                  <CountUp value={FIGURES[t.id] ?? data?.counts[t.id] ?? 0} />
                </dd>
              </div>
            ))}
          </dl>
          {failed ? (
            <p className="pb-loading" role="alert">
              The publication list could not be loaded. Please reload the page, or{' '}
              <a href={CV_URL}>open the CV</a>.
            </p>
          ) : !data ? (
            <p className="pb-loading" role="status">
              Loading publications…
            </p>
          ) : (
            <>
              {/* Publications per year */}
                <section className="pb-section pb-gap pb-center" aria-labelledby="pb-years">
                  <h2 id="pb-years" className="pb-h2">
                    Publications per year
                  </h2>
                  <p className="pb-sub">
                    {q.trim() ? <>Matching “{q.trim()}”. </> : null}Select a year to filter the list.
                  </p>
                  <div className="pb-card pb-glass">
                    <div className={`ch${yearSet ? ' has-sel' : ''}${yearFrom !== null && yearFrom === yearTo ? ' is-single' : ''}`}>
                      <div className="ch-plot">
                        {[0, 0.5, 1].map((f) => (
                          <div key={f} className={`ch-grid${f === 0 ? ' ch-base' : ''}`} style={{ bottom: `${f * 100}%` }} aria-hidden="true">
                            <span>{nf.format(Math.round(maxY * f))}</span>
                          </div>
                        ))}
                        <div className="ch-bars" role="group" aria-label="Publications per year. Select a year to filter the list.">
                          {years.map((y) => {
                            const n = perYear.get(y) ?? 0
                            const h = (n / maxY) * 100
                            const sel = yearSet && inRange(y)
                            return (
                              <button
                                key={y}
                                type="button"
                                className={`ch-col${sel ? ' is-sel' : ''}`}
                                aria-pressed={sel}
                                aria-label={`${y}: ${n} ${n === 1 ? 'publication' : 'publications'}`}
                                aria-controls={listId}
                                onClick={() => pickYear(y)}
                                style={{ '--y': `${h}%` } as CSSProperties}
                              >
                                <span className="ch-bar" style={{ height: `${h}%` }} />
                                <span className="ch-tip" aria-hidden="true">
                                  <span className="ch-tip-y">{y}</span>
                                  <span className="ch-tip-n">
                                    {n}
                                    <small>{n === 1 ? 'publication' : 'publications'}</small>
                                  </span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="ch-axis" aria-hidden="true">
                        {years.map((y, i) =>
                          y % 5 === 0 ? (
                            <span key={y} style={{ left: `${((i + 0.5) / years.length) * 100}%` }}>
                              {y}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </div>
                    <div className="ch-foot">
                      <span>
                        {yearLabel
                          ? `${yearLabel}: ${nf.format(years.filter(inRange).reduce((n, y) => n + (perYear.get(y) ?? 0), 0))} publications`
                          : `Busiest year: ${(() => {
                              let best = 0
                              let by = 0
                              perYear.forEach((n, yy) => {
                                if (n > best) {
                                  best = n
                                  by = yy
                                }
                              })
                              return best ? `${by}, with ${nf.format(best)}` : 'none'
                            })()}`}
                      </span>
                      {yearSet ? (
                        <button
                          type="button"
                          className="pb-link"
                          onClick={() => {
                            setYearFrom(null)
                            setYearTo(null)
                            resetPaging()
                          }}
                        >
                          Show all years
                        </button>
                      ) : null}
                    </div>
                  </div>
                </section>


              {/* Full list */}
              <section className="pb-section pb-gap" aria-labelledby="pb-all">
                <h2 id="pb-all" className="pb-h2 pb-center-h" ref={listTop} tabIndex={-1}>
                  All publications
                </h2>

                <div className="ls-controls" role="search">
                  <div className="ls-field">
                    <label className="ls-label" htmlFor={`${ids}-q`}>
                      Search titles, authors and venues
                    </label>
                    <div className="ls-search">
                      <SearchIcon />
                      <input
                        id={`${ids}-q`}
                        className="ls-input"
                        type="search"
                        value={query}
                        placeholder="e.g. swarm intelligence, Snášel, IEEE Transactions"
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(e) => {
                          setQuery(e.target.value)
                          resetPaging()
                        }}
                      />
                      {query ? (
                        <button
                          type="button"
                          className="ls-clear-q"
                          aria-label="Clear search"
                          onClick={() => {
                            setQuery('')
                            resetPaging()
                          }}
                        >
                          <CloseIcon />
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <fieldset className="ls-field ls-range">
                    <legend className="ls-label">Years</legend>
                    <div className="ls-range-row">
                      <label className="sr-only" htmlFor={`${ids}-yf`}>
                        From year
                      </label>
                      <select
                        id={`${ids}-yf`}
                        className="ls-select"
                        value={yearFrom ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? Number(e.target.value) : null
                          setYearFrom(v)
                          if (v !== null && yearTo !== null && yearTo < v) setYearTo(v)
                          resetPaging()
                        }}
                      >
                        <option value="">From</option>
                        {years.map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                      <span aria-hidden="true">–</span>
                      <label className="sr-only" htmlFor={`${ids}-yt`}>
                        To year
                      </label>
                      <select
                        id={`${ids}-yt`}
                        className="ls-select"
                        value={yearTo ?? ''}
                        onChange={(e) => {
                          const v = e.target.value ? Number(e.target.value) : null
                          setYearTo(v)
                          if (v !== null && yearFrom !== null && yearFrom > v) setYearFrom(v)
                          resetPaging()
                        }}
                      >
                        <option value="">To</option>
                        {[...years].reverse().map((y) => (
                          <option key={y} value={y}>
                            {y}
                          </option>
                        ))}
                      </select>
                    </div>
                  </fieldset>
                  <div className="ls-field">
                    <label className="ls-label" htmlFor={`${ids}-a`}>
                      Access
                    </label>
                    <select
                      id={`${ids}-a`}
                      className="ls-select"
                      value={access}
                      onChange={(e) => {
                        setAccess(e.target.value as Access)
                        resetPaging()
                      }}
                    >
                      <option value="all">All entries ({nf.format(accessCounts.all)})</option>
                      <option value="doi">With publisher link ({nf.format(accessCounts.doi)})</option>
                      <option value="free">Free to read ({nf.format(accessCounts.free)})</option>
                    </select>
                  </div>
                  <div className="ls-field">
                    <label className="ls-label" htmlFor={`${ids}-s`}>
                      Sort
                    </label>
                    <select
                      id={`${ids}-s`}
                      className="ls-select"
                      value={sort}
                      onChange={(e) => {
                        setSort(e.target.value as Sort)
                        resetPaging()
                      }}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                      <option value="title">Title, A to Z</option>
                      <option value="citations" disabled={!hasCites}>
                        {hasCites ? 'Most cited first' : 'Most cited first (no citation data yet)'}
                      </option>
                    </select>
                  </div>
                </div>

                <ul className="ls-chips" aria-label="Publication type">
                  <li>
                    <button
                      type="button"
                      className="ls-chip"
                      aria-pressed={type === 'all'}
                      aria-controls={listId}
                      onClick={() => {
                        setType('all')
                        resetPaging()
                      }}
                    >
                      All types
                      <span className="ls-chip-n">{nf.format(Object.values(typeCounts).reduce((a, b) => a + b, 0))}</span>
                    </button>
                  </li>
                  {TYPES.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className="ls-chip"
                        aria-pressed={type === t.id}
                        aria-controls={listId}
                        disabled={typeCounts[t.id] === 0 && type !== t.id}
                        onClick={() => {
                          setType(type === t.id ? 'all' : t.id)
                          resetPaging()
                        }}
                      >
                        {t.label}
                        <span className="ls-chip-n">{nf.format(typeCounts[t.id])}</span>
                      </button>
                    </li>
                  ))}
                  <li className="ls-chips-end">
                    <button type="button" className="ls-clearall" onClick={clearAll} disabled={!filtered} aria-controls={listId}>
                      <CloseIcon />
                      Clear all filters
                    </button>
                  </li>
                </ul>

                <p className="ls-status" role="status" aria-live="polite">
                  <span>
                    {results.length ? (
                      <>
                        Showing <strong>{nf.format(first + 1)}–{nf.format(first + shown.length)}</strong> of{' '}
                        <strong>{nf.format(results.length)}</strong>
                        {filtered ? ' matching publications' : ' publications'}
                        {yearLabel ? `, ${yearLabel}` : ''}
                      </>
                    ) : (
                      'No publications match'
                    )}
                  </span>
                </p>

                <div id={listId}>
                  {results.length === 0 ? (
                    <div className="ls-empty">
                      <p>Nothing in the list matches these filters. Try fewer words, or another year, type or access.</p>
                      <button type="button" className="pb-btn" onClick={clearAll}>
                        Clear all filters
                      </button>
                    </div>
                  ) : (
                    <ol className="ls-groups">
                      {groups.map((g) => (
                        <li key={g.key}>
                          {g.label ? <h3 className="ls-year">{g.label}</h3> : null}
                          <ol className="ls-list">
                            {g.list.map((it) => {
                              const cited = citations.get(it.id)
                              const count = citeOf(it.id)
                              // The matched Scholar article, even when its count (zero) is not shown.
                              const scholarRaw = cites?.items[it.id]?.source === 'scholar' ? cites.items[it.id]?.scholar : undefined
                              const link = linkOf(it.id)
                              const local = LOCAL[it.id]
                              const oa = link?.oa
                              return (
                                <li key={it.id} className="ls-item">
                                  <p className="ls-kind">
                                    {TYPE_ONE[it.type]}
                                    {(sort === 'title' || sort === 'citations') && it.year ? <span className="ls-kind-year">{it.year}</span> : null}
                                  </p>
                                  <div>
                                    {/* One level below the year heading, or below "All publications" when not grouped. */}
                                    {g.label ? (
                                      <h4 className="ls-title">
                                        <Highlight text={it.title} query={q} />
                                      </h4>
                                    ) : (
                                      <h3 className="ls-title">
                                        <Highlight text={it.title} query={q} />
                                      </h3>
                                    )}
                                    {it.authors.length ? (
                                      <p className="ls-authors">
                                        <Authors names={it.authors} query={q} />
                                      </p>
                                    ) : null}
                                    {it.venue ? (
                                      <p className="ls-venue">
                                        <Highlight text={it.venue} query={q} />
                                      </p>
                                    ) : null}
                                    <p className="ls-links">
                                      {local ? (
                                        <a className="ls-dl" href={local.href} download>
                                          <DownloadIcon />
                                          Download PDF
                                          <span className="ls-dl-meta">
                                            {local.version}, {fileSize(local.sizeKB)}
                                          </span>
                                          <span className="sr-only">: {it.title}</span>
                                        </a>
                                      ) : null}
                                      {oa?.pdf ? (
                                        <a className="ls-free" href={oa.pdf} target="_blank" rel="noopener noreferrer">
                                          Free PDF
                                          <span className="ls-dl-meta">
                                            {[oa.version ? OA_VERSION[oa.version] : null, licenceLabel(oa.license)].filter(Boolean).join(', ') ||
                                              'Open access'}
                                          </span>
                                          <OutIcon />
                                          <span className="sr-only">: {it.title} (opens in a new tab)</span>
                                        </a>
                                      ) : oa?.landing ? (
                                        <a className="ls-free" href={oa.landing} target="_blank" rel="noopener noreferrer">
                                          Free to read
                                          {oa.version && OA_VERSION[oa.version] ? <span className="ls-dl-meta">{OA_VERSION[oa.version]}</span> : null}
                                          <OutIcon />
                                          <span className="sr-only">: {it.title} (opens in a new tab)</span>
                                        </a>
                                      ) : null}
                                      {link ? (
                                        <a className="ls-pub" href={doiUrl(link.doi)} target="_blank" rel="noopener noreferrer">
                                          Publisher page
                                          <span className="ls-doi">doi:{link.doi}</span>
                                          <OutIcon />
                                          <span className="sr-only">: {it.title} (opens in a new tab)</span>
                                        </a>
                                      ) : null}
                                      {count ? (
                                        <a
                                          className="ls-cites"
                                          href={
                                            count.source === 'scholar' && count.scholar
                                              ? scholarArticleUrl(count.scholar)
                                              : `https://openalex.org/${count.work}`
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          title={`Citation count from ${count.source === 'scholar' ? 'Google Scholar' : 'OpenAlex'}, retrieved ${cites?.generated ? formatDay(cites.generated) : ''}`}
                                        >
                                          {nf.format(count.cites)} {count.cites === 1 ? 'citation' : 'citations'}
                                          <span className="ls-cites-src">{count.source === 'scholar' ? 'Google Scholar' : 'OpenAlex'}</span>
                                          <span className="sr-only"> (opens in a new tab)</span>
                                        </a>
                                      ) : null}
                                      {count?.source !== 'scholar' ? (
                                        <a
                                          href={
                                            scholarRaw ? scholarArticleUrl(scholarRaw) : cited ? scholarPaperUrl(cited.id) : scholarSearchUrl(it.title)
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {scholarRaw || cited ? 'View on Google Scholar' : 'Find on Google Scholar'}
                                          <OutIcon />
                                          <span className="sr-only">: {it.title} (opens in a new tab)</span>
                                        </a>
                                      ) : null}
                                    </p>
                                  </div>
                                </li>
                              )
                            })}
                          </ol>
                        </li>
                      ))}
                    </ol>
                  )}

                  {pages > 1 ? <Pagination page={current} pages={pages} onPage={goToPage} /> : null}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </main>
  )
}