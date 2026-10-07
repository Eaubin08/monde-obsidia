import {useEffect,useMemo,useState} from 'react'

type Event={kind:string;timestamp:string;status:string;phase:string;message:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;repository:string;status:string;phase:string;message:string;objective:string|null;timestamp:string;presence:'live'|'unknown'|'ended';nativeService?:boolean;observedState?:'READY'|'STARTING'|'OFFLINE';source?:string;events:Event[]}
type Entity={id:string;kind:string;label:string;agentId?:string;domainId?:string}
type Mission={id:string;actionId:string;agentId:string|null;status:string;traceabilityStatus:string;sessionRefs:string[];resultRefs:string[];primaryBlocker?:string}
type Family={id:string;label:string;kind:string;agents:string[];localPresent:boolean}
type State={entities:Entity[];relations:{from:string;type:string;to:string}[];sessions:Session[];missions:Mission[];agentFamilies?:Family[]}
type Filter='all'|'live'|'ready'|'planned'|'blocked'|'inactive'

const stage=(s:Session)=>s.status==='blocked'||s.status==='error'?'Bloqué':['STARTING','SESSION_CONFIG'].includes(s.phase)?'Préparation':s.phase==='WAITING_INPUT'?'Disponible':['V_VALIDATION','LEAN_BUILD'].includes(s.phase)?'Validation':['R_REINTEGRATION','BRODY_RESPONSE'].includes(s.phase)?'Review / preuve':'Travail'
const stages=['Disponible','Préparation','Travail','Validation','Review / preuve','Bloqué']

export default function V5Pokemon(){
 const [state,setState]=useState<State|null>(null)
 const [filter,setFilter]=useState<Filter>('all')
 const [selected,setSelected]=useState(sessionStorage.getItem('obsidia-selected-session')||'')
 const [family,setFamily]=useState('')
 const [catalogSelection,setCatalogSelection]=useState('')

 useEffect(()=>{
  const c=new AbortController()
  const poll=async()=>{try{const s=await fetch('/obsidia-local/state',{signal:c.signal});if(s.ok)setState(await s.json())}catch{}}
  void poll();const t=setInterval(poll,1200);return()=>{c.abort();clearInterval(t)}
 },[])

 const sessions=state?.sessions||[]
 const live=sessions.filter(s=>s.presence==='live'&&!s.nativeService&&s.agentId!=='cli')
 const current=sessions.find(s=>s.sessionId===selected)
 const currentMission=current?state?.missions.find(m=>m.sessionRefs.includes('session:'+current.sessionId)):undefined
 const declaredFamilies=state?.agentFamilies||[]
 const familyAgentIds=new Set(declaredFamilies.flatMap(f=>f.agents))
 const runtimeAgentIds=[...new Set(live.map(s=>s.agentId))].filter(id=>!familyAgentIds.has(id))
 const runtimeFamily:Family={id:'runtime-agents',label:'Agents runtime',kind:'runtime',localPresent:true,agents:runtimeAgentIds}
 const families=[...declaredFamilies,...(runtimeAgentIds.length?[runtimeFamily]:[])]
 const catalog=new Set(families.flatMap(f=>f.agents))
 const liveIds=new Set(live.map(s=>s.agentId))
 const blocked=live.filter(s=>s.status==='blocked'||s.status==='error')
 const inactive=[...catalog].filter(id=>!liveIds.has(id)).length
 const counts:{id:Filter;label:string;value:number}[]=[
  {id:'all',label:'Total',value:catalog.size},{id:'live',label:'Live',value:liveIds.size},{id:'ready',label:'Disponibles',value:live.filter(s=>stage(s)==='Disponible').length},
  {id:'planned',label:'Préparation',value:live.filter(s=>stage(s)==='Préparation').length},{id:'blocked',label:'Bloqués',value:blocked.length},{id:'inactive',label:'Inactifs',value:inactive}
 ]
 const visible=live.filter(s=>{
  const match=filter==='all'||filter==='live'||(filter==='blocked'&&(s.status==='blocked'||s.status==='error'))||(filter==='ready'&&stage(s)==='Disponible')||(filter==='planned'&&stage(s)==='Préparation')
  return match&&(!family||families.find(f=>f.id===family)?.agents.includes(s.agentId))
 })
 const teams=(state?.missions||[]).map(m=>({m,sessions:live.filter(s=>m.sessionRefs.includes('session:'+s.sessionId))})).filter(x=>x.sessions.length)
 const ungrouped=live.filter(s=>!teams.some(t=>t.sessions.some(x=>x.sessionId===s.sessionId)))
 const catalogSelected=catalogSelection?catalog.has(catalogSelection)?catalogSelection:'':selected?current?.agentId||'':''
 const catalogLive=catalogSelected?live.find(s=>s.agentId===catalogSelected):undefined
 const catalogFamily=catalogSelected?families.find(f=>f.agents.includes(catalogSelected)):undefined

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const choose=(s:Session)=>{setSelected(s.sessionId);sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId)}
 const workspace=(s:Session)=>{choose(s);sessionStorage.setItem('obsidia-workspace-area',s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home');location.hash='workspace'}

 return <section className="v5pk">
  <header className="v5-page-head"><div><small>QUI ?</small><h1>Pokémon</h1><p>Les agents, leurs états et leurs actions au même endroit.</p></div><div className="v5pk-head-counts"><strong>{live.length} agent(s) live</strong><small>services système déplacés dans Workspace</small></div></header>

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
