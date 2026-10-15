import useCssaLinkedDossiers from './useCssaLinkedDossiers'
import {readCssaTasks,type CssaTasksState} from './cssaTasksRead'
import {cssaSourceAvailable,resolveCssaReference,referenceLabels} from './cssaLinkedReference'
import useCssaPeople from './useCssaPeople'
import {resolveCssaPerson} from './cssaPeopleProjection'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {useEffect,useMemo,useState} from 'react'
import CSSAOpsWorkspace,{type OpsTask,type TaskStatus} from './CSSAOpsWorkspace'
import './CSSATasksPage.css'

type Props={selectedId:string;onSelect:(moduleId:string,id:string)=>void}
const statusColumns:{id:TaskStatus;label:string}[]=[
 {id:'A_FAIRE',label:'À faire'},{id:'EN_COURS',label:'En cours'},{id:'EN_ATTENTE',label:'En attente'},{id:'BLOQUE',label:'Bloqué'}
]

export default function CSSATasksPage({selectedId,onSelect}:Props){
 const organisation=useCssaPeople()
 const dossiers=useCssaLinkedDossiers()
 const responsible=(task:OpsTask)=>resolveCssaPerson(task.responsiblePersonId,task.responsible,organisation)
 const [state,setState]=useState<CssaTasksState|null>(null)
 const [error,setError]=useState(false)
 useEffect(()=>{
  let active=true;let generation=0
  const refresh=async()=>{
   const request=++generation
   try{
    const next=await readCssaTasks()
    if(active&&request===generation){setState(next);setError(false)}
   }catch{if(active&&request===generation){setState(null);setError(true)}}
  }
  void refresh();const timer=window.setInterval(refresh,15000)
  window.addEventListener('cssa-ops-updated',refresh)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-ops-updated',refresh)}
 },[])
 const available=cssaSourceAvailable(state)
 const view=useMemo(()=>{
  const tasks=available?state?.tasks||[]:[]
  const open=tasks.filter(t=>t.status!=='TERMINE')
  const critical=open.filter(t=>['CRITIQUE','HAUTE'].includes(t.priority))
  const blocked=open.filter(t=>t.status==='BLOQUE'||t.status==='EN_ATTENTE')
  const due=[...open].filter(t=>t.dueAt).sort((a,b)=>String(a.dueAt).localeCompare(String(b.dueAt))).slice(0,8)
  return {tasks,open,critical,blocked,due}
 },[state,available])
 if(error)return <section className="taskx"><div className="taskx-empty">UNKNOWN · source tâches indisponible ou invalide.</div></section>
 if(!state)return <section className="taskx"><div className="taskx-empty">Chargement…</div></section>
 return <section className="taskx">
  <CSSAStoreSourceNotice state={state}/>
  <header className="taskx-hero"><div><small>TASKS CSSA</small><h2>Qu’est-ce qu’on doit faire maintenant ?</h2><p>Une vue de triage opérationnel : priorités, blocages, échéances et responsabilités avant le détail technique.</p></div><div className="taskx-stats"><span><strong>{available?view.open.length:'UNKNOWN'}</strong><small>ouvertes</small></span><span><strong>{available?view.critical.length:'UNKNOWN'}</strong><small>hautes / critiques</small></span><span><strong>{available?view.blocked.length:'UNKNOWN'}</strong><small>attente / blocage</small></span></div></header>
  {available?<>
  <section className="taskx-priority"><header><div><small>FOCUS</small><h3>À traiter en premier</h3></div></header>{view.critical.length?<div>{view.critical.slice(0,8).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><span className={'taskx-priority-pill '+t.priority.toLowerCase()}>{t.priority}</span><div><strong>{t.title}</strong><small>{t.origin} · {t.dueAt||'échéance inconnue'} · {responsible(t)}</small></div><b>{t.status.replaceAll('_',' ')}</b></button>)}</div>:<p className="taskx-empty">Aucune tâche haute ou critique.</p>}</section>
  <section className="taskx-board">{statusColumns.map(col=><article key={col.id}><header><h3>{col.label}</h3><span>{view.open.filter(t=>t.status===col.id).length}</span></header><div>{view.open.filter(t=>t.status===col.id).slice(0,10).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><small>{t.origin}</small><strong>{t.title}</strong><span>{responsible(t)}</span><small>Source : {t.source||'UNKNOWN'} · {t.truthClass||'UNKNOWN'}</small><footer><em>{t.priority}</em><time>{t.dueAt||'—'}</time></footer></button>)}{!view.open.some(t=>t.status===col.id)&&<p>Rien ici.</p>}</div></article>)}</section>
  <section className="taskx-due"><header><div><small>ÉCHÉANCES</small><h3>Ce qui arrive bientôt</h3></div></header>{view.due.length?<div>{view.due.map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><time>{t.dueAt}</time><div><strong>{t.title}</strong><small>{t.origin} · {responsible(t)}</small></div><span>{t.status.replaceAll('_',' ')}</span></button>)}</div>:<p className="taskx-empty">Aucune échéance renseignée.</p>}</section>
  {view.tasks.filter(t=>t.id===selectedId).map(t=><section className="taskx-provenance" key={t.id}><h3>{t.title} · provenance</h3><p>Responsable : {responsible(t)}</p><p>Source : {t.source||'UNKNOWN'} · classe de vérité : {t.truthClass||'UNKNOWN'}</p><p>Références : tâche {t.id} · dossier CRM {t.caseRef||'UNKNOWN'} · match {t.matchRef||'UNKNOWN'}</p><button onClick={()=>onSelect('organisation',t.responsiblePersonId?'person:'+t.responsiblePersonId:'')}>Ouvrir Organisation</button>{(t.relations||[]).filter(rel=>rel.type==='DOSSIER').map(rel=>{const dossier=resolveCssaReference(rel.targetId,dossiers.rows,dossiers.available);return <div key={rel.targetId}>{dossier.item?<button onClick={()=>onSelect('dossiers',dossier.item!.id)}>Retour au dossier · {dossier.item.reference} · {dossier.item.title}</button>:<p>{referenceLabels[dossier.status]} · dossier {rel.targetId}</p>}</div>})}</section>)}
  </>:<p className="taskx-empty">UNKNOWN · aucun travail réel ne peut être déduit de cette source. La gestion détaillée permet de préparer le registre local.</p>}
  <details className="taskx-tools" open={Boolean(selectedId)}><summary>Gestion détaillée des tâches</summary><CSSAOpsWorkspace activeModule="tasks" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
