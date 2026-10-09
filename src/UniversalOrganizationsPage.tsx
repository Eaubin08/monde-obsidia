type C5Record={organizationId:string;domainId:string;capabilityId:string;gate:string;status:string;evidenceGrade:string;decisionRecordId:string;receiptId:string;canExecute:boolean}
type C5State={status:string;organizationFilter?:string|null;recordCount:number;records:C5Record[]}|null
type Props={state:C5State;observedCount:number}
const trades=[
 ['Administration','Dossiers, documents, demandes et validation'],
 ['CRM & relations','Membres, partenaires et contacts'],
 ['Communication','Mails, campagnes et publications'],
 ['Événements','Calendrier, billetterie et coordination'],
 ['Finances','Suivi financier et justificatifs'],
 ['Opérations','Missions, processus et automatisations'],
] as const
export default function UniversalOrganizationsPage({state,observedCount}:Props){
 const organization=state?.organizationFilter||null
 const records=state?.records||[]
 const domains=[...new Set(records.map(r=>r.domainId))]
 return <section className="v5-panel" aria-label="Entreprises et organisations universelles">
  <header><div><small>MONDE · UNIVERSALITÉ</small><h2>Entreprises & Organisations</h2></div><span>Consultation · KX108_ONLY</span></header>
  <p>Un espace commun pour accueillir les organisations et leurs projets, avec des données et capacités propres à chacune.</p>
  <section className="v5-panel" aria-label="Répertoire des organisations">
   <header><div><small>RÉPERTOIRE</small><h2>Organisations</h2></div><span>{organization?'1 périmètre configuré':'Aucun périmètre configuré'}</span></header>
   <article><strong>CSSA · Club sportif</strong><p>Organisation pilote — modèle de présentation. {organization?'Périmètre source : '+organization+'.':'Aucune attribution serveur à CSSA actuellement vérifiée.'}</p></article>
   <article><strong>Autres entreprises & associations</strong><p>Emplacement prévu pour les organisations futures. Aucun compte ou tenant supplémentaire n’est créé.</p></article>
  </section>
  <section className="v5-panel" aria-label="Vue entreprise CSSA">
   <header><div><small>ORGANISATION PILOTE · EXEMPLE DE STRUCTURE</small><h2>CSSA — Vue entreprise</h2></div><span>Modules à raccorder</span></header>
   <div className="v5-territory-health">
    <article><small>DOMAINE SOURCE</small><strong>{domains.length}</strong><p>Domaines déclarés dans le flux C5 configuré</p></article>
    <article><small>CAPACITÉS / PREUVES</small><strong>{state?.recordCount??0}</strong><p>Enregistrements disponibles en lecture seule</p></article>
    <article><small>OBSERVATIONS LOCALES</small><strong>{observedCount}</strong><p>Non attribuées automatiquement à CSSA</p></article>
   </div>
   <div className="v5-sublayers">
    <header><div><small>CAS MÉTIERS</small><h2>Domaines de l'organisation</h2></div><span>Emplacements prévus</span></header>
    <div>{trades.map(([name,desc],i)=><article key={name}><em>{String(i+1).padStart(2,'0')}</em><strong>{name}</strong><p>{desc} · À raccorder</p></article>)}</div>
   </div>
  </section>
  <section className="v5-panel" aria-label="Projets à venir de l'organisation">
   <header><div><small>EXTENSIBILITÉ</small><h2>Projets à venir</h2></div><span>Emplacements réservés</span></header>
   <p>Les futurs projets se rattacheront à l'organisation sélectionnée, puis à leurs domaines, équipes, missions et preuves. Aucun projet n'est inventé ni créé côté serveur.</p>
   <div className="v5-sublayers"><div>
    <article><em>01</em><strong>Projets en préparation</strong><p>Emplacement pour les projets à définir.</p></article>
    <article><em>02</em><strong>Projets à connecter</strong><p>Emplacement pour les projets existants à raccorder.</p></article>
    <article><em>03</em><strong>Projets actifs</strong><p>Les projets réels apparaîtront après raccordement d'une source vérifiée.</p></article>
   </div></div>
  </section>
  <p>Gouvernance transversale : aucune action ni délégation produite par cette interface. Les preuves C5 restent consultables ci-dessous.</p>
 </section>
}
