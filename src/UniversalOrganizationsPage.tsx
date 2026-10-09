import {useState} from 'react'

type C5Record={organizationId:string;domainId:string;capabilityId:string;gate:string;status:string;evidenceGrade:string;decisionRecordId:string;receiptId:string;canExecute:boolean}
type C5State={status:string;organizationFilter?:string|null;recordCount:number;records:C5Record[]}|null
type Props={state:C5State;observedCount:number}

const modules=[
 ['Administration','Documents, demandes et traitement'],
 ['CRM & relations','Membres, partenaires et contacts'],
 ['Communication','Mails, campagnes et publications'],
 ['Événements','Billetterie, calendrier et organisation'],
 ['Finances','Suivi financier et justificatifs'],
 ['Opérations','Missions, processus et automatisations'],
] as const

export default function UniversalOrganizationsPage({state,observedCount}:Props){
 const [selectedModule,setSelectedModule]=useState<string|null>(null)
 const organization=state?.organizationFilter||null
 const selected=modules.find(([name])=>name===selectedModule)

 return <section className="v5-panel" aria-label="Entreprises et organisations">
  <header>
   <div><small>MONDE OBSIDIA · UNIVERSALITÉ</small><h2>Entreprises & Organisations</h2></div>
   <span>Moteur universel · KX108_ONLY</span>
  </header>
  <p>Vue globale des structures raccordées au moteur universel. Chaque organisation conserve ses propres métiers, données, processus et projets.</p>

  <section className="v5-panel" aria-label="Répertoire des organisations">
   <header><div><small>ORGANISATIONS</small><h2>Vue globale</h2></div><span>Répertoire universel</span></header>
   <article>
    <strong>CSSA — Club Sportif Sedan Ardennes</strong>
    <p>Club sportif · Organisation pilote</p>
    <p>Administration, relations membres, événements, communication, finances et gouvernance.</p>
   </article>
   <article>
    <strong>Autres entreprises et associations</strong>
    <p>Même architecture universelle, avec configuration métier et données propres à chaque structure.</p>
   </article>
  </section>

  <section className="v5-panel" aria-label="Vue organisation CSSA">
   <header><div><small>ORGANISATION SÉLECTIONNÉE</small><h2>CSSA — Vue entreprise</h2></div><span>Prototype</span></header>
   <p>Vue d'ensemble de l'organisation. Les cas métiers restent accessibles à l'intérieur de CSSA et ne remplacent pas cette vue entreprise.</p>

   <div className="v5-sublayers">
    <header><div><small>DOMAINES & CAS MÉTIERS</small><h2>Modules de l'organisation</h2></div><span>À concevoir ou raccorder</span></header>
    <div>{modules.map(([name,desc],i)=><article key={name}>
     <em>{String(i+1).padStart(2,'0')}</em>
     <strong>{name}</strong>
     <p>{desc}</p>
     <button onClick={()=>setSelectedModule(selectedModule===name?null:name)}>{selectedModule===name?'Fermer':'Ouvrir'}</button>
    </article>)}</div>
   </div>

   {selected&&<section className="v5-panel" aria-label={'Module '+selected[0]}>
    <header><div><small>CAS MÉTIER CSSA</small><h2>{selected[0]}</h2></div><span>Non opérationnel</span></header>
    <p>{selected[1]}.</p>
    <p>Emplacement métier à concevoir ou raccorder. Aucune fonctionnalité opérationnelle n'est revendiquée par cette vue.</p>
   </section>}

   <section className="v5-panel" aria-label="Gouvernance transversale CSSA">
    <header><div><small>GOUVERNANCE TRANSVERSALE</small><h2>KX108, permissions et preuves</h2></div><span>Transversal · pas un métier</span></header>
    <p>Décisions KX108, permissions, validations humaines, receipts et preuves gouvernent les cas métiers sans devenir un domaine métier supplémentaire.</p>
    <p>État C5 : <strong>{state?.status||'NON_OBSERVÉ'}</strong> · périmètre serveur : <strong>{organization||'NON_CONFIGURÉ'}</strong> · observations locales non attribuées : <strong>{observedCount}</strong>.</p>
   </section>
  </section>
 </section>
}
