/* ==========================================================================
   Matching rules for scripts/enrich-publications.mjs. Pure functions, so they
   can be tested without a network (scripts/lib/links.test.mjs).

   A DOI is attached to a CV entry only when the match is confident:
   - the titles are (nearly) identical once case, accents and punctuation are
     ignored,
   - the years agree (one year apart is allowed for online-first articles),
   - Ajith Abraham is among the record's authors or editors,
   - the kind of record fits (a journal entry needs a journal article, ...),
   - where the CV wording differs a little from the publisher's, the journal
     or book also matches (and, for larger differences, the page numbers),
   - and no second, equally good record with another DOI exists.
   Anything less goes to the review file instead of the site.
   ========================================================================== */

/** Lower case, accents removed, punctuation to spaces. */
export function normTitle(s) {
  return String(s ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/<[^>]+>/g, ' ') // Crossref titles can carry <i>, <sub> ...
    .replace(/&[a-z]+;/g, ' ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

/** 1 for identical strings, 0 for nothing in common (Levenshtein ratio). */
export function similarity(a, b) {
  if (a === b) return 1
  if (!a || !b) return 0
  const m = a.length
  const n = b.length
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const cur = [i]
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
    prev = cur
  }
  return 1 - prev[n] / Math.max(m, n)
}

/** Crossref record types that fit each CV category. */
const TYPE_FIT = {
  journal: ['journal-article'],
  conference: ['proceedings-article', 'book-chapter'],
  chapter: ['book-chapter', 'reference-entry', 'book-section', 'book-part'],
  book: ['book', 'monograph', 'reference-book'],
  'edited-book': ['book', 'edited-book', 'monograph', 'reference-book', 'book-set'],
  proceedings: ['proceedings', 'book', 'edited-book', 'book-set', 'book-series'],
  other: null, // invited and short articles: any scholarly type
}
/** Never a publisher link for a CV entry. */
const EXCLUDED_TYPES = new Set(['peer-review', 'component', 'dataset', 'posted-content', 'grant', 'standard', 'report-component'])

export function typeFits(cvType, crossrefType) {
  if (!crossrefType) return true // Google Scholar gives no record type
  if (EXCLUDED_TYPES.has(crossrefType)) return false
  const fit = TYPE_FIT[cvType]
  return fit === null || fit === undefined ? true : fit.includes(crossrefType)
}

/** All the ways the record's title can be written: title, and title plus subtitle. */
export function candidateTitles(rec) {
  const titles = [...(rec.title ?? [])]
  for (const t of rec.title ?? []) for (const sub of rec.subtitle ?? []) titles.push(`${t}: ${sub}`, `${t} ${sub}`)
  return titles.filter(Boolean)
}

export function candidateYear(rec) {
  for (const key of ['issued', 'published-print', 'published-online', 'published']) {
    const y = rec[key]?.['date-parts']?.[0]?.[0]
    if (Number.isInteger(y)) return y
  }
  return null
}

/** True when an author or editor is Ajith Abraham (given name may be "A." or missing). */
export function hasAbraham(rec) {
  const people = [...(rec.author ?? []), ...(rec.editor ?? [])]
  return people.some((p) => {
    const family = normTitle(p.family ?? p.name ?? '')
    const given = normTitle(p.given ?? '')
    if (family === 'abraham') return given === '' || given.startsWith('a')
    // Some records put the whole name in "name" or swap the fields.
    return /\bajith\b/.test(`${given} ${family}`) && /\babraham\b/.test(`${given} ${family}`)
  })
}

/** The journal or book name of the record appears in the CV's venue text. */
export function venueMatches(entry, rec) {
  const cv = normTitle(entry.venue)
  // The CV's journal or book name: the venue text before volume, pages or ISBN.
  const cvName = normTitle(String(entry.venue ?? '').split(/,\s*\d|\s\d+\s*\(|ISBN|\bVol\b/i)[0])
  if (!cv) return false
  return [...(rec['container-title'] ?? []), ...(rec['short-container-title'] ?? [])].some((c) => {
    const name = normTitle(c)
    if (name.length < 4) return false
    if (cv.includes(name)) return true
    // "...Part A" in the CV vs "...Part A: Systems and Humans" at the publisher
    if (cvName.length >= 12 && (name.startsWith(cvName) || cvName.startsWith(name))) return true
    return similarity(name, cvName) >= 0.9
  })
}

/** The record's first page number appears in the CV's venue text. */
export function pagesMatch(entry, rec) {
  const first = String(rec.page ?? '').match(/\d+/)?.[0]
  if (!first || first.length < 2) return false
  return new RegExp(`(^|\\D)${first}(\\D|$)`).test(String(entry.venue ?? ''))
}

const people = (rec) => (rec.author?.length ?? 0) + (rec.editor?.length ?? 0)

/**
 * Scores one Crossref record against one CV entry.
 * Returns { ok, score, reason, ... } where ok means "confident enough to publish".
 */
export function assess(entry, rec, { requireDoi = true } = {}) {
  const cvTitle = normTitle(entry.title)
  const sim = Math.max(0, ...candidateTitles(rec).map((t) => similarity(cvTitle, normTitle(t))))
  const year = candidateYear(rec)
  const yearDiff = entry.year != null && year != null ? Math.abs(entry.year - year) : null
  const abraham = hasAbraham(rec)
  const fits = typeFits(entry.type, rec.type)
  const shortTitle = cvTitle.split(' ').length < 5 // "Soft Computing", "Artificial Neural Networks"

  const venue = venueMatches(entry, rec)
  const pages = pagesMatch(entry, rec)
  const doi = rec.DOI ? String(rec.DOI).toLowerCase() : null
  const base = { key: rec.key ?? doi, doi, sim, year, yearDiff, abraham, fits, venue, pages, type: rec.type, title: candidateTitles(rec)[0] ?? '' }

  if (EXCLUDED_TYPES.has(rec.type)) return { ...base, ok: false, reason: `record type ${rec.type}` }
  if (requireDoi && !rec.DOI) return { ...base, ok: false, reason: 'no DOI' }
  if (people(rec) > 0 && !abraham) return { ...base, ok: false, reason: 'Abraham not among authors or editors' }
  if (people(rec) === 0 && !(sim >= 0.98 && yearDiff === 0 && fits)) return { ...base, ok: false, reason: 'no author list to check' }
  if (yearDiff === null) {
    if (sim < 0.99 || !fits) return { ...base, ok: false, reason: 'no year to compare' }
  } else if (yearDiff > 1) {
    return { ...base, ok: false, reason: `years differ (${entry.year} vs ${year})` }
  }
  if (shortTitle && !(sim >= 0.99 && yearDiff === 0 && fits)) return { ...base, ok: false, reason: 'short, generic title' }

  // Same title: enough. Slightly different wording: the journal or book must match
  // too, and for larger differences also the page numbers.
  const strong = sim >= 0.97
  const sameVenue = sim >= 0.9 && yearDiff === 0 && fits && venue
  const samePages = sim >= 0.85 && yearDiff !== null && yearDiff <= 1 && fits && venue && pages
  if (!(strong || sameVenue || samePages)) {
    const why = sim >= 0.85 && !venue ? 'journal or book name differs' : `titles differ (similarity ${sim.toFixed(2)})`
    return { ...base, ok: false, reason: why }
  }
  return { ...base, ok: true, reason: 'confident match' }
}

/**
 * Picks the DOI for an entry from Crossref results.
 * Returns { doi, match } for a confident, unambiguous match, otherwise { doi: null, review }.
 */
export function chooseDoi(entry, records) {
  const r = chooseRecord(entry, records)
  return r.key ? { doi: r.key, match: r.match } : { doi: null, review: r.review }
}

/**
 * The general form: picks one record (by `key`, the DOI unless set) for an
 * entry, or none with the reason for review. Used for Crossref and OpenAlex.
 */
export function chooseRecord(entry, records, { requireDoi = true } = {}) {
  const assessed = records.map((r) => assess(entry, r, { requireDoi })).sort((a, b) => b.sim - a.sim)
  let passing = assessed.filter((a) => a.ok)
  const distinct = (list) => [...new Set(list.map((a) => a.key))]

  if (distinct(passing).length > 1) {
    // Prefer records of the right kind, then the closest title.
    const fitting = passing.filter((a) => a.fits)
    if (fitting.length) passing = fitting
    const best = Math.max(...passing.map((a) => a.sim))
    passing = passing.filter((a) => best - a.sim < 0.01)
  }
  if (distinct(passing).length === 1) return { key: passing[0].key, match: passing[0] }
  if (distinct(passing).length > 1) {
    return { key: null, review: { reason: 'several records match equally well', candidates: passing.slice(0, 3) } }
  }
  const near = assessed.filter((a) => a.sim >= 0.8).slice(0, 3)
  return { key: null, review: near.length ? { reason: near[0].reason, candidates: near } : null }
}

/* ----- OpenAlex ------------------------------------------------------------- */

/** "https://doi.org/10.1/ABC" -> "10.1/abc" */
export const bareDoi = (doi) => (doi ? String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '').toLowerCase() : null)

/** "https://openalex.org/W123" -> "W123" */
export const openAlexId = (id) => String(id ?? '').replace(/^https?:\/\/openalex\.org\//, '')

// OpenAlex record types that are never the CV entry itself.
const OPENALEX_SKIP = new Set(['paratext', 'erratum', 'retraction', 'peer-review', 'dataset', 'grant', 'preprint', 'supplementary-materials', 'libguides'])

/** The Crossref-style type of an OpenAlex work, so the same type rules apply. */
export function openAlexType(work) {
  if (OPENALEX_SKIP.has(work.type)) return 'peer-review' // an excluded type
  if (work.type_crossref) return work.type_crossref
  const source = work.primary_location?.source?.type
  switch (work.type) {
    case 'article':
    case 'review':
    case 'editorial':
    case 'letter':
      return source === 'conference' ? 'proceedings-article' : source === 'book series' ? 'book-chapter' : 'journal-article'
    case 'book-chapter':
      return 'book-chapter'
    case 'book':
      return 'book'
    case 'reference-entry':
      return 'reference-entry'
    default:
      return work.type ?? 'other'
  }
}

/**
 * An OpenAlex work in the shape assess() reads. When the ORCID given is on an
 * authorship, that author counts as Prof. Abraham whatever the spelling.
 */
export function fromOpenAlex(work, orcid) {
  const people = (work.authorships ?? []).map((a) => {
    const name = String(a.author?.display_name ?? a.raw_author_name ?? '').trim()
    if (orcid && String(a.author?.orcid ?? '').endsWith(orcid)) return { given: 'Ajith', family: 'Abraham' }
    const parts = name.split(/\s+/)
    return { given: parts.slice(0, -1).join(' '), family: parts[parts.length - 1] ?? '' }
  })
  const title = work.title ?? work.display_name ?? ''
  return {
    key: openAlexId(work.id),
    DOI: bareDoi(work.doi),
    title: title ? [title] : [],
    type: openAlexType(work),
    issued: work.publication_year ? { 'date-parts': [[work.publication_year]] } : undefined,
    author: people,
    'container-title': work.primary_location?.source?.display_name ? [work.primary_location.source.display_name] : [],
    page: work.biblio?.first_page ? `${work.biblio.first_page}${work.biblio.last_page ? `-${work.biblio.last_page}` : ''}` : undefined,
    cited: Number.isInteger(work.cited_by_count) ? work.cited_by_count : null,
  }
}

/**
 * Citations for one CV entry from OpenAlex works.
 * 1. DOI first: the work with that DOI, if its title is recognisably the same.
 * 2. Otherwise the title, year, author, venue rules of assess(), on the candidates.
 * Returns { work, method } or { work: null, review: { reason, candidates } }.
 */
export function matchCitation(entry, { doi, byDoi, candidates, orcid }) {
  if (doi) {
    const hit = byDoi.get(bareDoi(doi))
    if (hit) {
      const rec = fromOpenAlex(hit, orcid)
      const sim = Math.max(0, ...candidateTitles(rec).map((t) => similarity(normTitle(entry.title), normTitle(t))))
      if (sim >= 0.75) return { work: rec, method: 'doi' }
      return { work: null, review: { reason: `OpenAlex record for the DOI has a different title (similarity ${sim.toFixed(2)})`, candidates: [{ key: rec.key, doi: rec.DOI, title: rec.title[0] ?? '', year: candidateYear(rec), sim, type: rec.type }] } }
    }
  }
  const seen = new Set()
  const records = []
  for (const w of candidates) {
    const rec = fromOpenAlex(w, orcid)
    if (!rec.key || seen.has(rec.key)) continue
    seen.add(rec.key)
    records.push(rec)
  }
  const r = chooseRecord(entry, records, { requireDoi: false })
  if (r.key) return { work: records.find((x) => x.key === r.key), method: 'title' }
  return { work: null, review: r.review ?? { reason: 'no OpenAlex record found', candidates: [] } }
}

/**
 * When several CV entries matched the same OpenAlex work (a paper listed twice,
 * or a conference and a journal version with one title), none of them keeps it.
 */
export function dropSharedMatches(matches) {
  const byWork = new Map()
  for (const [id, m] of matches) if (m.work) byWork.set(m.work.key, [...(byWork.get(m.work.key) ?? []), id])
  const dropped = new Map()
  for (const [key, ids] of byWork) {
    if (ids.length < 2) continue
    for (const id of ids) dropped.set(id, { key, others: ids.filter((x) => x !== id) })
  }
  return dropped
}

/** Order of preference for a free copy: the publisher's version first. */
const VERSION_RANK = { publishedVersion: 0, acceptedVersion: 1, submittedVersion: 2 }

/**
 * Reads an Unpaywall record. Unpaywall lists only copies that are free to read
 * legally (publisher open access and repositories). Returns the PDF links to
 * verify, best first, and the landing page of the best location.
 */
export function openAccessOptions(rec) {
  if (!rec || rec.is_oa !== true) return null
  const locations = [rec.best_oa_location, ...(rec.oa_locations ?? [])].filter(Boolean)
  const seen = new Set()
  const pdfs = []
  for (const loc of locations) {
    if (!loc.url_for_pdf || seen.has(loc.url_for_pdf)) continue
    seen.add(loc.url_for_pdf)
    pdfs.push({
      url: loc.url_for_pdf,
      landing: loc.url_for_landing_page ?? loc.url ?? null,
      version: loc.version ?? null,
      license: loc.license ?? null,
      host: loc.host_type ?? null,
      repository: loc.repository_institution ?? null,
    })
  }
  pdfs.sort((a, b) => (VERSION_RANK[a.version] ?? 3) - (VERSION_RANK[b.version] ?? 3))
  const best = rec.best_oa_location ?? locations[0] ?? null
  return {
    status: rec.oa_status ?? null,
    pdfs,
    landing: best
      ? {
          url: best.url_for_landing_page ?? best.url ?? null,
          version: best.version ?? null,
          license: best.license ?? null,
          host: best.host_type ?? null,
        }
      : null,
  }
}

/** True when the first bytes are a PDF file header. */
export function looksLikePdf(bytes) {
  if (!bytes || bytes.length < 5) return false
  // Allow a little leading whitespace or a byte-order mark before "%PDF-".
  const head = Buffer.from(bytes.subarray(0, 1024)).toString('latin1')
  const at = head.indexOf('%PDF-')
  return at !== -1 && at < 16
}

/** A citation-style query string for Crossref: title, journal or book, year. */
export function crossrefQuery(entry) {
  const venue = String(entry.venue ?? '').split(/,|\(|ISBN/)[0].trim()
  return [entry.title, venue, entry.year ?? ''].filter(Boolean).join(' ').slice(0, 600)
}

/* ----- Google Scholar (profile articles, via SerpAPI) ------------------------- */

/** "IEEE Transactions on Evolutionary Computation 13 (3), 526-553, 2009" -> the journal name. */
export function scholarVenue(publication) {
  return String(publication ?? '')
    .replace(/,\s*(19|20)\d\d\s*$/, '')
    .split(/,?\s+\d/)[0]
    .trim()
}

/**
 * A Google Scholar profile article in the shape assess() reads. Every article
 * comes from Prof. Abraham's own profile, so he counts as an author.
 */
export function fromScholar(article) {
  const pub = String(article.publication ?? '')
  const pages = pub.match(/(\d+)\s*[-–]\s*(\d+)/)
  const year = Number.parseInt(article.year, 10)
  const venue = scholarVenue(pub)
  return {
    key: article.citation_id ?? null,
    DOI: null,
    title: article.title ? [article.title] : [],
    type: undefined,
    issued: Number.isInteger(year) ? { 'date-parts': [[year]] } : undefined,
    author: [{ given: 'Ajith', family: 'Abraham' }],
    'container-title': venue ? [venue] : [],
    page: pages ? `${pages[1]}-${pages[2]}` : undefined,
    cited: Number.isInteger(article.cited_by?.value) ? article.cited_by.value : 0,
  }
}

/** The profile article for a CV entry, by the title, year, journal and page rules. */
export function matchScholar(entry, articles) {
  const records = articles.map(fromScholar).filter((r) => r.key)
  const r = chooseRecord(entry, records, { requireDoi: false })
  if (r.key) return { work: records.find((x) => x.key === r.key), method: 'title' }
  return { work: null, review: r.review ?? { reason: 'not on the Google Scholar profile', candidates: [] } }
}
