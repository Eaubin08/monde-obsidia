import {readCssaIntendance} from './cssaIntendanceUpdate'
import {cssaSourceAvailable} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import useCssaPeople from './useCssaPeople'
import {resolveCssaPerson} from './cssaPeopleProjection'
import {useEffect,useMemo,useState} from 'react'
import CSSAOpsWorkspace from './CSSAOpsWorkspace'
import {R1_MATCHES,R2_MATCHES,U20_MATCHES,FORMATION_MATCHES,FEMININES_MATCHES,COUPE_DE_FRANCE} from './CSSASportPage'
import './CSSAMatchdayPage.css'

type Task={id:string;title:string;status:string;priority:string;dueAt:string;origin:string;matchRef:string|null;responsible:string;responsiblePersonId?:string|null}
type Intendance={id:string;category:string;title:string;matchRef:string;venue:string;status:string;notes:string;truthClass:string;linkedTaskId:string|null;responsiblePersonId?:string|null}
type OpsState={tasks:Task[];intendanceItems:Intendance[]}
type Props={selectedId:string;onSelect:(moduleId:string,id:string)=>void}
const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSAMatchdayPage({selectedId,onSelect}:Props){
 const organisation=useCssaPeople()
 const [state,setState]=useState<OpsState|null>(null)
 const [error,setError]=useState(false)
 useEffect(()=>{
  let active=true;let generation=0
  const refresh=async()=>{
   const request=++generation
   try{
    const next=await readCssaIntendance<OpsState>()
    if(active&&request===generation){setState(next);setError(false)}
   }catch{if(active&&request===generation){setState(null);setError(true)}}
  }
  void refresh();const timer=window.setInterval(refresh,15000)
  window.addEventListener('cssa-ops-updated',refresh)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-ops-updated',refresh)}
 },[])
 const available=cssaSourceAvailable(state)

 const view=useMemo(()=>{
  const today=new Date().toISOString().slice(0,10)
  const fixtures=[...R1_MATCHES,...COUPE_DE_FRANCE,...R2_MATCHES,...U20_MATCHES,...FORMATION_MATCHES,...FEMININES_MATCHES].filter(f=>!f.simulated&&f.date>=today).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
  const next=fixtures[0]||null
  const items=available?state?.intendanceItems||[]:[]
  const nextItems=next?items.filter(i=>i.matchRef===next.id):[]
  const open=items.filter(i=>!['CONFIRMÉ','TERMINE','FERME'].includes(String(i.status).toUpperCase()))
  const tasks=(available?state?.tasks||[]:[]).filter(t=>t.matchRef&&(next?t.matchRef===next.id:true)&&t.status!=='TERMINE')
  const blocked=nextItems.filter(i=>['EN ATTENTE','UNKNOWN'].includes(i.status))
  return {next,items,nextItems,open,tasks,blocked}
 },[state,available])

 if(error)return <section className="mday"><div className="mday-empty">UNKNOWN · source Matchday indisponible ou invalide.</div></section>
 if(!state)return <section className="mday"><div className="mday-empty">Chargement…</div></section>

 return <section className="mday">
  <CSSAStoreSourceNotice state={state}/>
  <header className="mday-hero">
   {view.next?<><div className="mday-match">
    <small>PROCHAIN MATCH NON SIMULÉ</small>
    <div className="mday-teams"><strong>{view.next.home}</strong><span>VS</span><strong>{view.next.away}</strong></div>
    <p>{view.next.competition} · {view.next.date}{view.next.time?' · '+view.next.time:''}{view.next.venue?' · '+view.next.venue:''}</p>
    {view.next.truth==='PUBLIC_CONFLICT_REVIEW'&&<em>Horaire / donnée à confirmer</em>}
   </div><div className="mday-scorecard"><small>PRÉPARATION</small><strong>{available&&view.nextItems.length?Math.round((view.nextItems.filter(i=>i.status==='CONFIRMÉ').length/view.nextItems.length)*100)+'%':'UNKNOWN'}</strong><span>{available?`${view.nextItems.filter(i=>i.status==='CONFIRMÉ').length}/${view.nextItems.length} statuts confirmés enregistrés`:'Source Ops indisponible'}</span></div></>:<div className="mday-match"><small>MATCHDAY</small><h2>Aucun prochain match public non simulé dans les fixtures chargées</h2></div>}
  </header>

  <p>Calendrier de référence chargé ; préparation issue du registre Ops local. Un statut confirmé ne constitue pas une autorisation d’exécution.</p>
  <section className="mday-kpis">
   <article><small>À PRÉPARER</small><strong>{available?view.nextItems.filter(i=>i.status==='À PRÉPARER').length:'UNKNOWN'}</strong><span>prochain match</span></article>
   <article className={view.blocked.length?'warn':''}><small>EN ATTENTE / INCONNU</small><strong>{available?view.blocked.length:'UNKNOWN'}</strong><span>à lever avant match</span></article>
   <article><small>TÂCHES MATCH LIÉES</small><strong>{available?view.tasks.length:'UNKNOWN'}</strong><span>exécution dans Tasks</span></article>
   <article><small>INTENDANCE OUVERTE</small><strong>{available?view.open.length:'UNKNOWN'}</strong><span>tous matchs</span></article>
  </section>

  <section className="mday-grid">
   <article className="mday-panel">
    <header><div><small>CHECKLIST MATCHDAY</small><h3>Préparation du prochain match</h3></div></header>
    {view.nextItems.length?<div className="mday-checks">{view.nextItems.map(i=><button key={i.id} onClick={()=>onSelect('matchday',i.id)}>
     <span className={'dot '+(i.status==='CONFIRMÉ'?'ok':i.status==='À PRÉPARER'?'todo':'hold')}></span><div><strong>{i.title}</strong><small>{i.category} · {i.venue||'lieu inconnu'}</small></div><em>{i.status}</em>
    </button>)}</div>:<p>{available?'Aucun élément d’intendance relié au prochain match.':'UNKNOWN · source Intendance indisponible.'}</p>}
   </article>

   <article className="mday-panel">
    <header><div><small>EXÉCUTION</small><h3>Tâches liées au match</h3></div><button onClick={()=>onSelect('tasks','')}>Tasks →</button></header>
    {view.tasks.length?view.tasks.slice(0,10).map(t=><button className="mday-task" key={t.id} onClick={()=>onSelect('tasks',t.id)}><span>{t.priority}</span><div><strong>{t.title}</strong><small>{resolveCssaPerson(t.responsiblePersonId,t.responsible,organisation)} · {t.dueAt||'échéance inconnue'}</small></div><em>{human(t.status)}</em></button>):<p>{available?'Aucune tâche ouverte liée au prochain match.':'UNKNOWN · source tâches indisponible.'}</p>}
   </article>
  </section>

  <section className="mday-flow"><div><small>PARCOURS MATCH</small><h3>Avant → match → après</h3></div><div className="mday-steps"><span><b>1</b>Préparer</span><i>→</i><span><b>2</b>Confirmer</span><i>→</i><span><b>3</b>Exécuter</span><i>→</i><span><b>4</b>Preuves / média</span></div><button onClick={()=>onSelect('media','')}>Média →</button></section>

  <details className="mday-tools" open={Boolean(selectedId)}><summary>Gestion détaillée Matchday / intendance</summary><CSSAOpsWorkspace activeModule="matchday" selectedId={selectedId} onSelect={onSelect}/></details>
 </section>
}
