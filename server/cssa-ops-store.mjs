import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {liveDirectory} from './live-events.mjs'

export const defaultOpsFile = resolve(liveDirectory, 'cssa_ops_state.json')
export const defaultSportFile = resolve(liveDirectory, 'cssa_sport_state.json')

export const INITIAL_TASKS = [
  {
    id: 'task-bogny-horaire',
    title: 'Vérifier horaire officiel auprès du secrétariat FC Bogny',
    description: 'Résoudre la discordance d’horaire entre SportCorico (19h00) et LeBallonRond (18h00) pour le derby J7.',
    status: 'A_FAIRE',
    priority: 'CRITIQUE',
    dueAt: '2026-10-15',
    origin: 'SPORTIF',
    structure: 'cssa',
    team: 'SENIORS_R1',
    matchRef: 'r1-j7',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    source: 'SportCorico vs LeBallonRond / LGEF Art. 20.7',
    truthClass: 'PUBLIC_CONFLICT_REVIEW',
    checklist: {
      contactSecretariatBognyPris: true,
      accordEcritObtenu: false,
      transmissionFootclubsFait: false
    },
    notes: 'Discordance horaire ouverte. Le règlement LGEF Art. 20.7 impose l’accord écrit des 2 clubs avant saisine CRC.',
    history: [
      {at: '2026-10-10T10:00:00Z', action: 'CREATION', note: 'Détection du conflit d’horaires SportCorico/LeBallonRond'}
    ],
    relations: [
      {type: 'MATCH', targetId: 'r1-j7', label: 'Match J7 FC Bogny vs Sedan'},
      {type: 'CASE', targetId: 'case-decalage-j7-bogny', label: 'Dossier décalage horaire LGEF Art. 20.7'}
    ],
    caseRef: 'case-decalage-j7-bogny'
  },
  {
    id: 'task-bogny-transport',
    title: 'Préparer transport minibus pour déplacement Bogny',
    description: 'Besoin opérationnel déplacement derby : flotte minibus club à préparer (21 km aller).',
    status: 'A_FAIRE',
    priority: 'HAUTE',
    dueAt: '2026-10-16',
    origin: 'INTENDANCE',
    structure: 'cssa',
    team: 'SENIORS_R1',
    matchRef: 'r1-j7',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    source: 'Plan de déplacement R1 Sedan',
    truthClass: 'ESTIMATED',
    checklist: {
      vehiculeIdentifie: true,
      controleNiveauxFait: false,
      heureDepartConfirmee: false
    },
    notes: 'Besoin opérationnel identifié : 42 km A/R. Départ envisagé 16h30 depuis Montvillers.',
    history: [
      {at: '2026-10-11T09:00:00Z', action: 'CREATION', note: 'Besoin logistique transport créé'}
    ],
    relations: [
      {type: 'MATCH', targetId: 'r1-j7', label: 'Match J7 FC Bogny vs Sedan'}
    ],
    caseRef: null
  },
  {
    id: 'task-j7-fmi-tablette',
    title: 'Vérifier FMI et tablette matchday (LGEF Art. 24)',
    description: 'Charger tablette FMI, synchroniser licences et préparer 2 feuilles papier de secours en sacoche.',
    status: 'A_FAIRE',
    priority: 'HAUTE',
    dueAt: '2026-10-17',
    origin: 'ADMINISTRATION',
    structure: 'cssa',
    team: 'SENIORS_R1',
    matchRef: 'r1-j7',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    source: 'LGEF Art. 24 Statuts et Règlements 2026-2027',
    truthClass: 'PUBLIC_CONFIRMED',
    checklist: {
      tabletteChargee100: true,
      synchroLicencesFootclubs: false,
      kitFeuillePapierSecoursDansSacoche: true
    },
    notes: 'Art. 24 : En cas d’incident technique sur site, la feuille de match papier de secours doit être transmise avant le lundi 10h00.',
    history: [
      {at: '2026-10-12T08:00:00Z', action: 'CREATION', note: 'Checklist protocole FMI initialisée'}
    ],
    relations: [
      {type: 'MATCH', targetId: 'r1-j7', label: 'Match J7 FC Bogny vs Sedan'},
      {type: 'CASE', targetId: 'case-fmi-lgef-conformite', label: 'Dossier Conformité FMI LGEF'}
    ],
    caseRef: 'case-fmi-lgef-conformite'
  },
  {
    id: 'task-terrain-dugauguez-j8',
    title: 'Vérifier créneau et homologation terrain Dugauguez J8',
    description: 'Contrôler absence de collision de créneau avec les autres catégories du club pour la réception de La Neuvillette.',
    status: 'EN_COURS',
    priority: 'NORMALE',
    dueAt: '2026-10-21',
    origin: 'ADMINISTRATION',
    structure: 'cssa',
    team: 'SENIORS_R1',
    matchRef: 'r1-j8',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    source: 'Convention Ardenne Métropole / Calendrier LGEF',
    truthClass: 'PUBLIC_CONFIRMED',
    checklist: {
      eclairageNocturneValide: true,
      filetsEtTracagePlanifies: true,
      collisionEquipesVerifiee: true
    },
    notes: 'Aucun conflit de créneau détecté : Sedan 2 joue à Montvillers.',
    history: [
      {at: '2026-10-09T14:00:00Z', action: 'CREATION', note: 'Vérification créneau terrain J8'}
    ],
    relations: [
      {type: 'MATCH', targetId: 'r1-j8', label: 'Match J8 Sedan vs La Neuvillette'},
      {type: 'CASE', targetId: 'case-terrain-dugauguez', label: 'Convention Ardenne Métropole'}
    ],
    caseRef: 'case-terrain-dugauguez'
  },
  {
    id: 'task-rethel-archivage-fmi',
    title: 'Archivage et vérification clôture FMI R2 Rethel',
    description: 'Vérification du rapport d’arbitrage et confirmation du score 1-1 après match à Rethel.',
    status: 'TERMINE',
    priority: 'BASSE',
    dueAt: '2026-10-05',
    origin: 'SPORTIF',
    structure: 'cssa',
    team: 'SENIORS_R2',
    matchRef: 'r2-j6',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    source: 'DNA / Miroir CSSA Association',
    truthClass: 'SECONDARY_CORROBORATED',
    checklist: {
      scoreVerifieDNA: true,
      feuilleCloturee: true
    },
    notes: 'Match archivé. Résultat corroboré 1-1.',
    history: [
      {at: '2026-10-04T18:00:00Z', action: 'CREATION', note: 'Clôture après rencontre'},
      {at: '2026-10-05T09:00:00Z', action: 'CLOTURE', note: 'Rapport confirmé sans réserve'}
    ],
    relations: [
      {type: 'MATCH', targetId: 'r2-j6', label: 'Match J6 Rethel SF 1–1 Sedan 2'}
    ],
    caseRef: null
  }
]

export const INITIAL_CRM_CASES = [
  {
    id: 'case-decalage-j7-bogny',
    subject: 'Demande de décalage horaire derby J7 Bogny FC (LGEF Art. 20.7)',
    category: 'COMPETITIONS',
    relatedOrg: 'FC Bogny-sur-Meuse / LGEF',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'EN_REVUE',
    priority: 'CRITIQUE',
    truthClass: 'PUBLIC_CONFLICT_REVIEW',
    isTestFixture: false,
    dates: {occurredAt: '2026-10-08T10:00:00Z', dueAt: '2026-10-15T18:00:00Z'},
    provenance: 'SportCorico (19h00) vs LeBallonRond (18h00) / LGEF Art. 20.7',
    workflow: {
      type: 'DECALAGE_MATCH',
      matchRef: 'r1-j7',
      delayDays: 4,
      otherClub: 'FC Bogny-sur-Meuse',
      otherClubAgreement: 'EN_ATTENTE',
      requestSubmitted: false,
      channelUsed: 'OFFICIAL_EMAIL',
      lgefValidation: 'CRC_NON_HOMOLOGUE',
      authorityNote: 'club agreement != final authority · CSSA ne peut pas auto-homologuer le changement (LGEF compétente)',
      proofReceipt: 'KX108_RECEIPT_HOLD_CRC_PENDING'
    },
    interactions: [
      {
        id: 'it-bogny-1',
        date: '2026-10-10',
        type: 'EMAIL',
        summary: 'Prise de contact écrite avec le secrétariat du FC Bogny pour accord formel',
        channel: 'OFFICIAL_EMAIL',
        receipt: 'KX108_HOLD'
      }
    ],
    linkedTaskIds: ['task-bogny-horaire', 'task-bogny-transport'],
    followup: {id: 'fu-bogny-1', taskRef: 'task-bogny-horaire', dueAt: '2026-10-15'},
    history: [
      {at: '2026-10-08T10:00:00Z', action: 'OUVERTURE', note: 'Détection discordance horaire derby'}
    ]
  },
  {
    id: 'case-fmi-lgef-conformite',
    subject: 'Conformité FMI & Procédure secours papier (LGEF Art. 24)',
    category: 'ADMINISTRATION',
    relatedOrg: 'Ligue du Grand Est de Football (LGEF)',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'VALIDE',
    priority: 'HAUTE',
    truthClass: 'PUBLIC_CONFIRMED',
    isTestFixture: false,
    dates: {occurredAt: '2026-09-01T08:00:00Z', dueAt: '2027-06-30T23:59:59Z'},
    provenance: 'LGEF Art. 24 Statuts et Règlements 2026-2027',
    workflow: {
      type: 'FMI',
      fmiPrepControl: 'VERIFIE',
      fmiTechnicalIncident: false,
      paperFallbackDocumented: true,
      transmissionDeadline: 'Lendemain avant 10h00',
      transmissionStatus: 'EN_ATTENTE',
      footclubsNotice: 'Aucun accès API Footclubs raccordé (procédure manuelle assistée)'
    },
    interactions: [
      {
        id: 'it-fmi-1',
        date: '2026-09-01',
        type: 'PORTAL_SUBMISSION',
        summary: 'Homologation protocole dématérialisé pour la saison',
        channel: 'FOOTCLUBS'
      }
    ],
    linkedTaskIds: ['task-j7-fmi-tablette'],
    followup: null,
    history: [
      {at: '2026-09-01T08:00:00Z', action: 'VALIDATION', note: 'Procédure conforme LGEF Art. 24'}
    ]
  },
  {
    id: 'case-terrain-dugauguez',
    subject: 'Convention d’occupation & Homologation Stade Louis-Dugauguez',
    category: 'FACILITIES',
    relatedOrg: 'Ardenne Métropole (SIREN 939505657)',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'VALIDE',
    priority: 'NORMALE',
    truthClass: 'PUBLIC_CONFIRMED',
    isTestFixture: false,
    dates: {occurredAt: '2026-07-01T08:00:00Z', dueAt: '2027-06-30T23:59:59Z'},
    provenance: 'https://ardenne-metropole.fr/stade-de-football-dugauguez/',
    workflow: {
      type: 'TERRAIN_CRENEAU',
      pitchConflictDetected: false,
      pitchConflictStatus: 'AUCUN_CONFLIT',
      pitchResolutionIssue: 'Créneau samedi 18h00 Dugauguez réservé pour les 13 matchs Seniors R1'
    },
    interactions: [
      {
        id: 'it-am-1',
        date: '2026-09-01',
        type: 'COURRIER',
        summary: 'Transmission planning prévisionnel des 13 rencontres à domicile',
        channel: 'OFFICIAL_EMAIL'
      }
    ],
    linkedTaskIds: ['task-terrain-dugauguez-j8'],
    followup: null,
    history: [
      {at: '2026-07-01T08:00:00Z', action: 'CONVENTION_SIGNEE', note: 'Convention en vigueur'}
    ]
  },
  {
    id: 'case-affiliation-lgef',
    subject: 'Affiliation Club N° 500054 & Composition du bureau (LGEF Art. 3.2 - 3.3)',
    category: 'GOVERNANCE_LEGAL',
    relatedOrg: 'Ligue du Grand Est de Football (LGEF)',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'VALIDE',
    priority: 'NORMALE',
    truthClass: 'PUBLIC_CONFIRMED',
    isTestFixture: false,
    dates: {occurredAt: '2026-08-15T08:00:00Z', dueAt: '2027-06-30T23:59:59Z'},
    provenance: 'Annuaire FFF / LGEF Bureau des Compétitions',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Affiliation active. Adresse officielle : sedanardennes.cs@ardennes.lgef.fr'
    },
    interactions: [
      {
        id: 'it-aff-1',
        date: '2026-08-20',
        type: 'PORTAL_SUBMISSION',
        summary: 'Validation affiliation annuelle 500054',
        channel: 'FOOTCLUBS'
      }
    ],
    linkedTaskIds: [],
    followup: null,
    history: [
      {at: '2026-08-20T08:00:00Z', action: 'HOMOLOGUE', note: 'Club N° 500054 affilié'}
    ]
  },
  {
    id: 'case-association-statuts',
    subject: 'Gouvernance légale : Association Loi 1901 vs SAS',
    category: 'GOVERNANCE_LEGAL',
    relatedOrg: 'Préfecture des Ardennes',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'VALIDE',
    priority: 'BASSE',
    truthClass: 'PUBLIC_CONFIRMED',
    isTestFixture: false,
    dates: {occurredAt: '2026-06-01T08:00:00Z', dueAt: 'PERMANENT'},
    provenance: 'SIREN Association 780287843 / SIREN SAS 798016796',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Frontière juridique stricte : droits sportifs portés par l’Association'
    },
    interactions: [],
    linkedTaskIds: [],
    followup: null,
    history: [
      {at: '2026-06-01T08:00:00Z', action: 'REGISTRE', note: 'Statuts préfectoraux conformes'}
    ]
  },
  // Les 5 fixtures de test F3H-D (explicitement étiquetées TEST_FIXTURE / SIMULATED_NOT_OBSERVED)
  {
    id: 'fixture-contract-001',
    subject: 'Contrat prestataire à revoir (Scénario de test)',
    category: 'TEST_FIXTURE',
    relatedOrg: 'Simulation Prestataire F3H-D',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'EN_REVUE',
    priority: 'HAUTE',
    truthClass: 'SIMULATED_NOT_OBSERVED',
    isTestFixture: true,
    dates: {occurredAt: '2026-10-07T10:00:00Z', dueAt: '2026-10-10T17:00:00Z'},
    provenance: 'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Ce dossier est une fixture de test synthétique F3H-D et ne correspond à aucun contrat réel du club.'
    },
    interactions: [
      {
        id: 'it-fix-1',
        date: '2026-10-07',
        type: 'SYSTEM_EVENT',
        summary: 'Revue simulée d’un contrat prestataire avant échéance',
        channel: 'SIMULATION'
      }
    ],
    linkedTaskIds: [],
    followup: null,
    history: [{at: '2026-10-07T10:00:00Z', action: 'SIMULATION', note: 'Fixture F3H-D'}]
  },
  {
    id: 'fixture-institution-001',
    subject: 'Réponse collectivité à préparer (Scénario de test)',
    category: 'TEST_FIXTURE',
    relatedOrg: 'Simulation Collectivité F3H-D',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'EN_REVUE',
    priority: 'NORMALE',
    truthClass: 'SIMULATED_NOT_OBSERVED',
    isTestFixture: true,
    dates: {occurredAt: '2026-10-07T10:05:00Z', dueAt: '2026-10-11T12:00:00Z'},
    provenance: 'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Fixture de test synthétique F3H-D (Simulation d’une demande institutionnelle).'
    },
    interactions: [],
    linkedTaskIds: [],
    followup: null,
    history: [{at: '2026-10-07T10:05:00Z', action: 'SIMULATION', note: 'Fixture F3H-D'}]
  },
  {
    id: 'fixture-matchday-001',
    subject: 'Préparation buvette matchday (Scénario de test)',
    category: 'TEST_FIXTURE',
    relatedOrg: 'Simulation Buvette F3H-D',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'EN_REVUE',
    priority: 'HAUTE',
    truthClass: 'SIMULATED_NOT_OBSERVED',
    isTestFixture: true,
    dates: {occurredAt: '2026-10-07T10:10:00Z', dueAt: '2026-10-09T18:00:00Z'},
    provenance: 'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Fixture de test synthétique F3H-D (Suivi opérationnel buvette).'
    },
    interactions: [],
    linkedTaskIds: [],
    followup: null,
    history: [{at: '2026-10-07T10:10:00Z', action: 'SIMULATION', note: 'Fixture F3H-D'}]
  },
  {
    id: 'fixture-incident-001',
    subject: 'Incident opérationnel à analyser (Scénario de test)',
    category: 'TEST_FIXTURE',
    relatedOrg: 'Simulation RCA F3H-D',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'OUVERT',
    priority: 'CRITIQUE',
    truthClass: 'SIMULATED_NOT_OBSERVED',
    isTestFixture: true,
    dates: {occurredAt: '2026-10-07T10:15:00Z', dueAt: '2026-10-08T17:00:00Z'},
    provenance: 'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Fixture de test synthétique F3H-D (RCA et action corrective).'
    },
    interactions: [],
    linkedTaskIds: [],
    followup: null,
    history: [{at: '2026-10-07T10:15:00Z', action: 'SIMULATION', note: 'Fixture F3H-D'}]
  },
  {
    id: 'fixture-supplier-001',
    subject: 'Livraison fournisseur à confirmer (Scénario de test)',
    category: 'TEST_FIXTURE',
    relatedOrg: 'Simulation Fournisseur F3H-D',
    responsible: 'UNKNOWN / NON ASSIGNÉ',
    status: 'EN_REVUE',
    priority: 'NORMALE',
    truthClass: 'SIMULATED_NOT_OBSERVED',
    isTestFixture: true,
    dates: {occurredAt: '2026-10-07T10:20:00Z', dueAt: '2026-10-09T09:00:00Z'},
    provenance: 'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',
    workflow: {
      type: 'STANDARD',
      authorityNote: 'Fixture de test synthétique F3H-D (Suivi fournisseur matchday).'
    },
    interactions: [],
    linkedTaskIds: [],
    followup: null,
    history: [{at: '2026-10-07T10:20:00Z', action: 'SIMULATION', note: 'Fixture F3H-D'}]
  }
]

export const INITIAL_INTENDANCE_ITEMS = [
  {
    id: 'intendance-transport-bogny',
    category: 'TRANSPORT',
    title: 'Transport équipe R1 Bogny (2 Minibus club)',
    matchRef: 'r1-j7',
    venue: 'Stade Robert Motte (Bogny)',
    status: 'À PRÉPARER',
    notes: 'Besoin opérationnel : 42 km A/R. Minibus à vérifier (pression, carburant). Pas de réservation car externe.',
    truthClass: 'ESTIMATED',
    linkedTaskId: 'task-bogny-transport'
  },
  {
    id: 'intendance-materiel-j7',
    category: 'MATERIEL',
    title: 'Malle maillots Vert/Rouge & Trousse médicale R1',
    matchRef: 'r1-j7',
    venue: 'Stade Robert Motte (Bogny)',
    status: 'À PRÉPARER',
    notes: '18 tenues complètes, chasubles d’échauffement, trousse de secours et poches de froid.',
    truthClass: 'PUBLIC_CONFIRMED',
    linkedTaskId: null
  },
  {
    id: 'intendance-terrain-dugauguez',
    category: 'TERRAIN',
    title: 'Ouverture et pelouse Stade Louis-Dugauguez J8',
    matchRef: 'r1-j8',
    venue: 'Stade Louis-Dugauguez (Sedan)',
    status: 'CONFIRMÉ',
    notes: 'Convention Ardenne Métropole en vigueur. Éclairage nocturne homologué niveau 4.',
    truthClass: 'PUBLIC_CONFIRMED',
    linkedTaskId: 'task-terrain-dugauguez-j8'
  },
  {
    id: 'intendance-vestiaires-dugauguez',
    category: 'VESTIAIRES',
    title: 'Vestiaire officiel arbitres & vestiaire visiteurs J8',
    matchRef: 'r1-j8',
    venue: 'Stade Louis-Dugauguez (Sedan)',
    status: 'À PRÉPARER',
    notes: 'Ouverture des vestiaires 2h avant le coup d’envoi (16h00). Clés et protocole accueil.',
    truthClass: 'PUBLIC_CONFIRMED',
    linkedTaskId: null
  },
  {
    id: 'intendance-benevoles-dugauguez',
    category: 'BENEVOLES',
    title: 'Accueil public & Bénévoles guichet tribune Dugauguez J8',
    matchRef: 'r1-j8',
    venue: 'Stade Louis-Dugauguez (Sedan)',
    status: 'EN ATTENTE',
    notes: 'Besoin matchday : accueil des 800 abonnés officiels. Planning bénévoles en attente de confirmation.',
    truthClass: 'PUBLIC_CONFIRMED',
    linkedTaskId: null
  },
  {
    id: 'intendance-fmi-tablette',
    category: 'MATCHDAY',
    title: 'Tablette FMI et kit secours papier (LGEF Art. 24)',
    matchRef: 'r1-j7',
    venue: 'Stade Robert Motte (Bogny)',
    status: 'CONFIRMÉ',
    notes: 'Tablette chargée + kit papier carbone de secours dans la sacoche.',
    truthClass: 'PUBLIC_CONFIRMED',
    linkedTaskId: 'task-j7-fmi-tablette'
  }
]

export const DEFAULT_OPS_STATE = {
  version: 'CSSA_OPS_STATE_V1',
  updatedAt: new Date().toISOString(),
  tasks: INITIAL_TASKS,
  cases: INITIAL_CRM_CASES,
  intendanceItems: INITIAL_INTENDANCE_ITEMS
}

export const INITIAL_CASES = INITIAL_CRM_CASES
export const INITIAL_INTENDANCE = INITIAL_INTENDANCE_ITEMS

export function readCssaOpsState(filePath = defaultOpsFile) {
  if (!existsSync(filePath)) {
    return JSON.parse(JSON.stringify(DEFAULT_OPS_STATE))
  }
  try {
    const raw = readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return {
      version: parsed.version || DEFAULT_OPS_STATE.version,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_TASKS,
      cases: Array.isArray(parsed.cases) ? parsed.cases : INITIAL_CRM_CASES,
      intendanceItems: Array.isArray(parsed.intendanceItems) ? parsed.intendanceItems : INITIAL_INTENDANCE_ITEMS
    }
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_OPS_STATE))
  }
}

export function writeCssaOpsState(patch = {}, filePath = defaultOpsFile) {
  const current = readCssaOpsState(filePath)

  let nextTasks = current.tasks
  if (Array.isArray(patch.tasks)) {
    nextTasks = patch.tasks
  } else if (patch.taskPatch) {
    const p = patch.taskPatch
    const existingIndex = current.tasks.findIndex(t => t.id === p.id)
    if (existingIndex >= 0) {
      const prev = current.tasks[existingIndex]
      const nextTask = {
        ...prev,
        ...p,
        history: [
          ...(prev.history || []),
          {at: new Date().toISOString(), action: 'UPDATE', note: p.notes || `Statut passé à ${p.status || prev.status}`}
        ]
      }
      nextTasks = current.tasks.map((t, idx) => idx === existingIndex ? nextTask : t)
    } else {
      const newTask = {
        id: p.id || `task-${Date.now()}`,
        title: p.title || 'Nouvelle tâche',
        description: p.description || '',
        status: p.status || 'A_FAIRE',
        priority: p.priority || 'NORMALE',
        dueAt: p.dueAt || new Date().toISOString().slice(0, 10),
        origin: p.origin || 'AUTRE',
        structure: 'cssa',
        team: p.team || null,
        matchRef: p.matchRef || null,
        responsible: p.responsible || 'UNKNOWN / NON ASSIGNÉ',
        source: p.source || 'Saisie utilisateur',
        truthClass: p.truthClass || 'PUBLIC_CONFIRMED',
        checklist: p.checklist || {},
        notes: p.notes || '',
        history: [
          {at: new Date().toISOString(), action: 'CREATION', note: 'Création manuelle'}
        ],
        relations: p.relations || (p.matchRef ? [{type: 'MATCH', targetId: p.matchRef, label: `Match ${p.matchRef}`}] : []),
        caseRef: p.caseRef || null
      }
      nextTasks = [newTask, ...current.tasks]
    }
  } else if (patch.taskDeleteId) {
    nextTasks = current.tasks.filter(t => t.id !== patch.taskDeleteId)
  }

  let nextCases = current.cases
  if (Array.isArray(patch.cases)) {
    nextCases = patch.cases
  } else if (patch.casePatch) {
    const p = patch.casePatch
    const idx = current.cases.findIndex(c => c.id === p.id)
    if (idx >= 0) {
      nextCases = current.cases.map((c, i) => i === idx ? {...c, ...p} : c)
    } else {
      nextCases = [...current.cases, p]
    }
  }

  let nextIntendance = current.intendanceItems
  if (Array.isArray(patch.intendanceItems)) {
    nextIntendance = patch.intendanceItems
  } else if (patch.intendancePatch) {
    const p = patch.intendancePatch
    const idx = current.intendanceItems.findIndex(item => item.id === p.id)
    if (idx >= 0) {
      nextIntendance = current.intendanceItems.map((item, i) => i === idx ? {...item, ...p} : item)
    } else {
      nextIntendance = [...current.intendanceItems, p]
    }
  }

  const next = {
    version: DEFAULT_OPS_STATE.version,
    updatedAt: new Date().toISOString(),
    tasks: nextTasks,
    cases: nextCases,
    intendanceItems: nextIntendance
  }

  const dir = resolve(filePath, '..')
  if (!existsSync(dir)) {
    mkdirSync(dir, {recursive: true})
  }
  writeFileSync(filePath, JSON.stringify(next, null, 2), 'utf8')

  // Synchronisation bidirectionnelle automatique avec cssa_sport_state.json si le fichier est configuré
  try {
    syncOpsToSportState(next, defaultSportFile)
  } catch {}

  return next
}

/**
 * Synchronise les tâches liées à un match vers cssa_sport_state.json
 */
export function syncOpsToSportState(opsState, sportFilePath = defaultSportFile) {
  if (!existsSync(sportFilePath)) return
  try {
    const raw = readFileSync(sportFilePath, 'utf8')
    const sport = JSON.parse(raw)
    const sportTasks = sport.tasks || {}

    // Parcourir chaque match et mettre à jour les tâches
    for (const task of opsState.tasks) {
      if (task.matchRef) {
        const list = sportTasks[task.matchRef] || []
        const existingIdx = list.findIndex(t => t.id === task.id)
        const matchTask = {
          id: task.id,
          label: task.title,
          done: task.status === 'TERMINE',
          createdAt: task.history?.[0]?.at || new Date().toISOString(),
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt,
          origin: task.origin,
          responsible: task.responsible,
          source: task.source,
          truthClass: task.truthClass,
          notes: task.notes
        }
        if (existingIdx >= 0) {
          list[existingIdx] = {...list[existingIdx], ...matchTask}
        } else {
          list.push(matchTask)
        }
        sportTasks[task.matchRef] = list
      }
    }

    sport.tasks = sportTasks
    sport.updatedAt = new Date().toISOString()
    writeFileSync(sportFilePath, JSON.stringify(sport, null, 2), 'utf8')
  } catch {}
}

/**
 * Synchronise les tâches créées depuis Sportif vers cssa_ops_state.json
 */
export function syncSportTasksToOps(matchId, matchTasksList, opsFilePath = defaultOpsFile) {
  if (!Array.isArray(matchTasksList)) return
  const currentOps = readCssaOpsState(opsFilePath)
  let changed = false
  const updatedTasks = [...currentOps.tasks]

  for (const mt of matchTasksList) {
    const existingIdx = updatedTasks.findIndex(t => t.id === mt.id)
    const taskStatus = mt.done ? 'TERMINE' : (mt.status || 'A_FAIRE')
    if (existingIdx >= 0) {
      if (updatedTasks[existingIdx].status !== taskStatus || updatedTasks[existingIdx].title !== mt.label) {
        updatedTasks[existingIdx] = {
          ...updatedTasks[existingIdx],
          title: mt.label,
          status: taskStatus,
          notes: mt.notes !== undefined ? mt.notes : updatedTasks[existingIdx].notes
        }
        changed = true
      }
    } else {
      updatedTasks.unshift({
        id: mt.id,
        title: mt.label,
        description: `Tâche créée depuis le dossier match ${matchId}`,
        status: taskStatus,
        priority: mt.priority || 'HAUTE',
        dueAt: mt.dueAt || new Date().toISOString().slice(0, 10),
        origin: 'SPORTIF',
        structure: 'cssa',
        team: matchId.startsWith('r1-') ? 'SENIORS_R1' : matchId.startsWith('r2-') ? 'SENIORS_R2' : matchId.startsWith('u20-') ? 'U20_R1' : 'FORMATION',
        matchRef: matchId,
        responsible: mt.responsible || 'UNKNOWN / NON ASSIGNÉ',
        source: 'Dossier de match Sportif',
        truthClass: mt.truthClass || 'PUBLIC_CONFIRMED',
        checklist: {},
        notes: mt.notes || '',
        history: [{at: mt.createdAt || new Date().toISOString(), action: 'CREATION', note: 'Création depuis Sportif'}],
        relations: [{type: 'MATCH', targetId: matchId, label: `Match ${matchId}`}],
        caseRef: null
      })
      changed = true
    }
  }

  if (changed) {
    writeCssaOpsState({tasks: updatedTasks}, opsFilePath)
  }
}
