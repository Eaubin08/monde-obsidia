import {useEffect,useMemo,useState} from 'react'
import LivePokemon from './LivePokemon'
import ToolWorkspace from './ToolWorkspace'
import GlobalSearch from './GlobalSearch'
import ResearchOffice from './ResearchOffice'
import LayerExplorer from './LayerExplorer'
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

 const live=shared?.sessions.filter(s=>s.presence==='live')||[]
 const contextEntity=shared?.entities.find(e=>e.id===contextId)
 const selectedSession=shared?.sessions.find(s=>s.id===contextId)||shared?.sessions.find(s=>'session:'+s.sessionId===contextId)
 const contextLabel=selectedSession?.name||contextEntity?.label||'Aucun contexte sélectionné'
 const files=snap?.files||[]

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);setContextId(id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const go=(v:View)=>{location.hash=v}
 const openFile=async(path:string)=>{setSelectedFile(path);try{const r=await fetch('/obsidia-local/file?path='+encodeURIComponent(path));const d=await r.json();if(!r.ok)throw Error(d.error||'Lecture impossible');setFileContent(d.content||'')}catch(e){setFileContent(String(e))}}

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
    {worldZone==='layers'&&<details className="v5-archive"><summary>Recherche complète dans les couches</summary><LayerExplorer/></details>}
   </section>}

   {view==='workspace'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>QUOI ?</small><h1>Workspace</h1><p>Travailler sur ce qui est en cours.</p></div><strong>{live.length} session(s)</strong></header>
    <nav className="v5-subnav">{([['home',"Aujourd'hui"],['brody','Brody'],['obsidure','Obsidure'],['cli','CLI'],['files','Fichiers & preuves']] as [WorkspaceArea,string][]).map(([id,label])=><button key={id} aria-pressed={workspaceArea===id} onClick={()=>setWorkspaceArea(id)}>{label}</button>)}</nav>
    {workspaceArea==='home'&&<section className="v5-work-list">{live.length?live.map(s=><article key={s.sessionId}><small>{s.agentId}</small><h2>{s.name}</h2><p>{s.objective||s.message||'Aucun objectif observé'}</p><span>{s.phase}</span><div><button onClick={()=>{sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId);setWorkspaceArea(s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home')}}>Continuer</button><button onClick={()=>{focus('session:'+s.sessionId);go('agents')}}>Voir l’agent</button></div></article>):<p className="v5-empty">Aucune session live.</p>}</section>}
    {workspaceArea==='brody'&&<ToolWorkspace tool="brody" sessions={shared?.sessions||[]} onSelect={id=>sessionStorage.setItem('obsidia-selected-session',id)}/>}
    {workspaceArea==='obsidure'&&<ToolWorkspace tool="obsidure" sessions={shared?.sessions||[]} onSelect={id=>sessionStorage.setItem('obsidia-selected-session',id)}/>}
    {workspaceArea==='cli'&&<ToolWorkspace tool="cli" sessions={shared?.sessions||[]} onSelect={id=>sessionStorage.setItem('obsidia-selected-session',id)}/>}
    {workspaceArea==='files'&&<section className="v5-files"><div><h2>Fichiers</h2><div className="v5-file-list">{files.slice(0,250).map(p=><button key={p} onClick={()=>openFile(p)}>{p}</button>)}</div></div><div><h2>Résultats / receipts</h2>{snap?.proposals.map(p=><article key={p.id}><strong>{p.id}</strong><button onClick={()=>openFile(p.path)}>Résultat</button>{p.receipt&&<button onClick={()=>openFile(p.receipt!)}>Receipt</button>}</article>)}{selectedFile&&<><h3>{selectedFile}</h3><pre>{fileContent}</pre></>}</div></section>}
   </section>}

   {view==='agents'&&<section className="v5-page v5-pokemon"><LivePokemon/><details className="v5-archive"><summary>Registre R&D historique</summary><ResearchOffice/></details></section>}

   {view==='search'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>TROUVER</small><h1>Recherche</h1><p>Un seul endroit pour retrouver agents, missions, domaines, fichiers et preuves.</p></div></header>
    <GlobalSearch layers={layers} agents={agents} files={files} shared={shared} onFocus={id=>{focus(id);go('world')}} onOpenFile={path=>{void openFile(path);setWorkspaceArea('files');go('workspace')}} onOpenLayer={()=>{setWorldZone('layers');go('world')}}/>
    <section className="v5-recent"><h2>Activité récente</h2>{recent.map((e,i)=><button key={e.sessionId+e.timestamp+i} onClick={()=>{focus('session:'+e.sessionId);go('world')}}><strong>{e.name||e.agentId}</strong><span>{e.phase}</span><small>{e.message}</small></button>)}</section>
   </section>}
  </main>
 </div>
}
