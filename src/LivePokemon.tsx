import {useEffect,useRef,useState} from 'react'
import MissionTimeline,{type MissionTimelineMission} from './MissionTimeline'
import JarjarCockpit from './JarjarCockpit'
import {AgentTown} from './vendor/agent-town/AgentTown'
import type {AgentStatus} from './vendor/agent-town/types'

type RuntimeEvent={kind:string;timestamp:string;status:AgentStatus;phase:string;message:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;pid:number;repository:string;status:AgentStatus;phase:string;message:string;objective:string|null;timestamp:string;presence:'live'|'unknown'|'ended';exitCode?:number;events:RuntimeEvent[]}
type Entity={id:string;kind:string;label:string;domainId?:string;agentId?:string;data?:unknown}
type Relation={from:string;type:string;to:string}
type Mission=MissionTimelineMission
type AgentFamily={id:string;label:string;sourceRepo:string;sourcePath?:string;localPresent:boolean;kind:string;agents:string[]}
type SharedState={schema:string;entities:Entity[];relations:Relation[];sessions:Session[];missions:Mission[];agentFamilies?:AgentFamily[]}
type StatusFilter='all'|'live'|'ready'|'planned'|'blocked'|'inactive'

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
 const [launching,setLaunching]=useState('')
 const [launchMessage,setLaunchMessage]=useState('')
 const [statusFilter,setStatusFilter]=useState<StatusFilter>('all')
 const [familyFilter,setFamilyFilter]=useState('')

 useEffect(()=>{if(!container.current)return;const scene=new AgentTown({container:container.current,environment:'town',officeSize:'large',roomMode:'environment',onAgentClick:id=>{setSelected(id);setSelectedAgent('');sessionStorage.setItem('obsidia-selected-session',id);sessionStorage.setItem('obsidia-focus-entity','session:'+id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:'session:'+id}))}});town.current=scene;return()=>{scene.destroy();town.current=null}},[])

 useEffect(()=>{const c=new AbortController();let pending=false;const poll=async()=>{if(pending)return;pending=true;try{const r=await fetch('/obsidia-local/state',{signal:c.signal});if(!r.ok)throw Error('État Obsidia indisponible');const d=await r.json();if(d.schema!=='OBSIDIA_WORLD_PROJECTION_V0'||!Array.isArray(d.sessions))throw Error('Projection Obsidia invalide');setState(d);setSessions(d.sessions);setConnected(true);setError('')}catch(e){if(!c.signal.aborted){setConnected(false);setError(String(e));setState(null);setSessions([])}}finally{pending=false}};void poll();const id=setInterval(poll,1000);return()=>{c.abort();clearInterval(id)}},[])

 useEffect(()=>{const scene=town.current;if(!scene)return;const latestByAgent=new Map<string,Session>();for(const s of sessions){if(s.agentId==='cli'||s.presence!=='live')continue;const previous=latestByAgent.get(s.agentId);if(!previous||Date.parse(s.timestamp)>Date.parse(previous.timestamp))latestByAgent.set(s.agentId,s)}const visible=[...latestByAgent.values()];const ids=new Set(visible.map(s=>s.sessionId));for(const a of scene.getAgents())if(!ids.has(a.id))scene.removeAgent(a.id);for(const s of visible){const status=s.status;const base=phaseLabel(s.phase);const message=s.objective?base+' · '+s.objective:base+' · '+s.message;const old=scene.getAgent(s.sessionId);if(!old)scene.addAgent({id:s.sessionId,name:s.name,status,message,role:'Organe Obsidia'});else if(old.userStatus!==status||old.message!==message)scene.updateAgent(s.sessionId,{status,message,name:s.name})}},[sessions])

 const live=sessions.filter(s=>s.presence==='live'&&s.agentId!=='cli')
 const current=sessions.find(s=>s.sessionId===selected)
 const currentEntity=current?state?.entities.find(e=>e.id==='session:'+current.sessionId):undefined
 const produced=currentEntity?(state?.relations.filter(r=>r.from===currentEntity.id&&['PRODUCES_RESULT','PRODUCES_ARTIFACT'].includes(r.type)).map(r=>state.entities.find(e=>e.id===r.to)).filter(Boolean)||[]):[]
 const currentMission=currentEntity?state?.missions.find(m=>m.sessionRefs.includes(currentEntity.id)):undefined
 const domains=state?.entities.filter(e=>e.kind==='domain')||[]
 const agentEntity=state?.entities.find(e=>e.id===selectedAgent)
 const launchable=[['brody','Brody',true],['obsidure','Obsidure',true],['cli','CLI Obsidia',true],['jarjar','Jarjar',true],['jarvis','Jarvis',false]] as const
 const lastSession=(agentId:string)=>sessions.filter(s=>s.agentId===agentId).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp))[0]
 const organFamily:AgentFamily={id:'organs',label:'Organes / outils',sourceRepo:'monde-obsidia',localPresent:true,kind:'launcher',agents:launchable.map(x=>x[0]) as string[]}
 const families=[organFamily,...(state?.agentFamilies||[])]
 const allCatalogIds=new Set<string>(families.flatMap(f=>f.agents))
 const liveIds=new Set<string>(sessions.filter(s=>s.presence==='live'&&s.agentId!=='cli').map(s=>s.agentId))
 const readyIds=new Set<string>(launchable.filter(([, ,ready])=>ready).map(([id])=>id).filter(id=>!sessions.some(s=>s.agentId===id&&s.presence==='live')))
 const plannedIds=new Set<string>(launchable.filter(([, ,ready])=>!ready).map(([id])=>id))
 const blockedSessions=sessions.filter(s=>s.presence==='live'&&(s.status==='blocked'||s.status==='error')&&s.agentId!=='cli')
 const inactiveCount=[...allCatalogIds].filter(id=>!liveIds.has(id)&&!readyIds.has(id)&&!plannedIds.has(id)).length
 const familyFor=(agentId:string)=>families.find(f=>f.agents.includes(agentId))
 const visibleLive=live.filter(s=>(statusFilter==='all'||statusFilter==='live'||(statusFilter==='blocked'&&(s.status==='blocked'||s.status==='error')))&&(familyFilter===''||familyFor(s.agentId)?.id===familyFilter))
 const statusCards:{id:StatusFilter;label:string;count:number}[]=[{id:'all',label:'TOTAL',count:allCatalogIds.size},{id:'live',label:'LIVE',count:liveIds.size},{id:'ready',label:'PRÊTS',count:readyIds.size},{id:'planned',label:'FUTURS',count:plannedIds.size},{id:'blocked',label:'BLOQUÉS',count:blockedSessions.length},{id:'inactive',label:'INACTIFS',count:inactiveCount}]
 const stageFor=(s:Session)=>{
  if(s.status==='blocked'||s.status==='error')return 'Bloqué'
  if(['STARTING','SESSION_CONFIG'].includes(s.phase))return 'Préparation'
  if(['WAITING_INPUT'].includes(s.phase))return 'Disponible'
  if(['V_VALIDATION','LEAN_BUILD'].includes(s.phase))return 'Validation'
  if(['R_REINTEGRATION','BRODY_RESPONSE'].includes(s.phase))return 'Review / preuve'
  return 'Travail'
 }
 const stageOrder=['Disponible','Préparation','Travail','Validation','Review / preuve','Bloqué']
 const stageSessions=stageOrder.map(stage=>({stage,sessions:live.filter(s=>stageFor(s)===stage)}))
 const missionTeams=(state?.missions||[]).map(m=>({mission:m,sessions:sessions.filter(s=>m.sessionRefs.includes('session:'+s.sessionId)&&s.presence==='live')})).filter(x=>x.sessions.length)
 const ungroupedLive=live.filter(s=>!missionTeams.some(t=>t.sessions.some(x=>x.sessionId===s.sessionId)))

 const selectContext=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const openWorkspace=(s:Session)=>{sessionStorage.setItem('obsidia-selected-session',s.sessionId);selectContext('session:'+s.sessionId);const area=s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home';sessionStorage.setItem('obsidia-workspace-area',area);location.hash='workspace'}
 const chooseAgent=(id:string)=>{setSelectedAgent(id);selectContext(id);const raw=id.startsWith('agent:')?id.slice(6):id;const running=sessions.find(s=>s.agentId===raw&&s.presence==='live');setSelected(running?.sessionId||'')}
 const startSession=async(agentId:string,terminal=false)=>{
  setLaunching(agentId+(terminal?':terminal':':integrated'));setLaunchMessage((terminal?'Ouverture terminal ':'Lancement intégré ')+agentId+'…')
  try{
   const url=terminal?'/obsidia-local/open/'+agentId:'/obsidia-local/run'
   const init=terminal?{method:'POST'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:agentId,mode:'interactive'})}
   const r=await fetch(url,init),d=await r.json()
   if(!r.ok)throw Error(d.error||('HTTP '+r.status))
   sessionStorage.setItem('obsidia-selected-session',d.sessionId)
   setSelected(d.sessionId);setSelectedAgent('')
   selectContext('session:'+d.sessionId)
   window.dispatchEvent(new CustomEvent('obsidia-session',{detail:d.sessionId}))
   setLaunchMessage((terminal?'Terminal ouvert · ':'Session intégrée · ')+agentId)
  }catch(e){setLaunchMessage(String(e))}
  finally{setLaunching('')}
 }

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
    {!visibleLive.length&&<div className="pokemon-v3-empty"><strong>Aucun agent actif pour ce filtre.</strong><p>LIVE reste strict : seule une vraie session confirmée apparaît ici.</p></div>}
    <div className="pokemon-v3-grid">{visibleLive.map(s=>{
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

   <section className="pokemon-launch-zone">
    <div className="pokemon-launch-head"><div><span className="eyebrow">DISPONIBLES</span><h2>Lancer un agent</h2><p>Uniquement les launchers réellement disponibles dans Obsidia.</p></div>{launchMessage&&<small>{launchMessage}</small>}</div>
    <div className="pokemon-launch-grid">{launchable.map(([id,label,ready])=>{const active=sessions.find(s=>s.agentId===id&&s.presence==='live');const previous=lastSession(id);return <article key={id} className={"pokemon-launch-card "+(active?'active ':'')+(ready?'':'coming-soon')}><div><strong>{label}</strong><span>{active?'LIVE':ready?'Disponible':'Bientôt'}</span></div><p>{active?.objective||previous?.objective||previous?.message||(ready?'Aucune activité récente observée.':'Point d’entrée préparé côté UI · raccordement backend à venir.')}</p><small>{previous?'Dernière activité · '+new Date(previous.timestamp).toLocaleString():ready?'Jamais observé dans ce runtime':'Préparé pour activation future'}</small><div className="workspace-v3-actions">{active?<><button onClick={()=>{setSelected(active.sessionId);selectContext('session:'+active.sessionId)}}>Continuer</button><button onClick={()=>openWorkspace(active)}>Workspace</button></>:ready?<><button disabled={launching.startsWith(id)} onClick={()=>startSession(id,false)}>{launching===id+':integrated'?'Lancement…':'Lancer ici'}</button><button disabled={launching.startsWith(id)} onClick={()=>startSession(id,true)}>{launching===id+':terminal'?'Ouverture…':'Ouvrir terminal'}</button></>:<button disabled>Activation à venir</button>}<button onClick={()=>{const target=active?'session:'+active.sessionId:'agent:'+id;selectContext(target);location.hash='world'}}>Monde</button></div></article>})}</div>
   </section>

   <JarjarCockpit/>

   <aside className="pokemon-v3-inspector">
    {current?<><span className="eyebrow">AGENT SÉLECTIONNÉ</span><h2>{current.name}</h2><div className="pokemon-v3-state">{phaseLabel(current.phase)}</div><h3>Travail actuel</h3><p>{current.objective||'Aucun objectif observé.'}</p>{currentMission&&<><h3>Mission / preuve</h3><MissionTimeline compact mission={currentMission} entities={state?.entities||[]} onFocus={id=>{selectContext(id);location.hash='world'}}/></>}<h3>Résultat</h3>{produced.length?produced.map((e,i)=><div key={i} className="pokemon-v3-result"><strong>{e?.label}</strong></div>):<p>Aucun résultat observé pour cette session.</p>}<div className="pokemon-v3-actions"><button onClick={()=>openWorkspace(current)}>Ouvrir son Workspace</button><button onClick={()=>{selectContext(currentMission?.id||'session:'+current.sessionId);location.hash='world'}}>Voir dans le Monde</button></div><details><summary>Détails techniques</summary><p>Session : {current.sessionId}</p><p>Repo : {current.repository}</p><p>Dernier signal : {current.timestamp}</p>{current.events.map((e,i)=><div key={i}><small>{new Date(e.timestamp).toLocaleTimeString()} · {phaseLabel(e.phase)}</small><p>{e.message}</p></div>)}</details></>:agentEntity?<><span className="eyebrow">AGENT DÉCLARÉ</span><h2>{agentEntity.label}</h2><p>Aucune session live observée.</p><button onClick={()=>{selectContext(agentEntity.id);location.hash='world'}}>Voir dans le Monde</button></>:<><span className="eyebrow">SÉLECTION</span><h2>Choisis un agent</h2><p>Sa mission, son état et son résultat apparaîtront ici.</p></>}
   </aside>
  </div>

  <section className="pokemon-scale-bar" aria-label="État global des agents">
   {statusCards.map(({id,label,count})=><button key={id} aria-pressed={statusFilter===id} onClick={()=>setStatusFilter(id)}><strong>{count}</strong><span>{label}</span></button>)}
  </section>

  <section className="pokemon-families">
   <div className="pokemon-families-head"><div><span className="eyebrow">CATALOGUE</span><h2>Population connue</h2><p>Ce bloc recense ce qui existe dans les différentes stacks. Il ne veut pas dire que tous ces agents sont lançables depuis cette page.</p></div>{familyFilter&&<button onClick={()=>setFamilyFilter('')}>Toutes les familles</button>}</div>
   <div className="pokemon-family-grid">{families.map(f=>{const active=f.agents.filter(id=>liveIds.has(id)).length;return <button key={f.id} data-kind={f.kind==='physical-workstream'?'physical-workstream':f.kind==='sigma'?'sigma-domain':f.kind} className={familyFilter===f.id?'selected':''} onClick={()=>setFamilyFilter(familyFilter===f.id?'':f.id)}><span>{f.kind}</span><strong>{f.label}</strong><small>{active} LIVE · {f.agents.length} catalogué(s){!f.localPresent?' · repo local absent':''}</small></button>})}</div>
  </section>

  <section className="pokemon-circuit">
   <div className="pokemon-families-head"><div><span className="eyebrow">PARCOURS VIVANT</span><h2>Où en sont les agents</h2><p>Leur place vient de leur phase runtime réelle.</p></div></div>
   <div className="pokemon-circuit-track">{stageSessions.map(({stage,sessions:stageItems},i)=><section key={stage} className={"pokemon-stage "+(stage==='Bloqué'?'blocked':'')}><div><span>{i+1}</span><strong>{stage}</strong><small>{stageItems.length}</small></div><div className="pokemon-stage-agents">{stageItems.length?stageItems.map(s=><button key={s.sessionId} onClick={()=>{setSelected(s.sessionId);setSelectedAgent('');selectContext('session:'+s.sessionId)}}><strong>{s.name}</strong><small>{s.objective||phaseLabel(s.phase)}</small></button>):<span className="pokemon-stage-empty">—</span>}</div></section>)}</div>
  </section>

  <section className="pokemon-teams">
   <div className="pokemon-families-head"><div><span className="eyebrow">MISSIONS / ÉQUIPES</span><h2>Agents qui travaillent ensemble</h2><p>Regroupement automatique par mission réellement reliée.</p></div></div>
   <div className="pokemon-team-grid">
    {missionTeams.map(({mission,sessions:teamSessions})=><article key={mission.id}><span className="world-object-kind">MISSION</span><strong>{mission.actionId}</strong><small>{mission.status} · {mission.traceabilityStatus}</small><div>{teamSessions.map(s=><button key={s.sessionId} onClick={()=>{setSelected(s.sessionId);selectContext('session:'+s.sessionId)}}>{s.name}<small>{phaseLabel(s.phase)}</small></button>)}</div><button onClick={()=>{selectContext(mission.id);location.hash='world'}}>Voir la mission</button></article>)}
    {ungroupedLive.length>0&&<article><span className="world-object-kind">LIVE SANS MISSION RELIÉE</span><strong>{ungroupedLive.length} agent(s)</strong><small>Activité réelle, relation de mission absente.</small><div>{ungroupedLive.map(s=><button key={s.sessionId} onClick={()=>{setSelected(s.sessionId);selectContext('session:'+s.sessionId)}}>{s.name}<small>{phaseLabel(s.phase)}</small></button>)}</div></article>}
    {!missionTeams.length&&!ungroupedLive.length&&<p className="muted">Aucune équipe active observée.</p>}
   </div>
  </section>

  <details className="pokemon-v3-secondary">
   <summary>Village visuel</summary>
   <div ref={container} className="live-town" aria-label="Village des agents lancés"/>
   <p className="muted">Le village affiche uniquement les sessions LIVE confirmées, une seule par agent. Les sessions terminées ou incertaines sont exclues. Clique un personnage pour synchroniser Pokémon, le Context Bridge, Workspace et Monde sur cette session.</p>
  </details>

  <details className="pokemon-v3-secondary">
   <summary>Registre détaillé du catalogue</summary>
   {domains.map(d=>{const refs=state?.relations.filter(r=>r.from===d.id&&r.type==='HAS_AGENT')||[];return <section key={d.id}><h3>{d.label} · {refs.length}</h3><div className="office-toolbar">{refs.map(r=>{const a=state?.entities.find(e=>e.id===r.to);const active=sessions.some(s=>s.agentId===a?.agentId&&s.presence==='live');return <button key={r.to} onClick={()=>chooseAgent(r.to)}>{a?.label||r.to}<small>{active?'LIVE':'inactif'}</small></button>})}</div></section>})}
  </details>
 </section>
}
