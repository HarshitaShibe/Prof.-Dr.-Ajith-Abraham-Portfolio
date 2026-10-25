/* Builds src/data/network.json (co-authors and countries) from the saved OpenAlex
   works of ORCID 0000-0002-0169-6738 (the file scripts/build-journals.mjs also uses).
     npm run network:build        reads scripts/.cache, no network
   Run `npm run journals:build -- --refresh you@example.org` first to refresh that file.
   Counts are distinct OpenAlex author records, so a person OpenAlex has split in two
   is counted twice; the page says "OpenAlex" for that reason. */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
const ORCID = '0000-0002-0169-6738'

const ROOT = process.env.LINKS_ROOT ?? path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const dir = path.join(process.env.LINKS_CACHE_DIR ?? path.join(ROOT, 'scripts/.cache'), 'openalex-orcid')
const OUT = path.join(ROOT, 'src/data/network.json')
const TOP = 24
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => path.join(dir, f)).sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs) : []
let works
try { works = JSON.parse(fs.readFileSync(files[0], 'utf8')) } catch { works = null }
if (!Array.isArray(works) || !works.length) { console.error('No saved OpenAlex works. Run journals:build --refresh first. network.json left unchanged.'); process.exit(1) }

const people = new Map()
for (const w of works) {
  const as = w.authorships ?? []
  const self = as.filter((a) => String(a.author?.orcid ?? '').endsWith(ORCID)).map((a) => a.author.id)
  const seen = new Set()
  for (const a of as) {
    const id = a.author?.id
    if (!id || self.includes(id) || seen.has(id)) continue
    seen.add(id)
    const p = people.get(id) ?? { name: a.author.display_name, papers: 0, inst: new Map() }
    p.papers++
    for (const i of a.institutions ?? []) if (i.display_name) p.inst.set(i.display_name, { n: (p.inst.get(i.display_name)?.n ?? 0) + 1, cc: i.country_code })
    people.set(id, p)
  }
}
const countries = new Map()
for (const p of people.values()) {
  const cc = [...p.inst.values()].sort((a, b) => b.n - a.n)[0]?.cc
  if (cc) countries.set(cc, (countries.get(cc) ?? 0) + 1)
}
const names = new Intl.DisplayNames(['en'], { type: 'region' })
const collaborators = [...people.entries()]
  .sort((a, b) => b[1].papers - a[1].papers || a[1].name.localeCompare(b[1].name))
  .slice(0, TOP)
  .map(([id, p]) => {
    const [inst, v] = [...p.inst.entries()].sort((a, b) => b[1].n - a[1].n)[0] ?? ['', {}]
    return { name: p.name, institution: inst, country: v.cc ?? null, papers: p.papers, openAlex: id }
  })
const result = {
  source: 'OpenAlex',
  retrievedAt: fs.statSync(files[0]).mtime.toISOString(),
  works: works.length,
  coAuthors: people.size,
  countries: countries.size,
  countryList: [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([code, n]) => ({ code, name: names.of(code), coAuthors: n })),
  collaborators,
}
fs.writeFileSync(`${OUT}.tmp`, JSON.stringify(result, null, 2) + '\n')
fs.renameSync(`${OUT}.tmp`, OUT)
console.log(`${result.coAuthors} co-authors, ${result.countries} countries, top ${collaborators.length} written to src/data/network.json`)
