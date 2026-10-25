#!/usr/bin/env node
/* ==========================================================================
   Decides which local PDFs the Publications page may offer for download.
   Runs automatically before `npm run dev` and `npm run build`.

   A PDF is offered only when BOTH are true:
   1. it is listed in src/data/local-papers.json with the permission that
      allows sharing it (for example the publisher's author-sharing policy
      for accepted manuscripts), and
   2. the file exists in public/papers/ and really is a PDF.

   Writes src/data/local-papers.generated.json, which the page reads.

   Any PDF in public/papers/ that is NOT listed stops the build, because
   everything in public/ is published with the site.
   ========================================================================== */

import { existsSync } from 'node:fs'
import { open, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = process.env.PAPERS_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MANIFEST = path.join(ROOT, 'src/data/local-papers.json')
const PUBLICATIONS = path.join(ROOT, 'src/data/publications.json')
const DIR = path.join(ROOT, 'public/papers')
const OUT = path.join(ROOT, 'src/data/local-papers.generated.json')

// Version labels shown on the button.
const VERSIONS = {
  published: 'Published version',
  accepted: 'Accepted manuscript',
  submitted: 'Preprint',
}

async function isPdf(file) {
  const fh = await open(file, 'r')
  try {
    const buf = Buffer.alloc(16)
    await fh.read(buf, 0, 16, 0)
    return buf.toString('latin1').includes('%PDF-')
  } finally {
    await fh.close()
  }
}

const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}
delete manifest._comment
delete manifest._example
const ids = new Set(JSON.parse(await readFile(PUBLICATIONS, 'utf8')).items.map((e) => e.id))
// The folder's own README.txt and .gitkeep are allowed; any other file must be listed.
const ALLOWED = new Set(['README.txt', '.gitkeep'])
const files = existsSync(DIR) ? (await readdir(DIR)).filter((f) => !ALLOWED.has(f)) : []

const errors = []
const warnings = []
const out = {}
const listed = new Set()

for (const [id, info] of Object.entries(manifest)) {
  const where = `local-papers.json "${id}"`
  if (!ids.has(id)) {
    errors.push(`${where}: no publication with this id in publications.json`)
    continue
  }
  const file = String(info.file ?? `${id}.pdf`)
  if (file.includes('/') || file.includes('\\') || !file.toLowerCase().endsWith('.pdf')) {
    errors.push(`${where}: "file" must be a .pdf file name inside public/papers/, got "${file}"`)
    continue
  }
  listed.add(file)
  if (!VERSIONS[info.version]) {
    errors.push(`${where}: "version" must be one of ${Object.keys(VERSIONS).join(', ')}`)
    continue
  }
  if (!String(info.permission ?? '').trim()) {
    errors.push(`${where}: "permission" is required (what allows this file to be shared)`)
    continue
  }
  const full = path.join(DIR, file)
  if (!existsSync(full)) {
    warnings.push(`${where}: public/papers/${file} not found, so no download is shown`)
    continue
  }
  if (!(await isPdf(full))) {
    errors.push(`${where}: public/papers/${file} is not a PDF file`)
    continue
  }
  out[id] = {
    href: `/papers/${encodeURIComponent(file)}`,
    version: VERSIONS[info.version],
    sizeKB: Math.round((await stat(full)).size / 1024),
  }
}

for (const f of files) {
  if (!listed.has(f)) {
    errors.push(`public/papers/${f} is not listed in src/data/local-papers.json. Everything in public/ is published, so list it with its permission or move it out.`)
  }
}

for (const w of warnings) console.warn(`local papers: ${w}`)
if (errors.length) {
  for (const e of errors) console.error(`local papers: ${e}`)
  process.exit(1)
}

const sorted = Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })))
const next = JSON.stringify(sorted, null, 1) + '\n'
const prev = existsSync(OUT) ? await readFile(OUT, 'utf8') : ''
if (prev !== next) await writeFile(OUT, next) // unchanged file: no needless dev-server reload
console.log(`local papers: ${Object.keys(out).length} PDF${Object.keys(out).length === 1 ? '' : 's'} offered for download.`)
