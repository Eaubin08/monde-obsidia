import {useEffect,useMemo,useState} from 'react'
import CSSAOpsWorkspace,{type OpsTask} from './CSSAOpsWorkspace'
import './CSSAAdminPage.css'

type DocumentRef={id:string;title:string;type:string;status:string;validUntil:string;source:string;dossierId:string|null}
type Dossier={id:string;reference:string;title:string;status:string;deadline:string}
type BusinessState={documentRefs:DocumentRef[];dossiers:Dossier[]}
type Person={id:string;displayName:string;status:string}
type Engagement={id:string;personId:string;kind:string;status:string;startAt:string;endAt:string}
type Authorization={id:string;personId:string;scope:string;status:string;validUntil:string}
type OrgState={people:Person[];engagements?:Engagement[];authorizations?:Authorization[]}
type OpsState={tasks:OpsTask[]}
type Props={selectedId:string;onSelect:(moduleId:string,id:string)=>void}

export default function CSSAAdminPage({selectedId,onSelect}:Props){
 const [business,setBusiness]=useState<BusinessState|null>(null)
 const [org,setOrg]=useState<OrgState|null>(null)
 const [ops,setOps]=useState<OpsState|null>(null)
 const [error,setError]=useState(false)

 const refresh=async()=>{
  try{
   const [b,o,p]=await Promise.all([
    fetch('/obsidia-local/cssa-business-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-organisation-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-ops-state',{cache:'no-store'})
   ])
   if(!b.ok||!o.ok||!p.ok)throw new Error()
   setBusiness(await b.json());setOrg(await o.json());setOps(await p.json());setError(false)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])

 const view=useMemo(()=>{
  const docs=business?.documentRefs||[]
  const dossiers=business?.dossiers||[]
  const tasks=(ops?.tasks||[]).filter(t=>t.origin==='ADMINISTRATION'&&t.status!=='TERMINE')
  const today=new Date().toISOString().slice(0,10)
  const expiring=docs.filter(d=>d.validUntil&&d.validUntil<=new Date(Date.now()+60*86400000).toISOString().slice(0,10)&&d.status!=='EXPIRE')
  const expired=docs.filter(d=>d.status==='EXPIRE'||(d.validUntil&&d.validUntil<today))
  const unknown=docs.filter(d=>['A_VERIFIER','INCONNU'].includes(d.status))
  const engagements=(org?.engagements||[]).filter(e=>e.status!=='TERMINE')
  const auth=(org?.authorizations||[]).filter(a=>a.status!=='REVOQUEE')
  return {docs,dossiers,tasks,expiring,expired,unknown,engagements,auth}
 },[business,org,ops])

 if(error)return <section className="admx"><div className="admx-empty">Administration indisponible.</div></section>
 if(!business||!org||!ops)return <section className="admx"><div className="admx-empty">Chargement…</div></section>

 return <section className="admx">
  <header className="admx-hero">
   <div><small>ADMINISTRATION CSSA</small><h2>Qu’est-ce qui doit être complet, valide et à jour ?</h2><p>Documents, engagements, habilitations, échéances et tâches administratives dans une lecture de conformité plutôt qu’une seconde liste de tâches.</p></div>
   <div className="admx-score"><small>POINTS À REVOIR</small><strong>{view.expired.length+view.unknown.length+view.tasks.length}</strong><span>{view.expired.length} expiré(s) · {view.unknown.length} à vérifier</span></div>
  </header>

  <section className="admx-status-grid">
   <article className="danger" onClick={()=>onSelect('documents','')}><small>DOCUMENTS EXPIRÉS</small><strong>{view.expired.length}</strong><span>Pièces à renouveler ou confirmer</span></article>
   <article onClick={()=>onSelect('documents','')}><small>À VÉRIFIER</small><strong>{view.unknown.length}</strong><span>Validité ou provenance non fermée</span></article>
   <article onClick={()=>onSelect('organisation','')}><small>ENGAGEMENTS ACTIFS</small><strong>{view.engagements.length}</strong><span>Personnes & contrats internes</span></article>
   <article onClick={()=>onSelect('organisation','')}><small>HABILITATIONS</small><strong>{view.auth.length}</strong><span>Autorités explicitement enregistrées</span></article>
  </section>

  <section className="admx-grid">
   <article className="admx-panel">
    <header><div><small>CONFORMITÉ DOCUMENTAIRE</small><h3>À renouveler / contrôler</h3></div><button onClick={()=>onSelect('documents','')}>Documents →</button></header>
    {[...view.expired,...view.expiring,...view.unknown].slice(0,12).map(d=><button key={d.id} onClick={()=>onSelect('documents',d.id)}>
     <span className={view.expired.some(x=>x.id===d.id)?'bad':'warn'}>{view.expired.some(x=>x.id===d.id)?'EXPIRÉ':'REVUE'}</span>
     <div><strong>{d.title}</strong><small>{d.type} · {d.validUntil?'validité '+d.validUntil:'validité inconnue'}</small></div>
     <em>{d.status}</em>
    </button>)}
    {!view.expired.length&&!view.expiring.length&&!view.unknown.length&&<p>Aucune anomalie documentaire dérivée des données saisies.</p>}
   </article>

   <article className="admx-panel">
    <header><div><small>TRAVAIL ADMINISTRATIF</small><h3>Actions ouvertes</h3></div><button onClick={()=>onSelect('tasks','')}>Tasks →</button></header>
    {view.tasks.slice(0,12).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}>
     <span className={t.priority==='CRITIQUE'?'bad':'task'}>{t.priority}</span><div><strong>{t.title}</strong><small>{t.responsible} · {t.dueAt||'échéance inconnue'}</small></div><em>{t.status}</em>
    </button>)}
    {!view.tasks.length&&<p>Aucune tâche administrative ouverte.</p>}
   </article>
  </section>

  <section className="admx-dossiers">
   <header><div><small>DOSSIERS TRANSVERSES</small><h3>Ce qui dépend de l’administratif</h3></div><button onClick={()=>onSelect('dossiers','')}>Tous les dossiers →</button></header>
   {view.dossiers.length?<div>{view.dossiers.slice(0,8).map(d=><button key={d.id} onClick={()=>onSelect('dossiers',d.id)}><div><strong>{d.reference} · {d.title}</strong><small>{d.deadline?'échéance '+d.deadline:'échéance inconnue'}</small></div><span>{d.status.replaceAll('_',' ')}</span></button>)}</div>:<p className="admx-empty">Aucun dossier enregistré.</p>}
  </section>

  <details className="admx-tools"><summary>Gestion détaillée Administration</summary><CSSAOpsWorkspace activeModule="admin" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
