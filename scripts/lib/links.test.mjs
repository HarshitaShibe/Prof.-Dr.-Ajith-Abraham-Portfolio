// Run with: npm run test:scripts
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { assess, chooseDoi, hasAbraham, looksLikePdf, normTitle, openAccessOptions, similarity } from './links.mjs'

const person = (given, family) => ({ given, family })
const rec = (over) => ({
  DOI: '10.1109/TEVC.2008.2009457',
  title: ['Differential Evolution Using a Neighborhood-Based Mutation Operator'],
  type: 'journal-article',
  issued: { 'date-parts': [[2009, 6]] },
  author: [person('Swagatam', 'Das'), person('Ajith', 'Abraham'), person('Uday K.', 'Chakraborty'), person('Amit', 'Konar')],
  ...over,
})
const entry = {
  id: 'journal-494',
  type: 'journal',
  title: 'Differential Evolution with a Neighborhood Based Mutation Operator',
  year: 2009,
}

test('normalises titles', () => {
  assert.equal(normTitle('Köppen’s <i>PSO</i>: A Review!'), 'koppen s pso a review')
  assert.equal(similarity('abc', 'abc'), 1)
  assert.ok(similarity('differential evolution', 'differential evolutions') > 0.95)
})

test('accepts an identical title with matching year and author', () => {
  const e = { ...entry, title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }
  const r = chooseDoi(e, [rec()])
  assert.equal(r.doi, '10.1109/tevc.2008.2009457')
})

test('accepts slightly different CV wording only when the journal matches', () => {
  // journal-494 in the CV: "with a Neighborhood Based" vs the publisher's "Using a Neighborhood-Based".
  const cv = { ...entry, venue: 'IEEE Transactions on Evolutionary Computation, 13(3): 526-553' }
  const publisher = rec({ 'container-title': ['IEEE Transactions on Evolutionary Computation'], page: '526-553' })
  assert.equal(chooseDoi(cv, [publisher]).doi, '10.1109/tevc.2008.2009457')

  const elsewhere = rec({ 'container-title': ['Applied Soft Computing'], page: '1-20' })
  const r = chooseDoi(cv, [elsewhere])
  assert.equal(r.doi, null)
  assert.match(r.review.reason, /journal or book name differs/)
})

test('needs matching pages for larger wording differences', () => {
  const cv = { id: 'j', type: 'journal', title: 'Adaptive Clustering Using Improved Differential Evolution Algorithm', venue: 'IEEE Transactions on Systems, Man, and Cybernetics - Part A, 38(1): 218-237', year: 2008 }
  const other = rec({ DOI: '10.1109/TSMCA.2007.909595', title: ['Automatic Clustering Using an Improved Differential Evolution Algorithm'], 'container-title': ['IEEE Transactions on Systems, Man, and Cybernetics - Part A: Systems and Humans'], page: '218-237', issued: { 'date-parts': [[2008]] } })
  assert.equal(chooseDoi(cv, [other]).doi, '10.1109/tsmca.2007.909595')
  const noPages = rec({ ...other, page: undefined })
  assert.equal(chooseDoi(cv, [noPages]).doi, null)
})

test('rejects records without Prof. Abraham', () => {
  const e = { ...entry, title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }
  const r = assess(e, rec({ author: [person('Swagatam', 'Das')] }))
  assert.equal(r.ok, false)
  assert.match(r.reason, /Abraham/)
})

test('rejects years more than one apart, accepts one apart', () => {
  const e = { ...entry, title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }
  assert.equal(assess(e, rec({ issued: { 'date-parts': [[2012]] } })).ok, false)
  assert.equal(assess(e, rec({ issued: { 'date-parts': [[2008]] } })).ok, true)
})

test('rejects the wrong kind of record', () => {
  const e = { ...entry, title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }
  assert.equal(assess(e, rec({ type: 'peer-review' })).ok, false)
  assert.equal(assess(e, rec({ type: 'posted-content' })).ok, false)
})

test('is strict with short, generic titles', () => {
  const e = { id: 'chapter-82', type: 'chapter', title: 'Artificial Neural Networks', year: 2005 }
  const wrongYear = rec({ title: ['Artificial neural networks'], type: 'book-chapter', issued: { 'date-parts': [[2006]] } })
  assert.equal(assess(e, wrongYear).ok, false)
  const exact = rec({ title: ['Artificial Neural Networks'], type: 'book-chapter', issued: { 'date-parts': [[2005]] } })
  assert.equal(assess(e, exact).ok, true)
  const wrongType = rec({ title: ['Artificial Neural Networks'], type: 'journal-article', issued: { 'date-parts': [[2005]] } })
  assert.equal(assess(e, wrongType).ok, false)
})

test('finds editors of edited volumes', () => {
  assert.equal(hasAbraham({ editor: [person('A.', 'Abraham')] }), true)
  assert.equal(hasAbraham({ author: [person('Ajith', 'Abraham')] }), true)
  assert.equal(hasAbraham({ author: [person('Tom', 'Abraham')] }), false)
  const e = { id: 'edited-book-46', type: 'edited-book', title: 'Metaheuristics for Scheduling in Distributed Computing Environments', year: 2008 }
  const r = rec({ DOI: '10.1007/978-3-540-69277-5', title: ['Metaheuristics for Scheduling in Distributed Computing Environments'], type: 'book', author: undefined, editor: [person('Fatos', 'Xhafa'), person('Ajith', 'Abraham')], issued: { 'date-parts': [[2008]] } })
  assert.equal(chooseDoi(e, [r]).doi, '10.1007/978-3-540-69277-5')
})

test('uses the subtitle when the CV gives title and subtitle together', () => {
  const e = { id: 'book-9', type: 'book', title: 'Tree-Structure based Hybrid Computational Intelligence: Theoretical Foundations and Applications', year: 2009 }
  const r = rec({ DOI: '10.1007/978-3-642-04739-8', type: 'book', title: ['Tree-Structure based Hybrid Computational Intelligence'], subtitle: ['Theoretical Foundations and Applications'], author: [person('Yuehui', 'Chen'), person('Ajith', 'Abraham')], issued: { 'date-parts': [[2010]] } })
  assert.equal(chooseDoi(e, [r]).doi, '10.1007/978-3-642-04739-8')
})

test('refuses to choose between two equally good records', () => {
  const e = { ...entry, type: 'other', title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }
  const a = rec()
  const b = rec({ DOI: '10.9999/other-copy' })
  const r = chooseDoi(e, [a, b])
  assert.equal(r.doi, null)
  assert.match(r.review.reason, /several/)
})

test('prefers the record of the right kind when two match', () => {
  const e = { id: 'conference-1', type: 'conference', title: 'Inertia Weight Strategies in Particle Swarm Optimization', year: 2011 }
  const conf = rec({ DOI: '10.1109/NaBIC.2011.6089659', title: ['Inertia weight strategies in particle swarm optimization'], type: 'proceedings-article', issued: { 'date-parts': [[2011]] } })
  const other = rec({ DOI: '10.5555/journal-copy', title: ['Inertia weight strategies in particle swarm optimization'], type: 'journal-article', issued: { 'date-parts': [[2011]] } })
  assert.equal(chooseDoi(e, [other, conf]).doi, '10.1109/nabic.2011.6089659')
})

test('reads Unpaywall records, publisher version first', () => {
  const oa = openAccessOptions({
    is_oa: true,
    oa_status: 'green',
    best_oa_location: { url: 'http://hdl.handle.net/10396/35376', url_for_pdf: null, version: 'submittedVersion', license: 'cc-by-nc-nd', host_type: 'repository' },
    oa_locations: [
      { url: 'https://repo.example/1', url_for_pdf: 'https://repo.example/1.pdf', version: 'submittedVersion', host_type: 'repository' },
      { url: 'https://pub.example/1', url_for_pdf: 'https://pub.example/1.pdf', version: 'publishedVersion', license: 'cc-by', host_type: 'publisher' },
    ],
  })
  assert.equal(oa.pdfs[0].url, 'https://pub.example/1.pdf')
  assert.equal(oa.landing.url, 'http://hdl.handle.net/10396/35376')
  assert.equal(openAccessOptions({ is_oa: false }), null)
})

test('recognises a PDF by its first bytes', () => {
  assert.equal(looksLikePdf(Buffer.from('%PDF-1.7\n...')), true)
  assert.equal(looksLikePdf(Buffer.from('<!doctype html><html>')), false)
})

/* ----- End to end, against a local stand-in for Crossref and Unpaywall ----- */
test('script: links confident matches, checks PDFs, keeps every entry', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'links-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  const items = [
    { id: 'journal-1', type: 'journal', title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator', authors: [], venue: 'IEEE Transactions on Evolutionary Computation, 13(3)', year: 2009 },
    { id: 'journal-2', type: 'journal', title: 'Differential Evolution: A review of more than two decades of research', authors: [], venue: 'Engineering Applications of Artificial Intelligence, 90', year: 2020 },
    { id: 'journal-3', type: 'journal', title: 'A paper Crossref does not know', authors: [], venue: 'Some Journal', year: 2015 },
    { id: 'journal-4', type: 'journal', title: 'Hand Corrected Entry', authors: [], venue: 'X', year: 2010 },
  ]
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items }))
  await writeFile(path.join(dir, 'src/data/publication-links.overrides.json'), JSON.stringify({ 'journal-4': { doi: '10.1000/MANUAL' } }))

  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    const json = (body) => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (url.pathname === '/works') {
      const q = url.searchParams.get('query.bibliographic') ?? ''
      if (q.startsWith('Differential Evolution Using')) return json({ message: { items: [rec()] } })
      if (q.startsWith('Differential Evolution: A review'))
        return json({ message: { items: [rec({ DOI: '10.1016/j.engappai.2020.103479', title: ['Differential Evolution: A review of more than two decades of research'], issued: { 'date-parts': [[2020]] }, author: [person('Millie', 'Pant'), person('Ajith', 'Abraham')] })] } })
      return json({ message: { items: [] } })
    }
    if (url.pathname.startsWith('/v2/')) {
      const doi = decodeURIComponent(url.pathname.slice(4))
      if (doi === '10.1109/tevc.2008.2009457')
        return json({ is_oa: true, best_oa_location: { url: `http://${req.headers.host}/landing`, url_for_pdf: `http://${req.headers.host}/fake.pdf`, version: 'acceptedVersion', host_type: 'repository' }, oa_locations: [] })
      if (doi === '10.1016/j.engappai.2020.103479')
        return json({ is_oa: true, best_oa_location: { url: `http://${req.headers.host}/handle`, url_for_pdf: `http://${req.headers.host}/real.pdf`, version: 'submittedVersion', license: 'cc-by-nc-nd', host_type: 'repository' }, oa_locations: [] })
      res.statusCode = 404
      return res.end()
    }
    if (url.pathname === '/real.pdf') return res.end('%PDF-1.5\n%...')
    if (url.pathname === '/fake.pdf') return res.end('<html>Login required</html>') // not really a PDF
    res.statusCode = 404
    res.end()
  })
  await new Promise((r) => server.listen(0, r))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'enrich-publications.mjs')
    await promisify(execFile)(process.execPath, [script, '--email', 'test@example.org'], {
      env: { ...process.env, LINKS_ROOT: dir, LINKS_CACHE_DIR: path.join(dir, '.cache'), CROSSREF_API: base, UNPAYWALL_API: base },
    })
    const out = JSON.parse(await readFile(path.join(dir, 'src/data/publication-links.json'), 'utf8'))
    assert.equal(out.counts.entries, 4)
    // Confident match, but its "PDF" is an HTML page: only the free-to-read page is kept.
    assert.equal(out.items['journal-1'].doi, '10.1109/tevc.2008.2009457')
    assert.equal(out.items['journal-1'].oa.pdf, null)
    assert.equal(out.items['journal-1'].oa.landing, `${base}/landing`)
    // Real PDF: kept, with version and licence.
    assert.equal(out.items['journal-2'].oa.pdf, `${base}/real.pdf`)
    assert.equal(out.items['journal-2'].oa.version, 'submittedVersion')
    assert.equal(out.items['journal-2'].oa.license, 'cc-by-nc-nd')
    // No match: no link at all.
    assert.equal(out.items['journal-3'], undefined)
    // Manual override wins.
    assert.equal(out.items['journal-4'].doi, '10.1000/manual')
    assert.equal(out.items['journal-4'].match, 'manual')
    // The CV list itself is never touched.
    assert.deepEqual(JSON.parse(await readFile(path.join(dir, 'src/data/publications.json'), 'utf8')).items, items)
  } finally {
    server.close()
  }
})
