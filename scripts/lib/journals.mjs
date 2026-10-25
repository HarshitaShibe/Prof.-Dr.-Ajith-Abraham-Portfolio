/* Pure helpers for scripts/build-journals.mjs (no network, no files), tested in journals.test.mjs. */
import { normTitle, similarity, bareDoi, openAlexId } from './links.mjs'

/** Journal names compared without case, "&"/"and" or punctuation differences. */
export const normText = (s) => normTitle(String(s ?? '').replace(/&/g, ' and ')).replace(/\bthe\b/g, ' ').replace(/\s+/g, ' ').trim()
export const normIssn = (s) => String(s ?? '').toUpperCase().replace(/[^0-9X]/g, '')

/**
 * Which target journal an OpenAlex source is. Needs the name AND (when the
 * source lists ISSNs) one agreeing ISSN. Name only, with ISSNs that disagree,
 * is returned as `review`; nothing is guessed.
 */
export function assignJournal(source, journals) {
  if (!source?.display_name) return { journal: null, reason: 'no-source' }
  const name = normText(source.display_name)
  const issns = new Set([source.issn_l, ...(source.issn ?? [])].filter(Boolean).map(normIssn))
  const hits = []
  for (const j of journals) {
    const target = normText(j.name)
    const byName = j.family ? name === target || name.startsWith(`${target} `) : name === target
    const byIssn = j.issns.some((i) => issns.has(normIssn(i)))
    if (byName && byIssn) hits.push({ j, how: 'name+issn' })
    else if (byName && issns.size === 0) hits.push({ j, how: 'name-only', review: true })
    else if (byName) hits.push({ j, how: 'name-issn-disagree', review: true })
    else if (byIssn) hits.push({ j, how: 'issn-only', review: true })
  }
  if (hits.length === 0) return { journal: null, reason: 'not-a-target-journal' }
  if (hits.length > 1) return { journal: null, reason: 'ambiguous-journal' }
  const { j, how, review } = hits[0]
  return { journal: j, how, review: !!review, sourceId: openAlexId(source.id), sourceName: source.display_name, publisher: source.host_organization_name ?? null }
}

/** Journal named in a CV venue string ("Information Sciences, Elsevier, 12: 3"), or null. */
export function journalFromVenue(venue, journals) {
  const v = normText(venue)
  const hits = journals.filter((j) => {
    const t = normText(j.name)
    return j.family ? v.startsWith(t) : v === t || v.startsWith(`${t} `)
  })
  return hits.length === 1 ? hits[0] : null
}

/**
 * Same paper, once per journal: equal DOI, or equal normalised title with years at most 1 apart.
 * The most-cited record is kept; the rest are reported as duplicates.
 */
export function dedupe(records) {
  const sorted = [...records].sort((a, b) => b.citations - a.citations || a.openAlexId.localeCompare(b.openAlexId))
  const kept = []
  const duplicates = []
  for (const r of sorted) {
    const twin = kept.find((k) => (r.doi && r.doi === k.doi) || (normTitle(r.title) === normTitle(k.title) && Math.abs((r.year ?? 0) - (k.year ?? 0)) <= 1))
    if (twin) duplicates.push({ ...r, duplicateOf: twin.openAlexId })
    else kept.push(r)
  }
  return { kept, duplicates }
}

/** Totals over ALL verified, de-duplicated papers (not just the top three). */
export function aggregateJournal(records) {
  const { kept, duplicates } = dedupe(records)
  return {
    verifiedPublications: kept.length,
    totalCitations: kept.reduce((s, r) => s + (r.citations || 0), 0),
    topPapers: kept.slice(0, 3).map(({ title, year, citations, doi, url }) => ({ title, year, citations, doi, url })),
    kept,
    duplicates,
  }
}

export { similarity, bareDoi, openAlexId, normTitle }
