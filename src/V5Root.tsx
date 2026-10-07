import {useEffect,useMemo,useState} from 'react'
import V5Pokemon from './V5Pokemon'
import {sessionAction} from './SessionControls'
import './App.css'
import './Office.css'
import './SourceOffice.css'
import './Ecosystem.css'
import './ui-v5.css'

type View='world'|'workspace'|'agents'|'search'
type WorkspaceArea='home'|'brody'|'obsidure'|'cli'|'files'
type WorldZone='activity'|'rnd'|'agents'|'governance'|'knowledge'|'domains'|'layers'
type Agent={id:number;name:string;family:string;role:string|null;output:string|null}
type Layer={id:string;title:string;content:string;path:string;commit:string}
type Proposal={id:string;path:string;receipt:string|null;observedAt:string;data:Record<string,unknown>}
type Snapshot={available:boolean;repository?:string;sha?:string;branch?:string;files:string[];proposals:Proposal[];worktrees?:{path:string;branch:string;head:string;dirty:boolean}[]}
type Entity={id:string;kind:string;label:string;agentId?:string;path?:string;source?:string;targetPath?:string;status?:string;gate?:string;reasonCode?:string;decisionAuthority?:string;runtimeFilePresent?:boolean}
type Session={id:string;sessionId:string;agentId:string;name:string;presence:'live'|'unknown'|'ended';phase:string;message:string;objective:string|null;events:{kind:string;phase:string;message:string;timestamp:string}[]}
type Mission={id:string;label:string;actionId:string;agentId:string|null;status:string;traceabilityStatus:string;sessionRefs:string[];resultRefs:string[];primaryBlocker?:string;recommendedNextStep?:string}
type Shared={decisionAuthority:string;entities:Entity[];relations:{from:string;type:string;to:string}[];sessions:Session[];missions:Mission[]}
type Process={sessionId:string;active:boolean;runtimeActive:boolean;native:boolean;tool:string;output:string}

const nav:[View,string][]=[['world','Monde'],['workspace','Workspace'],['agents','Pokémon'],['search','Recherche']]
const zones:[WorldZone,string][]=[['activity','Activité'],['rnd','R&D / Build'],['agents','Agents & organes'],['governance','Gouvernance & preuves'],['knowledge','Objets & résultats'],['domains','Domaines'],['layers','Couches documentaires']]

export default function V5Root(){
 const initial=(location.hash.slice(1)||'world') as View
 const [view,setView]=useState<View>(['world','workspace','agents','search'].includes(initial)?initial:'world')
 const [workspaceArea,setWorkspaceArea]=useState<WorkspaceArea>('home')
 const [worldZone,setWorldZone]=useState<WorldZone>('activity')
 const [shared,setShared]=useState<Shared|null>(null)
 const [snap,setSnap]=useState<Snapshot|null>(null)
 const [agents,setAgents]=useState<Agent[]>([])
 const [layers,setLayers]=useState<Layer[]>([])
 const [contextId,setContextId]=useState(sessionStorage.getItem('obsidia-focus-entity')||'')
 const [selectedFile,setSelectedFile]=useState('')
 const [fileContent,setFileContent]=useState('')
 const [message,setMessage]=useState('')
 const [toolText,setToolText]=useState('')
 const [toolBusy,setToolBusy]=useState(false)
 const [processes,setProcesses]=useState<Process[]>([])
 const [searchQuery,setSearchQuery]=useState('')
 const [searchKind,setSearchKind]=useState<'all'|'agent'|'mission'|'domain'|'file'|'proof'|'layer'>('all')

 useEffect(()=>{
  const abort=new AbortController()
  const read=async(url:string)=>{const r=await fetch(url,{signal:abort.signal});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
  Promise.all([read('/data/rd-registry.json'),read('/data/obsidia-layers.json')]).then(([a,l])=>{setAgents(a.agents||[]);setLayers(l.layers||[])}).catch(()=>{})
  let pending=false
  const refresh=async()=>{if(pending)return;pending=true;try{const [s,w]=await Promise.all([read('/obsidia-local/snapshot'),read('/obsidia-local/state')]);setSnap(s);setShared(w)}catch(e){if(!abort.signal.aborted)setMessage(String(e))}finally{pending=false}}
  void refresh()
  const timer=setInterval(refresh,4000)
  const hash=()=>{const next=(location.hash.slice(1)||'world') as View;if(['world','workspace','agents','search'].includes(next))setView(next)}
  const context=(e:Event)=>setContextId((e as CustomEvent<string>).detail||sessionStorage.getItem('obsidia-focus-entity')||'')
  window.addEventListener('hashchange',hash)
  window.addEventListener('obsidia-context',context as EventListener)
  return()=>{abort.abort();clearInterval(timer);window.removeEventListener('hashchange',hash);window.removeEventListener('obsidia-context',context as EventListener)}
 },[])

 useEffect(()=>{const c=new AbortController();const poll=async()=>{try{const r=await fetch('/obsidia-local/processes',{signal:c.signal});if(r.ok)setProcesses((await r.json()).processes||[])}catch{}};void poll();const t=setInterval(poll,1400);return()=>{c.abort();clearInterval(t)}},[])

 const live=shared?.sessions.filter(s=>s.presence==='live')||[]
 const contextEntity=shared?.entities.find(e=>e.id===contextId)
 const selectedSession=shared?.sessions.find(s=>s.id===contextId)||shared?.sessions.find(s=>'session:'+s.sessionId===contextId)
 const contextLabel=selectedSession?.name||contextEntity?.label||'Aucun contexte sélectionné'
 const files=snap?.files||[]

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);setContextId(id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const go=(v:View)=>{location.hash=v}
 const openFile=async(path:string)=>{setSelectedFile(path);try{const r=await fetch('/obsidia-local/file?path='+encodeURIComponent(path));const d=await r.json();if(!r.ok)throw Error(d.error||'Lecture impossible');setFileContent(d.content||'')}catch(e){setFileContent(String(e))}}
 const activeTool=(tool:'brody'|'obsidure'|'cli')=>[...(shared?.sessions||[])].reverse().find(s=>s.agentId===tool&&s.presence==='live')||[...(shared?.sessions||[])].reverse().find(s=>s.agentId===tool)
 const runTool=async(tool:'brody'|'obsidure'|'cli',mode='interactive')=>{setToolBusy(true);setMessage('Démarrage '+tool+'…');try{const d=await sessionAction('run',{mode,tool});if(d.sessionId)sessionStorage.setItem('obsidia-selected-session',d.sessionId);setMessage(tool+' prêt')}catch(e){setMessage(String(e))}finally{setToolBusy(false)}}
 const sendTool=async(tool:'brody'|'obsidure'|'cli')=>{if(!toolText.trim())return;setToolBusy(true);try{let s=activeTool(tool);let id=s?.presence==='live'?s.sessionId:'';if(!id){const d=await sessionAction('run',{mode:'interactive',tool});id=d.sessionId;sessionStorage.setItem('obsidia-selected-session',id);for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,150));const lr=await fetch('/obsidia-local/live');const ld=await lr.json();s=ld.sessions?.find((x:Session)=>x.sessionId===id);if(s?.phase==='WAITING_INPUT')break}}await sessionAction('input/'+id,{text:toolText.trim()});setToolText('')}catch(e){setMessage(String(e))}finally{setToolBusy(false)}}
 const stopTool=async(tool:'brody'|'obsidure'|'cli')=>{const s=activeTool(tool);if(!s)return;setToolBusy(true);try{await sessionAction('stop/'+s.sessionId);setMessage(tool+' arrêté')}catch(e){setMessage(String(e))}finally{setToolBusy(false)}}

 const recent=useMemo(()=>live.flatMap(s=>s.events.map(e=>({...e,sessionId:s.sessionId,agentId:s.agentId,name:s.name}))).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,10),[live])

 const worldItems=useMemo(()=>{
  if(!shared)return [] as {id:string;kind:string;label:string;meta:string}[]
  if(worldZone==='activity')return live.map(s=>({id:'session:'+s.sessionId,kind:'LIVE',label:s.name||s.agentId,meta:s.objective||s.phase}))
  if(worldZone==='agents')return shared.entities.filter(e=>e.kind==='agent').map(e=>({id:e.id,kind:'AGENT',label:e.label,meta:e.agentId||''}))
  if(worldZone==='governance')return shared.entities.filter(e=>['decision_record','sealed_receipt','rollback_evidence','impact'].includes(e.kind)).slice(-30).reverse().map(e=>({id:e.id,kind:e.kind,label:e.label,meta:e.gate||e.status||e.decisionAuthority||''}))
  if(worldZone==='knowledge')return shared.entities.filter(e=>['repository','objective','result','artifact'].includes(e.kind)).slice(-40).reverse().map(e=>({id:e.id,kind:e.kind,label:e.label,meta:e.path||e.source||''}))
  if(worldZone==='domains')return shared.entities.filter(e=>e.kind==='domain').map(e=>({id:e.id,kind:'DOMAINE',label:e.label,meta:e.runtimeFilePresent?'runtime présent':'runtime non confirmé'}))
  if(worldZone==='rnd')return (snap?.worktrees||[]).map(w=>({id:'worktree:'+w.path,kind:'WORKTREE',label:w.branch,meta:w.head.slice(0,12)+(w.dirty?' · modifié':' · propre')}))
  return layers.map(l=>({id:'layer:'+l.id,kind:'COUCHE',label:l.title,meta:l.path}))
 },[shared,worldZone,live,snap,layers])

 const searchResults=useMemo(()=>{
  const q=searchQuery.trim().toLowerCase();if(q.length<2)return [] as {id:string;kind:string;label:string;meta:string;action:()=>void}[]
  const out:{id:string;kind:string;label:string;meta:string;action:()=>void}[]=[]
  const allow=(k:string)=>searchKind==='all'||(searchKind==='agent'&&k.includes('agent'))||(searchKind==='mission'&&k.includes('mission'))||(searchKind==='domain'&&k.includes('domain'))||(searchKind==='file'&&k.includes('fichier'))||(searchKind==='layer'&&k.includes('couche'))||(searchKind==='proof'&&['decision','receipt','rollback','impact','result','artifact','preuve'].some(x=>k.includes(x)))
  for(const a of agents){const hay=(a.name+' '+a.family+' '+(a.role||'')).toLowerCase();if(hay.includes(q)&&allow('agent'))out.push({id:'rd:'+a.id,kind:'Agent R&D',label:a.name,meta:a.family,action:()=>{setWorldZone('agents');go('world')}})}
  for(const l of layers){const hay=(l.title+' '+l.path+' '+l.content).toLowerCase();if(hay.includes(q)&&allow('couche'))out.push({id:'layer:'+l.id,kind:'Couche',label:l.title,meta:l.path,action:()=>{setWorldZone('layers');go('world')}})}
  for(const p of files){if(p.toLowerCase().includes(q)&&allow('fichier'))out.push({id:'file:'+p,kind:'Fichier',label:p.split('/').at(-1)||p,meta:p,action:()=>{void openFile(p);setWorkspaceArea('files');go('workspace')}})}
  for(const e of shared?.entities||[]){const hay=(e.label+' '+e.kind+' '+(e.path||'')+' '+(e.source||'')).toLowerCase();if(hay.includes(q)&&allow(e.kind.toLowerCase()))out.push({id:e.id,kind:e.kind,label:e.label,meta:e.path||e.source||e.id,action:()=>{focus(e.id);go('world')}})}
  for(const m of shared?.missions||[]){const hay=(m.actionId+' '+(m.agentId||'')+' '+m.status).toLowerCase();if(hay.includes(q)&&allow('mission'))out.push({id:m.id,kind:'Mission',label:m.actionId,meta:(m.agentId||'—')+' · '+m.status,action:()=>{focus(m.id);go('world')}})}
  return out.slice(0,80)
 },[searchQuery,searchKind,agents,layers,files,shared])

 return <div className="v5">
  <header className="v5-top">
   <a className="v5-logo" href="#world">◈ OBSIDIA</a>
   <nav>{nav.map(([id,label])=><a key={id} href={'#'+id} aria-current={view===id?'page':undefined}>{label}</a>)}</nav>
   <div className="v5-runtime"><span className={snap?.available?'on':''}/><strong>{snap?.available?'Connecté':'Hors ligne'}</strong><small>{shared?.decisionAuthority||'KX108_ONLY'}</small></div>
  </header>

  <div className="v5-context"><span>Contexte</span><strong>{contextLabel}</strong>{contextId&&<small>{contextId}</small>}</div>
  {message&&<p className="v5-message">{message}</p>}

  <main className="v5-main">
   {view==='world'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>OÙ ?</small><h1>Monde</h1><p>Voir l’écosystème, ses zones et ses objets.</p></div><strong>{live.length} live</strong></header>
    <div className="v5-zonebar">{zones.map(([id,label])=><button key={id} aria-pressed={worldZone===id} onClick={()=>setWorldZone(id)}>{label}</button>)}</div>
    <section className="v5-grid">
     {worldItems.map(item=><button className="v5-object" key={item.id} onClick={()=>{if(item.id.startsWith('layer:'))setWorldZone('layers');else focus(item.id)}}><small>{item.kind}</small><strong>{item.label}</strong><span>{item.meta}</span></button>)}
     {!worldItems.length&&<p className="v5-empty">Aucun objet observé dans cette zone.</p>}
    </section>
    {contextEntity&&<aside className="v5-focus"><small>OBJET SÉLECTIONNÉ</small><h2>{contextEntity.label}</h2><p>{contextEntity.kind} · {contextEntity.id}</p><div><button onClick={()=>go('workspace')}>Workspace</button><button onClick={()=>go('agents')}>Pokémon</button></div><details><summary>Relations · {shared?.relations.filter(r=>r.from===contextEntity.id||r.to===contextEntity.id).length||0}</summary>{shared?.relations.filter(r=>r.from===contextEntity.id||r.to===contextEntity.id).map((r,i)=><p key={i}><code>{r.from}</code> → {r.type} → <code>{r.to}</code></p>)}</details></aside>}
    {worldZone==='layers'&&<details className="v5-archive"><summary>Couches documentaires · {layers.length}</summary><div className="v5-layer-list">{layers.map(l=><article key={l.id}><strong>{l.title}</strong><small>{l.path}</small><pre>{l.content.slice(0,900)}</pre></article>)}</div></details>}
   </section>}

   {view==='workspace'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>QUOI ?</small><h1>Workspace</h1><p>Travailler sur ce qui est en cours.</p></div><strong>{live.length} session(s)</strong></header>
    <nav className="v5-subnav">{([['home',"Aujourd'hui"],['brody','Brody'],['obsidure','Obsidure'],['cli','CLI'],['files','Fichiers & preuves']] as [WorkspaceArea,string][]).map(([id,label])=><button key={id} aria-pressed={workspaceArea===id} onClick={()=>setWorkspaceArea(id)}>{label}</button>)}</nav>
    {workspaceArea==='home'&&<section className="v5-work-list">{live.length?live.map(s=><article key={s.sessionId}><small>{s.agentId}</small><h2>{s.name}</h2><p>{s.objective||s.message||'Aucun objectif observé'}</p><span>{s.phase}</span><div><button onClick={()=>{sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId);setWorkspaceArea(s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home')}}>Continuer</button><button onClick={()=>{focus('session:'+s.sessionId);go('agents')}}>Voir l’agent</button></div></article>):<p className="v5-empty">Aucune session live.</p>}</section>}
    {(['brody','obsidure','cli'] as const).includes(workspaceArea as 'brody'|'obsidure'|'cli')&&(()=>{const tool=workspaceArea as 'brody'|'obsidure'|'cli';const s=activeTool(tool);const process=s?processes.find(p=>p.sessionId===s.sessionId):undefined;const conversation=(s?.events||[]).filter(e=>e.phase==='INPUT_RECEIVED'||e.kind==='response');return <section className="v5-tool"><header><div><small>OUTIL</small><h2>{tool==='brody'?'Brody':tool==='obsidure'?'Obsidure':'CLI Obsidia'}</h2></div><span>{s?.presence==='live'?'SESSION ACTIVE':'PRÊT'}</span></header>{tool==='brody'?<div className="v5-chat">{conversation.length?conversation.map((e,i)=><article key={i}><strong>{e.phase==='INPUT_RECEIVED'?'Vous':'Brody'}</strong><p>{e.objective||e.message}</p></article>):<p className="v5-empty">Écris directement ta demande.</p>}</div>:tool==='obsidure'?<div className="v5-tool-output"><h3>Mission / résultat</h3><p>{s?.objective||'Aucune mission active.'}</p><pre>{process?.output||s?.message||'Le résultat apparaîtra ici.'}</pre></div>:<div className="v5-tool-output"><h3>Console</h3><pre>{process?.output||'CLI prête.'}</pre></div>}<form className="v5-composer" onSubmit={e=>{e.preventDefault();void sendTool(tool)}}>{tool==='cli'?<input value={toolText} onChange={e=>setToolText(e.target.value)} placeholder="Commande / demande CLI"/>:<textarea value={toolText} onChange={e=>setToolText(e.target.value)} placeholder={tool==='brody'?'Écris à Brody…':'Décris la mission…'}/>}<button disabled={toolBusy||!toolText.trim()}>Envoyer</button></form><div className="v5-tool-actions">{!s||s.presence!=='live'?<button disabled={toolBusy} onClick={()=>runTool(tool)}>Démarrer</button>:<button disabled={toolBusy} onClick={()=>stopTool(tool)}>Arrêter</button>}{tool==='obsidure'&&<><button disabled={toolBusy} onClick={()=>runTool('obsidure','audit')}>Audit rapide</button><button disabled={toolBusy} onClick={()=>runTool('obsidure','audit-long')}>Audit long</button></>}</div></section>})()}
    {workspaceArea==='files'&&<section className="v5-files"><div><h2>Fichiers</h2><div className="v5-file-list">{files.slice(0,250).map(p=><button key={p} onClick={()=>openFile(p)}>{p}</button>)}</div></div><div><h2>Résultats / receipts</h2>{snap?.proposals.map(p=><article key={p.id}><strong>{p.id}</strong><button onClick={()=>openFile(p.path)}>Résultat</button>{p.receipt&&<button onClick={()=>openFile(p.receipt!)}>Receipt</button>}</article>)}{selectedFile&&<><h3>{selectedFile}</h3><pre>{fileContent}</pre></>}</div></section>}
   </section>}

   {view==='agents'&&<section className="v5-page v5-pokemon"><V5Pokemon/></section>}

   {view==='search'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>TROUVER</small><h1>Recherche</h1><p>Un seul endroit pour retrouver agents, missions, domaines, fichiers et preuves.</p></div></header>
    <section className="v5-search"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Chercher dans Obsidia…" aria-label="Recherche globale"/><nav>{([['all','Tout'],['agent','Agents'],['mission','Missions'],['domain','Domaines'],['file','Fichiers'],['proof','Preuves'],['layer','Couches']] as const).map(([id,label])=><button key={id} aria-pressed={searchKind===id} onClick={()=>setSearchKind(id)}>{label}</button>)}</nav><div className="v5-search-results">{searchQuery.trim().length>=2?(searchResults.length?searchResults.map(r=><button key={r.id} onClick={r.action}><small>{r.kind}</small><strong>{r.label}</strong><span>{r.meta}</span></button>):<p className="v5-empty">Aucun résultat.</p>):<p className="v5-empty">Écris au moins deux caractères.</p>}</div></section>
    <section className="v5-recent"><h2>Activité récente</h2>{recent.map((e,i)=><button key={e.sessionId+e.timestamp+i} onClick={()=>{focus('session:'+e.sessionId);go('world')}}><strong>{e.name||e.agentId}</strong><span>{e.phase}</span><small>{e.message}</small></button>)}</section>
   </section>}
  </main>
 </div>
}
