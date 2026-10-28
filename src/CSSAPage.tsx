import {useEffect,useMemo,useState} from 'react'
import {cssaNavigationCount} from './cssaNavigationCounts'
import {parseCssaHash,formatCssaHash} from './cssaNavigationRoute'
import {cssaProfileStores,projectCssaProfile,type Observations,type StoreId} from './cssaLiveProfile'
import './CSSAPage.css'
import './CSSASport.css'
import CSSASportWorkspace from './CSSASportPage'
import CSSAHomePage from './CSSAHomePage'
import CSSAMailPage from './CSSAMailPage'
import CSSACommercePage from './CSSACommercePage'
import CSSAFinancePage from './CSSAFinancePage'
import CSSAMediaPage from './CSSAMediaPage'
import CSSACrmPage from './CSSACrmPage'
import CSSATasksPage from './CSSATasksPage'
import CSSAAdminPage from './CSSAAdminPage'
import CSSADocumentsPage from './CSSADocumentsPage'
import CSSAOrganisationVisualPage from './CSSAOrganisationVisualPage'
import CSSAMatchdayPage from './CSSAMatchdayPage'
import CSSADossiersPage from './CSSADossiersPage'

type Semantic={purpose:string;context:string;observes:string;feeds:string;impact:string;limits:string}
type SourceItem={id:string;title:string;url:string;truthClass:string;cadence:string;criticality:string;semantic:Semantic}
type NativeEntity={id:string;kind:string;label:string;status?:string|null;priority?:string|null;verification?:string;gate?:string|null;domainId?:string;agentId?:string;nativeService?:boolean;observedState?:string;phase?:string;decisionAuthority?:string;observed_at?:string;[key:string]:unknown}
type NativeReadModel={available?:boolean;reason?:string;entities?:NativeEntity[];relations?:{from:string;type:string;to:string}[];projection_hash?:string;availability?:Record<string,string>}
type WorldState={entities?:NativeEntity[];decisionAuthority?:string;observedAt?:string}
type ViewItem={id:string;title:string;subtitle:string;kind:string;status:string;semantic:Semantic;meta?:Record<string,string>;raw?:NativeEntity}
type Project={id:string;title:string;status:string}
type CapabilityInfo={id:string;label:string;status:string;summary:string;details:string[]}
type Profile={domainId:string;adapterId:string;contract:string;source:string;sourceUrl:string;capabilities:CapabilityInfo[];unknowns:string[];contradictions:string[];risks:string[];evidence:string[]}

type StructureId='cssa'|'trading'|'gps'
type ModuleDef={id:string;label:string;icon:string;kindFilter?:string[]}
type StructureDef={id:StructureId;name:string;subtitle:string;badge:string;modules:ModuleDef[]}

function UiIcon({name}:{name:string}){
 const p:Record<string,string>={
  dashboard:'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z',
  organisation:'M4 21v-8h6v8M14 21V9h6v12M7 9V5h10v4',
  sportif:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0 3 5-3 4-3-4 3-5Zm-9 9 6-1 3 4-2 6M21 12l-6-1-3 4 2 6',
  academy:'M4 10 12 5l8 5-8 5-8-5Zm3 3v4c3 2 7 2 10 0v-4',
  commercial:'M4 7h16v12H4zM8 7V5h8v2M8 12h8',
  source:'M5 5h14v14H5zM8 9h8M8 13h8',
  crm:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0',
  task:'M5 6h14v15H5zM8 3h8v4H8zM8 12l2 2 5-5',
  admin:'M4 21V8l8-5 8 5v13M9 21v-7h6v7',
  mail:'M3 6h18v12H3zM3 7l9 7 9-7',
  reporting:'M5 20V10M12 20V4M19 20v-7',
  matchday:'M12 3v18M3 12h18M5 5l14 14M19 5 5 19',
  finance:'M12 3v18M16 7h-6a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H8',
  media:'M4 5h16v14H4zM9 9l6 3-6 3z',
  governance:'M12 3l8 4v5c0 5-3.4 8-8 9-4.6-1-8-4-8-9V7l8-4Z',
  projects:'M4 7h6l2 2h8v10H4z',
  field:'M12 21s7-5 7-11a7 7 0 1 0-14 0c0 6 7 11 7 11Zm0-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  search:'M11 19a8 8 0 1 1 5.7-2.3L22 22',
  refresh:'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
  link:'M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-2 2M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l2-2',
  chevron:'m9 18 6-6-6-6'
 }
 return <svg className="u-svg" viewBox="0 0 24 24" aria-hidden="true"><path d={p[name]||p.chevron}/></svg>
}




const cssaSources:SourceItem[]=[
{id:'CSSA_HOME',title:'CSSA – Site officiel',url:'https://cs-sedan.fr/',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'MEDIUM',semantic:{purpose:'Point d’entrée public général du club.',context:'Source officielle utilisée pour suivre annonces et informations institutionnelles publiques.',observes:'Actualités, annonces et informations institutionnelles.',feeds:'Veille publique, reporting, revue administrative.',impact:'Peut déclencher une revue si un changement public important est détecté.',limits:'Ne prouve pas le fonctionnement interne réel du club.'}},
{id:'CSSA_ORGANIGRAMME_ASSOCIATION',title:'Organigramme association',url:'https://cs-sedan.fr/organigramme-association',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'HIGH',semantic:{purpose:'Suivre la structure dirigeante et administrative publiée.',context:'Référence publique pour les rôles affichés par le club.',observes:'Dirigeants, fonctions et changements d’organigramme.',feeds:'Administration, CRM organisation, revue des responsables.',impact:'Peut modifier les interlocuteurs ou responsabilités supposées.',limits:'Ne prouve ni droits réels, ni délégations informelles, ni accès outils.'}},
{id:'CSSA_MANAGER_RECRUITMENT',title:'Recrutement manager général',url:'https://cs-sedan.fr/recrutement-manager-general',truthClass:'PUBLIC_CONFIRMED',cadence:'WEEKLY',criticality:'HIGH',semantic:{purpose:'Suivre le statut public du rôle de manager général.',context:'Annonce officielle pouvant signaler une évolution de gouvernance opérationnelle.',observes:'Existence, contenu, évolution ou retrait de l’annonce.',feeds:'Administration et revue de l’organisation.',impact:'Peut remettre en cause un organigramme ou rôle supposé.',limits:'Une annonce ne prouve pas qu’un recrutement a été finalisé.'}},
{id:'CSSA_ACADEMY_ORG',title:'Organigramme académie',url:'https://cs-sedan.fr/organigramme-academie',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantic:{purpose:'Suivre l’organisation publique de l’académie.',context:'Source officielle pour les rôles publiés côté formation.',observes:'Responsables, fonctions et structure académique.',feeds:'Organisation, CRM, activités académie.',impact:'Aide à identifier les bons interlocuteurs publics.',limits:'Ne prouve pas les handoffs ou droits internes.'}},
{id:'CSSA_VOLUNTEER_RECRUITMENT',title:'Recrutement bénévoles',url:'https://cs-sedan.fr/recrutement-benevole',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantic:{purpose:'Suivre les besoins bénévoles publiquement exprimés.',context:'Signal public sur les besoins humains et opérationnels du club.',observes:'Missions recherchées et campagnes de recrutement.',feeds:'Matchday, opérations, organisation des ressources.',impact:'Peut révéler un besoin opérationnel.',limits:'Ne donne pas les effectifs réellement disponibles.'}},
{id:'CSSA_ACCREDITATIONS',title:'Accréditations',url:'https://cs-sedan.fr/accreditations',truthClass:'PUBLIC_CONFIRMED',cadence:'BIWEEKLY',criticality:'MEDIUM',semantic:{purpose:'Suivre les règles publiques d’accréditation.',context:'Référence officielle pour les procédures d’accès publiées.',observes:'Modalités, formulaires, délais et conditions.',feeds:'Administration, matchday, procédures.',impact:'Un changement peut modifier une procédure ou échéance.',limits:'Ne prouve pas les validations internes réelles.'}},
{id:'CSSA_LICENSE_2026_2027',title:'Licence 2026–2027',url:'https://cs-sedan.fr/renouvellement-licence-2026-2027',truthClass:'PUBLIC_CONFIRMED',cadence:'MONTHLY',criticality:'MEDIUM',semantic:{purpose:'Suivre les informations publiques de renouvellement de licence.',context:'Source saisonnière officielle pour procédures et montants publiés.',observes:'Tarifs, dates, modalités et pièces demandées.',feeds:'Administration, finance publique, reporting saison.',impact:'Peut affecter démarches et estimations de coûts.',limits:'Ne prouve pas le nombre réel de licenciés ni paiements internes.'}},
{id:'CSSA_SUBSCRIPTION_2026_2027',title:'Abonnements 2026–2027',url:'https://cs-sedan.fr/abonnement-26-27',truthClass:'PUBLIC_CONFIRMED',cadence:'MONTHLY',criticality:'MEDIUM',semantic:{purpose:'Suivre l’offre publique d’abonnement.',context:'Référence officielle pour tarifs et modalités annoncés.',observes:'Prix, catégories, conditions et campagne.',feeds:'Finance publique, communication, modèle saison.',impact:'Alimente les hypothèses publiques de revenus ou d’offre.',limits:'Ne prouve ni ventes réelles, ni encaissements, ni budget certifié.'}},
{id:'CSSA_ASSOCIATION_MIRROR',title:'Miroir public association',url:'https://www.localgymsandfitness.com/FR/Sedan/100338915052339/CSSA---Association',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'MEDIUM',semantic:{purpose:'Corroborer des informations publiques de l’association.',context:'Source secondaire utilisée comme miroir.',observes:'Informations publiques reprises et changements visibles.',feeds:'Corroboration de veille.',impact:'Peut signaler une divergence à revoir.',limits:'Ne remplace jamais une source officielle.'}},
{id:'LEBALLONROND_CSSA',title:'LeBallonRond · CSSA',url:'https://www.leballonrond.fr/equipe/cs-sedan/129',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantic:{purpose:'Corroborer l’état sportif public de l’équipe.',context:'Source sportive secondaire.',observes:'Compétition, rencontres et résultats publiés.',feeds:'Matchday, modèle saison, vérification sportive.',impact:'Une divergence déclenche une revue.',limits:'Ne remplace ni le club ni l’autorité de compétition.'}},
{id:'LEPROGRES_R1',title:'Le Progrès · Régional 1',url:'https://www.leprogres.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantic:{purpose:'Suivre un calendrier/résultats R1 en corroboration.',context:'Source secondaire de compétition.',observes:'Matchs, adversaires, dates et résultats.',feeds:'Matchday, calendrier, contrôle de cohérence.',impact:'Peut révéler un changement de calendrier ou divergence.',limits:'Ne constitue pas une autorité officielle de compétition.'}},
{id:'DNA_R2',title:'DNA · Régional 2',url:'https://www.dna.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-regional-2-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'WEEKLY',criticality:'HIGH',semantic:{purpose:'Corroborer les informations publiques R2.',context:'Source secondaire surveillée pour les contradictions sportives.',observes:'Compétition, calendrier et résultats.',feeds:'Contradictions sportives, revue de saison.',impact:'Peut créer une contradiction à résoudre.',limits:'Ne tranche pas seule le niveau sportif réel.'}},
{id:'ESTREP_U16',title:'Est Républicain · U16 R1',url:'https://www.estrepublicain.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-u16-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'BIWEEKLY',criticality:'LOW',semantic:{purpose:'Suivre le calendrier public U16.',context:'Source secondaire pour la formation.',observes:'Matchs, dates, adversaires et résultats U16.',feeds:'Académie, calendrier, matchday formation.',impact:'Maintient le contexte sportif public cohérent.',limits:'Ne prouve pas les opérations internes de l’académie.'}},
{id:'LEPROGRES_U15',title:'Le Progrès · U15 R1',url:'https://www.leprogres.fr/sport/calendrier-resultats/football/regional-ligue-grand-est-u15-regional-1-poule-a',truthClass:'SECONDARY_CORROBORATED',cadence:'BIWEEKLY',criticality:'LOW',semantic:{purpose:'Suivre le calendrier public U15.',context:'Source secondaire pour la formation.',observes:'Matchs, dates, adversaires et résultats U15.',feeds:'Académie, calendrier, matchday formation.',impact:'Maintient le contexte sportif public à jour.',limits:'Ne constitue pas une preuve de fonctionnement interne.'}},
]

const structures:StructureDef[]=[
{id:'cssa',name:'CSSA',subtitle:'Club Sportif Sedan Ardennes',badge:'KX108_ONLY',modules:[
{id:'dashboard',label:'Accueil',icon:'dashboard'},{id:'organisation',label:'Organisation',icon:'organisation'},{id:'sportif',label:'Sportif',icon:'sportif'},{id:'academy',label:'Académie',icon:'academy'},{id:'dossiers',label:'Dossiers',icon:'projects'},{id:'documents',label:'Documents',icon:'source'},{id:'commercial',label:'Commerce',icon:'commercial'},{id:'tests',label:'Tests / Simulation',icon:'governance'},{id:'sources',label:'Sources',icon:'source'},{id:'crm',label:'CRM',icon:'crm',kindFilter:['case','interaction','followup','relationship']},{id:'tasks',label:'Tâches',icon:'task',kindFilter:['task']},{id:'admin',label:'Administration',icon:'admin'},{id:'mail',label:'Mail',icon:'mail'},{id:'media',label:'Média',icon:'media'},{id:'reporting',label:'Reporting',icon:'reporting'},{id:'matchday',label:'Matchday',icon:'matchday'},{id:'finance',label:'Finance',icon:'finance'},{id:'governance',label:'Gouvernance',icon:'governance',kindFilter:['decision','receipt']},{id:'projects',label:'Projets',icon:'projects'},{id:'field',label:'Réalité terrain',icon:'field'}]},
{id:'trading',name:'Trading',subtitle:'Domaine trading gouverné',badge:'PAPER ONLY',modules:[
{id:'dashboard',label:'Dashboard',icon:'dashboard'},{id:'market',label:'Market data',icon:'◉'},{id:'signals',label:'Signaux',icon:'⌁'},{id:'strategies',label:'Stratégies',icon:'◇'},{id:'risk',label:'Risk',icon:'△'},{id:'paper',label:'Paper execution',icon:'↗'},{id:'reporting',label:'Reporting',icon:'reporting'},{id:'governance',label:'Gouvernance',icon:'governance'},{id:'proof',label:'Proof / receipts',icon:'▣'},{id:'projects',label:'Projets',icon:'projects'}]},
{id:'gps',name:'GPS / Défense',subtitle:'GNSS · RF · aviation',badge:'RECORDED REAL',modules:[
{id:'dashboard',label:'Dashboard',icon:'dashboard'},{id:'sensors',label:'Sources capteurs',icon:'⌁'},{id:'gnss',label:'GNSS',icon:'⌖'},{id:'rf',label:'RF',icon:'⌁'},{id:'incidents',label:'Incidents',icon:'!'},{id:'classification',label:'Classification',icon:'◈'},{id:'evidence',label:'Evidence',icon:'▣'},{id:'governance',label:'Gouvernance',icon:'governance'},{id:'receipts',label:'Receipts',icon:'▤'},{id:'projects',label:'Projets',icon:'projects'},{id:'field',label:'Réalité terrain',icon:'field'}]}]

const cssaNavSections: {title: string; moduleIds: string[]}[] = [
  {title: 'ACCUEIL', moduleIds: ['dashboard']},
  {title: 'SPORT', moduleIds: ['sportif', 'matchday']},
  {title: 'TRAVAIL', moduleIds: ['tasks', 'dossiers']},
  {title: 'ADMIN & DOCUMENTS', moduleIds: ['admin', 'documents']},
  {title: 'RELATIONS & COMMUNICATION', moduleIds: ['crm', 'mail', 'media']},
  {title: 'ÉCONOMIE', moduleIds: ['commercial', 'finance']},
  {title: 'CLUB', moduleIds: ['organisation']},
  {title: 'SOURCES', moduleIds: ['sources']}
]
const cssaAdvancedModuleIds=['tests','field','governance','projects','reporting']

const profiles:Record<StructureId,Profile>={
 cssa:{domainId:'cssa',adapterId:'cssa_public_admin/native_ops',contract:'PORTABLE_DOMAIN_REGISTRATION_V0',source:'cssa-v01 · feat/cssa-native-ops-bridge-v0',sourceUrl:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-',capabilities:[
  {id:'crm',label:'CRM',status:'PROVEN',summary:'Cas CSSA → CRM CASE',details:['intake interaction créé','follow-up lié à task_ref','source de vérité CRM = Obsidia upstream']},
  {id:'tasks',label:'TASKS',status:'PROVEN',summary:'Cas CSSA → tâche native',details:['4 mutations natives exactes','HOLD/BLOCK → 0 mutation','pré-état revérifié avant commit']},
  {id:'admin',label:'ADMINISTRATION',status:'PROVEN',summary:'Contrats, conformité, procédures',details:['cycle contrat prouvé','compliance générique prouvée','canaux officiels gouvernés']},
  {id:'mail',label:'MAIL',status:'HOLD',summary:'Preflight gouverné prouvé',details:['plan d’envoi exact','approbation humaine liée','envoi réel bloqué par upstream world actuation']},
  {id:'reporting',label:'REPORTING',status:'PROVEN',summary:'Rapports routés par persona',details:['cadences weekly / biweekly / monthly','aucune livraison externe','privacy policy appliquée']},
  {id:'watch',label:'PUBLIC WATCH',status:'PROVEN',summary:'14 sources publiques readonly',details:['GET only','hash brut + texte visible','changement ≠ vérité sémantique']},
  {id:'matchday',label:'MATCHDAY',status:'PROVEN',summary:'Buvette, shifts, fournisseurs',details:['stock','supplier workflow','cash reconciliation','readiness']},
  {id:'finance',label:'FINANCE',status:'PROVEN',summary:'Modèle saison + tarifs publics',details:['licences CSSA publiques','tarifs LGEF','budget réel 26/27 reste inconnu']},
  {id:'governance',label:'GOVERNANCE',status:'PROVEN',summary:'KX108_ONLY',details:['external_action=false','memory_write=false','emits_act=false','kernel_mutation=false']},
  {id:'field',label:'FIELD REALITY',status:'OPEN',summary:'Validation terrain interne manquante',details:['boîtes mail réelles','droits réels','handoffs','checklists','pratiques non écrites']}
 ],unknowns:['REAL_INTERNAL_FIELD_EVIDENCE','REAL_ACCESS_RIGHTS','REAL_VALIDATION_CHAINS','2026_27_CERTIFIED_BUDGET'],contradictions:['Organigramme Manager Général potentiellement périmé','Réserve R3 sur une source vs R2 saison actuelle','12+ matchs domicile vs 13 championnat'],risks:['SOURCE_FRESHNESS','EXTERNAL_WORLD_ACTUATION_NOT_ACTIVATED'],evidence:['181 tests PASS · F3H-D','14 sources publiques surveillées','19 structures sportives publiques','800 abonnés snapshot officiel','50+ partenaires publics']},
 trading:{domainId:'trading',adapterId:'canonical_trading_adapter',contract:'PORTABLE_DOMAIN_REGISTRATION_V0',source:'OBSIDIA_TRADING · master',sourceUrl:'https://github.com/Eaubin08/OBSIDIA_TRADING',capabilities:[
  {id:'market',label:'MARKET DATA',status:'PROVEN',summary:'État marché canonique',details:['adapters marché','état canonique','provenance conservée']},
  {id:'agents',label:'AGENTS',status:'PROVEN',summary:'17 agents natifs',details:['native reference implementation','adapter stack externe','convergence canonique avant autorité']},
  {id:'risk',label:'RISK',status:'PROVEN',summary:'Risque + calibration',details:['simulation','portfolio risk','signal structurel non souverain']},
  {id:'paper',label:'PAPER EXECUTION',status:'PAPER',summary:'Exécution broker PAPER uniquement',details:['LIVE trading interdit structurellement','Binder vérifie le verdict','receipt après exécution']},
  {id:'proof',label:'PROOF / REPLAY',status:'PROVEN',summary:'Receipts chaînés + replay',details:['receipt ≠ decision','replay ≠ execution','preuve vérifiable']},
  {id:'kx',label:'KX108',status:'OPEN',summary:'Vrai kernel non branché dans ce repo',details:['FixtureKX108Client = test only','UnavailableKX108Client fail-closed','jamais ACT par défaut']}
 ],unknowns:['REAL_KX108_CONNECTION','MARKOV_REAL_CALIBRATION'],contradictions:[],risks:['PROOF_BEST_EFFORT','LIVE_TRADING_FORBIDDEN'],evidence:['283 passed','1 skipped','PAPER ONLY','Canonical convergence point']},
 gps:{domainId:'gps_defense_aviation',adapterId:'gps_evidence_adapter',contract:'PORTABLE_DOMAIN_REGISTRATION_V0',source:'obsidia-gps-defense- · main',sourceUrl:'https://github.com/Eaubin08/obsidia-gps-defense-',capabilities:[
  {id:'gnss',label:'GNSS',status:'RECORDED_REAL',summary:'Chemin RINEX/GNSS réel documenté',details:['recorded real GNSS','observation envelope','Physical Reality Gate']},
  {id:'rf',label:'RF I/Q',status:'RECORDED_REAL',summary:'Chemin RF nominal réel documenté',details:['public nominal I/Q','provenance conservée','raw datasets exclus du repo public']},
  {id:'hostile',label:'HOSTILE RF',status:'PARTIAL',summary:'FGI hostile corpus partiel NAV/PVT',details:['FGI-GSRx / Octave','chaîne temporelle partielle','pas de claim attaque RF enregistrée']},
  {id:'classification',label:'CLASSIFICATION',status:'OPEN',summary:'Classification RF formelle à fermer',details:['attribution causale ouverte','matrice TP/TN/FP/FN à consolider','baseline à renforcer']},
  {id:'sensors',label:'SENSORS',status:'OPEN',summary:'IMU / radar non encore raccordés',details:['source IMU/radar manquante','fusion multi-capteurs ouverte']},
  {id:'governance',label:'GOVERNANCE',status:'PROVEN',summary:'Périphérie non souveraine',details:['domaine traduit','kernel privé non exporté','receipts / claim matrix']}
 ],unknowns:['REAL_IMU_RADAR_SOURCE','FORMAL_RF_CLASSIFICATION','CAUSAL_ATTRIBUTION'],contradictions:[],risks:['PRODUCTION_ANTI_SPOOFING_NOT_CLAIMED','AVIATION_CERTIFICATION_NOT_CLAIMED'],evidence:['RECORDED_REAL_GNSS','RECORDED_REAL_RF','FGI hostile chain PARTIAL']}
}

const semantics:Record<string,Semantic>={
 crm:{purpose:'Conserver les dossiers et relations métier structurés.',context:'Mémoire opérationnelle native, sans autorité.',observes:'CASE, interactions, follow-ups et relations.',feeds:'TASKS, reporting et revues.',impact:'Structure le suivi d’un dossier.',limits:'Un objet CRM n’autorise aucune action externe.'},
 tasks:{purpose:'Transformer un besoin validé en travail suivi.',context:'Travail canonique avec état et échéance.',observes:'Tâches, priorité, responsable et dépendances.',feeds:'Suivi opérationnel et CRM.',impact:'Rend visible ce qui doit être fait.',limits:'TASK ≠ décision ≠ exécution.'},
 governance:{purpose:'Préserver la frontière d’autorité.',context:'Le domaine décrit et propose ; KX108 tranche.',observes:'Unknowns, contradictions, risques, preuves et décisions.',feeds:'Gates et receipts.',impact:'Empêche une auto-autorisation.',limits:'KX108_ONLY affiché ne signifie pas qu’une action est autorisée.'},
 reporting:{purpose:'Rendre l’état compréhensible.',context:'Projection structurée des faits disponibles.',observes:'Indicateurs, changements, risques et preuves.',feeds:'Pilotage humain.',impact:'Aide à décider quoi regarder ensuite.',limits:'Un rapport ne crée pas de vérité nouvelle.'},
 field:{purpose:'Identifier ce qui manque pour connaître la réalité terrain.',context:'Zone volontairement ouverte tant qu’elle n’est pas auditée.',observes:'Droits, pratiques, accès, handoffs et validations.',feeds:'Correction du modèle métier.',impact:'Empêche de confondre modèle et réel.',limits:'Aucun fait terrain absent ne doit être inventé.'},
 admin:{purpose:'Structurer contrats, conformité et procédures.',context:'Couche métier administrative fondée sur sources et règles identifiées.',observes:'Obligations, dossiers, canaux et échéances.',feeds:'CASE, TASKS, reporting, gouvernance.',impact:'Permet de détecter manques et risques.',limits:'Les règles publiques ne prouvent pas les pratiques internes.'},
 mail:{purpose:'Préparer des communications gouvernées.',context:'Preflight avant toute possibilité d’envoi.',observes:'Destinataire prévu, contenu préparé, approbation et contraintes.',feeds:'World action si autorisé.',impact:'Prépare une communication mais ne l’envoie pas seul.',limits:'MAIL HOLD signifie qu’aucun envoi réel ne doit être supposé.'},
 matchday:{purpose:'Structurer les opérations liées aux jours de match.',context:'Readiness, stocks, shifts et fournisseurs.',observes:'Besoins opérationnels et préparation.',feeds:'TASKS, fournisseurs, reporting.',impact:'Aide à détecter les points bloquants.',limits:'Les données publiques ne prouvent pas l’état terrain réel.'},
 finance:{purpose:'Projeter les éléments financiers disponibles.',context:'V0 fondée sur informations publiques, pas comptabilité interne.',observes:'Tarifs, hypothèses saison, coûts/revenus publics.',feeds:'Reporting et scénarios.',impact:'Permet des estimations.',limits:'Ne prouve pas budget certifié, trésorerie ou encaissements réels.'}
}

function mk(id:string,title:string,subtitle:string,kind:string,status:string,purpose:string):ViewItem{
 const base=semantics[kind]??{purpose,context:subtitle,observes:'État et métadonnées disponibles.',feeds:'Inspection et workflows associés.',impact:'Rend la situation compréhensible sans ajouter d’autorité.',limits:'L’interface ne fabrique aucune donnée absente.'}
 return {id,title,subtitle,kind,status,semantic:{...base,purpose}}
}



type TestEvidence={id:string;phase:string;title:string;truth:string;status:string;summary:string;proves:string[];limits:string[];metrics:Record<string,string>;tags:string[];path:string;url:string}

const cssaTestEvidence:TestEvidence[]=[
 {id:'F3C',phase:'F3C',title:'15 scénarios terrain simulés',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'15 cas réalistes simulés traversent la chaîne gouvernée avec ALLOW / HOLD / BLOCK / privacy stop selon leurs conditions.',proves:['La frontière simulation/réalité est conservée.','Les cas passent par le vrai runtime gouverné.','KX108_ONLY reste l’autorité.','HOLD/BLOCK n’invoquent pas le provider.'],limits:['Aucune donnée terrain CSSA réelle n’est validée par cette suite.'],metrics:{'Scénarios':'15','Autorité':'KX108_ONLY','Action externe':'false'},tags:['organisation','admin','crm','tasks','field'],path:'tests/test_f3c_cssa_simulated_field_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3c_cssa_simulated_field_v0.py'},
 {id:'F3D',phase:'F3D',title:'Audit saison complète CSSA',truth:'PUBLIC_AUDIT_PLUS_EXPLICIT_ESTIMATES',status:'PASS',summary:'Le modèle de saison vérifie 19 équipes, groupes R1/R2, finance publique, personas, sources et enveloppes logistiques.',proves:['19 structures d’équipes distinctes.','R1: 14 clubs / 26 matchs / 13 déplacements.','R2: 12 clubs / 22 matchs / 11 déplacements.','25+ personas métier.','Les revenus partenaires et le compte final abonnés restent UNKNOWN_PRIVATE.'],limits:['Les coûts de déplacement sont des scénarios, pas la comptabilité réelle du club.'],metrics:{'Équipes':'19','R1 matchs':'26','R2 matchs':'22','Sources manifest':'25+','Km scénario':'22 000–36 250'},tags:['organisation','sportif','academy','finance','commercial','reporting'],path:'tests/test_f3d_cssa_season_scale_audit_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3d_cssa_season_scale_audit_v0.py'},
 {id:'F3E',phase:'F3E',title:'Simulateur saison complète',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'Une saison synthétique entière est générée pour le CSSA du 01/08/2026 au 15/06/2027.',proves:['19 équipes dans un même corpus.','904 événements organisationnels.','330 événements de matchs/plateaux.','Seniors R1: cycle complet matchday, transport, hospitalité, ticketing et communication.','24 500 km-équipe simulés restent dans l’enveloppe F3D.'],limits:['904 événements sont synthétiques et ne sont pas des opérations observées du club.'],metrics:{'Équipes':'19','Événements':'904','Fixtures':'330','Km-équipe':'24 500','Période':'01/08/2026 → 15/06/2027'},tags:['organisation','sportif','academy','matchday','commercial','reporting'],path:'tests/test_f3e_cssa_full_season_simulator_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3e_cssa_full_season_simulator_v0.py'},
 {id:'F3F',phase:'F3F',title:'Stress organisationnel',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'12 scénarios testent collisions de ressources, absences, retard LGEF, budget voyage, hospitalité, FMI, priorité sécurité et double réservation stade.',proves:['Collision 3 équipes / pool 2 véhicules => BLOCK.','Absence admin + autorité inconnue => HOLD.','20 cas valides sont priorisés sans faux BLOCK.','Double réservation stade => BLOCK.','La saison de 904 événements est scannée pour pression quotidienne.'],limits:['Les capacités de ressources utilisées sont des hypothèses de simulation.'],metrics:{'Scénarios':'12','BASE_F3F':'2 ALLOW · 5 BLOCK · 5 HOLD','Événements scannés':'904'},tags:['organisation','sportif','admin','matchday','commercial','finance','field'],path:'tests/test_f3f_cssa_organizational_stress_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3f_cssa_organizational_stress_v0.py'},
 {id:'F3G-A',phase:'F3G-A',title:'Sensibilité adversariale',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'Le modèle est attaqué sur ses hypothèses et capacités pour identifier les vrais points fragiles plutôt que produire une précision artificielle.',proves:['15 120 profils de capacité testés.','64 états d’hypothèses testés.','Les ressources fragiles identifiées sont véhicule, hospitalité et stade.','La délégation résolue retourne exactement 2 scénarios HOLD.','Ajouter des ressources ne résout ni vérité périmée ni autorité manquante.'],limits:['La sensibilité valide le comportement du modèle, pas les capacités réelles du CSSA.'],metrics:{'Profils ressources':'15 120','États hypothèses':'64','Dimensions ressources':'6','Dimensions hypothèses':'6'},tags:['organisation','admin','matchday','commercial','field','governance'],path:'tests/test_f3g_a_cssa_adversarial_sensitivity_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3g_a_cssa_adversarial_sensitivity_v0.py'},
 {id:'F3G-D',phase:'F3G-D',title:'Veille publique et dérive',truth:'READONLY_PUBLIC_WATCH',status:'PASS',summary:'La veille teste 14 sources HTTPS readonly, cadences, fingerprints et détection de changements sémantiques sans promouvoir automatiquement un changement en vérité.',proves:['14 sources HTTPS explicites.','Changement script-only ignoré comme bruit visible.','Changement visible => HOLD pour revue.','Source inaccessible => HOLD, pas faux fait.','Signal de veille routé vers reporting sans action externe.'],limits:['La veille publique ne constitue pas une preuve terrain interne.'],metrics:{Sources:'14',Cadences:'WEEKLY · BIWEEKLY · MONTHLY','Action externe':'false'},tags:['sources','reporting','organisation','sportif'],path:'tests/test_f3g_d_cssa_public_watch_drift_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3g_d_cssa_public_watch_drift_v0.py'},
 {id:'F3G-J',phase:'F3G-J',title:'Buvette / restauration matchday',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'16 cas couvrent stock, fournisseurs, shifts, readiness et rapprochement caisse.',proves:['Distribution: 6 ALLOW / 6 BLOCK / 4 HOLD.','Stock insuffisant => BLOCK.','Statut fournisseur inconnu => HOLD.','Shift sous-dimensionné => BLOCK.','Écart caisse hors tolérance => BLOCK.','Receipt déterministe, non acting.'],limits:['Catalogue produit, stocks, contrats fournisseurs, shifts et politique caisse réels restent à valider terrain.'],metrics:{'Cas':'16',ALLOW:'6',BLOCK:'6',HOLD:'4'},tags:['matchday','finance','admin','field'],path:'tests/test_f3g_j_cssa_matchday_buvette_restauration_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3g_j_cssa_matchday_buvette_restauration_v0.py'},
 {id:'F3H-D',phase:'F3H-D',title:'Bridge natif CRM / TASKS',truth:'SIMULATED_NOT_OBSERVED',status:'PASS',summary:'5 fixtures CSSA traversent un plan d’intake vers CRM CASE, interaction, TASK et FOLLOWUP natifs.',proves:['4 mutations canoniques par intake autorisé.','4 receipts par intake autorisé.','HOLD ou BLOCK => 0 mutation native.','Doublon rejeté.','Tamper de plan détecté.','Approver humain explicite requis.','Aucun SaaS externe requis.'],limits:['Les 5 fixtures ne sont pas des dossiers CSSA réellement observés.'],metrics:{Fixtures:'5','Mutations/intake':'4','Receipts/intake':'4','Autorité':'KX108_ONLY'},tags:['crm','tasks','admin','matchday','governance'],path:'tests/test_f3h_d_cssa_native_ops_bridge_v0.py',url:'https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-/blob/feat/cssa-native-ops-bridge-v0/tests/test_f3h_d_cssa_native_ops_bridge_v0.py'},
]

function evidenceFor(item:ViewItem|null,moduleId:string){
 if(!item)return []
 const tags=new Set([moduleId,item.kind,String(item.meta?.Tier||'').toLowerCase()])
 if(item.id.startsWith('team:')){tags.add('sportif');tags.add('organisation');tags.add('academy')}
 return cssaTestEvidence.filter(e=>e.tags.some(t=>tags.has(t)))
}


const cssaNativeFixtureCases=[
 {id:'fixture-contract-001',type:'CONTRACT_COMPLIANCE',title:'Contrat prestataire à revoir',summary:"Revue simulée d'un contrat prestataire avant échéance.",owner:'role:manager_general',priority:'HIGH',occurred:'2026-10-07T10:00:00+00:00',due:'2026-10-10T17:00:00+00:00',tag:'ADMINISTRATION'},
 {id:'fixture-institution-001',type:'INSTITUTIONAL_RELATION',title:'Réponse collectivité à préparer',summary:"Cas simulé de suivi d'une demande institutionnelle.",owner:'role:manager_general',priority:'NORMAL',occurred:'2026-10-07T10:05:00+00:00',due:'2026-10-11T12:00:00+00:00',tag:'INSTITUTION'},
 {id:'fixture-matchday-001',type:'MATCHDAY_OPERATIONS',title:'Préparation buvette matchday',summary:'Cas simulé de suivi opérationnel buvette et shifts.',owner:'role:matchday_organizer',priority:'HIGH',occurred:'2026-10-07T10:10:00+00:00',due:'2026-10-09T18:00:00+00:00',tag:'MATCHDAY'},
 {id:'fixture-incident-001',type:'INCIDENT_ROOT_CAUSE',title:'Incident opérationnel à analyser',summary:'Cas simulé pour RCA, action corrective et suivi.',owner:'role:manager_general',priority:'CRITICAL',occurred:'2026-10-07T10:15:00+00:00',due:'2026-10-08T17:00:00+00:00',tag:'RCA'},
 {id:'fixture-supplier-001',type:'SUPPLIER_FOLLOWUP',title:'Livraison fournisseur à confirmer',summary:"Cas simulé de suivi d'une livraison fournisseur matchday.",owner:'role:matchday_organizer',priority:'NORMAL',occurred:'2026-10-07T10:20:00+00:00',due:'2026-10-09T09:00:00+00:00',tag:'SUPPLIER'},
]

const cssaStressScenarios=[
 ['F3F_S01_VEHICLE_COLLISION','Three away teams need a two-equivalent vehicle pool','BLOCK'],
 ['F3F_S02_ADMIN_ABSENCE_LGEF_URGENT','Admin owner absent while official league cases are due','HOLD'],
 ['F3F_S03_TRAVEL_BUDGET_PRESSURE','Projected monthly travel exceeds synthetic envelope','HOLD'],
 ['F3F_S04_LATE_MATCH_CHANGE_CASCADE','Late official match change conflicts with transport and public ticketing state','BLOCK'],
 ['F3F_S05_HOSPITALITY_DOUBLE_COMMITMENT','Two partner commitments target one hospitality slot','BLOCK'],
 ['F3F_S06_FMI_BACKLOG_DEADLINE_CASCADE','Previous FMI exception remains open while next official deadline arrives','HOLD'],
 ['F3F_S07_STALE_SOURCE_CONFLICT','Current official communication conflicts with stale public organization source','BLOCK'],
 ['F3F_S08_NO_DELEGATION_FOR_ABSENCE','Role holder absence has no validated substitution chain','HOLD'],
 ['F3F_S09_TWENTY_VALID_CASES','Twenty valid cases compete for limited administrative attention','ALLOW'],
 ['F3F_S10_NORMAL_MULTI_CASE_DAY','Several independent cases fit available capacity','ALLOW'],
 ['F3F_S11_SAFETY_VS_PARTNER_PRIORITY','Safety-critical matchday case outranks partner activation','HOLD'],
 ['F3F_S12_VENUE_DOUBLE_BOOKING','Two organizational uses claim the same stadium slot','BLOCK'],
] as const

const cssaMatchdayCases=[
 ['BUV_STOCK_READY','Stock prêt pour ouverture','ALLOW'],
 ['BUV_STOCK_LOW_BUFFER','Stock faible mais encore exploitable','ALLOW'],
 ['BUV_STOCK_SHORTAGE','Stock insuffisant pour ouverture','BLOCK'],
 ['BUV_PERISHABLE_NO_EXPIRY_CHECK','Périssables sans contrôle expiration','HOLD'],
 ['BUV_SUPPLIER_CONFIRMED','Livraison fournisseur confirmée','ALLOW'],
 ['BUV_SUPPLIER_CANCELLED','Livraison fournisseur requise annulée','BLOCK'],
 ['BUV_SUPPLIER_STATUS_UNKNOWN','Statut livraison fournisseur inconnu','HOLD'],
 ['BUV_SHIFT_COMPLETE','Plan de shift complet','ALLOW'],
 ['BUV_SHIFT_UNDERSTAFFED','Shift sous-dimensionné','BLOCK'],
 ['BUV_SHIFT_AUTHORITY_UNKNOWN','Autorité affectation bénévoles inconnue','HOLD'],
 ['BUV_READY_COMPLETE_CHECKLIST','Checklist readiness complète','ALLOW'],
 ['BUV_READY_INCOMPLETE_CHECKLIST','Ready déclaré avec contrôles incomplets','BLOCK'],
 ['BUV_CASH_RECONCILED','Caisse rapprochée dans tolérance','ALLOW'],
 ['BUV_CASH_VARIANCE_OVER_TOLERANCE','Écart caisse hors tolérance','BLOCK'],
 ['BUV_CASH_FINAL_NO_EVIDENCE','Caisse finale sans preuve de rapprochement','HOLD'],
 ['BUV_VENUE_CONFIG_CONFLICT','Conflit configuration lieu / buvette','BLOCK'],
] as const

function cssaFixtureCaseItem(row:(typeof cssaNativeFixtureCases)[number]):ViewItem{
 return mkRich('case:'+row.id,row.title,row.type,'case','SIMULATED_NOT_OBSERVED',
  'Tester un dossier CSSA traversant le bridge natif CRM/TASKS.',
  row.summary,
  'CASE, interaction, TASK et FOLLOWUP générés dans le scénario de test.',
  'CRM natif, TASKS natif, follow-up et receipts de test.',
  'Permet de vérifier qu’un dossier métier peut être transformé en objets natifs gouvernés.',
  'Ce dossier est une fixture de test et ne correspond pas à un dossier réellement observé du CSSA.',
  {'Case ID':row.id,'Type':row.type,'Owner':row.owner,'Priorité':row.priority,'Occurred':row.occurred,'Due':row.due,'Truth':'SIMULATED_NOT_OBSERVED','Test':'F3H-D'})
}
function cssaFixtureTaskItem(row:(typeof cssaNativeFixtureCases)[number]):ViewItem{
 return mkRich('task:'+row.id,row.title,row.priority,'task','SIMULATED_NOT_OBSERVED',
  'Tester la création d’une tâche native liée à un CASE CSSA.',
  row.summary,
  'Titre, priorité, assignee_ref, due_at et lien vers le CASE.',
  'TASKS natif puis CRM FOLLOWUP.',
  'Vérifie que le travail à faire reste traçable après intake.',
  'La tâche existe dans la fixture de test, pas dans le store natif réel actuellement connecté.',
  {'Fixture':row.id,'Owner':row.owner,'Priorité':row.priority,'Due':row.due,'CASE':'case:'+row.id,'Test':'F3H-D'})
}
function cssaStressItem(row:(typeof cssaStressScenarios)[number]):ViewItem{
 const [id,title,gate]=row
 return mkRich('stress:'+id,title,id,'decision',gate,
  'Tester la réponse de gouvernance face à une contrainte organisationnelle.',
  'Scénario de stress F3F exécuté sur le modèle CSSA synthétique.',
  'Ressources, unknowns, contradictions, priorité et gate attendu.',
  'Reporting, calibration et gouvernance.',
  'Montre si le système doit ALLOW, HOLD ou BLOCK dans ce scénario.',
  'Le gate concerne un scénario simulé et ne constitue pas une décision réelle du club.',
  {'Scenario':id,'Gate attendu':gate,'Truth':'SIMULATED_NOT_OBSERVED','Test':'F3F'})
}
function cssaMatchdayItem(row:(typeof cssaMatchdayCases)[number]):ViewItem{
 const [id,title,gate]=row
 return mkRich('matchday:'+id,title,id,'matchday',gate,
  'Tester une situation opérationnelle buvette/restauration matchday.',
  'Cas F3G-J simulé pour exercer stock, fournisseur, shift, readiness ou caisse.',
  'État du cas, inconnues, contradictions, risques et gate attendu.',
  'Cockpit matchday, reporting et gouvernance.',
  'Vérifie que les situations incohérentes ne passent pas silencieusement.',
  'Aucun stock, contrat fournisseur ou état caisse réel du CSSA n’est affirmé.',
  {'Case':id,'Gate attendu':gate,'Truth':'SIMULATED_NOT_OBSERVED','Test':'F3G-J'})
}

const cssaOrganisationItems:ViewItem[]=[
 mkRich('org-overview','Organisation publique CSSA','19 structures d’équipes · saison 2026–2027','organisation','PUBLIC_CONFIRMED',
  'Donner une vue structurée du club tel qu’il est publiquement documenté.',
  'Le modèle public CSSA couvre 19 structures d’équipes et plusieurs pôles administratifs. Il ne constitue pas un audit interne.',
  'Équipes, pôles, rôles publics, niveaux de compétition et liens métier.',
  'Sportif, académie, matchday, administration, finance, reporting.',
  'Permet de naviguer dans le club comme une organisation multi-pôles.',
  'Les responsables réels, accès, handoffs et pratiques internes restent non audités.',
  {'Saison':'2026–2027','Structures équipes':'19','Statut':'PUBLIC_ONLY_NOT_FIELD_VALIDATED'}),
 ...[
  ['SENIORS_R1','Seniors R1','SENIORS_POST_FORMATION','REGIONAL_1_A'],
  ['SENIORS_R2','Seniors R2','SENIORS_POST_FORMATION','REGIONAL_2_A'],
  ['U20_R1','U20 R1','SENIORS_POST_FORMATION','U20_R1'],
  ['U17_R1','U17 R1','FORMATION','U17_R1'],
  ['U16_R1','U16 R1','FORMATION','U16_R1'],
  ['U15_R1','U15 R1','FORMATION','U15_R1'],
  ['U15_D1','U15 D1','FORMATION_PREFORMATION','DISTRICT_D1'],
  ['SENIORS_F','Seniors féminines','FEMININES','R2_F_CENTRE_OUEST'],
  ['U18F_R2','U18 F R2','FEMININES','U18_R2_F'],
  ['U13_FANION','U13 Fanion','FOOT_8','U13_D1'],
  ['U13_U12_ESPOIR','U13/U12 Espoir','FOOT_8','U13_D2'],
  ['U12_AVENIR','U12 Avenir','FOOT_8','DISTRICT_PHASES'],
  ['U11_FANION','U11 Fanion','FOOT_8','PLATEAUX'],
  ['U11_U10_ESPOIR','U11/U10 Espoir','FOOT_8','PLATEAUX'],
  ['U10_AVENIR','U10 Avenir','FOOT_8','PLATEAUX'],
  ['U9','U9','FOOT_5','PLATEAUX'],
  ['U8','U8','FOOT_5','PLATEAUX'],
  ['U7','U7','FOOT_5','PLATEAUX'],
  ['U6','U6','FOOT_5','PLATEAUX'],
 ].map(([id,label,tier,competition])=>mkRich(
   'team:'+id,label,competition,'team','PUBLIC_CONFIRMED',
   'Représenter une structure sportive publique du club.',
   'Équipe identifiée dans le modèle public CSSA 2026–2027.',
   'Catégorie, niveau sportif et compétition publique associée.',
   'Calendrier, matchday, transport, licences, reporting.',
   'Permet de rattacher les opérations du club à une équipe précise.',
   'Ne prouve pas le staff réel, le budget, les disponibilités ou la logistique interne.',
   {'Team ID':id,'Tier':tier,'Compétition':competition,'Saison':'2026–2027'}
 )),
 ...[
  'PRESIDENT','GENERAL_MANAGER','TECHNICAL_DIRECTOR','ADMINISTRATIVE_MANAGER','TREASURY_ADMINISTRATION','CLUB_SECRETARIAT','PARTNERSHIPS','MERCHANDISING','COMMUNICATION','MATCHDAY_ORGANIZATION_EVENTS','MATCHDAY_SECURITY'
 ].map(role=>mkRich(
  'role:'+role,humanizeCode(role),'Rôle public / slot organisationnel','role','PUBLIC_CONFIRMED',
  'Décrire un rôle stable de l’organisation sans figer une personne comme vérité durable.',
  'Le profil public modélise les fonctions comme des slots organisationnels ; les occupants publics peuvent changer.',
  'Fonction attendue et place dans l’organisation.',
  'Administration, CRM, validation, reporting et opérations selon le rôle.',
  'Aide à comprendre qui devrait porter quel type de responsabilité.',
  'Ne prouve pas qui occupe réellement le rôle aujourd’hui ni quels droits lui sont effectivement délégués.',
  {'Role slot':role,'Identité figée':'false'}
 ))
]

const cssaSportItems:ViewItem[]=[
 mkRich('sport-r1','Groupe Seniors R1','REGIONAL_1_A · 14 clubs','sport','SECONDARY_CORROBORATED',
  'Suivre le contexte de compétition de l’équipe première.',
  'Groupe R1 A corroboré par des sources sportives secondaires.',
  'Clubs du groupe, nombre de matchs et déplacements.',
  'Matchday, calendrier, transport et reporting.',
  'Structure la saison sportive publique de l’équipe première.',
  'Une source secondaire ne constitue pas l’autorité officielle de compétition.',
  {'Championnat':'REGIONAL_1_A','Clubs':'14','Matchs championnat':'26','Matchs extérieurs':'13'}),
 mkRich('sport-r2','Groupe Seniors R2','REGIONAL_2_A · 12 clubs','sport','SECONDARY_CORROBORATED',
  'Suivre le contexte de compétition de la réserve.',
  'Groupe R2 A corroboré par les sources publiques actuelles.',
  'Clubs du groupe, nombre de matchs et déplacements.',
  'Matchday, calendrier, transport et reporting.',
  'Permet de distinguer la réserve actuelle des anciennes étiquettes publiques.',
  'La contradiction R3/R2 doit rester visible tant que les sources ne sont pas réconciliées.',
  {'Championnat':'REGIONAL_2_A','Clubs':'12','Matchs championnat':'22','Matchs extérieurs':'11'}),
 mkRich('sport-distance','Déplacements saison','22 000–36 250 km-équipe','sport','ESTIMATED',
  'Donner un ordre de grandeur des déplacements sportifs de la saison.',
  'Estimation explicite de kilomètres aller-retour équipe, non multipliée par le nombre de véhicules.',
  'Fourchettes de distance par équipe.',
  'Transport, budget scénario et planification.',
  'Aide à dimensionner les contraintes logistiques.',
  'Ce n’est ni du kilométrage véhicule réel ni de la comptabilité CSSA.',
  {'Total scénario':'22 000–36 250 km','Nature':'ESTIMATED'})
]

const cssaAcademyItems:ViewItem[]=cssaOrganisationItems.filter(x=>x.id.startsWith('team:')&&['FORMATION','FORMATION_PREFORMATION','FOOT_8','FOOT_5','FEMININES'].includes(String(x.meta?.Tier||'')))

const cssaCommercialItems:ViewItem[]=[
 mkRich('commercial-partners','Partenaires actifs','50+ partenaires publics','commercial','PUBLIC_CONFIRMED',
  'Suivre l’écosystème partenaire publiquement revendiqué.',
  'Le club communique sur plus de 50 partenaires actifs.',
  'Volume public de partenaires et présence commerciale.',
  'Partenariats, hospitalité, reporting et communication.',
  'Donne une idée de la surface commerciale publique du club.',
  'Le nombre de partenaires ne permet pas d’inférer le revenu partenaire.',
  {'Partenaires':'50+','Revenu partenaires':'UNKNOWN_PRIVATE'}),
 mkRich('commercial-subscribers','Abonnés 2026–2027','800 officiels · 855 secondaire','commercial','PUBLIC_CONFIRMED',
  'Suivre les snapshots publics d’abonnés.',
  'Snapshot officiel à 800 incluant les partenaires ; une source secondaire plus tardive mentionne 855.',
  'Nombre public d’abonnés à un instant donné.',
  'Billetterie, communication, modèle saison.',
  'Permet de suivre la dynamique publique des abonnements.',
  'Aucun de ces nombres ne prouve le compte final de saison.',
  {'Snapshot officiel':'800','Snapshot secondaire':'855','Compte final':'UNKNOWN_PRIVATE'}),
 mkRich('commercial-audience','Audience publique','100k+ / 110k+ followers revendiqués','commercial','PUBLIC_CONFIRMED',
  'Documenter les claims publics de visibilité du club.',
  'Différentes pages commerciales utilisent des seuils de followers différents.',
  'Followers revendiqués, spectateurs annuels et exposition match.',
  'Partenariats, communication et valorisation commerciale.',
  'Permet de comprendre la proposition de valeur publique faite aux partenaires.',
  'Ce sont des claims marketing publics, pas un audit d’audience indépendant.',
  {'Followers club':'100 000+','Claim commercial':'110 000+','Spectateurs annuels':'30 000+','Exposition match':'2 500+'}),
 mkRich('commercial-home','Exposition domicile','13 matchs abonnement / +12 claim partenaire','commercial','PUBLIC_CONFIRMED',
  'Conserver la différence entre deux formulations publiques sur les matchs à domicile.',
  'La page abonnement annonce 13 matchs R1 à domicile ; une page partenaires parle de +12.',
  'Nombre de matchs domicile utilisé dans les offres publiques.',
  'Partenaires, abonnements, matchday.',
  'Évite de masquer une divergence commerciale réelle.',
  'La différence est une mismatch sémantique, pas automatiquement une erreur.',
  {'Abonnement':'13','Partenaires':'+12','Classification':'SEMANTIC_MISMATCH'})
]

const cssaFinanceItems:ViewItem[]=[
 mkRich('finance-license-pack','Pack licences CSSA','180€ / 240€ / 300€','finance','PUBLIC_CONFIRMED',
  'Exposer les tarifs publics de licence par catégorie.',
  'Tarifs publiés pour la saison 2026–2027.',
  'U6–U9, U10–U18, U20–Seniors et éléments inclus.',
  'Administration, académie, finance publique.',
  'Permet de calculer des scénarios publics par catégorie.',
  'Ne prouve ni encaissements réels ni mix de licenciés.',
  {'U6–U9':'180 €','U10–U18':'240 €','U20–Seniors':'300 €','Inclus':'Licence FFF + pack Kappa + abonnement R1'}),
 mkRich('finance-discounts','Réductions publiques','Famille / féminine / Pass Sport','finance','PUBLIC_CONFIRMED',
  'Documenter les réductions publiées.',
  'Réductions CSSA connues publiquement pour la saison.',
  'Montants et conditions à vérifier au cas par cas.',
  'Licences, administration, finance publique.',
  'Permet d’expliquer le prix public potentiel d’un dossier.',
  'Éligibilité et non-cumul doivent être vérifiés par cas.',
  {'2e enfant':'25 €','Féminine':'25 €','Pass Sport':'70 €'}),
 mkRich('finance-lgef','Tarifs LGEF sélectionnés','Cotisation, discipline, procédures','finance','PUBLIC_CONFIRMED',
  'Conserver des tarifs réglementaires publics utiles au club.',
  'Tarifs LGEF 2026–2027 sélectionnés dans le modèle.',
  'Cotisation R1/R2, discipline, réserve, appel.',
  'Administration, conformité et scénarios financiers.',
  'Donne des coûts réglementaires publics de référence.',
  'Ne représente pas la comptabilité réelle du CSSA.',
  {'Cotisation club R1/R2':'367,34 €','Réserve/réclamation':'106,47 €','Appel':'159,71 €'})
]

const cssaLegalItems:ViewItem[]=[
 mkRich('legal-association','Association CSSA','SIREN 780287843','legal','PUBLIC_CONFIRMED','Identifier l’entité association publique.','Écosystème juridique public du club.','Statut et identifiant public.','Administration et conformité.','Évite de confondre les entités juridiques.','Ne prouve pas la relation opérationnelle interne Association/SAS.',{'Statut':'ACTIVE','SIREN':'780287843'}),
 mkRich('legal-sas','SAS CSSA','SIREN 798016796','legal','PUBLIC_CONFIRMED','Identifier la SAS publique.','Écosystème juridique public du club.','Statut et procédure collective rapportée.','Administration et conformité.','Rend visible la pluralité d’entités.','La relation opérationnelle exacte 2026 reste UNKNOWN_PRIVATE.',{'Statut':'ACTIVE_PROCEDURE_COLLECTIVE_REPORTED','SIREN':'798016796'})
]

function mkRich(id:string,title:string,subtitle:string,kind:string,status:string,purpose:string,context:string,observes:string,feeds:string,impact:string,limits:string,meta:Record<string,string>):ViewItem{
 return {id,title,subtitle,kind,status,semantic:{purpose,context,observes,feeds,impact,limits},meta}
}

const catalogueItems:Record<StructureId,Record<string,ViewItem[]>>={
 cssa:{
  organisation:cssaOrganisationItems,
  sportif:cssaSportItems,
  academy:cssaAcademyItems,
  commercial:cssaCommercialItems,
  crm:cssaNativeFixtureCases.map(c=>cssaFixtureCaseItem(c)),
  tasks:cssaNativeFixtureCases.map(c=>cssaFixtureTaskItem(c)),
  governance:cssaStressScenarios.map(c=>cssaStressItem(c)),
  matchday:cssaMatchdayCases.map(c=>cssaMatchdayItem(c)),
  tests:cssaTestEvidence.map(e=>mkRich('test:'+e.id,e.title,e.summary,'test',e.truth,'Documenter une preuve de test CSSA/Sedan.',e.summary,e.proves.join(' · '),'Audit, revue, gouvernance et compréhension du modèle.','Montre ce qui a été exercé dans le repo CSSA.','Une preuve de test ne transforme jamais une simulation en réalité terrain.',{'Phase':e.phase,'Statut':e.status,'Vérité':e.truth,'Fichier test':e.path,'Lien test':e.url,...e.metrics})),
  admin:[
   mk('cssa-admin','Administration CSSA','Contrats, conformité, procédures','admin','PROVEN','Structurer les obligations et procédures publiques.'),
   ...cssaLegalItems
  ],
  mail:[mk('cssa-mail','Mail gouverné','Preflight prouvé · envoi externe HOLD','mail','HOLD','Préparer une communication sans donner d’autorité d’envoi.')],
  reporting:[mk('cssa-reporting','Reporting CSSA','Cadences weekly / biweekly / monthly','reporting','PROVEN','Projeter l’état selon le destinataire.')],
  
  finance:cssaFinanceItems,
  field:[mk('cssa-field','Réalité terrain','Droits, handoffs, checklists encore ouverts','field','OPEN','Identifier les informations internes encore non prouvées.')],
 },
 trading:{
  market:[mk('tr-market','Market data','État marché canonique','market','PROVEN','Observer les données marché structurées sans autorité.')],
  signals:[mk('tr-signals','Signaux','17 agents convergent avant autorité','signals','PROVEN','Consolider les propositions de signal avant gouvernance.')],
  strategies:[mk('tr-strategy','Stratégies','Simulation et propositions','strategies','PROVEN','Comparer des stratégies sans les transformer en ordre réel.')],
  risk:[mk('tr-risk','Risk','Risque portefeuille / calibration','risk','PROVEN','Qualifier les risques avant toute décision.')],
  paper:[mk('tr-paper','Paper execution','Exécution broker PAPER uniquement','paper','PAPER','Tester la chaîne d’exécution sans trading live.')],
  reporting:[mk('tr-report','Reporting','Performance et preuves','reporting','PROVEN','Rendre lisibles résultats et limites.')],
  governance:[mk('tr-gov','Gouvernance','KX108 attendu · fail-closed','governance','OPEN','Conserver l’autorité hors du domaine trading.')],
  proof:[mk('tr-proof','Proof / receipts','Receipts chaînés + replay','proof','PROVEN','Prouver ce qui a été appliqué en PAPER.')],
 },
 gps:{
  sensors:[mk('gps-sensors','Sources capteurs','GNSS/RINEX et RF I/Q enregistrés','sensors','RECORDED_REAL','Conserver des observations physiques enregistrées.')],
  gnss:[mk('gps-gnss','GNSS','Chemin RINEX/GNSS réel','gnss','RECORDED_REAL','Observer et qualifier les données GNSS enregistrées.')],
  rf:[mk('gps-rf','RF I/Q','Chemin RF nominal réel','rf','RECORDED_REAL','Observer le signal RF enregistré et sa provenance.')],
  incidents:[mk('gps-inc','Incidents','Anomalies physiques à qualifier','incidents','OPEN','Regrouper des anomalies sans attribution causale prématurée.')],
  classification:[mk('gps-class','Classification','Hostile RF partiel','classification','PARTIAL','Qualifier les observations RF avec incertitude conservée.')],
  evidence:[mk('gps-ev','Evidence','Recorded real GNSS / RF','evidence','RECORDED_REAL','Relier observations, fichiers et preuves vérifiables.')],
  governance:[mk('gps-gov','Gouvernance','Périphérie non souveraine','governance','PROVEN','Empêcher le domaine physique de s’auto-autoriser.')],
  receipts:[mk('gps-rec','Receipts','Claim matrix / preuves','receipts','PROVEN','Conserver les traces de preuve et replay.')],
  field:[mk('gps-field','Réalité terrain','IMU/radar et attribution encore ouverts','field','OPEN','Rendre visibles les trous de réalité physique.')],
 }
}

function semanticForNative(e:NativeEntity):Semantic{
 const k=String(e.kind||'').toLowerCase()
 if(k==='task')return semantics.tasks
 if(['case','interaction','followup','relationship'].includes(k))return semantics.crm
 if(['decision','receipt','world_action'].includes(k))return semantics.governance
 if(k==='source')return {purpose:'Conserver une observation sourcée et vérifiable.',context:'Objet issu du source runtime.',observes:'Provenance, état et empreintes disponibles.',feeds:'Interprétation métier et revue.',impact:'Peut déclencher une analyse ou contradiction.',limits:'SOURCE ≠ TRUST et observation ≠ conclusion.'}
 return {purpose:'Inspecter un objet natif observé.',context:'Objet exposé par le read model.',observes:'Métadonnées persistées.',feeds:'Audit et inspection.',impact:'Apporte du contexte sans autorité.',limits:'Les champs absents ne sont pas complétés.'}
}


function humanizeCode(value:string){
 return value.toLowerCase().split('_').map(x=>x.charAt(0).toUpperCase()+x.slice(1)).join(' ')
}

function semanticMetaItem(kind:'unknown'|'risk'|'contradiction'|'evidence',value:string,profile:Profile):ViewItem{
 if(kind==='unknown'){
  return {
   id:'unknown:'+value,title:humanizeCode(value),subtitle:'Point encore non prouvé',kind:'unknown',status:'OPEN',
   semantic:{
    purpose:'Rendre explicite une information encore manquante avant de considérer le modèle comme complet.',
    context:'Ce point est conservé volontairement comme inconnu au lieu d’être remplacé par une supposition.',
    observes:'Absence de preuve, de validation terrain ou de donnée canonique suffisante.',
    feeds:'Revue terrain, collecte de preuves, gouvernance et futures décisions.',
    impact:'Peut empêcher une capacité ou un workflow d’être considéré comme pleinement validé.',
    limits:'OPEN ne signifie ni faux ni vrai : cela signifie non démontré avec les preuves actuellement raccordées.'
   },
   meta:{Code:value,Domain:profile.domainId,Authority:'KX108_ONLY'}
  }
 }
 if(kind==='risk'){
  return {
   id:'risk:'+value,title:humanizeCode(value),subtitle:'Risque explicitement conservé',kind:'risk',status:'OPEN',
   semantic:{
    purpose:'Rendre visible un risque qui peut dégrader la confiance ou bloquer une action.',
    context:'Le risque est porté par le domaine mais ne devient pas automatiquement une décision.',
    observes:'Conditions susceptibles de fragiliser fraîcheur, sûreté, exécution ou interprétation.',
    feeds:'Gouvernance, priorisation, revue et décision KX108.',
    impact:'Peut conduire à HOLD/BLOCK ou demander une preuve supplémentaire.',
    limits:'Un risque déclaré n’est pas la preuve qu’un incident s’est produit.'
   },
   meta:{Code:value,Domain:profile.domainId,Authority:'KX108_ONLY'}
  }
 }
 if(kind==='contradiction'){
  return {
   id:'contradiction:'+value,title:value,subtitle:'Informations incompatibles à résoudre',kind:'contradiction',status:'OPEN',
   semantic:{
    purpose:'Empêcher deux affirmations incompatibles d’être fusionnées silencieusement.',
    context:'Plusieurs sources ou états décrivent différemment le même sujet.',
    observes:'Valeurs, versions ou affirmations qui ne peuvent pas être simultanément acceptées sans revue.',
    feeds:'Revue de source, clarification terrain et gouvernance.',
    impact:'Réduit la confiance et peut bloquer la promotion d’une information en vérité métier.',
    limits:'La présence d’une contradiction ne dit pas encore quelle source a raison.'
   },
   meta:{Domain:profile.domainId,Authority:'KX108_ONLY'}
  }
 }
 return {
  id:'evidence:'+value,title:value,subtitle:'Preuve ou état observable',kind:'evidence',status:'PROVEN',
  semantic:{
   purpose:'Montrer ce qui soutient concrètement une affirmation ou une capacité.',
   context:'Élément de preuve déclaré dans le dossier de la structure.',
   observes:'Tests, corpus, références ou observations explicitement conservées.',
   feeds:'Audit, gouvernance, confiance et replay quand disponible.',
   impact:'Augmente la traçabilité de ce qui est affirmé.',
   limits:'Une preuve locale ne doit pas être étendue à un périmètre qu’elle ne couvre pas.'
  },
  meta:{Domain:profile.domainId,Source:profile.source}
 }
}


export default function CSSAPage(){
 const [structureId,setStructureId]=useState<StructureId>('cssa')
 const initialRoute=parseCssaHash(location.hash,structures.find(s=>s.id==='cssa')!.modules.map(m=>m.id))
 const initialSection=initialRoute?.moduleId??'dashboard'
 const initialSelected=initialRoute?.selectedId??''
 const [moduleId,setModuleId]=useState(initialSection)
 const [world,setWorld]=useState<WorldState|null>(null)
 const [native,setNative]=useState<NativeReadModel|null>(null)
 const [query,setQuery]=useState('')
 const [selectedId,setSelectedId]=useState(initialSelected)
 const [tab,setTab]=useState<'overview'|'history'|'relations'>('overview')
 const [refreshing,setRefreshing]=useState(false)
 const [projects,setProjects]=useState<Record<StructureId,Project[]>>({cssa:[],trading:[],gps:[]})
 const [projectName,setProjectName]=useState('')
 const [dashboardMode,setDashboardMode]=useState<'capabilities'|'unknowns'|'contradictions'|'risks'|'evidence'>('capabilities')
 const [showTechDetails,setShowTechDetails]=useState(false)

 const structure=structures.find(s=>s.id===structureId)!
 const [observations,setObservations]=useState<Observations>({})
 const profile=useMemo(()=>structureId==='cssa'?projectCssaProfile(profiles.cssa,observations):profiles[structureId],[structureId,observations])
 useEffect(()=>{
  let active=true
  let generation=0
  const read=async()=>{
   const current=++generation
   const rows=await Promise.all(Object.entries(cssaProfileStores).map(async([id,definition])=>{
    try{
     const response=await fetch(`/obsidia-local/${definition.route}`,{cache:'no-store',signal:AbortSignal.timeout(4000)})
     if(!response.ok)throw new Error('unavailable')
     const state=await response.json()
     if(!state||typeof state!=='object'||Array.isArray(state)||definition.lists.some(key=>!Array.isArray(state[key])))throw new Error('invalid state')
     return [id,{available:true,state}] as const
    }catch{return [id,{available:false}] as const}
   }))
   if(active&&current===generation)setObservations(Object.fromEntries(rows) as Observations)
  }
  void read();const timer=window.setInterval(read,5000)
  const events=(Object.keys(cssaProfileStores) as StoreId[]).map(id=>`cssa-${id}-updated`)
  events.forEach(event=>window.addEventListener(event,read))
  return()=>{active=false;window.clearInterval(timer);events.forEach(event=>window.removeEventListener(event,read))}
 },[])
 const entities=native?.entities??[]
 const worldEntities=world?.entities??[]

 const refresh=async()=>{
  setRefreshing(true)
  try{
   const [a,b]=await Promise.allSettled([
    fetch('/obsidia-local/state',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()),
    fetch('/obsidia-local/native-enterprise',{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject())
   ])
   if(a.status==='fulfilled')setWorld(a.value)
   if(b.status==='fulfilled')setNative(b.value)
  }finally{setRefreshing(false)}
 }
 useEffect(()=>{refresh();const t=window.setInterval(refresh,5000);return()=>window.clearInterval(t)},[])
 useEffect(()=>{const onHash=()=>{if(!location.hash.startsWith('#cssa'))return;const route=parseCssaHash(location.hash,structure.modules.map(m=>m.id));setModuleId(route?.moduleId??'dashboard');setSelectedId(route?.selectedId??'');setQuery('');setTab('overview')};window.addEventListener('hashchange',onHash);return()=>window.removeEventListener('hashchange',onHash)},[structure])

 const observedSources=useMemo(()=>entities.filter(e=>e.kind==='source'),[entities])
 const nativeByModule=useMemo(()=>{
  const mod=structure.modules.find(m=>m.id===moduleId)
  if(!mod?.kindFilter)return []
  return entities.filter(e=>mod.kindFilter!.includes(String(e.kind||'').toLowerCase()))
 },[entities,moduleId,structure])

 const projectItems=projects[structureId].map(p=>mk(p.id,p.title,p.status,'project',p.status,'Suivre un chantier local dans cette structure.'))

 const items=useMemo<ViewItem[]>(()=>{
  let rows:ViewItem[]=[]
  if(structureId==='cssa'&&moduleId==='sources'){
   rows=cssaSources.map(s=>{
    const observed=observedSources.find(e=>e.id===s.id||String(e.label||'').includes(s.id))
    return {id:s.id,title:s.title,subtitle:s.semantic.purpose,kind:'source',status:observed?'OBSERVED':'CATALOGUE',semantic:s.semantic,meta:{URL:s.url,Cadence:s.cadence,Criticité:s.criticality,'Classe de vérité':s.truthClass},raw:observed}
   })
  }else if(moduleId==='projects'){
   rows=projectItems
  }else if(nativeByModule.length){
   rows=nativeByModule.map(e=>({id:e.id,title:e.label||e.id,subtitle:String(e.status||e.verification||e.gate||'OBSERVED'),kind:String(e.kind),status:String(e.status||e.verification||e.gate||'OBSERVED'),semantic:semanticForNative(e),raw:e}))
  }else if(moduleId==='dashboard'){
   const caps=profile.capabilities.map(c=>mk('cap:'+c.id,c.label,c.summary,c.id,c.status,'Comprendre cette capacité dans le contexte de la structure.'))
   rows=[...entities.slice(0,5).map(e=>({id:e.id,title:e.label||e.id,subtitle:String(e.kind),kind:String(e.kind),status:String(e.status||e.verification||e.gate||'OBSERVED'),semantic:semanticForNative(e),raw:e})),...caps]
  }else rows=catalogueItems[structureId][moduleId]??[]
  const q=query.trim().toLowerCase()
  return q?rows.filter(x=>(x.title+' '+x.subtitle+' '+x.kind+' '+x.status).toLowerCase().includes(q)):rows
 },[structureId,moduleId,entities,observedSources,nativeByModule,query,projectItems,profile.capabilities])

 useEffect(()=>{
  // Deep links are authoritative for navigation identity; never replace a missing id with the first row.
  if(selectedId)return
  if(items.length===1&&moduleId==='sources')setSelectedId(items[0].id)
 },[items,selectedId,moduleId])

 const selected=items.find(x=>x.id===selectedId)??null
 const selectedEvidence=structureId==='cssa'?evidenceFor(selected,moduleId):[]
 const selectedCapability=selected?.id.startsWith('cap:')?profile.capabilities.find(c=>'cap:'+c.id===selected.id):null
 const liveServices=worldEntities.filter(e=>e.kind==='session'&&e.nativeService)
 const decisions=worldEntities.filter(e=>e.kind==='decision_record'&&(!e.domainId||String(e.domainId)===profile.domainId))
 const provenCount=profile.capabilities.filter(c=>['PROVEN','RECORDED_REAL','PAPER','PARTIAL'].includes(c.status)).length
 const openCount=profile.capabilities.filter(c=>['OPEN','HOLD'].includes(c.status)).length
 const dashboardItems:ViewItem[]=dashboardMode==='capabilities'
  ?profile.capabilities.map(c=>mk('cap:'+c.id,c.label,c.summary,c.id,c.status,'Comprendre cette capacité dans le contexte de la structure.'))
  :dashboardMode==='unknowns'
   ?profile.unknowns.map(x=>semanticMetaItem('unknown',x,profile))
   :dashboardMode==='contradictions'
    ?profile.contradictions.map(x=>semanticMetaItem('contradiction',x,profile))
    :dashboardMode==='risks'
     ?profile.risks.map(x=>semanticMetaItem('risk',x,profile))
     :profile.evidence.map(x=>semanticMetaItem('evidence',x,profile))
 const selectedDashboardItem=dashboardItems.find(x=>x.id===selectedId)??dashboardItems[0]??null


 const moduleCount=(id:string)=>{
  if(structureId==='cssa'&&id==='sources')return cssaSources.length
  if(id==='projects')return projects[structureId].length
  const m=structure.modules.find(x=>x.id===id)
  if(m?.kindFilter)return entities.filter(e=>m.kindFilter!.includes(String(e.kind||'').toLowerCase())).length
  return catalogueItems[structureId][id]?.length??0
 }

 const moduleBadge=(id:string)=>{
  const live=structureId==='cssa'?cssaNavigationCount(id,observations):null
  if(live)return <b title={`${live.label} · /obsidia-local/${live.route}${live.value===null?' · UNKNOWN : source indisponible ou invalide':''}`} aria-label={`${live.label} : ${live.value??'UNKNOWN'}`}>{live.value??'UNKNOWN'}</b>
  const count=moduleCount(id)
  return count>0?<b title="Références de navigation">{count}</b>:null
 }

 const openItem=(id:string)=>{setSelectedId(id);setTab('overview');location.hash=formatCssaHash({moduleId,selectedId:id})}
 const openModule=(id:string,picked='')=>{setModuleId(id);setSelectedId(picked);setQuery('');setTab('overview');location.hash=formatCssaHash({moduleId:id,selectedId:picked})}
 const switchStructure=(id:StructureId)=>{setStructureId(id);setModuleId('dashboard');setSelectedId('');setQuery('');setTab('overview');setDashboardMode('capabilities');location.hash=formatCssaHash({moduleId:'dashboard',selectedId:''})}
 const addProject=()=>{const title=projectName.trim();if(!title)return;setProjects(prev=>({...prev,[structureId]:[...prev[structureId],{id:'project:'+Date.now(),title,status:'LOCAL'}]}));setProjectName('')}

 const relations=selected&&native?.relations?native.relations.filter(r=>r.from===selected.id||r.to===selected.id):[]
 const historyRows=selected?.raw?Object.entries(selected.raw).filter(([k])=>/observ|created|updated|status|gate|phase|verification/i.test(k)):[]
 const semanticHistoryRows=selected&&!historyRows.length?[
  ['État',selected.status],
  ...(selected.meta?.Occurred?[['Occurred',selected.meta.Occurred] as [string,string]]:[]),
  ...(selected.meta?.Due?[['Due',selected.meta.Due] as [string,string]]:[]),
  ...(selected.meta?.Cadence?[['Cadence',selected.meta.Cadence] as [string,string]]:[]),
  ...(selected.meta?.Test?[['Suite de test',selected.meta.Test] as [string,string]]:[]),
  ['Provenance',selected.raw?'NATIVE_READ_MODEL':selected.kind==='source'?'CATALOGUE_PUBLIC':'CSSA_REPO_MODEL'],
 ]:[]
 const semanticLinks=selected?[
  ...selectedEvidence.map(e=>({label:e.phase+' · '+e.title,module:'tests',id:'test:'+e.id,type:'PROUVÉ_PAR'})),
  ...(selected.kind==='case'?[{label:'Tâche liée · '+selected.title,module:'tasks',id:selected.id.replace('case:','task:'),type:'ALIMENTE'}]:[]),
  ...(selected.kind==='task'?[{label:'CASE source · '+selected.title,module:'crm',id:selected.id.replace('task:','case:'),type:'PROVIENT_DE'}]:[]),
  ...(selected.kind==='team'?[{label:'Sportif',module:'sportif',id:'sport-r1',type:'ALIMENTE'},{label:'Tests saison complète',module:'tests',id:'test:F3E',type:'EXERCÉ_PAR'}]:[]),
  ...(selected.kind==='source'?[{label:'Tests veille publique',module:'tests',id:'test:F3G-D',type:'SURVEILLÉ_PAR'}]:[]),
 ]:[]
 const statusTone=(v:string)=>v.toLowerCase().replaceAll(' ','-').replaceAll('/','-')
 const moduleLabel=structure.modules.find(m=>m.id===moduleId)?.label||humanizeCode(moduleId)
 const deepCrumbs=location.hash.startsWith('#cssa/'+moduleId+'/')
  ? location.hash.slice(('#cssa/'+moduleId+'/').length).split('/').filter(Boolean).map(x=>decodeURIComponent(x))
  : []
 const crumbLabel=(value:string)=>{
  if(/^r\d?-?j\d+/i.test(value)||/^u\d+/i.test(value))return humanizeCode(value.replaceAll('-','_'))
  return humanizeCode(value)
 }

 return <main className="u-shell">
  <aside className="u-sidebar">
   <div className="u-brand"><span>◆</span><div><strong>OBSIDIA</strong><small>Écosystème IA universel</small></div></div>
   <div className="u-context-card"><small>STRUCTURE ACTUELLE</small><strong>{structure.name}</strong><span>{structure.subtitle}</span><em>{native?.available?'● connecté':'○ readonly'}</em></div>
   <nav className="u-nav">
    {structureId === 'cssa' ? (
      cssaNavSections.map(sec => {
        const secModules = structure.modules.filter(m => sec.moduleIds.includes(m.id))
        if (!secModules.length) return null
        return (
          <div key={sec.title} className={'u-nav-group '+(sec.moduleIds.includes(moduleId)?'active-group':'')}>
            <div className="u-nav-group-title">{sec.title}</div>
            {secModules.map(m => (
              <a
                key={m.id}
                href={'#cssa/' + m.id}
                className={moduleId === m.id ? 'active' : ''}
                onClick={() => openModule(m.id)}
              >
                <span><UiIcon name={m.icon} /></span>
                <strong>{m.label}</strong>
                {moduleBadge(m.id)}
              </a>
            ))}
          </div>
        )
      }).concat(showTechDetails ? [(
        <div key="advanced" className="u-nav-group u-nav-advanced">
          <div className="u-nav-group-title">AVANCÉ / AUDIT</div>
          {structure.modules.filter(m=>cssaAdvancedModuleIds.includes(m.id)).map(m=>(
            <a key={m.id} href={'#cssa/'+m.id} className={moduleId===m.id?'active':''} onClick={()=>openModule(m.id)}>
              <span><UiIcon name={m.icon}/></span><strong>{m.label}</strong>{moduleBadge(m.id)}
            </a>
          ))}
        </div>
      )] : [])
    ) : (
      structure.modules.map(m => (
        <a
          key={m.id}
          href={'#cssa/' + m.id}
          className={moduleId === m.id ? 'active' : ''}
          onClick={() => openModule(m.id)}
        >
          <span><UiIcon name={m.icon} /></span>
          <strong>{m.label}</strong>
          {moduleBadge(m.id)}
        </a>
      ))
    )}
   </nav>
   <div className="u-switch"><small>CHANGER DE STRUCTURE</small>{structures.map(s=><button key={s.id} className={structureId===s.id?'active':''} onClick={()=>switchStructure(s.id)}><span><UiIcon name={s.id==='trading'?'reporting':s.id==='gps'?'field':'organisation'}/></span>{s.name}</button>)}</div>
  </aside>

  <section className="u-main">
   <header className={'u-top '+(structureId==='cssa'?'u-top-cssa':'')}>
    <div className="u-top-context">
     <div className="u-breadcrumb"><a href="#cssa/dashboard">{structureId==='cssa'?'CSSA':structure.name}</a><span>›</span>{deepCrumbs.length?<a href={'#cssa/'+moduleId}>{moduleLabel}</a>:<strong>{moduleLabel}</strong>}{deepCrumbs.map((part,index)=><span className="u-breadcrumb-deep" key={part+index}><span>›</span>{index===deepCrumbs.length-1?<strong>{crumbLabel(part)}</strong>:<a href={'#cssa/'+moduleId+'/'+deepCrumbs.slice(0,index+1).map(encodeURIComponent).join('/')}>{crumbLabel(part)}</a>}</span>)}</div>
     {structureId!=='cssa'&&<><h1>{moduleId==='dashboard'?'Dashboard ':''}{structure.name}</h1><p>{structure.subtitle}</p></>}
    </div>
    <div className="u-top-actions">
      <span className="u-badge">{structure.badge}</span>
      <button type="button" className="u-btn-tech-toggle" onClick={()=>setShowTechDetails(prev=>!prev)} title="Afficher/masquer les métriques techniques">
        {showTechDetails ? '⚙️ Masquer technique ▴' : '⚙️ Détails techniques ▾'}
      </button>
      <button onClick={refresh} disabled={refreshing}><UiIcon name="refresh"/>{refreshing?'Lecture…':'Rafraîchir'}</button>
    </div>
   </header>

   {showTechDetails && (
     <div className="u-tech-details-container">
       <div className="u-contract-line"><span>domain_id <b>{profile.domainId}</b></span><span>adapter <b>{profile.adapterId}</b></span><span>contract <b>{profile.contract}</b></span><span>source <a href={profile.sourceUrl} target="_blank" rel="noreferrer">{profile.source} ↗</a></span></div>
       <div className="u-runtime-strip"><span className={world?'ok':'off'}>WORLD {world?'CONNECTED':'UNAVAILABLE'}</span><span className={native?.available?'ok':'off'}>STORE {native?.available?'CONNECTED':'UNAVAILABLE'}</span><span>{entities.length} objets natifs</span><span>{liveServices.length} services</span><span>{decisions.length} décisions</span>{native?.projection_hash&&<span>projection {native.projection_hash.slice(0,12)}…</span>}</div>
     </div>
   )}

   {moduleId==='dashboard'&&structureId==='cssa'?(
    <CSSAHomePage contradictions={profile.contradictions} onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='sportif'&&structureId==='cssa'?(
    <CSSASportWorkspace/>
   ):moduleId==='organisation'&&structureId==='cssa'?(
    <CSSAOrganisationVisualPage items={items} selectedId={selectedId} onOpen={openItem} onClear={()=>openModule('organisation')} onNavigate={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='dossiers'&&structureId==='cssa'?(
    <CSSADossiersPage selectedId={selectedId} onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='documents'&&structureId==='cssa'?(
    <CSSADocumentsPage selectedId={selectedId} onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='commercial'&&structureId==='cssa'?(
    <CSSACommercePage onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='finance'&&structureId==='cssa'?(
    <CSSAFinancePage onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='media'&&structureId==='cssa'?(
    <CSSAMediaPage onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='mail'&&structureId==='cssa'?(
    <CSSAMailPage selectedId={selectedId} onOpen={(mod,id)=>openModule(mod,id||'')}/>
   ):moduleId==='crm'&&structureId==='cssa'?(
    <CSSACrmPage selectedId={selectedId} onSelect={(mod,id)=>openModule(mod,id)}/>
   ):moduleId==='tasks'&&structureId==='cssa'?(
    <CSSATasksPage selectedId={selectedId} onSelect={(mod,id)=>openModule(mod,id)}/>
   ):moduleId==='admin'&&structureId==='cssa'?(
    <CSSAAdminPage selectedId={selectedId} onSelect={(mod,id)=>openModule(mod,id)}/>
   ):moduleId==='matchday'&&structureId==='cssa'?(
    <CSSAMatchdayPage selectedId={selectedId} onSelect={(mod,id)=>openModule(mod,id)}/>
   ):moduleId==='dashboard'?<div className="u-dashboard-grid">
    <section className="u-dashboard-summary">
     {structureId==='cssa'&&<p>Projection des registres locaux · UNKNOWN si indisponibles. Références historiques signalées ; aucune autorisation déduite.</p>}
     <div className="u-summary-cards">
      <button className={dashboardMode==='capabilities'?'active':''} onClick={()=>{setDashboardMode('capabilities');setSelectedId('')}}><small>CAPACITÉS</small><strong>{profile.capabilities.length}</strong><span>{provenCount} établies</span></button>
      <button className={dashboardMode==='evidence'?'active':''} onClick={()=>{setDashboardMode('evidence');setSelectedId('')}}><small>PREUVES</small><strong>{profile.evidence.length}</strong><span>observables</span></button>
      <button className={dashboardMode==='unknowns'?'active':''} onClick={()=>{setDashboardMode('unknowns');setSelectedId('')}}><small>UNKNOWNS</small><strong>{profile.unknowns.length}</strong><span>conservés</span></button>
      <button className={dashboardMode==='risks'?'active':''} onClick={()=>{setDashboardMode('risks');setSelectedId('')}}><small>RISQUES</small><strong>{profile.risks.length}</strong><span>{openCount} ouverts / HOLD</span></button>
     </div>
     {structureId==='cssa'&&<section className="u-mini-panel u-club-snapshot"><header><h3>Club public 2026–2027</h3><b>19</b></header>
      <div className="u-club-metrics"><span><strong>R1</strong><small>Équipe première</small></span><span><strong>R2</strong><small>Réserve</small></span><span><strong>800</strong><small>Abonnés officiel</small></span><span><strong>50+</strong><small>Partenaires</small></span></div>
      <button onClick={()=>openModule('organisation','org-overview')}>Explorer l’organisation →</button>
     </section>}
     {structureId==='cssa'&&<section className="u-mini-panel u-test-summary"><header><h3>Tests Sedan</h3><b>{cssaTestEvidence.length}</b></header>
      <div className="u-test-summary-grid"><span><strong>904</strong><small>événements saison</small></span><span><strong>15 120</strong><small>profils adversariaux</small></span><span><strong>16</strong><small>cas buvette</small></span><span><strong>5</strong><small>fixtures CRM/TASKS</small></span></div>
      <button onClick={()=>openModule('tests','test:F3E')}>Voir les preuves de test →</button>
     </section>}
     <section className="u-mini-panel"><header><h3>Runtime réel</h3><b>{liveServices.length}</b></header>{liveServices.length?liveServices.map(s=><div className="u-runtime-row" key={s.id}><span className={'dot '+(s.observedState==='READY'?'ready':'')}></span><strong>{s.label}</strong><small>{String(s.observedState||s.phase||'OBSERVED')}</small></div>):<p>Aucun service natif observé pour cette structure.</p>}</section>
     <section className="u-mini-panel"><header><h3>Décisions observées</h3><b>{decisions.length}</b></header>{decisions.slice(0,4).map(d=><div className="u-compact-row" key={d.id}><strong>{d.label}</strong><small>{String(d.gate||d.status||'OBSERVED')}</small></div>)}{!decisions.length&&<p>Aucun record local correspondant au domaine.</p>}</section>
    </section>

    <section className="u-dashboard-center">
     <header><div><small>VUE SÉMANTIQUE</small><h2>{dashboardMode==='capabilities'?'Capacités':dashboardMode==='unknowns'?'Unknowns':dashboardMode==='risks'?'Risques':dashboardMode==='evidence'?'Preuves':'Contradictions'}</h2></div><span>{dashboardItems.length}</span></header>
     <div className="u-cap-list">{dashboardItems.map(item=><button key={item.id} className={selectedDashboardItem?.id===item.id?'active':''} onClick={()=>{setSelectedId(item.id);location.hash='cssa/dashboard/'+encodeURIComponent(item.id)}}><span className={'u-status '+statusTone(item.status)}>{item.status}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div><b>›</b></button>)}</div>
     <div className="u-dashboard-switches">
      <button className={dashboardMode==='capabilities'?'active':''} onClick={()=>{setDashboardMode('capabilities');setSelectedId('')}}>Capacités {profile.capabilities.length}</button>
      <button className={dashboardMode==='unknowns'?'active':''} onClick={()=>{setDashboardMode('unknowns');setSelectedId('')}}>Unknowns {profile.unknowns.length}</button>
      <button className={dashboardMode==='contradictions'?'active':''} onClick={()=>{setDashboardMode('contradictions');setSelectedId('')}}>Contradictions {profile.contradictions.length}</button>
      <button className={dashboardMode==='risks'?'active':''} onClick={()=>{setDashboardMode('risks');setSelectedId('')}}>Risques {profile.risks.length}</button>
      <button className={dashboardMode==='evidence'?'active':''} onClick={()=>{setDashboardMode('evidence');setSelectedId('')}}>Preuves {profile.evidence.length}</button>
     </div>
    </section>

    <aside className="u-inspector dashboard-inspector">
     {selectedDashboardItem?<><header><div><small>{selectedDashboardItem.kind.toUpperCase()}</small><h2>{selectedDashboardItem.title}</h2><p>{selectedDashboardItem.subtitle}</p></div><span className={'u-badge '+statusTone(selectedDashboardItem.status)}>{selectedDashboardItem.status}</span></header>
      <section className="u-info"><h3>Comprendre cet objet</h3><dl>
       <div><dt>But</dt><dd>{selectedDashboardItem.semantic.purpose}</dd></div>
       <div><dt>Contexte</dt><dd>{selectedDashboardItem.semantic.context}</dd></div>
       <div><dt>Observe / contient</dt><dd>{selectedDashboardItem.semantic.observes}</dd></div>
       <div><dt>Alimente</dt><dd>{selectedDashboardItem.semantic.feeds}</dd></div>
       <div><dt>Impact possible</dt><dd>{selectedDashboardItem.semantic.impact}</dd></div>
       <div className="limit"><dt>Limite</dt><dd>{selectedDashboardItem.semantic.limits}</dd></div>
      </dl></section>
      {selectedDashboardItem.id.startsWith('cap:')&&selectedCapability&&<section className="u-info"><h3>Preuves / détails de capacité</h3>{selectedCapability.details.map(d=><div className="u-detail-line" key={d}>◆ <span>{d}</span></div>)}</section>}
      <section className="u-meta"><h3>Provenance / gouvernance</h3><div><small>Autorité</small><strong>KX108_ONLY</strong></div><div><small>Contrat</small><strong>{profile.contract}</strong></div><div><small>Adapter</small><strong>{profile.adapterId}</strong></div><div><small>Source</small><a href={profile.sourceUrl} target="_blank" rel="noreferrer">{profile.source} ↗</a></div>{selectedDashboardItem.meta&&Object.entries(selectedDashboardItem.meta).map(([k,v])=><div key={k}><small>{k}</small><strong>{v}</strong></div>)}</section>
     </>:<div className="u-empty big"><strong>Aucun objet dans cette vue</strong><p>Rien n’est inventé.</p></div>}
    </aside>
   </div>:<div className="u-workspace">
    <section className="u-list-pane">
     <header><div><small>{structure.name.toUpperCase()} · {moduleId.toUpperCase()}</small><h2>{structure.modules.find(m=>m.id===moduleId)?.label}</h2></div><span>{items.length}</span></header>
     {moduleId==='projects'?<div className="u-project-create"><input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Nom du projet local"/><button onClick={addProject}>+ Ajouter</button></div>:<div className="u-search"><span><UiIcon name="search"/></span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans cette vue…"/></div>}
     <div className="u-list">{items.map(item=><button key={item.id} className={selectedId===item.id?'active':''} onClick={()=>openItem(item.id)}><span className="u-item-icon"><UiIcon name={item.kind==='source'?'source':item.kind==='task'?'task':item.kind==='case'?'crm':item.kind==='team'?'sportif':item.kind==='role'?'organisation':item.kind==='commercial'?'commercial':item.kind==='finance'?'finance':'organisation'}/></span><span className="u-item-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span><span className={'u-status '+statusTone(item.status)}>{item.status}</span></button>)}{!items.length&&<div className="u-empty"><strong>Aucun objet observé</strong><p>La vue reste vide plutôt que d’inventer des données.</p></div>}</div>
    </section>

    <aside className="u-inspector">
     {selected?<>
      <header className="u-detail-hero"><span className="u-detail-icon"><UiIcon name={selected.kind==='source'?'source':selected.kind==='team'?'sportif':selected.kind==='role'?'organisation':selected.kind==='commercial'?'commercial':selected.kind==='finance'?'finance':selected.kind==='task'?'task':selected.kind==='case'?'crm':'organisation'}/></span><div><small>{selected.kind.toUpperCase()}</small><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className={'u-badge '+statusTone(selected.status)}>{selected.status}</span></header>
      <div className="u-tabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Vue d’ensemble</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>Historique</button><button className={tab==='relations'?'active':''} onClick={()=>setTab('relations')}>Liens & relations ({relations.length+semanticLinks.length})</button></div>
      <div className="u-object-actions">
       {selected.kind==='case'&&<button onClick={()=>openModule('tasks',selected.id.replace('case:','task:'))}>Voir la tâche liée</button>}
       {selected.kind==='task'&&<button onClick={()=>openModule('crm',selected.id.replace('task:','case:'))}>Voir le CASE lié</button>}
       {selectedEvidence.length>0&&<button onClick={()=>openModule('tests','test:'+selectedEvidence[0].id)}>Ouvrir la preuve principale</button>}
       {selected.kind==='team'&&<button onClick={()=>openModule('tests','test:F3E')}>Voir simulation saison</button>}
      </div>
      {tab==='overview'&&<>
       <div className="u-overview-grid"><section className="u-info"><h3>Informations générales</h3><dl><div><dt>But</dt><dd>{selected.semantic.purpose}</dd></div><div><dt>Contexte</dt><dd>{selected.semantic.context}</dd></div><div><dt>Ce qu’on observe</dt><dd>{selected.semantic.observes}</dd></div><div><dt>Alimente</dt><dd>{selected.semantic.feeds}</dd></div><div><dt>Impact possible</dt><dd>{selected.semantic.impact}</dd></div><div className="limit"><dt>Limite</dt><dd>{selected.semantic.limits}</dd></div></dl></section>
       {selected.meta&&<section className="u-meta u-meta-side"><h3>Fiche objet</h3>{Object.entries(selected.meta).map(([k,v])=><div key={k}><small>{k}</small>{(k==='URL'||k==='Lien test')?<a href={v} target="_blank" rel="noreferrer">{v} ↗</a>:<strong>{v}</strong>}</div>)}</section>}</div>
       {structureId==='cssa'&&<section className="u-dossier-section">
        <header><div><small>DOSSIER SEDAN</small><h3>Preuves de test liées</h3></div><span>{selectedEvidence.length}</span></header>
        {selectedEvidence.length?<div className="u-test-evidence-list">{selectedEvidence.map(e=><article key={e.id}>
          <div className="u-test-head"><span className="u-test-phase">{e.phase}</span><div><strong>{e.title}</strong><small>{e.truth}</small></div><b>{e.status}</b></div>
          <p>{e.summary}</p>
          <div className="u-test-metrics">{Object.entries(e.metrics).map(([k,v])=><span key={k}><small>{k}</small><strong>{v}</strong></span>)}</div>
          <details><summary>Ce que ce test prouve</summary>{e.proves.map(x=><p key={x}>✓ {x}</p>)}<h4>Limites</h4>{e.limits.map(x=><p key={x}>— {x}</p>)}</details>
          <a href={e.url} target="_blank" rel="noreferrer">Voir le test réel sur GitHub ↗</a>
        </article>)}</div>:<p className="u-empty-inline">Aucune suite de test directement rattachée à cet objet.</p>}
       </section>}
       {selected.kind==='team'&&<section className="u-dossier-section">
        <header><div><small>CONTEXTE ÉQUIPE</small><h3>{selected.title}</h3></div><span>{selected.meta?.['Compétition']||'—'}</span></header>
        <div className="u-object-facts">
         <div><small>Saison</small><strong>{selected.meta?.['Saison']||'2026–2027'}</strong></div>
         <div><small>Tier</small><strong>{selected.meta?.['Tier']||'—'}</strong></div>
         <div><small>Compétition</small><strong>{selected.meta?.['Compétition']||'—'}</strong></div>
         <div><small>Vérité</small><strong>{selected.status}</strong></div>
        </div>
        <p>Cette équipe est reliée au modèle saison, aux fixtures synthétiques, à la logistique, au matchday, au reporting et aux stress tests. Le staff réel, les disponibilités, le budget et les moyens terrain ne sont pas inférés.</p>
       </section>}
       {selected.kind==='test'&&<section className="u-dossier-section">
        <header><div><small>LECTURE DU TEST</small><h3>Frontière de vérité</h3></div></header>
        <p><strong>{selected.status}</strong> décrit la classe de vérité du jeu de données ou de la suite. Cela ne signifie pas que les événements simulés ont eu lieu au CSSA.</p>
       </section>}
       {selected.kind==='source'&&selected.meta?.URL&&<div className="u-real-link-row"><a href={selected.meta.URL} target="_blank" rel="noreferrer">Ouvrir la source réelle ↗</a></div>}{selected.raw?<section className="u-observation"><h3>Dernière observation</h3><div className="u-observation-head"><span className="obs-ok">✓</span><div><small>STATUT</small><strong>{String(selected.raw.verification||selected.raw.status||selected.raw.gate||'OBSERVED')}</strong></div><div><small>OBSERVÉ</small><strong>{String(selected.raw.observed_at||selected.raw.observedAt||'persisté')}</strong></div></div><div className="u-meta compact">{Object.entries(selected.raw).filter(([k])=>!['label'].includes(k)).slice(0,12).map(([k,v])=><div key={k}><small>{k}</small><strong>{String(v??'—')}</strong></div>)}</div></section>:structureId==='cssa'&&selected.kind==='source'&&<section className="u-notice"><strong>CATALOGUE · PAS ENCORE OBSERVÉ</strong><p>Le contexte est documenté, mais aucune capture native correspondante n’est encore persistée.</p></section>}
      </>}
      {tab==='history'&&<section className="u-info"><h3>Historique observable</h3>{(historyRows.length?historyRows:semanticHistoryRows).length?(historyRows.length?historyRows:semanticHistoryRows).map(([k,v])=><div className="u-history-row" key={String(k)}><small>{String(k)}</small><strong>{String(v??'—')}</strong></div>):<p>Aucun historique disponible pour cet objet.</p>}</section>}
      {tab==='relations'&&<section className="u-info"><h3>Liens & relations</h3>
       {relations.map((r,i)=><div className="u-history-row" key={'native:'+i}><small>{r.type}</small><strong>{r.from} → {r.to}</strong></div>)}
       {semanticLinks.map((r,i)=><button className="u-relation-link" key={'semantic:'+i} onClick={()=>openModule(r.module,r.id)}><span>{r.type}</span><strong>{r.label}</strong><b>Ouvrir →</b></button>)}
       {!relations.length&&!semanticLinks.length&&<p>Aucune relation connue pour cet objet.</p>}
      </section>}
     </>:<div className="u-empty big"><strong>Sélectionne un objet</strong><p>Le détail apparaîtra ici.</p></div>}
    </aside>
   </div>}

   {(structureId!=='cssa'||showTechDetails)&&<footer className="u-governance-footer"><span>Domain state</span><b>→</b><span>Governance payload</span><b>→</b><span>KX108</span><b>→</b><span>Decision</span><b>→</b><span>Execution gate</span><b>→</b><span>Receipt</span></footer>}
  </section>
 </main>
}
