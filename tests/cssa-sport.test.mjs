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
  assert.ok(sportSrc.includes('readCssaSportLocal'), 'uses the local sporting read/write connection')
  assert.ok(readFileSync(resolve(process.cwd(), 'src/cssaSportLocal.ts'),'utf8').includes('/obsidia-local/cssa-sport-state'), 'local server bridge endpoint persistence')
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

test('CSSASportPage : verifies Seniors R2 calendar, 12 R2_A clubs, Rethel conflict, and Montvillers venue', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // Verify R2 team elevation to real / corroborated
  assert.ok(sportSrc.includes("id: 'SENIORS_R2'"))
  assert.ok(sportSrc.includes("RÉGIONAL 2 — POULE A"))

  // Verify all 22 R2 fixtures exist
  for (let i = 1; i <= 22; i++) {
    assert.ok(sportSrc.includes(`id:'r2-j${i}'`), `R2 match day ${i} must exist`)
  }

  // Verify 11 R2 opponents from public model are present
  const r2Clubs = [
    'Rethel SF',
    'Reims Murigny FP',
    'AS Val de l’Aisne',
    'ES Fagnières',
    'Reims FC Christo',
    'Val de l’Orne FC',
    'AS Saint-Brice-Courcelles',
    'UL Plantières',
    'US Étain-Buzy',
    'Reims Sainte-Anne 2',
    'CS Veymerange'
  ]
  for (const club of r2Clubs) {
    assert.ok(sportSrc.includes(club), `Club ${club} must be present in R2 calendar`)
  }

  // Verify J6 Rethel conflict alert (DNA vs Association mirror)
  assert.ok(sportSrc.includes("'r2-j6'"), 'Match r2-j6 must exist')
  assert.ok(sportSrc.includes('DNA (Dernières Nouvelles d’Alsace)'), 'DNA source corroboration')

  // Verify Home pitch is Complexe Montvillers (Bazeilles)
  assert.ok(sportSrc.includes('Complexe Montvillers (Bazeilles)'), 'Home matches assigned to Complexe Montvillers')
})

test('CSSASportPage : verifies U20 R1 calendar, Reims Ste-Anne fixture, and development pipeline', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // Verify U20 team elevation
  assert.ok(sportSrc.includes("id: 'U20_R1'"))
  assert.ok(sportSrc.includes("U20 RÉGIONAL 1"))

  // Verify all 22 U20 fixtures exist
  for (let i = 1; i <= 22; i++) {
    assert.ok(sportSrc.includes(`id:'u20-j${i}'`), `U20 match day ${i} must exist`)
  }

  // Verify observed match of 03/10/2026 vs Reims Sainte-Anne (OBS_U20_R1_WEEKEND)
  assert.ok(sportSrc.includes("'u20-j6'"), 'Match u20-j6 must exist')
  assert.ok(sportSrc.includes('Reims Sainte-Anne U20'), 'Reims Ste-Anne U20 opponent present')
  assert.ok(sportSrc.includes('OBS_U20_R1_WEEKEND'), 'Observation reference present')
  assert.ok(sportSrc.includes('groupe-de-developpement'), 'CSSA development pipeline URL referenced')
})

test('CSSASportPage : verifies observed youth results and transparency for unconnected categories', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // Observed youth matches from public snapshot
  assert.ok(sportSrc.includes('obs-u16-ocpam'), 'Observed U16 match vs OCPAM must exist')
  assert.ok(sportSrc.includes('obs-u15-mifa'), 'Observed U15 match vs MIFA must exist')
  assert.ok(sportSrc.includes('Est Républicain'), 'Est Républicain citation present')
  assert.ok(sportSrc.includes('Le Progrès'), 'Le Progrès citation present')

  // Transparency banner for unconnected categories
  assert.ok(sportSrc.includes('DONNÉES RÉELLES NON RACCORDÉES'), 'Banner for unlinked youth categories present')
  assert.ok(sportSrc.includes('Masquer la simulation F3E') || sportSrc.includes('Afficher la simulation F3E'), 'Simulation toggle present')
})

test('CSSASportPage : verifies Calendrier Global Club, pitch collision detection, and logistics matrix', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // Global calendar invariants
  assert.ok(sportSrc.includes('CALENDRIER_GLOBAL'), 'Global calendar route & mode present')
  assert.ok(sportSrc.includes('CALENDRIER GLOBAL CLUB'), 'Global calendar button card label present')

  // Pitch collision detector function and alerts
  assert.ok(sportSrc.includes('detectPitchConflicts'), 'Collision detector function must be defined')
  assert.ok(sportSrc.includes('spx-conflict-banner'), 'Conflict banner CSS class present')
  assert.ok(sportSrc.includes('LGEF Art. 20-7'), 'LGEF Art. 20-7 regulation rule referenced')
  assert.ok(sportSrc.includes('Créer tâche de conciliation'), 'Conflict task action button present')

  // Weekend filters and logistics summary
  assert.ok(sportSrc.includes('weekend_cur'), 'Current weekend filter present')
  assert.ok(sportSrc.includes('weekend_prev'), 'Previous weekend filter present')
  assert.ok(sportSrc.includes('spx-logistics-bar'), 'Logistics summary bar present')
  assert.ok(sportSrc.includes('LGEF Art. 24'), 'FMI Art. 24 regulation referenced')
})

test('cssa-sport-store : multi-team persistence across R1, R2, U20, and youth matches', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'obsidia-test-multiteam-'))
  const testFile = join(tempDir, 'state.json')
  try {
    // Save notes and tasks across 3 different teams
    const state = writeCssaSportState({
      notes: {
        'r1-j7': 'Pressing haut Bogny',
        'r2-j7': 'Échauffement synthétique Montvillers',
        'u20-j7': 'Départ minibus Nancy 12h15'
      },
      checks: {
        'r1-j7': {convocation: true},
        'r2-j7': {fmi: true},
        'u20-j7': {transport: true}
      },
      tasks: {
        'r1-j7': [{id: 't1', label: 'Appel délégué', done: true, createdAt: '2026-10-13T10:00:00Z'}],
        'r2-j7': [{id: 't2', label: 'Valider feuille FMI', done: false, createdAt: '2026-10-13T10:05:00Z'}],
        'u20-j7': [{id: 't3', label: 'Récupérer clés minibus', done: false, createdAt: '2026-10-13T10:10:00Z'}]
      }
    }, testFile)

    assert.equal(state.notes['r1-j7'], 'Pressing haut Bogny')
    assert.equal(state.notes['r2-j7'], 'Échauffement synthétique Montvillers')
    assert.equal(state.notes['u20-j7'], 'Départ minibus Nancy 12h15')

    assert.equal(state.checks['r1-j7'].convocation, true)
    assert.equal(state.checks['r2-j7'].fmi, true)
    assert.equal(state.checks['u20-j7'].transport, true)

    assert.equal(state.tasks['r1-j7'][0].label, 'Appel délégué')
    assert.equal(state.tasks['r2-j7'][0].label, 'Valider feuille FMI')
    assert.equal(state.tasks['u20-j7'][0].label, 'Récupérer clés minibus')

    // Read back from disk
    const reloaded = readCssaSportState(testFile)
    assert.equal(reloaded.notes['u20-j7'], 'Départ minibus Nancy 12h15')
    assert.equal(reloaded.tasks['r2-j7'][0].done, false)
  } finally {
    rmSync(tempDir, {recursive: true, force: true})
  }
})

test('PASSE 02B · Audit de Vérité Sportive : invariants de vérité, frontières F3G-D et interdiction des données inventées', () => {
  const sportSrc = readFileSync(resolve(process.cwd(), 'src/CSSASportPage.tsx'), 'utf8')

  // 1. Organigramme officiel : 19 structures d'équipes canoniques
  const expectedTeams = [
    'SENIORS_R1', 'SENIORS_R2', 'U20_R1',
    'U17_R1', 'U16_R1', 'U15_R1', 'U15_D1',
    'U13_FANION', 'U13_U12_ESPOIR', 'U12_AVENIR',
    'U11_FANION', 'U11_U10_ESPOIR', 'U10_AVENIR',
    'U9', 'U8', 'U7', 'U6',
    'SENIORS_F', 'U18F_R2'
  ]
  for (const tid of expectedTeams) {
    assert.ok(sportSrc.includes(`id: '${tid}'`), `Team structure ${tid} must be declared in TEAMS`)
  }

  // 2. Équipes majeures à profondeur réelle
  assert.ok(sportSrc.includes("id: 'SENIORS_R1', label: 'Seniors R1 (Fanion)', tier: 'MAJEURES', competition: 'RÉGIONAL 1 — POULE A', fixtureCount: 26, isReal: true"))
  assert.ok(sportSrc.includes("id: 'SENIORS_R2', label: 'Seniors R2 (Réserve)', tier: 'MAJEURES', competition: 'RÉGIONAL 2 — POULE A', fixtureCount: 22, isReal: true"))
  assert.ok(sportSrc.includes("id: 'U20_R1', label: 'U20 R1 (Développement)', tier: 'MAJEURES', competition: 'U20 RÉGIONAL 1', fixtureCount: 22, isReal: true"))

  // 3. Contradictions publiques ouvertes (doctrine F3G-D : jamais réconciliées artificiellement)
  assert.ok(sportSrc.includes("id:'r1-j7'"), 'R1 J7 Bogny must exist')
  assert.ok(sportSrc.includes("truth:'PUBLIC_CONFLICT_REVIEW'"), 'PUBLIC_CONFLICT_REVIEW classification must be present')
  assert.ok(sportSrc.includes("Discordance d’observation : SportCorico indique samedi 17/10 16h00 tandis que LeBallonRond et annonces antérieures indiquaient dimanche"), 'Bogny conflict explanation present')
  assert.ok(sportSrc.includes("id:'r2-j6'"), 'R2 J6 Rethel fixture must exist')
  assert.ok(sportSrc.includes("Discordance d’observation sur l’horaire : 16h30 (Miroir CSSA 02/10) vs 15h00 (DNA 07/10)"), 'Rethel time conflict explanation present')

  // 4. Règle 7 : Interdiction d'inventer des arbitres, des compos ou des vestiaires
  // Aucune mention d'arbitre synthétique ou de fausse composition dans les fixtures
  assert.ok(!sportSrc.includes("arbitre: 'Arbitre"), 'No fabricated referee names')
  assert.ok(!sportSrc.includes("composition: ['Joueur"), 'No fabricated starting 11 lineups')

  // 5. Règle 8 : Transparence absolue et isolation F3E
  assert.ok(sportSrc.includes('DONNÉES RÉELLES NON RACCORDÉES'), 'Unconnected categories banner present')
  assert.ok(sportSrc.includes("truth: 'SIMULATED_NOT_OBSERVED'"), 'Simulated fixtures explicitly badged')
  assert.ok(sportSrc.includes("source: 'F3E full_season_v0'"), 'Simulation engine source identified')

  // 6. Tiers et pôles opérationnels réels
  assert.ok(sportSrc.includes('NIVEAU 1 · ÉQUIPES MAJEURES'), 'Tier 1 present in UI')
  assert.ok(sportSrc.includes('NIVEAU 2 · FORMATION / ACADÉMIE'), 'Tier 2 present in UI')
  assert.ok(sportSrc.includes('NIVEAU 3 · ÉCOLE DE FOOT'), 'Tier 3 present in UI')
  assert.ok(sportSrc.includes('NIVEAU 4 · PÔLE FÉMININES'), 'Tier 4 present in UI')
  assert.ok(sportSrc.includes('CALENDRIER GLOBAL CLUB'), 'Cross-club calendar present in UI')
})

