import {useEffect,useMemo,useState} from 'react'
import './CSSAPage.css'

type Status='LIVE'|'PROVEN'|'OPEN'|'HOLD'|'PAPER'|'RECORDED_REAL'|'PARTIAL'
type Capability={
  id:string
  label:string
  status:Status
  summary:string
  details:string[]
}
type Organization={
  id:string
  name:string
  subtitle:string
  kind:string
  domainId:string
  adapterId:string
  contractVersion:string
  source:string
  capabilities:Capability[]
  unknowns:string[]
  contradictions:string[]
  risks:string[]
  evidence:string[]
}
type Project={id:string;title:string;status:string}
type NativeEntity={
  id:string;kind:string;label:string;evidence_hash?:string;verification?:string;
  status?:string|null;priority?:string|null;due_at?:string|null;provider?:string;
  gate?:string|null;receipt_type?:string;mode?:string;domainId?:string;
  agentId?:string;nativeService?:boolean;observedState?:string;phase?:string;
  decisionAuthority?:string;reason?:string;[key:string]:unknown
}
type NativeReadModel={
  schema:string;available?:boolean;readonly?:boolean;decision_authority?:string;
  reason?:string;entities?:NativeEntity[];relations?:{from:string;type:string;to:string}[];
  availability?:Record<string,string>;projection_hash?:string
}

type SemanticFrame={purpose:string;context:string;observes?:string;feeds:string;impact:string;limits:string;provenance?:string}
type SourceCatalogItem={
  id:string;title:string;url:string;truthClass:'PUBLIC_CONFIRMED'|'SECONDARY_CORROBORATED';
  cadence:'WEEKLY'|'BIWEEKLY'|'MONTHLY';criticality:'LOW'|'MEDIUM'|'HIGH';
  semantics:SemanticFrame
}

const cssaSourceCatalog:SourceCatalogItem[]=[
  {id:'CSSA_HOME',title:'Site officiel CSSA',url:'https://cs-sedan.fr/',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'MEDIUM',semantics:{
    purpose:'Point d’entrée public général du club.',
    context:'Source officielle utilisée pour repérer les annonces et changements publics généraux.',
    observes:'Actualités, annonces, informations institutionnelles et liens publics.',
    feeds:'Veille publique, communication, revue administrative.',
    impact:'Peut déclencher une revue lorsqu’un contenu public important change.',
    limits:'Ne décrit pas le fonctionnement interne réel du club.'
  }},
  {id:'CSSA_ORGANIGRAMME_ASSOCIATION',title:'Organigramme association',url:'https://cs-sedan.fr/organigramme-association',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'HIGH',semantics:{
    purpose:'Suivre la structure dirigeante et administrative publiée.',
    context:'Référence publique pour les rôles et fonctions affichés par le club.',
    observes:'Dirigeants, fonctions, responsabilités et changements d’organigramme.',
    feeds:'Administration, CRM organisation, circuits de validation à confirmer.',
    impact:'Un changement peut modifier les interlocuteurs ou responsabilités supposées.',
    limits:'Ne prouve ni les droits réels, ni les délégations informelles, ni les accès outils.'
  }},
  {id:'CSSA_MANAGER_RECRUITMENT',title:'Recrutement manager général',url:'https://cs-sedan.fr/recrutement-manager-general',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'HIGH',semantics:{
    purpose:'Suivre le statut public du besoin ou du rôle de manager général.',
    context:'Annonce officielle pouvant signaler une évolution de gouvernance opérationnelle.',
    observes:'Existence de l’annonce, contenu du poste, évolution ou retrait.',
    feeds:'Administration, organisation, revue des responsables.',
    impact:'Peut remettre en cause un organigramme ou un rôle supposé.',
    limits:'Une annonce ne prouve pas qu’un recrutement a été finalisé.'
  }},
  {id:'CSSA_ACADEMY_ORG',title:'Organigramme académie',url:'https://cs-sedan.fr/organigramme-academie',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantics:{
    purpose:'Suivre l’organisation publique de l’académie.',
    context:'Source officielle pour les rôles publiés côté formation.',
    observes:'Responsables, fonctions et structure académique.',
    feeds:'Organisation, CRM, activités académie.',
    impact:'Aide à identifier les bons interlocuteurs publics.',
    limits:'Ne prouve pas les pratiques, handoffs ou droits internes.'
  }},
  {id:'CSSA_VOLUNTEER_RECRUITMENT',title:'Recrutement bénévoles',url:'https://cs-sedan.fr/recrutement-benevole',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantics:{
    purpose:'Suivre les besoins bénévoles publiquement exprimés.',
    context:'Signal public sur les besoins humains et opérationnels du club.',
    observes:'Missions recherchées, besoins, campagnes de recrutement.',
    feeds:'Matchday, opérations, organisation des ressources.',
    impact:'Peut révéler une tension ou un besoin opérationnel.',
    limits:'Ne donne pas les effectifs réellement disponibles ni leurs disponibilités.'
  }},
  {id:'CSSA_ACCREDITATIONS',title:'Accréditations',url:'https://cs-sedan.fr/accreditations',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantics:{
    purpose:'Suivre les règles publiques d’accréditation.',
    context:'Référence officielle pour les procédures d’accès publiées.',
    observes:'Modalités, formulaires, délais et conditions d’accréditation.',
    feeds:'Administration, matchday, procédures.',
    impact:'Un changement peut modifier une procédure ou une échéance.',
    limits:'Ne prouve pas les validations internes réelles d’une demande donnée.'
  }},
  {id:'CSSA_LICENSE_2026_2027',title:'Licences 2026–2027',url:'https://cs-sedan.fr/renouvellement-licence-2026-2027',truthClass:'PUBLIC_CONFIRMED',cadence:'MONTHLY',criticality:'MEDIUM',semantics:{
    purpose:'Suivre les informations publiques de renouvellement de licence.',
    context:'Source saisonnière officielle pour procédures et montants publiés.',
    observes:'Tarifs, dates, modalités et pièces demandées.',
    feeds:'Administration, finance publique, reporting saison.',
    impact:'Peut affecter les démarches et estimations de coûts.',
    limits:'Ne prouve pas le nombre réel de licenciés ni les paiements internes.'
  }},
  {id:'CSSA_SUBSCRIPTION_2026_2027',title:'Abonnements 2026–2027',url:'https://cs-sedan.fr/abonnement-26-27',truthClass:'PUBLIC_CONFIRMED',cadence:'MONTHLY',criticality:'MEDIUM',semantics:{
    purpose:'Suivre l’offre publique d’abonnement de la saison.',
    context:'Référence officielle pour tarifs et modalités annoncés.',
    observes:'Prix, catégories, conditions et campagne d’abonnement.',
    feeds:'Finance publique, communication, modèle saison.',
    impact:'Alimente les hypothèses publiques de revenus ou d’offre.',
    limits:'Ne prouve ni ventes réelles, ni encaissements, ni budget certifié.'
  }},
  {id:'CSSA_ASSOCIATION_MIRROR',title:'Miroir public association',url:'https://www.localgymsandfitness.com/FR/Sedan/100338915052339/CSSA---Association',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'MEDIUM',semantics:{
    purpose:'Corroborer des informations publiques de l’association.',
    context:'Source secondaire utilisée comme miroir, jamais comme vérité principale.',
    observes:'Présence, informations publiques reprises et changements visibles.',
    feeds:'Corroboration de veille.',
    impact:'Peut signaler une divergence à revoir.',
    limits:'Source secondaire : ne remplace jamais une source officielle.'
  }},
  {id:'LEBALLONROND_CSSA',title:'LeBallonRond · CSSA',url:'https://www.leballonrond.fr/equipe/cs-sedan/129',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantics:{
    purpose:'Corroborer l’état sportif public de l’équipe.',
    context:'Source sportive secondaire utile pour recouper calendrier, niveau et résultats.',
    observes:'Équipe, compétition, rencontres et résultats publiés.',
    feeds:'Matchday, modèle saison, vérification sportive.',
    impact:'Une divergence avec une autre source déclenche une revue.',
    limits:'Ne remplace ni le club ni l’autorité de compétition.'
  }},
  {id:'LEPROGRES_R1',title:'Le Progrès · Régional 1',url:'https://www.leprogres.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantics:{
    purpose:'Suivre un calendrier/résultats R1 comme source de corroboration.',
    context:'Source secondaire de compétition utilisée pour détecter dates et résultats publics.',
    observes:'Matchs, adversaires, dates, domicile/extérieur, résultats.',
    feeds:'Matchday, calendrier, contrôle de cohérence.',
    impact:'Peut révéler un changement de calendrier ou une divergence de niveau.',
    limits:'Ne constitue pas une autorité officielle de compétition.'
  }},
  {id:'DNA_R2',title:'DNA · Régional 2',url:'https://www.dna.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-regional-2-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantics:{
    purpose:'Corroborer les informations publiques R2.',
    context:'Source secondaire explicitement surveillée car une divergence R2/R3 a déjà été identifiée.',
    observes:'Compétition, calendrier et résultats.',
    feeds:'Contradictions sportives, revue de saison.',
    impact:'Peut créer une contradiction à résoudre avant promotion en vérité.',
    limits:'Une page secondaire ne tranche pas seule le niveau sportif réel.'
  }},
  {id:'ESTREP_U16',title:'Est Républicain · U16 R1',url:'https://www.estrepublicain.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-u16-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'BIWEEKLY',criticality:'LOW',semantics:{
    purpose:'Suivre le calendrier public U16.',
    context:'Source secondaire pour la composante formation.',
    observes:'Matchs, dates, adversaires et résultats U16.',
    feeds:'Académie, calendrier, matchday formation.',
    impact:'Aide à maintenir un contexte sportif public cohérent.',
    limits:'Ne prouve pas les opérations internes de l’académie.'
  }},
  {id:'LEPROGRES_U15',title:'Le Progrès · U15 R1',url:'https://www.leprogres.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-u15-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'BIWEEKLY',criticality:'LOW',semantics:{
    purpose:'Suivre le calendrier public U15.',
    context:'Source secondaire pour la composante formation.',
    observes:'Matchs, dates, adversaires et résultats U15.',
    feeds:'Académie, calendrier, matchday formation.',
    impact:'Aide à maintenir le contexte sportif public à jour.',
    limits:'Ne constitue pas une preuve de fonctionnement interne.'
  }},
]

const capabilitySemantics:Record<string,SemanticFrame>={
  crm:{purpose:'Conserver les dossiers et relations métier structurés.',context:'Le CRM sert de mémoire opérationnelle native, pas d’autorité.',observes:'CASE, interactions, follow-ups et relations.',feeds:'TASKS, reporting, revues et décisions futures.',impact:'Structure le suivi d’un dossier dans le temps.',limits:'Créer ou lire un dossier CRM n’autorise aucune action externe.'},
  tasks:{purpose:'Transformer un besoin validé en travail suivi.',context:'TASKS représente le travail canonique à faire, avec état et échéance.',observes:'Tâches, statut, priorité, responsable, dépendances et due date.',feeds:'Suivi opérationnel, CRM, reporting.',impact:'Rend visible ce qui doit être fait et ce qui bloque.',limits:'Une TASK n’est ni une décision KX108 ni une exécution externe.'},
  admin:{purpose:'Structurer contrats, conformité et procédures.',context:'Couche métier administrative fondée sur sources et règles identifiées.',observes:'Obligations, dossiers, canaux, échéances et conformité.',feeds:'CASE, TASKS, reporting, gouvernance.',impact:'Permet de détecter manques, risques et actions à préparer.',limits:'Les règles publiques ne prouvent pas les pratiques internes réelles.'},
  mail:{purpose:'Préparer des communications gouvernées.',context:'Le preflight valide la forme et les préconditions avant toute possibilité d’envoi.',observes:'Destinataire prévu, contenu préparé, approbation et contraintes.',feeds:'World action / exécution seulement si toute la chaîne l’autorise.',impact:'Peut préparer une communication mais pas l’envoyer seul.',limits:'MAIL HOLD signifie qu’aucun envoi réel ne doit être supposé.'},
  reporting:{purpose:'Rendre l’état compréhensible selon le destinataire.',context:'Projection structurée des faits et preuves disponibles.',observes:'Indicateurs, changements, risques, tâches et preuves.',feeds:'Pilotage humain et revue.',impact:'Aide à décider quoi regarder ensuite.',limits:'Un rapport ne crée pas de vérité nouvelle.'},
  watch:{purpose:'Observer les sources publiques et détecter leurs changements.',context:'Veille GET-only avec empreintes et revue explicite.',observes:'Disponibilité, contenu visible et dérive de pages publiques.',feeds:'Source runtime, revue sémantique, administration, matchday, finance.',impact:'Un changement peut déclencher une revue mais jamais une conclusion automatique.',limits:'PAGE CHANGED ≠ SEMANTIC FACT CHANGED.'},
  matchday:{purpose:'Structurer les opérations liées aux jours de match.',context:'Couche métier pour readiness, stocks, shifts et fournisseurs.',observes:'Besoins opérationnels et préparation.',feeds:'TASKS, fournisseurs, reporting.',impact:'Aide à préparer et détecter les points bloquants.',limits:'Les données publiques ne prouvent pas l’état terrain réel.'},
  finance:{purpose:'Projeter les éléments financiers disponibles.',context:'V0 fondée sur tarifs et informations publiques, pas sur comptabilité interne.',observes:'Tarifs, hypothèses saison et données publiques liées aux coûts/revenus.',feeds:'Reporting et scénarios.',impact:'Permet des estimations et comparaisons.',limits:'Ne prouve pas le budget certifié, la trésorerie ou les encaissements réels.'},
  governance:{purpose:'Préserver la frontière d’autorité.',context:'Le domaine décrit et propose ; KX108 tranche.',observes:'Unknowns, contradictions, risques, preuves et décisions.',feeds:'Gates d’exécution et receipts.',impact:'Empêche qu’une interface ou un domaine s’auto-autorise.',limits:'Afficher KX108_ONLY ne signifie pas qu’une action a été autorisée.'},
  field:{purpose:'Identifier ce qui manque pour connaître la réalité interne.',context:'Zone volontairement OPEN tant que le terrain n’a pas été audité.',observes:'Droits, handoffs, checklists, pratiques, accès et validations.',feeds:'Futures corrections du modèle métier.',impact:'Empêche de confondre modèle public et fonctionnement réel.',limits:'Aucun fait interne ne doit être inventé pour fermer cette zone.'},
}

function nativeSemantic(entity:NativeEntity):SemanticFrame{
  const kind=String(entity.kind||'object').toLowerCase()
  if(kind==='source')return {purpose:'Conserver une observation sourcée et vérifiable.',context:'Objet issu du source runtime ; il décrit ce qui a été observé, pas ce qui est vrai métier.',observes:'Source, date d’observation, provenance et empreintes disponibles.',feeds:'Interprétation métier et revue.',impact:'Peut déclencher une analyse ou une contradiction.',limits:'SOURCE ≠ TRUST et observation ≠ conclusion.'}
  if(kind==='case')return {purpose:'Regrouper un dossier métier à suivre.',context:'Objet CRM canonique créé à partir d’un intake gouverné.',observes:'État, propriétaire connu, priorité et liens de suivi.',feeds:'TASKS, interactions et follow-ups.',impact:'Structure le traitement d’un sujet.',limits:'Un CASE ne décide et n’exécute rien.'}
  if(kind==='task')return capabilitySemantics.tasks
  if(kind==='followup')return {purpose:'Relier un dossier CRM à une prochaine action suivie.',context:'Objet de continuité entre CASE et TASK.',observes:'Référence de dossier, task_ref et échéance.',feeds:'CRM et suivi opérationnel.',impact:'Évite qu’un dossier perde sa prochaine étape.',limits:'Le follow-up ne vaut ni validation ni exécution.'}
  if(kind==='decision')return {purpose:'Conserver une décision de gouvernance observée.',context:'Record KX108 associé à une proposition ou mutation.',observes:'Gate, raison, domaine et références de décision.',feeds:'Execution gate et preuve.',impact:'Peut autoriser, bloquer ou mettre en HOLD une étape.',limits:'DECISION ≠ ACTION.'}
  if(kind==='receipt')return {purpose:'Prouver qu’une mutation ou exécution déterminée a eu lieu.',context:'Trace append-only vérifiable selon son type.',observes:'Identifiants, hashes, état avant/après ou outcome.',feeds:'Replay, audit et preuve.',impact:'Permet de vérifier ce qui a réellement été appliqué.',limits:'RECEIPT ≠ DECISION.'}
  return {purpose:'Rendre cet objet compréhensible dans son contexte métier.',context:'Objet observé via le read model natif.',observes:'Métadonnées persistées exposées par le read model.',feeds:'Inspection et audit.',impact:'Donne du contexte sans ajouter d’autorité.',limits:'L’interface ne complète pas les champs absents et n’invente pas de vérité.'}
}

type WorldState={
  schema?:string;readonly?:boolean;entities?:NativeEntity[];relations?:unknown[];
  observedAt?:string;decisionAuthority?:string
}

const universalContract={
  version:'PORTABLE_DOMAIN_REGISTRATION_V0',
  authority:'KX108_ONLY',
  rules:[
    'DOMAIN ≠ AUTHORITY',
    'PROPOSAL ≠ DECISION',
    'DECISION ≠ ACTION',
    'SOURCE ≠ TRUST',
    'Un domaine ne peut ni décider ni agir',
    'Unknowns, contradictions, risques et preuves traversent le contrat',
  ],
  fields:['domain_id','adapter_id','capabilities','unknowns','contradictions','risk_flags','evidence_refs','provenance_refs'],
}

const organizations:Organization[]=[
  {
    id:'cssa',
    name:'CSSA',
    subtitle:'Club Sportif Sedan Ardennes',
    kind:'Club sportif',
    domainId:'cssa',
    adapterId:'cssa_public_admin/native_ops',
    contractVersion:'PORTABLE_DOMAIN_REGISTRATION_V0',
    source:'cssa-v01 · feat/cssa-native-ops-bridge-v0',
    capabilities:[
      {id:'crm',label:'CRM',status:'PROVEN',summary:'Cas CSSA → CRM CASE',details:['intake interaction créé','follow-up lié à task_ref','source de vérité CRM = Obsidia upstream']},
      {id:'tasks',label:'TASKS',status:'PROVEN',summary:'Cas CSSA → tâche native',details:['4 mutations natives exactes','HOLD/BLOCK → 0 mutation','pré-état revérifié avant commit']},
      {id:'admin',label:'ADMINISTRATION',status:'PROVEN',summary:'Contrats, conformité, procédures',details:['cycle contrat prouvé','compliance générique prouvée','canaux officiels gouvernés']},
      {id:'mail',label:'MAIL',status:'HOLD',summary:'Preflight gouverné prouvé',details:['plan d’envoi exact','approbation humaine liée','envoi réel bloqué par upstream world actuation']},
      {id:'reporting',label:'REPORTING',status:'PROVEN',summary:'Rapports routés par persona',details:['cadences weekly / biweekly / monthly','aucune livraison externe','privacy policy appliquée']},
      {id:'watch',label:'PUBLIC WATCH',status:'PROVEN',summary:'14 sources publiques readonly',details:['GET only','hash brut + texte visible','changement ≠ vérité sémantique']},
      {id:'matchday',label:'MATCHDAY',status:'PROVEN',summary:'Buvette, shifts, fournisseurs',details:['stock','supplier workflow','cash reconciliation','readiness']},
      {id:'finance',label:'FINANCE',status:'PROVEN',summary:'Modèle saison + tarifs publics',details:['licences CSSA publiques','tarifs LGEF','budget réel 26/27 reste inconnu']},
      {id:'governance',label:'GOVERNANCE',status:'PROVEN',summary:'KX108_ONLY',details:['external_action=false','memory_write=false','emits_act=false','kernel_mutation=false']},
      {id:'field',label:'FIELD REALITY',status:'OPEN',summary:'Validation terrain interne manquante',details:['boîtes mail réelles','droits réels','handoffs','checklists','pratiques non écrites']},
    ],
    unknowns:['REAL_INTERNAL_FIELD_EVIDENCE','REAL_ACCESS_RIGHTS','REAL_VALIDATION_CHAINS','2026_27_CERTIFIED_BUDGET'],
    contradictions:['Organigramme Manager Général potentiellement périmé','Réserve R3 sur une source vs R2 saison actuelle','12+ matchs domicile vs 13 championnat'],
    risks:['SOURCE_FRESHNESS','EXTERNAL_WORLD_ACTUATION_NOT_ACTIVATED'],
    evidence:['181 tests PASS · F3H-D','14 sources publiques surveillées','19 structures sportives publiques','800 abonnés snapshot officiel','50+ partenaires publics'],
  },
  {
    id:'trading',
    name:'Trading',
    subtitle:'Domaine Trading gouverné Obsidia',
    kind:'Domaine métier',
    domainId:'trading',
    adapterId:'canonical_trading_adapter',
    contractVersion:'PORTABLE_DOMAIN_REGISTRATION_V0',
    source:'OBSIDIA_TRADING · master',
    capabilities:[
      {id:'market',label:'MARKET DATA',status:'PROVEN',summary:'État marché canonique',details:['adapters marché','état canonique','provenance conservée']},
      {id:'agents',label:'AGENTS',status:'PROVEN',summary:'17 agents natifs',details:['native reference implementation','adapter stack externe','convergence canonique avant autorité']},
      {id:'risk',label:'RISK',status:'PROVEN',summary:'Risque + calibration',details:['simulation','portfolio risk','signal structurel non souverain']},
      {id:'paper',label:'PAPER EXECUTION',status:'PAPER',summary:'Exécution broker PAPER uniquement',details:['LIVE trading interdit structurellement','Binder vérifie le verdict','receipt après exécution']},
      {id:'proof',label:'PROOF / REPLAY',status:'PROVEN',summary:'Receipts chaînés + replay',details:['receipt ≠ decision','replay ≠ execution','preuve vérifiable']},
      {id:'kx',label:'KX108',status:'OPEN',summary:'Vrai kernel non branché dans ce repo',details:['FixtureKX108Client = test only','UnavailableKX108Client fail-closed','jamais ACT par défaut']},
    ],
    unknowns:['REAL_KX108_CONNECTION','MARKOV_REAL_CALIBRATION'],
    contradictions:[],
    risks:['PROOF_BEST_EFFORT','LIVE_TRADING_FORBIDDEN'],
    evidence:['283 passed','1 skipped','PAPER ONLY','Canonical convergence point'],
  },
  {
    id:'gps',
    name:'GPS / Défense',
    subtitle:'GNSS · RF · aviation · preuve physique',
    kind:'Domaine physique',
    domainId:'gps_defense_aviation',
    adapterId:'gps_evidence_adapter',
    contractVersion:'PORTABLE_DOMAIN_REGISTRATION_V0',
    source:'obsidia-gps-defense- · main',
    capabilities:[
      {id:'gnss',label:'GNSS',status:'RECORDED_REAL',summary:'Chemin RINEX/GNSS réel documenté',details:['recorded real GNSS','observation envelope','Physical Reality Gate']},
      {id:'rf',label:'RF I/Q',status:'RECORDED_REAL',summary:'Chemin RF nominal réel documenté',details:['public nominal I/Q','provenance conservée','raw datasets exclus du repo public']},
      {id:'hostile',label:'HOSTILE RF',status:'PARTIAL',summary:'FGI hostile corpus partiel NAV/PVT',details:['FGI-GSRx / Octave','chaîne temporelle partielle','pas de claim attaque RF enregistrée']},
      {id:'classification',label:'CLASSIFICATION',status:'OPEN',summary:'Classification RF formelle à fermer',details:['attribution causale ouverte','matrice TP/TN/FP/FN à consolider','baseline à renforcer']},
      {id:'sensors',label:'SENSORS',status:'OPEN',summary:'IMU / radar non encore raccordés',details:['source IMU/radar manquante','fusion multi-capteurs ouverte']},
      {id:'governance',label:'GOVERNANCE',status:'PROVEN',summary:'Périphérie non souveraine',details:['domaine traduit','kernel privé non exporté','receipts / claim matrix']},
    ],
    unknowns:['REAL_IMU_RADAR_SOURCE','FORMAL_RF_CLASSIFICATION','CAUSAL_ATTRIBUTION'],
    contradictions:[],
    risks:['PRODUCTION_ANTI_SPOOFING_NOT_CLAIMED','AVIATION_CERTIFICATION_NOT_CLAIMED'],
    evidence:['RECORDED_REAL_GNSS','RECORDED_REAL_RF','FGI hostile chain PARTIAL'],
  },
  {
    id:'association',
    name:'Association',
    subtitle:'Template universel pour une nouvelle structure',
    kind:'Structure générique',
    domainId:'association_candidate',
    adapterId:'unregistered',
    contractVersion:'PORTABLE_DOMAIN_REGISTRATION_V0',
    source:'Non raccordé',
    capabilities:[
      {id:'identity',label:'IDENTITY',status:'OPEN',summary:'Identité et périmètre à renseigner',details:['nom','type','rôles','sources']},
      {id:'admin',label:'ADMINISTRATION',status:'OPEN',summary:'À raccorder',details:['documents','obligations','cas']},
      {id:'crm',label:'CRM',status:'OPEN',summary:'À raccorder',details:['membres','partenaires','contacts']},
      {id:'tasks',label:'TASKS',status:'OPEN',summary:'À raccorder',details:['missions','responsables','échéances']},
      {id:'proof',label:'PROOF',status:'OPEN',summary:'À raccorder',details:['evidence_refs','provenance_refs','receipts']},
      {id:'governance',label:'GOVERNANCE',status:'OPEN',summary:'À enregistrer dans le contrat universel',details:['adapter','capabilities','KX108_ONLY']},
    ],
    unknowns:['ALL_FIELD_DATA'],
    contradictions:[],
    risks:['UNREGISTERED_PORTABLE_DOMAIN'],
    evidence:[],
  },
]

const statusLabel:Record<Status,string>={
  LIVE:'LIVE',
  PROVEN:'PROVEN',
  OPEN:'OPEN',
  HOLD:'HOLD',
  PAPER:'PAPER',
  RECORDED_REAL:'REAL',
  PARTIAL:'PARTIAL',
}

const newId=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():String(Date.now())

export default function CSSAPage(){
  const [selected,setSelected]=useState('cssa')
  const [selectedCapability,setSelectedCapability]=useState<string|null>(null)
  const [showUniversal,setShowUniversal]=useState(false)
  const [projects,setProjects]=useState<Record<string,Project[]>>({})
  const [showProjectForm,setShowProjectForm]=useState(false)
  const [projectName,setProjectName]=useState('')
  const [worldState,setWorldState]=useState<WorldState|null>(null)
  const [nativeModel,setNativeModel]=useState<NativeReadModel|null>(null)
  const [runtimeError,setRuntimeError]=useState('')
  const [selectedNative,setSelectedNative]=useState('')
  const [refreshing,setRefreshing]=useState(false)

  const current=useMemo(()=>organizations.find(o=>o.id===selected)??organizations[0],[selected])

  const refreshRuntime=async()=>{
    setRefreshing(true)
    setRuntimeError('')
    try{
      const [stateResult,nativeResult]=await Promise.allSettled([
        fetch('/obsidia-local/state',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('STATE_UNAVAILABLE');return r.json()}),
        fetch('/obsidia-local/native-enterprise',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('NATIVE_READ_MODEL_UNAVAILABLE');return r.json()}),
      ])
      if(stateResult.status==='fulfilled')setWorldState(stateResult.value)
      else setRuntimeError(prev=>prev||'Runtime local indisponible')
      if(nativeResult.status==='fulfilled')setNativeModel(nativeResult.value)
      else setNativeModel({schema:'MONDE_OBSIDIA_NATIVE_READ_MODEL_V0',available:false,readonly:true,reason:'LOCAL_BRIDGE_ROUTE_NOT_AVAILABLE',entities:[],relations:[],availability:{}})
    }finally{
      setRefreshing(false)
    }
  }

  useEffect(()=>{
    refreshRuntime()
    const timer=window.setInterval(refreshRuntime,5000)
    return()=>window.clearInterval(timer)
  },[])
  const activeCapability=current.capabilities.find(c=>c.id===selectedCapability)??null
  const worldEntities=worldState?.entities??[]
  const nativeEntities=nativeModel?.entities??[]
  const serviceIds=current.id==='trading'?['trading-x108','kernel-x108','obsidia-api']:
    current.id==='gps'?['gps-defense','kernel-x108','obsidia-api']:
    ['kernel-x108','obsidia-api']
  const liveServices=worldEntities.filter(e=>e.kind==='session'&&e.nativeService&&serviceIds.includes(String(e.agentId||'')))
  const liveDecisions=worldEntities.filter(e=>e.kind==='decision_record'&&(!e.domainId||String(e.domainId)===current.domainId))
  const selectedNativeEntity=nativeEntities.find(e=>e.id===selectedNative)??null
  const nativeKinds=useMemo(()=>nativeEntities.reduce<Record<string,number>>((acc,e)=>{acc[e.kind]=(acc[e.kind]||0)+1;return acc},{}),[nativeEntities])
  const currentProjects=projects[current.id]??[]

  const chooseOrganization=(id:string)=>{
    setSelected(id)
    setSelectedCapability(null)
    setShowProjectForm(false)
    setSelectedNative('')
  }

  const addProject=()=>{
    const title=projectName.trim()
    if(!title)return
    setProjects(prev=>({...prev,[current.id]:[...(prev[current.id]??[]),{id:newId(),title,status:'LOCAL'}]}))
    setProjectName('')
    setShowProjectForm(false)
  }

  const provenCount=current.capabilities.filter(c=>['PROVEN','RECORDED_REAL','PAPER','PARTIAL'].includes(c.status)).length
  const openCount=current.capabilities.filter(c=>['OPEN','HOLD'].includes(c.status)).length

  return <main className="cssa-page">
    <section className="cssa-universal-bar">
      <div>
        <span className="cssa-kicker">OBSIDIA · UNIVERSALITÉ</span>
        <strong>{universalContract.version}</strong>
        <small>{universalContract.authority}</small>
      </div>
      <button className={showUniversal?'active':''} onClick={()=>setShowUniversal(v=>!v)}>
        {showUniversal?'Masquer le contrat':'Voir le contrat universel'}
      </button>
    </section>

    {showUniversal&&<section className="cssa-universal-contract">
      <header>
        <div><span className="cssa-kicker">CONTRAT COMMUN</span><h2>Une structure décrit ses capacités, jamais son autorité</h2></div>
        <span className="cssa-contract-badge">NON-SOUVERAIN</span>
      </header>
      <div className="cssa-contract-layout">
        <div className="cssa-contract-fields">
          {universalContract.fields.map(field=><span key={field}>{field}</span>)}
        </div>
        <div className="cssa-contract-rules">
          {universalContract.rules.map(rule=><p key={rule}>{rule}</p>)}
        </div>
      </div>
    </section>}

    <section className="cssa-selector">
      <header>
        <div><span className="cssa-kicker">STRUCTURES RACCORDÉES / CANDIDATES</span><h1>Choisir une structure</h1></div>
      </header>
      <div className="cssa-structure-tabs">
        {organizations.map(org=><button key={org.id} className={selected===org.id?'active':''} onClick={()=>chooseOrganization(org.id)}>
          <strong>{org.name}</strong>
          <small>{org.kind}</small>
          <em>{org.capabilities.length} capacités</em>
        </button>)}
      </div>
    </section>

    <header className="cssa-hero">
      <div>
        <span className="cssa-kicker">{current.domainId.toUpperCase()}</span>
        <h1>{current.name}</h1>
        <p>{current.subtitle}</p>
        <div className="cssa-contract-strip">
          <span>domain_id <b>{current.domainId}</b></span>
          <span>adapter <b>{current.adapterId}</b></span>
          <span>contract <b>{current.contractVersion}</b></span>
        </div>
      </div>
      <aside className="cssa-identity">
        <small>RACCORDEMENT</small>
        <strong>{provenCount}/{current.capabilities.length}</strong>
        <span>capacités établies / partielles</span>
        <em>{openCount} ouvertes ou HOLD</em>
      </aside>
    </header>

    <section className="cssa-section cssa-runtime-real">
      <header>
        <div>
          <span className="cssa-kicker">RÉEL CONNECTÉ</span>
          <h2>Runtime local + stores natifs</h2>
        </div>
        <button className="cssa-refresh" onClick={refreshRuntime} disabled={refreshing}>{refreshing?'Lecture…':'Rafraîchir'}</button>
      </header>

      <div className="cssa-runtime-statusline">
        <span className={worldState?'ok':'off'}>WORLD STATE · {worldState?'CONNECTED':'UNAVAILABLE'}</span>
        <span className={nativeModel?.available?'ok':'off'}>NATIVE STORE · {nativeModel?.available?'CONNECTED':'UNAVAILABLE'}</span>
        <span>KX108_ONLY</span>
        <span>READONLY</span>
      </div>

      {runtimeError&&<p className="cssa-runtime-error">{runtimeError}</p>}

      <div className="cssa-real-layout">
        <article className="cssa-real-block">
          <header><div><span className="cssa-kicker">SERVICES OBSERVÉS</span><h3>Runtime réel</h3></div><strong>{liveServices.length}</strong></header>
          <div className="cssa-service-list">
            {liveServices.length?liveServices.map(service=><div key={service.id} className="cssa-service-row">
              <span className={'cssa-runtime-dot '+(service.observedState==='READY'?'ready':'waiting')}></span>
              <div><strong>{service.label}</strong><small>{String(service.observedState||service.phase||'OBSERVED')} · {String(service.decisionAuthority||'KX108_ONLY')}</small></div>
            </div>):<p>Aucun service natif observé pour cette structure.</p>}
          </div>
          <div className="cssa-live-decisions">
            <small>DÉCISIONS OBSERVÉES</small>
            <strong>{liveDecisions.length}</strong>
            <span>records locaux correspondant au domaine quand identifiable</span>
          </div>
        </article>

        <article className="cssa-real-block">
          <header><div><span className="cssa-kicker">STORE NATIF</span><h3>Objets persistés</h3></div><strong>{nativeEntities.length}</strong></header>
          {nativeModel?.available?<div className="cssa-native-kind-grid">
            {Object.entries(nativeKinds).map(([kind,count])=><span key={kind}><b>{count}</b>{kind}</span>)}
          </div>:<div className="cssa-native-unavailable">
            <strong>{nativeModel?.reason||'NATIVE_READ_MODEL_UNAVAILABLE'}</strong>
            <p>Le cockpit n’invente aucun CASE/TASK/receipt. Le bridge GET-only doit être présent et les roots locaux configurés.</p>
          </div>}
          {nativeModel?.projection_hash&&<small className="cssa-projection-hash">projection {nativeModel.projection_hash.slice(0,20)}…</small>}
        </article>
      </div>

      {nativeModel?.available&&nativeEntities.length>0&&<div className="cssa-native-browser">
        <div className="cssa-native-objects">
          <header><strong>Objets canoniques</strong><small>replay/hash vérifiés selon le type</small></header>
          {nativeEntities.slice(0,80).map(entity=><button key={entity.id} className={selectedNative===entity.id?'active':''} onClick={()=>setSelectedNative(entity.id)}>
            <span><strong>{entity.label}</strong><small>{entity.kind} · {String(entity.verification||entity.status||entity.gate||'OBSERVED')}</small></span>
            <b>›</b>
          </button>)}
        </div>
        <aside className="cssa-native-inspector">
          {selectedNativeEntity?<><span className="cssa-kicker">OBJET RÉEL</span><h3>{selectedNativeEntity.label}</h3>
            {(()=>{
              const semantic=nativeSemantic(selectedNativeEntity)
              return <div className="cssa-native-semantic">
                <div><small>BUT</small><p>{semantic.purpose}</p></div>
                <div><small>CONTEXTE</small><p>{semantic.context}</p></div>
                <div><small>ALIMENTE</small><p>{semantic.feeds}</p></div>
                <div><small>IMPACT</small><p>{semantic.impact}</p></div>
                <div><small>LIMITE</small><p>{semantic.limits}</p></div>
              </div>
            })()}
            <div className="cssa-native-fields">
              {Object.entries(selectedNativeEntity).filter(([key])=>!['label'].includes(key)).map(([key,value])=><div key={key}><small>{key}</small><strong>{String(value??'—')}</strong></div>)}
            </div>
          </>:<><span className="cssa-kicker">INSPECTEUR</span><h3>Sélectionne un objet</h3><p>La page montre uniquement les métadonnées persistées fournies par le read model natif.</p></>}
        </aside>
      </div>}
    </section>


    {current.id==='cssa'&&<section className="cssa-section cssa-source-catalog">
      <header>
        <div>
          <span className="cssa-kicker">CATALOGUE SÉMANTIQUE · 14 SOURCES</span>
          <h2>Pourquoi chaque source existe</h2>
          <p>Ce catalogue décrit le rôle attendu des sources. Il ne prétend pas qu’une observation runtime a déjà été persistée.</p>
        </div>
        <span className="cssa-contract-badge">CONTEXTE ≠ OBSERVATION</span>
      </header>
      <div className="cssa-source-grid">
        {cssaSourceCatalog.map(source=>{
          const observed=nativeEntities.find(e=>e.kind==='source'&&(e.id===source.id||String(e.label||'').includes(source.id)))
          return <article key={source.id} className="cssa-source-card">
            <div className="cssa-source-head">
              <div><small>{source.id}</small><h3>{source.title}</h3></div>
              <span className={observed?'observed':'catalog'}>{observed?'OBSERVED':'CATALOGUE'}</span>
            </div>
            <div className="cssa-source-meta">
              <span>{source.truthClass}</span><span>{source.cadence}</span><span>{source.criticality}</span>
            </div>
            <div className="cssa-semantic-stack">
              <div><small>BUT</small><p>{source.semantics.purpose}</p></div>
              <div><small>CONTEXTE</small><p>{source.semantics.context}</p></div>
              <div><small>CE QU’ON SURVEILLE</small><p>{source.semantics.observes}</p></div>
              <div><small>ALIMENTE</small><p>{source.semantics.feeds}</p></div>
              <div><small>IMPACT POSSIBLE</small><p>{source.semantics.impact}</p></div>
              <div><small>LIMITE</small><p>{source.semantics.limits}</p></div>
            </div>
            <footer>
              <span>{source.url}</span>
              {observed&&<b>{String(observed.verification||observed.status||'OBSERVED')}</b>}
            </footer>
          </article>
        })}
      </div>
    </section>}

    <section className="cssa-section cssa-cockpit-universal">
      <header>
        <div><span className="cssa-kicker">COCKPIT DÉRIVÉ</span><h2>État de la structure</h2></div>
        <span className="cssa-source-label">{current.source}</span>
      </header>
      <div className="cssa-cockpit-row">
        <article><small>Capacités</small><strong>{current.capabilities.length}</strong><span>{provenCount} établies</span></article>
        <article><small>Unknowns</small><strong>{current.unknowns.length}</strong><span>conservés</span></article>
        <article><small>Contradictions</small><strong>{current.contradictions.length}</strong><span>non masquées</span></article>
        <article><small>Risques</small><strong>{current.risks.length}</strong><span>visibles</span></article>
        <article><small>Preuves</small><strong>{current.evidence.length}</strong><span>références projetées</span></article>
        <article><small>Autorité</small><strong>KX108</strong><span>seule autorité</span></article>
      </div>
    </section>

    <section className="cssa-section">
      <header>
        <div><span className="cssa-kicker">CAPACITÉS DÉCLARÉES</span><h2>Ce que cette structure sait réellement exposer</h2></div>
        <small className="cssa-section-note">Clique une capacité</small>
      </header>
      <div className="cssa-capability-grid">
        {current.capabilities.map(cap=><button key={cap.id} className={selectedCapability===cap.id?'cssa-capability active':'cssa-capability'} onClick={()=>setSelectedCapability(selectedCapability===cap.id?null:cap.id)}>
          <div className="cssa-capability-top">
            <span className={'cssa-status cssa-status-'+cap.status.toLowerCase().replace('_','-')}>{statusLabel[cap.status]}</span>
            <small>{cap.id}</small>
          </div>
          <h3>{cap.label}</h3>
          <p>{cap.summary}</p>
          <span className="cssa-open-label">{selectedCapability===cap.id?'Refermer ↑':'Ouvrir →'}</span>
        </button>)}
      </div>

      {activeCapability&&<div className="cssa-capability-workspace">
        <header>
          <div>
            <span className={'cssa-status cssa-status-'+activeCapability.status.toLowerCase().replace('_','-')}>{statusLabel[activeCapability.status]}</span>
            <h2>{activeCapability.label}</h2>
            <p>{activeCapability.summary}</p>
          </div>
          <button onClick={()=>setSelectedCapability(null)}>Fermer</button>
        </header>
        <div className="cssa-semantic-panel">
          {(()=>{
            const semantic=capabilitySemantics[activeCapability.id]??{
              purpose:'Exposer une capacité métier sans lui donner d’autorité.',
              context:activeCapability.summary,
              observes:'État et métadonnées disponibles pour cette capacité.',
              feeds:'Les vues et workflows qui dépendent de cette capacité.',
              impact:'Rend visible ce que la structure sait réellement faire ou observer.',
              limits:'Une capacité déclarée ne vaut ni décision ni action.'
            }
            return <div className="cssa-semantic-grid">
              <div><small>BUT</small><p>{semantic.purpose}</p></div>
              <div><small>CONTEXTE</small><p>{semantic.context}</p></div>
              <div><small>OBSERVE / CONTIENT</small><p>{semantic.observes||'—'}</p></div>
              <div><small>ALIMENTE</small><p>{semantic.feeds}</p></div>
              <div><small>IMPACT</small><p>{semantic.impact}</p></div>
              <div><small>LIMITE</small><p>{semantic.limits}</p></div>
            </div>
          })()}
        </div>
        <div className="cssa-capability-details">
          {activeCapability.details.map(item=><article key={item}><span>◆</span><p>{item}</p></article>)}
        </div>
        <footer>
          <span>Projection readonly du contrat de domaine</span>
          <b>Aucune autorité ajoutée par l’interface</b>
        </footer>
      </div>}
    </section>

    <section className="cssa-triple">
      <article className="cssa-panel">
        <header><span className="cssa-kicker">UNKNOWNS</span><strong>{current.unknowns.length}</strong></header>
        <div className="cssa-list">
          {current.unknowns.length?current.unknowns.map(x=><span key={x}>{x}</span>):<em>Aucun déclaré</em>}
        </div>
      </article>
      <article className="cssa-panel">
        <header><span className="cssa-kicker">CONTRADICTIONS</span><strong>{current.contradictions.length}</strong></header>
        <div className="cssa-list">
          {current.contradictions.length?current.contradictions.map(x=><span key={x}>{x}</span>):<em>Aucune déclarée</em>}
        </div>
      </article>
      <article className="cssa-panel">
        <header><span className="cssa-kicker">RISQUES</span><strong>{current.risks.length}</strong></header>
        <div className="cssa-list">
          {current.risks.length?current.risks.map(x=><span key={x}>{x}</span>):<em>Aucun déclaré</em>}
        </div>
      </article>
    </section>

    <section className="cssa-section cssa-proof-section">
      <header><div><span className="cssa-kicker">PREUVES / ÉTAT OBSERVABLE</span><h2>Ce qui soutient cette projection</h2></div></header>
      <div className="cssa-proof-grid">
        {current.evidence.length?current.evidence.map(item=><article key={item}><span>✓</span><strong>{item}</strong></article>):<article className="empty"><span>—</span><strong>Aucune preuve raccordée</strong></article>}
      </div>
    </section>

    <section className="cssa-section cssa-governance-live">
      <header><div><span className="cssa-kicker">GOUVERNANCE TRANSVERSALE</span><h2>Le domaine propose, KX108 tranche</h2></div><span className="cssa-contract-badge">KX108_ONLY</span></header>
      <div className="cssa-decision-flow">
        <span>Domain state</span><b>→</b><span>Governance payload</span><b>→</b><span>KX108</span><b>→</b><span>Decision</span><b>→</b><span>Execution gate</span><b>→</b><span>Receipt</span>
      </div>
    </section>

    <section className="cssa-projects">
      <header>
        <div><span className="cssa-kicker">PROJETS LOCAUX</span><h2>{current.name} · chantiers</h2></div>
        <button className="cssa-add-project" onClick={()=>setShowProjectForm(v=>!v)}>+ Projet</button>
      </header>
      {showProjectForm&&<div className="cssa-inline-form">
        <input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Nom du projet"/>
        <button onClick={addProject}>Ajouter</button>
        <button className="quiet" onClick={()=>setShowProjectForm(false)}>Annuler</button>
      </div>}
      <div className="cssa-project-grid">
        {currentProjects.map(p=><article key={p.id}><span>◆</span><strong>{p.title}</strong><small>{p.status}</small></article>)}
        {!currentProjects.length&&<article className="empty"><span>+</span><strong>Aucun projet local</strong><small>Ce bloc reste local à l’interface pour l’instant</small></article>}
      </div>
    </section>
  </main>
}
