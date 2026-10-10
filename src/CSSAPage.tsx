import {useMemo,useState} from 'react'
import './CSSAPage.css'

type StructureId=string
type ModuleKey='Administration'|'CRM & relations'|'Communication'|'Événements'|'Finances'|'Opérations'
type Priority='CRITICAL'|'HIGH'|'NORMAL'
type Gate='ALLOW'|'HOLD'|'BLOCK'|'OPEN'

type Structure={
  id:StructureId
  name:string
  subtitle:string
  kind:string
  modules:{title:string;description:string}[]
}

type Project={id:string;title:string;status:string}

const structuresSeed:Structure[]=[
  {
    id:'cssa',
    name:'CSSA',
    subtitle:'Club Sportif Sedan Ardennes',
    kind:'Club sportif',
    modules:[
      {title:'Administration',description:'Contrats, conformité, dossiers officiels et obligations.'},
      {title:'CRM & relations',description:'Cas, suivis, institutions, partenaires et relations.'},
      {title:'Communication',description:'Mails, reporting, veille publique et publications.'},
      {title:'Événements',description:'Matchday, calendrier, billetterie, accueil et logistique.'},
      {title:'Finances',description:'Tarifs publics, budgets, paiements, rapprochements et preuves.'},
      {title:'Opérations',description:'Tâches, incidents, fournisseurs, suivi et coordination.'},
    ]
  },
  {
    id:'trading',
    name:'Trading',
    subtitle:'Structure de trading gouverné',
    kind:'Activité financière',
    modules:[
      {title:'Stratégies',description:'Règles, scénarios et conditions de déclenchement.'},
      {title:'Risque',description:'Exposition, limites et garde-fous.'},
      {title:'Marchés',description:'Actifs, données et contexte de marché.'},
      {title:'Exécution',description:'Ordres proposés, autorisations et exécution PAPER.'},
      {title:'Performance',description:'Résultats, attribution et suivi.'},
      {title:'Opérations',description:'Sessions, tâches, incidents et maintenance.'},
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
      {title:'Communication',description:'Messages, campagnes et publications.'},
      {title:'Événements',description:'Rencontres, inscriptions et logistique.'},
      {title:'Finances',description:'Cotisations, dépenses et subventions.'},
      {title:'Projets',description:'Actions, responsables et résultats.'},
    ]
  },
  {
    id:'entreprise',
    name:'Entreprise X',
    subtitle:'Structure commerciale',
    kind:'Entreprise',
    modules:[
      {title:'Administration',description:'Documents, contrats, conformité et traitement.'},
      {title:'CRM & ventes',description:'Prospects, clients et opportunités.'},
      {title:'Marketing',description:'Campagnes, contenus et acquisition.'},
      {title:'Finance',description:'Budgets, facturation et trésorerie.'},
      {title:'Production',description:'Livrables, qualité et opérations.'},
      {title:'Projets',description:'Roadmap, responsables et résultats.'},
    ]
  },
]

const cssaSummary=[
  {label:'Structures sportives',value:'19',meta:'PUBLIC CONFIRMÉ'},
  {label:'Bridge CRM / tâches',value:'PROVEN',meta:'181 tests PASS'},
  {label:'Sources surveillées',value:'14',meta:'READONLY PUBLIC'},
  {label:'Abonnés 26/27',value:'800',meta:'SNAPSHOT OFFICIEL'},
  {label:'Partenaires actifs',value:'50+',meta:'PUBLIC CONFIRMÉ'},
  {label:'Action externe',value:'HOLD',meta:'NON ACTIVÉE'},
] as const

const cssaQueue:{id:string;title:string;family:string;owner:string;priority:Priority;due:string;status:string}[]=[
  {id:'fixture-incident-001',title:'Incident opérationnel à analyser',family:'RCA',owner:'Manager général',priority:'CRITICAL',due:'08 oct. · 17:00',status:'SIMULÉ'},
  {id:'fixture-supplier-001',title:'Livraison fournisseur à confirmer',family:'Fournisseur',owner:'Matchday',priority:'NORMAL',due:'09 oct. · 09:00',status:'SIMULÉ'},
  {id:'fixture-matchday-001',title:'Préparation buvette matchday',family:'Matchday',owner:'Matchday',priority:'HIGH',due:'09 oct. · 18:00',status:'SIMULÉ'},
  {id:'fixture-contract-001',title:'Contrat prestataire à revoir',family:'Administration',owner:'Manager général',priority:'HIGH',due:'10 oct. · 17:00',status:'SIMULÉ'},
  {id:'fixture-institution-001',title:'Réponse collectivité à préparer',family:'Institution',owner:'Manager général',priority:'NORMAL',due:'11 oct. · 12:00',status:'SIMULÉ'},
]

const cssaAlerts:{title:string;detail:string;gate:Gate;kind:string}[]=[
  {title:'Organigramme Manager Général potentiellement périmé',detail:'Une page publique conserve un nom alors qu’un communiqué officiel annonce un départ.',gate:'HOLD',kind:'Contradiction publique'},
  {title:'Réserve affichée R3 sur une source',detail:'Des sources de compétition 2026-2027 placent la réserve en R2.',gate:'HOLD',kind:'Fraîcheur source'},
  {title:'12+ matchs domicile vs 13 matchs championnat',detail:'Écart de formulation entre page partenaires et abonnement saison.',gate:'OPEN',kind:'Écart sémantique'},
  {title:'Site CSSA en cours de mise à jour',detail:'La fraîcheur globale du site public doit rester surveillée.',gate:'OPEN',kind:'Source freshness'},
]

const adminCases=[
  {title:'Contrat actif valide',meta:'Autorité + signature + version uniques',gate:'ALLOW' as Gate},
  {title:'Autorité de signature inconnue',meta:'Utilisation opérationnelle demandée',gate:'HOLD' as Gate},
  {title:'Deux versions actives',meta:'Conflit de version',gate:'BLOCK' as Gate},
  {title:'Contrat expiré encore utilisé',meta:'Usage opérationnel demandé',gate:'BLOCK' as Gate},
  {title:'Échéance conformité dépassée',meta:'Preuve absente',gate:'BLOCK' as Gate},
  {title:'Applicabilité à confirmer',meta:'Règle publique, périmètre inconnu',gate:'HOLD' as Gate},
]

const relationCases=[
  {title:'FFF · dossier compétition',meta:'Approuvé avec preuve',gate:'ALLOW' as Gate},
  {title:'Ville de Sedan · accusé reçu',meta:'ACKNOWLEDGED ≠ APPROVED',gate:'HOLD' as Gate},
  {title:'Ardenne Métropole · périmètre inconnu',meta:'Autorité à confirmer',gate:'HOLD' as Gate},
  {title:'District · mauvais canal',meta:'Portail officiel requis',gate:'BLOCK' as Gate},
  {title:'FFF · instructions contradictoires',meta:'18:30 vs 19:30',gate:'BLOCK' as Gate},
  {title:'LGEF · deadline dépassée',meta:'Échéance dure manquée',gate:'BLOCK' as Gate},
]

const matchdayCases=[
  {title:'Stock buvette prêt',meta:'130 disponibles / 100 requis',gate:'ALLOW' as Gate},
  {title:'Stock buvette insuffisant',meta:'70 disponibles / 120 requis',gate:'BLOCK' as Gate},
  {title:'Périssable sans contrôle',meta:'Date/aptitude non vérifiée',gate:'HOLD' as Gate},
  {title:'Livraison fournisseur confirmée',meta:'Commande + preuve présentes',gate:'ALLOW' as Gate},
  {title:'Livraison fournisseur annulée',meta:'Ouverture demandée',gate:'BLOCK' as Gate},
  {title:'Shift sous-staffé',meta:'5 affectés / 8 requis',gate:'BLOCK' as Gate},
]

const financeFacts=[
  {label:'Licence U6–U9',value:'180 €',note:'pack public CSSA'},
  {label:'Licence U10–U18',value:'240 €',note:'pack public CSSA'},
  {label:'Licence U20–Seniors',value:'300 €',note:'pack public CSSA'},
  {label:'Réduction 2e enfant',value:'25 €',note:'éligibilité à vérifier'},
  {label:'Réduction féminine',value:'25 €',note:'éligibilité à vérifier'},
  {label:'Pass Sport',value:'70 €',note:'preuve requise'},
  {label:'Cotisation club R1/R2 LGEF',value:'367,34 €',note:'tarif public 26/27'},
  {label:'Budget réel 26/27',value:'INCONNU',note:'donnée privée non inventée'},
]

const communicationFacts=[
  {title:'Veille publique',value:'14 sources',meta:'weekly / biweekly / monthly'},
  {title:'Mail gouverné',value:'PREFLIGHT PROVEN',meta:'envoi réel bloqué'},
  {title:'Reporting',value:'ROUTING PROVEN',meta:'aucune livraison externe'},
  {title:'Publication',value:'VALIDATION REQUISE',meta:'faits approuvés uniquement'},
]

const opsFacts=[
  {title:'CSSA → CRM CASE',status:'PROVEN'},
  {title:'CSSA → tâche native',status:'PROVEN'},
  {title:'Interaction d’intake',status:'PROVEN'},
  {title:'Follow-up CRM → task_ref',status:'PROVEN'},
  {title:'HOLD/BLOCK → 0 mutation',status:'PROVEN'},
  {title:'Action SaaS externe',status:'DISABLED'},
]

const governance=[
  {label:'Autorité de décision',value:'KX108_ONLY'},
  {label:'Action externe',value:'false'},
  {label:'Écriture mémoire',value:'false'},
  {label:'emits_act',value:'false'},
  {label:'Mutation kernel',value:'false'},
  {label:'Preuve terrain interne',value:'OPEN'},
]

const newId=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():String(Date.now())

function GateBadge({gate}:{gate:Gate}){
  return <span className={'cssa-gate cssa-gate-'+gate.toLowerCase()}>{gate}</span>
}

export default function CSSAPage(){
  const [structures,setStructures]=useState<Structure[]>(structuresSeed)
  const [selected,setSelected]=useState<StructureId>('cssa')
  const [selectedModule,setSelectedModule]=useState<string|null>(null)
  const [selectedQueue,setSelectedQueue]=useState<string|null>(null)
  const [projects,setProjects]=useState<Record<string,Project[]>>({})
  const [showStructureForm,setShowStructureForm]=useState(false)
  const [showProjectForm,setShowProjectForm]=useState(false)
  const [structureName,setStructureName]=useState('')
  const [structureKind,setStructureKind]=useState('')
  const [projectName,setProjectName]=useState('')

  const current=useMemo(()=>structures.find(s=>s.id===selected)??structures[0],[structures,selected])
  const currentProjects=projects[current.id]??[]
  const isCSSA=current.id==='cssa'
  const module=current.modules.find(m=>m.title===selectedModule)??null
  const queueCase=cssaQueue.find(item=>item.id===selectedQueue)??null

  const chooseStructure=(id:string)=>{
    setSelected(id)
    setSelectedModule(null)
    setSelectedQueue(null)
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
        {title:'CRM & relations',description:'Contacts, partenaires et suivi.'},
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

  const renderCSSAModule=()=>{
    if(!module)return null
    const title=module.title as ModuleKey

    if(title==='Administration') return <div className="cssa-work-grid">
      {adminCases.map(item=><article className="cssa-work-item" key={item.title}><div><strong>{item.title}</strong><small>{item.meta}</small></div><GateBadge gate={item.gate}/></article>)}
    </div>

    if(title==='CRM & relations') return <div className="cssa-work-grid">
      {relationCases.map(item=><article className="cssa-work-item" key={item.title}><div><strong>{item.title}</strong><small>{item.meta}</small></div><GateBadge gate={item.gate}/></article>)}
    </div>

    if(title==='Communication') return <div className="cssa-metric-grid cssa-metric-grid-4">
      {communicationFacts.map(item=><article key={item.title}><small>{item.title}</small><strong>{item.value}</strong><span>{item.meta}</span></article>)}
    </div>

    if(title==='Événements') return <div className="cssa-work-grid">
      {matchdayCases.map(item=><article className="cssa-work-item" key={item.title}><div><strong>{item.title}</strong><small>{item.meta}</small></div><GateBadge gate={item.gate}/></article>)}
    </div>

    if(title==='Finances') return <div className="cssa-metric-grid cssa-metric-grid-4">
      {financeFacts.map(item=><article key={item.label}><small>{item.label}</small><strong>{item.value}</strong><span>{item.note}</span></article>)}
    </div>

    return <div className="cssa-work-grid">
      {opsFacts.map(item=><article className="cssa-work-item" key={item.title}><div><strong>{item.title}</strong><small>État du bridge natif</small></div><span className={item.status==='PROVEN'?'cssa-status-ok':'cssa-status-off'}>{item.status}</span></article>)}
    </div>
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

    {!isCSSA&&<>
      <header className="cssa-hero">
        <div><span className="cssa-kicker">VUE SÉLECTIONNÉE</span><h1>{current.name}</h1><p>{current.subtitle}</p></div>
        <aside className="cssa-identity"><small>ÉTAT</small><strong>Prototype</strong><span>Raccord réel prévu plus tard</span></aside>
      </header>
      <section className="cssa-section">
        <span className="cssa-kicker">MÉTIERS</span><h2>Modules de la structure</h2>
        <div className="cssa-module-grid">
          {current.modules.map(item=><button className="cssa-module" key={item.title}><span className="cssa-module-label">MODULE</span><h3>{item.title}</h3><p>{item.description}</p><div className="cssa-module-foot"><span>Non raccordé</span></div></button>)}
        </div>
      </section>
    </>}

    {isCSSA&&<>
      <header className="cssa-hero cssa-hero-live">
        <div>
          <span className="cssa-kicker">CSSA · COCKPIT MÉTIER</span>
          <h1>Club Sportif Sedan Ardennes</h1>
          <p>Projection opérationnelle readonly construite à partir du modèle public 2026-2027 et des briques CSSA déjà prouvées. Les scénarios de validation restent séparés de la réalité terrain.</p>
          <div className="cssa-state-row"><span>PUBLIC 26/27</span><span>READONLY</span><span>F3H-D PROVEN</span><span>KX108_ONLY</span></div>
        </div>
        <aside className="cssa-identity cssa-health">
          <small>FRONTIÈRE ACTUELLE</small>
          <strong>Terrain OPEN</strong>
          <span>Données internes réelles non encore auditées</span>
          <em>Action externe : HOLD</em>
        </aside>
      </header>

      <section className="cssa-section cssa-summary">
        <header><div><span className="cssa-kicker">SITUATION</span><h2>Vue d’ensemble</h2></div><span className="cssa-prototype">SNAPSHOT 07/10/2026</span></header>
        <div className="cssa-summary-grid">
          {cssaSummary.map(item=><article key={item.label}><small>{item.label}</small><strong>{item.value}</strong><span>{item.meta}</span></article>)}
        </div>
      </section>

      <section className="cssa-two-col">
        <article className="cssa-panel">
          <header><div><span className="cssa-kicker">FILE DE TRAVAIL</span><h2>Cas à traiter</h2></div><span className="cssa-sim-badge">SIMULÉS</span></header>
          <div className="cssa-queue">
            {cssaQueue.map(item=><button key={item.id} className={selectedQueue===item.id?'active':''} onClick={()=>setSelectedQueue(selectedQueue===item.id?null:item.id)}>
              <span className={'cssa-priority '+item.priority.toLowerCase()}>{item.priority}</span>
              <div><strong>{item.title}</strong><small>{item.family} · {item.owner}</small></div>
              <time>{item.due}</time>
            </button>)}
          </div>
          {queueCase&&<div className="cssa-case-detail">
            <span className="cssa-kicker">CAS SÉLECTIONNÉ</span>
            <h3>{queueCase.title}</h3>
            <p>Ce cas provient du corpus de validation du bridge CSSA → CRM/TASKS. Il teste le workflow et la gouvernance ; il ne doit pas être interprété comme un dossier réellement observé au club.</p>
            <div className="cssa-detail-tags"><span>{queueCase.family}</span><span>{queueCase.owner}</span><span>{queueCase.status}</span></div>
          </div>}
        </article>

        <article className="cssa-panel">
          <header><div><span className="cssa-kicker">ALERTES & INCOHÉRENCES</span><h2>À surveiller</h2></div><span className="cssa-real-badge">PUBLIC</span></header>
          <div className="cssa-alert-list">
            {cssaAlerts.map(item=><div className="cssa-alert" key={item.title}><div><span>{item.kind}</span><strong>{item.title}</strong><small>{item.detail}</small></div><GateBadge gate={item.gate}/></div>)}
          </div>
        </article>
      </section>

      <section className="cssa-section">
        <header><div><span className="cssa-kicker">MÉTIERS</span><h2>Entrer dans le travail</h2></div><small className="cssa-section-note">Clique un métier pour ouvrir sa vue</small></header>
        <div className="cssa-module-grid">
          {current.modules.map(item=><button className={selectedModule===item.title?'cssa-module active':'cssa-module'} key={item.title} onClick={()=>setSelectedModule(selectedModule===item.title?null:item.title)}>
            <span className="cssa-module-label">MÉTIER</span>
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            <div className="cssa-module-foot"><span>{selectedModule===item.title?'Refermer ↑':'Ouvrir →'}</span></div>
          </button>)}
        </div>

        {module&&<div className="cssa-module-workspace">
          <header><div><span className="cssa-kicker">ESPACE MÉTIER</span><h2>{module.title}</h2><p>{module.description}</p></div><button onClick={()=>setSelectedModule(null)}>Fermer</button></header>
          {renderCSSAModule()}
          <footer>
            <span>{module.title==='Finances'||module.title==='Communication'?'Données publiques / états prouvés':'Cas de validation simulés'}</span>
            <b>Aucune action externe depuis cette vue</b>
          </footer>
        </div>}
      </section>

      <section className="cssa-section cssa-governance-live">
        <header><div><span className="cssa-kicker">GOUVERNANCE</span><h2>Frontières d’autorité</h2></div><span className="cssa-real-badge">PROVEN</span></header>
        <div className="cssa-governance-grid">
          {governance.map(item=><article key={item.label}><small>{item.label}</small><strong>{item.value}</strong></article>)}
        </div>
        <div className="cssa-decision-flow"><span>Cas métier</span><b>→</b><span>Proposition</span><b>→</b><span>KX108</span><b>→</b><span>Validation humaine si requise</span><b>→</b><span>Preuve</span></div>
      </section>

      <section className="cssa-projects">
        <header>
          <div><span className="cssa-kicker">PROJETS</span><h2>Chantiers du club</h2></div>
          <button className="cssa-add-project" onClick={()=>setShowProjectForm(v=>!v)}>+ Projet</button>
        </header>
        {showProjectForm&&<div className="cssa-inline-form">
          <input value={projectName} onChange={e=>setProjectName(e.target.value)} placeholder="Nom du projet"/>
          <button onClick={addProject}>Ajouter</button>
          <button className="quiet" onClick={()=>setShowProjectForm(false)}>Annuler</button>
        </div>}
        <div className="cssa-project-grid">
          {currentProjects.map(p=><article key={p.id}><span>◆</span><strong>{p.title}</strong><small>{p.status}</small></article>)}
          {!currentProjects.length&&<article className="empty"><span>+</span><strong>Aucun chantier ajouté</strong><small>Les projets ajoutés ici restent locaux à la page pour l’instant</small></article>}
        </div>
      </section>
    </>}
  </main>
}
