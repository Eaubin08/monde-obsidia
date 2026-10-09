import './CSSAPage.css'

const modules = [
  ['Administration','Documents, demandes, contrats, conventions et suivi administratif.'],
  ['CRM & relations','Membres, supporters, partenaires, sponsors, institutions et historique des échanges.'],
  ['Communication','Mails, campagnes, contenus, publications et cohérence des messages.'],
  ['Événements','Matchs, billetterie, invitations, hospitalité et opérations événementielles.'],
  ['Finances','Budgets, factures, paiements, recettes, dépenses et justificatifs.'],
  ['Opérations','Missions, tâches, responsables, blocages, résultats et livrables.'],
] as const

export default function CSSAPage(){
  return <main className="cssa-page">
    <header className="cssa-hero">
      <div>
        <span className="cssa-kicker">CSSA · CLUB SPORTIF SEDAN ARDENNES</span>
        <h1>Centre opérationnel CSSA</h1>
        <p>Une page unique dédiée au club, à ses métiers, ses opérations, ses relations, ses événements, ses finances et sa gouvernance.</p>
      </div>
      <div className="cssa-status">
        <small>ORGANISATION</small>
        <strong>CSSA</strong>
        <span>Club Sportif Sedan Ardennes</span>
      </div>
    </header>

    <section className="cssa-overview">
      <article><small>STRUCTURE</small><strong>Club sportif</strong><span>Organisation complète</span></article>
      <article><small>PILOTAGE</small><strong>Vue unifiée</strong><span>Tous les métiers sur une page</span></article>
      <article><small>GOUVERNANCE</small><strong>KX108_ONLY</strong><span>Cadre Obsidia conservé</span></article>
      <article><small>ÉTAT</small><strong>À raccorder</strong><span>Structure UI prête</span></article>
    </section>

    <section className="cssa-section">
      <header><span className="cssa-kicker">ORGANISATION</span><h2>Vue globale</h2></header>
      <div className="cssa-org-card">
        <div className="cssa-club-mark">CSSA</div>
        <div><h3>Club Sportif Sedan Ardennes</h3><p>Administration, relations membres, événements, communication, finances, opérations et gouvernance réunis dans une même interface dédiée.</p></div>
      </div>
    </section>

    <section className="cssa-module-grid">
      {modules.map(([title,description])=><article className="cssa-module" key={title}>
        <span className="cssa-module-label">CSSA</span>
        <h2>{title}</h2>
        <p>{description}</p>
        <div className="cssa-module-space"><span>Zone métier</span><small>Contenu à raccorder</small></div>
      </article>)}
    </section>

    <section className="cssa-governance">
      <div>
        <span className="cssa-kicker">GOUVERNANCE & PREUVES</span>
        <h2>Décisions, validations et traçabilité</h2>
        <p>Zone dédiée aux décisions, validations, preuves, limites et résultats liés au fonctionnement du club.</p>
      </div>
      <div className="cssa-flow">
        <span>Entrée</span><b>→</b><span>Traitement</span><b>→</b><span>Validation</span><b>→</b><span>Décision</span><b>→</b><span>Preuve</span>
      </div>
    </section>

    <section className="cssa-projects">
      <header><span className="cssa-kicker">PROJETS</span><h2>Projets à venir</h2><p>Emplacements libres pour les futurs chantiers du CSSA.</p></header>
      <div className="cssa-project-grid">
        {[1,2,3].map(i=><article key={i}><span>+</span><strong>Projet futur</strong><small>Emplacement libre</small></article>)}
      </div>
    </section>
  </main>
}
