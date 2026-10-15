import {projectCssaAdministration} from './cssaAdministrationProjection'
import {readCssaBusiness} from './cssaBusinessRead'
import {readCssaOrganisation} from './cssaOrganisationRead'
import {readCssaTasks} from './cssaTasksRead'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {resolveCssaPerson} from './cssaPeopleProjection'
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
 const [loaded,setLoaded]=useState(false)

 useEffect(()=>{
  let active=true;let generation=0
  const refresh=async()=>{
   const request=++generation
   const [b,o,p]=await Promise.allSettled([readCssaBusiness<BusinessState>(),readCssaOrganisation<OrgState>(),readCssaTasks()])
   if(!active||request!==generation)return
   setBusiness(b.status==='fulfilled'?b.value:null)
   setOrg(o.status==='fulfilled'?o.value:null)
   setOps(p.status==='fulfilled'?p.value:null)
   setLoaded(true)
  }
  void refresh();const timer=window.setInterval(refresh,15000)
  const events=['cssa-business-updated','cssa-organisation-updated','cssa-ops-updated']
  events.forEach(event=>window.addEventListener(event,refresh))
  return()=>{active=false;window.clearInterval(timer);events.forEach(event=>window.removeEventListener(event,refresh))}
 },[])
 const view=useMemo(()=>projectCssaAdministration({business,organisation:org,ops},new Date().toISOString().slice(0,10)),[business,org,ops])
 if(!loaded)return <section className="admx"><div className="admx-empty">Chargement…</div></section>

 return <section className="admx">
  {[[business,'Documents / dossiers'],[org,'Organisation'],[ops,'Tâches']].map(([state,label])=>state?<CSSAStoreSourceNotice key={String(label)} state={state}/>:<p key={String(label)}>UNKNOWN · source {String(label)} indisponible.</p>)}
  <header className="admx-hero">
   <div><small>ADMINISTRATION CSSA</small><h2>Qu’est-ce qui doit être complet, valide et à jour ?</h2><p>Documents, engagements, habilitations, échéances et tâches administratives dans une lecture de conformité plutôt qu’une seconde liste de tâches.</p></div>
   <div className="admx-score"><small>POINTS À REVOIR</small><strong>{view.points??'UNKNOWN'}</strong><span>{view.available.business?`${view.expired.length} expiré(s) · ${view.unknown.length} à vérifier`:'Source documentaire indisponible'}</span></div>
  </header>

  <section className="admx-status-grid">
   <article className="danger" onClick={()=>onSelect('documents','')}><small>DOCUMENTS EXPIRÉS</small><strong>{view.available.business?view.expired.length:'UNKNOWN'}</strong><span>Pièces à renouveler ou confirmer</span></article>
   <article onClick={()=>onSelect('documents','')}><small>À VÉRIFIER</small><strong>{view.available.business?view.unknown.length:'UNKNOWN'}</strong><span>Validité ou provenance non fermée</span></article>
   <article onClick={()=>onSelect('organisation','')}><small>ENGAGEMENTS ACTIFS</small><strong>{view.available.organisation?view.engagements.length:'UNKNOWN'}</strong><span>Personnes & contrats internes</span></article>
   <article onClick={()=>onSelect('organisation','')}><small>HABILITATIONS</small><strong>{view.available.organisation?view.auth.length:'UNKNOWN'}</strong><span>Habilitations déclarées, hors décision d’exécution</span></article>
  </section>

  <section className="admx-grid">
   <article className="admx-panel">
    <header><div><small>CONFORMITÉ DOCUMENTAIRE</small><h3>À renouveler / contrôler</h3><small>{view.available.business?`${Math.min(view.review.length,12)}/${view.review.length} lignes affichées`:'UNKNOWN'}</small></div><button onClick={()=>onSelect('documents','')}>Documents →</button></header>
    {view.review.slice(0,12).map((d,index)=><button key={d.id+index} onClick={()=>onSelect('documents',d.id)}>
     <span className={view.expired.includes(d)?'bad':'warn'}>{view.expired.includes(d)?'EXPIRÉ':'REVUE'}</span>
     <div><strong>{d.title}</strong><small>{d.type} · {d.validUntil?'validité '+d.validUntil:'validité inconnue'} · source {d.source||'UNKNOWN'}</small></div>
     <em>{d.status}</em>
    </button>)}
    {!view.expired.length&&!view.expiring.length&&!view.unknown.length&&<p>{view.available.business?'Aucune anomalie documentaire dérivée des données saisies.':'UNKNOWN · source documentaire indisponible.'}</p>}
   </article>

   <article className="admx-panel">
    <header><div><small>TRAVAIL ADMINISTRATIF</small><h3>Actions ouvertes</h3></div><button onClick={()=>onSelect('tasks','')}>Tasks →</button></header>
    {view.tasks.slice(0,12).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}>
     <span className={t.priority==='CRITIQUE'?'bad':'task'}>{t.priority}</span><div><strong>{t.title}</strong><small>{resolveCssaPerson(t.responsiblePersonId,t.responsible,org)} · {t.dueAt||'échéance inconnue'}</small></div><em>{t.status}</em>
    </button>)}
    {!view.tasks.length&&<p>{view.available.ops?'Aucune tâche administrative ouverte.':'UNKNOWN · source tâches indisponible.'}</p>}
   </article>
  </section>

  <section className="admx-dossiers">
   <header><div><small>DOSSIERS TRANSVERSES</small><h3>Ce qui dépend de l’administratif</h3></div><button onClick={()=>onSelect('dossiers','')}>Tous les dossiers →</button></header>
   {view.dossiers.length?<div>{view.dossiers.slice(0,8).map(d=><button key={d.id} onClick={()=>onSelect('dossiers',d.id)}><div><strong>{d.reference} · {d.title}</strong><small>{d.deadline?'échéance '+d.deadline:'échéance inconnue'}</small></div><span>{d.status.replaceAll('_',' ')}</span></button>)}</div>:<p className="admx-empty">{view.available.business?'Aucun dossier enregistré.':'UNKNOWN · source dossiers indisponible.'}</p>}
  </section>

  <details className="admx-tools" open={Boolean(selectedId)}><summary>Gestion détaillée Administration</summary><CSSAOpsWorkspace activeModule="admin" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
