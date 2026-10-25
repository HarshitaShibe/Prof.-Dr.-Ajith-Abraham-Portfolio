#!/usr/bin/env node
/* ==========================================================================
   Citation counts for the CV publication list.

     PowerShell:
       $env:SERPAPI_KEY="…"        (Google Scholar, through serpapi.com)
       $env:OPENALEX_API_KEY="…"   (OpenAlex, the fallback; optional)
       npm run publications:citations you@example.org

   Run it after `npm run publications:links`, whose DOIs OpenAlex uses.

   Sources, in order, for each CV entry
   1. Google Scholar: Prof. Abraham's Scholar profile, read through SerpAPI
      (about 16 requests for the whole profile). A profile article is used
      when it matches the entry by the strict title, year, journal and page
      rules in scripts/lib/links.mjs.
   2. OpenAlex, only for entries not found on the Scholar profile: by DOI
      first, then by title, year and author with the same rules.
   3. Anything unmatched, ambiguous, or matched by two CV entries at once
      gets NO count and is listed in scripts/output/citations-review.csv.

   The same run refreshes src/data/scholar-top.json (the "Most cited" box)
   from the Scholar profile.

   Reads    src/data/publications.json, src/data/publication-links.json,
            src/data/publication-links.overrides.json
   Writes   src/data/publication-citations.json   (what the page shows)
            src/data/scholar-top.json             (when Scholar was read)
            scripts/output/citations-review.csv   (entries for a person to check)

   Keys (environment variables, or name=value after the command)
     SERPAPI_KEY        serpapi.com; the free plan covers a run
     OPENALEX_API_KEY   openalex.org/settings/api; free
   At least one is needed. Never commit them.

   Options (name=value after the command, or --name value with node)
     email=<address>    for OpenAlex's polite pool; the bare address also works
     scholar=<id>       Google Scholar profile id, default i95DGLQAAAAJ
     orcid=<id>         default 0000-0002-0169-6738
     refresh            ignore saved answers (they expire after 7 days anyway)
     only=<id,id>       process just these entries
     limit=<n>          process the first n entries (for a trial run)
     no-search          skip OpenAlex title searches (faster, fewer matches)
     concurrency=<n>    parallel OpenAlex requests, default 4

   Manual fixes in src/data/publication-links.overrides.json, per entry id:
     "scholar": "i95DGLQAAAAJ:qjMakFHDy7sC"   use this Scholar article
     "scholar": null                           do not use Scholar for this entry
     "openalex": "W2104277766" / null          the same for OpenAlex
   ========================================================================== */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './lib/args.mjs'
import {
  bareDoi,
  dropSharedMatches,
  fromScholar,
  matchCitation,
  matchScholar,
  normTitle,
  openAlexId,
  scholarVenue,
} from './lib/links.mjs'

const ROOT = process.env.LINKS_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLICATIONS = path.join(ROOT, 'src/data/publications.json')
const LINKS = path.join(ROOT, 'src/data/publication-links.json')
const OVERRIDES = path.join(ROOT, 'src/data/publication-links.overrides.json')
const OUT = path.join(ROOT, 'src/data/publication-citations.json')
const SCHOLAR_TOP = path.join(ROOT, 'src/data/scholar-top.json')
const REVIEW = path.join(ROOT, 'scripts/output/citations-review.csv')
const CACHE = process.env.LINKS_CACHE_DIR ?? path.join(ROOT, 'scripts/.cache')
const OPENALEX = process.env.OPENALEX_API ?? 'https://api.openalex.org'
const SERPAPI = process.env.SERPAPI_API ?? 'https://serpapi.com'
const MAX_AGE_DAYS = 7 // saved answers with citation counts expire after this

/* ----- Options ------------------------------------------------------------ */
const args = parseArgs()
const flag = args.has
const option = args.get
const EMAIL = args.email ?? process.env.OPENALEX_MAILTO ?? process.env.UNPAYWALL_EMAIL
const SCHOLAR_ID = option('scholar') ?? 'i95DGLQAAAAJ'
const ORCID = (option('orcid') ?? '0000-0002-0169-6738').replace(/^https?:\/\/orcid\.org\//, '')
const REFRESH = flag('refresh')
const ONLY = option('only')?.split(',').map((s) => s.trim()).filter(Boolean)
const LIMIT = option('limit') ? Number(option('limit')) : undefined
const SEARCH = !flag('no-search')
const CONCURRENCY = Math.max(1, Number(option('concurrency') ?? 4))
const SERP_KEY = option('serpapi_key') ?? option('serpapi-key') ?? process.env.SERPAPI_KEY
const OA_KEY = option('api_key') ?? option('api-key') ?? option('openalex_key') ?? process.env.OPENALEX_API_KEY

if (!SERP_KEY && !OA_KEY) {
  console.error('A key for Google Scholar (through SerpAPI) and/or OpenAlex is needed:')
  console.error('  Google Scholar: sign up at https://serpapi.com, copy the key from https://serpapi.com/manage-api-key')
  console.error('  OpenAlex (fallback): sign in at https://openalex.org, copy the key from https://openalex.org/settings/api')
  console.error('Then, in PowerShell:')
  console.error('  $env:SERPAPI_KEY="…"; $env:OPENALEX_API_KEY="…"')
  console.error('  npm run publications:citations you@example.org')
  process.exit(1)
}
if (OA_KEY && (!EMAIL || !EMAIL.includes('@'))) {
  console.error('Please give your email address, which OpenAlex asks for:')
  console.error('  npm run publications:citations you@example.org')
  process.exit(1)
}
if (!SERP_KEY) console.warn('No SERPAPI_KEY: Google Scholar is skipped, OpenAlex only.')
if (!OA_KEY) console.warn('No OPENALEX_API_KEY: no OpenAlex fallback for papers missing from the Scholar profile.')

// Only the OpenAlex fields used, to keep responses small.
const FIELDS = 'id,doi,title,display_name,publication_year,cited_by_count,type,authorships,primary_location,biblio'
const openAlexParams = (params) => {
  params.set('mailto', EMAIL)
  params.set('api_key', OA_KEY)
  return params
}

/* ----- HTTP with cache and retries ----------------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const hide = (url) => url.replace(/api_key=[^&]+/g, 'api_key=…')

async function cached(kind, key, fetcher) {
  const file = path.join(CACHE, kind, `${createHash('sha1').update(key).digest('hex')}.json`)
  if (!REFRESH && existsSync(file)) {
    const age = (Date.now() - (await stat(file)).mtimeMs) / 86400000
    if (age < MAX_AGE_DAYS) return JSON.parse(await readFile(file, 'utf8'))
  }
  const value = await fetcher()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value))
  return value
}

async function getJson(url, { allow404 = false, service }) {
  for (let attempt = 0; attempt < 6; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { 'User-Agent': `ajith-abraham-portfolio citations (mailto:${EMAIL ?? 'unknown'})` }, signal: AbortSignal.timeout(60000) })
    } catch (err) {
      if (attempt === 5) throw err
      await sleep(1000 * 2 ** attempt)
      continue
    }
    const body = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => null) : null
    if (res.ok && !body?.error) return body
    if (res.status === 404 && allow404) return null
    if (res.status === 401 || res.status === 403) {
      const where = service === 'serpapi' ? 'https://serpapi.com/manage-api-key' : 'https://openalex.org/settings/api'
      throw new Error(`${service === 'serpapi' ? 'SerpAPI' : 'OpenAlex'} refused the request (${res.status}${body?.error ? `: ${body.error}` : ''}). Check the key at ${where}.`)
    }
    if (res.status === 429 || res.status >= 500) {
      if (service === 'serpapi' && body?.error) throw new Error(`SerpAPI: ${body.error}`) // e.g. monthly searches used up
      await sleep(Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** attempt)
      continue
    }
    throw new Error(`${body?.error ?? `${res.status} ${res.statusText}`} for ${hide(url)}`)
  }
  throw new Error(`Gave up after retries: ${hide(url)}`)
}

/* ----- Google Scholar profile, through SerpAPI ------------------------------- */
async function scholarProfile() {
  return cached('scholar-profile', SCHOLAR_ID, async () => {
    const articles = []
    for (let start = 0; start < 5000; start += 100) {
      const params = new URLSearchParams({ engine: 'google_scholar_author', author_id: SCHOLAR_ID, hl: 'en', num: '100', start: String(start), api_key: SERP_KEY })
      const page = await getJson(`${SERPAPI}/search.json?${params}`, { service: 'serpapi' })
      const got = page?.articles ?? []
      articles.push(...got)
      process.stdout.write(`\r  ${articles.length} articles`)
      if (got.length < 100) break
    }
    process.stdout.write('\n')
    return articles
  })
}

/* ----- OpenAlex ---------------------------------------------------------------- */
async function worksByOrcid() {
  return cached('openalex-orcid', ORCID, async () => {
    const works = []
    let cursor = '*'
    while (cursor) {
      const params = openAlexParams(new URLSearchParams({ filter: `author.orcid:${ORCID}`, 'per-page': '200', cursor, select: FIELDS }))
      const page = await getJson(`${OPENALEX}/works?${params}`, { service: 'openalex' })
      works.push(...(page?.results ?? []))
      cursor = page?.meta?.next_cursor ?? null
      if (!page?.results?.length) break
    }
    return works
  })
}
const workByDoi = (doi) =>
  cached('openalex-doi', doi, () =>
    getJson(`${OPENALEX}/works/doi:${encodeURIComponent(doi)}?${openAlexParams(new URLSearchParams({ select: FIELDS }))}`, { allow404: true, service: 'openalex' }),
  )
const workById = (id) =>
  cached('openalex-id', id, () =>
    getJson(`${OPENALEX}/works/${encodeURIComponent(id)}?${openAlexParams(new URLSearchParams({ select: FIELDS }))}`, { allow404: true, service: 'openalex' }),
  )
async function searchTitle(entry) {
  const words = normTitle(entry.title) // commas and colons would split the filter
  if (!words) return []
  let filter = `title.search:${words}`
  if (entry.year) filter += `,publication_year:${entry.year - 1}-${entry.year + 1}`
  const page = await cached('openalex-search', filter, () =>
    getJson(`${OPENALEX}/works?${openAlexParams(new URLSearchParams({ filter, 'per-page': '10', select: FIELDS }))}`, { service: 'openalex' }),
  )
  return page?.results ?? []
}

/* ----- Helpers ------------------------------------------------------------------ */
const words = (s) => new Set(normTitle(s).split(' ').filter((w) => w.length > 2))
function overlap(a, b) {
  if (!a.size || !b.size) return 0
  let common = 0
  for (const w of a) if (b.has(w)) common++
  return common / Math.min(a.size, b.size)
}
async function pool(items, worker) {
  const results = new Array(items.length)
  let next = 0
  let done = 0
  const run = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await worker(items[i], i)
      done++
      if (done % 25 === 0 || done === items.length) process.stdout.write(`\r  ${done} / ${items.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, run))
  if (items.length) process.stdout.write('\n')
  return results
}
const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k)

/* ----- Main --------------------------------------------------------------------- */
const data = JSON.parse(await readFile(PUBLICATIONS, 'utf8'))
const links = existsSync(LINKS) ? JSON.parse(await readFile(LINKS, 'utf8')) : { items: {} }
const overrides = existsSync(OVERRIDES) ? JSON.parse(await readFile(OVERRIDES, 'utf8')) : {}
delete overrides._comment
const previous = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : { items: {} }

let entries = data.items
if (ONLY) entries = entries.filter((e) => ONLY.includes(e.id))
if (LIMIT) entries = entries.slice(0, LIMIT)
const partial = Boolean(ONLY || LIMIT)
const titleOf = new Map(data.items.map((e) => [e.id, e]))
const review = []
const reviewed = new Set()
const failed = new Set()

/* 1. Google Scholar ------------------------------------------------------------ */
const scholarResult = new Map() // id -> { work, method } | { review }
let profile = []
if (SERP_KEY) {
  console.log(`Reading Google Scholar profile ${SCHOLAR_ID} through SerpAPI…`)
  profile = await scholarProfile()
  console.log(`  ${profile.length} articles on the profile.`)
  const byId = new Map(profile.map((a) => [a.citation_id, a]))
  const profileWords = profile.map((a) => words(a.title ?? ''))
  const raw = entries.map((entry) => {
    const manual = overrides[entry.id] ?? {}
    if (has(manual, 'scholar')) {
      if (!manual.scholar) return [entry.id, { work: null, skip: true }]
      const a = byId.get(manual.scholar)
      return [entry.id, a ? { work: fromScholar(a), method: 'manual' } : { work: null, review: { reason: `override ${manual.scholar} is not on the profile`, candidates: [] } }]
    }
    const mine = words(entry.title)
    const candidates = profile.filter((_, i) => overlap(mine, profileWords[i]) >= 0.6)
    return [entry.id, matchScholar(entry, candidates)]
  })
  const shared = dropSharedMatches(raw)
  for (const [id, m] of raw) {
    if (shared.has(id)) {
      const s = shared.get(id)
      scholarResult.set(id, { work: null, shared: true, review: { reason: `same Google Scholar article also matched by ${s.others.join(', ')}`, candidates: [{ key: s.key }] } })
    } else scholarResult.set(id, m)
  }
}

/* 2. OpenAlex, for entries Scholar did not settle ---------------------------------- */
const needsOpenAlex = entries.filter((e) => {
  const s = scholarResult.get(e.id)
  return !(s?.work) && !s?.shared
})
const openAlexResult = new Map()
if (OA_KEY && needsOpenAlex.length) {
  console.log(`Fetching works with ORCID ${ORCID} from OpenAlex…`)
  const own = await worksByOrcid()
  const byDoi = new Map()
  for (const w of own) if (w.doi) byDoi.set(bareDoi(w.doi), w)
  const ownWords = own.map((w) => words(w.title ?? w.display_name ?? ''))
  console.log(`  ${own.length} works. Looking up ${needsOpenAlex.length} entries not found on Google Scholar…`)

  const raw = await pool(needsOpenAlex, async (entry) => {
    const manual = overrides[entry.id] ?? {}
    try {
      if (has(manual, 'openalex')) {
        if (!manual.openalex) return [entry.id, { work: null, skip: true }]
        const w = await workById(openAlexId(manual.openalex))
        if (!w) return [entry.id, { work: null, review: { reason: `override ${manual.openalex} not found on OpenAlex`, candidates: [] } }]
        return [entry.id, { work: { key: openAlexId(w.id), cited: w.cited_by_count ?? null }, method: 'manual' }]
      }
      const doi = has(manual, 'doi') ? manual.doi : links.items?.[entry.id]?.doi
      let doiWork = doi ? byDoi.get(bareDoi(doi)) : undefined
      if (doi && !doiWork) doiWork = (await workByDoi(bareDoi(doi))) ?? undefined
      const lookup = new Map(doiWork ? [[bareDoi(doi), doiWork]] : [])
      const mine = words(entry.title)
      let candidates = own.filter((_, i) => overlap(mine, ownWords[i]) >= 0.6)
      let result = matchCitation(entry, { doi, byDoi: lookup, candidates, orcid: ORCID })
      if (!result.work && SEARCH && !doiWork) {
        candidates = [...candidates, ...(await searchTitle(entry))]
        result = matchCitation(entry, { doi: null, byDoi: lookup, candidates, orcid: ORCID })
      }
      return [entry.id, result]
    } catch (err) {
      console.warn(`\n  ${entry.id}: ${err.message}`)
      return [entry.id, { work: null, error: err.message }]
    }
  })
  const shared = dropSharedMatches(raw)
  for (const [id, m] of raw) {
    if (shared.has(id)) {
      const s = shared.get(id)
      openAlexResult.set(id, { work: null, review: { reason: `same OpenAlex record also matched by ${s.others.join(', ')}`, candidates: [{ key: s.key }] } })
    } else openAlexResult.set(id, m)
  }
}

/* 3. Combine ----------------------------------------------------------------------- */
const items = partial ? { ...(previous.items ?? {}) } : {}
for (const entry of entries) {
  const id = entry.id
  const s = scholarResult.get(id)
  const o = openAlexResult.get(id)
  if (s?.work) {
    items[id] = { source: 'scholar', scholar: s.work.key, cites: s.work.cited, method: s.method }
    continue
  }
  if (o?.error) {
    failed.add(id)
    if (previous.items?.[id]) items[id] = previous.items[id] // keep the last good count
    continue
  }
  if (o?.work && Number.isInteger(o.work.cited)) {
    items[id] = { source: 'openalex', work: o.work.key, cites: o.work.cited, method: o.method }
    continue
  }
  delete items[id]
  const skipped = (s?.skip || !SERP_KEY) && (o?.skip || !OA_KEY)
  if (skipped && (s?.skip || o?.skip)) continue // excluded by hand
  reviewed.add(id)
  for (const [source, r] of [['scholar', s], ['openalex', o]]) {
    if (!r || r.skip) continue
    const cands = r.review?.candidates ?? []
    const reason = r.review?.reason ?? (source === 'scholar' ? 'not on the Google Scholar profile' : 'no OpenAlex record found')
    if (!cands.length) review.push([id, entry.title, entry.year, source, '', '', '', '', '', reason])
    for (const c of cands.slice(0, 3)) {
      review.push([id, entry.title, entry.year, source, c.key ?? '', c.doi ?? '', c.title ?? '', c.year ?? '', c.sim?.toFixed(3) ?? '', reason])
    }
  }
}
const known = new Set(data.items.map((e) => e.id))
for (const id of Object.keys(items)) if (!known.has(id)) delete items[id]

const values = Object.values(items)
const today = new Date().toISOString().slice(0, 10)
const out = {
  generated: today,
  sources: {
    scholar: SERP_KEY ? `Google Scholar profile ${SCHOLAR_ID} (read through SerpAPI)` : null,
    openalex: OA_KEY ? 'OpenAlex (openalex.org), for papers not found on the Scholar profile' : null,
  },
  scholarId: SCHOLAR_ID,
  orcid: ORCID,
  counts: {
    entries: data.items.length,
    matched: values.length,
    scholar: values.filter((v) => v.source === 'scholar').length,
    openalex: values.filter((v) => v.source === 'openalex').length,
    review: partial ? null : reviewed.size,
  },
  items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))),
}
await writeFile(OUT, JSON.stringify(out, null, 1) + '\n')

// The "Most cited" box: the 20 most-cited articles on the profile.
if (SERP_KEY && profile.length) {
  const top = [...profile]
    .filter((a) => a.citation_id && a.title)
    .sort((a, b) => (b.cited_by?.value ?? 0) - (a.cited_by?.value ?? 0))
    .slice(0, 20)
    .map((a) => ({
      id: String(a.citation_id).split(':').pop(),
      title: a.title,
      authors: a.authors ?? '',
      venue: scholarVenue(a.publication) || String(a.publication ?? '').replace(/,\s*(19|20)\d\d\s*$/, ''),
      year: Number.parseInt(a.year, 10) || null,
      citations: a.cited_by?.value ?? 0,
    }))
  const prev = existsSync(SCHOLAR_TOP) ? JSON.parse(await readFile(SCHOLAR_TOP, 'utf8')) : {}
  const next = {
    source: 'Google Scholar',
    profileUrl: prev.profileUrl ?? `https://scholar.google.com/citations?user=${SCHOLAR_ID}`,
    scholarId: SCHOLAR_ID,
    retrieved: today,
    items: top,
  }
  await writeFile(SCHOLAR_TOP, JSON.stringify(next, null, 2) + '\n')
}

await mkdir(path.dirname(REVIEW), { recursive: true })
const header = ['id', 'cv_title', 'cv_year', 'source', 'candidate_id', 'candidate_doi', 'candidate_title', 'candidate_year', 'similarity', 'why_no_count']
await writeFile(REVIEW, [header, ...review].map((row) => row.map(csv).join(',')).join('\n') + '\n')

console.log(`Citation counts for ${out.counts.matched} of ${out.counts.entries} entries: Google Scholar ${out.counts.scholar}, OpenAlex ${out.counts.openalex}.`)
if (failed.size) console.log(`Not looked up because of errors (kept last count, if any): ${failed.size}. Run again later.`)
console.log(`Flagged for review: ${reviewed.size} entries -> ${path.relative(ROOT, REVIEW)}`)
if (SERP_KEY) console.log(`"Most cited" box refreshed from Google Scholar -> ${path.relative(ROOT, SCHOLAR_TOP)}`)
