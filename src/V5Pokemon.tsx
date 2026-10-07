import {useEffect,useMemo,useState} from 'react'

type Event={kind:string;timestamp:string;status:string;phase:string;message:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;repository:string;status:string;phase:string;message:string;objective:string|null;timestamp:string;presence:'live'|'unknown'|'ended';events:Event[]}
type Entity={id:string;kind:string;label:string;agentId?:string;domainId?:string}
type Mission={id:string;actionId:string;agentId:string|null;status:string;traceabilityStatus:string;sessionRefs:string[];resultRefs:string[];primaryBlocker?:string}
type Family={id:string;label:string;kind:string;agents:string[];localPresent:boolean}
type NativeService={id:string;label:string;state:'READY'|'STARTING'|'OFFLINE';managed:boolean;sessionId?:string|null}
type State={entities:Entity[];relations:{from:string;type:string;to:string}[];sessions:Session[];missions:Mission[];agentFamilies?:Family[];live?:{nativeServices?:NativeService[]}}
type JarjarStatus={state:'OFFLINE'|'STARTING'|'READY'|'DEGRADED';managed:boolean;decisionAuthority:string;inputMode:string|null;hudState:string|null;cognitionSource:string;governanceSource:string;governancePhase:string;humanConfirmationRequired:boolean;lastUserInput:string;lastResult:string;components:{kernel:{ready:boolean};brodyApi:{ready:boolean};qwenText:{ready:boolean};qwenVL:{ready:boolean};hud:{ready:boolean}}}
type Filter='all'|'live'|'ready'|'planned'|'blocked'|'inactive'

const launchable=[
 ['brody','Brody',true],['obsidure','Obsidure',true],['cli','CLI Obsidia',true],
 ['kernel-x108','Kernel X108',true],['obsidia-api','API Obsidia + Brody + Native Memory',true],
 ['gps-defense','GPS / Defense / Aviation',true],['trading-x108','Trading → X108',true],
 ['brody-enriched','Brody Enriched',true],['obsidure-dry','Obsidure DryRun',true],
 ['jarjar','Jarjar',true],['jarvis','Jarvis',false]
] as const
const terminalOnly=new Set(['kernel-x108','obsidia-api','gps-defense','trading-x108','brody-enriched','obsidure-dry'])
const stage=(s:Session)=>s.status==='blocked'||s.status==='error'?'Bloqué':['STARTING','SESSION_CONFIG'].includes(s.phase)?'Préparation':s.phase==='WAITING_INPUT'?'Disponible':['V_VALIDATION','LEAN_BUILD'].includes(s.phase)?'Validation':['R_REINTEGRATION','BRODY_RESPONSE'].includes(s.phase)?'Review / preuve':'Travail'
const stages=['Disponible','Préparation','Travail','Validation','Review / preuve','Bloqué']

export default function V5Pokemon(){
 const [state,setState]=useState<State|null>(null)
 const [jarjar,setJarjar]=useState<JarjarStatus|null>(null)
 const [filter,setFilter]=useState<Filter>('all')
 const [selected,setSelected]=useState(sessionStorage.getItem('obsidia-selected-session')||'')
 const [family,setFamily]=useState('')
 const [launching,setLaunching]=useState('')
 const [message,setMessage]=useState('')
 const [catalogSelection,setCatalogSelection]=useState('')

 useEffect(()=>{
  const c=new AbortController()
  const poll=async()=>{try{const [s,j]=await Promise.all([fetch('/obsidia-local/state',{signal:c.signal}),fetch('/obsidia-local/jarjar/status',{signal:c.signal})]);if(s.ok)setState(await s.json());if(j.ok)setJarjar(await j.json())}catch{}}
  void poll();const t=setInterval(poll,1200);return()=>{c.abort();clearInterval(t)}
 },[])

 const sessions=state?.sessions||[]
 const live=sessions.filter(s=>s.presence==='live'&&s.agentId!=='cli')
 const current=sessions.find(s=>s.sessionId===selected)
 const currentMission=current?state?.missions.find(m=>m.sessionRefs.includes('session:'+current.sessionId)):undefined
 const organFamily:Family={id:'organs',label:'Organes / outils',kind:'launcher',localPresent:true,agents:launchable.map(x=>x[0]) as string[]}
 const families=[organFamily,...(state?.agentFamilies||[])]
 const catalog=new Set(families.flatMap(f=>f.agents))
 const liveIds=new Set(live.map(s=>s.agentId))
 const readyIds=new Set(launchable.filter(x=>x[2]).map(x=>x[0]).filter(id=>!liveIds.has(id)))
 const plannedIds=new Set(launchable.filter(x=>!x[2]).map(x=>x[0]))
 const blocked=live.filter(s=>s.status==='blocked'||s.status==='error')
 const inactive=[...catalog].filter(id=>!liveIds.has(id)&&!readyIds.has(id)&&!plannedIds.has(id)).length
 const counts:{id:Filter;label:string;value:number}[]=[
  {id:'all',label:'Total',value:catalog.size},{id:'live',label:'Live',value:liveIds.size},{id:'ready',label:'Prêts',value:readyIds.size},
  {id:'planned',label:'Futurs',value:plannedIds.size},{id:'blocked',label:'Bloqués',value:blocked.length},{id:'inactive',label:'Inactifs',value:inactive}
 ]
 const visible=live.filter(s=>(filter==='all'||filter==='live'||(filter==='blocked'&&(s.status==='blocked'||s.status==='error')))&&(!family||families.find(f=>f.id===family)?.agents.includes(s.agentId)))
 const teams=(state?.missions||[]).map(m=>({m,sessions:live.filter(s=>m.sessionRefs.includes('session:'+s.sessionId))})).filter(x=>x.sessions.length)
 const ungrouped=live.filter(s=>!teams.some(t=>t.sessions.some(x=>x.sessionId===s.sessionId)))
 const nativeServices=state?.live?.nativeServices||[]
 const catalogSelected=catalogSelection?catalog.has(catalogSelection)?catalogSelection:'':selected?current?.agentId||'':''
 const catalogLive=catalogSelected?live.find(s=>s.agentId===catalogSelected):undefined
 const catalogFamily=catalogSelected?families.find(f=>f.agents.includes(catalogSelected)):undefined

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const choose=(s:Session)=>{setSelected(s.sessionId);sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId)}
 const workspace=(s:Session)=>{choose(s);sessionStorage.setItem('obsidia-workspace-area',s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home');location.hash='workspace'}
 const launch=async(id:string,terminal=false)=>{setLaunching(id);setMessage('Lancement '+id+'…');try{const url=terminal?'/obsidia-local/open/'+id:'/obsidia-local/run';const r=await fetch(url,terminal?{method:'POST'}:{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({tool:id,mode:'interactive'})});const d=await r.json();if(!r.ok)throw Error(d.error||'Échec');if(d.sessionId){setSelected(d.sessionId);sessionStorage.setItem('obsidia-selected-session',d.sessionId);focus('session:'+d.sessionId)}setMessage(id+' lancé')}catch(e){setMessage(String(e))}finally{setLaunching('')}}
 const stopJarjar=async()=>{setLaunching('jarjar');try{const r=await fetch('/obsidia-local/jarjar/stop',{method:'POST'});if(!r.ok)throw Error('Arrêt impossible');setMessage('Jarjar arrêté')}catch(e){setMessage(String(e))}finally{setLaunching('')}}

 return <section className="v5pk">
  <header className="v5-page-head"><div><small>QUI ?</small><h1>Pokémon</h1><p>Les agents, leurs états et leurs actions au même endroit.</p></div><strong>{live.length} live</strong></header>

  <section className="v5pk-status">{counts.map(c=><button key={c.id} aria-pressed={filter===c.id} onClick={()=>setFilter(c.id)}><strong>{c.value}</strong><span>{c.label}</span></button>)}</section>

  <section className="v5pk-now">
   <div className="v5pk-panel">
    <div className="v5pk-title"><div><small>EN CE MOMENT</small><h2>Agents actifs</h2></div><select value={family} onChange={e=>setFamily(e.target.value)}><option value="">Toutes les familles</option>{families.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></div>
    <div className="v5pk-agent-grid">{visible.map(s=><button key={s.sessionId} className={selected===s.sessionId?'selected':''} onClick={()=>choose(s)}><span className="v5pk-live-dot"/><strong>{s.name}</strong><small>{stage(s)}</small><p>{s.objective||s.message||'En attente'}</p><em>{s.repository?.split(/[\\/]/).pop()||'contexte non observé'}</em></button>)}{!visible.length&&<p className="v5-empty">Aucun agent actif pour ce filtre.</p>}</div>
   </div>
   <aside className="v5pk-inspector">
    <small>SÉLECTION</small>
    {current?<><h2>{current.name}</h2><span className="v5pk-state">{stage(current)}</span><h3>Travail</h3><p>{current.objective||current.message}</p><h3>Mission / preuve</h3><p>{currentMission?currentMission.actionId:'Aucune mission reliée'}</p><strong>{currentMission?.traceabilityStatus||'preuve non reliée'}</strong>{currentMission?.primaryBlocker&&<p className="v5pk-blocked">{currentMission.primaryBlocker}</p>}<div className="v5pk-actions"><button onClick={()=>workspace(current)}>Workspace</button><button onClick={()=>{focus(currentMission?.id||'session:'+current.sessionId);location.hash='world'}}>Monde</button></div><details><summary>Détails techniques</summary><p>{current.sessionId}</p><p>{current.repository}</p><p>{current.phase}</p></details></>:<><h2>Aucun agent sélectionné</h2><p>Clique un agent pour voir son travail.</p></>}
   </aside>
  </section>

  <section className="v5pk-launch">
   <div className="v5pk-title"><div><small>COMMANDER</small><h2>Lancer un agent ou un service</h2></div>{message&&<span>{message}</span>}</div>
   <article className="v5pk-jarjar"><div><div><small>ASSISTANT TERRAIN</small><h3>Jarjar</h3></div><strong>{jarjar?.state||'OFFLINE'}</strong></div><p>Autorité {jarjar?.decisionAuthority||'KX108_ONLY'} · entrée {jarjar?.inputMode||'non observée'} · cognition {jarjar?.cognitionSource||'en attente'}</p><div className="v5pk-components">{[['Kernel',jarjar?.components.kernel.ready],['API/Brody',jarjar?.components.brodyApi.ready],['Qwen',jarjar?.components.qwenText.ready],['Qwen-VL',jarjar?.components.qwenVL.ready],['HUD',jarjar?.components.hud.ready]].map(([n,ok])=><span key={String(n)} className={ok?'ok':''}>{String(n)} · {ok?'READY':'OFFLINE'}</span>)}</div><div className="v5pk-actions">{jarjar?.state==='OFFLINE'?<button disabled={launching==='jarjar'} onClick={()=>launch('jarjar',true)}>Lancer Jarjar</button>:jarjar?.managed?<button disabled={launching==='jarjar'} onClick={stopJarjar}>Arrêter Jarjar</button>:<button disabled>Lancé hors Monde</button>}</div></article>
   <div className="v5pk-launch-grid">{launchable.filter(x=>x[0]!=='jarjar').map(([id,label,ready])=>{const active=live.find(s=>s.agentId===id);const native=nativeServices.find(s=>s.id===id);const serviceState=native?.state;const observedLive=!!active||serviceState==='READY';return <article key={id} className={observedLive?'active':serviceState==='STARTING'?'starting':ready?'ready':'future'}><div><strong>{label}</strong><span>{active?'LIVE':serviceState|| (ready?'PRÊT':'FUTUR')}</span></div><p>{active?.objective||active?.message||(serviceState==='READY'?'Service observé et prêt':serviceState==='STARTING'?'Démarrage en cours':ready?'Disponible':'Activation à venir')}</p><div className="v5pk-actions">{active?<><button onClick={()=>choose(active)}>Voir</button><button onClick={()=>workspace(active)}>Workspace</button></>:ready?<button disabled={launching===id||serviceState==='STARTING'} onClick={()=>launch(id,terminalOnly.has(id)||id==='brody'||id==='obsidure'||id==='cli')}>{serviceState==='STARTING'?'Démarrage…':'Lancer'}</button>:<button disabled>À venir</button>}{(id==='brody'||id==='obsidure'||id==='cli')&&<button onClick={()=>{sessionStorage.setItem('obsidia-workspace-area',id);location.hash='workspace'}}>Workspace</button>}<button onClick={()=>{setCatalogSelection(id);focus(active?'session:'+active.sessionId:'agent:'+id)}}>Détails</button></div></article>})}</div>
  </section>

  <section className="v5pk-pipeline">
   <div className="v5pk-title"><div><small>PARCOURS VIVANT</small><h2>Cycle de travail des agents</h2><p>Lis de gauche à droite : disponible → préparation → travail → validation → preuve. Les blocages sortent du flux normal.</p></div></div>
   <div>{stages.map((name,index)=>{const items=live.filter(s=>stage(s)===name);return <article key={name} className={name==='Bloqué'?'blocked-stage':''}><header><span className="stage-number">{index+1}</span><strong>{name}</strong><span>{items.length}</span></header><p className="stage-help">{name==='Disponible'?'Prêt à recevoir une demande':name==='Préparation'?'Session et contexte en préparation':name==='Travail'?'Exécution / raisonnement en cours':name==='Validation'?'Tests et vérifications':name==='Review / preuve'?'Résultat et preuve en finalisation':'Intervention nécessaire'}</p>{items.map(s=><button key={s.sessionId} onClick={()=>choose(s)}>{s.name}<small>{s.objective||s.phase}</small></button>)}</article>})}</div>
  </section>

  <section className="v5pk-split">
   <section className="v5pk-panel"><div className="v5pk-title"><div><small>MISSIONS / ÉQUIPES</small><h2>Qui travaille ensemble</h2></div></div>{teams.map(({m,sessions})=><article className="v5pk-team" key={m.id}><strong>{m.actionId}</strong><small>{m.status} · {m.traceabilityStatus}</small><div>{sessions.map(s=><button key={s.sessionId} onClick={()=>choose(s)}>{s.name}</button>)}</div></article>)}{ungrouped.length>0&&<article className="v5pk-team"><strong>Live sans mission reliée</strong><div>{ungrouped.map(s=><button key={s.sessionId} onClick={()=>choose(s)}>{s.name}</button>)}</div></article>}</section>
   <section className="v5pk-panel"><div className="v5pk-title"><div><small>POPULATION CONNUE</small><h2>Familles</h2></div></div><div className="v5pk-family-grid">{families.map(f=><button key={f.id} className={family===f.id?'selected':''} onClick={()=>{setFamily(f.id);setCatalogSelection(f.agents[0]||'')}}><strong>{f.label}</strong><span>{f.agents.filter(id=>liveIds.has(id)).length} live / {f.agents.length}</span><small>{f.kind}</small></button>)}</div></section>
  </section>

  <section className="v5pk-split">
   <details className="v5pk-archive" open><summary>Village visuel</summary><div className="v5pk-village-scene"><div className="village-zone zone-work"><strong>Zone travail</strong>{live.filter(s=>['Travail','Validation','Review / preuve'].includes(stage(s))).map(s=><button key={s.sessionId} onClick={()=>{choose(s);setCatalogSelection(s.agentId)}}><span>●</span><strong>{s.name}</strong><small>{stage(s)}</small></button>)}</div><div className="village-zone zone-ready"><strong>Zone disponible</strong>{live.filter(s=>['Disponible','Préparation'].includes(stage(s))).map(s=><button key={s.sessionId} onClick={()=>{choose(s);setCatalogSelection(s.agentId)}}><span>●</span><strong>{s.name}</strong><small>{stage(s)}</small></button>)}</div><div className="village-zone zone-blocked"><strong>Zone blocage</strong>{live.filter(s=>stage(s)==='Bloqué').map(s=><button key={s.sessionId} onClick={()=>{choose(s);setCatalogSelection(s.agentId)}}><span>●</span><strong>{s.name}</strong><small>{stage(s)}</small></button>)}</div>{!live.length&&<p className="v5-empty">Village vide.</p>}</div></details>
   <details className="v5pk-archive" open><summary>Registre détaillé du catalogue</summary><div className="v5pk-registry-layout"><div>{families.map(f=><section key={f.id}><h3>{f.label} · {f.agents.length}</h3><div className="v5pk-registry">{f.agents.map(id=><button key={id} className={catalogSelection===id?'selected':''} onClick={()=>{setCatalogSelection(id);setFamily(f.id)}}><strong>{id}</strong><small>{liveIds.has(id)?'LIVE':'inactif'}</small></button>)}</div></section>)}</div><aside className="v5pk-catalog-detail">{catalogSelected?<><small>FICHE AGENT</small><h2>{catalogSelected}</h2><p>Famille : <strong>{catalogFamily?.label||'non classée'}</strong></p><p>État : <strong>{catalogLive?'LIVE':'inactif / non observé'}</strong></p>{catalogLive&&<><p>Phase : <strong>{stage(catalogLive)}</strong></p><p>{catalogLive.objective||catalogLive.message}</p><div className="v5pk-actions"><button onClick={()=>choose(catalogLive)}>Voir la session</button><button onClick={()=>workspace(catalogLive)}>Workspace</button></div></>}<button onClick={()=>focus('agent:'+catalogSelected)}>Partager ce contexte</button></>:<><h2>Sélectionne un agent</h2><p>La fiche détaillée apparaîtra ici sans quitter Pokémon.</p></>}</aside></div></details>
  </section>
 </section>
}
