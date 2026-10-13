import {useEffect,useMemo,useState} from 'react'
import './CSSAPage.css'

type Semantic={purpose:string;context:string;observes:string;feeds:string;impact:string;limits:string}
type SourceItem={id:string;title:string;url:string;truthClass:string;cadence:string;criticality:string;semantic:Semantic}
type NativeEntity={id:string;kind:string;label:string;status?:string|null;priority?:string|null;verification?:string;gate?:string|null;domainId?:string;agentId?:string;nativeService?:boolean;observedState?:string;phase?:string;decisionAuthority?:string;[key:string]:unknown}
type NativeReadModel={available?:boolean;reason?:string;entities?:NativeEntity[];relations?:{from:string;type:string;to:string}[];projection_hash?:string;availability?:Record<string,string>}
type WorldState={entities?:NativeEntity[];decisionAuthority?:string;observedAt?:string}
type ViewItem={id:string;title:string;subtitle:string;kind:string;status:string;semantic:Semantic;meta?:Record<string,string>;raw?:NativeEntity}

type StructureId='cssa'|'trading'|'gps'
type ModuleDef={id:string;label:string;icon:string;kindFilter?:string[]}
type StructureDef={id:StructureId;name:string;subtitle:string;badge:string;modules:ModuleDef[]}

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
{id:'dashboard',label:'Dashboard',icon:'⌂'},{id:'sources',label:'Sources',icon:'◔'},{id:'crm',label:'CRM',icon:'♙',kindFilter:['case','interaction','followup','relationship']},{id:'tasks',label:'Tâches',icon:'☑',kindFilter:['task']},{id:'admin',label:'Administration',icon:'⚙'},{id:'mail',label:'Mail',icon:'✉'},{id:'reporting',label:'Reporting',icon:'▤'},{id:'matchday',label:'Matchday',icon:'◈'},{id:'finance',label:'Finance',icon:'◉'},{id:'governance',label:'Gouvernance',icon:'◫',kindFilter:['decision','receipt']},{id:'field',label:'Réalité terrain',icon:'◇'}]},
{id:'trading',name:'Trading',subtitle:'Domaine trading gouverné',badge:'PAPER ONLY',modules:[
{id:'dashboard',label:'Dashboard',icon:'⌂'},{id:'market',label:'Market data',icon:'◉'},{id:'signals',label:'Signaux',icon:'⌁'},{id:'strategies',label:'Stratégies',icon:'◇'},{id:'risk',label:'Risk',icon:'△'},{id:'paper',label:'Paper execution',icon:'↗'},{id:'reporting',label:'Reporting',icon:'▤'},{id:'governance',label:'Gouvernance',icon:'◫'},{id:'proof',label:'Proof / receipts',icon:'▣'}]},
{id:'gps',name:'GPS / Défense',subtitle:'GNSS · RF · aviation',badge:'RECORDED REAL',modules:[
{id:'dashboard',label:'Dashboard',icon:'⌂'},{id:'sensors',label:'Sources capteurs',icon:'⌁'},{id:'gnss',label:'GNSS',icon:'⌖'},{id:'rf',label:'RF',icon:'⌁'},{id:'incidents',label:'Incidents',icon:'!'},{id:'classification',label:'Classification',icon:'◈'},{id:'evidence',label:'Evidence',icon:'▣'},{id:'governance',label:'Gouvernance',icon:'◫'},{id:'receipts',label:'Receipts',icon:'▤'},{id:'field',label:'Réalité terrain',icon:'◇'}]},
]

const semantics:Record<string,Semantic>={
crm:{purpose:'Conserver les dossiers et relations métier structurés.',context:'Mémoire opérationnelle native, sans autorité.',observes:'CASE, interactions, follow-ups et relations.',feeds:'TASKS, reporting et revues.',impact:'Structure le suivi d’un dossier.',limits:'Un objet CRM n’autorise aucune action externe.'},
tasks:{purpose:'Transformer un besoin validé en travail suivi.',context:'Travail canonique avec état et échéance.',observes:'Tâches, priorité, responsable et dépendances.',feeds:'Suivi opérationnel et CRM.',impact:'Rend visible ce qui doit être fait.',limits:'TASK ≠ décision ≠ exécution.'},
governance:{purpose:'Préserver la frontière d’autorité.',context:'Le domaine décrit et propose ; KX108 tranche.',observes:'Unknowns, contradictions, risques, preuves et décisions.',feeds:'Gates et receipts.',impact:'Empêche une auto-autorisation.',limits:'KX108_ONLY affiché ne signifie pas qu’une action est autorisée.'},
reporting:{purpose:'Rendre l’état compréhensible.',context:'Projection structurée des faits disponibles.',observes:'Indicateurs, changements, risques et preuves.',feeds:'Pilotage humain.',impact:'Aide à décider quoi regarder ensuite.',limits:'Un rapport ne crée pas de vérité nouvelle.'},
field:{purpose:'Identifier ce qui manque pour connaître la réalité terrain.',context:'Zone volontairement ouverte tant qu’elle n’est pas auditée.',observes:'Droits, pratiques, accès, handoffs et validations.',feeds:'Correction du modèle métier.',impact:'Empêche de confondre modèle et réel.',limits:'Aucun fait terrain absent ne doit être inventé.'},
}

const catalogueItems:Record<StructureId,Record<string,ViewItem[]>>={
cssa:{
admin:[mk('cssa-admin','Administration CSSA','Contrats, conformité, procédures','admin','PROVEN','Structurer les obligations et procédures publiques.')],
mail:[mk('cssa-mail','Mail gouverné','Preflight prouvé · envoi externe HOLD','mail','HOLD','Préparer une communication sans donner d’autorité d’envoi.')],
reporting:[mk('cssa-reporting','Reporting CSSA','Cadences weekly / biweekly / monthly','reporting','PROVEN','Projeter l’état selon le destinataire.')],
matchday:[mk('cssa-matchday','Matchday','Buvette, shifts, fournisseurs','matchday','PROVEN','Structurer la préparation des jours de match.')],
finance:[mk('cssa-finance','Finance publique','Tarifs et modèle saison public','finance','PROVEN','Projeter les informations financières publiques disponibles.')],
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
receipts:[mk('gps-rec','Receipts','Claim matrix / preuves','receipts','PROVEN','Conserver les traces de preuve et de replay.')],
field:[mk('gps-field','Réalité terrain','IMU/radar et attribution encore ouverts','field','OPEN','Rendre visibles les trous de réalité physique.')],
}
}

function mk(id:string,title:string,subtitle:string,kind:string,status:string,purpose:string):ViewItem{
 const base=semantics[kind]??{purpose,context:subtitle,observes:'État et métadonnées disponibles.',feeds:'Inspection et workflows associés.',impact:'Rend la situation compréhensible sans ajouter d’autorité.',limits:'L’interface ne fabrique aucune donnée absente.'}
 return {id,title,subtitle,kind,status,semantic:{...base,purpose}}
}

function semanticForNative(e:NativeEntity):Semantic{
 const k=String(e.kind||'').toLowerCase()
 if(k==='task')return semantics.tasks
 if(['case','interaction','followup','relationship'].includes(k))return semantics.crm
 if(['decision','receipt','world_action'].includes(k))return semantics.governance
 if(k==='source')return {purpose:'Conserver une observation sourcée et vérifiable.',context:'Objet issu du source runtime.',observes:'Provenance, état et empreintes disponibles.',feeds:'Interprétation métier et revue.',impact:'Peut déclencher une analyse ou contradiction.',limits:'SOURCE ≠ TRUST et observation ≠ conclusion.'}
 return {purpose:'Inspecter un objet natif observé.',context:'Objet exposé par le read model.',observes:'Métadonnées persistées.',feeds:'Audit et inspection.',impact:'Apporte du contexte sans autorité.',limits:'Les champs absents ne sont pas complétés.'}
}

export default function CSSAPage(){
 const [structureId,setStructureId]=useState<StructureId>('cssa')
 const [moduleId,setModuleId]=useState('dashboard')
 const [world,setWorld]=useState<WorldState|null>(null)
 const [native,setNative]=useState<NativeReadModel|null>(null)
 const [query,setQuery]=useState('')
 const [selectedId,setSelectedId]=useState('')
 const [refreshing,setRefreshing]=useState(false)

 const structure=structures.find(s=>s.id===structureId)!
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

 const observedSources=useMemo(()=>entities.filter(e=>e.kind==='source'),[entities])
 const nativeByModule=useMemo(()=>{
  const mod=structure.modules.find(m=>m.id===moduleId)
  if(!mod?.kindFilter)return []
  return entities.filter(e=>mod.kindFilter!.includes(String(e.kind||'').toLowerCase()))
 },[entities,moduleId,structure])

 const items=useMemo<ViewItem[]>(()=>{
  let rows:ViewItem[]=[]
  if(structureId==='cssa'&&moduleId==='sources'){
   rows=cssaSources.map(s=>{
    const observed=observedSources.find(e=>e.id===s.id||String(e.label||'').includes(s.id))
    return {id:s.id,title:s.title,subtitle:s.semantic.purpose,kind:'source',status:observed?'OBSERVED':'CATALOGUE',semantic:s.semantic,meta:{URL:s.url,Cadence:s.cadence,Criticité:s.criticality,'Classe de vérité':s.truthClass},raw:observed}
   })
  }else if(nativeByModule.length){
   rows=nativeByModule.map(e=>({id:e.id,title:e.label||e.id,subtitle:String(e.status||e.verification||e.gate||'OBSERVED'),kind:String(e.kind),status:String(e.status||e.verification||e.gate||'OBSERVED'),semantic:semanticForNative(e),raw:e}))
  }else if(moduleId==='dashboard'){
   const observed=entities.slice(0,8).map(e=>({id:e.id,title:e.label||e.id,subtitle:String(e.kind),kind:String(e.kind),status:String(e.status||e.verification||e.gate||'OBSERVED'),semantic:semanticForNative(e),raw:e}))
   rows=observed.length?observed:Object.values(catalogueItems[structureId]).flat().slice(0,8)
  }else rows=catalogueItems[structureId][moduleId]??[]
  const q=query.trim().toLowerCase()
  return q?rows.filter(x=>(x.title+' '+x.subtitle+' '+x.kind+' '+x.status).toLowerCase().includes(q)):rows
 },[structureId,moduleId,entities,observedSources,nativeByModule,query])

 useEffect(()=>{
  if(!items.length){setSelectedId('');return}
  if(!items.some(x=>x.id===selectedId))setSelectedId(items[0].id)
 },[items,selectedId])

 const selected=items.find(x=>x.id===selectedId)??null
 const liveServices=worldEntities.filter(e=>e.kind==='session'&&e.nativeService)
 const decisions=worldEntities.filter(e=>e.kind==='decision_record')
 const moduleCount=(id:string)=>{
  if(structureId==='cssa'&&id==='sources')return cssaSources.length
  const m=structure.modules.find(x=>x.id===id)
  if(m?.kindFilter)return entities.filter(e=>m.kindFilter!.includes(String(e.kind||'').toLowerCase())).length
  return catalogueItems[structureId][id]?.length??0
 }

 const switchStructure=(id:StructureId)=>{setStructureId(id);setModuleId('dashboard');setSelectedId('');setQuery('')}

 return <main className="u-shell">
  <aside className="u-sidebar">
   <div className="u-brand"><span>◆</span><div><strong>OBSIDIA</strong><small>Écosystème IA universel</small></div></div>
   <div className="u-context-card"><small>STRUCTURE ACTUELLE</small><strong>{structure.name}</strong><span>{structure.subtitle}</span><em>{native?.available?'● connecté':'○ readonly'}</em></div>
   <nav className="u-nav">
    {structure.modules.map(m=><button key={m.id} className={moduleId===m.id?'active':''} onClick={()=>{setModuleId(m.id);setSelectedId('')}}>
     <span>{m.icon}</span><strong>{m.label}</strong>{moduleCount(m.id)>0&&<b>{moduleCount(m.id)}</b>}
    </button>)}
   </nav>
   <div className="u-switch"><small>CHANGER DE STRUCTURE</small>
    {structures.map(s=><button key={s.id} className={structureId===s.id?'active':''} onClick={()=>switchStructure(s.id)}><span>◆</span>{s.name}</button>)}
   </div>
  </aside>

  <section className="u-main">
   <header className="u-top">
    <div><h1>{moduleId==='dashboard'?'Dashboard ':''}{structure.name}</h1><p>{structure.subtitle} · shell universel readonly</p></div>
    <div className="u-top-actions"><span className="u-badge">{structure.badge}</span><button onClick={refresh} disabled={refreshing}>{refreshing?'Lecture…':'Rafraîchir'}</button></div>
   </header>

   <div className="u-runtime-strip">
    <span className={world?'ok':'off'}>WORLD {world?'CONNECTED':'UNAVAILABLE'}</span>
    <span className={native?.available?'ok':'off'}>STORE {native?.available?'CONNECTED':'UNAVAILABLE'}</span>
    <span>{entities.length} objets natifs</span><span>{liveServices.length} services</span><span>{decisions.length} décisions</span>
   </div>

   <div className="u-workspace">
    <section className="u-list-pane">
     <header>
      <div><small>{structure.name.toUpperCase()} · {moduleId.toUpperCase()}</small><h2>{structure.modules.find(m=>m.id===moduleId)?.label}</h2></div>
      <span>{items.length}</span>
     </header>
     <div className="u-search"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher dans cette vue…"/></div>
     <div className="u-list">
      {items.map(item=><button key={item.id} className={selectedId===item.id?'active':''} onClick={()=>setSelectedId(item.id)}>
       <span className="u-item-icon">{item.kind==='source'?'◔':item.kind==='task'?'☑':item.kind==='case'?'♙':'◆'}</span>
       <span className="u-item-copy"><strong>{item.title}</strong><small>{item.subtitle}</small></span>
       <span className={'u-status '+item.status.toLowerCase().replaceAll(' ','-')}>{item.status}</span>
      </button>)}
      {!items.length&&<div className="u-empty"><strong>Aucun objet observé</strong><p>La vue reste vide plutôt que d’inventer des données.</p></div>}
     </div>
    </section>

    <aside className="u-inspector">
     {selected?<>
      <header><div><small>{selected.kind.toUpperCase()}</small><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className="u-badge">{selected.status}</span></header>
      <div className="u-tabs"><button className="active">Vue d’ensemble</button><button>Historique</button><button>Relations</button></div>
      <section className="u-info">
       <h3>Informations générales</h3>
       <dl>
        <div><dt>But</dt><dd>{selected.semantic.purpose}</dd></div>
        <div><dt>Contexte</dt><dd>{selected.semantic.context}</dd></div>
        <div><dt>Ce qu’on observe</dt><dd>{selected.semantic.observes}</dd></div>
        <div><dt>Alimente</dt><dd>{selected.semantic.feeds}</dd></div>
        <div><dt>Impact possible</dt><dd>{selected.semantic.impact}</dd></div>
        <div className="limit"><dt>Limite</dt><dd>{selected.semantic.limits}</dd></div>
       </dl>
      </section>
      {selected.meta&&<section className="u-meta"><h3>Métadonnées</h3>{Object.entries(selected.meta).map(([k,v])=><div key={k}><small>{k}</small><strong>{v}</strong></div>)}</section>}
      {selected.raw&&<section className="u-meta"><h3>État observé</h3>{Object.entries(selected.raw).filter(([k])=>!['label'].includes(k)).slice(0,14).map(([k,v])=><div key={k}><small>{k}</small><strong>{String(v??'—')}</strong></div>)}</section>}
      {structureId==='cssa'&&selected.kind==='source'&&!selected.raw&&<section className="u-notice"><strong>CATALOGUE · PAS ENCORE OBSERVÉ</strong><p>Le contexte est documenté, mais aucune capture native correspondante n’est encore persistée.</p></section>}
     </>:<div className="u-empty big"><strong>Sélectionne un objet</strong><p>Le détail apparaîtra ici.</p></div>}
    </aside>
   </div>
  </section>
 </main>
}
