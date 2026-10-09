import './EnterpriseOrganizations.css'

const areas = [
  {
    title: 'Administration',
    subtitle: 'Structure, dossiers, obligations, documents',
    items: ['Documents administratifs', 'Contrats & conventions', 'Dossiers internes', 'Échéances']
  },
  {
    title: 'CRM & relations',
    subtitle: 'Supporters, partenaires, sponsors, institutions',
    items: ['Contacts & organisations', 'Relations partenaires', 'Suivis & relances', 'Historique des échanges']
  },
  {
    title: 'Communication',
    subtitle: 'Messages, contenus, diffusion, cohérence',
    items: ['Communication club', 'Campagnes', 'Contenus', 'Canaux & publications']
  },
  {
    title: 'Événements',
    subtitle: 'Matchs, billetterie, hospitalité, opérations terrain',
    items: ['Événements à venir', 'Billetterie', 'Invitations & hospitalité', 'Retours opérationnels']
  },
  {
    title: 'Finances',
    subtitle: 'Vision financière et pièces de suivi',
    items: ['Budgets', 'Factures & paiements', 'Recettes / dépenses', 'Suivis financiers']
  },
  {
    title: 'Opérations',
    subtitle: 'Travail quotidien et coordination',
    items: ['Missions en cours', 'Tâches & responsables', 'Blocages', 'Résultats & livrables']
  }
]

export default function EnterpriseOrganizations() {
  return (
    <section className="enterprise-page" aria-label="Entreprises et Organisations — CSSA">
      <header className="enterprise-hero">
        <div>
          <span className="enterprise-kicker">ENTREPRISES & ORGANISATIONS</span>
          <h1>CSSA — Club Sportif Sedan Ardennes</h1>
          <p>
            Vue d’ensemble de l’organisation. Les cas métier restent internes à cette page :
            ils ne deviennent ni des territoires du Monde, ni des blocs du Workspace,
            ni des catégories Pokémon.
          </p>
        </div>
        <div className="enterprise-badge">
          <strong>ORGANISATION PILOTE</strong>
          <span>Projection readonly</span>
          <small>KX108_ONLY</small>
        </div>
      </header>

      <section className="enterprise-overview">
        <div>
          <span>Organisation</span>
          <strong>CSSA</strong>
          <small>Club Sportif Sedan Ardennes</small>
        </div>
        <div>
          <span>Vue</span>
          <strong>Entreprise complète</strong>
          <small>Pas un domaine isolé</small>
        </div>
        <div>
          <span>Autorité</span>
          <strong>KX108_ONLY</strong>
          <small>Aucune nouvelle autorité UI</small>
        </div>
        <div>
          <span>État</span>
          <strong>À raccorder</strong>
          <small>Les blocs affichent la structure cible</small>
        </div>
      </section>

      <div className="enterprise-grid">
        {areas.map(area => (
          <article className="enterprise-card" key={area.title}>
            <div className="enterprise-card-head">
              <div>
                <span>CSSA</span>
                <h2>{area.title}</h2>
              </div>
              <small>Vue métier</small>
            </div>
            <p>{area.subtitle}</p>
            <ul>
              {area.items.map(item => <li key={item}>{item}</li>)}
            </ul>
          </article>
        ))}
      </div>

      <section className="enterprise-governance">
        <div>
          <span className="enterprise-kicker">TRANSVERSAL</span>
          <h2>Gouvernance & preuves</h2>
          <p>
            Cette zone rend visibles les décisions, validations, preuves et limites applicables
            à l’organisation sans transformer la page CSSA en source de vérité canonique.
          </p>
        </div>
        <div className="governance-flow">
          <span>Entrée</span><b>→</b><span>Travail</span><b>→</b><span>Validation</span><b>→</b><span>Décision</span><b>→</b><span>Preuve</span>
        </div>
      </section>

      <section className="future-projects">
        <div className="future-projects-head">
          <div>
            <span className="enterprise-kicker">EXTENSION</span>
            <h2>Projets à venir</h2>
          </div>
          <p>Emplacements volontairement libres pour les prochains projets de l’organisation.</p>
        </div>
        <div className="future-slots">
          <div><span>+</span><strong>Projet futur</strong><small>Emplacement libre</small></div>
          <div><span>+</span><strong>Projet futur</strong><small>Emplacement libre</small></div>
          <div><span>+</span><strong>Projet futur</strong><small>Emplacement libre</small></div>
        </div>
      </section>
    </section>
  )
}
