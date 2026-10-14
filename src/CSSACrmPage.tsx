import {useEffect,useMemo,useState} from 'react'
import CSSAOpsWorkspace from './CSSAOpsWorkspace'
import './CSSACrmPage.css'

type ExternalOrganization={id:string;name:string;kind:string;status:string;email?:string;phone?:string;address?:string}
type ExternalContact={id:string;organizationId:string;displayName:string;role:string;email:string;phone:string;status:string}
type Interaction={id:string;organizationId:string;contactId:string|null;type:string;direction:string;channel:string;occurredAt:string;summary:string;followupTaskId:string|null}
type Directory={organizations:ExternalOrganization[];contacts:ExternalContact[];interactions:Interaction[]}
type CaseRow={id:string;subject:string;category:string;relatedOrg:string;relatedOrgId?:string|null;status:string;priority:string;dates:{occurredAt:string;dueAt:string}}
type OpsState={cases:CaseRow[];tasks:{id:string;status:string;caseRef:string|null}[]}
type Props={selectedId:string;onSelect:(moduleId:string,id:string)=>void}

const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSACrmPage({selectedId,onSelect}:Props){
 const [directory,setDirectory]=useState<Directory|null>(null)
 const [ops,setOps]=useState<OpsState|null>(null)
 const [error,setError]=useState(false)

 const refresh=async()=>{
  try{
   const [d,o]=await Promise.all([
    fetch('/obsidia-local/cssa-crm-directory',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-ops-state',{cache:'no-store'})
   ])
   if(!d.ok||!o.ok)throw new Error('crm unavailable')
   setDirectory(await d.json());setOps(await o.json());setError(false)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])

 const view=useMemo(()=>{
  const orgs=directory?.organizations||[]
  const contacts=directory?.contacts||[]
  const interactions=directory?.interactions||[]
  const cases=ops?.cases||[]
  const openCases=cases.filter(c=>!['FERME','CLOSED','TERMINE'].includes(String(c.status).toUpperCase()))
  const recent=[...interactions].sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt))).slice(0,10)
  const followups=interactions.filter(i=>i.followupTaskId).length
  return {orgs,contacts,interactions,cases,openCases,recent,followups}
 },[directory,ops])

 if(error)return <section className="crmx"><div className="crmx-empty">CRM indisponible.</div></section>
 if(!directory||!ops)return <section className="crmx"><div className="crmx-empty">Chargement…</div></section>

 return <section className="crmx">
  <header className="crmx-hero">
   <div><small>CRM CSSA</small><h2>Avec qui le club est-il en relation ?</h2><p>Organismes, contacts, dossiers relationnels, échanges et prochaines actions réunis dans une lecture relationnelle.</p></div>
   <div className="crmx-hero-stats"><span><strong>{view.orgs.length}</strong><small>organismes</small></span><span><strong>{view.contacts.length}</strong><small>contacts</small></span><span><strong>{view.openCases.length}</strong><small>dossiers ouverts</small></span></div>
  </header>

  <section className="crmx-section">
   <header><div><small>RÉSEAU EXTERNE</small><h3>Acteurs & relations</h3></div><button onClick={()=>onSelect('crm','')}>Gérer le répertoire</button></header>
   {view.orgs.length?<div className="crmx-org-grid">{view.orgs.slice(0,12).map(o=>{
    const contacts=view.contacts.filter(c=>c.organizationId===o.id)
    const interactions=view.interactions.filter(i=>i.organizationId===o.id)
    const open=view.openCases.filter(c=>c.relatedOrgId===o.id)
    return <article key={o.id} onClick={()=>onSelect('crm',o.id)}>
     <div className="crmx-logo">{o.name.slice(0,2).toUpperCase()}</div>
     <div><small>{human(o.kind)}</small><h4>{o.name}</h4><p>{contacts.length} contact(s) · {interactions.length} échange(s) · {open.length} dossier(s)</p></div>
     <span>{human(o.status)}</span>
    </article>})}</div>:<div className="crmx-empty">Aucun acteur externe enregistré.</div>}
  </section>

  <section className="crmx-grid">
   <article className="crmx-panel">
    <header><div><small>DERNIERS ÉCHANGES</small><h3>Journal relationnel</h3></div><span>{view.interactions.length}</span></header>
    {view.recent.length?view.recent.map(i=>{const o=view.orgs.find(x=>x.id===i.organizationId);return <button key={i.id} onClick={()=>onSelect('crm',i.organizationId)}>
      <span>{i.type}</span><div><strong>{o?.name||'Organisme inconnu'}</strong><small>{i.summary}</small></div><time>{String(i.occurredAt).slice(0,10)}</time>
    </button>}):<p>Aucun échange enregistré.</p>}
   </article>
   <article className="crmx-panel">
    <header><div><small>DOSSIERS RELATIONNELS</small><h3>À suivre</h3></div><span>{view.openCases.length}</span></header>
    {view.openCases.length?view.openCases.slice(0,10).map(c=><button key={c.id} onClick={()=>onSelect('crm',c.id)}>
      <span className="case">{c.priority}</span><div><strong>{c.subject}</strong><small>{c.relatedOrg} · {human(c.status)}</small></div><time>{c.dates?.dueAt||'—'}</time>
    </button>):<p>Aucun dossier relationnel ouvert.</p>}
   </article>
  </section>

  <section className="crmx-next"><div><small>PROCHAINES ACTIONS</small><h3>{view.followups} relance(s) déjà reliée(s) à une interaction</h3><p>Les relances CRM restent de vraies tâches Tasks : le CRM montre la relation, Tasks porte l’exécution.</p></div><button onClick={()=>onSelect('tasks','')}>Ouvrir Tasks →</button></section>

  <details className="crmx-tools"><summary>Gestion détaillée du CRM</summary><CSSAOpsWorkspace activeModule="crm" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
