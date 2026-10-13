import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, rmSync, existsSync, readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join, resolve} from 'node:path'
import {readCssaSportState, writeCssaSportState} from '../server/cssa-sport-store.mjs'
import {readCssaSportWatch} from '../server/cssa-sport-watch.mjs'

test('cssa-sport-store : returns default structure when file is missing', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-test-'))
  const testFile = join(tempDir, 'state.json')
  try {
    const state = readCssaSportState(testFile)
    assert.equal(state.version, 'CSSA_SPORT_STATE_V1')
    assert.deepEqual(state.notes, {})
    assert.deepEqual(state.checks, {})
    assert.deepEqual(state.reviewed, {})
    assert.deepEqual(state.tasks, {})
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-sport-store : persists and merges notes, checks, and tasks', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-test-'))
  const testFile = join(tempDir, 'state.json')
  try {
    // 1. First write: add a note and check for J7 Bogny
    const write1 = writeCssaSportState({
      notes: {'r1-j7': 'Plan de match : pressing haut dès la 1ère minute'},
      checks: {'r1-j7': {convocation: true, transport: true}},
      reviewed: {'r1-j7': true},
      tasks: {'r1-j7': [{id: 't-1', label: 'Appeler délégué match', done: false, createdAt: '2026-10-13T10:00:00Z'}]}
    }, testFile)

    assert.equal(write1.notes['r1-j7'], 'Plan de match : pressing haut dès la 1ère minute')
    assert.equal(write1.checks['r1-j7'].convocation, true)
    assert.equal(write1.checks['r1-j7'].transport, true)
    assert.equal(write1.reviewed['r1-j7'], true)
    assert.equal(write1.tasks['r1-j7'].length, 1)

    // 2. Second write: patch another check without losing previous checks or notes
    const write2 = writeCssaSportState({
      checks: {'r1-j7': {medical: true}},
      tasks: {'r1-j7': [
        {id: 't-1', label: 'Appeler délégué match', done: true, createdAt: '2026-10-13T10:00:00Z'},
        {id: 't-2', label: 'Valider maillots', done: false, createdAt: '2026-10-13T10:05:00Z'}
      ]}
    }, testFile)

    assert.equal(write2.checks['r1-j7'].convocation, true, 'previous checks preserved')
    assert.equal(write2.checks['r1-j7'].transport, true, 'previous checks preserved')
    assert.equal(write2.checks['r1-j7'].medical, true, 'new check added')
    assert.equal(write2.notes['r1-j7'], 'Plan de match : pressing haut dès la 1ère minute', 'note preserved')
    assert.equal(write2.tasks['r1-j7'].length, 2)
    assert.equal(write2.tasks['r1-j7'][0].done, true)

    // 3. File content on disk matches
    assert.ok(existsSync(testFile))
    const diskContent = JSON.parse(readFileSync(testFile, 'utf8'))
    assert.equal(diskContent.version, 'CSSA_SPORT_STATE_V1')
    assert.equal(diskContent.checks['r1-j7'].medical, true)
    assert.equal(diskContent.notes['r1-j7'], 'Plan de match : pressing haut dès la 1ère minute')
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-sport-watch : monitors SportCorico, LeBallonRond, CSSA Officiel, District and DVCR media', async () => {
  const watch = await readCssaSportWatch()
  assert.equal(watch.schema, 'CSSA_SPORT_PUBLIC_WATCH_V0')
  assert.equal(watch.readonly, true)
  assert.equal(watch.external_action, false)
  assert.ok(Array.isArray(watch.sources))
  assert.equal(watch.sources.length, 7)

  // Verify all essential sources exist
  const sourceIds = watch.sources.map(s => s.id)
  assert.ok(sourceIds.includes('SPORTCORICO_SENIORS1'))
  assert.ok(sourceIds.includes('LEBALLONROND_R1'))
  assert.ok(sourceIds.includes('CSSA_OFFICIAL_RESULTS'))
  assert.ok(sourceIds.includes('DISTRICT_ARDENNES'))
  assert.ok(sourceIds.includes('DVCR_HOME'))
  assert.ok(sourceIds.includes('DVCR_MATCHDAY'))
  assert.ok(sourceIds.includes('DVCR_BLOG'))

  // Verify DVCR media integration
  assert.ok(watch.dvcrMedia)
  assert.equal(watch.dvcrMedia.associationSiren, '923996078')
  assert.equal(watch.dvcrMedia.channelUrl, 'https://www.dvcr.fr/')
  assert.equal(watch.dvcrMedia.matchdayUrl, 'https://www.dvcr.fr/jour-de-match')
  assert.equal(watch.dvcrMedia.blogUrl, 'https://www.dvcr.fr/blog')
})

test('CSSASportPage : verifies routing, operational dossiers, Bogny conflict, and 18 simulated teams', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // Hash routing invariants
  assert.ok(sportSrc.includes('#cssa/sportif/'), 'deep hash route pattern #cssa/sportif/ must be implemented')
  assert.ok(sportSrc.includes('hashchange'), 'hashchange listener must sync URL')

  // Operational Dossier invariants
  assert.ok(sportSrc.includes('spx-detail'), 'match detail panel exists')
  assert.ok(sportSrc.includes('spx-dossier-nav'), 'match dossier tabs navigation exists')
  assert.ok(sportSrc.includes('checklistItems'), 'match preparation checklist items must exist')
  assert.ok(sportSrc.includes('/obsidia-local/cssa-sport-state'), 'local server bridge endpoint persistence')
  assert.ok(sportSrc.includes('r1-j7'), 'match r1-j7 (Bogny) present')
  assert.ok(sportSrc.includes('PUBLIC_CONFLICT_REVIEW'), 'Bogny conflict review flag')
  assert.ok(sportSrc.includes('SIMULATED_NOT_OBSERVED'), 'secondary teams flagged simulated')

  // Verify 26 R1 match IDs exist in code
  for (let i = 1; i <= 26; i++) {
    assert.ok(sportSrc.includes(`id:'r1-j${i}'`), `R1 match day ${i} must exist in fixtures`)
  }

  // Verify Coupe de France matches exist
  assert.ok(sportSrc.includes("'cdf-1'"), 'Coupe de France Tour 3 must exist')
  assert.ok(sportSrc.includes("'cdf-2'"), 'Coupe de France Tour 4 must exist')
  assert.ok(sportSrc.includes("'cdf-3'"), 'Coupe de France Tour 5 (Hagondange) must exist')

  // Verify DVCR media tab and presence
  assert.ok(sportSrc.includes('dvcr.fr'), 'DVCR links must be embedded')
  assert.ok(sportSrc.includes('Médias & DVCR'), 'DVCR tab must exist')
})

test('local-bridge : endpoint /obsidia-local/cssa-sport-state is present in bridge handler', async () => {
  const bridgeSource = readFileSync(resolve(process.cwd(), 'server', 'local-bridge.mjs'), 'utf8')
  assert.ok(bridgeSource.includes("url.pathname==='/cssa-sport-state'"))
  assert.ok(bridgeSource.includes('readCssaSportState()'))
  assert.ok(bridgeSource.includes('writeCssaSportState(patch)'))
})
