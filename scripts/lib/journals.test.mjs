import test from 'node:test'
import assert from 'node:assert/strict'
import { JOURNALS } from './journals.config.mjs'
import { assignJournal, journalFromVenue, dedupe, aggregateJournal, normText } from './journals.mjs'

const src = (name, issns, id = 'https://openalex.org/S1') => ({ id, display_name: name, issn_l: issns[0], issn: issns })

test('name normalisation ignores case, ampersand and punctuation', () => {
  assert.equal(normText('Neural Computing and Applications'), normText('Neural Computing & Applications'))
})
test('exact name + ISSN is accepted', () => {
  const a = assignJournal(src('Information Sciences', ['0020-0255']), JOURNALS)
  assert.equal(a.journal.key, 'ins')
  assert.equal(a.review, false)
})
test('Springer book series "Internet of things" is NOT the Elsevier journal', () => {
  const a = assignJournal(src('Internet of things', ['2199-1073']), JOURNALS)
  assert.equal(a.journal.key, 'iot')
  assert.equal(a.review, true) // name matches, ISSN disagrees: review only
})
test('similar names are not matched', () => {
  assert.equal(assignJournal(src('Internet of Things and Cyber-Physical Systems', ['2667-3452']), JOURNALS).journal, null)
  assert.equal(assignJournal(src('IEEE Transactions on Cybernetics', ['2168-2267']), JOURNALS).journal, null)
  assert.equal(assignJournal(src('Journal of King Saud University - Computer and Information Sciences', ['1319-1578']), JOURNALS).journal, null)
})
test('IEEE SMC parts are one family', () => {
  const a = assignJournal(src('IEEE Transactions on Systems Man and Cybernetics - Part A Systems and Humans', ['1083-4427']), JOURNALS)
  assert.equal(a.journal.key, 'smc')
  assert.equal(a.review, false)
})
test('venue strings name a journal only when unambiguous', () => {
  assert.equal(journalFromVenue('Information Sciences, Elsevier, 12: 3', JOURNALS).key, 'ins')
  assert.equal(journalFromVenue('Swarm and Evolutionary Computation, Elsevier', JOURNALS), null)
})
test('duplicates are removed and totals sum ALL papers, not the top 3', () => {
  const r = (id, doi, title, c) => ({ openAlexId: id, doi, title, year: 2020, citations: c, url: null })
  const recs = [r('W1', '10.1/a', 'A', 100), r('W2', '10.1/a', 'A again', 90), r('W3', '10.1/c', 'C', 50), r('W4', '10.1/d', 'D', 20), r('W5', '10.1/e', 'E', 10)]
  const agg = aggregateJournal(recs)
  assert.equal(agg.verifiedPublications, 4)
  assert.equal(agg.duplicates.length, 1)
  assert.equal(agg.totalCitations, 180)
  assert.deepEqual(agg.topPapers.map((p) => p.citations), [100, 50, 20])
  assert.equal(dedupe([]).kept.length, 0)
})
