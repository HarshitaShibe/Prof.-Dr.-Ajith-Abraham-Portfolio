/* The eight journals shown on the Journals page, and how OpenAlex sources are
   recognised as one of them. A source counts only when its NAME matches and,
   where ISSNs are known, an ISSN agrees too: a look-alike (for example
   Springer's book series "Internet of things", ISSN 2199-1073) is never
   mistaken for the Elsevier journal. */
export const ORCID = '0000-0002-0169-6738'
export const COUNT_TYPES = ['article', 'review', 'letter']

export const JOURNALS = [
  { key: 'eaai', name: 'Engineering Applications of Artificial Intelligence', issns: ['0952-1976', '1873-6769'] },
  { key: 'tevc', name: 'IEEE Transactions on Evolutionary Computation', issns: ['1089-778X', '1941-0026'] },
  {
    key: 'smc',
    name: 'IEEE Transactions on Systems, Man, and Cybernetics',
    family: true, // Part A / B / C and the "Systems" journal are one family
    issns: ['0018-9472', '1083-4427', '1083-4419', '1094-6977', '2168-2216', '2168-2232'],
  },
  { key: 'ins', name: 'Information Sciences', issns: ['0020-0255', '1872-6291'] },
  { key: 'cose', name: 'Computers & Security', issns: ['0167-4048', '1872-6208'] },
  { key: 'jnca', name: 'Journal of Network and Computer Applications', issns: ['1084-8045', '1095-8592'] },
  { key: 'iot', name: 'Internet of Things', issns: ['2542-6605', '2543-1536'] },
  { key: 'nca', name: 'Neural Computing & Applications', issns: ['0941-0643', '1433-3058'] },
]
