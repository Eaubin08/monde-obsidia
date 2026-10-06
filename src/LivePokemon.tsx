import {useEffect,useRef,useState} from 'react'
import MissionTimeline,{type MissionTimelineMission} from './MissionTimeline'
import {AgentTown} from './vendor/agent-town/AgentTown'
import type {AgentStatus} from './vendor/agent-town/types'

type RuntimeEvent={kind:string;timestamp:string;status:AgentStatus;phase:string;message:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;pid:number;repository:string;status:AgentStatus;phase:string;message:string;objective:string|null;timestamp:string;presence:'live'|'unknown'|'ended';exitCode?:number;events:RuntimeEvent[]}
type Entity={id:string;kind:string;label:string;domainId?:string;agentId?:string;data?:unknown}
type Relation={from:string;type:string;to:string}
type Mission=MissionTimelineMission
type SharedState={schema:string;entities:Entity[];relations:Relation[];sessions:Session[];missions:Mission[]}

const phaseLabel=(phase:string)=>({
 STARTING:'Démarrage',SESSION_CONFIG:'Configuration',WAITING_INPUT:'En attente',
 INPUT_RECEIVED:'Demande reçue',BRODY_REQUEST:'Réflexion en cours',BRODY_RESPONSE:'Réponse prête',
 A_AUDIT:'Audit en cours',V_VALIDATION:'Validation',D_DISRUPTION:'Construction',
 R_REINTEGRATION:'Préparation du résultat',LEAN_BUILD:'Tests',CYCLE_START:'Cycle en cours',
 AUDIT_ROUND:'Audit en cours',AUDIT_INTERVAL:'Pause',PROCESS_EXIT:'Terminé'
} as Record<string,string>)[phase]||phase

export default function LivePokemon(){
 const container=useRef<HTMLDivElement>(null)
 const town=useRef<AgentTown|null>(null)
 const [state,setState]=useState<SharedState|null>(null)
 const [sessions,setSessions]=useState<Session[]>([])
 const [selected,setSelected]=useState(sessionStorage.getItem('obsidia-selected-session')||'')
 const [selectedAgent,setSelectedAgent]=useState('')
 const [error,setError]=useState('')
 const [connected,setConnected]=useState(false)

 useEffect(()=>{if(!container.current)return;const scene=new AgentTown({container:container.current,environment:'town',officeSize:'large',roomMode:'environment',onAgentClick:setSelected});town.current=scene;return()=>{scene.destroy();town.current=null}},[])

 useEffect(()=>{const c=new AbortController();let pending=false;const poll=async()=>{if(pending)return;pending=true;try{const r=await fetch('/obsidia-local/state',{signal:c.signal});if(!r.ok)throw Error('État Obsidia indisponible');const d=await r.json();if(d.schema!=='OBSIDIA_WORLD_PROJECTION_V0'||!Array.isArray(d.sessions))throw Error('Projection Obsidia invalide');setState(d);setSessions(d.sessions);setConnected(true);setError('')}catch(e){if(!c.signal.aborted){setConnected(false);setError(String(e));setState(null);setSessions([])}}finally{pending=false}};void poll();const id=setInterval(poll,1000);return()=>{c.abort();clearInterval(id)}},[])

 useEffect(()=>{const scene=town.current;if(!scene)return;const visible=sessions.filter(s=>s.agentId!=='cli'&&(s.presence!=='ended'||Date.now()-Date.parse(s.timestamp)<30000));const ids=new Set(visible.map(s=>s.sessionId));for(const a of scene.getAgents())if(!ids.has(a.id))scene.removeAgent(a.id);for(const s of visible){const status=s.presence==='unknown'?'paused':s.status;const message=s.presence==='unknown'?'Activité inconnue':s.presence==='ended'?'Terminé':s.message;const old=scene.getAgent(s.sessionId);if(!old)scene.addAgent({id:s.sessionId,name:s.name,status,message,role:'Organe Obsidia'});else if(old.userStatus!==status||old.message!==message)scene.updateAgent(s.sessionId,{status,message})}},[sessions])

 const live=sessions.filter(s=>s.presence==='live'&&s.agentId!=='cli')
 const current=sessions.find(s=>s.sessionId===selected)
 const currentEntity=current?state?.entities.find(e=>e.id==='session:'+current.sessionId):undefined
 const produced=currentEntity?(state?.relations.filter(r=>r.from===currentEntity.id&&['PRODUCES_RESULT','PRODUCES_ARTIFACT'].includes(r.type)).map(r=>state.entities.find(e=>e.id===r.to)).filter(Boolean)||[]):[]
 const currentMission=currentEntity?state?.missions.find(m=>m.sessionRefs.includes(currentEntity.id)):undefined
 const domains=state?.entities.filter(e=>e.kind==='domain')||[]
 const agentEntity=state?.entities.find(e=>e.id===selectedAgent)

 const selectContext=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const openWorkspace=(s:Session)=>{sessionStorage.setItem('obsidia-selected-session',s.sessionId);selectContext('session:'+s.sessionId);const area=s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home';sessionStorage.setItem('obsidia-workspace-area',area);location.hash='workspace'}
 const chooseAgent=(id:string)=>{setSelectedAgent(id);selectContext(id);const raw=id.startsWith('agent:')?id.slice(6):id;const running=sessions.find(s=>s.agentId===raw&&s.presence==='live');setSelected(running?.sessionId||'')}

 return <section className="pokemon-v3">
  <header className="pokemon-v3-header">
   <div><span className="eyebrow">POKÉMON VIEW</span><h1>Agents Obsidia</h1><p>Qui travaille, sur quoi, et dans quel état.</p></div>
   <div className="pokemon-v3-status"><strong>{live.length}</strong><span>actif(s)</span><small>{connected?'runtime connecté':'runtime indisponible'}</small></div>
  </header>

  {error&&<p role="alert">{error}</p>}

  <div className="pokemon-v3-layout">
   <main className="pokemon-v3-active">
    <span className="eyebrow">EN CE MOMENT</span>
    <h2>Agents actifs</h2>
    {!live.length&&<div className="pokemon-v3-empty"><strong>Aucun agent actif.</strong><p>Les agents apparaissent ici dès qu’une vraie session démarre.</p></div>}
    <div className="pokemon-v3-grid">{live.map(s=>{
      const mission=state?.missions.find(m=>m.sessionRefs.includes('session:'+s.sessionId))
      const entity=state?.entities.find(e=>e.id==='session:'+s.sessionId)
      const resultRefs=entity?state?.relations.filter(r=>r.from===entity.id&&['PRODUCES_RESULT','PRODUCES_ARTIFACT'].includes(r.type))||[]:[]
      const resultRef=resultRefs[resultRefs.length-1]
      const result=resultRef?state?.entities.find(e=>e.id===resultRef.to):undefined
      return <article key={s.sessionId} className={'pokemon-v3-card '+(selected===s.sessionId?'selected':'')} onClick={()=>{setSelected(s.sessionId);setSelectedAgent('');selectContext('session:'+s.sessionId)}}>
       <div className="pokemon-v3-card-head"><strong>{s.name}</strong><span>{phaseLabel(s.phase)}</span></div>
       <p className="pokemon-v3-objective">{s.objective||'En attente d’un objectif.'}</p>
       <div className="pokemon-context-row"><span><small>Sur</small><strong>{s.repository?.split(/[\\/]/).pop()||'contexte non observé'}</strong></span><span><small>Preuve</small><strong>{mission?mission.traceabilityStatus:'non reliée'}</strong></span></div>
       {result&&<p><small>Dernier résultat</small><br/><strong>{result.label}</strong></p>}
       {mission?.primaryBlocker&&<p className="pokemon-v3-blocker"><small>Blocage</small><br/>{mission.primaryBlocker}</p>}
       <div className="workspace-v3-actions"><button onClick={e=>{e.stopPropagation();setSelected(s.sessionId);selectContext('session:'+s.sessionId)}}>Voir</button><button onClick={e=>{e.stopPropagation();openWorkspace(s)}}>Travailler avec lui</button><button onClick={e=>{e.stopPropagation();sessionStorage.setItem('obsidia-focus-entity',mission?.id||'session:'+s.sessionId);location.hash='world'}}>Monde</button></div>
      </article>
    })}</div>
   </main>

   <aside className="pokemon-v3-inspector">
    {current?<><span className="eyebrow">AGENT SÉLECTIONNÉ</span><h2>{current.name}</h2><div className="pokemon-v3-state">{phaseLabel(current.phase)}</div><h3>Travail actuel</h3><p>{current.objective||'Aucun objectif observé.'}</p>{currentMission&&<><h3>Mission / preuve</h3><MissionTimeline compact mission={currentMission} entities={state?.entities||[]} onFocus={id=>{selectContext(id);location.hash='world'}}/></>}<h3>Résultat</h3>{produced.length?produced.map((e,i)=><div key={i} className="pokemon-v3-result"><strong>{e?.label}</strong></div>):<p>Aucun résultat observé pour cette session.</p>}<div className="pokemon-v3-actions"><button onClick={()=>openWorkspace(current)}>Ouvrir son Workspace</button><button onClick={()=>{selectContext(currentMission?.id||'session:'+current.sessionId);location.hash='world'}}>Voir dans le Monde</button></div><details><summary>Détails techniques</summary><p>Session : {current.sessionId}</p><p>Repo : {current.repository}</p><p>Dernier signal : {current.timestamp}</p>{current.events.map((e,i)=><div key={i}><small>{new Date(e.timestamp).toLocaleTimeString()} · {phaseLabel(e.phase)}</small><p>{e.message}</p></div>)}</details></>:agentEntity?<><span className="eyebrow">AGENT DÉCLARÉ</span><h2>{agentEntity.label}</h2><p>Aucune session live observée.</p><button onClick={()=>{selectContext(agentEntity.id);location.hash='world'}}>Voir dans le Monde</button></>:<><span className="eyebrow">SÉLECTION</span><h2>Choisis un agent</h2><p>Sa mission, son état et son résultat apparaîtront ici.</p></>}
   </aside>
  </div>

  <details className="pokemon-v3-secondary">
   <summary>Village visuel</summary>
   <div ref={container} className="live-town" aria-label="Village des agents lancés"/>
   <p className="muted">Le village représente uniquement les vraies sessions observées.</p>
  </details>

  <details className="pokemon-v3-secondary">
   <summary>Population canonique Sigma</summary>
   {domains.map(d=>{const refs=state?.relations.filter(r=>r.from===d.id&&r.type==='HAS_AGENT')||[];return <section key={d.id}><h3>{d.label} · {refs.length}</h3><div className="office-toolbar">{refs.map(r=>{const a=state?.entities.find(e=>e.id===r.to);const active=sessions.some(s=>s.agentId===a?.agentId&&s.presence==='live');return <button key={r.to} onClick={()=>chooseAgent(r.to)}>{a?.label||r.to}<small>{active?'LIVE':'inactif'}</small></button>})}</div></section>})}
  </details>
 </section>
}
