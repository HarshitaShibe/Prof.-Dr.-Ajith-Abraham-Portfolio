/* ==========================================================================
   Builds src/data/journals.json for the Journals page.

     npm run journals:build                       reads the saved OpenAlex answer (scripts/.cache), no network
     npm run journals:build -- --refresh you@example.org   downloads it again first (needs OPENALEX_API_KEY)
     options: --check-crossref  confirm unconfirmed DOIs live at Crossref
              --dry             print results, write nothing
              --force           accept a result much smaller than the previous one

   A paper is COUNTED only when all of these hold:
     1. OpenAlex lists it under ORCID 0000-0002-0169-6738 (identity)
     2. its OpenAlex source is one of the eight journals (name and ISSN agree)
     3. its type is article, review or letter, and it has a DOI
     4. it matches exactly one entry of the CV publication list (DOI, or strict title + year + journal)
     5. the DOI is confirmed by Crossref (the CV entry's Crossref DOI equals it, or a live check passes)
   Everything else goes to scripts/output/journals-review.csv and is never counted.
   Totals are the sum of OpenAlex cited_by_count over ALL counted, de-duplicated papers.
   ========================================================================== */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './lib/args.mjs'
import { ORCID, COUNT_TYPES, JOURNALS } from './lib/journals.config.mjs'
import { assignJournal, journalFromVenue, aggregateJournal, normText, similarity, bareDoi, openAlexId, normTitle } from './lib/journals.mjs'

const ROOT = process.env.LINKS_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const P = (...p) => path.join(ROOT, ...p)
const CACHE = process.env.LINKS_CACHE_DIR ?? P('scripts/.cache')
const OPENALEX = process.env.OPENALEX_API ?? 'https://api.openalex.org'
const CROSSREF = process.env.CROSSREF_API ?? 'https://api.crossref.org'
const OUT = P('src/data/journals.json')
const OUT_DIR = P('scripts/output')
const FIELDS = 'id,doi,title,display_name,publication_year,cited_by_count,type,authorships,primary_location,biblio'

const args = parseArgs()
const EMAIL = args.email ?? process.env.OPENALEX_MAILTO
const KEY = args.get('api-key') ?? args.get('api_key') ?? process.env.OPENALEX_API_KEY
const REFRESH = args.has('refresh')
const CHECK_CROSSREF = args.has('check-crossref')
const DRY = args.has('dry')
const FORCE = args.has('force')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const readJson = (f, fallback) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')) } catch { return fallback } }
const sha = (s) => crypto.createHash('sha1').update(s).digest('hex')
const hide = (u) => u.replace(/(api_key|mailto)=[^&]*/g, '$1=…')

/* ----- network (only with --refresh / --check-crossref) ---------------------- */
async function getJson(url, { allow404 = false } = {}) {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'user-agent': `portfolio-journals/1.0 (mailto:${EMAIL ?? 'unknown'})` } })
    if (res.ok) return res.json()
    if (res.status === 404 && allow404) return null
    if (res.status === 401 || res.status === 403) throw new Error(`Refused (${res.status}) for ${hide(url)}. Check the key.`)
    if (res.status === 429 || res.status >= 500) { await sleep(Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** attempt); continue }
    throw new Error(`${res.status} ${res.statusText} for ${hide(url)}`)
  }
  throw new Error(`Gave up after retries: ${hide(url)}`)
}
async function downloadWorks() {
  if (!KEY || !EMAIL?.includes('@')) throw new Error('--refresh needs OPENALEX_API_KEY and an email: npm run journals:build -- --refresh you@example.org')
  const works = []
  let cursor = '*'
  while (cursor) {
    const q = new URLSearchParams({ filter: `author.orcid:${ORCID}`, 'per-page': '200', cursor, select: FIELDS, mailto: EMAIL, api_key: KEY })
    const page = await getJson(`${OPENALEX}/works?${q}`)
    works.push(...(page?.results ?? []))
    cursor = page?.meta?.next_cursor ?? null
    if (!page?.results?.length) break
    await sleep(150)
  }
  if (works.length === 0) throw new Error('OpenAlex returned no works; keeping the previous data.')
  return works
}
async function sourceHomepage(sourceId) {
  const q = new URLSearchParams({ select: 'id,homepage_url,host_organization_name', mailto: EMAIL, api_key: KEY })
  const s = await getJson(`${OPENALEX}/sources/${sourceId}?${q}`, { allow404: true })
  return s?.homepage_url ?? null
}
async function crossrefOk(doi, journal) {
  const q = EMAIL ? `?mailto=${encodeURIComponent(EMAIL)}` : ''
  const r = await getJson(`${CROSSREF}/works/${encodeURIComponent(doi)}${q}`, { allow404: true })
  return r?.message ? r.message : null
}

/* ----- inputs --------------------------------------------------------------- */
const cvAll = readJson(P('src/data/publications.json'), { items: [] }).items
const cvJournals = cvAll.filter((e) => e.type === 'journal')
const links = readJson(P('src/data/publication-links.json'), { items: {} }).items
const cvDoi = (e) => links[e.id]?.doi ? bareDoi(links[e.id].doi) : null
const cvByDoi = new Map()
for (const e of cvAll) { const d = cvDoi(e); if (d) cvByDoi.set(d, [...(cvByDoi.get(d) ?? []), e]) }

const orcidDir = path.join(CACHE, 'openalex-orcid')
const cacheFile = fs.existsSync(orcidDir) ? fs.readdirSync(orcidDir).filter((f) => f.endsWith('.json')).map((f) => path.join(orcidDir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0] : null

let works
let retrievedAt
let retrievedAtNote
try {
  if (REFRESH) {
    works = await downloadWorks()
    retrievedAt = new Date().toISOString()
    retrievedAtNote = 'Downloaded from the OpenAlex API during this run.'
    fs.mkdirSync(orcidDir, { recursive: true })
    fs.writeFileSync(path.join(orcidDir, `${sha(ORCID)}.json`), JSON.stringify(works))
  } else {
    if (!cacheFile) throw new Error('No saved OpenAlex answer in scripts/.cache/openalex-orcid. Run with --refresh first.')
    works = readJson(cacheFile, null)
    if (!Array.isArray(works) || works.length === 0) throw new Error('The saved OpenAlex answer is empty or unreadable.')
    retrievedAt = fs.statSync(cacheFile).mtime.toISOString()
    retrievedAtNote = 'Date the saved OpenAlex answer was downloaded (file date); no new download in this run.'
  }
} catch (e) {
  console.error(`Stopped: ${e.message}\nsrc/data/journals.json was left unchanged.`)
  process.exit(1)
}

/* ----- classify every OpenAlex work ------------------------------------------- */
const review = [] // {journal, openAlexId, doi, title, year, citations, reason}
const verified = [] // counted records
const seenIds = new Set()
const crossrefCache = new Map()
let nonTarget = 0

for (const w of works) {
  const id = openAlexId(w.id)
  if (!id || seenIds.has(id)) continue
  seenIds.add(id)
  const src = w.primary_location?.source
  const a = assignJournal(src, JOURNALS)
  if (!a.journal) { if (a.reason === 'ambiguous-journal') review.push(row(w, null, a.reason)); else nonTarget++; continue }
  const doi = bareDoi(w.doi)
  const title = w.title ?? w.display_name ?? ''
  const reasons = []
  if (a.review) reasons.push(`journal-${a.how}`)
  if (!(w.authorships ?? []).some((x) => String(x.author?.orcid ?? '').endsWith(ORCID))) reasons.push('orcid-not-on-authorship')
  if (!COUNT_TYPES.includes(w.type)) reasons.push(`type-${w.type}`)
  if (!doi) reasons.push('no-doi')

  // match to exactly one CV entry
  let cv = null
  let how = null
  const byDoi = doi ? cvByDoi.get(doi) ?? [] : []
  if (byDoi.length === 1) { cv = byDoi[0]; how = 'doi' }
  else if (byDoi.length > 1) reasons.push('doi-shared-by-several-cv-entries')
  else {
    const hits = cvJournals.filter((e) => Math.abs((e.year ?? 0) - (w.publication_year ?? 0)) <= 1 && similarity(normTitle(e.title), normTitle(title)) >= 0.95 && journalFromVenue(e.venue, JOURNALS)?.key === a.journal.key)
    if (hits.length === 1) { cv = hits[0]; how = 'title' } else reasons.push(hits.length ? 'ambiguous-cv-match' : 'not-in-cv-list')
  }
  if (cv && how === 'doi') {
    const v = journalFromVenue(cv.venue, JOURNALS)
    if (v && v.key !== a.journal.key) reasons.push('cv-venue-names-another-journal')
    if (similarity(normTitle(cv.title), normTitle(title)) < 0.75) reasons.push('cv-title-differs')
  }
  // Crossref confirmation of the DOI
  let crossref = 'unconfirmed'
  if (cv && doi) {
    if (cvDoi(cv) === doi) crossref = 'confirmed-via-cv-crossref-match'
    else if (CHECK_CROSSREF) {
      try {
        const m = crossrefCache.get(doi) ?? (await crossrefOk(doi))
        crossrefCache.set(doi, m)
        const ok = m && similarity(normTitle(m.title?.[0]), normTitle(title)) >= 0.9 && normText(m['container-title']?.[0]).startsWith(normText(a.journal.name).slice(0, 20))
        crossref = ok ? 'confirmed-live' : 'mismatch'
      } catch { crossref = 'check-failed' }
    }
    if (!crossref.startsWith('confirmed')) reasons.push(`crossref-${crossref}`)
  }
  if (reasons.length) { review.push(row(w, a, reasons.join('; '))); continue }
  verified.push({ journal: a.journal.key, openAlexId: id, doi, title, year: w.publication_year ?? null, citations: w.cited_by_count ?? 0, url: `https://doi.org/${doi}`, cvId: cv.id, cvMatch: how, crossref, sourceId: a.sourceId, sourceName: a.sourceName, publisher: a.publisher })
}
function row(w, a, reason) {
  return { journal: a?.journal?.name ?? '', openAlexId: openAlexId(w.id), doi: bareDoi(w.doi) ?? '', title: w.title ?? w.display_name ?? '', year: w.publication_year ?? '', citations: w.cited_by_count ?? 0, source: w.primary_location?.source?.display_name ?? '', reason }
}

// CV journal entries that name a target journal but were not counted
const countedCv = new Set(verified.map((v) => v.cvId))
const cvNotMatched = cvJournals.filter((e) => journalFromVenue(e.venue, JOURNALS) && !countedCv.has(e.id)).map((e) => ({ journal: journalFromVenue(e.venue, JOURNALS).name, openAlexId: '', doi: cvDoi(e) ?? '', title: e.title, year: e.year, citations: '', source: e.venue, reason: 'cv-entry-not-matched-to-a-verified-openalex-work' }))

/* ----- aggregate ------------------------------------------------------------- */
const sources = {}
for (const v of verified) (sources[v.journal] ??= new Map()).set(v.sourceId, { name: v.sourceName, publisher: v.publisher })
const journals = []
for (const j of JOURNALS) {
  const recs = verified.filter((v) => v.journal === j.key)
  const agg = aggregateJournal(recs)
  const srcs = [...(sources[j.key]?.entries() ?? [])]
  const publishers = [...new Set(srcs.map(([, s]) => s.publisher).filter(Boolean))]
  let homepage = null
  if (REFRESH && srcs[0]) { try { homepage = await sourceHomepage(srcs[0][0]) } catch { /* keep null */ } }
  const prev = readJson(OUT, { journals: [] }).journals.find((x) => x.key === j.key)
  journals.push({
    key: j.key,
    name: j.name,
    publisher: publishers.length === 1 ? publishers[0] : null,
    homepage: homepage ?? prev?.homepage ?? null,
    sourceUrl: srcs[0] ? `https://openalex.org/${srcs[0][0]}` : null,
    sourceNames: srcs.map(([, s]) => s.name),
    verifiedPublications: agg.verifiedPublications,
    totalCitations: agg.totalCitations,
    topPapers: agg.topPapers,
    status: agg.verifiedPublications ? 'ok' : 'no-verified-records',
    _duplicates: agg.duplicates,
  })
}
const result = {
  meta: {
    source: 'OpenAlex',
    retrievedAt,
    retrievedAtNote,
    generatedAt: new Date().toISOString(),
    orcid: ORCID,
    openAlexWorks: seenIds.size,
    cvJournalEntries: cvJournals.length,
    verifiedJournalWorks: journals.reduce((s, j) => s + j.verifiedPublications, 0),
    crossref: CHECK_CROSSREF ? 'DOIs confirmed against the CV Crossref match or live Crossref lookups' : 'DOIs confirmed against the Crossref match already stored for each CV entry (publication-links.json)',
    note: 'Citation counts reflect OpenAlex records for matched publications attributed to Prof. Ajith Abraham. Counts may differ from Google Scholar, Scopus, and Web of Science.',
  },
  journals: journals.map(({ _duplicates, ...j }) => j),
}
const duplicates = journals.flatMap((j) => j._duplicates.map((d) => ({ journal: j.name, openAlexId: d.openAlexId, doi: d.doi ?? '', title: d.title, year: d.year ?? '', citations: d.citations, source: '', reason: `duplicate-of-${d.duplicateOf}` })))

/* ----- reports ---------------------------------------------------------------- */
const csv = (rows) => {
  const cols = ['journal', 'openAlexId', 'doi', 'title', 'year', 'citations', 'source', 'reason']
  const q = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n'
}
const summary = [
  '# Journals: verified publications and citations', '',
  `Source: OpenAlex. Retrieved: ${retrievedAt.slice(0, 10)} (${retrievedAtNote})`, '',
  '| Journal | Publisher (OpenAlex) | Verified publications | Total citations | Top 3 papers (citations) |', '|---|---|---:|---:|---|',
  ...result.journals.map((j) => `| ${j.name} | ${j.publisher ?? 'not verified'} | ${j.verifiedPublications} | ${j.totalCitations} | ${j.topPapers.map((p) => `${p.title} (${p.citations})`).join('; ') || 'No verified records available'} |`),
  '', `Verified total: ${result.meta.verifiedJournalWorks}. Needs review: ${review.length}. Duplicates dropped: ${duplicates.length}. CV entries not matched: ${cvNotMatched.length}. Works at non-target journals ignored: ${nonTarget}.`, '',
].join('\n')

console.log(summary)
if (DRY) { console.log('(dry run: nothing written)'); process.exit(0) }

// refuse a much smaller result than before (probably a partial download)
const prevTotal = readJson(OUT, null)?.meta?.verifiedJournalWorks ?? 0
if (!FORCE && prevTotal > 0 && result.meta.verifiedJournalWorks < prevTotal / 2) {
  console.error(`New result (${result.meta.verifiedJournalWorks}) is under half the previous (${prevTotal}). Nothing written; use --force if this is right.`)
  process.exit(1)
}
const atomic = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); const t = `${file}.tmp`; fs.writeFileSync(t, text); fs.renameSync(t, file) }
if (fs.existsSync(OUT)) { fs.mkdirSync(P('scripts/backups'), { recursive: true }); fs.copyFileSync(OUT, P('scripts/backups', `journals-${Date.now()}.json`)) }
atomic(OUT, JSON.stringify(result, null, 2) + '\n')
atomic(path.join(OUT_DIR, 'journal-works.json'), JSON.stringify(verified, null, 2) + '\n')
atomic(path.join(OUT_DIR, 'journals-review.csv'), csv([...review, ...duplicates, ...cvNotMatched]))
atomic(path.join(OUT_DIR, 'journals-summary.md'), summary)
console.log('Wrote src/data/journals.json and scripts/output/{journal-works.json,journals-review.csv,journals-summary.md}')
