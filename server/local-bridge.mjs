import {brodyServiceStatus,closeOwnedBrodyApi} from './brody-service.mjs'
import {terminalCommand,launchTerminal,focusTerminal,stopTerminal,terminalAlive} from './native-terminal.mjs'
import {liveSnapshot,liveDirectory} from './live-events.mjs'
import {buildObsidiaState} from './obsidia-state.mjs'
import {randomUUID} from 'node:crypto'
import {execFileSync,spawn} from 'node:child_process'
import {existsSync,realpathSync,readFileSync,readdirSync,statSync,appendFileSync,mkdirSync} from 'node:fs'
import {resolve,relative,sep} from 'node:path'
import {homedir} from 'node:os'
import {projectRoot,repository,observer,pythonFor} from './paths.mjs'
export {repository} from './paths.mjs'
export function contained(root,path){const r=realpathSync(root),p=realpathSync(resolve(r,path));const rel=relative(r,p);if(rel.startsWith('..'+sep)||rel==='..'||rel.startsWith(sep))throw Error('Chemin hors projet');return p}
const launchers={cli:'scripts/obsidia_cli.py',brody:'scripts/brody_terminal_chat.py',obsidure:'scripts/obsidure_cli.py'}
const nativeServiceIds=new Set(['kernel-x108','obsidia-api','qwen-text','qwen-vl','open-jarvis','gps-defense','trading-x108','brody-enriched','obsidure-dry'])
function nativeServiceSpec(id,root){
 const q=s=>"'" + String(s).replaceAll("'","''") + "'"
 const rt=resolve(root,'runtime_terrain_bank_trading_gps')
 const api='http://127.0.0.1:8000'
 const specs={
  'kernel-x108':{
   title:'RAGNAROK KERNEL 3001 - AUTHORITY',
   command:`chcp 65001 | Out-Null; [Console]::OutputEncoding=[System.Text.Encoding]::UTF8; $env:OBSIDIA_TERMINAL_COLOR='1'; Set-Location -LiteralPath ${q(rt)}; node .\\server.kernel.sealed.cjs`
  },
  'obsidia-api':{
   title:'OBSIDIA API 8000 - LIVE KERNEL BRIDGE',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'obsidia-api' -Root ${q(root)}`
  },
  'qwen-text':{
   title:'QWEN TEXT 8080 - LOCAL GGUF',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'qwen-text' -Root ${q(root)}`
  },
  'qwen-vl':{
   title:'QWEN-VL 8081 - VISION LOCAL',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'qwen-vl' -Root ${q(root)}`
  },
  'open-jarvis':{
   title:'OPEN JARVIS - GOVERNED',
   command:`$oj=@(
     (Join-Path $env:USERPROFILE 'Desktop\\obsidia-openjarvis-install-v0'),
     'C:\\Users\\User\\Desktop\\obsidia-openjarvis-install-v0',
     'C:\\Users\\Aubin\\Desktop\\obsidia-openjarvis-install-v0'
   ) | Where-Object { Test-Path -LiteralPath (Join-Path $_ 'start-openjarvis.ps1') } | Select-Object -First 1; if(-not $oj){ throw 'Open Jarvis launcher introuvable' }; Set-Location -LiteralPath $oj; & (Join-Path $oj 'start-openjarvis.ps1')`
  },
  'gps-defense':{
   title:'GPS/AVIATION LIVE -> KERNEL BRIDGE',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'gps-defense' -Root ${q(root)}`
  },
  'trading-x108':{
   title:'TRADING LIVE -> KERNEL BRIDGE',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'trading-x108' -Root ${q(root)}`
  },
  'brody-enriched':{
   title:'BRODY ENRICHED',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'brody-enriched' -Root ${q(root)}`
  },
  'obsidure-dry':{
   title:'OBSIDURE',
   command:`& ${q(resolve(projectRoot,'scripts','start-service-colored.ps1'))} -Service 'obsidure-dry' -Root ${q(root)}`
  }
 }
 return specs[id]
}
function emitNativeService(session,id,title,root){
 mkdirSync(liveDirectory,{recursive:true})
 const event={schema:'OBSIDIA_VISUAL_EVENT_V1',sessionId:session,agentId:id,name:title,repository:root,timestamp:new Date().toISOString(),kind:'session_start',status:'thinking',phase:'STARTING',message:'Terminal service natif',objective:null}
 appendFileSync(resolve(liveDirectory,session+'.jsonl'),JSON.stringify(event)+'\n')
}
const jarjarRootCandidates=()=>[
 process.env.OBSIDIA_JARJAR_ROOT,
 resolve(homedir(),'Desktop','Jarvis-iron-obsidia-github'),
 'C:\\Users\\User\\Desktop\\Jarvis-iron-obsidia-github',
 'C:\\Users\\Aubin\\Desktop\\Jarvis-iron-obsidia-github',
 resolve(homedir(),'Desktop','Jarvis-iron-obsidia-'),
 'C:\\Users\\User\\Desktop\\Jarvis-iron-obsidia-',
 'C:\\Users\\Aubin\\Desktop\\Jarvis-iron-obsidia-'
].filter(Boolean)
const jarjarRoot=()=>jarjarRootCandidates().find(p=>existsSync(p))||jarjarRootCandidates()[0]
const jarjarPythonCandidates=()=>[
 process.env.OBSIDIA_JARJAR_PYTHON,
 resolve(jarjarRoot(),'.venv','Scripts','python.exe'),
 resolve(homedir(),'Desktop','Jarvis-iron-obsidia-','.venv','Scripts','python.exe'),
 'C:\\Users\\User\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
 resolve(homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','python','python.exe')
].filter(Boolean)
const jarjarPython=()=>jarjarPythonCandidates().find(p=>existsSync(p))||jarjarPythonCandidates()[0]
const jarjarModule='scripts.run_jarjar_live'
const jarjarModuleFile='scripts/run_jarjar_live.py'
function emitJarjar(session,kind,fields={}){
 mkdirSync(liveDirectory,{recursive:true})
 const event={schema:'OBSIDIA_VISUAL_EVENT_V1',sessionId:session,agentId:'jarjar',name:'Jarjar',repository:jarjarRoot(),timestamp:new Date().toISOString(),kind,status:'thinking',phase:'STARTING',message:'Jarjar runtime',objective:null,...fields}
 appendFileSync(resolve(liveDirectory,session+'.jsonl'),JSON.stringify(event)+'\n')
}
let nativeObservationCache={at:0,value:null}
function nativeServicesObservedStatus(){
 const now=Date.now()
 if(nativeObservationCache.value&&now-nativeObservationCache.at<1500)return nativeObservationCache.value
 let listening=''
 try{listening=execFileSync('netstat.exe',['-ano','-p','tcp'],{encoding:'utf8',timeout:4000,windowsHide:true})}catch{}
 const portOpen=port=>new RegExp('127\\.0\\.0\\.1:'+port+'\\s+.*LISTENING','i').test(listening)||new RegExp('0\\.0\\.0\\.0:'+port+'\\s+.*LISTENING','i').test(listening)||new RegExp('\\[::\\]:'+port+'\\s+.*LISTENING','i').test(listening)
 let commandLines=[]
 try{
  const raw=execFileSync('powershell.exe',['-NoProfile','-Command',"$p=Get-CimInstance Win32_Process | Where-Object {$_.CommandLine}; @($p | Select-Object ProcessId,CommandLine) | ConvertTo-Json -Compress"],{encoding:'utf8',timeout:7000,windowsHide:true}).trim()
  const parsed=raw?JSON.parse(raw):[]
  commandLines=Array.isArray(parsed)?parsed:[parsed]
 }catch{}
 const hasProcess=(pattern)=>commandLines.some(p=>pattern.test(String(p?.CommandLine||'')))
 const managedFor=id=>[...processes.entries()].find(([,p])=>p.tool===id&&p.active)
 const kernelPid=listeningPid(3001)
 const apiPid=listeningPid(8000)
 const qwenPid=listeningPid(8080)
 const qwenVlPid=listeningPid(8081)
 const openJarvisPid=listeningPid(7880)
 const kernelReady=!!kernelPid&&canonicalPortOwner('kernel-x108',kernelPid)
 const apiReady=!!apiPid&&canonicalPortOwner('obsidia-api',apiPid)
 const qwenReady=!!qwenPid&&canonicalPortOwner('qwen-text',qwenPid)
 const qwenVlReady=!!qwenVlPid&&canonicalPortOwner('qwen-vl',qwenVlPid)
 const definitions=[
  {id:'kernel-x108',label:'Kernel X108',ready:kernelReady,evidence:kernelReady?'PORT_3001_CANONICAL_PROCESS':kernelPid?'PORT_3001_FOREIGN_PROCESS':'PORT_3001'},
  {id:'obsidia-api',label:'API Obsidia + Brody + Native Memory',ready:apiReady,evidence:apiReady?'PORT_8000_CANONICAL_PROCESS':apiPid?'PORT_8000_FOREIGN_PROCESS':'PORT_8000'},
  {id:'qwen-text',label:'Qwen texte · :8080',ready:qwenReady,evidence:qwenReady?'PORT_8080_QWEN_PROCESS':qwenPid?'PORT_8080_FOREIGN_PROCESS':'PORT_8080'},
  {id:'qwen-vl',label:'Qwen-VL · :8081',ready:qwenVlReady,evidence:qwenVlReady?'PORT_8081_CANONICAL_PROCESS':qwenVlPid?'PORT_8081_FOREIGN_PROCESS':'PORT_8081'},
  {id:'open-jarvis',label:'Open Jarvis · :7880',ready:!!openJarvisPid,evidence:openJarvisPid?'PORT_7880_OPENJARVIS':'PORT_7880'},
  {id:'gps-defense',label:'GPS / Defense / Aviation',ready:hasProcess(/connectors[\\/]aviation_robo\.py/i),evidence:'PROCESS_AVIATION_ROBO'},
  {id:'trading-x108',label:'Trading → X108',ready:hasProcess(/connectors[\\/]trading_live\.py/i),evidence:'PROCESS_TRADING_LIVE'},
  {id:'brody-enriched',label:'Brody Enriched',ready:hasProcess(/run_brody_terminal_enriched\.ps1/i),evidence:'PROCESS_BRODY_ENRICHED'},
  {id:'obsidure-dry',label:'Obsidure DryRun',ready:commandLines.some(p=>/run_agent_obsidure\.ps1/i.test(String(p?.CommandLine||''))&&/-DryRun\b/i.test(String(p?.CommandLine||''))),evidence:'PROCESS_OBSIDURE_DRY'}
 ]
 const value=definitions.map(s=>{
  const managed=managedFor(s.id)
  return {...s,state:s.ready?'READY':managed?'STARTING':'OFFLINE',managed:!!managed,sessionId:managed?.[0]||null,decisionAuthority:'KX108_ONLY',observedAt:new Date().toISOString()}
 })
 nativeObservationCache={at:now,value}
 return value
}

function jarjarObservedStatus(){
 let listening=''
 try{listening=execFileSync('netstat.exe',['-ano','-p','tcp'],{encoding:'utf8',timeout:4000,windowsHide:true})}catch{}
 const portOpen=port=>new RegExp('127\\.0\\.0\\.1:'+port+'\\s+.*LISTENING','i').test(listening)||new RegExp('0\\.0\\.0\\.0:'+port+'\\s+.*LISTENING','i').test(listening)||new RegExp('\\[::\\]:'+port+'\\s+.*LISTENING','i').test(listening)
 let jarjarProcess=false
 try{
  const ps=execFileSync('powershell.exe',['-NoProfile','-Command',"$self=$PID; $p=Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $self -and $_.CommandLine -match 'scripts[\\\\/.]run_jarjar_live' }; if($p){'1'}else{'0'}"],{encoding:'utf8',timeout:5000,windowsHide:true}).trim()
  jarjarProcess=ps.endsWith('1')
 }catch{}
 const managed=[...processes.entries()].find(([,p])=>p.tool==='jarjar'&&p.active)
 const kernelPid=listeningPid(3001)
 const apiPid=listeningPid(8000)
 const qwenPid=listeningPid(8080)
 const qwenVlPid=listeningPid(8081)
 const components={
  kernel:{port:3001,ready:!!kernelPid&&canonicalPortOwner('kernel-x108',kernelPid)},
  brodyApi:{port:8000,ready:!!apiPid&&canonicalPortOwner('obsidia-api',apiPid)},
  qwenText:{port:8080,ready:!!qwenPid&&canonicalPortOwner('qwen-text',qwenPid)},
  qwenVL:{port:8081,ready:!!qwenVlPid&&canonicalPortOwner('qwen-vl',qwenVlPid)},
  hud:{port:null,ready:jarjarProcess}
 }
 let state='OFFLINE'
 if(jarjarProcess){
  state=(components.kernel.ready&&components.brodyApi.ready&&components.qwenText.ready&&components.qwenVL.ready)?'READY':'DEGRADED'
 }else if(managed){
  state='STARTING'
 }
 let telemetry=null
 try{
  const local=process.env.LOCALAPPDATA||resolve(homedir(),'AppData','Local')
  const path=resolve(local,'Obsidia','jarjar_runtime_status.json')
  if(existsSync(path)){
   const stat=statSync(path)
   if(Date.now()-stat.mtimeMs<10000)telemetry=JSON.parse(readFileSync(path,'utf8'))
  }
 }catch{}
 let qwenTextDiagnostic=''
 try{
  const local=process.env.LOCALAPPDATA||resolve(homedir(),'AppData','Local')
  const log=resolve(local,'Obsidia','jarjar_qwen_text_llama.log')
  if(existsSync(log))qwenTextDiagnostic=readFileSync(log,'utf8').trim().split(/\r?\n/).slice(-8).join('\n')
 }catch{}
 return {
  state,components,managed:!!managed,sessionId:managed?.[0]||null,qwenTextDiagnostic,
  decisionAuthority:telemetry?.decision_authority||'KX108_ONLY',
  inputMode:telemetry?.mode||null,
  hudState:telemetry?.hud_state||null,
  voiceEnabled:telemetry?.voice_enabled??null,
  keyboardAvailable:telemetry?.keyboard_available??true,
  sessionOpen:telemetry?.session_open??null,
  cognitionSource:telemetry?.cognition_source||'',
  governanceSource:telemetry?.governance_source||'',
  governancePhase:telemetry?.governance_phase||'',
  humanConfirmationRequired:telemetry?.human_confirmation_required??false,
  confirmationPrompt:telemetry?.confirmation_prompt||'',
  lastUserInput:telemetry?.last_user_input||'',
  lastResult:telemetry?.last_result||'',
  telemetryFresh:!!telemetry,
  observedAt:new Date().toISOString()
 }
}
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:12*1024*1024,timeout:10000,windowsHide:true}).trim()
function safeJsonFiles(dir,limit=100){
 if(!existsSync(dir))return []
 return readdirSync(dir).filter(x=>x.endsWith('.json')).slice(-limit).flatMap(name=>{try{const p=resolve(dir,name);if(statSync(p).size>2*1024*1024)return [];return [{name,data:JSON.parse(readFileSync(p,'utf8')),observedAt:statSync(p).mtime.toISOString()}]}catch{return []}})
}
export function canonicalRuntimeEvidence(baseOverride=null){
 const local=process.env.LOCALAPPDATA||resolve(homedir(),'AppData','Local'),base=baseOverride||resolve(local,'Obsidia')
 const decisions=safeJsonFiles(resolve(base,'kx108_decisions')).map(({name,data,observedAt})=>({
  file:name,observedAt,decision_record_id:data.decision_record_id,decision_record_hash:data.decision_record_hash,
  decision_phase:data.decision_phase||'POST_EXECUTION',decision_id:data.decision_id,trace_id:data.trace_id,domain:data.domain,
  x108_gate:data.x108_gate,reason_code:data.reason_code,severity:data.severity,market_verdict:data.market_verdict,
  decision_authority:data.decision_authority,agent_id:data.agent_id,action_id:data.action_id,context_packet_id:data.context_packet_id,
  sealed_apply_receipt_id:data.sealed_apply_receipt_id,sealed_apply_receipt_hash:data.sealed_apply_receipt_hash,
  sealed_rollback_evidence_id:data.sealed_rollback_evidence_id,sealed_rollback_evidence_hash:data.sealed_rollback_evidence_hash
 }))
 const receipts=safeJsonFiles(resolve(base,'sealed_receipts')).map(({name,data,observedAt})=>({
  file:name,observedAt,sealed_apply_receipt_id:data.sealed_apply_receipt_id,sealed_apply_receipt_hash:data.sealed_apply_receipt_hash,
  created_at:data.created_at,status:data.status,target_path:data.target_path,target_pre_sha256:data.target_pre_sha256,
  target_post_sha256:data.target_post_sha256,source_content_sha256:data.source_content_sha256,bytes_written:data.bytes_written,
  kx108_pre_decision_record_id:data.kx108_pre_decision_record_id,kx108_pre_decision_record_hash:data.kx108_pre_decision_record_hash,
  sealed_rollback_evidence_id:data.sealed_rollback_evidence_id,sealed_rollback_evidence_hash:data.sealed_rollback_evidence_hash,
  decision_authority:data.decision_authority,realized_state_verified:data.realized_state_verified,pre_state:data.pre_state,post_state:data.post_state,kx108_pre_gate:data.kx108_pre_gate
 }))
 const rollbacks=safeJsonFiles(resolve(base,'sealed_rollback_evidence')).map(({name,data,observedAt})=>({
  file:name,observedAt,sealed_rollback_evidence_id:data.sealed_rollback_evidence_id,sealed_rollback_evidence_hash:data.sealed_rollback_evidence_hash,
  created_at:data.created_at,target_path:data.target_path,pre_write_sha256:data.pre_write_sha256,pre_write_size:data.pre_write_size,
  source_content_sha256:data.source_content_sha256,kx108_pre_decision_record_id:data.kx108_pre_decision_record_id,
  kx108_pre_decision_record_hash:data.kx108_pre_decision_record_hash,decision_authority:data.decision_authority,sealed:data.sealed===true
 }))
 return {decisions,receipts,rollbacks}
}
function sigmaDomains(root){
 try{
  const path=resolve(root,'sigma','registry.py');if(!existsSync(path))return []
  const text=readFileSync(path,'utf8')
  const tuple=text.match(/_CANONICAL_DOMAINS\s*=\s*\(([^)]*)\)/s)?.[1]||''
  const ids=[...tuple.matchAll(/["']([^"']+)["']/g)].map(m=>m[1])
  const displayBlock=text.match(/_DOMAIN_DISPLAY_NAMES[^=]*=\s*\{([\s\S]*?)\n\}/)?.[1]||''
  const displays=Object.fromEntries([...displayBlock.matchAll(/["']([^"']+)["']\s*:\s*["']([^"']+)["']/g)].map(m=>[m[1],m[2]]))
  return ids.map(id=>{
   const sourcePath=`sigma/domains/${id}_agents.py`,agentPath=resolve(root,'sigma','domains',id+'_agents.py'),runtimeFilePresent=existsSync(agentPath)
   let agents=[]
   if(runtimeFilePresent){
    try{const source=readFileSync(agentPath,'utf8');agents=[...source.matchAll(/agent_id\s*=\s*["']([^"']+)["']/g)].map(m=>m[1])}catch{}
   }
   return {id,displayName:displays[id]||id,source:'sigma/registry.py',sourcePath,runtimeFilePresent,agents}
  })
 }catch{return []}
}
function peripheryAgents(root){
 try{
  const registry=resolve(root,'periphery','agent_registry.py');if(!existsSync(registry))return []
  const text=readFileSync(registry,'utf8')
  const block=text.match(/from \.agents import \(([\s\S]*?)\)/)?.[1]||''
  const modules=block.split(',').map(x=>x.trim()).filter(x=>/^[a-zA-Z0-9_]+$/.test(x))
  return modules.flatMap(module=>{try{const source=readFileSync(resolve(root,'periphery','agents',module+'.py'),'utf8');const id=source.match(/agent_id\s*=\s*["']([^"']+)["']/)?.[1];return id?[id]:[]}catch{return []}})
 }catch{return []}
}
function externalRepoCandidates(root,repoName,envPath){
 return [
  envPath,
  resolve(root,'..',repoName),
  resolve(homedir(),'Desktop',repoName),
  resolve(homedir(),'Desktop','OBSIDIA_WORLDS','sources',repoName)
 ].filter(Boolean)
}
function externalFamily(root,name,relativeRepo,agentFile,kind='agents',envPath=null){
 try{
  const candidates=externalRepoCandidates(root,relativeRepo,envPath)
  const repo=candidates.find(p=>existsSync(p))
  if(!repo)return {id:name,label:name,sourceRepo:relativeRepo,localPresent:false,kind,agents:[],sourceCandidates:candidates}
  const file=resolve(repo,agentFile)
  const agents=existsSync(file)?[...readFileSync(file,'utf8').matchAll(/agent_id\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]):[]
  return {id:name,label:name,sourceRepo:relativeRepo,sourceRoot:repo,localPresent:true,kind,agents}
 }catch{return {id:name,label:name,sourceRepo:relativeRepo,localPresent:false,kind,agents:[]}}
}
function agentFamilies(root){
 const sigma=sigmaDomains(root).map(d=>({id:'sigma:'+d.id,label:d.displayName,sourceRepo:'obsidia-x108-proofs',sourcePath:d.sourcePath,localPresent:d.runtimeFilePresent,kind:'sigma',agents:d.agents}))
 const periphery=peripheryAgents(root)
 const families=[...sigma,{id:'periphery',label:'Périphérie non souveraine',sourceRepo:'obsidia-x108-proofs',sourcePath:'periphery/agent_registry.py',localPresent:periphery.length>0,kind:'periphery',agents:periphery}]
 const trading=externalFamily(root,'trading-native','OBSIDIA_TRADING','native/agents/domains/trading_agents.py','external-runtime',process.env.OBSIDIA_TRADING_ROOT)
 trading.label='Trading native reference'
 families.push(trading)
 const gpsCandidates=externalRepoCandidates(root,'obsidia-gps-defense-',process.env.OBSIDIA_GPS_ROOT)
 const gpsRoot=gpsCandidates.find(p=>existsSync(p))
 families.push({id:'gps-physical',label:'GPS / Defense / Physical Signal',sourceRepo:'obsidia-gps-defense-',sourceRoot:gpsRoot||null,sourceCandidates:gpsRoot?undefined:gpsCandidates,sourcePath:'evidence-pipeline/',localPresent:!!gpsRoot,kind:'physical-workstream',agents:[]})
 return families
}
export function gitWorktrees(root){
 try{
  const raw=git(root,'worktree','list','--porcelain'),blocks=raw.split(/\n\s*\n/).filter(Boolean)
  return blocks.map(block=>{
   const lines=block.split('\n'),worktree=lines.find(x=>x.startsWith('worktree '))?.slice(9)||'',head=lines.find(x=>x.startsWith('HEAD '))?.slice(5)||'',branchRef=lines.find(x=>x.startsWith('branch '))?.slice(7)||''
   const branch=branchRef.replace(/^refs\/heads\//,'')||'(detached)'
   let dirty=false;try{dirty=git(worktree,'status','--porcelain').length>0}catch{}
   return {path:worktree,branch,head,dirty}
  })
 }catch{return []}
}
let snapshotCache={root:null,at:0,value:null}
function snapshot(root=repository()){
 const now=Date.now()
 if(snapshotCache.value&&snapshotCache.root===root&&now-snapshotCache.at<3000)return snapshotCache.value
 if(!existsSync(root)){
  const value={available:false,error:'Copie locale du dépôt non trouvée',observedAt:new Date(now).toISOString(),files:[],proposals:[],tools:[]}
  snapshotCache={root,at:now,value}
  return value
 }
 const sha=git(root,'rev-parse','HEAD'),branch=git(root,'branch','--show-current');
 const files=git(root,'ls-files').split('\n').filter(p=>/\.(md|json|jsonl|ya?ml|py|tsx?|ps1|lean)$/.test(p)&&!p.startsWith('.')&&!/(^|\/)(secrets|audit\/local|node_modules)\//.test(p)&&!/(^|\/)(credentials|tokens?)\./i.test(p));
 let proposals=[];const dir=resolve(root,'_PATCH_PROPOSALS');if(existsSync(dir)){
  for(const item of readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).slice(-100)){
   try{const p=contained(root,`_PATCH_PROPOSALS/${item.name}/proposal.json`);if(statSync(p).size>1024*1024)continue;const data=JSON.parse(readFileSync(p,'utf8'));proposals.push({id:item.name,path:`_PATCH_PROPOSALS/${item.name}/proposal.json`,data,observedAt:statSync(p).mtime.toISOString(),receipt:existsSync(resolve(dir,item.name,'RECEIPT.md'))?`_PATCH_PROPOSALS/${item.name}/RECEIPT.md`:null})}catch{}
  }
 }
 const value={available:true,repository:root,sha,branch,worktrees:gitWorktrees(root),observedAt:new Date(now).toISOString(),files,proposals,sigmaDomains:sigmaDomains(root),agentFamilies:agentFamilies(root),runtimeEvidence:canonicalRuntimeEvidence(),agentSources:files.filter(p=>/^(agents\/prompts\/.*\.md|periphery\/agents\/[^/]+\.py)$/.test(p)),tools:[...Object.entries(launchers).map(([id,path])=>({id,path,available:existsSync(resolve(root,path))&&process.platform==='win32',reason:process.platform!=='win32'?'Terminal Windows requis':!existsSync(resolve(root,path))?'Point d’entrée absent':null})),{id:'jarjar',path:jarjarModule,available:process.platform==='win32'&&existsSync(jarjarRoot())&&existsSync(resolve(jarjarRoot(),jarjarModuleFile))&&existsSync(jarjarPython()),reason:process.platform!=='win32'?'Windows requis':!existsSync(jarjarRoot())?'Repo Jarjar absent':!existsSync(resolve(jarjarRoot(),jarjarModuleFile))?'Launcher Jarjar absent':!existsSync(jarjarPython())?'Python Jarjar canonique absent':null}]}
 snapshotCache={root,at:now,value}
 return value
}
const processes=new Map(),launching=new Set();

function listeningPid(port){
 try{
  const raw=execFileSync('netstat.exe',['-ano','-p','tcp'],{encoding:'utf8',timeout:4000,windowsHide:true})
  for(const line of raw.split(/\r?\n/)){
   if(!line.includes('LISTENING'))continue
   const parts=line.trim().split(/\s+/)
   if(parts.length<5)continue
   const local=parts[1]||''
   if(local.endsWith(':'+port)){
    const pid=Number(parts.at(-1))
    if(Number.isSafeInteger(pid)&&pid>0)return pid
   }
  }
 }catch{}
 return null
}
function processCommandLine(pid){
 try{
  const ps=`$p=Get-CimInstance Win32_Process -Filter "ProcessId = ${Number(pid)}"; if($p){$p.CommandLine}`
  return execFileSync('powershell.exe',['-NoProfile','-Command',ps],{encoding:'utf8',timeout:5000,windowsHide:true}).trim()
 }catch{return ''}
}
function canonicalPortOwner(id,pid){
 const line=processCommandLine(pid)
 if(!line)return false
 if(id==='kernel-x108')return /server\.kernel\.sealed\.cjs/i.test(line)
 if(id==='obsidia-api')return /uvicorn/i.test(line)&&/apps\.obsidia_api\.main:app/i.test(line)
 if(id==='qwen-text')return /llama-server(?:\.exe)?/i.test(line)&&/(?:qwen|qwen2\.5-3b-instruct-q4_k_m\.gguf)/i.test(line)
 if(id==='qwen-vl')return /llama-server(?:\.exe)?/i.test(line)&&/(?:--port\s+|--port=)8081\b/i.test(line)
 return false
}
async function canonicalApiEndpoint(){
 try{
  const r=await fetch('http://127.0.0.1:8000/',{signal:AbortSignal.timeout(1500)})
  if(!r.ok)return false
  const d=await r.json()
  return d?.service==='obsidia-api'
 }catch{return false}
}
async function canonicalSigmaMonitoringStatus(){
 try{
  const headers={}
  if(process.env.OBSIDIA_API_KEY)headers['X-API-Key']=process.env.OBSIDIA_API_KEY
  const route='/api/periphery/monitoring/sigma/domains'
  const r=await fetch('http://127.0.0.1:8000'+route,{headers,signal:AbortSignal.timeout(1500)})
  if(!r.ok)return {ready:false,evidence:'SIGMA_ROUTE_HTTP_'+r.status,route}
  const d=await r.json()
  const domains=Array.isArray(d?.domains)?d.domains:[]
  const canonical=['bank','trading','ecom','gps_defense_aviation']
  const domainIds=domains.map(x=>typeof x==='string'?x:x?.id||x?.domain).filter(Boolean)
  const boundaryOk=d?.decision_authority==='KX108_ONLY'&&d?.readonly===true&&d?.emits_act===false&&d?.kernel_mutation===false
  const domainsOk=canonical.every(x=>domainIds.includes(x))
  const routeOk=d?.route===route
  const ready=boundaryOk&&domainsOk&&routeOk
  return {ready,evidence:ready?'SIGMA_F63_DOMAINS_ROUTE_VERIFIED':'SIGMA_F63_ROUTE_INVALID_PAYLOAD',route,domainIds}
 }catch{return {ready:false,evidence:'SIGMA_F63_ROUTE_UNREACHABLE',route:'/api/periphery/monitoring/sigma/domains'}}
}
async function releaseFrozenServicePort(id){
 const port=id==='kernel-x108'?3001:id==='obsidia-api'?8000:null
 if(!port)return

 if(id==='obsidia-api'){
  closeOwnedBrodyApi()
  const gracefulDeadline=Date.now()+2500
  while(Date.now()<gracefulDeadline){
   await new Promise(r=>setTimeout(r,120))
   if(!listeningPid(port))return
  }
 }

 let pid=listeningPid(port)
 if(!pid)return
 const recognized=id==='obsidia-api'?(await canonicalApiEndpoint()||canonicalPortOwner(id,pid)):canonicalPortOwner(id,pid)
 if(!recognized)throw Error(`Port ${port} déjà occupé par un processus non reconnu. Aucun arrêt automatique effectué.`)
 try{
  execFileSync('taskkill.exe',['/PID',String(pid),'/T','/F'],{encoding:'utf8',timeout:10000,windowsHide:true})
 }catch{
  if(!listeningPid(port))return
  throw Error(`Impossible d'arrêter l'ancienne instance Obsidia sur le port ${port}.`)
 }
 const deadline=Date.now()+5000
 while(Date.now()<deadline){
  await new Promise(r=>setTimeout(r,120))
  pid=listeningPid(port)
  if(!pid)return
 }
 throw Error(`Le processus Obsidia précédent sur le port ${port} ne s'est pas arrêté.`)
}
async function waitLocalPort(port,label,timeoutMs=20000){
 const deadline=Date.now()+timeoutMs
 while(Date.now()<deadline){
  if(listeningPid(port))return
  await new Promise(r=>setTimeout(r,250))
 }
 throw Error(label+' non prêt sur le port '+port)
}
async function ensureJarjarPrerequisite(id,root){
 const port=id==='kernel-x108'?3001:id==='obsidia-api'?8000:null
 if(!port)throw Error('Pré-requis Jarjar inconnu : '+id)
 const existingPid=listeningPid(port)
 if(existingPid){
  const recognized=id==='obsidia-api'?(canonicalPortOwner(id,existingPid)||await canonicalApiEndpoint()):canonicalPortOwner(id,existingPid)
  if(!recognized)throw Error(`Pré-requis Jarjar refusé : port ${port} occupé par un processus non canonique.`)
  return {reused:true,port,pid:existingPid}
 }

 for(const [session,p] of processes){
  if(p.active&&p.native&&p.tool===id&&!await terminalAlive(p.pid)){p.active=false;markEnd(session,'Terminal Windows fermé')}
  if(p.active&&p.native&&p.tool===id){
   await waitLocalPort(port,id,20000)
   return {reused:true,port,sessionId:session}
  }
 }

 const spec=nativeServiceSpec(id,root)
 if(!spec)throw Error('Service pré-requis non raccordé : '+id)
 const session=randomUUID(),title='OBSIDIA · '+spec.title+' · '+session.slice(0,8)
 emitNativeService(session,id,spec.title,root)
 const command=`$host.UI.RawUI.WindowTitle='${title.replaceAll("'","''")}'; ${spec.command}`
 const pid=await launchTerminal(command)
 processes.set(session,{pid,active:true,output:'',exitCode:null,native:true,surface:'terminal',tool:id,title})
 await waitLocalPort(port,id,20000)
 return {opened:true,port,sessionId:session,pid}
}

function markEnd(id,message){try{const log=resolve(liveDirectory,id+'.jsonl'),last=JSON.parse(readFileSync(log,'utf8').trim().split('\n').at(-1));if(last.kind!=='session_end')appendFileSync(log,JSON.stringify({...last,timestamp:new Date().toISOString(),kind:'session_end',phase:'PROCESS_EXIT',status:'error',exitCode:null,message})+'\n')}catch{}}

async function awaitObserver(id,p){
 const deadline=Date.now()+7000;
 while(Date.now()<deadline){
  const path=resolve(liveDirectory,id+'.jsonl');
  if(existsSync(path)){
   await new Promise(r=>setTimeout(r,150));
   const last=liveSnapshot().sessions.find(s=>s.sessionId===id);
   if(last?.presence==='ended'&&last.exitCode)throw Error('Le programme a échoué au démarrage. '+(p.native?readFileSync(resolve(liveDirectory,id+'.console.txt'),'utf8').slice(-4000):p.output));
   return;
  }
  if(!p.active)throw Error('Le programme n’a pas démarré. '+p.output);
  await new Promise(r=>setTimeout(r,100));
 }
 throw Error('Le terminal a été demandé, mais aucun signal Python n’est arrivé. Vérifie la fenêtre Windows et la commande Python.');
}
async function startInterfaceChild(session,p){
 const child=spawn(pythonFor(p.root),p.args,{cwd:p.root,stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,PYTHONUNBUFFERED:'1',PYTHONIOENCODING:'utf-8'}})
 p.child=child
 p.active=true
 p.exitCode=null
 const append=chunk=>{p.output=(p.output+chunk.toString('utf8')).slice(-32000)}
 child.stdout.on('data',append)
 child.stderr.on('data',append)
 child.stdin.on('error',e=>append('Entrée du processus fermée : '+e.message))
 child.on('error',e=>{p.active=false;append('Erreur de lancement : '+e.message)})
 child.on('close',code=>{
  p.active=false
  p.exitCode=code
  try{
   const log=resolve(liveDirectory,session+'.jsonl')
   const lines=readFileSync(log,'utf8').trim().split('\n')
   const last=JSON.parse(lines.at(-1))
   if(last.kind!=='session_end')appendFileSync(log,JSON.stringify({...last,timestamp:new Date().toISOString(),kind:'session_end',phase:'PROCESS_EXIT',status:'error',exitCode:code,message:'Processus interrompu'})+'\n')
  }catch{}
  if(!p.stopRequested&&!p.native&&p.surface==='interface'){
   const delay=Math.min(5000,500+(p.restartCount||0)*500)
   p.restartCount=(p.restartCount||0)+1
   p.restartTimer=setTimeout(()=>{
    if(p.stopRequested)return
    startInterfaceChild(session,p).catch(e=>append('Relance interface échouée : '+e.message))
   },delay)
  }
 })
 await new Promise((ok,no)=>{child.once('spawn',ok);child.once('error',no)})
 return child
}

async function body(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>8192)throw Error('Requête trop grande')}return value?JSON.parse(value):{}}
export function localBridge(){return {name:'obsidia-local-bridge',configureServer(server){server.httpServer?.once('close',()=>{closeOwnedBrodyApi();for(const p of processes.values())if(!p.native){p.stopRequested=true;if(p.restartTimer)clearTimeout(p.restartTimer);if(p.active)p.child.kill()}});server.middlewares.use('/obsidia-local',async(req,res)=>{
 let launchKey;
 const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 try{
 if(req.method==='GET'&&url.pathname==='/services'){res.end(JSON.stringify({brody:await brodyServiceStatus()}));return}
 if(req.method==='GET'&&url.pathname==='/jarjar/status'){res.end(JSON.stringify(jarjarObservedStatus()));return}
 if(req.method==='POST'&&url.pathname==='/jarjar/stop'){
  if(req.headers.origin!==`http://${req.headers.host}`)throw Error('Origine refusée')
  const managed=[...processes.entries()].find(([,p])=>p.tool==='jarjar'&&p.active)
  if(!managed)throw Error('Aucun Jarjar lancé par Monde à arrêter')
  const [session,p]=managed
  if(p.native){await stopTerminal(p.pid);p.active=false;markEnd(session,'Jarjar arrêté depuis Monde')}else p.child.kill()
  res.end(JSON.stringify({ok:true,sessionId:session,state:'OFFLINE'}));return
 }
 if(req.method==='GET'&&url.pathname==='/processes'){await Promise.all([...processes.entries()].filter(([,p])=>p.native&&p.active).map(async ([id,p])=>{p.active=await terminalAlive(p.pid);if(!p.active)markEnd(id,'Terminal Windows fermé')}));res.end(JSON.stringify({processes:[...processes.entries()].map(([id,p])=>({sessionId:id,active:p.active,runtimeActive:p.active&&liveSnapshot().sessions.find(s=>s.sessionId===id)?.presence!=='ended',exitCode:p.exitCode,native:!!p.native,tool:p.tool,surface:p.surface||(p.native?'terminal':'interface'),title:p.title,output:p.native&&existsSync(resolve(liveDirectory,id+'.console.txt'))?readFileSync(resolve(liveDirectory,id+'.console.txt'),'utf8').slice(-32000):p.output}))}));return}
 if(req.method==='POST'&&(url.pathname==='/run'||url.pathname.startsWith('/input/')||url.pathname.startsWith('/stop/')||url.pathname.startsWith('/focus/'))){
 if(req.headers.origin!==`http://${req.headers.host}`)throw Error('Origine refusée');
 const data=await body(req);
 if(url.pathname!=='/run'){
 const id=url.pathname.split('/').pop(),p=processes.get(id);if(!p?.active)throw Error('Session arrêtée ou non gérée');
 if(url.pathname.startsWith('/focus/')){if(!p.native)throw Error('Session intégrée : son terminal est dans la page');try{await focusTerminal(p.title,p.pid)}catch{} }else if(url.pathname.startsWith('/stop/')){if(p.native){await stopTerminal(p.pid);p.active=false;markEnd(id,'Terminal fermé depuis la page')}else{p.stopRequested=true;if(p.restartTimer)clearTimeout(p.restartTimer);p.child.kill()}}else{if(p.native)throw Error('Saisis ta demande dans le terminal Windows');if(liveSnapshot().sessions.find(s=>s.sessionId===id)?.phase!=='WAITING_INPUT')throw Error('Ce processus n’attend pas de saisie');if(typeof data.text!=='string'||data.text.length>4096||/[\r\n]/.test(data.text))throw Error('Saisie invalide');await new Promise((ok,no)=>p.child.stdin.write(data.text+'\n',e=>e?no(e):ok()))}
 res.end(JSON.stringify({ok:true}));return
 }
 const tool=data.tool||'obsidure';if(!['obsidure','brody','cli'].includes(tool))throw Error('Outil inconnu');const mode=data.mode;if(!['audit','audit-long','interactive'].includes(mode)|| (tool!=='obsidure'&&mode!=='interactive'))throw Error('Mission inconnue');
 if([...processes.entries()].some(([sid,p])=>p.active&&!p.native&&p.tool===tool&&liveSnapshot().sessions.find(s=>s.sessionId===sid)?.presence!=='ended'))throw Error('Une session interface est déjà en cours : arrête-la ou attends sa fin');
 const interfaceLaunchKey='interface:'+tool;
 if(launching.has(interfaceLaunchKey))throw Error('Cette session interface est déjà en cours de lancement');launchKey=interfaceLaunchKey;launching.add(interfaceLaunchKey);
 const root=realpathSync(repository());const session=randomUUID();
 contained(root,launchers[tool]);
 const args=[observer,'--repo',root,'--output',liveDirectory,'--agent',tool,'--session',session,'--surface','interface'];
 if(mode!=='interactive')args.push('--audit','--audit-cycles',mode==='audit-long'?'20':'1','--audit-interval',mode==='audit-long'?'4':'0');
 const p={child:null,active:false,output:'',exitCode:null,tool,native:false,surface:'interface',root,args,stopRequested:false,restartCount:0,restartTimer:null};processes.set(session,p);
 await startInterfaceChild(session,p);
 for(const [id,v] of processes)if(processes.size>50&&!v.active)processes.delete(id);
 await awaitObserver(session,p);res.end(JSON.stringify({sessionId:session,started:true}));return
 }
 if(req.method==='GET'&&url.pathname==='/cli-runtime'){
  const services=nativeServicesObservedStatus()
  const byId=id=>services.find(s=>s.id===id)
  const root=repository()
  const nativeMemoryCandidates=[
   resolve(root,'_obsidia_native_memory','OBSIDIA_NATIVE_MEMORY_INDEX_V1'),
   resolve(root,'runtime_terrain_bank_trading_gps','_obsidia_native_memory','OBSIDIA_NATIVE_MEMORY_INDEX_V1')
  ]
  const nativeMemoryReady=nativeMemoryCandidates.some(p=>existsSync(p))
  const api=byId('obsidia-api'),kernel=byId('kernel-x108')
  const sigmaProbe=api?.ready?await canonicalSigmaMonitoringStatus():{ready:false,evidence:'API_8000_OFFLINE',route:'/api/periphery/monitoring/sigma/domains'}
  const sigmaState=sigmaProbe.ready?'READY':api?.ready?'ROUTE_UNVERIFIED':'OFFLINE'
  const state=(api?.ready&&kernel?.ready&&nativeMemoryReady)?'READY':'DEGRADED'
  res.end(JSON.stringify({
   schema:'MONDE_CLI_RUNTIME_PROJECTION_V1',
   readonly:true,
   canonicalTruth:false,
   decisionAuthority:'KX108_ONLY',
   state,
   services:[
    {id:'kernel',label:'Kernel X108',status:kernel?.state||'OFFLINE',evidence:kernel?.evidence||'PORT_3001'},
    {id:'api',label:'API Obsidia / Brody',status:api?.state||'OFFLINE',evidence:api?.evidence||'PORT_8000'},
    {id:'sigma',label:'Sigma / domaines',status:sigmaState,evidence:sigmaProbe.evidence,route:sigmaProbe.route},
    {id:'native-memory',label:'Native Memory',status:nativeMemoryReady?'READY':'NOT_OBSERVED',evidence:'LOCAL_NATIVE_MEMORY_INDEX'}
   ],
   legacy:{graphiti:'HISTORICAL_NOT_ACTIVE',neo4j:'HISTORICAL_NOT_ACTIVE',ui5173:'LEGACY_SURFACE_NOT_MONDE'},
   observedAt:new Date().toISOString()
  }));return
 }
 if(req.method==='GET'&&url.pathname==='/state'){
 const snap=snapshot(),live=liveSnapshot()
 live.sessions=(live.sessions||[]).map(s=>{
  const p=processes.get(s.sessionId)
  return p?{...s,surface:p.surface||(p.native?'terminal':'interface'),nativeTerminal:!!p.native}:s
 })
 live.jarjar=jarjarObservedStatus();live.nativeServices=nativeServicesObservedStatus()
 res.end(JSON.stringify(buildObsidiaState(snap,live)));return
}
 if(req.method==='GET'&&url.pathname==='/live'){res.end(JSON.stringify(liveSnapshot()));return}
 if(req.method==='GET'&&url.pathname==='/reports'){
 const reports=existsSync(liveDirectory)?readdirSync(liveDirectory).filter(f=>/^[a-zA-Z0-9-]+\.report\.json$/.test(f)).slice(-100).flatMap(f=>{try{return [JSON.parse(readFileSync(resolve(liveDirectory,f),'utf8'))]}catch{return []}}):[];res.end(JSON.stringify({reports}));return
 }
 if(req.method==='GET'&&url.pathname==='/snapshot'){res.end(JSON.stringify(snapshot()));return}
 if(req.method==='GET'&&url.pathname==='/file'){
 const s=snapshot(),path=url.searchParams.get('path');const extra=s.proposals.flatMap(p=>[p.path,p.receipt]).filter(Boolean);if(!s.files.includes(path)&&!extra.includes(path))throw Error('Fichier non exposé');const p=contained(repository(),path);if(statSync(p).size>1024*1024)throw Error('Fichier trop grand');res.end(JSON.stringify({path,content:readFileSync(p,'utf8')}));return
 }
 if(req.method==='POST'&&url.pathname.startsWith('/open/')){
 const origin=req.headers.origin;if(origin!==`http://${req.headers.host}`)throw Error('Origine refusée');if(process.platform!=='win32')throw Error('Ouverture native disponible sur le fixe Windows');
 const id=url.pathname.split('/').pop();
 if(nativeServiceIds.has(id)){
  if(launching.has(id))throw Error('Ce service est déjà en cours de lancement');launchKey=id;launching.add(id)
  const root=realpathSync(repository()),spec=nativeServiceSpec(id,root)
  if(!spec)throw Error('Service non raccordé')
  for(const [session,p] of processes){
   if(p.active&&p.native&&p.tool===id&&!await terminalAlive(p.pid)){p.active=false;markEnd(session,'Terminal Windows fermé')}
   if(p.active&&p.tool===id){try{await focusTerminal(p.title,p.pid)}catch{}res.end(JSON.stringify({opened:true,reused:true,tool:id,sessionId:session}));return}
  }
  if(id==='obsidia-api')await releaseFrozenServicePort(id)
  const session=randomUUID(),title='OBSIDIA · '+spec.title+' · '+session.slice(0,8)
  emitNativeService(session,id,spec.title,root)
  const command=`$host.UI.RawUI.WindowTitle='${title.replaceAll("'","''")}'; ${spec.command}`
  const pid=await launchTerminal(command)
  const p={pid,active:true,output:'',exitCode:null,native:true,surface:'terminal',tool:id,title};processes.set(session,p)
  res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid}));return
 }
 if(id==='jarjar'){
  if(launching.has(id))throw Error('Jarjar est déjà en cours de lancement');launchKey=id;launching.add(id)
  const root=realpathSync(repository())
  await ensureJarjarPrerequisite('kernel-x108',root)
  await ensureJarjarPrerequisite('obsidia-api',root)
  const jr=jarjarRoot()
  if(!existsSync(jr))throw Error('Repo Jarjar absent. Candidats : '+jarjarRootCandidates().join(' | '))
  if(!existsSync(resolve(jr,jarjarModuleFile)))throw Error('Launcher Jarjar absent : '+resolve(jr,jarjarModuleFile))
  if(!existsSync(jarjarPython()))throw Error('Python Jarjar validé absent. Candidats : '+jarjarPythonCandidates().join(' | '))
  const master=resolve(projectRoot,'scripts','start-jarjar-full.ps1')
  if(!existsSync(master))throw Error('Launcher maître Jarjar absent : '+master)
  const session=randomUUID(),title='OBSIDIA · JARJAR FULL · '+session.slice(0,8)
  const command=`$host.UI.RawUI.WindowTitle='${title}'; & '${master.replaceAll("'","''")}'; Write-Host 'Ce terminal reste ouvert.'`
  const pid=await launchTerminal(command)
  const p={pid,active:true,output:'',exitCode:null,native:true,surface:'terminal',tool:id,title};processes.set(session,p)
  res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid,repository:jr,launcher:master}));return
 }
 const file=launchers[id];if(!file)throw Error('Outil non raccordé');const terminalLaunchKey='terminal:'+id;if(launching.has(terminalLaunchKey))throw Error('Ce terminal est déjà en cours de lancement');launchKey=terminalLaunchKey;launching.add(terminalLaunchKey);const root=realpathSync(repository());contained(root,file);
 for(const [session,p] of processes){
  if(p.active&&p.native&&p.tool===id&&!await terminalAlive(p.pid)){p.active=false;markEnd(session,'Terminal Windows fermé')}
  if(p.active&&p.native&&p.tool===id){
   const live=liveSnapshot().sessions.find(s=>s.sessionId===session);if(live?.presence==='ended')continue
   try{await focusTerminal(p.title,p.pid)}catch{}res.end(JSON.stringify({opened:true,reused:true,tool:id,sessionId:session}));return
  }
 }
 const wrapper=observer,session=randomUUID(),title='OBSIDIA · '+id+' · '+session.slice(0,8);
 const pythonArgs=[wrapper,'--repo',root,'--output',liveDirectory,'--agent',id,'--session',session,'--surface','terminal'];
 const command=terminalCommand(root,title,pythonFor(root),pythonArgs);
 const pid=await launchTerminal(command);
 const p={pid,active:true,output:'',exitCode:null,native:true,surface:'terminal',tool:id,title};processes.set(session,p);await awaitObserver(session,p);res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid}));return
 }
 res.statusCode=404;res.end(JSON.stringify({error:'Route inconnue'}))
 }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}finally{if(launchKey)launching.delete(launchKey)}
 })}}}
