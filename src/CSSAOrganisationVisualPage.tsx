import useCssaOrganisationRead from './useCssaOrganisationRead'
import useCssaLinkedTasks from './useCssaLinkedTasks'
import useCssaLinkedDossiers from './useCssaLinkedDossiers'
import {projectCssaPersonWork} from './cssaPersonWork'
import {cssaSourceAvailable,resolveCssaReference,referenceLabels} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {useMemo,useState} from 'react'
import CSSAOrganisationPage from './CSSAOrganisationPage'
import './CSSAOrganisationVisualPage.css'

type OrgItem={id:string;title:string;subtitle:string;kind:string;status:string;meta?:Record<string,string>;semantic?:{purpose:string;limits:string}}
type Person={id:string;displayName:string;status:string;contact:string;source:string;note:string}
type RoleAssignment={id:string;personId:string;roleSlot:string;status:string;startAt:string;endAt:string;source:string}
type Availability={id:string;personId:string;from:string;to:string;status:string;note:string;source:string}
type Engagement={id:string;personId:string;type:string;startAt:string;endAt:string;status:string;compensationStatus:string;source:string}
type Authorization={id:string;personId:string;scope:string;action:string;status:string;source:string}
type OrgState={people:Person[];roleAssignments:RoleAssignment[];availabilities:Availability[];engagements:Engagement[];authorizations:Authorization[];updatedAt:string}
type Props={items:OrgItem[];selectedId?:string;onOpen:(id:string)=>void;onClear:()=>void;onNavigate:(moduleId:string,id?:string)=>void}

const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSAOrganisationVisualPage({items,selectedId,onOpen,onClear,onNavigate}:Props){
 const tasks=useCssaLinkedTasks()
 const business=useCssaLinkedDossiers()
 const [peopleFilter,setPeopleFilter]=useState<'ACTIF'|'TOUS'>('ACTIF')
 const {state,error}=useCssaOrganisationRead<OrgState>()
 const organisationAvailable=cssaSourceAvailable(state)

 const view=useMemo(()=>{
  const people=organisationAvailable?state?.people||[]:[]
  const assignments=organisationAvailable?state?.roleAssignments||[]:[]
  const availability=organisationAvailable?state?.availabilities||[]:[]
  const engagements=organisationAvailable?state?.engagements||[]:[]
  const auth=organisationAvailable?state?.authorizations||[]:[]
  const today=new Date().toISOString().slice(0,10)
  const unavailable=availability.filter(a=>a.status==='INDISPONIBLE'&&(!a.to||a.to.slice(0,10)>=today))
  const activePeople=people.filter(p=>p.status==='ACTIF')
  const activeAssignments=assignments.filter(a=>a.status==='ACTIF')
  const pendingAuth=auth.filter(a=>['EN_ATTENTE','INCONNUE'].includes(a.status))
  const activeEngagements=engagements.filter(e=>!['TERMINE','ANNULE'].includes(e.status))
  return {people,activePeople,activeAssignments,unavailable,pendingAuth,activeEngagements}
 },[state,organisationAvailable])

 if(error)return <section className="orgv"><div className="orgv-empty">UNKNOWN · source Organisation indisponible ou invalide.</div></section>
 if(!state)return <section className="orgv"><div className="orgv-empty">Chargement…</div></section>

 const personId=selectedId?.startsWith('person:')?selectedId.slice(7):''
 const personWork=personId?projectCssaPersonWork(personId,state.people,tasks.rows,business.rows,business.requirements,{organisation:organisationAvailable,ops:tasks.available,business:business.available}):null
 const selectedPerson=personWork?.person
 const shownPeople=peopleFilter==='TOUS'?view.people:view.activePeople
 return <section className="orgv">
  <CSSAStoreSourceNotice state={state}/>
  <header className="orgv-hero">
   <div><small>ORGANISATION CSSA</small><h2>Qui fait quoi dans le club ?</h2><p>Personnes, rôles, engagements, disponibilités et habilitations dans une carte humaine lisible avant les registres détaillés.</p></div>
   <div className="orgv-people-stack">{view.activePeople.slice(0,5).map(p=><span key={p.id} title={p.displayName}>{(p.displayName||'UNKNOWN').slice(0,2).toUpperCase()}</span>)}<b>{organisationAvailable?view.activePeople.length:'UNKNOWN'}</b></div>
  </header>

  <section className="orgv-kpis">
   <article><small>PERSONNES ACTIVES</small><strong>{organisationAvailable?view.activePeople.length:'UNKNOWN'}</strong><span>identités canoniques</span></article>
   <article><small>RÔLES ATTRIBUÉS</small><strong>{organisationAvailable?view.activeAssignments.length:'UNKNOWN'}</strong><span>responsabilités actives</span></article>
   <article className={view.unavailable.length?'warn':''}><small>INDISPONIBILITÉS</small><strong>{organisationAvailable?view.unavailable.length:'UNKNOWN'}</strong><span>déclarées actuellement / à venir</span></article>
   <article className={view.pendingAuth.length?'warn':''}><small>HABILITATIONS À REVOIR</small><strong>{organisationAvailable?view.pendingAuth.length:'UNKNOWN'}</strong><span>en attente ou inconnues</span></article>
  </section>

  <section className="orgv-grid">
   <article className="orgv-panel people">
    <header><div><small>ÉQUIPE HUMAINE</small><h3>Personnes & responsabilités</h3></div><select aria-label="Filtre personnes" value={peopleFilter} onChange={e=>setPeopleFilter(e.target.value as 'ACTIF'|'TOUS')}><option value="ACTIF">Actives</option><option value="TOUS">Toutes les personnes</option></select></header>
    {shownPeople.length?<div className="orgv-person-grid">{shownPeople.map(p=>{
     const roles=view.activeAssignments.filter(a=>a.personId===p.id)
     const engagement=view.activeEngagements.find(e=>e.personId===p.id)
     const unavailable=view.unavailable.some(a=>a.personId===p.id)
     return <article key={p.id}><div className="orgv-avatar">{(p.displayName||'UNKNOWN').slice(0,2).toUpperCase()}</div><div><strong>{p.displayName||'UNKNOWN'}</strong><small>{roles.length?roles.map(r=>human(r.roleSlot)).join(' · '):'Aucun rôle actif'}</small><span>{engagement?human(engagement.type):'Engagement non renseigné'}</span></div>{unavailable&&<em>Indisponible</em>}<button className="orgv-open-person" onClick={()=>onOpen('person:'+p.id)}>Fiche & travail lié · {human(p.status)}</button></article>})}</div>:<p>{organisationAvailable?'Aucune personne dans ce filtre.':'UNKNOWN · source Organisation indisponible ; aucune personne réelle ne peut être déduite du modèle de secours.'}</p>}
   </article>

   <article className="orgv-panel">
    <header><div><small>STRUCTURE PUBLIQUE</small><h3>Pôles & équipes</h3></div></header>
    <div className="orgv-structure-grid">{items.filter(x=>['role','team'].includes(x.kind)).slice(0,14).map(x=><button key={x.id} onClick={()=>onOpen(x.id)}><div className="orgv-structure-icon">{x.kind==='team'?'⚽':'◇'}</div><div><strong>{x.title}</strong><small>{x.subtitle}</small></div><span>{x.status}</span></button>)}</div>
   </article>
  </section>

  {personWork&&<section className="orgv-person-work">
   <header><h3>{selectedPerson?selectedPerson.displayName||'UNKNOWN':referenceLabels[personWork.status]}</h3><button onClick={onClear}>Fermer la fiche</button></header>
   {selectedPerson?<>
    <p>{human(selectedPerson.status)} · personne {selectedPerson.id} · source {selectedPerson.source||'UNKNOWN'}</p><p>Contact : {selectedPerson.contact||'UNKNOWN'} · {selectedPerson.note||'Aucune note enregistrée'}</p>
    <div className="orgv-work-grid">
     <article><h4>Tâches ouvertes · {tasks.available?personWork.tasks.length:'UNKNOWN'}</h4>{!tasks.available?<p>UNKNOWN · source Ops indisponible.</p>:personWork.tasks.length?personWork.tasks.map((task,index)=><button key={task.id+index} onClick={()=>onNavigate('tasks',task.id)}><strong>{task.title}</strong><small>{human(task.status)} · {task.dueAt||'échéance UNKNOWN'} · source {task.source||'UNKNOWN'}</small></button>):<p>Aucune tâche ouverte explicitement assignée.</p>}</article>
     <article><h4>Dossiers pilotés · {business.available?personWork.dossiers.length:'UNKNOWN'}</h4>{!business.available?<p>UNKNOWN · source Business indisponible.</p>:personWork.dossiers.length?personWork.dossiers.map((dossier,index)=><button key={dossier.id+index} onClick={()=>onNavigate('dossiers',dossier.id)}><strong>{dossier.reference} · {dossier.title}</strong><small>{human(dossier.status)} · source {dossier.source||'UNKNOWN'}</small></button>):<p>Aucun dossier actif explicitement assigné.</p>}</article>
     <article><h4>Exigences à traiter · {business.available?personWork.requirements.length:'UNKNOWN'}</h4>{!business.available?<p>UNKNOWN · source Business indisponible.</p>:personWork.requirements.length?personWork.requirements.map((req,index)=>{const dossier=resolveCssaReference(req.dossierId,business.rows,business.available);return <div key={req.id+index}><strong>{req.label}</strong><small>{human(req.state)} · {req.dueAt||'échéance UNKNOWN'} · source {req.source||'UNKNOWN'}</small>{dossier.item?<button onClick={()=>onNavigate('dossiers',req.dossierId)}>Ouvrir {dossier.item.reference} →</button>:<p>{referenceLabels[dossier.status]} · dossier {req.dossierId}</p>}</div>}):<p>Aucune exigence ouverte explicitement assignée.</p>}</article>
    </div>
    <details><summary>Rôles, disponibilités et habilitations enregistrés</summary>
     <h4>Rôles</h4>{state.roleAssignments.filter(row=>row.personId===personId).map(row=><p key={row.id}>{human(row.roleSlot)} · {human(row.status)} · {row.startAt||'UNKNOWN'} → {row.endAt||'UNKNOWN'} · source {row.source||'UNKNOWN'}</p>)}
     <h4>Disponibilités</h4>{state.availabilities.filter(row=>row.personId===personId).map(row=><p key={row.id}>{human(row.status)} · {row.from||'UNKNOWN'} → {row.to||'UNKNOWN'} · source {row.source||'UNKNOWN'}</p>)}
     <h4>Habilitations déclarées</h4>{state.authorizations.filter(row=>row.personId===personId).map(row=><p key={row.id}>{row.scope} · {row.action} · {human(row.status)} · source {row.source||'UNKNOWN'}</p>)}
     <p>Ces inscriptions ne constituent pas une décision d’exécution. Aucune habilitation n’est déduite d’un rôle public.</p>
    </details>
   </>:<p>La personne ne peut pas être résolue depuis la source Organisation actuelle · {personId}.</p>}
  </section>}
  <section className="orgv-strip">
   <div><small>ENGAGEMENTS ACTIFS</small><strong>{organisationAvailable?view.activeEngagements.length:'UNKNOWN'}</strong></div>
   <div><small>FRONTIÈRE DE VÉRITÉ</small><span>Aucun occupant réel n’est déduit d’un rôle public. Les personnes viennent uniquement du store Organisation.</span></div>
  </section>

  <details className="orgv-tools"><summary>Gestion détaillée · personnes, rôles, disponibilités et habilitations</summary><CSSAOrganisationPage items={items} selectedId={selectedId} onOpen={onOpen} onClear={onClear}/></details>
 </section>
}
