import {useEffect,useMemo,useState} from 'react'

type Event={kind:string;timestamp:string;status:string;phase:string;message:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;repository:string;status:string;phase:string;message:string;objective:string|null;timestamp:string;presence:'live'|'unknown'|'ended';nativeService?:boolean;observedState?:'READY'|'STARTING'|'OFFLINE';source?:string;events:Event[];jarjarRuntime?:boolean;inputMode?:string|null;cognitionSource?:string;decisionAuthority?:string;governanceSource?:string;governancePhase?:string;humanConfirmationRequired?:boolean;confirmationPrompt?:string;telemetryFresh?:boolean;components?:Record<string,unknown>}
type Entity={id:string;kind:string;label:string;agentId?:string;domainId?:string}
type Mission={id:string;actionId:string;agentId:string|null;domainId?:string|null;status:string;traceabilityStatus:string;sessionRefs:string[];resultRefs:string[];decisionRecordRefs?:string[];receiptRefs?:string[];impactRefs?:string[];primaryBlocker?:string}
type Family={id:string;label:string;kind:string;agents:string[];localPresent:boolean}
type State={entities:Entity[];relations:{from:string;type:string;to:string}[];sessions:Session[];missions:Mission[];agentFamilies?:Family[]}
type Filter='all'|'live'|'available'|'preparing'|'blocked'|'inactive'
type Stage='Disponible'|'Préparation'|'Travail'|'Validation'|'Preuve'|'Bloqué'

const stage=(s:Session):Stage=>{
 if(s.status==='blocked'||s.status==='error')return 'Bloqué'
 if(['STARTING','SESSION_CONFIG'].includes(s.phase))return 'Préparation'
 if(s.phase==='WAITING_INPUT')return 'Disponible'
 if(['V_VALIDATION','LEAN_BUILD'].includes(s.phase))return 'Validation'
 if(['R_REINTEGRATION','BRODY_RESPONSE'].includes(s.phase))return 'Preuve'
 return 'Travail'
}
const stages:Stage[]=['Disponible','Préparation','Travail','Validation','Preuve','Bloqué']
const stageMeta:Record<Stage,{icon:string;help:string}>={
 Disponible:{icon:'✦',help:'Prêt à recevoir une mission'},
 Préparation:{icon:'⚙',help:'Cadrage et préparation'},
 Travail:{icon:'↯',help:'Exécution et production'},
 Validation:{icon:'◇',help:'Contrôle et amélioration'},
 Preuve:{icon:'✓',help:'Résultat et preuve'},
 Bloqué:{icon:'!',help:'Diagnostic nécessaire'}
}
const roleMeta=(s:Pick<Session,'agentId'|'name'>)=>{
 const k=(s.agentId+' '+s.name).toLowerCase()
 if(k.includes('brody'))return {glyph:'▥',label:'Analyse / synthèse'}
 if(k.includes('obsidure'))return {glyph:'⬡',label:'Preuve / logique'}
 if(k.includes('jarjar')||k.includes('jarvis'))return {glyph:'≋',label:'Assistant / interaction'}
 if(k.includes('vision')||k.includes('mira'))return {glyph:'◉',label:'Vision / perception'}
 if(k.includes('plan')||k.includes('luna'))return {glyph:'◔',label:'Planification'}
 if(k.includes('audit')||k.includes('guard')||k.includes('quality'))return {glyph:'◇',label:'Contrôle / qualité'}
 if(k.includes('research')||k.includes('search')||k.includes('veille'))return {glyph:'⌕',label:'Recherche / veille'}
 if(k.includes('strategy')||k.includes('strat'))return {glyph:'♞',label:'Stratégie'}
 if(k.includes('data')||k.includes('analyse'))return {glyph:'▥',label:'Analyse / données'}
 return {glyph:'◈',label:'Agent Obsidia'}
}

export default function V5Pokemon(){
 const [state,setState]=useState<State|null>(null)
 const [filter,setFilter]=useState<Filter>('all')
 const [selected,setSelected]=useState(sessionStorage.getItem('obsidia-selected-session')||'')
 const [family,setFamily]=useState('')
 const [catalogSelection,setCatalogSelection]=useState('')
 const [runtimeError,setRuntimeError]=useState('')

 useEffect(()=>{
  const c=new AbortController()
  const poll=async()=>{try{const s=await fetch('/obsidia-local/state',{signal:c.signal});if(!s.ok)throw Error('HTTP '+s.status);setState(await s.json());setRuntimeError('')}catch(e){if(!c.signal.aborted)setRuntimeError('État runtime indisponible · '+String(e))}}
  void poll();const t=setInterval(poll,1200);return()=>{c.abort();clearInterval(t)}
 },[])

 useEffect(()=>{
  const sync=()=>{
   const focus=sessionStorage.getItem('obsidia-focus-entity')||''
   const selectedSession=sessionStorage.getItem('obsidia-selected-session')||''
   if(focus.startsWith('session:')){setSelected(focus.slice(8));return}
   const entity=state?.entities.find(e=>e.id===focus)
   if(entity?.agentId){
    const liveSession=state?.sessions.find(s=>s.presence==='live'&&!s.nativeService&&s.agentId===entity.agentId)
    if(liveSession){setSelected(liveSession.sessionId);return}
   }
   if(selectedSession)setSelected(selectedSession)
  }
  const onContext=()=>sync()
  window.addEventListener('obsidia-context',onContext)
  sync()
  return()=>window.removeEventListener('obsidia-context',onContext)
 },[state])

 const sessions=state?.sessions||[]
 const live=sessions.filter(s=>s.presence==='live'&&!s.nativeService&&s.agentId!=='cli')
 const current=live.find(s=>s.sessionId===selected)||live[0]
 const currentMission=current?state?.missions.find(m=>m.sessionRefs.includes('session:'+current.sessionId)):undefined
 const declaredFamilies=state?.agentFamilies||[]
 const familyAgentIds=new Set(declaredFamilies.flatMap(f=>f.agents))
 const runtimeAgentIds=[...new Set(live.map(s=>s.agentId))].filter(id=>!familyAgentIds.has(id))
 const runtimeFamily:Family={id:'runtime-agents',label:'Agents runtime',kind:'runtime',localPresent:true,agents:runtimeAgentIds}
 const families=[...declaredFamilies,...(runtimeAgentIds.length?[runtimeFamily]:[])]
 const catalog=new Set(families.flatMap(f=>f.agents))
 const liveIds=new Set(live.map(s=>s.agentId))
 const blocked=live.filter(s=>stage(s)==='Bloqué')
 const inactiveIds=declaredFamilies.filter(f=>!f.localPresent).flatMap(f=>f.agents).filter(id=>!liveIds.has(id))
 const inactiveSet=new Set(inactiveIds)
 const availableIds=[...catalog].filter(id=>!liveIds.has(id)&&!inactiveSet.has(id))
 const counts:{id:Filter;label:string;value:number}[]=[
  {id:'all',label:'Population',value:catalog.size},
  {id:'live',label:'Agents vivants',value:live.length},
  {id:'available',label:'Disponibles',value:availableIds.length+live.filter(s=>stage(s)==='Disponible').length},
  {id:'preparing',label:'Préparation',value:live.filter(s=>stage(s)==='Préparation').length},
  {id:'blocked',label:'Bloqués',value:blocked.length},
  {id:'inactive',label:'Inactifs',value:inactiveIds.length}
 ]
 const visible=live.filter(s=>{
  const st=stage(s)
  const match=filter==='all'||filter==='live'||(filter==='blocked'&&st==='Bloqué')||(filter==='available'&&st==='Disponible')||(filter==='preparing'&&st==='Préparation')
  return match&&(!family||families.find(f=>f.id===family)?.agents.includes(s.agentId))
 })
 const teams=(state?.missions||[]).map(m=>({m,sessions:live.filter(s=>m.sessionRefs.includes('session:'+s.sessionId))})).filter(x=>x.sessions.length)
 const ungrouped=live.filter(s=>!teams.some(t=>t.sessions.some(x=>x.sessionId===s.sessionId)))
 const catalogSelected=catalogSelection?catalog.has(catalogSelection)?catalogSelection:'':current?.agentId||''
 const catalogLive=catalogSelected?live.find(s=>s.agentId===catalogSelected):undefined
 const catalogFamily=catalogSelected?families.find(f=>f.agents.includes(catalogSelected)):undefined
 const selectedFamily=current?families.find(f=>f.agents.includes(current.agentId)):undefined
 const currentRole=current?roleMeta(current):null
 const agentContext=useMemo(()=>{
  if(!current||!state)return null
  const agentEntity=state.entities.find(e=>e.kind==='agent'&&e.agentId===current.agentId)
  const mission=currentMission
  const domainId=mission?.domainId?('domain:'+mission.domainId):(agentEntity?.domainId?('domain:'+agentEntity.domainId):state.relations.find(r=>r.from===agentEntity?.id&&r.type==='BELONGS_TO_DOMAIN')?.to)
  const domain=domainId?state.entities.find(e=>e.id===domainId):undefined
  const evidenceIds=new Set([
   ...(mission?.resultRefs||[]),
   ...(mission?.decisionRecordRefs||[]),
   ...(mission?.receiptRefs||[]),
   ...(mission?.impactRefs||[]),
  ])
  const evidence=state.entities.filter(e=>evidenceIds.has(e.id))
  const results=evidence.filter(e=>['result','artifact'].includes(e.kind))
  const proofs=evidence.filter(e=>['decision_record','sealed_receipt','receipt','impact','rollback_evidence'].includes(e.kind))
  const relationCount=agentEntity?state.relations.filter(r=>r.from===agentEntity.id||r.to===agentEntity.id).length:0
  return {
   agentEntity,
   domain,
   mission,
   results,
   proofs,
   relationCount,
   status:mission?.primaryBlocker?'ATTENTION':current.presence==='live'?'LIVE':'OBSERVÉ',
  }
 },[current,currentMission,state])

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const choose=(s:Session)=>{setSelected(s.sessionId);sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId)}
 const openWorld=(id:string,zone:'agents'|'activity'|'domains')=>{focus(id);window.dispatchEvent(new CustomEvent('obsidia-world-zone',{detail:zone}));location.hash='world'}
 const workspace=(s:Session)=>{choose(s);sessionStorage.setItem('obsidia-workspace-area',s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home');location.hash='workspace'}

 return <section className="v5pk v5pk-world">
  {runtimeError&&<p className="v5-message">{runtimeError}</p>}
  <header className="v5pk-hero-head">
   <div><small>QUI ?</small><h1>Pokémon</h1><p>Un village vivant d’agents : qui travaille, où, avec qui et jusqu’à quelle preuve.</p></div>
   <div className="v5pk-head-counts"><strong>{live.length} agent(s) live</strong><small>services système dans Workspace</small></div>
  </header>

  <section className="v5pk-status v5pk-status-rich">{counts.map(c=><button key={c.id} aria-pressed={filter===c.id} onClick={()=>setFilter(c.id)}><strong>{c.value}</strong><span>{c.label}</span></button>)}</section>

  <section className="v5pk-village-layout">
   <article className="v5pk-village-card">
    <header className="v5pk-section-head"><div><small>VILLAGE VIVANT</small><h2>Agents par cycle de vie</h2><p>Chaque zone représente un état réel observé dans le travail des agents.</p></div><select value={family} onChange={e=>setFamily(e.target.value)}><option value="">Toutes les familles</option>{families.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}</select></header>
    <div className="v5pk-village-map">
     {stages.map(name=>{
      const items=visible.filter(s=>stage(s)===name)
      const meta=stageMeta[name]
      return <section key={name} className={'v5pk-habitat habitat-'+name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}>
       <header><span className="v5pk-habitat-icon">{meta.icon}</span><div><strong>{name}</strong><small>{items.length} agent(s)</small></div></header>
       <div className="v5pk-habitat-agents">{items.map(s=>{const role=roleMeta(s);return <button key={s.sessionId} className={current?.sessionId===s.sessionId?'selected':''} onClick={()=>choose(s)} title={role.label}><span className="v5pk-role-symbol">{role.glyph}</span><strong>{s.name}</strong><small>{role.label}</small></button>})}{!items.length&&<span className="v5pk-zone-empty">Aucun agent</span>}</div>
      </section>
     })}
     {(filter==='available'||filter==='inactive')&&<section className="v5pk-habitat habitat-disponible"><header><span className="v5pk-habitat-icon">{filter==='available'?'✦':'○'}</span><div><strong>{filter==='available'?'Disponibles':'Inactifs'}</strong><small>{(filter==='available'?availableIds:inactiveIds).length} agent(s)</small></div></header><div className="v5pk-habitat-agents">{(filter==='available'?availableIds:inactiveIds).map(id=><button key={id} onClick={()=>setCatalogSelection(id)} title={id}><span className="v5pk-role-symbol">◈</span><strong>{id}</strong><small>{filter==='available'?'Prêt à être lancé':'Non observé localement'}</small></button>)}</div></section>}
     <div className="v5pk-village-core"><span>◈</span><small>Obsidia</small></div>
    </div>
   </article>

   <aside className="v5pk-agent-card">
    <header><small>FICHE AGENT</small>{current&&<span className="v5pk-live-pill">● Actif</span>}</header>
    {current?<><div className="v5pk-agent-identity"><span className="v5pk-agent-emblem">{currentRole?.glyph}</span><div><h2>{current.name}</h2><p>{currentRole?.label}</p></div></div>
     {current.jarjarRuntime&&<div className="v5pk-runtime-facts"><p><small>Entrée</small><strong>{current.inputMode||'non observée'}</strong></p><p><small>Cognition</small><strong>{current.cognitionSource||'en attente'}</strong></p><p><small>Autorité</small><strong>{current.decisionAuthority||'KX108_ONLY'}</strong></p><p><small>Gouvernance</small><strong>{current.governancePhase||current.governanceSource||'aucune action'}</strong></p>{current.confirmationPrompt&&<p><small>Confirmation</small><strong>{current.confirmationPrompt}</strong></p>}<p><small>Télémétrie</small><strong>{current.telemetryFresh?'fraîche':'non fraîche'}</strong></p></div>}
     <nav className="v5pk-agent-tabs"><button aria-pressed="true">Vue d’ensemble</button><button onClick={()=>focus(currentMission?.id||'session:'+current.sessionId)}>Mission</button><button onClick={()=>focus('session:'+current.sessionId)}>Historique</button></nav>
     <dl className="v5pk-agent-facts">
      <div><dt>Famille</dt><dd>{selectedFamily?.label||'Runtime'}</dd></div>
      <div><dt>Mission actuelle</dt><dd>{currentMission?.actionId||'Aucune mission reliée'}</dd></div>
      <div><dt>Phase actuelle</dt><dd><span className={'stage-dot stage-'+stage(current).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}/>{stage(current)}</dd></div>
      <div><dt>Dernière action</dt><dd>{current.objective||current.message||current.phase}</dd></div>
      <div><dt>Preuve</dt><dd>{currentMission?.traceabilityStatus||'Non reliée'}</dd></div>
      <div><dt>Statut</dt><dd>{currentMission?.primaryBlocker?'Blocage : '+currentMission.primaryBlocker:'En cours'}</dd></div>
     </dl>
     {agentContext&&<section className="v5pk-agent-context">
      <header><small>CONTEXTE AGENT</small><span>{agentContext.status}</span></header>
      <div className="v5pk-agent-context-grid">
       <article><small>DOMAINE</small><strong>{agentContext.domain?.label||'Non relié'}</strong></article>
       <article><small>MISSION</small><strong>{agentContext.mission?.actionId||'Aucune mission reliée'}</strong></article>
       <article><small>RÉSULTATS</small><strong>{agentContext.results.length}</strong></article>
       <article><small>PREUVES</small><strong>{agentContext.proofs.length}</strong></article>
       <article><small>RELATIONS</small><strong>{agentContext.relationCount}</strong></article>
      </div>
      <div className="v5pk-agent-context-actions">
       {agentContext.agentEntity&&<button onClick={()=>openWorld(agentContext.agentEntity!.id,'agents')}>Voir l’agent dans Monde</button>}
       {agentContext.mission&&<button onClick={()=>openWorld(agentContext.mission!.id,'activity')}>Voir la mission</button>}
       {agentContext.domain&&<button onClick={()=>openWorld(agentContext.domain!.id,'domains')}>Voir le domaine</button>}
       <button onClick={()=>workspace(current)}>Continuer dans Workspace</button>
      </div>
      <p>Projection readonly des liaisons déjà observées pour cet agent.</p>
     </section>}
     <button className="v5pk-workspace-cta" onClick={()=>workspace(current)}>Ouvrir dans Workspace</button>
     <details className="v5pk-tech"><summary>Détails techniques</summary><p>{current.sessionId}</p><p>{current.repository}</p><p>{current.phase}</p></details>
    </>:<div className="v5-empty"><h2>Aucun agent actif</h2><p>Le village se remplira avec les sessions observées.</p></div>}
   </aside>
  </section>

  <section className="v5pk-cycle">
   <header className="v5pk-section-head"><div><small>CYCLE VIVANT</small><h2>Du disponible à la preuve</h2><p>Le parcours réel d’un agent, avec le blocage comme sortie d’exception.</p></div></header>
   <div className="v5pk-cycle-track">{stages.map(name=>{const items=live.filter(s=>stage(s)===name);const meta=stageMeta[name];return <article key={name} className={'cycle-'+name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,'-')}><span className="v5pk-cycle-icon">{meta.icon}</span><div><strong>{name}</strong><small>{meta.help}</small></div><em>{items.length}</em><div className="v5pk-cycle-agents">{items.slice(0,5).map(s=><button key={s.sessionId} onClick={()=>choose(s)} title={s.name}>{roleMeta(s).glyph}</button>)}{items.length>5&&<span>+{items.length-5}</span>}</div></article>})}</div>
  </section>

  <section className="v5pk-bottom-grid">
   <article className="v5pk-panel">
    <div className="v5pk-title"><div><small>MISSIONS / ÉQUIPES</small><h2>Qui travaille ensemble</h2></div></div>
    <div className="v5pk-team-list">{teams.map(({m,sessions})=><button className="v5pk-team-row" key={m.id} onClick={()=>focus(m.id)}><span className="v5pk-team-mark">◎</span><div><strong>{m.actionId}</strong><small>{m.status} · {m.traceabilityStatus}</small></div><div className="v5pk-mini-agents">{sessions.map(s=><i key={s.sessionId} title={s.name}>{roleMeta(s).glyph}</i>)}</div><em>{sessions.length}</em></button>)}{ungrouped.length>0&&<div className="v5pk-team-row muted"><span className="v5pk-team-mark">○</span><div><strong>Live sans mission reliée</strong><small>{ungrouped.length} agent(s)</small></div><div className="v5pk-mini-agents">{ungrouped.map(s=><i key={s.sessionId}>{roleMeta(s).glyph}</i>)}</div></div>}{!teams.length&&!ungrouped.length&&<p className="v5-empty">Aucune équipe observée.</p>}</div>
   </article>

   <article className="v5pk-panel">
    <div className="v5pk-title"><div><small>FAMILLES / POPULATION</small><h2>Population connue</h2></div></div>
    <div className="v5pk-family-list">{families.map(f=>{const liveCount=f.agents.filter(id=>liveIds.has(id)).length;return <button key={f.id} className={family===f.id?'selected':''} onClick={()=>{setFamily(f.id);setCatalogSelection(f.agents[0]||'')}}><span className="v5pk-family-symbol">◫</span><div><strong>{f.label}</strong><small>{liveCount} live / {f.agents.length} connus</small></div><em>{f.kind}</em></button>})}</div>
   </article>

   <details className="v5pk-panel v5pk-registry-compact" open>
    <summary>Registre détaillé</summary>
    <div className="v5pk-registry-stream">{live.slice().sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp))).slice(0,12).map(s=><button key={s.sessionId} onClick={()=>{choose(s);setCatalogSelection(s.agentId)}}><time>{String(s.timestamp||'').slice(11,16)||'—'}</time><span className="v5pk-stream-symbol">{roleMeta(s).glyph}</span><div><strong>{s.name}</strong><small>{s.objective||s.message||stage(s)}</small></div><em>{stage(s)}</em></button>)}{!live.length&&<p className="v5-empty">Aucune activité live.</p>}</div>
   </details>
  </section>

  {catalogSelected&&<section className="v5pk-catalog-drawer"><header><div><small>CATALOGUE</small><h2>{catalogSelected}</h2></div><button onClick={()=>setCatalogSelection('')}>Fermer</button></header><div><p>Famille : <strong>{catalogFamily?.label||'non classée'}</strong></p><p>État : <strong>{catalogLive?'LIVE':'inactif / non observé'}</strong></p>{catalogLive&&<><p>Phase : <strong>{stage(catalogLive)}</strong></p><p>{catalogLive.objective||catalogLive.message}</p><div className="v5pk-actions"><button onClick={()=>choose(catalogLive)}>Voir la session</button><button onClick={()=>workspace(catalogLive)}>Workspace</button></div></>}</div></section>}
 </section>
}
