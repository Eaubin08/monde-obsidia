import {useEffect,useMemo,useState} from 'react'
import CSSAOpsWorkspace,{type OpsTask,type TaskStatus} from './CSSAOpsWorkspace'
import './CSSATasksPage.css'

type OpsState={tasks:OpsTask[]}
type Props={selectedId:string;onSelect:(moduleId:string,id:string)=>void}
const statusColumns:{id:TaskStatus;label:string}[]=[
 {id:'A_FAIRE',label:'À faire'},{id:'EN_COURS',label:'En cours'},{id:'EN_ATTENTE',label:'En attente'},{id:'BLOQUE',label:'Bloqué'}
]

export default function CSSATasksPage({selectedId,onSelect}:Props){
 const [state,setState]=useState<OpsState|null>(null)
 const [error,setError]=useState(false)
 const refresh=async()=>{try{const r=await fetch('/obsidia-local/cssa-ops-state',{cache:'no-store'});if(!r.ok)throw new Error();setState(await r.json());setError(false)}catch{setError(true)}}
 useEffect(()=>{void refresh()},[])
 const view=useMemo(()=>{
  const tasks=state?.tasks||[]
  const open=tasks.filter(t=>t.status!=='TERMINE')
  const critical=open.filter(t=>['CRITIQUE','HAUTE'].includes(t.priority))
  const blocked=open.filter(t=>t.status==='BLOQUE'||t.status==='EN_ATTENTE')
  const due=[...open].filter(t=>t.dueAt).sort((a,b)=>String(a.dueAt).localeCompare(String(b.dueAt))).slice(0,8)
  return {tasks,open,critical,blocked,due}
 },[state])
 if(error)return <section className="taskx"><div className="taskx-empty">Tasks indisponible.</div></section>
 if(!state)return <section className="taskx"><div className="taskx-empty">Chargement…</div></section>
 return <section className="taskx">
  <header className="taskx-hero"><div><small>TASKS CSSA</small><h2>Qu’est-ce qu’on doit faire maintenant ?</h2><p>Une vue de triage opérationnel : priorités, blocages, échéances et responsabilités avant le détail technique.</p></div><div className="taskx-stats"><span><strong>{view.open.length}</strong><small>ouvertes</small></span><span><strong>{view.critical.length}</strong><small>hautes / critiques</small></span><span><strong>{view.blocked.length}</strong><small>attente / blocage</small></span></div></header>
  <section className="taskx-priority"><header><div><small>FOCUS</small><h3>À traiter en premier</h3></div></header>{view.critical.length?<div>{view.critical.slice(0,8).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><span className={'taskx-priority-pill '+t.priority.toLowerCase()}>{t.priority}</span><div><strong>{t.title}</strong><small>{t.origin} · {t.dueAt||'échéance inconnue'} · {t.responsible}</small></div><b>{t.status.replaceAll('_',' ')}</b></button>)}</div>:<p className="taskx-empty">Aucune tâche haute ou critique.</p>}</section>
  <section className="taskx-board">{statusColumns.map(col=><article key={col.id}><header><h3>{col.label}</h3><span>{view.open.filter(t=>t.status===col.id).length}</span></header><div>{view.open.filter(t=>t.status===col.id).slice(0,10).map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><small>{t.origin}</small><strong>{t.title}</strong><span>{t.responsible||'Non assigné'}</span><footer><em>{t.priority}</em><time>{t.dueAt||'—'}</time></footer></button>)}{!view.open.some(t=>t.status===col.id)&&<p>Rien ici.</p>}</div></article>)}</section>
  <section className="taskx-due"><header><div><small>ÉCHÉANCES</small><h3>Ce qui arrive bientôt</h3></div></header>{view.due.length?<div>{view.due.map(t=><button key={t.id} onClick={()=>onSelect('tasks',t.id)}><time>{t.dueAt}</time><div><strong>{t.title}</strong><small>{t.origin} · {t.responsible}</small></div><span>{t.status.replaceAll('_',' ')}</span></button>)}</div>:<p className="taskx-empty">Aucune échéance renseignée.</p>}</section>
  <details className="taskx-tools"><summary>Gestion détaillée des tâches</summary><CSSAOpsWorkspace activeModule="tasks" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
