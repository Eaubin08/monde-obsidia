import {useEffect,useMemo,useState,type KeyboardEvent} from 'react'
import V5Pokemon from './V5Pokemon'
import V5Launchers from './V5Launchers'
import {sessionAction} from './SessionControls'
import './App.css'
import './Office.css'
import './SourceOffice.css'
import './Ecosystem.css'
import './ui-v5.css'

type View='world'|'workspace'|'agents'|'search'
type WorkspaceArea='home'|'launchers'|'brody'|'obsidure'|'cli'|'files'
type WorldZone='home'|'territories'|'activity'|'rnd'|'agents'|'governance'|'knowledge'|'domains'|'layers'
type Agent={id:number;name:string;family:string;role:string|null;output:string|null}
type Layer={id:string;title:string;content:string;path:string;commit:string}
type Proposal={id:string;path:string;receipt:string|null;observedAt:string;data:Record<string,unknown>}
type Snapshot={available:boolean;repository?:string;sha?:string;branch?:string;files:string[];proposals:Proposal[];worktrees?:{path:string;branch:string;head:string;dirty:boolean}[]}
type Entity={id:string;kind:string;label:string;agentId?:string;path?:string;source?:string;targetPath?:string;status?:string;gate?:string;reasonCode?:string;decisionAuthority?:string;runtimeFilePresent?:boolean}
type Session={id:string;sessionId:string;agentId:string;name:string;presence:'live'|'unknown'|'ended';status?:string;phase:string;message:string;objective:string|null;nativeService?:boolean;nativeTerminal?:boolean;surface?:'terminal'|'interface'|null;source?:string;repository?:string;decisionAuthority?:string;observedState?:string;events:{kind:string;phase:string;message:string;timestamp:string;objective?:string;result?:Record<string,unknown>}[]}
type Mission={id:string;label:string;actionId:string;agentId:string|null;domainId?:string|null;status:string;traceabilityStatus:string;sessionRefs:string[];resultRefs:string[];decisionRecordRefs?:string[];receiptRefs?:string[];impactRefs?:string[];primaryBlocker?:string;recommendedNextStep?:string}
type Shared={decisionAuthority:string;entities:Entity[];relations:{from:string;type:string;to:string}[];sessions:Session[];missions:Mission[]}
type Process={sessionId:string;active:boolean;runtimeActive:boolean;native:boolean;surface?:'terminal'|'interface';tool:string;output:string}
type CliRuntime={schema:string;readonly:boolean;canonicalTruth:boolean;decisionAuthority:string;state:string;services:{id:string;label:string;status:string;evidence:string}[];legacy:{graphiti:string;neo4j:string;ui5173:string};observedAt:string}

const nav:[View,string][]=[['world','Monde'],['workspace','Workspace'],['agents','Pokémon'],['search','Recherche']]
const zones:[WorldZone,string][]=[['home','Vue globale'],['territories','Territoires'],['activity','Activité'],['rnd','R&D / Build'],['agents','Agents & organes'],['governance','Gouvernance & preuves'],['knowledge','Objets & résultats'],['domains','Domaines'],['layers','Couches documentaires']]
const territories:{id:string;label:string;zone:Exclude<WorldZone,'home'|'territories'>;summary:string;glyph:string}[]=[
 ['terrain','Terrains & domaines','domains','Bank · Trading · E-commerce · GPS / Défense / Aviation','◫'],
 ['forge','R&D / Build','rnd','Branches, worktrees et chantiers de construction','⬡'],
 ['population','Agents & organes','agents','Population connue et organes raccordés','◇'],
 ['authority','Gouvernance & preuves','governance','Décisions, receipts, impacts et frontières KX108','◆'],
 ['knowledge','Objets & résultats','knowledge','Résultats, artefacts, objectifs et dépôts','▤'],
 ['layers','Couches documentaires','layers','Cartes, contrats et documentation des couches','▦'],
].map(([id,label,zone,summary,glyph])=>({id,label,zone:zone as Exclude<WorldZone,'home'|'territories'>,summary,glyph}))
const territorySublayers:Partial<Record<WorldZone,{label:string;summary:string}[]>>={
 domains:[
  {label:'Observations / terrain',summary:'Signaux et faits du domaine avant traduction.'},
  {label:'Traduction domaine',summary:'Adaptateurs qui transforment le terrain en état exploitable.'},
  {label:'Runtime domaine',summary:'Services et mécanismes réellement présents pour le domaine.'},
  {label:'Preuves / gouvernance',summary:'Décisions, receipts et limites KX108 liées au domaine.'},
 ],
 rnd:[
  {label:'Chantiers',summary:'Branches, worktrees et travaux isolés.'},
  {label:'Construction',summary:'Agents et outils mobilisés pour produire.'},
  {label:'Validation',summary:'Tests, audits et critères de passage.'},
  {label:'Résultats',summary:'Artefacts produits avant réintégration.'},
 ],
 agents:[
  {label:'Familles',summary:'Population et rôles connus.'},
  {label:'Sessions',summary:'Présence et activité réellement observées.'},
  {label:'Missions',summary:'Travail relié à un objectif ou action.'},
  {label:'Cycle de vie',summary:'Disponible → travail → validation → preuve ou blocage.'},
 ],
 governance:[
  {label:'Décision',summary:'Decision records issus de l’autorité KX108.'},
  {label:'Receipt',summary:'Trace scellée de ce qui a été autorisé ou refusé.'},
  {label:'Rollback',summary:'Éléments permettant de revenir sur une action.'},
  {label:'Impact',summary:'Conséquence mesurée et reliée à la décision.'},
 ],
 knowledge:[
  {label:'Objectifs',summary:'Ce qui doit être compris, produit ou vérifié.'},
  {label:'Résultats',summary:'Sorties observées des missions et sessions.'},
  {label:'Artefacts',summary:'Fichiers et objets produits.'},
  {label:'Dépôts',summary:'Sources et emplacements auxquels les objets sont rattachés.'},
 ],
 layers:[
  {label:'Cartes',summary:'Vue globale des couches et de leurs frontières.'},
  {label:'Contrats',summary:'Rôles, interfaces et invariants documentés.'},
  {label:'Méthodes',summary:'Processus et mécanismes décrits par couche.'},
  {label:'Documentation',summary:'Références lisibles sans devenir une vérité runtime.'},
 ],
}

const territoryRelationTypes:Partial<Record<WorldZone,string[]>>={
 domains:['HAS_DOMAIN','DECLARES_DOMAIN','BELONGS_TO_DOMAIN','RUNS_IN_DOMAIN','IN_DOMAIN','DECIDES_IN_DOMAIN'],
 rnd:['OPERATES_IN','PRODUCES_RESULT','PRODUCES_ARTIFACT','HAS_PROPOSAL','HAS_RECEIPT'],
 agents:['HAS_AGENT','RUNS','HAS_SESSION','USES_AGENT'],
 governance:['HAS_DECISION_RECORD','HAS_DECISION','AUTHORIZES_RECEIPT','HAS_ROLLBACK_EVIDENCE','PROTECTS_CHANGE','PROVES_IMPACT','HAS_IMPACT'],
 knowledge:['HAS_OBJECTIVE','HAS_RESULT','PRODUCES_RESULT','PRODUCES_ARTIFACT','PROVES_IMPACT'],
 layers:[],
}


export default function V5Root(){
 const initial=(location.hash.slice(1)||'world') as View
 const [view,setView]=useState<View>(['world','workspace','agents','search'].includes(initial)?initial:'world')
 const [workspaceArea,setWorkspaceArea]=useState<WorkspaceArea>(()=>{const saved=sessionStorage.getItem('obsidia-workspace-area');return (['home','launchers','brody','obsidure','cli','files'].includes(saved||'')?saved:'home') as WorkspaceArea})
 const [worldZone,setWorldZone]=useState<WorldZone>('home')
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
 const [cliRuntime,setCliRuntime]=useState<CliRuntime|null>(null)
 const [searchQuery,setSearchQuery]=useState('')
 const [searchKind,setSearchKind]=useState<'all'|'agent'|'mission'|'domain'|'file'|'proof'|'layer'>('all')
 const [searchSelection,setSearchSelection]=useState<{id:string;kind:string;label:string;meta:string}|null>(null)
 const [selectedMechanism,setSelectedMechanism]=useState('')

 useEffect(()=>{
  const abort=new AbortController()
  const read=async(url:string)=>{const r=await fetch(url,{signal:abort.signal});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
  Promise.all([read('/data/rd-registry.json'),read('/data/obsidia-layers.json')]).then(([a,l])=>{setAgents(a.agents||[]);setLayers(l.layers||[])}).catch(()=>{})
  let pending=false
  const refresh=async()=>{if(pending)return;pending=true;try{const [s,w]=await Promise.all([read('/obsidia-local/snapshot'),read('/obsidia-local/state')]);setSnap(s);setShared(w)}catch(e){if(!abort.signal.aborted)setMessage(String(e))}finally{pending=false}}
  void refresh()
  const timer=setInterval(refresh,4000)
  const hash=()=>{const next=(location.hash.slice(1)||'world') as View;if(['world','workspace','agents','search'].includes(next)){setView(next);if(next==='workspace'){const saved=sessionStorage.getItem('obsidia-workspace-area');if(['home','launchers','brody','obsidure','cli','files'].includes(saved||''))setWorkspaceArea(saved as WorkspaceArea)}}}
  const context=(e:Event)=>setContextId((e as CustomEvent<string>).detail||sessionStorage.getItem('obsidia-focus-entity')||'')
  window.addEventListener('hashchange',hash)
  window.addEventListener('obsidia-context',context as EventListener)
  return()=>{abort.abort();clearInterval(timer);window.removeEventListener('hashchange',hash);window.removeEventListener('obsidia-context',context as EventListener)}
 },[])

 useEffect(()=>{sessionStorage.setItem('obsidia-workspace-area',workspaceArea)},[workspaceArea])

 useEffect(()=>{const c=new AbortController();const poll=async()=>{try{const [pr,cr]=await Promise.all([fetch('/obsidia-local/processes',{signal:c.signal}),fetch('/obsidia-local/cli-runtime',{signal:c.signal})]);if(pr.ok)setProcesses((await pr.json()).processes||[]);if(cr.ok)setCliRuntime(await cr.json())}catch{}};void poll();const t=setInterval(poll,1400);return()=>{c.abort();clearInterval(t)}},[])

 const live=shared?.sessions.filter(s=>s.presence==='live'&&!s.nativeService)||[]
 const systemServices=shared?.sessions.filter(s=>s.presence==='live'&&s.nativeService)||[]
 const kernelReady=systemServices.some(s=>s.agentId==='kernel-x108'&&s.observedState==='READY')
 const apiReady=systemServices.some(s=>s.agentId==='obsidia-api'&&s.observedState==='READY')
 const coreRuntimeReady=kernelReady&&apiReady
 const contextEntity=shared?.entities.find(e=>e.id===contextId)
 const selectedSession=shared?.sessions.find(s=>s.id===contextId)||shared?.sessions.find(s=>'session:'+s.sessionId===contextId)
 const contextLabel=selectedSession?.name||contextEntity?.label||'Aucun contexte sélectionné'
 const files=snap?.files||[]

 const focus=(id:string)=>{sessionStorage.setItem('obsidia-focus-entity',id);setContextId(id);window.dispatchEvent(new CustomEvent('obsidia-context',{detail:id}))}
 const zoneForEntity=(entity?:Entity):WorldZone|null=>{
  if(!entity)return null
  if(entity.kind==='domain')return 'domains'
  if(['agent','session'].includes(entity.kind))return 'agents'
  if(['decision','decision_record','receipt','sealed_receipt','rollback_evidence','impact'].includes(entity.kind))return 'governance'
  if(['repository','objective','result','artifact'].includes(entity.kind))return 'knowledge'
  if(entity.kind==='proposal')return 'rnd'
  if(entity.kind==='mission')return 'activity'
  return null
 }
 const openWorldObject=(id:string)=>{
  const entity=shared?.entities.find(e=>e.id===id)
  const zone=zoneForEntity(entity)
  if(zone)setWorldZone(zone)
  focus(id)
  if(view!=='world')go('world')
 }
 const backToTerritories=()=>{setSelectedMechanism('');setWorldZone('territories')}
 const workspaceForAgent=(agentId?:string|null):WorkspaceArea=>agentId==='brody'?'brody':agentId==='obsidure'?'obsidure':agentId==='cli'?'cli':'home'
 const openContextWorkspace=()=>{const agentId=selectedSession?.agentId||contextEntity?.agentId||null;const area=workspaceForAgent(agentId);setWorkspaceArea(area);sessionStorage.setItem('obsidia-workspace-area',area);go('workspace')}
 const focusSearchAgent=()=>{if(!searchSelection)return;let id=searchSelection.id;if(id.startsWith('rd:')){const match=shared?.entities.find(e=>e.kind==='agent'&&e.label===searchSelection.label);if(match)id=match.id;else return false}focus(id);return true}
 const go=(v:View)=>{setView(v);location.hash=v}
 const openFile=async(path:string)=>{setSelectedFile(path);try{const r=await fetch('/obsidia-local/file?path='+encodeURIComponent(path));const d=await r.json();if(!r.ok)throw Error(d.error||'Lecture impossible');setFileContent(d.content||'')}catch(e){setFileContent(String(e))}}
 const activeTool=(tool:'brody'|'obsidure'|'cli')=>{
  const all=[...(shared?.sessions||[])].reverse().filter(s=>s.agentId===tool)
  const managed=processes.find(p=>p.tool===tool&&p.active&&!p.native)
  if(managed){
   const bound=all.find(s=>s.sessionId===managed.sessionId)
   if(bound)return bound
  }
  const integrated=(s:Session)=>{
   if(s.surface)return s.surface==='interface'
   const p=processes.find(p=>p.sessionId===s.sessionId)
   return !!p&&!p.native
  }
  return all.find(s=>s.presence==='live'&&integrated(s))||all.find(integrated)
 }
 const runTool=async(tool:'brody'|'obsidure'|'cli',mode='interactive')=>{setToolBusy(true);setMessage('Démarrage '+tool+'…');try{if(tool==='brody'||tool==='obsidure')await ensureBrodyApiTerminal();const d=await sessionAction('run',{mode,tool});if(d.sessionId)sessionStorage.setItem('obsidia-selected-session',d.sessionId);setMessage(tool+' prêt')}catch(e){setMessage(String(e))}finally{setToolBusy(false)}}
 const ensureBrodyApiTerminal=async()=>{
  try{
   const sr=await fetch('/obsidia-local/services')
   const sd=await sr.json()
   if(sr.ok&&sd?.brody?.ready)return
  }catch{}
  const open=await fetch('/obsidia-local/open/obsidia-api',{method:'POST'})
  const od=await open.json()
  if(!open.ok)throw Error(od.error||'Impossible de lancer API Obsidia')
  const deadline=Date.now()+20000
  while(Date.now()<deadline){
   await new Promise(r=>setTimeout(r,400))
   try{
    const sr=await fetch('/obsidia-local/services')
    const sd=await sr.json()
    if(sr.ok&&sd?.brody?.ready)return
   }catch{}
  }
  throw Error('API Obsidia non prête après relance du terminal')
 }
 const waitForToolInput=async(id:string)=>{
  const deadline=Date.now()+20000
  while(Date.now()<deadline){
   const lr=await fetch('/obsidia-local/live')
   if(lr.ok){
    const ld=await lr.json()
    const current=ld.sessions?.find((x:Session)=>x.sessionId===id)
    if(current?.presence==='ended')throw Error('Session terminée avant la saisie')
    if(current?.phase==='WAITING_INPUT')return
   }
   await new Promise(r=>setTimeout(r,200))
  }
  throw Error('Session non prête pour la saisie après 20 s')
 }
 const sendTool=async(tool:'brody'|'obsidure'|'cli')=>{
  const text=toolText.trim()
  if(!text)return
  setToolBusy(true)
  setMessage(tool+' · préparation…')
  try{
   if(tool==='brody'||tool==='obsidure')await ensureBrodyApiTerminal()
   let s=activeTool(tool)
   let id=s?.presence==='live'?s.sessionId:''
   if(!id){
    const d=await sessionAction('run',{mode:'interactive',tool})
    id=d.sessionId||''
    if(id)sessionStorage.setItem('obsidia-selected-session',id)
   }
   if(!id)throw Error('Aucune session interface disponible')
   await waitForToolInput(id)
   await sessionAction('input/'+id,{text})
   setToolText('')
   setMessage(tool+' · demande envoyée')
  }catch(e){
   setMessage(e instanceof Error?e.message:String(e))
  }finally{
   setToolBusy(false)
  }
 }
 const stopTool=async(tool:'brody'|'obsidure'|'cli')=>{const s=activeTool(tool);if(!s)return;setToolBusy(true);try{await sessionAction('stop/'+s.sessionId);setMessage(tool+' arrêté')}catch(e){setMessage(String(e))}finally{setToolBusy(false)}}

 const composerKeyDown=(e:KeyboardEvent<HTMLInputElement|HTMLTextAreaElement>,tool:'brody'|'obsidure'|'cli')=>{
  if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){
   e.preventDefault()
   if(toolText.trim()&&!toolBusy)void sendTool(tool)
  }
 }

 const recent=useMemo(()=>live.flatMap(s=>s.events.map(e=>({...e,sessionId:s.sessionId,agentId:s.agentId,name:s.name}))).sort((a,b)=>Date.parse(b.timestamp)-Date.parse(a.timestamp)).slice(0,10),[live])

 const worldItems=useMemo(()=>{
  if(!shared)return [] as {id:string;kind:string;label:string;meta:string}[]
  if(worldZone==='home')return []
  if(worldZone==='territories')return territories.map(t=>({id:'territory:'+t.zone,kind:'TERRITOIRE',label:t.label,meta:t.summary}))
  if(worldZone==='activity')return live.map(s=>({id:'session:'+s.sessionId,kind:'LIVE',label:s.name||s.agentId,meta:s.objective||s.phase}))
  if(worldZone==='agents')return shared.entities.filter(e=>e.kind==='agent').map(e=>({id:e.id,kind:'AGENT',label:e.label,meta:e.agentId||''}))
  if(worldZone==='governance')return shared.entities.filter(e=>['decision_record','sealed_receipt','rollback_evidence','impact'].includes(e.kind)).slice(-30).reverse().map(e=>({id:e.id,kind:e.kind,label:e.label,meta:e.gate||e.status||e.decisionAuthority||''}))
  if(worldZone==='knowledge')return shared.entities.filter(e=>['repository','objective','result','artifact'].includes(e.kind)).slice(-40).reverse().map(e=>({id:e.id,kind:e.kind,label:e.label,meta:e.path||e.source||''}))
  if(worldZone==='domains')return shared.entities.filter(e=>e.kind==='domain').map(e=>({id:e.id,kind:'DOMAINE',label:e.label,meta:e.runtimeFilePresent?'runtime présent':'runtime non confirmé'}))
  if(worldZone==='rnd')return (snap?.worktrees||[]).map(w=>({id:'worktree:'+w.path,kind:'WORKTREE',label:w.branch,meta:w.head.slice(0,12)+(w.dirty?' · modifié':' · propre')}))
  return layers.map(l=>({id:'layer:'+l.id,kind:'COUCHE',label:l.title,meta:l.path}))
 },[shared,worldZone,live,snap,layers])

 const observedMechanisms=useMemo(()=>{
  if(!shared||!territoryRelationTypes[worldZone])return [] as {type:string;count:number}[]
  const allowed=new Set(territoryRelationTypes[worldZone]||[])
  const counts=new Map<string,number>()
  for(const rel of shared.relations){
   if(!allowed.has(rel.type))continue
   counts.set(rel.type,(counts.get(rel.type)||0)+1)
  }
  return [...counts.entries()].map(([type,count])=>({type,count})).sort((a,b)=>b.count-a.count||a.type.localeCompare(b.type))
 },[shared,worldZone])

 const mechanismRelations=useMemo(()=>{
  if(!shared||!selectedMechanism)return [] as {from:string;fromLabel:string;type:string;to:string;toLabel:string}[]
  const label=(id:string)=>shared.entities.find(e=>e.id===id)?.label||id
  return shared.relations.filter(r=>r.type===selectedMechanism).map(r=>({
   from:r.from,fromLabel:label(r.from),type:r.type,to:r.to,toLabel:label(r.to)
  }))
 },[shared,selectedMechanism])

 const searchResults=useMemo(()=>{
  const q=searchQuery.trim().toLowerCase()
  if(q.length<2&&searchKind==='all')return [] as {id:string;kind:string;label:string;meta:string;action:()=>void}[]
  const out:{id:string;kind:string;label:string;meta:string;action:()=>void}[]=[]
  const hit=(text:string)=>!q||text.toLowerCase().includes(q)
  const allow=(k:string)=>searchKind==='all'||(searchKind==='agent'&&k.includes('agent'))||(searchKind==='mission'&&k.includes('mission'))||(searchKind==='domain'&&k.includes('domain'))||(searchKind==='file'&&k.includes('fichier'))||(searchKind==='layer'&&k.includes('couche'))||(searchKind==='proof'&&['decision','receipt','rollback','impact','result','artifact','preuve','sealed'].some(x=>k.includes(x)))
  const add=(id:string,kind:string,label:string,meta:string,action:()=>void)=>{if(allow(kind.toLowerCase())&&hit(label+' '+meta+' '+kind))out.push({id,kind,label,meta,action})}
  for(const a of agents)add('rd:'+a.id,'Agent R&D',a.name,a.family+' · '+(a.role||'rôle non documenté'),()=>setSearchSelection({id:'rd:'+a.id,kind:'Agent R&D',label:a.name,meta:a.family+' · '+(a.role||'rôle non documenté')}))
  for(const l of layers)add('layer:'+l.id,'Couche',l.title,l.path,()=>setSearchSelection({id:'layer:'+l.id,kind:'Couche',label:l.title,meta:l.path}))
  for(const p of files)add('file:'+p,'Fichier',p.split('/').at(-1)||p,p,()=>setSearchSelection({id:'file:'+p,kind:'Fichier',label:p.split('/').at(-1)||p,meta:p}))
  for(const e of shared?.entities||[])add(e.id,e.kind,e.label,e.path||e.source||e.targetPath||e.id,()=>setSearchSelection({id:e.id,kind:e.kind,label:e.label,meta:e.path||e.source||e.targetPath||e.id}))
  for(const m of shared?.missions||[])add(m.id,'Mission',m.actionId,(m.agentId||'agent non relié')+' · '+m.status,()=>setSearchSelection({id:m.id,kind:'Mission',label:m.actionId,meta:(m.agentId||'agent non relié')+' · '+m.status}))
  return out.slice(0,100)
 },[searchQuery,searchKind,agents,layers,files,shared])

 const domainCount=shared?.entities.filter(e=>e.kind==='domain').length||0
 const allResultEntities=shared?.entities.filter(e=>['result','artifact'].includes(e.kind))||[]
 const resultEntities=allResultEntities.slice(-5).reverse()
 const proofCount=shared?.entities.filter(e=>['decision_record','sealed_receipt','rollback_evidence','impact'].includes(e.kind)).length||0
 const currentMissions=(shared?.missions||[]).slice(-4).reverse()
 const activeAgents=live.slice(0,5)
 const territoryCards=useMemo(()=>{
  const entities=shared?.entities||[]
  const relations=shared?.relations||[]
  const missions=shared?.missions||[]
  const countKind=(...kinds:string[])=>entities.filter(e=>kinds.includes(e.kind)).length
  const relCount=(...types:string[])=>relations.filter(r=>types.includes(r.type)).length
  const domainTotal=countKind('domain')
  const domainRuntime=entities.filter(e=>e.kind==='domain'&&e.runtimeFilePresent).length
  const domainMissing=Math.max(0,domainTotal-domainRuntime)
  const worktrees=snap?.worktrees||[]
  const agentTotal=countKind('agent')
  const liveAgents=live.length
  const blockedAgents=live.filter(s=>s.status==='blocked'||s.status==='error').length
  const missionBlockers=missions.filter(m=>m.primaryBlocker).length
  const completeMissions=missions.filter(m=>m.traceabilityStatus==='COMPLETE').length
  const knowledgeTotal=countKind('repository','objective','result','artifact')
  const resultTotal=countKind('result','artifact')
  const governanceTotal=countKind('decision_record','sealed_receipt','rollback_evidence','impact')
  const noBlock='Aucun blocage observé'
  const noAction='Aucune action dérivée de la projection.'
  const cards:Record<string,{status:string;blocker:string;proof:string;nextAction:string;facts:{label:string;value:string|number}[]}>={
   domains:{
    status:domainRuntime>0?'OBSERVÉ':domainTotal>0?'PARTIEL':'NON OBSERVÉ',
    blocker:domainMissing?domainMissing+' runtime(s) domaine non confirmé(s)':noBlock,
    proof:domainRuntime?domainRuntime+' runtime(s) domaine présent(s) · '+relCount('HAS_DOMAIN','RUNS_IN_DOMAIN','IN_DOMAIN','DECIDES_IN_DOMAIN')+' liaison(s) observée(s)':'Aucune preuve runtime domaine observée',
    nextAction:domainMissing?'Vérifier les runtime(s) domaine non confirmés.':noAction,
    facts:[
     {label:'domaines',value:domainTotal},
     {label:'runtime présent',value:domainRuntime},
     {label:'runtime non confirmé',value:domainMissing},
     {label:'liaisons domaine',value:relCount('HAS_DOMAIN','RUNS_IN_DOMAIN','IN_DOMAIN','DECIDES_IN_DOMAIN')},
    ],
   },
   rnd:{
    status:worktrees.length?'OBSERVÉ':'NON OBSERVÉ',
    blocker:noBlock,
    proof:resultTotal+' résultat(s)/artefact(s) · '+countKind('proposal')+' proposition(s)',
    nextAction:worktrees.some(w=>w.dirty)?'Examiner les worktrees modifiés observés.':noAction,
    facts:[
     {label:'worktrees',value:worktrees.length},
     {label:'modifiés',value:worktrees.filter(w=>w.dirty).length},
     {label:'résultats / artefacts',value:resultTotal},
     {label:'propositions',value:countKind('proposal')},
    ],
   },
   agents:{
    status:liveAgents?'LIVE':agentTotal?'DISPONIBLE':'NON OBSERVÉ',
    blocker:blockedAgents?blockedAgents+' session(s) bloquée(s) ou en erreur':noBlock,
    proof:liveAgents?liveAgents+' session(s) live observée(s)':agentTotal?agentTotal+' agent(s) connu(s)':'Aucune présence agent observée',
    nextAction:blockedAgents?'Examiner les sessions bloquées ou en erreur.':noAction,
    facts:[
     {label:'agents connus',value:agentTotal},
     {label:'live',value:liveAgents},
     {label:'bloqués observés',value:blockedAgents},
     {label:'sessions',value:countKind('session')},
    ],
   },
   governance:{
    status:governanceTotal?'OBSERVÉ':'NON OBSERVÉ',
    blocker:missionBlockers?missionBlockers+' mission(s) avec blocage de traçabilité':noBlock,
    proof:governanceTotal+' preuve(s) gouvernance · '+completeMissions+' mission(s) complète(s)',
    nextAction:missions.find(m=>m.primaryBlocker)?.recommendedNextStep||noAction,
    facts:[
     {label:'preuves gouvernance',value:governanceTotal},
     {label:'missions bloquées',value:missionBlockers},
     {label:'missions complètes',value:completeMissions},
     {label:'chaînes preuve',value:relCount('AUTHORIZES_RECEIPT','PROVES_IMPACT','HAS_ROLLBACK_EVIDENCE')},
    ],
   },
   knowledge:{
    status:knowledgeTotal?'OBSERVÉ':'NON OBSERVÉ',
    blocker:noBlock,
    proof:resultTotal?resultTotal+' résultat(s)/artefact(s) observé(s)':'Aucun résultat ou artefact observé',
    nextAction:noAction,
    facts:[
     {label:'objets',value:knowledgeTotal},
     {label:'résultats / artefacts',value:resultTotal},
     {label:'objectifs',value:countKind('objective')},
     {label:'dépôts',value:countKind('repository')},
    ],
   },
   layers:{
    status:layers.length?'DOCUMENTÉ':'NON OBSERVÉ',
    blocker:noBlock,
    proof:layers.length?layers.length+' couche(s) documentaire(s) chargée(s)':'Aucune couche documentaire observée',
    nextAction:noAction,
    facts:[
     {label:'couches',value:layers.length},
     {label:'fichiers exposés',value:files.length},
     {label:'runtime canonique',value:'non revendiqué'},
     {label:'rôle',value:'navigation'},
    ],
   },
  }
  return territories.map(t=>({...t,...cards[t.zone]}))
 },[shared,snap,live,layers,files])

 const currentTerritory=worldZone!=='home'&&worldZone!=='territories'?territoryCards.find(t=>t.zone===worldZone):undefined

 const observedRoutines=useMemo(()=>{
  const entityLabel=(id:string)=>shared?.entities.find(e=>e.id===id)?.label||id
  return (shared?.missions||[]).map(m=>{
   const steps:{zone:WorldZone;mechanism:string;ref:string;label:string}[]=[]
   const add=(zone:WorldZone,mechanism:string,refs:(string|undefined|null)[])=>{
    for(const ref of refs.filter((x):x is string=>!!x))steps.push({zone,mechanism,ref,label:entityLabel(ref)})
   }
   if(m.domainId)add('domains','IN_DOMAIN',['domain:'+m.domainId])
   if(m.agentId)add('agents','USES_AGENT',['agent:'+m.agentId])
   add('agents','HAS_SESSION',m.sessionRefs||[])
   add('knowledge','HAS_RESULT',m.resultRefs||[])
   add('governance','HAS_DECISION',m.decisionRecordRefs||[])
   add('governance','HAS_RECEIPT',m.receiptRefs||[])
   add('governance','HAS_IMPACT',m.impactRefs||[])
   return {id:m.id,label:m.actionId,status:m.status,traceabilityStatus:m.traceabilityStatus,steps}
  })
 },[shared])

 const territoryRoutines=useMemo(()=>{
  if(!currentTerritory)return []
  return observedRoutines.map(r=>({...r,steps:r.steps.filter(s=>s.zone===currentTerritory.zone)})).filter(r=>r.steps.length)
 },[observedRoutines,currentTerritory])

 const worldOperational=useMemo(()=>{
  const attention:{id:string;label:string;meta:string;zone:WorldZone;entityId?:string}[]=[]
  for(const e of shared?.entities.filter(e=>e.kind==='domain'&&!e.runtimeFilePresent)||[]){
   attention.push({id:'domain:'+e.id,label:e.label,meta:'Runtime domaine non confirmé',zone:'domains',entityId:e.id})
  }
  for(const s of live.filter(s=>s.status==='blocked'||s.status==='error')){
   attention.push({id:'session:'+s.sessionId,label:s.name||s.agentId,meta:'Session '+(s.status||'à examiner'),zone:'agents',entityId:'session:'+s.sessionId})
  }
  for(const m of shared?.missions.filter(m=>m.primaryBlocker)||[]){
   attention.push({id:'mission:'+m.id,label:m.actionId,meta:m.recommendedNextStep||m.primaryBlocker||'Traçabilité incomplète',zone:'governance',entityId:m.id})
  }
  const territoriesAttention=territoryCards.filter(t=>t.blocker!=='Aucun blocage observé').length
  return {
   territoriesAttention,
   liveSessions:live.length,
   blockedMissions:shared?.missions.filter(m=>m.primaryBlocker).length||0,
   proofs:proofCount,
   attention:attention.slice(0,12),
  }
 },[shared,live,territoryCards,proofCount])

 return <div className="v5">
  <aside className="v5-sidebar">
   <a className="v5-brand" href="#world"><span>◈</span><div><strong>OBSIDIA</strong><small>Écosystème IA</small></div></a>
   <nav className="v5-primary-nav">
    {nav.map(([id,label])=><a key={id} href={'#'+id} aria-current={view===id?'page':undefined} onClick={()=>{if(id==='world')setWorldZone('home');setView(id)}}><span>{id==='world'?'◎':id==='workspace'?'▦':id==='agents'?'◇':'⌕'}</span><div><strong>{label}</strong><small>{id==='world'?'Vue globale':id==='workspace'?'Projets et outils':id==='agents'?'Agents IA':'Connaissances'}</small></div></a>)}
   </nav>
   <div className="v5-sidebar-foot">
    <div className="v5-context-mini"><span>Contexte</span><strong>{contextLabel}</strong></div>
    <small>{shared?.decisionAuthority||'KX108_ONLY'}</small>
   </div>
  </aside>

  <section className="v5-app">
   <header className="v5-topbar">
    <div className="v5-top-search"><span>⌕</span><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} onFocus={()=>{if(view!=='search')go('search')}} placeholder="Rechercher un agent, une mission, un fichier, un domaine…" /></div>
    <div className="v5-system"><span className={coreRuntimeReady?'on':''}/><div><strong>{coreRuntimeReady?'Core LIVE':snap?.available?'Sources disponibles':'Hors ligne'}</strong><small>{coreRuntimeReady?'Kernel + API observés':snap?.available?'Runtime core non prêt':'Connexion indisponible'}</small></div></div>
    <div className="v5-core"><strong>Obsidia Core</strong><small>{snap?.branch||'branche inconnue'} · {snap?.sha?.slice(0,7)||'—'}</small></div>
   </header>
   {message&&<p className="v5-message">{message}</p>}

   <main className="v5-main">
   {view==='world'&&worldZone==='home'&&<section className="v5-page v5-dashboard">
    <header className="v5-welcome">
     <div><h1>Bienvenue sur Obsidia</h1><p>Un écosystème d’agents, de connaissances et d’actions autour de tes projets.</p></div>
     <div className="v5-kpis">
      <article className={coreRuntimeReady?'live':'warn'}><strong>{coreRuntimeReady?'Core opérationnel':snap?.available?'Sources chargées · core non prêt':'Système hors ligne'}</strong><small>{coreRuntimeReady?'Kernel 3001 + API 8000 observés':snap?.available?'repo accessible, runtime à lancer':'connexion indisponible'}</small></article>
      <article><strong>{live.length}</strong><small>agents actifs</small></article><article><strong>{systemServices.length}</strong><small>services système</small></article>
      <article><strong>{shared?.missions.length||0}</strong><small>missions</small></article>
      <article className="warn"><strong>{shared?.missions.filter(m=>m.primaryBlocker).length||0}</strong><small>blocages</small></article>
      <article><strong>{allResultEntities.length}</strong><small>résultats</small></article>
     </div>
    </header>

    <section className="v5-space-grid">
     <button className="v5-space-card world" onClick={()=>{setWorldZone('territories');go('world')}}><div className="icon">◎</div><div className="head"><h2>Monde</h2><span>Explorer l’écosystème</span></div><div className="metrics"><strong>{domainCount}<small>domaines</small></strong><strong>{snap?.worktrees?.length||0}<small>worktrees</small></strong><strong>{shared?.entities.length||0}<small>objets</small></strong></div><div className="spark bars blue">{Array.from({length:12},(_,i)=><i key={i} style={{height:(18+((i*13)%42))+'px'}}/> )}</div><footer>Terrains · R&D · Gouvernance · Couches</footer></button>
     <button className="v5-space-card workspace" onClick={()=>go('workspace')}><div className="icon">▦</div><div className="head"><h2>Workspace</h2><span>Construire et collaborer</span></div><div className="metrics"><strong>{live.length}<small>agents</small></strong><strong>{files.length}<small>fichiers</small></strong><strong>{proofCount}<small>preuves</small></strong></div><div className="spark line purple"/><footer>Brody · Obsidure · CLI · Fichiers</footer></button>
     <button className="v5-space-card pokemon" onClick={()=>go('agents')}><div className="icon">◇</div><div className="head"><h2>Pokémon</h2><span>Agents et leurs actions</span></div><div className="metrics"><strong>{shared?.entities.filter(e=>e.kind==='agent').length||0}<small>agents</small></strong><strong>{shared?.missions.length||0}<small>missions</small></strong><strong>{live.length}<small>live</small></strong></div><div className="spark bars green">{Array.from({length:12},(_,i)=><i key={i} style={{height:(14+((i*17)%46))+'px'}}/> )}</div><footer>Agents · Pipeline · Population · Missions</footer></button>
     <button className="v5-space-card search" onClick={()=>go('search')}><div className="icon">⌕</div><div className="head"><h2>Recherche</h2><span>Connaissances et preuves</span></div><div className="metrics"><strong>{agents.length}<small>agents</small></strong><strong>{files.length}<small>fichiers</small></strong><strong>{proofCount}<small>preuves</small></strong></div><div className="spark line violet"/><footer>Domaines · Missions · Fichiers · Couches</footer></button>
    </section>

    <section className="v5-dashboard-grid">
     <article className="v5-panel">
      <header><div><h2>Agents actifs</h2><small>{live.length} en cours</small></div><button onClick={()=>go('agents')}>Voir tous</button></header>
      <div className="v5-list">{activeAgents.map(s=><button key={s.sessionId} onClick={()=>{focus('session:'+s.sessionId);go('agents')}}><span className="avatar">{s.name?.slice(0,1)||'A'}</span><div><strong>{s.name||s.agentId}</strong><small>{s.objective||s.message||s.phase}</small></div><em>LIVE</em></button>)}{!activeAgents.length&&<p className="v5-empty">Aucun agent actif.</p>}</div>
     </article>

     <article className="v5-panel">
      <header><div><h2>Missions en cours</h2><small>{shared?.missions.length||0} mission(s)</small></div><button onClick={()=>{setWorldZone('activity');go('world')}}>Voir toutes</button></header>
      <div className="v5-list missions">{currentMissions.map(m=><button key={m.id} onClick={()=>{focus(m.id);setWorldZone('activity')}}><span className="avatar mission">◆</span><div><strong>{m.actionId}</strong><small>{m.agentId||'agent non relié'} · {m.status}</small></div><em className={m.primaryBlocker?'blocked':''}>{m.primaryBlocker?'BLOQUÉ':m.traceabilityStatus}</em></button>)}{!currentMissions.length&&<p className="v5-empty">Aucune mission observée.</p>}</div>
     </article>

     <article className="v5-panel">
      <header><div><h2>Dernières preuves et résultats</h2><small>{resultEntities.length} récent(s)</small></div><button onClick={()=>{setWorkspaceArea('files');go('workspace')}}>Voir tout</button></header>
      <div className="v5-list results">{resultEntities.map(e=><button key={e.id} onClick={()=>{focus(e.id);setWorldZone('knowledge')}}><span className="avatar result">▤</span><div><strong>{e.label}</strong><small>{e.kind} · {e.path||e.source||'objet partagé'}</small></div><em>OK</em></button>)}{!resultEntities.length&&<p className="v5-empty">Aucun résultat récent.</p>}</div>
     </article>
    </section>

    <section className="v5-bottom-grid">
     <article className="v5-panel layers">
      <header><div><h2>Couches et connaissances</h2><small>{layers.length} couche(s)</small></div><button onClick={()=>{setWorldZone('layers');go('world')}}>Voir toutes</button></header>
      <div className="v5-layer-cards">{layers.slice(0,4).map((l,i)=><button key={l.id} onClick={()=>{setWorldZone('layers');go('world')}}><span>{['Terrains','R&D / Build','Gouvernance','Documentaires'][i]||'Couche'}</span><strong>{l.title}</strong><small>{l.path}</small></button>)}</div>
     </article>
     <article className="v5-panel ecosystem">
      <header><div><h2>Répartition de l’écosystème</h2><small>Vue synthétique</small></div></header>
      <div className="v5-eco"><div className="donut"><strong>{shared?.entities.filter(e=>e.kind==='agent').length||0}</strong><small>agents</small></div><ul><li><span className="g"/>Live <strong>{live.length}</strong></li><li><span className="b"/>Domaines <strong>{domainCount}</strong></li><li><span className="p"/>Fichiers <strong>{files.length}</strong></li><li><span className="a"/>Preuves <strong>{proofCount}</strong></li></ul></div>
     </article>
    </section>
   </section>}

   {view==='world'&&worldZone!=='home'&&<section className="v5-page v5-world-section">
    <header className="v5-page-head">
     <div><small>MONDE</small><h1>{zones.find(([id])=>id===worldZone)?.[1]}</h1><p>Explorer cette partie de l’écosystème Obsidia.</p></div>
     <button onClick={()=>setWorldZone('home')}>← Vue globale</button>
    </header>
    <nav className="v5-world-trail" aria-label="Navigation micro macro">
     <button onClick={()=>setWorldZone('home')}>Monde</button><span>›</span>
     <button onClick={backToTerritories}>Territoires</button>
     {worldZone!=='territories'&&<><span>›</span><button onClick={()=>{setSelectedMechanism('');setWorldZone(worldZone)}}>{zones.find(([id])=>id===worldZone)?.[1]}</button></>}
     {contextEntity&&worldZone!=='territories'&&<><span>›</span><strong>{contextEntity.label}</strong></>}
    </nav>
    <nav className="v5-zonebar">{zones.map(([id,label])=><button key={id} aria-pressed={worldZone===id} onClick={()=>{setSelectedMechanism('');setWorldZone(id)}}>{label}</button>)}</nav>
    {currentTerritory&&<section className="v5-territory-health">
     <article><small>ÉTAT</small><strong>{currentTerritory.status}</strong><p>Projection readonly du territoire.</p></article>
     <article className={currentTerritory.blocker==='Aucun blocage observé'?'':'warn'}><small>BLOCAGE</small><strong>{currentTerritory.blocker}</strong><p>Uniquement à partir des signaux observés.</p></article>
     <article><small>PREUVE</small><strong>{currentTerritory.proof}</strong><p>Aucune preuve supplémentaire n’est inférée.</p></article>
     <article><small>PROCHAINE ACTION</small><strong>{currentTerritory.nextAction}</strong><p>Conseil de navigation, sans autorité d’action.</p></article>
    </section>}
    {currentTerritory&&<section className="v5-routines">
     <header><div><small>ROUTINES / PROCESSUS OBSERVÉS</small><h2>Chaînes de mission reliées à ce territoire</h2></div><span>{territoryRoutines.length} chaîne(s)</span></header>
     <p className="v5-routines-note">Projection de traçabilité : regroupe uniquement les liens déjà observés. Aucun ordre temporel supplémentaire n’est inféré.</p>
     <div>{territoryRoutines.length?territoryRoutines.map(r=><article key={r.id}>
      <header><button onClick={()=>openWorldObject(r.id)}><strong>{r.label}</strong><small>{r.status} · {r.traceabilityStatus}</small></button></header>
      <div>{r.steps.map((s,i)=><button key={s.mechanism+s.ref+i} onClick={()=>openWorldObject(s.ref)}><code>{s.mechanism}</code><strong>{s.label}</strong><small>{s.ref}</small></button>)}</div>
     </article>):<p className="v5-empty">Aucune chaîne de mission observée dans ce territoire.</p>}</div>
    </section>}
    {worldZone!=='territories'&&territorySublayers[worldZone]?.length&&<section className="v5-sublayers">
     <header><div><small>SOUS-COUCHES</small><h2>Organisation du territoire</h2></div><span>projection de navigation</span></header>
     <div>{territorySublayers[worldZone]!.map((x,i)=><article key={x.label}><em>{String(i+1).padStart(2,'0')}</em><strong>{x.label}</strong><p>{x.summary}</p></article>)}</div>
    </section>}
    {worldZone!=='territories'&&territoryRelationTypes[worldZone]&&<section className="v5-mechanisms">
     <header><div><small>LIAISONS OBSERVÉES</small><h2>Mécanismes visibles dans la projection</h2></div><span>{observedMechanisms.length} type(s)</span></header>
     <div>{observedMechanisms.length?observedMechanisms.map(x=><button key={x.type} aria-pressed={selectedMechanism===x.type} onClick={()=>setSelectedMechanism(selectedMechanism===x.type?'':x.type)}><code>{x.type}</code><strong>{x.count}</strong></button>):<p className="v5-empty">Aucune liaison observée pour ce territoire.</p>}</div>
    </section>}
    {selectedMechanism&&<section className="v5-mechanism-detail">
     <header><div><small>LIAISON</small><h2>{selectedMechanism}</h2></div><button onClick={()=>setSelectedMechanism('')}>Fermer</button></header>
     <div>{mechanismRelations.map((r,i)=><article key={r.from+r.to+i}><button onClick={()=>openWorldObject(r.from)}><small>DE</small><strong>{r.fromLabel}</strong><code>{r.from}</code></button><span>→ <code>{r.type}</code> →</span><button onClick={()=>openWorldObject(r.to)}><small>VERS</small><strong>{r.toLabel}</strong><code>{r.to}</code></button></article>)}</div>
    </section>}
    {worldZone==='territories'&&<section className="v5-world-cockpit">
     <header><div><small>COCKPIT MONDE</small><h2>État opérationnel observé</h2></div><span>projection readonly</span></header>
     <div className="v5-world-cockpit-kpis">
      <article><strong>{worldOperational.territoriesAttention}</strong><small>territoires en attention</small></article>
      <article><strong>{worldOperational.liveSessions}</strong><small>sessions live</small></article>
      <article><strong>{worldOperational.blockedMissions}</strong><small>missions bloquées</small></article>
      <article><strong>{worldOperational.proofs}</strong><small>preuves observées</small></article>
     </div>
     <div className="v5-world-attention">
      <header><strong>À examiner</strong><small>{worldOperational.attention.length} signal(s) observé(s)</small></header>
      {worldOperational.attention.length?worldOperational.attention.map(x=><button key={x.id} onClick={()=>{if(x.entityId)openWorldObject(x.entityId);else setWorldZone(x.zone)}}><span>!</span><div><strong>{x.label}</strong><small>{x.meta}</small></div><em>{zones.find(([id])=>id===x.zone)?.[1]}</em></button>):<p className="v5-empty">Aucun signal bloquant observé dans la projection.</p>}
     </div>
    </section>}
    {worldZone==='territories'?<section className="v5-territory-map">
     {territoryCards.map(t=><button key={t.id} className="v5-territory-card" onClick={()=>{setSelectedMechanism('');setWorldZone(t.zone)}}>
      <header><span>{t.glyph}</span><div><small>TERRITOIRE</small><h2>{t.label}</h2></div><em>{t.status}</em></header>
      <p>{t.summary}</p>
      <div className="v5-territory-facts">{t.facts.map(f=><span key={f.label}><strong>{f.value}</strong><small>{f.label}</small></span>)}</div>
      <div className="v5-territory-sublayers">{(territorySublayers[t.zone]||[]).map(x=><i key={x.label}>{x.label}</i>)}</div>
      <div className="v5-territory-signal"><span><small>BLOCAGE</small><strong>{t.blocker}</strong></span><span><small>PREUVE</small><strong>{t.proof}</strong></span></div>
      <footer>Ouvrir le territoire →</footer>
     </button>)}
    </section>:<section className="v5-grid">
     {worldItems.map(item=><button className="v5-object" key={item.id} onClick={()=>{if(item.id.startsWith('layer:')){const lid=item.id.slice(6);const l=layers.find(x=>x.id===lid);if(l){setSelectedFile(l.path);setFileContent(l.content)}}else openWorldObject(item.id)}}><small>{item.kind}</small><strong>{item.label}</strong><span>{item.meta}</span></button>)}
     {!worldItems.length&&<p className="v5-empty">Aucun objet observé dans cette zone.</p>}
    </section>}
    {contextEntity&&<aside className="v5-focus"><small>OBJET SÉLECTIONNÉ</small><h2>{contextEntity.label}</h2><p>{contextEntity.kind} · {contextEntity.id}</p><div><button onClick={backToTerritories}>← Territoires</button>{zoneForEntity(contextEntity)&&zoneForEntity(contextEntity)!==worldZone&&<button onClick={()=>setWorldZone(zoneForEntity(contextEntity)!)}>Son territoire</button>}<button onClick={openContextWorkspace}>Workspace</button><button onClick={()=>go('agents')}>Pokémon</button></div><details><summary>Relations · {shared?.relations.filter(r=>r.from===contextEntity.id||r.to===contextEntity.id).length||0}</summary>{shared?.relations.filter(r=>r.from===contextEntity.id||r.to===contextEntity.id).map((r,i)=><p key={i}><code>{r.from}</code> → {r.type} → <code>{r.to}</code></p>)}</details></aside>}
    {worldZone==='layers'&&selectedFile&&<section className="v5-layer-reader"><header><strong>{selectedFile}</strong><button onClick={()=>{setSelectedFile('');setFileContent('')}}>Fermer</button></header><pre>{fileContent}</pre></section>}
   </section>}

   {view==='workspace'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>QUOI ?</small><h1>Workspace</h1><p>Travailler sur ce qui est en cours.</p></div><strong>{live.length} session(s)</strong></header>
    <nav className="v5-subnav">{([['home',"Aujourd'hui"],['launchers','Lancements'],['brody','Brody'],['obsidure','Obsidure'],['cli','CLI'],['files','Fichiers & preuves']] as [WorkspaceArea,string][]).map(([id,label])=><button key={id} aria-pressed={workspaceArea===id} onClick={()=>setWorkspaceArea(id)}>{label}</button>)}</nav>
    {workspaceArea==='launchers'&&<V5Launchers/>}
    {workspaceArea==='home'&&<section className="v5-work-list">{live.length?live.map(s=><article key={s.sessionId}><small>{s.agentId}</small><h2>{s.name}</h2><p>{s.objective||s.message||'Aucun objectif observé'}</p><span>{s.phase}</span><div><button onClick={()=>{sessionStorage.setItem('obsidia-selected-session',s.sessionId);focus('session:'+s.sessionId);setWorkspaceArea(s.agentId==='brody'?'brody':s.agentId==='obsidure'?'obsidure':s.agentId==='cli'?'cli':'home')}}>Continuer</button><button onClick={()=>{focus('session:'+s.sessionId);go('agents')}}>Voir l’agent</button></div></article>):<p className="v5-empty">Aucune session live.</p>}</section>}
    {(['brody','obsidure','cli'] as const).includes(workspaceArea as 'brody'|'obsidure'|'cli')&&(()=>{const tool=workspaceArea as 'brody'|'obsidure'|'cli';const s=activeTool(tool);const process=s?processes.find(p=>p.sessionId===s.sessionId):undefined;const conversation=(s?.events||[]).filter(e=>e.phase==='INPUT_RECEIVED'||e.kind==='response');return <section className="v5-tool"><header><div><small>OUTIL</small><h2>{tool==='brody'?'Brody':tool==='obsidure'?'Obsidure':'CLI Obsidia'}</h2></div><span>{s?.presence==='live'?'SESSION ACTIVE':'PRÊT'}</span></header>{s&&<div className="v5-instance-strip"><span><small>INSTANCE</small><strong>{tool==='brody'?'Brody · API locale 8000':tool==='obsidure'?'Obsidure · runtime local':'CLI Obsidia · runtime local'}</strong></span><span><small>MODE</small><strong>{process?.native?'Terminal Windows':'Intégré interface'}</strong></span><span><small>SESSION</small><strong>{s.sessionId.slice(0,8)}</strong></span><span><small>SOURCE</small><strong>{s.source||'OBSIDIA_VISUAL_EVENT_V1'}</strong></span></div>}{tool==='brody'?<div className="v5-chat">{conversation.length?conversation.map((e,i)=>{const answer=e.kind==='response'?(String(e.result?.final_answer||e.result?.response||e.message||'')):(e.objective||e.message);return <article key={i}><strong>{e.phase==='INPUT_RECEIVED'?'Vous':'Brody'}</strong><p>{answer}</p></article>}):<p className="v5-empty">Écris directement ta demande.</p>}</div>:tool==='obsidure'?(process?.native?<div className="v5-tool-output"><h3>Terminal Windows actif</h3><p>{s?.objective||'Aucune mission active.'}</p><p>La sortie détaillée reste dans le terminal natif pour éviter de dupliquer le TUI dans Workspace.</p></div>:<div className="v5-tool-output"><h3>Mission / résultat</h3><p>{s?.objective||'Aucune mission active.'}</p><pre>{process?.output||s?.message||'Le résultat apparaîtra ici.'}</pre></div>):process?.native?<div className="v5-tool-output"><h3>Terminal Windows actif</h3><p>La console complète reste dans sa fenêtre native.</p></div>:<div className="v5-tool-output"><h3>Console</h3><pre>{process?.output||'CLI prête.'}</pre>{cliRuntime&&<details><summary>État runtime</summary><p><strong>{cliRuntime.state}</strong> · autorité {cliRuntime.decisionAuthority} · projection readonly</p><div className="v5-cli-runtime">{cliRuntime.services.map(x=><p key={x.id}><strong>{x.label}</strong> · {x.status} <small>{x.evidence}</small></p>)}</div></details>}</div>}{process?.native?<div className="v5-terminal-input-note"><strong>Saisie dans le terminal Windows</strong><p>Cette session a été lancée en terminal natif. Continue directement dans sa fenêtre Windows.</p></div>:<form className="v5-composer" onSubmit={e=>{e.preventDefault();void sendTool(tool)}}>{tool==='cli'?<input value={toolText} onChange={e=>setToolText(e.target.value)} onKeyDown={e=>composerKeyDown(e,tool)} placeholder="Commande / demande CLI"/>:<textarea value={toolText} onChange={e=>setToolText(e.target.value)} onKeyDown={e=>composerKeyDown(e,tool)} placeholder={tool==='brody'?'Écris à Brody…':'Décris la mission…'}/>}<button disabled={toolBusy||!toolText.trim()}>Envoyer</button></form>}<div className="v5-tool-actions">{!s||s.presence!=='live'?<button disabled={toolBusy} onClick={()=>runTool(tool)}>Démarrer</button>:<>{process?.native&&<button disabled={toolBusy} onClick={async()=>{try{await sessionAction('focus/'+s.sessionId)}catch(e){setMessage(String(e))}}}>Ouvrir le terminal</button>}<button disabled={toolBusy} onClick={()=>stopTool(tool)}>Arrêter</button></>}{tool==='obsidure'&&<><button disabled={toolBusy} onClick={()=>runTool('obsidure','audit')}>Audit rapide</button><button disabled={toolBusy} onClick={()=>runTool('obsidure','audit-long')}>Audit long</button></>}</div></section>})()}
    {workspaceArea==='files'&&<section className="v5-files"><div><h2>Fichiers</h2><div className="v5-file-list">{files.slice(0,250).map(p=><button key={p} onClick={()=>openFile(p)}>{p}</button>)}</div></div><div><h2>Résultats / receipts</h2>{snap?.proposals.map(p=><article key={p.id}><strong>{p.id}</strong><button onClick={()=>openFile(p.path)}>Résultat</button>{p.receipt&&<button onClick={()=>openFile(p.receipt!)}>Receipt</button>}</article>)}{selectedFile&&<><h3>{selectedFile}</h3><pre>{fileContent}</pre></>}</div></section>}
   </section>}

   {view==='agents'&&<section className="v5-page v5-pokemon"><V5Pokemon/></section>}

   {view==='search'&&<section className="v5-page">
    <header className="v5-page-head"><div><small>TROUVER</small><h1>Recherche</h1><p>Un seul endroit pour retrouver agents, missions, domaines, fichiers et preuves.</p></div></header>
    <section className="v5-search"><input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Chercher dans Obsidia…" aria-label="Recherche globale"/><nav>{([['all','Tout'],['agent','Agents'],['mission','Missions'],['domain','Domaines'],['file','Fichiers'],['proof','Preuves'],['layer','Couches']] as const).map(([id,label])=><button key={id} aria-pressed={searchKind===id} onClick={()=>{setSearchKind(id);setSearchSelection(null)}}>{label}</button>)}</nav><div className="v5-search-results">{searchResults.length?searchResults.map(r=><button key={r.id} onClick={r.action}><small>{r.kind}</small><strong>{r.label}</strong><span>{r.meta}</span></button>):<p className="v5-empty">{searchKind==='all'&&searchQuery.trim().length<2?'Choisis une catégorie ou écris au moins deux caractères.':'Aucun résultat.'}</p>}</div>
    {searchSelection&&<aside className="v5-search-detail"><header><div><small>{searchSelection.kind}</small><h2>{searchSelection.label}</h2></div><button onClick={()=>setSearchSelection(null)}>Fermer</button></header><p>{searchSelection.meta}</p><div className="v5-detail-actions">{searchSelection.kind==='Fichier'?<button onClick={()=>{void openFile(searchSelection.meta);setWorkspaceArea('files');go('workspace')}}>Ouvrir dans Workspace</button>:searchSelection.kind==='Couche'?<button onClick={()=>{const id=searchSelection.id.slice(6);const l=layers.find(x=>x.id===id);if(l){setSelectedFile(l.path);setFileContent(l.content)}setWorldZone('layers');go('world')}}>Ouvrir la couche</button>:<><button onClick={()=>{if(searchSelection.kind.toLowerCase().includes('agent'))focusSearchAgent();else focus(searchSelection.id);setWorldZone(searchSelection.kind==='Mission'?'activity':searchSelection.kind.toLowerCase().includes('domain')?'domains':searchSelection.kind.toLowerCase().includes('agent')?'agents':['result','artifact'].includes(searchSelection.kind)?'knowledge':'governance');go('world')}}>Voir dans Monde</button>{searchSelection.kind.toLowerCase().includes('agent')&&<button onClick={()=>{focusSearchAgent();go('agents')}}>Voir dans Pokémon</button>}</>}</div></aside>}
    </section>
    <section className="v5-recent"><h2>Activité récente</h2>{recent.map((e,i)=><button key={e.sessionId+e.timestamp+i} onClick={()=>{focus('session:'+e.sessionId);setWorldZone('activity');go('world')}}><strong>{e.name||e.agentId}</strong><span>{e.phase}</span><small>{e.message}</small></button>)}</section>
   </section>}
  </main>
  </section>
 </div>
}
