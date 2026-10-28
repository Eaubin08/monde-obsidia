import {resolveCssaReference,cssaSourceAvailable,referenceLabels} from './cssaLinkedReference'
import type {EconomyState} from './cssaEconomy'

type Organization={id:string;name:string;kind:string;status:string}
type Contact={id:string;organizationId:string;displayName:string;role:string;email:string;status:string}
type Interaction={id:string;organizationId:string;contactId:string|null;summary:string;occurredAt:string;followupTaskId:string|null}
type Crm={organizations:Organization[];contacts:Contact[];interactions:Interaction[]}
type Ops={cases:{id:string;subject:string;relatedOrgId?:string|null}[];tasks:{id:string;title?:string;status:string;caseRef:string|null}[]}
type Business={dossiers:{id:string;title:string;organizationId:string|null}[]}
type Props={selectedId:string;directory:Crm|null;ops:Ops|null;economy:EconomyState|null;business:Business|null;onSelect:(moduleId:string,id:string)=>void}
export function projectCssaActor(selectedId:string,directory:Crm|null,ops:Ops|null,economy:EconomyState|null,business:Business|null){
 const crmAvailable=cssaSourceAvailable(directory),opsAvailable=cssaSourceAvailable(ops),economyAvailable=cssaSourceAvailable(economy),businessAvailable=cssaSourceAvailable(business)
 const actor=resolveCssaReference(selectedId,directory?.organizations||[],crmAvailable)
 const organization=actor.item
 const id=organization?.id
 return {actor,organization,crmAvailable,opsAvailable,economyAvailable,businessAvailable,
  contacts:id?directory!.contacts.filter(x=>x.organizationId===id):[],
  interactions:id?directory!.interactions.filter(x=>x.organizationId===id):[],
  cases:id&&opsAvailable?ops!.cases.filter(x=>x.relatedOrgId===id):[],
  dossiers:id&&businessAvailable?business!.dossiers.filter(x=>x.organizationId===id):[],
  contracts:id&&economyAvailable?economy!.contracts.filter(x=>x.partyOrganizationId===id):[],
  invoices:id&&economyAvailable?economy!.invoices.filter(x=>x.partyOrganizationId===id):[]
 }
}
export default function CSSAActorObjectView({selectedId,directory,ops,economy,business,onSelect}:Props){
 const p=projectCssaActor(selectedId,directory,ops,economy,business)
 if(!p.organization)return <section className="crmx-panel" aria-label="Fiche acteur"><h3>Acteur</h3><p>{referenceLabels[p.actor.status]} · aucune organisation substituée.</p></section>
 const id=p.organization.id
 return <section className="crmx-panel" aria-label="Fiche acteur" data-object-id={id}>
  <header><div><small>OBJET RELATIONNEL · CRM CANONIQUE</small><h3>{p.organization.name}</h3></div><span>{p.organization.kind} · {p.organization.status}</span></header>
  <p>Identifiant : {id}. Seules les relations par référence canonique explicite sont regroupées ; un nom identique ne crée aucun lien.</p>
  <h4>Contacts ({p.contacts.length})</h4>
  {p.contacts.map(c=><p key={c.id}>{c.displayName} · {c.role} · {c.status} · {c.email||'adresse UNKNOWN'}</p>)}
  {!p.contacts.length&&<p>Aucun contact enregistré.</p>}
  <h4>Interactions ({p.interactions.length})</h4>
  {p.interactions.map(i=>{
   const contact=resolveCssaReference(i.contactId,p.contacts,p.crmAvailable)
   const followup=resolveCssaReference(i.followupTaskId,ops?.tasks||[],p.opsAvailable)
   return <div key={i.id}><p>{i.occurredAt||'Date UNKNOWN'} · {i.summary}</p>
    <p>Contact : {contact.item?.displayName||referenceLabels[contact.status]}</p>
    <p>Relance : {followup.item?.status||referenceLabels[followup.status]}</p>
    {followup.item&&<button type="button" onClick={()=>onSelect('tasks',followup.item!.id)}>Ouvrir la relance →</button>}
   </div>
  })}
  <h4>Dossiers relationnels ({p.opsAvailable?p.cases.length:'UNKNOWN'})</h4>
  {p.cases.map(c=><button key={c.id} type="button" onClick={()=>onSelect('crm',c.id)}>{c.subject} →</button>)}
  <h4>Dossiers métier ({p.businessAvailable?p.dossiers.length:'UNKNOWN'})</h4>
  {p.dossiers.map(d=><button key={d.id} type="button" onClick={()=>onSelect('dossiers',d.id)}>{d.title} →</button>)}
  <h4>Contrats ({p.economyAvailable?p.contracts.length:'UNKNOWN'})</h4>
  {p.contracts.map(c=><p key={c.id}>{c.label} · {c.status} · {c.source||'SOURCE UNKNOWN'} · échéance {c.endAt||'UNKNOWN'}</p>)}
  <h4>Factures ({p.economyAvailable?p.invoices.length:'UNKNOWN'})</h4>
  {p.invoices.map(i=><div key={i.id}><p>{i.number} · {i.label} · {i.status} · {i.source||'SOURCE UNKNOWN'}</p>
   {p.economyAvailable&&<p>Paiements référencés : {economy!.payments.filter(pay=>pay.invoiceId===i.id).length} — rapprochement financier non inféré.</p>}
  </div>)}
  {!p.economyAvailable&&<p>UNKNOWN · registre économique non disponible ; aucun contrat ni paiement déduit.</p>}
  {!p.businessAvailable&&<p>UNKNOWN · registre Dossiers indisponible.</p>}
  {!p.opsAvailable&&<p>UNKNOWN · registre Ops indisponible.</p>}
  <p>Une interaction, un contrat ou une facture enregistrés n'accordent aucune autorité ni preuve d'exécution. Gouvernance KX108_ONLY.</p>
  <nav aria-label="Territoires liés"><button onClick={()=>onSelect('finance','')}>Finance →</button><button onClick={()=>onSelect('commercial','')}>Commerce →</button><button onClick={()=>onSelect('dossiers','')}>Dossiers →</button></nav>
 </section>
}
