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
            <div className="cssa-native-fields">
              {Object.entries(selectedNativeEntity).filter(([key])=>!['label'].includes(key)).map(([key,value])=><div key={key}><small>{key}</small><strong>{String(value??'—')}</strong></div>)}
            </div>
          </>:<><span className="cssa-kicker">INSPECTEUR</span><h3>Sélectionne un objet</h3><p>La page montre uniquement les métadonnées persistées fournies par le read model natif.</p></>}
        </aside>
      </div>}
    </section>

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
