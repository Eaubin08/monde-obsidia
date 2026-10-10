import './CSSAPage.css'

const businessModules = [
  ['Administration','Documents, demandes, contrats, conventions et traitement administratif.'],
  ['CRM & relations','Membres, supporters, partenaires, sponsors, institutions et historique des échanges.'],
  ['Communication','Mails, campagnes, contenus, publications et cohérence des messages.'],
  ['Événements','Matchs, billetterie, invitations, hospitalité, calendrier et organisation.'],
  ['Finances','Budgets, factures, paiements, recettes, dépenses et justificatifs.'],
  ['Opérations','Missions, processus, automatisations, responsables, blocages et livrables.'],
] as const

const cockpit = [
  ['État général','Prototype'],
  ['Priorités','À définir / raccorder'],
  ['Activité','Aucune activité live reliée'],
  ['Échéances','Aucune échéance reliée'],
  ['Projets','Emplacements disponibles'],
  ['Alertes / décisions','Aucune alerte observée'],
] as const

export default function CSSAPage(){
  return <main className="cssa-page">
    <header className="cssa-hero">
      <div>
        <span className="cssa-kicker">ENTREPRISES & STRUCTURES · VUE SÉLECTIONNÉE</span>
        <h1>Vue d’ensemble</h1>
        <p>Le Club Sportif Sedan Ardennes est présenté comme une structure complète. Ses métiers restent internes à cette vue ; ils ne deviennent pas des domaines du Monde.</p>
      </div>
      <aside className="cssa-identity">
        <small>STRUCTURE PILOTE</small>
        <strong>CSSA</strong>
        <span>Club Sportif Sedan Ardennes</span>
        <em>Club sportif</em>
      </aside>
    </header>

    <section className="cssa-section cssa-cockpit">
      <header>
        <div>
          <span className="cssa-kicker">VUE D’ENSEMBLE ENTREPRISE</span>
          <h2>Cockpit général</h2>
          <p>La page commence par la vue d’ensemble : état, priorités, activité, échéances, projets et décisions importantes.</p>
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
          <span className="cssa-kicker">MÉTIERS INTERNES</span>
          <h2>Domaines et cas métiers</h2>
          <p>Ces rubriques sont des modules à concevoir ou raccorder. Elles représentent les métiers propres au club, pas des fonctions déjà opérationnelles.</p>
        </div>
      </header>
      <div className="cssa-module-grid">
        {businessModules.map(([title,description])=><article className="cssa-module" key={title}>
          <span className="cssa-module-label">MODULE MÉTIER</span>
          <h3>{title}</h3>
          <p>{description}</p>
          <div className="cssa-module-foot">
            <span>À concevoir / raccorder</span>
            <small>Configuration propre au club</small>
          </div>
        </article>)}
      </div>
    </section>

    <section className="cssa-governance">
      <div>
        <span className="cssa-kicker">GOUVERNANCE TRANSVERSALE</span>
        <h2>KX108 gouverne les métiers sans devenir un métier supplémentaire</h2>
        <p>Décisions, permissions, validations humaines, receipts et preuves traversent l’ensemble des modules. Cette couche encadre les cas métiers sans remplacer leur logique propre.</p>
      </div>
      <div className="cssa-governance-flow">
        <span>Métier</span><b>→</b><span>Proposition</span><b>→</b><span>Validation</span><b>→</b><span>KX108</span><b>→</b><span>Receipt / preuve</span>
      </div>
    </section>

    <section className="cssa-projects">
      <header>
        <div>
          <span className="cssa-kicker">PROJETS À VENIR</span>
          <h2>Projets et chantiers</h2>
          <p>De nouveaux projets peuvent être ajoutés ici sans modifier l’architecture générale de Monde ni celle des autres structures.</p>
        </div>
      </header>
      <div className="cssa-project-grid">
        {[1,2,3].map(i=><article key={i}>
          <span>+</span>
          <strong>Projet futur</strong>
          <small>Emplacement libre</small>
        </article>)}
      </div>
    </section>

    <footer className="cssa-footer">
      <span>Métiers = internes à cette vue</span>
      <span>Gouvernance = transverse</span>
    </footer>
  </main>
}
