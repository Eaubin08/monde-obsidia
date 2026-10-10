import {useMemo,useState} from 'react'
import './CSSAPage.css'

type StructureId=string
type Structure={
  id:StructureId
  name:string
  subtitle:string
  kind:string
  modules:{title:string;description:string}[]
}
type Project={id:string;title:string;status:string}
type CockpitKey='État général'|'Priorités'|'Activité'|'Échéances'|'Projets'|'Alertes / décisions'
type RealSource={label:string;path:string;status:string}

const defaultStructures:Structure[]=[
  {
    id:'cssa',
    name:'CSSA',
    subtitle:'Club Sportif Sedan Ardennes',
    kind:'Club sportif',
    modules:[
      {title:'Administration',description:'Documents, demandes, contrats, conventions et traitement administratif.'},
      {title:'CRM & relations',description:'Membres, supporters, partenaires, sponsors, institutions et historique des échanges.'},
      {title:'Communication',description:'Mails, campagnes, contenus, publications et cohérence des messages.'},
      {title:'Événements',description:'Matchs, billetterie, invitations, hospitalité, calendrier et organisation.'},
      {title:'Finances',description:'Budgets, factures, paiements, recettes, dépenses et justificatifs.'},
      {title:'Opérations',description:'Missions, processus, automatisations, responsables, blocages et livrables.'},
    ]
  },
  {
    id:'trading',
    name:'Trading',
    subtitle:'Structure de trading gouverné',
    kind:'Activité financière',
    modules:[
      {title:'Stratégies',description:'Règles, scénarios, univers suivis et conditions de déclenchement.'},
      {title:'Risque',description:'Exposition, limites, blocages, garde-fous et contrôles.'},
      {title:'Marchés',description:'Actifs, données observées, sessions et contexte de marché.'},
      {title:'Exécution',description:'Ordres proposés, autorisations, exécution PAPER et résultats.'},
      {title:'Performance',description:'Résultats, attribution, écarts et suivi des décisions.'},
      {title:'Opérations',description:'Sessions, tâches, incidents, reprises et maintenance.'},
    ]
  },
  {
    id:'association',
    name:'Association',
    subtitle:'Structure associative',
    kind:'Association',
    modules:[
      {title:'Administration',description:'Statuts, adhésions, documents et obligations.'},
      {title:'Membres',description:'Adhérents, bénévoles, rôles et relations.'},
      {title:'Communication',description:'Messages, campagnes, publications et information.'},
      {title:'Événements',description:'Rencontres, inscriptions, planning et logistique.'},
      {title:'Finances',description:'Cotisations, dépenses, subventions et justificatifs.'},
      {title:'Projets',description:'Actions, responsables, étapes et résultats.'},
    ]
  },
  {
    id:'entreprise',
    name:'Entreprise X',
    subtitle:'Structure commerciale',
    kind:'Entreprise',
    modules:[
      {title:'Administration',description:'Documents, contrats, conformité et traitement.'},
      {title:'CRM & ventes',description:'Prospects, clients, opportunités et suivi commercial.'},
      {title:'Marketing',description:'Campagnes, contenus, acquisition et marque.'},
      {title:'Finance',description:'Budgets, facturation, trésorerie et suivi.'},
      {title:'Production',description:'Livrables, qualité, capacité et opérations.'},
      {title:'Projets',description:'Roadmap, responsables, blocages et résultats.'},
    ]
  },
]

const CSSA_REPO='https://github.com/Eaubin08/cssa-v01--entreprise-universelle-domaien-obsidia-'
const CSSA_BRANCH='feat/cssa-native-ops-bridge-v0'
const cssaSource=(path:string)=>CSSA_REPO+'/blob/'+CSSA_BRANCH+'/'+path

const cssaRealModules:Record<string,RealSource[]>={
  'Administration':[
    {label:'Administration publique',path:'organizations/cssa/public_admin_v0.py',status:'PROVEN'},
    {label:'Contrats & conformité',path:'organizations/cssa/compliance/contract_compliance_v0.py',status:'PROVEN'},
    {label:'Workflows officiels',path:'organizations/cssa/workflows/official_correspondence_public_v0.yaml',status:'PROVEN'},
  ],
  'CRM & relations':[
    {label:'Bridge CRM/TASKS natif',path:'organizations/cssa/native_ops/cssa_native_ops_bridge_v0.py',status:'PROVEN'},
    {label:'Relations institutionnelles',path:'organizations/cssa/institutions/institutional_relations_v0.py',status:'PROVEN'},
    {label:'Progression bridge',path:'organizations/cssa/native_ops/f3h_d_native_ops_progress_v0.json',status:'181 PASS'},
  ],
  'Communication':[
    {label:'Mail gouverné',path:'organizations/cssa/execution/mail_governed_execution_v0.py',status:'PREFLIGHT PROVEN'},
    {label:'Reporting',path:'organizations/cssa/reporting/report_engine_v0.py',status:'PROVEN'},
    {label:'Veille publique',path:'organizations/cssa/watch/watchlist_v0.json',status:'14 SOURCES'},
  ],
  'Événements':[
    {label:'Matchday buvette/restauration',path:'organizations/cssa/matchday_food/buvette_restauration_v0.py',status:'PROVEN'},
    {label:'Modèle saison',path:'organizations/cssa/season/operating_map_v0.json',status:'PROVEN'},
    {label:'Changement de rencontre',path:'organizations/cssa/workflows/fixture_change_public_v0.yaml',status:'PROVEN'},
  ],
  'Finances':[
    {label:'Finance saison',path:'organizations/cssa/season/finance_v0.py',status:'PROVEN'},
    {label:'Primitives de gestion',path:'organizations/cssa/season/fm_management_primitives_v0.json',status:'PROVEN'},
    {label:'Bilan V0.1',path:'reports/CSSA_V01_BILAN_2026-10-07.md',status:'AUDITED'},
  ],
  'Opérations':[
    {label:'Native Ops bridge',path:'organizations/cssa/native_ops/cssa_native_ops_bridge_v0.py',status:'PROVEN'},
    {label:'Root cause / récurrence',path:'organizations/cssa/root_cause/root_cause_recurrence_v0.py',status:'PROVEN'},
    {label:'Stress organisationnel',path:'organizations/cssa/stress/organizational_stress_v0.py',status:'PROVEN'},
  ],
}

const cssaRealCockpit:Record<CockpitKey,{value:string;detail:string}>={
  'État général':{value:'Native bridge PROVEN',detail:'Branche de travail feat/cssa-native-ops-bridge-v0. CSSA → CRM/TASKS natifs prouvé.'},
  'Priorités':{value:'Terrain réel à valider',detail:'La réalité interne CSSA reste ouverte : rôles réels, outils, validations, boîtes mail et pratiques terrain.'},
  'Activité':{value:'181 tests PASS',detail:'F3H-D : 181 tests passés en 0,91 s pour le bridge CRM/TASKS natif.'},
  'Échéances':{value:'Watch public planifié',detail:'14 sources publiques sont définies avec cadences weekly / biweekly / monthly. Le cron reste dormant hors main.'},
  'Projets':{value:'Bridge + terrain',detail:'Le bridge natif est prouvé ; la prochaine frontière est la validation terrain réelle et l’activation contrôlée.'},
  'Alertes / décisions':{value:'Action externe HOLD',detail:'KX108_ONLY est préservé. Les actions externes réelles restent bloquées et la preuve terrain interne reste ouverte.'},
}

const cockpit:Record<CockpitKey,{value:string;detail:string}>={
  'État général':{value:'Prototype',detail:'Vue synthétique de la structure sélectionnée. Le raccordement runtime viendra ensuite.'},
  'Priorités':{value:'À définir / raccorder',detail:'Espace destiné aux priorités actives et à leur ordre de traitement.'},
  'Activité':{value:'Aucune activité live reliée',detail:'Les événements, missions et changements observés apparaîtront ici.'},
  'Échéances':{value:'Aucune échéance reliée',detail:'Deadlines, rendez-vous, obligations et dates importantes.'},
  'Projets':{value:'Emplacements disponibles',detail:'Accès aux projets propres à la structure sélectionnée.'},
  'Alertes / décisions':{value:'Aucune alerte observée',detail:'Décisions importantes, validations et alertes de gouvernance.'},
}

const newId=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():String(Date.now())

export default function CSSAPage(){
  const [structures,setStructures]=useState<Structure[]>(defaultStructures)
  const [selected,setSelected]=useState<StructureId>('cssa')
  const [selectedModule,setSelectedModule]=useState<string|null>(null)
  const [selectedCockpit,setSelectedCockpit]=useState<CockpitKey|null>(null)
  const [projects,setProjects]=useState<Record<string,Project[]>>({})
  const [showStructureForm,setShowStructureForm]=useState(false)
  const [showProjectForm,setShowProjectForm]=useState(false)
  const [structureName,setStructureName]=useState('')
  const [structureKind,setStructureKind]=useState('')
  const [projectName,setProjectName]=useState('')

  const current=useMemo(()=>structures.find(s=>s.id===selected)??structures[0],[structures,selected])
  const currentProjects=projects[current.id]??[]
  const module=current.modules.find(m=>m.title===selectedModule)??null
  const activeCockpit=current.id==='cssa'?cssaRealCockpit:cockpit
  const realSources=current.id==='cssa'&&module?cssaRealModules[module.title]??[]:[]

  const chooseStructure=(id:string)=>{
    setSelected(id)
    setSelectedModule(null)
    setSelectedCockpit(null)
    setShowProjectForm(false)
  }

  const addStructure=()=>{
    const name=structureName.trim()
    if(!name)return
    const id=newId()
    setStructures(prev=>[...prev,{
      id,
      name,
      subtitle:name,
      kind:structureKind.trim()||'Structure',
      modules:[
        {title:'Administration',description:'Documents, demandes et traitement.'},
        {title:'CRM & relations',description:'Contacts, partenaires et historique des échanges.'},
        {title:'Communication',description:'Messages, contenus et publications.'},
        {title:'Finances',description:'Budgets, paiements et justificatifs.'},
        {title:'Opérations',description:'Missions, processus et livrables.'},
        {title:'Projets',description:'Chantiers, responsables et résultats.'},
      ]
    }])
    setSelected(id)
    setStructureName('')
    setStructureKind('')
    setShowStructureForm(false)
  }

  const addProject=()=>{
    const title=projectName.trim()
    if(!title)return
    setProjects(prev=>({...prev,[current.id]:[...(prev[current.id]??[]),{id:newId(),title,status:'À cadrer'}]}))
    setProjectName('')
    setShowProjectForm(false)
  }

  return <main className="cssa-page">
    <section className="cssa-selector">
      <header>
        <div><span className="cssa-kicker">ENTREPRISES & ORGANISATIONS</span><h1>Structures</h1></div>
        <button className="cssa-add-structure" onClick={()=>setShowStructureForm(v=>!v)}>+ Ajouter</button>
      </header>

      {showStructureForm&&<div className="cssa-inline-form">
        <input value={structureName} onChange={e=>setStructureName(e.target.value)} placeholder="Nom de la structure"/>
        <input value={structureKind} onChange={e=>setStructureKind(e.target.value)} placeholder="Type : entreprise, association…"/>
        <button onClick={addStructure}>Créer</button>
        <button className="quiet" onClick={()=>setShowStructureForm(false)}>Annuler</button>
      </div>}

      <div className="cssa-structure-tabs">
        {structures.map(s=><button key={s.id} className={selected===s.id?'active':''} onClick={()=>chooseStructure(s.id)}>
          <strong>{s.name}</strong><small>{s.kind}</small>
        </button>)}
      </div>
    </section>

    <header className="cssa-hero">
      <div><span className="cssa-kicker">VUE SÉLECTIONNÉE</span><h1>{current.name}</h1><p>{current.subtitle}</p>{current.id==='cssa'&&<div className="cssa-live-strip"><span>READONLY RÉEL</span><b>F3H-D · NATIVE CRM/TASKS PROVEN</b><a href={CSSA_REPO+'/tree/'+CSSA_BRANCH} target="_blank" rel="noreferrer">Repo de travail ↗</a></div>}</div>
      <aside className="cssa-identity"><small>TYPE</small><strong>{current.kind}</strong><span>{current.subtitle}</span></aside>
    </header>

    <section className="cssa-section cssa-cockpit">
      <header><div><span className="cssa-kicker">VUE D’ENSEMBLE</span><h2>Cockpit général</h2></div><span className="cssa-prototype">PROTOTYPE</span></header>
      <div className="cssa-cockpit-grid">
        {(Object.entries(activeCockpit) as [CockpitKey,typeof activeCockpit[CockpitKey]][]).map(([label,data])=><button key={label} className={selectedCockpit===label?'active':''} onClick={()=>setSelectedCockpit(label)}>
          <small>{label}</small><strong>{label==='Projets'&&current.id!=='cssa'?currentProjects.length+' projet(s)':data.value}</strong>
        </button>)}
      </div>
      {selectedCockpit&&<aside className="cssa-detail-panel">
        <div><small>{selectedCockpit}</small><h3>{selectedCockpit==='Projets'&&current.id!=='cssa'?currentProjects.length+' projet(s)':activeCockpit[selectedCockpit].value}</h3><p>{activeCockpit[selectedCockpit].detail}</p></div>
        <button onClick={()=>setSelectedCockpit(null)}>Fermer</button>
      </aside>}
    </section>

    <section className="cssa-section">
      <header><div><span className="cssa-kicker">MÉTIERS</span><h2>Domaines et cas métiers</h2></div></header>
      <div className="cssa-module-grid">
        {current.modules.map(item=><button className={selectedModule===item.title?'cssa-module active':'cssa-module'} key={item.title} onClick={()=>setSelectedModule(item.title)}>
          <span className="cssa-module-label">MODULE MÉTIER</span>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
          <div className="cssa-module-foot"><span>Ouvrir le module →</span></div>
        </button>)}
      </div>

      {module&&<aside className="cssa-detail-panel cssa-module-detail">
        <div><span className="cssa-kicker">MODULE SÉLECTIONNÉ</span><h3>{module.title}</h3><p>{module.description}</p>
          {current.id==='cssa'?<div className="cssa-real-sources">
            <div className="cssa-real-head">
              <span>RACCORD RÉEL · READONLY</span>
              <a href={CSSA_REPO+'/tree/'+CSSA_BRANCH} target="_blank" rel="noreferrer">Ouvrir la branche ↗</a>
            </div>
            {realSources.map(source=><a className="cssa-real-source" key={source.path} href={cssaSource(source.path)} target="_blank" rel="noreferrer">
              <span><strong>{source.label}</strong><small>{source.path}</small></span>
              <b>{source.status}</b>
            </a>)}
            {!realSources.length&&<small>Aucun artefact réel mappé pour ce module.</small>}
          </div>:<>
            <div className="cssa-detail-actions">
              <button disabled>Documents</button><button disabled>Activité</button><button disabled>Processus</button><button disabled>Résultats</button>
            </div>
            <small>Cette structure n’est pas encore raccordée au réel.</small>
          </>}
        </div>
        <button onClick={()=>setSelectedModule(null)}>Fermer</button>
      </aside>}
    </section>

    <section className="cssa-governance">
      <div><span className="cssa-kicker">GOUVERNANCE</span><h2>KX108 · validations · décisions · preuves</h2></div>
      <div className="cssa-governance-flow"><span>Métier</span><b>→</b><span>Proposition</span><b>→</b><span>Validation</span><b>→</b><span>KX108</span><b>→</b><span>Preuve</span></div>
    </section>

    <section className="cssa-projects">
      <header>
        <div><span className="cssa-kicker">PROJETS À VENIR</span><h2>Projets et chantiers</h2></div>
        <button className="cssa-add-project" onClick={()=>setShowProjectForm(v=>!v)}>+ Projet</button>
      </header>

      {showProjectForm&&<div className="cssa-inline-form">
        <input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Nom du projet"/>
        <button onClick={addProject}>Ajouter</button>
        <button className="quiet" onClick={()=>setShowProjectForm(false)}>Annuler</button>
      </div>}

      <div className="cssa-project-grid">
        {currentProjects.map(p=><article key={p.id}><span>◆</span><strong>{p.title}</strong><small>{p.status}</small></article>)}
        {!currentProjects.length&&<article className="empty"><span>+</span><strong>Aucun projet</strong><small>Ajoute le premier chantier</small></article>}
      </div>
    </section>
  </main>
}
