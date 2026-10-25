// Run with: npm run test:scripts
import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'check-local-papers.mjs')
const PDF = '%PDF-1.7\n1 0 obj\n'

async function project(manifest, files) {
  const dir = await mkdtemp(path.join(tmpdir(), 'papers-'))
  await mkdir(path.join(dir, 'src/data'), { recursive: true })
  await mkdir(path.join(dir, 'public/papers'), { recursive: true })
  await writeFile(path.join(dir, 'src/data/publications.json'), JSON.stringify({ items: [{ id: 'journal-1' }, { id: 'journal-2' }, { id: 'book-1' }] }))
  await writeFile(path.join(dir, 'src/data/local-papers.json'), JSON.stringify(manifest))
  for (const [name, body] of Object.entries(files)) await writeFile(path.join(dir, 'public/papers', name), body)
  return dir
}
async function run(dir) {
  try {
    const { stdout, stderr } = await promisify(execFile)(process.execPath, [SCRIPT], { env: { ...process.env, PAPERS_ROOT: dir } })
    return { code: 0, out: stdout + stderr, generated: JSON.parse(await readFile(path.join(dir, 'src/data/local-papers.generated.json'), 'utf8')) }
  } catch (err) {
    return { code: err.code, out: String(err.stdout) + String(err.stderr) }
  }
}
const ok = { version: 'accepted', permission: 'Publisher policy allows the accepted manuscript on a personal website.' }

test('offers a listed, authorised PDF that exists', async () => {
  const dir = await project({ 'journal-1': { file: 'journal-1.pdf', ...ok } }, { 'journal-1.pdf': PDF, 'README.txt': 'note' })
  const r = await run(dir)
  assert.equal(r.code, 0)
  assert.deepEqual(Object.keys(r.generated), ['journal-1'])
  assert.equal(r.generated['journal-1'].href, '/papers/journal-1.pdf')
  assert.equal(r.generated['journal-1'].version, 'Accepted manuscript')
})

test('shows nothing for a listed file that does not exist', async () => {
  const dir = await project({ 'journal-1': { file: 'journal-1.pdf', ...ok } }, {})
  const r = await run(dir)
  assert.equal(r.code, 0)
  assert.deepEqual(r.generated, {})
  assert.match(r.out, /not found/)
})

test('stops the build for an unlisted PDF in public/papers', async () => {
  const dir = await project({}, { 'journal-2.pdf': PDF })
  const r = await run(dir)
  assert.equal(r.code, 1)
  assert.match(r.out, /not listed/)
})

test('stops the build when the permission is missing', async () => {
  const dir = await project({ 'journal-1': { file: 'journal-1.pdf', version: 'accepted' } }, { 'journal-1.pdf': PDF })
  const r = await run(dir)
  assert.equal(r.code, 1)
  assert.match(r.out, /permission/)
})

test('stops the build for a file that is not a PDF, or an unknown id', async () => {
  let dir = await project({ 'journal-1': { file: 'journal-1.pdf', ...ok } }, { 'journal-1.pdf': '<html>' })
  assert.equal((await run(dir)).code, 1)
  dir = await project({ 'journal-99': { file: 'journal-99.pdf', ...ok } }, { 'journal-99.pdf': PDF })
  assert.equal((await run(dir)).code, 1)
})

test('ignores the documentation keys in the manifest', async () => {
  const dir = await project({ _comment: 'x', _example: { 'journal-1': { file: 'journal-1.pdf', ...ok } } }, {})
  const r = await run(dir)
  assert.equal(r.code, 0)
  assert.deepEqual(r.generated, {})
})
