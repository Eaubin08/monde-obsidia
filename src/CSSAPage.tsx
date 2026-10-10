import {useState} from 'react'
import './CSSAPage.css'

type StructureId='cssa'|'trading'|'association'|'entreprise'

const structures:{id:StructureId;name:string;subtitle:string;kind:string}[]=[
  {id:'cssa',name:'CSSA',subtitle:'Club Sportif Sedan Ardennes',kind:'Club sportif'},
  {id:'trading',name:'Trading',subtitle:'Structure de trading gouverné',kind:'Activité financière'},
  {id:'association',name:'Association',subtitle:'Structure associative',kind:'Association'},
  {id:'entreprise',name:'Entreprise X',subtitle:'Structure commerciale',kind:'Entreprise'},
]

const businessModules=[
  ['Administration','Documents, demandes, contrats, conventions et traitement administratif.'],
  ['CRM & relations','Membres, supporters, partenaires, sponsors, institutions et historique des échanges.'],
  ['Communication','Mails, campagnes, contenus, publications et cohérence des messages.'],
  ['Événements','Matchs, billetterie, invitations, hospitalité, calendrier et organisation.'],
  ['Finances','Budgets, factures, paiements, recettes, dépenses et justificatifs.'],
  ['Opérations','Missions, processus, automatisations, responsables, blocages et livrables.'],
] as const

const cockpit=[
  ['État général','Prototype'],
  ['Priorités','À définir / raccorder'],
  ['Activité','Aucune activité live reliée'],
  ['Échéances','Aucune échéance reliée'],
  ['Projets','Emplacements disponibles'],
  ['Alertes / décisions','Aucune alerte observée'],
] as const

export default function CSSAPage(){
  const [selected,setSelected]=useState<StructureId>('cssa')
  const current=structures.find(s=>s.id===selected)!

  return <main className="cssa-page">
    <section className="cssa-selector">
      <header>
        <div>
          <span className="cssa-kicker">ENTREPRISES & ORGANISATIONS</span>
          <h1>Structures</h1>
        </div>
        <button className="cssa-add-structure">+ Ajouter</button>
      </header>
      <div className="cssa-structure-tabs">
        {structures.map(s=><button key={s.id} className={selected===s.id?'active':''} onClick={()=>setSelected(s.id)}>
          <strong>{s.name}</strong><small>{s.kind}</small>
        </button>)}
      </div>
    </section>

    <header className="cssa-hero">
      <div>
        <span className="cssa-kicker">VUE SÉLECTIONNÉE</span>
        <h1>{current.name}</h1>
        <p>{current.subtitle}</p>
      </div>
      <aside className="cssa-identity">
        <small>TYPE</small>
        <strong>{current.kind}</strong>
        <span>{current.subtitle}</span>
      </aside>
    </header>

    <section className="cssa-section cssa-cockpit">
      <header>
        <div>
          <span className="cssa-kicker">VUE D’ENSEMBLE</span>
          <h2>Cockpit général</h2>
        </div>
        <span className="cssa-prototype">PROTOTYPE</span>
      </header>
      <div className="cssa-cockpit-grid">
        {cockpit.map(([label,value])=><article key={label}>
          <small>{label}</small>
          <strong>{value}</strong>
        </article>)}
      </div>
    </section>

    <section className="cssa-section">
      <header>
        <div>
          <span className="cssa-kicker">MÉTIERS</span>
          <h2>Domaines et cas métiers</h2>
        </div>
      </header>
      <div className="cssa-module-grid">
        {businessModules.map(([title,description])=><article className="cssa-module" key={title}>
          <span className="cssa-module-label">MODULE MÉTIER</span>
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="cssa-module-foot">
            <span>À concevoir / raccorder</span>
          </div>
        </article>)}
      </div>
    </section>

    <section className="cssa-governance">
      <div>
        <span className="cssa-kicker">GOUVERNANCE</span>
        <h2>KX108 · validations · décisions · preuves</h2>
      </div>
      <div className="cssa-governance-flow">
        <span>Métier</span><b>→</b><span>Proposition</span><b>→</b><span>Validation</span><b>→</b><span>KX108</span><b>→</b><span>Preuve</span>
      </div>
    </section>

    <section className="cssa-projects">
      <header>
        <div>
          <span className="cssa-kicker">PROJETS À VENIR</span>
          <h2>Projets et chantiers</h2>
        </div>
      </header>
      <div className="cssa-project-grid">
        {[1,2,3].map(i=><article key={i}><span>+</span><strong>Projet futur</strong><small>Emplacement libre</small></article>)}
      </div>
    </section>
  </main>
}
