#!/usr/bin/env node
/* ==========================================================================
   Adds DOI / publisher links and legal open-access PDF links to the CV
   publication list.

     npm run publications:links you@example.org

   Reads    src/data/publications.json           (the CV list, never modified)
            src/data/publication-links.overrides.json  (your manual corrections)
   Writes   src/data/publication-links.json      (what the page shows)
            scripts/output/publication-links-review.csv  (near misses to check)

   Sources
   - Crossref (api.crossref.org): finds the DOI. A DOI is kept only for a
     confident, unambiguous match; see scripts/lib/links.mjs for the rules.
   - Unpaywall (api.unpaywall.org): lists copies that are free to read legally,
     from publishers and repositories. A PDF link is kept only after the file
     itself was fetched and really is a PDF. Otherwise, if the paper is free
     to read on a web page, that page is linked instead ("Free to read").

   Both services are free. Unpaywall needs an email address with each request,
   and Crossref asks for one to route you to its faster "polite" pool.

   Options (write them as name=value after the command, which works in every
   shell including PowerShell, or as --name value when running with node)
     --email <address>   or just the address, or set UNPAYWALL_EMAIL
     --refresh           ignore cached answers (cache: scripts/.cache)
     --only <id,id>      process just these entries, e.g. --only journal-12,book-3
     --limit <n>         process the first n entries (for a trial run)
     --no-oa             skip Unpaywall
     --no-pdf-check      keep Unpaywall PDF links without downloading them (not recommended)
     --concurrency <n>   parallel requests, default 4
   ========================================================================== */

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from './lib/args.mjs'
import { chooseDoi, crossrefQuery, looksLikePdf, openAccessOptions } from './lib/links.mjs'

const ROOT = process.env.LINKS_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PUBLICATIONS = path.join(ROOT, 'src/data/publications.json')
const OVERRIDES = path.join(ROOT, 'src/data/publication-links.overrides.json')
const OUT = path.join(ROOT, 'src/data/publication-links.json')
const REVIEW = path.join(ROOT, 'scripts/output/publication-links-review.csv')
const CACHE = process.env.LINKS_CACHE_DIR ?? path.join(ROOT, 'scripts/.cache')
// Overridable for the offline test (scripts/lib/enrich.test.mjs).
const CROSSREF_API = process.env.CROSSREF_API ?? 'https://api.crossref.org'
const UNPAYWALL_API = process.env.UNPAYWALL_API ?? 'https://api.unpaywall.org'

/* ----- Options ------------------------------------------------------------ */
const args = parseArgs()
const flag = args.has
const option = args.get
const EMAIL = args.email ?? process.env.UNPAYWALL_EMAIL ?? process.env.CROSSREF_MAILTO
const REFRESH = flag('refresh')
const ONLY = option('only')?.split(',').map((s) => s.trim()).filter(Boolean)
const LIMIT = option('limit') ? Number(option('limit')) : undefined
const SKIP_OA = flag('no-oa')
const CHECK_PDF = !flag('no-pdf-check')
const CONCURRENCY = Math.max(1, Number(option('concurrency') ?? 4))
const UA = `ajith-abraham-portfolio publication links (mailto:${EMAIL ?? 'unknown'})`

if (!EMAIL || !EMAIL.includes('@')) {
  console.error('An email address is required by Unpaywall and requested by Crossref.')
  console.error('Run: npm run publications:links you@example.org')
  console.error('Options the same way, e.g.: npm run publications:links you@example.org limit=30')
  process.exit(1)
}

/* ----- HTTP with cache and retries ----------------------------------------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function cached(kind, key, fetcher) {
  const file = path.join(CACHE, kind, `${createHash('sha1').update(key).digest('hex')}.json`)
  if (!REFRESH && existsSync(file)) return JSON.parse(await readFile(file, 'utf8'))
  const value = await fetcher()
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, JSON.stringify(value))
  return value
}

async function getJson(url, { allow404 = false } = {}) {
  for (let attempt = 0; attempt < 5; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(30000) })
    } catch (err) {
      if (attempt === 4) throw err
      await sleep(1000 * 2 ** attempt)
      continue
    }
    if (res.ok) return res.json()
    if (res.status === 404 && allow404) return null
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 1000 * 2 ** attempt
      await sleep(wait)
      continue
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`)
  }
  throw new Error(`Gave up after retries: ${url}`)
}

/** Fetches the start of the file and checks that it really is a PDF. */
async function isReachablePdf(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, Range: 'bytes=0-2047', Accept: 'application/pdf,*/*' },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    })
    if (!(res.ok || res.status === 206) || !res.body) return false
    const reader = res.body.getReader()
    const { value } = await reader.read()
    await reader.cancel().catch(() => {})
    return looksLikePdf(value)
  } catch {
    return false
  }
}

/* ----- Steps ---------------------------------------------------------------- */
async function findDoi(entry) {
  const query = crossrefQuery(entry)
  const params = new URLSearchParams({
    'query.bibliographic': query,
    'query.author': 'Abraham',
    rows: '8',
    select: 'DOI,title,subtitle,author,editor,issued,published-print,published-online,type,container-title,short-container-title,page,volume',
    mailto: EMAIL,
  })
  const data = await cached('crossref', query, () => getJson(`${CROSSREF_API}/works?${params}`))
  return chooseDoi(entry, data?.message?.items ?? [])
}

async function findOpenAccess(doi) {
  const rec = await cached('unpaywall', doi, () =>
    getJson(`${UNPAYWALL_API}/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(EMAIL)}`, { allow404: true }),
  )
  const options = openAccessOptions(rec)
  if (!options) return null
  const checked = new Date().toISOString().slice(0, 10)
  for (const pdf of options.pdfs.slice(0, 3)) {
    const ok = CHECK_PDF
      ? await cached('pdfcheck', pdf.url, async () => ({ ok: await isReachablePdf(pdf.url), checked }))
      : { ok: true, checked: null }
    if (ok.ok) {
      return { pdf: pdf.url, landing: pdf.landing, version: pdf.version, license: pdf.license, host: pdf.host, checked: ok.checked }
    }
  }
  if (options.landing?.url) {
    return { pdf: null, landing: options.landing.url, version: options.landing.version, license: options.landing.license, host: options.landing.host, checked }
  }
  return null
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
  process.stdout.write('\n')
  return results
}

const csv = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

/* ----- Main ------------------------------------------------------------------ */
const data = JSON.parse(await readFile(PUBLICATIONS, 'utf8'))
const overrides = existsSync(OVERRIDES) ? JSON.parse(await readFile(OVERRIDES, 'utf8')) : {}
delete overrides._comment
const previous = existsSync(OUT) ? JSON.parse(await readFile(OUT, 'utf8')) : { items: {} }

let entries = data.items
if (ONLY) entries = entries.filter((e) => ONLY.includes(e.id))
if (LIMIT) entries = entries.slice(0, LIMIT)
const partial = Boolean(ONLY || LIMIT)
console.log(`Looking up ${entries.length} of ${data.items.length} publications (cache: ${REFRESH ? 'off' : 'on'}).`)

const review = []
const results = await pool(entries, async (entry) => {
  const manual = overrides[entry.id] ?? {}
  try {
    let doi = null
    let match = null
    if (Object.prototype.hasOwnProperty.call(manual, 'doi')) {
      doi = manual.doi ? String(manual.doi).toLowerCase() : null // null = "no DOI for this entry"
      match = doi ? 'manual' : null
    } else {
      const found = await findDoi(entry)
      doi = found.doi
      match = found.doi ? 'crossref' : null
      if (!found.doi && found.review) {
        for (const c of found.review.candidates) {
          review.push([entry.id, entry.title, entry.year, c.doi, c.title, c.year, c.sim.toFixed(3), c.type, found.review.reason])
        }
      }
    }
    let oa = null
    if (doi && !SKIP_OA && manual.oa !== null) oa = await findOpenAccess(doi)
    if (manual.oa === null) oa = null // suppressed by hand
    return [entry.id, doi ? { doi, match, ...(oa ? { oa } : {}) } : null]
  } catch (err) {
    console.warn(`\n  ${entry.id}: ${err.message}`)
    return [entry.id, previous.items?.[entry.id] ?? null] // keep the last good result
  }
})

const items = partial ? { ...(previous.items ?? {}) } : {}
for (const [id, value] of results) {
  if (value) items[id] = value
  else delete items[id]
}
// Only ids that still exist in the CV list.
const known = new Set(data.items.map((e) => e.id))
for (const id of Object.keys(items)) if (!known.has(id)) delete items[id]

const values = Object.values(items)
const out = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    doi: 'Crossref (api.crossref.org), confident title, year and author matches only',
    openAccess: 'Unpaywall (api.unpaywall.org); PDF links were downloaded and checked',
  },
  counts: {
    entries: data.items.length,
    doi: values.length,
    pdf: values.filter((v) => v.oa?.pdf).length,
    freeToRead: values.filter((v) => v.oa && !v.oa.pdf).length,
  },
  items: Object.fromEntries(Object.entries(items).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))),
}
await writeFile(OUT, JSON.stringify(out, null, 1) + '\n')

await mkdir(path.dirname(REVIEW), { recursive: true })
const header = ['id', 'cv_title', 'cv_year', 'candidate_doi', 'candidate_title', 'candidate_year', 'similarity', 'crossref_type', 'why_not_linked']
await writeFile(REVIEW, [header, ...review].map((row) => row.map(csv).join(',')).join('\n') + '\n')

console.log(`DOI found for ${out.counts.doi} of ${out.counts.entries} entries.`)
console.log(`Open-access PDF (checked): ${out.counts.pdf}. Free to read on a web page: ${out.counts.freeToRead}.`)
console.log(`Near misses to review by hand: ${new Set(review.map((r) => r[0])).size} entries -> ${path.relative(ROOT, REVIEW)}`)
console.log(`To confirm or correct one, add it to ${path.relative(ROOT, OVERRIDES)} and run again.`)
