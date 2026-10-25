// Run with: npm run test:scripts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { parseArgs } from './args.mjs'

test('reads the email however the shell passed it', () => {
  // PowerShell: npm swallowed "--email" and passed only the address.
  assert.equal(parseArgs(['me@example.org'], { npm_config_email: 'true' }).email, 'me@example.org')
  assert.equal(parseArgs(['email=me@example.org'], {}).email, 'me@example.org')
  assert.equal(parseArgs(['--email', 'me@example.org'], {}).email, 'me@example.org')
  assert.equal(parseArgs(['--email=me@example.org'], {}).email, 'me@example.org')
  assert.equal(parseArgs(['limit=30'], {}).email, undefined)
})

test('reads other options in every form', () => {
  const a = parseArgs(['me@example.org', 'limit=30', 'only=journal-1,book-2', 'refresh'], {})
  assert.equal(a.get('limit'), '30')
  assert.equal(a.get('only'), 'journal-1,book-2')
  assert.equal(a.has('refresh'), true)
  assert.equal(a.has('no-oa'), false)
  const b = parseArgs(['--limit', '5', '--no-oa'], {})
  assert.equal(b.get('limit'), '5')
  assert.equal(b.has('no-oa'), true)
  // npm took "--refresh" as its own setting.
  assert.equal(parseArgs([], { npm_config_refresh: 'true' }).has('refresh'), true)
  assert.equal(parseArgs([], { npm_config_limit: '12' }).get('limit'), '12')
})
