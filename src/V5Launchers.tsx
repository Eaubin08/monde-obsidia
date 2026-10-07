import {useEffect,useState} from 'react'

type Session={sessionId:string;agentId:string;name:string;presence:'live'|'unknown'|'ended';nativeService?:boolean;observedState?:'READY'|'STARTING'|'OFFLINE';objective?:string|null;message?:string}
type State={sessions:Session[]}
type JarjarStatus={state:'OFFLINE'|'STARTING'|'READY'|'DEGRADED';managed:boolean;decisionAuthority:string;inputMode:string|null;cognitionSource:string;components:{kernel:{ready:boolean};brodyApi:{ready:boolean};qwenText:{ready:boolean};qwenVL:{ready:boolean};hud:{ready:boolean}}}

const launchable=[
 ['brody','Brody','agent'],['obsidure','Obsidure','agent'],['cli','CLI Obsidia','agent'],
 ['kernel-x108','Kernel X108','service'],['obsidia-api','API Obsidia + Brody + Native Memory','service'],
 ['gps-defense','GPS / Defense / Aviation','service'],['trading-x108','Trading → X108','service'],
 ['brody-enriched','Brody Enriched','service'],['obsidure-dry','Obsidure DryRun','service'],
 ['jarvis','Jarvis','future']
] as const
const nativeIds=new Set(['kernel-x108','obsidia-api','gps-defense','trading-x108','brody-enriched','obsidure-dry'])

export default function V5Launchers(){
 const [state,setState]=useState<State|null>(null)
 const [jarjar,setJarjar]=useState<JarjarStatus|null>(null)
 const [launching,setLaunching]=useState('')
 const [message,setMessage]=useState('')

 useEffect(()=>{
  const c=new AbortController()
  const poll=async()=>{try{const [s,j]=await Promise.all([fetch('/obsidia-local/state',{signal:c.signal}),fetch('/obsidia-local/jarjar/status',{signal:c.signal})]);if(s.ok)setState(await s.json());if(j.ok)setJarjar(await j.json())}catch{}}
  void poll();const t=setInterval(poll,1200);return()=>{c.abort();clearInterval(t)}
 },[])

 const sessions=state?.sessions||[]
 const native=sessions.filter(s=>s.presence==='live'&&s.nativeService)
 const agents=sessions.filter(s=>s.presence==='live'&&!s.nativeService)

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const launch=async(id:string)=>{
  setLaunching(id);setMessage('Lancement '+id+'…')
  try{
   const terminal=nativeIds.has(id)||id==='brody'||id==='obsidure'||id==='cli'||id==='jarjar'
   const url=terminal?'/obsidia-local/open/'+id:'/obsidia-local/run'
   const r=await fetch(url,terminal?{method:'POST'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:id,mode:'interactive'})})
   const d=await r.json();if(!r.ok)throw Error(d.error||'Échec')
   if(d.sessionId){sessionStorage.setItem('obsidia-selected-session',d.sessionId);focus('session:'+d.sessionId)}
   setMessage(d.reused?id+' déjà actif · session réutilisée':id+' lancé')
  }catch(e){setMessage(String(e))}finally{setLaunching('')}
 }
 const stopJarjar=async()=>{setLaunching('jarjar');try{const r=await fetch('/obsidia-local/jarjar/stop',{method:'POST'});if(!r.ok)throw Error('Arrêt impossible');setMessage('Jarjar arrêté')}catch(e){setMessage(String(e))}finally{setLaunching('')}}

 return <section className="v5-launchers">
  <header className="v5-launchers-head"><div><small>WORKSPACE / RUNTIME</small><h2>Lancements</h2><p>Démarrer les agents, outils et services sans mélanger le runtime avec leur travail dans Pokémon.</p></div>{message&&<strong>{message}</strong>}</header>

  <article className="v5pk-jarjar">
   <div><div><small>ASSISTANT TERRAIN</small><h3>Jarjar</h3></div><strong>{jarjar?.state||'OFFLINE'}</strong></div>
   <p>Autorité {jarjar?.decisionAuthority||'KX108_ONLY'} · entrée {jarjar?.inputMode||'non observée'} · cognition {jarjar?.cognitionSource||'en attente'}</p>
   <div className="v5pk-components">{[['Kernel',jarjar?.components.kernel.ready],['API/Brody',jarjar?.components.brodyApi.ready],['Qwen',jarjar?.components.qwenText.ready],['Qwen-VL',jarjar?.components.qwenVL.ready],['HUD',jarjar?.components.hud.ready]].map(([n,ok])=><span key={String(n)} className={ok?'ok':''}>{String(n)} · {ok?'READY':'OFFLINE'}</span>)}</div>
   <div className="v5pk-actions">{jarjar?.state==='OFFLINE'?<button disabled={launching==='jarjar'} onClick={()=>launch('jarjar')}>Lancer Jarjar</button>:jarjar?.managed?<><button onClick={()=>launch('jarjar')}>Ouvrir / réutiliser</button><button disabled={launching==='jarjar'} onClick={stopJarjar}>Arrêter Jarjar</button></>:<button onClick={()=>launch('jarjar')}>Lancer / ouvrir</button>}</div>
  </article>

  <div className="v5-launcher-groups">
   <section>
    <header><small>AGENTS / OUTILS</small><h3>Sessions de travail</h3></header>
    <div className="v5pk-launch-grid">{launchable.filter(x=>x[2]==='agent').map(([id,label])=>{const active=agents.find(s=>s.agentId===id);return <article key={id} className={active?'active':'ready'}><div><strong>{label}</strong><span>{active?'LIVE':'PRÊT'}</span></div><p>{active?.objective||active?.message||(active?'Session active':'Disponible')}</p><div className="v5pk-actions"><button disabled={launching===id} onClick={()=>launch(id)}>{active?'Ouvrir / réutiliser':'Lancer'}</button>{active&&<button onClick={()=>focus('session:'+active.sessionId)}>Contexte</button>}</div></article>})}</div>
   </section>

   <section>
    <header><small>SERVICES SYSTÈME</small><h3>Runtime et domaines</h3></header>
    <div className="v5pk-launch-grid">{launchable.filter(x=>x[2]==='service').map(([id,label])=>{const svc=native.find(s=>s.agentId===id);const status=svc?.observedState||'OFFLINE';return <article key={id} className={status==='READY'?'active':status==='STARTING'?'starting':'ready'}><div><strong>{label}</strong><span>{status}</span></div><p>{status==='READY'?'Service observé actif':status==='STARTING'?'Démarrage en cours':'Arrêté / non observé'}</p><div className="v5pk-actions"><button disabled={launching===id} onClick={()=>launch(id)}>{status==='READY'?'Ouvrir / lancer':'Lancer'}</button>{svc&&<button onClick={()=>focus('session:'+svc.sessionId)}>Contexte</button>}</div></article>})}</div>
   </section>
  </div>

  <section className="v5-launcher-future"><small>À VENIR</small><strong>Jarvis</strong><span>Prévu, non activable pour l’instant.</span></section>
 </section>
}
