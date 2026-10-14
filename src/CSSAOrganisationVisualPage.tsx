import {useEffect,useMemo,useState} from 'react'
import CSSAOrganisationPage from './CSSAOrganisationPage'
import './CSSAOrganisationVisualPage.css'

type OrgItem={id:string;title:string;subtitle:string;kind:string;status:string;meta?:Record<string,string>;semantic?:{purpose:string;limits:string}}
type Person={id:string;displayName:string;status:string;contact:string;source:string;note:string}
type RoleAssignment={id:string;personId:string;roleSlot:string;status:string;startAt:string;endAt:string;source:string}
type Availability={id:string;personId:string;from:string;to:string;status:string;note:string;source:string}
type Engagement={id:string;personId:string;type:string;startAt:string;endAt:string;status:string;compensationStatus:string;source:string}
type Authorization={id:string;personId:string;scope:string;action:string;status:string;source:string}
type OrgState={people:Person[];roleAssignments:RoleAssignment[];availabilities:Availability[];engagements:Engagement[];authorizations:Authorization[];updatedAt:string}
type Props={items:OrgItem[];selectedId?:string;onOpen:(id:string)=>void;onClear:()=>void}

const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSAOrganisationVisualPage({items,selectedId,onOpen,onClear}:Props){
 const [state,setState]=useState<OrgState|null>(null)
 const [error,setError]=useState(false)
 const refresh=async()=>{try{const r=await fetch('/obsidia-local/cssa-organisation-state',{cache:'no-store'});if(!r.ok)throw new Error();setState(await r.json());setError(false)}catch{setError(true)}}
 useEffect(()=>{void refresh()},[])

 const view=useMemo(()=>{
  const people=state?.people||[]
  const assignments=state?.roleAssignments||[]
  const availability=state?.availabilities||[]
  const engagements=state?.engagements||[]
  const auth=state?.authorizations||[]
  const today=new Date().toISOString().slice(0,10)
  const unavailable=availability.filter(a=>a.status==='INDISPONIBLE'&&(!a.to||a.to.slice(0,10)>=today))
  const activePeople=people.filter(p=>p.status==='ACTIF')
  const activeAssignments=assignments.filter(a=>a.status==='ACTIF')
  const pendingAuth=auth.filter(a=>['EN_ATTENTE','INCONNUE'].includes(a.status))
  const activeEngagements=engagements.filter(e=>!['TERMINE','ANNULE'].includes(e.status))
  return {people,activePeople,activeAssignments,unavailable,pendingAuth,activeEngagements}
 },[state])

 if(error)return <section className="orgv"><div className="orgv-empty">Organisation indisponible.</div></section>
 if(!state)return <section className="orgv"><div className="orgv-empty">Chargement…</div></section>

 return <section className="orgv">
  <header className="orgv-hero">
   <div><small>ORGANISATION CSSA</small><h2>Qui fait quoi dans le club ?</h2><p>Personnes, rôles, engagements, disponibilités et habilitations dans une carte humaine lisible avant les registres détaillés.</p></div>
   <div className="orgv-people-stack">{view.activePeople.slice(0,5).map(p=><span key={p.id} title={p.displayName}>{p.displayName.slice(0,2).toUpperCase()}</span>)}<b>{view.activePeople.length}</b></div>
  </header>

  <section className="orgv-kpis">
   <article><small>PERSONNES ACTIVES</small><strong>{view.activePeople.length}</strong><span>identités canoniques</span></article>
   <article><small>RÔLES ATTRIBUÉS</small><strong>{view.activeAssignments.length}</strong><span>responsabilités actives</span></article>
   <article className={view.unavailable.length?'warn':''}><small>INDISPONIBILITÉS</small><strong>{view.unavailable.length}</strong><span>déclarées actuellement / à venir</span></article>
   <article className={view.pendingAuth.length?'warn':''}><small>HABILITATIONS À REVOIR</small><strong>{view.pendingAuth.length}</strong><span>en attente ou inconnues</span></article>
  </section>

  <section className="orgv-grid">
   <article className="orgv-panel people">
    <header><div><small>ÉQUIPE HUMAINE</small><h3>Personnes & responsabilités</h3></div></header>
    {view.activePeople.length?<div className="orgv-person-grid">{view.activePeople.slice(0,12).map(p=>{
     const roles=view.activeAssignments.filter(a=>a.personId===p.id)
     const engagement=view.activeEngagements.find(e=>e.personId===p.id)
     const unavailable=view.unavailable.some(a=>a.personId===p.id)
     return <article key={p.id}><div className="orgv-avatar">{p.displayName.slice(0,2).toUpperCase()}</div><div><strong>{p.displayName}</strong><small>{roles.length?roles.map(r=>human(r.roleSlot)).join(' · '):'Aucun rôle actif'}</small><span>{engagement?human(engagement.type):'Engagement non renseigné'}</span></div>{unavailable&&<em>Indisponible</em>}</article>})}</div>:<p>Aucune personne interne enregistrée.</p>}
   </article>

   <article className="orgv-panel">
    <header><div><small>STRUCTURE PUBLIQUE</small><h3>Pôles & équipes</h3></div></header>
    <div className="orgv-structure-grid">{items.filter(x=>['role','team'].includes(x.kind)).slice(0,14).map(x=><button key={x.id} onClick={()=>onOpen(x.id)}><div className="orgv-structure-icon">{x.kind==='team'?'⚽':'◇'}</div><div><strong>{x.title}</strong><small>{x.subtitle}</small></div><span>{x.status}</span></button>)}</div>
   </article>
  </section>

  <section className="orgv-strip">
   <div><small>ENGAGEMENTS ACTIFS</small><strong>{view.activeEngagements.length}</strong></div>
   <div><small>FRONTIÈRE DE VÉRITÉ</small><span>Aucun occupant réel n’est déduit d’un rôle public. Les personnes viennent uniquement du store Organisation.</span></div>
  </section>

  <details className="orgv-tools"><summary>Gestion détaillée · personnes, rôles, disponibilités et habilitations</summary><CSSAOrganisationPage items={items} selectedId={selectedId} onOpen={onOpen} onClear={onClear}/></details>
 </section>
}
