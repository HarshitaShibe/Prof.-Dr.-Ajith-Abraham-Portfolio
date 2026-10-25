// Run with: npm run test:scripts
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { dropSharedMatches, fromOpenAlex, fromScholar, matchCitation, matchScholar, openAlexType, scholarVenue } from './links.mjs'

const ORCID = '0000-0002-0169-6738'
const abraham = { author: { display_name: 'Ajith Abraham', orcid: `https://orcid.org/${ORCID}` } }
const person = (name) => ({ author: { display_name: name, orcid: null } })
const work = (over) => ({
  id: 'https://openalex.org/W1',
  doi: 'https://doi.org/10.1109/TEVC.2008.2009457',
  title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator',
  publication_year: 2009,
  cited_by_count: 1200,
  type: 'article',
  authorships: [person('Swagatam Das'), abraham, person('Amit Konar')],
  primary_location: { source: { display_name: 'IEEE Transactions on Evolutionary Computation', type: 'journal' } },
  biblio: { first_page: '526', last_page: '553' },
  ...over,
})
const entry = {
  id: 'journal-494',
  type: 'journal',
  title: 'Differential Evolution with a Neighborhood Based Mutation Operator',
  venue: 'IEEE Transactions on Evolutionary Computation, 13(3): 526-553',
  year: 2009,
}

test('reads OpenAlex works in the shape of the matching rules', () => {
  const r = fromOpenAlex(work(), ORCID)
  assert.equal(r.key, 'W1')
  assert.equal(r.DOI, '10.1109/tevc.2008.2009457')
  assert.equal(r.type, 'journal-article')
  assert.equal(r.page, '526-553')
  assert.equal(r.cited, 1200)
  assert.deepEqual(r.author[1], { given: 'Ajith', family: 'Abraham' })
  assert.equal(openAlexType({ type: 'article', primary_location: { source: { type: 'conference' } } }), 'proceedings-article')
  assert.equal(openAlexType({ type: 'preprint' }), 'peer-review') // excluded
})

test('matches by DOI first', () => {
  const w = work()
  const r = matchCitation(entry, { doi: '10.1109/tevc.2008.2009457', byDoi: new Map([['10.1109/tevc.2008.2009457', w]]), candidates: [], orcid: ORCID })
  assert.equal(r.method, 'doi')
  assert.equal(r.work.cited, 1200)
})

test('flags a DOI whose OpenAlex record is a different paper', () => {
  const w = work({ title: 'A completely different paper about sensor networks' })
  const r = matchCitation(entry, { doi: '10.1109/tevc.2008.2009457', byDoi: new Map([['10.1109/tevc.2008.2009457', w]]), candidates: [], orcid: ORCID })
  assert.equal(r.work, null)
  assert.match(r.review.reason, /different title/)
})

test('falls back to title, year, author and journal', () => {
  const r = matchCitation(entry, { doi: null, byDoi: new Map(), candidates: [work()], orcid: ORCID })
  assert.equal(r.method, 'title')
  assert.equal(r.work.key, 'W1')
})

test('does not guess between two equally good OpenAlex records', () => {
  const r = matchCitation({ ...entry, title: 'Differential Evolution Using a Neighborhood-Based Mutation Operator' }, {
    doi: null,
    byDoi: new Map(),
    candidates: [work(), work({ id: 'https://openalex.org/W2', doi: null })],
    orcid: ORCID,
  })
  assert.equal(r.work, null)
  assert.match(r.review.reason, /several/)
})

test('rejects a record without Prof. Abraham, or from another year', () => {
  const noAbraham = work({ authorships: [person('Swagatam Das')] })
  assert.equal(matchCitation(entry, { doi: null, byDoi: new Map(), candidates: [noAbraham], orcid: ORCID }).work, null)
  const later = work({ publication_year: 2014 })
  assert.equal(matchCitation(entry, { doi: null, byDoi: new Map(), candidates: [later], orcid: ORCID }).work, null)
})

test('a work matched by two CV entries goes to review for both', () => {
  const dropped = dropSharedMatches([
    ['journal-1', { work: { key: 'W9' } }],
    ['conference-4', { work: { key: 'W9' } }],
    ['journal-2', { work: { key: 'W3' } }],
  ])
  assert.deepEqual([...dropped.keys()].sort(), ['conference-4', 'journal-1'])
  assert.equal(dropped.has('journal-2'), false)
})

/* ----- End to end, against a local stand-in for OpenAlex ------------------ */
test('script: counts for confident matches, everything else flagged', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cites-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  const items = [
    // DOI known from the links step: matched by DOI.
    { id: 'journal-1', type: 'journal', title: 'Differential Evolution with a Neighborhood Based Mutation Operator', authors: [], venue: 'IEEE Transactions on Evolutionary Computation, 13(3): 526-553', year: 2009 },
    // No DOI, but a clean title match among his ORCID works.
    { id: 'journal-2', type: 'journal', title: 'Industry 4.0: A bibliometric analysis and detailed overview', authors: [], venue: 'Engineering Applications of Artificial Intelligence, 78: 218-235', year: 2019 },
    // Found only through the title search.
    { id: 'conference-1', type: 'conference', title: 'Inertia Weight Strategies in Particle Swarm Optimization', authors: [], venue: 'Third World Congress on Nature and Biologically Inspired Computing', year: 2011 },
    // Listed twice in the CV with one title: both flagged.
    { id: 'journal-3', type: 'journal', title: 'Hybrid Intelligent Systems for Stock Market Analysis', authors: [], venue: 'Some Journal', year: 2005 },
    { id: 'journal-4', type: 'journal', title: 'Hybrid Intelligent Systems for Stock Market Analysis', authors: [], venue: 'Some Journal', year: 2005 },
    // Nothing on OpenAlex.
    { id: 'proceedings-1', type: 'proceedings', title: 'Proceedings of a Workshop Nobody Indexed', authors: [], venue: 'X', year: 2003 },
    // Manually excluded.
    { id: 'other-1', type: 'other', title: 'Book Review Of Something', authors: [], venue: 'Y', year: 2004 },
  ]
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items }))
  await writeFile(path.join(dir, 'src/data/publication-links.json'), JSON.stringify({ items: { 'journal-1': { doi: '10.1109/tevc.2008.2009457' } } }))
  await writeFile(path.join(dir, 'src/data/publication-links.overrides.json'), JSON.stringify({ 'other-1': { openalex: null } }))

  const own = [
    work({ id: 'https://openalex.org/W100', doi: null }), // his record, but journal-1 uses the DOI lookup below
    work({ id: 'https://openalex.org/W200', doi: 'https://doi.org/10.1016/j.engappai.2018.11.007', title: 'Industry 4.0: A bibliometric analysis and detailed overview', publication_year: 2019, cited_by_count: 700, primary_location: { source: { display_name: 'Engineering Applications of Artificial Intelligence', type: 'journal' } }, biblio: { first_page: '218', last_page: '235' } }),
    work({ id: 'https://openalex.org/W300', doi: null, title: 'Hybrid Intelligent Systems for Stock Market Analysis', publication_year: 2005, cited_by_count: 50, primary_location: { source: { display_name: 'Some Journal', type: 'journal' } }, biblio: {} }),
  ]
  const requests = []
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    requests.push(url.pathname + url.search)
    const json = (body) => {
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (url.pathname === '/works' && url.searchParams.get('filter') === `author.orcid:${ORCID}`) {
      // Two pages, to exercise the cursor.
      if (url.searchParams.get('cursor') === '*') return json({ meta: { next_cursor: 'p2' }, results: own.slice(0, 2) })
      if (url.searchParams.get('cursor') === 'p2') return json({ meta: { next_cursor: 'p3' }, results: own.slice(2) })
      return json({ meta: { next_cursor: null }, results: [] })
    }
    if (url.pathname === '/works/doi:10.1109%2Ftevc.2008.2009457' || url.pathname === '/works/doi:10.1109/tevc.2008.2009457')
      return json(work({ id: 'https://openalex.org/W1', cited_by_count: 1234 }))
    if (url.pathname.startsWith('/works/doi:')) {
      res.statusCode = 404
      return res.end()
    }
    if (url.pathname === '/works' && (url.searchParams.get('filter') ?? '').startsWith('title.search:inertia weight'))
      return json({ results: [work({ id: 'https://openalex.org/W400', doi: 'https://doi.org/10.1109/nabic.2011.6089659', title: 'Inertia weight strategies in particle swarm optimization', publication_year: 2011, cited_by_count: 900, type: 'article', primary_location: { source: { display_name: 'Third World Congress on Nature and Biologically Inspired Computing', type: 'conference' } }, biblio: { first_page: '633', last_page: '640' } })] })
    if (url.pathname === '/works') return json({ results: [] })
    res.statusCode = 404
    res.end()
  })
  await new Promise((r) => server.listen(0, r))
  try {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fetch-citations.mjs')
    await promisify(execFile)(process.execPath, [script, '--email', 'test@example.org'], {
      env: { ...process.env, LINKS_ROOT: dir, LINKS_CACHE_DIR: path.join(dir, '.cache'), OPENALEX_API: `http://127.0.0.1:${server.address().port}`, OPENALEX_API_KEY: 'test-key' },
    })
    const out = JSON.parse(await readFile(path.join(dir, 'src/data/publication-citations.json'), 'utf8'))
    assert.deepEqual(out.items['journal-1'], { source: 'openalex', work: 'W1', cites: 1234, method: 'doi' })
    assert.deepEqual(out.items['journal-2'], { source: 'openalex', work: 'W200', cites: 700, method: 'title' })
    assert.deepEqual(out.items['conference-1'], { source: 'openalex', work: 'W400', cites: 900, method: 'title' })
    assert.equal(out.items['journal-3'], undefined)
    assert.equal(out.items['journal-4'], undefined)
    assert.equal(out.items['proceedings-1'], undefined)
    assert.equal(out.items['other-1'], undefined)
    assert.equal(out.counts.matched, 3)
    assert.equal(out.counts.review, 3) // journal-3, journal-4, proceedings-1 (other-1 was excluded by hand)

    const review = await readFile(path.join(dir, 'scripts/output/citations-review.csv'), 'utf8')
    assert.match(review, /journal-3.*also matched by journal-4/)
    assert.match(review, /journal-4.*also matched by journal-3/)
    assert.match(review, /proceedings-1/)
    assert.doesNotMatch(review, /other-1/)
    assert.ok(requests.some((r) => r.includes('mailto=test%40example.org')), 'sends the email for the polite pool')
    assert.ok(requests.every((r) => r.includes('api_key=test-key')), 'sends the API key with every request')
  } finally {
    server.close()
  }
})

test('script: stops at once with instructions when there is no API key', async () => {
  const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fetch-citations.mjs')
  const env = { ...process.env }
  delete env.OPENALEX_API_KEY
  await assert.rejects(promisify(execFile)(process.execPath, [script, 'me@example.org'], { env }), (err) => {
    assert.match(String(err.stderr), /openalex\.org\/settings\/api/)
    return true
  })
})

test('script: explains a refused key instead of a bare 401', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'cites401-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items: [{ id: 'journal-1', type: 'journal', title: 'Some Paper Title Here', authors: [], venue: 'X', year: 2010 }] }))
  const server = createServer((req, res) => {
    res.statusCode = 401
    res.end('{"error":"Unauthorized"}')
  })
  await new Promise((r) => server.listen(0, r))
  try {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fetch-citations.mjs')
    await assert.rejects(
      promisify(execFile)(process.execPath, [script, 'me@example.org', 'api_key=wrong'], {
        env: { ...process.env, LINKS_ROOT: dir, LINKS_CACHE_DIR: path.join(dir, '.cache'), OPENALEX_API: `http://127.0.0.1:${server.address().port}` },
      }),
      (err) => {
        assert.match(String(err.stderr), /OpenAlex refused the request \(401\).*openalex\.org\/settings\/api/)
        return true
      },
    )
  } finally {
    server.close()
  }
})

/* ----- Google Scholar ---------------------------------------------------------- */
const article = (over) => ({
  title: 'Differential evolution using a neighborhood-based mutation operator',
  citation_id: 'i95DGLQAAAAJ:qjMakFHDy7sC',
  authors: 'S Das, A Abraham, UK Chakraborty, A Konar',
  publication: 'IEEE Transactions on Evolutionary Computation 13 (3), 526-553, 2009',
  cited_by: { value: 1441 },
  year: '2009',
  ...over,
})

test('reads Google Scholar profile articles', () => {
  assert.equal(scholarVenue('IEEE Transactions on Evolutionary Computation 13 (3), 526-553, 2009'), 'IEEE Transactions on Evolutionary Computation')
  assert.equal(scholarVenue('Engineering Applications of Artificial Intelligence 90, 103479, 2020'), 'Engineering Applications of Artificial Intelligence')
  const r = fromScholar(article())
  assert.equal(r.key, 'i95DGLQAAAAJ:qjMakFHDy7sC')
  assert.equal(r.page, '526-553')
  assert.equal(r.cited, 1441)
  assert.equal(fromScholar(article({ cited_by: {} })).cited, 0)
})

test('matches a reworded CV title to the Scholar article by journal and pages', () => {
  const r = matchScholar(entry, [article(), article({ citation_id: 'x:other', title: 'Swarm intelligence in data mining', publication: 'Springer, 2006', year: '2006' })])
  assert.equal(r.work.key, 'i95DGLQAAAAJ:qjMakFHDy7sC')
  assert.equal(r.method, 'title')
})

test('does not guess between duplicate Scholar articles', () => {
  const exact = { ...entry, title: 'Differential evolution using a neighborhood-based mutation operator' }
  const r = matchScholar(exact, [article(), article({ citation_id: 'i95DGLQAAAAJ:dup' })])
  assert.equal(r.work, null)
  assert.match(r.review.reason, /several/)
})

test('script: Google Scholar first, OpenAlex for the rest, Most cited refreshed', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'scholar-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  const items = [
    // On the Scholar profile (reworded in the CV): Scholar count, even though OpenAlex knows it too.
    { id: 'journal-1', type: 'journal', title: 'Differential Evolution with a Neighborhood Based Mutation Operator', authors: [], venue: 'IEEE Transactions on Evolutionary Computation, 13(3): 526-553', year: 2009 },
    // Not on the profile, found on OpenAlex by DOI.
    { id: 'journal-2', type: 'journal', title: 'Industry 4.0: A bibliometric analysis and detailed overview', authors: [], venue: 'Engineering Applications of Artificial Intelligence, 78: 218-235', year: 2019 },
    // Listed twice in the CV: the one Scholar article goes to review for both.
    { id: 'journal-3', type: 'journal', title: 'Hybrid Intelligent Systems for Stock Market Analysis', authors: [], venue: 'Some Journal', year: 2005 },
    { id: 'journal-4', type: 'journal', title: 'Hybrid Intelligent Systems for Stock Market Analysis', authors: [], venue: 'Some Journal', year: 2005 },
    // On the profile with no citations yet: a real zero from Scholar.
    { id: 'journal-5', type: 'journal', title: 'Edge-Aware PDE Semantic Fields for Zero-Shot Medical Image Classification', authors: [], venue: 'IEEE Signal Processing Letters, IEEE', year: 2026 },
  ]
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items }))
  await writeFile(path.join(dir, 'src/data/publication-links.json'), JSON.stringify({ items: { 'journal-2': { doi: '10.1016/j.engappai.2018.11.007' } } }))
  await writeFile(path.join(dir, 'src/data/scholar-top.json'), JSON.stringify({ profileUrl: 'https://scholar.google.com/citations?user=i95DGLQAAAAJ', items: [] }))

  const profile = [
    article(),
    article({ citation_id: 'i95DGLQAAAAJ:stock', title: 'Hybrid intelligent systems for stock market analysis', publication: 'Some Journal, 2005', year: '2005', cited_by: { value: 50 } }),
    article({ citation_id: 'i95DGLQAAAAJ:edge', title: 'Edge-Aware PDE Semantic Fields for Zero-Shot Medical Image Classification', publication: 'IEEE Signal Processing Letters, 2026', year: '2026', cited_by: {} }),
  ]
  // 100 filler articles so the profile needs two pages.
  for (let i = 0; i < 100; i++) profile.push(article({ citation_id: `i95DGLQAAAAJ:f${i}`, title: `Filler paper number ${i} on fuzzy control`, publication: 'Filler Journal, 2001', year: '2001', cited_by: { value: i } }))
  const serpRequests = []
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://x')
    const json = (body, status = 200) => {
      res.statusCode = status
      res.setHeader('content-type', 'application/json')
      res.end(JSON.stringify(body))
    }
    if (url.pathname === '/search.json') {
      serpRequests.push(url.search)
      assert.equal(url.searchParams.get('engine'), 'google_scholar_author')
      assert.equal(url.searchParams.get('api_key'), 'serp-key')
      const start = Number(url.searchParams.get('start'))
      return json({ articles: profile.slice(start, start + 100) })
    }
    if (url.pathname === '/works' && (url.searchParams.get('filter') ?? '').startsWith('author.orcid'))
      return json({ meta: { next_cursor: null }, results: [work({ id: 'https://openalex.org/W1', cited_by_count: 1100 })] })
    if (url.pathname.startsWith('/works/doi:'))
      return json(work({ id: 'https://openalex.org/W200', doi: 'https://doi.org/10.1016/j.engappai.2018.11.007', title: 'Industry 4.0: A bibliometric analysis and detailed overview', publication_year: 2019, cited_by_count: 700 }))
    if (url.pathname === '/works') return json({ results: [] })
    json({}, 404)
  })
  await new Promise((r) => server.listen(0, r))
  const base = `http://127.0.0.1:${server.address().port}`
  try {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fetch-citations.mjs')
    await promisify(execFile)(process.execPath, [script, 'me@example.org'], {
      env: { ...process.env, LINKS_ROOT: dir, LINKS_CACHE_DIR: path.join(dir, '.cache'), SERPAPI_API: base, OPENALEX_API: base, SERPAPI_KEY: 'serp-key', OPENALEX_API_KEY: 'oa-key' },
    })
    const out = JSON.parse(await readFile(path.join(dir, 'src/data/publication-citations.json'), 'utf8'))
    assert.equal(serpRequests.length, 2, 'two profile pages')
    assert.deepEqual(out.items['journal-1'], { source: 'scholar', scholar: 'i95DGLQAAAAJ:qjMakFHDy7sC', cites: 1441, method: 'title' })
    assert.deepEqual(out.items['journal-2'], { source: 'openalex', work: 'W200', cites: 700, method: 'doi' })
    assert.equal(out.items['journal-3'], undefined)
    assert.equal(out.items['journal-4'], undefined)
    assert.deepEqual(out.items['journal-5'], { source: 'scholar', scholar: 'i95DGLQAAAAJ:edge', cites: 0, method: 'title' })
    assert.equal(out.counts.scholar, 2)
    assert.equal(out.counts.openalex, 1)
    const review = await readFile(path.join(dir, 'scripts/output/citations-review.csv'), 'utf8')
    assert.match(review, /journal-3.*also matched by journal-4/)

    const top = JSON.parse(await readFile(path.join(dir, 'src/data/scholar-top.json'), 'utf8'))
    assert.equal(top.items.length, 20)
    assert.equal(top.items[0].id, 'qjMakFHDy7sC')
    assert.equal(top.items[0].citations, 1441)
    assert.equal(top.items[0].venue, 'IEEE Transactions on Evolutionary Computation')
    assert.equal(top.profileUrl, 'https://scholar.google.com/citations?user=i95DGLQAAAAJ')
  } finally {
    server.close()
  }
})

test('script: reports a used-up SerpAPI allowance in plain words', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'serp429-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items: [] }))
  const server = createServer((req, res) => {
    res.statusCode = 429
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: 'Your account has run out of searches.' }))
  })
  await new Promise((r) => server.listen(0, r))
  try {
    const script = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fetch-citations.mjs')
    const env = { ...process.env, LINKS_ROOT: dir, LINKS_CACHE_DIR: path.join(dir, '.cache'), SERPAPI_API: `http://127.0.0.1:${server.address().port}`, SERPAPI_KEY: 'k' }
    delete env.OPENALEX_API_KEY
    await assert.rejects(promisify(execFile)(process.execPath, [script], { env }), (err) => {
      assert.match(String(err.stderr), /run out of searches/)
      return true
    })
  } finally {
    server.close()
  }
})
