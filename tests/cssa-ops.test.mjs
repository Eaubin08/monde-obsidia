import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {
  readCssaOpsState,
  writeCssaOpsState,
  syncOpsToSportState,
  syncSportTasksToOps,
  INITIAL_TASKS,
  INITIAL_CASES,
  INITIAL_INTENDANCE
} from '../server/cssa-ops-store.mjs'

test('cssa-ops-store : returns default canonical state with initial tasks, cases, intendance when file is missing', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-ops-test-'))
  const testFile = join(tempDir, 'missing_ops_state.json')
  try {
    const state = readCssaOpsState(testFile)
    assert.equal(state.version, 'CSSA_OPS_STATE_V1')
    assert.ok(Array.isArray(state.tasks))
    assert.ok(state.tasks.length >= 5)
    assert.ok(Array.isArray(state.cases))
    assert.ok(state.cases.length >= 6)
    assert.ok(Array.isArray(state.intendanceItems))
    assert.ok(state.intendanceItems.length >= 5)

    // Verify Bogny matchday postponement task exists
    const bognyTask = state.tasks.find(t => t.id === 'task-bogny-horaire')
    assert.ok(bognyTask)
    assert.equal(bognyTask.matchRef, 'r1-j7')
    assert.equal(bognyTask.responsible, 'UNKNOWN / NON ASSIGNÉ')
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-ops-store : persists new task, modifies status, updates checklist, and deletes task', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-ops-test-'))
  const testFile = join(tempDir, 'ops_state.json')
  try {
    // 1. Create a new task
    const created = writeCssaOpsState({
      taskPatch: {
        id: 'task-test-convocation',
        title: 'Contrôler feuille de route arbitre',
        status: 'A_FAIRE',
        priority: 'HAUTE',
        dueAt: '2026-10-18',
        origin: 'ADMINISTRATION',
        matchRef: 'r1-j7',
        responsible: 'UNKNOWN / NON ASSIGNÉ',
        checklist: {
          accordLGEF: false
        }
      }
    }, testFile)

    const found = created.tasks.find(t => t.id === 'task-test-convocation')
    assert.ok(found)
    assert.equal(found.title, 'Contrôler feuille de route arbitre')
    assert.equal(found.status, 'A_FAIRE')
    assert.equal(found.priority, 'HAUTE')
    assert.equal(found.responsible, 'UNKNOWN / NON ASSIGNÉ')
    assert.equal(found.checklist.accordLGEF, false)

    // 2. Update task status and checklist
    const updated = writeCssaOpsState({
      taskPatch: {
        id: 'task-test-convocation',
        status: 'EN_COURS',
        checklist: {
          accordLGEF: true
        },
        notes: 'Discussion en cours avec le délégué de ligue'
      }
    }, testFile)

    const updatedTask = updated.tasks.find(t => t.id === 'task-test-convocation')
    assert.ok(updatedTask)
    assert.equal(updatedTask.status, 'EN_COURS')
    assert.equal(updatedTask.checklist.accordLGEF, true)
    assert.equal(updatedTask.notes, 'Discussion en cours avec le délégué de ligue')

    // 3. Mark task completed
    const completed = writeCssaOpsState({
      taskPatch: {
        id: 'task-test-convocation',
        status: 'TERMINE'
      }
    }, testFile)
    const completedTask = completed.tasks.find(t => t.id === 'task-test-convocation')
    assert.equal(completedTask.status, 'TERMINE')

    // 4. Delete task
    const deleted = writeCssaOpsState({
      taskDeleteId: 'task-test-convocation'
    }, testFile)
    assert.ok(!deleted.tasks.some(t => t.id === 'task-test-convocation'))
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-ops-store : strictly forbids invented responsibles and defaults to UNKNOWN / NON ASSIGNÉ', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-ops-test-'))
  const testFile = join(tempDir, 'ops_state.json')
  try {
    const state = readCssaOpsState(testFile)
    for (const task of state.tasks) {
      assert.ok(
        task.responsible === 'UNKNOWN / NON ASSIGNÉ' || task.responsible.includes('UNKNOWN'),
        `Task ${task.id} has invalid or invented responsible: ${task.responsible}`
      )
    }
    for (const c of state.cases) {
      assert.ok(
        c.responsible === 'UNKNOWN / NON ASSIGNÉ' || c.responsible.includes('UNKNOWN'),
        `Case ${c.id} has invalid or invented responsible: ${c.responsible}`
      )
    }
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-ops-store : manages CRM cases, workflows (LGEF Art. 20.7, Art. 24), and segregates test fixtures', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-ops-test-'))
  const testFile = join(tempDir, 'ops_state.json')
  try {
    const state = readCssaOpsState(testFile)

    // Real Case: Décalage J7 Bogny LGEF Art. 20.7
    const decalageCase = state.cases.find(c => c.id === 'case-decalage-j7-bogny')
    assert.ok(decalageCase)
    assert.equal(decalageCase.isTestFixture, false)
    assert.equal(decalageCase.workflow.type, 'DECALAGE_MATCH')
    assert.equal(decalageCase.workflow.matchRef, 'r1-j7')
    assert.ok(decalageCase.interactions.length >= 1)

    // Real Case: FMI Tablette LGEF Art. 24
    const fmiCase = state.cases.find(c => c.id === 'case-fmi-lgef-conformite')
    assert.ok(fmiCase)
    assert.equal(fmiCase.isTestFixture, false)
    assert.equal(fmiCase.workflow.type, 'FMI')
    assert.equal(fmiCase.workflow.paperFallbackDocumented, true)

    // Test Fixtures Segregation (F3H-D)
    const fixtures = state.cases.filter(c => c.isTestFixture)
    assert.ok(fixtures.length >= 2, 'Must include test fixtures segregated from real club cases')
    for (const fixture of fixtures) {
      assert.ok(fixture.truthClass.startsWith('SIMULATED_NOT_OBSERVED'))
      assert.ok(fixture.id.startsWith('fixture-') || fixture.provenance.includes('TEST'))
    }

    // Update case workflow
    const patched = writeCssaOpsState({
      casePatch: {
        id: 'case-decalage-j7-bogny',
        workflow: {
          ...decalageCase.workflow,
          otherClubAgreement: 'ACCORD_OBTENU'
        }
      }
    }, testFile)

    const updatedCase = patched.cases.find(c => c.id === 'case-decalage-j7-bogny')
    assert.equal(updatedCase.workflow.otherClubAgreement, 'ACCORD_OBTENU')
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-ops-store : intendance items strictly enforce valid logistics statuses', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-ops-test-'))
  const testFile = join(tempDir, 'ops_state.json')
  const validStatuses = new Set(['CONFIRMÉ', 'À PRÉPARER', 'EN ATTENTE', 'UNKNOWN'])
  try {
    const state = readCssaOpsState(testFile)
    for (const item of state.intendanceItems) {
      assert.ok(
        validStatuses.has(item.status),
        `Item ${item.id} has invalid intendance status: ${item.status}`
      )
    }

    // Update intendance item
    const patched = writeCssaOpsState({
      intendancePatch: {
        id: 'int-bogny-minibus',
        status: 'CONFIRMÉ',
        notes: 'Chauffeur bénévole confirmé et clés récupérées au club-house'
      }
    }, testFile)

    const updated = patched.intendanceItems.find(i => i.id === 'int-bogny-minibus')
    assert.equal(updated.status, 'CONFIRMÉ')
    assert.equal(updated.notes, 'Chauffeur bénévole confirmé et clés récupérées au club-house')
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('cssa-ops-store : bi-directional synchronization and non-duplication contract between Sport and Ops', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-sync-test-'))
  const opsFile = join(tempDir, 'ops_state.json')
  const sportFile = join(tempDir, 'sport_state.json')

  try {
    // 1. Initialize ops state
    writeCssaOpsState({}, opsFile)

    // 2. Initialize sport state with a task on match r1-j7
    const sportState = {
      version: 'CSSA_SPORT_STATE_V1',
      updatedAt: new Date().toISOString(),
      notes: {},
      checks: {},
      reviewed: {},
      tasks: {
        'r1-j7': [
          {
            id: 'task-sport-sync-1',
            label: 'Confirmer collation d’après-match avec traiteur',
            done: false,
            createdAt: '2026-10-13T10:00:00Z',
            status: 'A_FAIRE',
            priority: 'NORMALE',
            responsible: 'UNKNOWN / NON ASSIGNÉ'
          }
        ]
      }
    }
    writeFileSync(sportFile, JSON.stringify(sportState, null, 2), 'utf8')

    // 3. Sync from Sport to Ops
    syncSportTasksToOps('r1-j7', sportState.tasks['r1-j7'], opsFile)

    const opsAfterSportSync = readCssaOpsState(opsFile)
    const syncedTask = opsAfterSportSync.tasks.find(t => t.id === 'task-sport-sync-1')
    assert.ok(syncedTask, 'Task created in Sport must be present in Ops with exact same ID')
    assert.equal(syncedTask.title, 'Confirmer collation d’après-match avec traiteur')
    assert.equal(syncedTask.matchRef, 'r1-j7')
    assert.equal(syncedTask.status, 'A_FAIRE')

    // 4. Update task in Ops: mark TERMINE and change title
    const updatedOps = writeCssaOpsState({
      taskPatch: {
        id: 'task-sport-sync-1',
        title: 'Confirmer collation d’après-match avec traiteur (Validé)',
        status: 'TERMINE'
      }
    }, opsFile)

    // 5. Sync from Ops to Sport
    syncOpsToSportState(updatedOps, sportFile)

    const rawSport = JSON.parse(readFileSync(sportFile, 'utf8'))
    const matchTasks = rawSport.tasks['r1-j7']
    const updatedSportTask = matchTasks.find(t => t.id === 'task-sport-sync-1')
    assert.ok(updatedSportTask)
    assert.equal(updatedSportTask.done, true, 'Status TERMINE in Ops must set done=true in Sport')
    assert.equal(updatedSportTask.label, 'Confirmer collation d’après-match avec traiteur (Validé)')
    assert.equal(updatedSportTask.status, 'TERMINE')
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})
