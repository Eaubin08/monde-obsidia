import {brodyServiceStatus,ensureBrodyApi,closeOwnedBrodyApi} from './brody-service.mjs'
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
const nativeServiceIds=new Set(['kernel-x108','obsidia-api','gps-defense','trading-x108','brody-enriched','obsidure-dry'])
function nativeServiceSpec(id,root){
 const q=s=>"'" + String(s).replaceAll("'","''") + "'"
 const rt=resolve(root,'runtime_terrain_bank_trading_gps')
 const api='http://127.0.0.1:8000'
 const specs={
  'kernel-x108':{
   title:'KERNEL X108 - 3001',
   command:`Set-Location -LiteralPath ${q(rt)}; node .\\server.kernel.sealed.cjs`
  },
  'obsidia-api':{
   title:'OBSIDIA API + BRODY + NATIVE MEMORY - 8000',
   command:`Set-Location -LiteralPath ${q(root)}; $env:PYTHONPATH=${q(root)}; $env:OBSIDIA_KERNEL_URL='http://127.0.0.1:3001/kernel/ragnarok'; python -m uvicorn apps.obsidia_api.main:app --host 127.0.0.1 --port 8000`
  },
  'gps-defense':{
   title:'GPS DEFENSE AVIATION',
   command:`Set-Location -LiteralPath ${q(root)}; $env:PYTHONPATH=${q(root)}; $env:OBSIDIA_API_BASE='${api}'; python .\\connectors\\aviation_robo.py`
  },
  'trading-x108':{
   title:'TRADING -> X108',
   command:`Set-Location -LiteralPath ${q(root)}; $env:PYTHONPATH=${q(root)}; $env:OBSIDIA_API_BASE='${api}'; python .\\connectors\\trading_live.py`
  },
  'brody-enriched':{
   title:'BRODY ENRICHED',
   command:`Set-Location -LiteralPath ${q(root)}; .\\scripts\\run_brody_terminal_enriched.ps1 -Base '${api}'`
  },
  'obsidure-dry':{
   title:'OBSIDURE',
   command:`Set-Location -LiteralPath ${q(root)}; .\\scripts\\run_agent_obsidure.ps1 -DryRun`
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
 'C:\\Users\\User\\Desktop\\Jarvis-iron-obsidia-',
 resolve(homedir(),'Desktop','Jarvis-iron-obsidia-'),
 'C:\\Users\\Aubin\\Desktop\\Jarvis-iron-obsidia-'
].filter(Boolean)
const jarjarRoot=()=>jarjarRootCandidates().find(p=>existsSync(p))||jarjarRootCandidates()[0]
const jarjarPythonCandidates=()=>[
 process.env.OBSIDIA_JARJAR_PYTHON,
 'C:\\Users\\User\\.cache\\codex-runtimes\\codex-primary-runtime\\dependencies\\python\\python.exe',
 resolve(homedir(),'.cache','codex-runtimes','codex-primary-runtime','dependencies','python','python.exe'),
 resolve(jarjarRoot(),'.venv','Scripts','python.exe')
].filter(Boolean)
const jarjarPython=()=>jarjarPythonCandidates().find(p=>existsSync(p))||jarjarPythonCandidates()[0]
const jarjarModule='scripts.run_jarjar_live'
const jarjarModuleFile='scripts/run_jarjar_live.py'
function emitJarjar(session,kind,fields={}){
 mkdirSync(liveDirectory,{recursive:true})
 const event={schema:'OBSIDIA_VISUAL_EVENT_V1',sessionId:session,agentId:'jarjar',name:'Jarjar',repository:jarjarRoot(),timestamp:new Date().toISOString(),kind,status:'thinking',phase:'STARTING',message:'Jarjar runtime',objective:null,...fields}
 appendFileSync(resolve(liveDirectory,session+'.jsonl'),JSON.stringify(event)+'\n')
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
function externalFamily(root,name,relativeRepo,agentFile,kind='agents'){
 try{
  const repo=resolve(root,'..',relativeRepo)
  if(!existsSync(repo))return {id:name,label:name,sourceRepo:relativeRepo,localPresent:false,kind,agents:[]}
  const file=resolve(repo,agentFile)
  const agents=existsSync(file)?[...readFileSync(file,'utf8').matchAll(/agent_id\s*=\s*["']([^"']+)["']/g)].map(m=>m[1]):[]
  return {id:name,label:name,sourceRepo:relativeRepo,localPresent:true,kind,agents}
 }catch{return {id:name,label:name,sourceRepo:relativeRepo,localPresent:false,kind,agents:[]}}
}
function agentFamilies(root){
 const sigma=sigmaDomains(root).map(d=>({id:'sigma:'+d.id,label:d.displayName,sourceRepo:'obsidia-x108-proofs',sourcePath:d.sourcePath,localPresent:d.runtimeFilePresent,kind:'sigma',agents:d.agents}))
 const periphery=peripheryAgents(root)
 const families=[...sigma,{id:'periphery',label:'Périphérie non souveraine',sourceRepo:'obsidia-x108-proofs',sourcePath:'periphery/agent_registry.py',localPresent:periphery.length>0,kind:'periphery',agents:periphery}]
 const trading=externalFamily(root,'trading-native','OBSIDIA_TRADING','native/agents/domains/trading_agents.py','external-runtime')
 trading.label='Trading native reference'
 families.push(trading)
 const gpsRoot=resolve(root,'..','obsidia-gps-defense-')
 families.push({id:'gps-physical',label:'GPS / Defense / Physical Signal',sourceRepo:'obsidia-gps-defense-',sourcePath:'evidence-pipeline/',localPresent:existsSync(gpsRoot),kind:'physical-workstream',agents:[]})
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
function snapshot(root=repository()){
 if(!existsSync(root))return {available:false,error:'Copie locale du dépôt non trouvée',observedAt:new Date().toISOString(),files:[],proposals:[],tools:[]}
 const sha=git(root,'rev-parse','HEAD'),branch=git(root,'branch','--show-current');
 const files=git(root,'ls-files').split('\n').filter(p=>/\.(md|json|jsonl|ya?ml|py|tsx?|ps1|lean)$/.test(p)&&!p.startsWith('.')&&!/(^|\/)(secrets|audit\/local|node_modules)\//.test(p)&&!/(^|\/)(credentials|tokens?)\./i.test(p));
 let proposals=[];const dir=resolve(root,'_PATCH_PROPOSALS');if(existsSync(dir)){
  for(const item of readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).slice(-100)){
   try{const p=contained(root,`_PATCH_PROPOSALS/${item.name}/proposal.json`);if(statSync(p).size>1024*1024)continue;const data=JSON.parse(readFileSync(p,'utf8'));proposals.push({id:item.name,path:`_PATCH_PROPOSALS/${item.name}/proposal.json`,data,observedAt:statSync(p).mtime.toISOString(),receipt:existsSync(resolve(dir,item.name,'RECEIPT.md'))?`_PATCH_PROPOSALS/${item.name}/RECEIPT.md`:null})}catch{}
  }
 }
 return {available:true,repository:root,sha,branch,worktrees:gitWorktrees(root),observedAt:new Date().toISOString(),files,proposals,sigmaDomains:sigmaDomains(root),agentFamilies:agentFamilies(root),runtimeEvidence:canonicalRuntimeEvidence(),agentSources:files.filter(p=>/^(agents\/prompts\/.*\.md|periphery\/agents\/[^/]+\.py)$/.test(p)),tools:[...Object.entries(launchers).map(([id,path])=>({id,path,available:existsSync(resolve(root,path))&&process.platform==='win32',reason:process.platform!=='win32'?'Terminal Windows requis':!existsSync(resolve(root,path))?'Point d’entrée absent':null})),{id:'jarjar',path:jarjarModule,available:process.platform==='win32'&&existsSync(jarjarRoot())&&existsSync(resolve(jarjarRoot(),jarjarModuleFile))&&existsSync(jarjarPython()),reason:process.platform!=='win32'?'Windows requis':!existsSync(jarjarRoot())?'Repo Jarjar absent':!existsSync(resolve(jarjarRoot(),jarjarModuleFile))?'Launcher Jarjar absent':!existsSync(jarjarPython())?'Python Jarjar canonique absent':null}]}
}
const processes=new Map(),launching=new Set();
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
async function body(req){let value='';for await(const chunk of req){value+=chunk;if(value.length>8192)throw Error('Requête trop grande')}return value?JSON.parse(value):{}}
export function localBridge(){return {name:'obsidia-local-bridge',configureServer(server){server.httpServer?.once('close',()=>{closeOwnedBrodyApi();for(const p of processes.values())if(p.active&&!p.native)p.child.kill()});server.middlewares.use('/obsidia-local',async(req,res)=>{
 let launchKey;
 const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 try{
 if(req.method==='GET'&&url.pathname==='/services'){res.end(JSON.stringify({brody:await brodyServiceStatus()}));return}
 if(req.method==='GET'&&url.pathname==='/processes'){await Promise.all([...processes.entries()].filter(([,p])=>p.native&&p.active).map(async ([id,p])=>{p.active=await terminalAlive(p.pid);if(!p.active)markEnd(id,'Terminal Windows fermé')}));res.end(JSON.stringify({processes:[...processes.entries()].map(([id,p])=>({sessionId:id,active:p.active,runtimeActive:p.active&&liveSnapshot().sessions.find(s=>s.sessionId===id)?.presence!=='ended',exitCode:p.exitCode,native:!!p.native,tool:p.tool,title:p.title,output:p.native&&existsSync(resolve(liveDirectory,id+'.console.txt'))?readFileSync(resolve(liveDirectory,id+'.console.txt'),'utf8').slice(-32000):p.output}))}));return}
 if(req.method==='POST'&&(url.pathname==='/run'||url.pathname.startsWith('/input/')||url.pathname.startsWith('/stop/')||url.pathname.startsWith('/focus/'))){
 if(req.headers.origin!==`http://${req.headers.host}`)throw Error('Origine refusée');
 const data=await body(req);
 if(url.pathname!=='/run'){
 const id=url.pathname.split('/').pop(),p=processes.get(id);if(!p?.active)throw Error('Session arrêtée ou non gérée');
 if(url.pathname.startsWith('/focus/')){if(!p.native)throw Error('Session intégrée : son terminal est dans la page');await focusTerminal(p.title,p.pid)}else if(url.pathname.startsWith('/stop/')){if(p.native){await stopTerminal(p.pid);p.active=false;markEnd(id,'Terminal fermé depuis la page')}else p.child.kill()}else{if(p.native)throw Error('Saisis ta demande dans le terminal Windows');if(liveSnapshot().sessions.find(s=>s.sessionId===id)?.phase!=='WAITING_INPUT')throw Error('Ce processus n’attend pas de saisie');if(typeof data.text!=='string'||data.text.length>4096||/[\r\n]/.test(data.text))throw Error('Saisie invalide');await new Promise((ok,no)=>p.child.stdin.write(data.text+'\n',e=>e?no(e):ok()))}
 res.end(JSON.stringify({ok:true}));return
 }
 const tool=data.tool||'obsidure';if(!['obsidure','brody','cli'].includes(tool))throw Error('Outil inconnu');const mode=data.mode;if(!['audit','audit-long','interactive'].includes(mode)|| (tool!=='obsidure'&&mode!=='interactive'))throw Error('Mission inconnue');
 if([...processes.entries()].some(([sid,p])=>p.active&&p.tool===tool&&liveSnapshot().sessions.find(s=>s.sessionId===sid)?.presence!=='ended'))throw Error('Une session est déjà en cours : arrête-la ou attends sa fin');
 if(launching.has(tool))throw Error('Cet outil est déjà en cours de lancement');launchKey=tool;launching.add(tool);
 const root=realpathSync(repository());const session=randomUUID();
 contained(root,launchers[tool]);
 if(tool==='brody')await ensureBrodyApi(root);
 const args=[observer,'--repo',root,'--output',liveDirectory,'--agent',tool,'--session',session];
 if(mode!=='interactive')args.push('--audit','--audit-cycles',mode==='audit-long'?'20':'1','--audit-interval',mode==='audit-long'?'4':'0');
 const child=spawn(pythonFor(root),args,{cwd:root,stdio:['pipe','pipe','pipe'],windowsHide:true,env:{...process.env,PYTHONUNBUFFERED:'1',PYTHONIOENCODING:'utf-8'}});
 const p={child,active:true,output:'',exitCode:null,tool};processes.set(session,p);
 const append=c=>{p.output=(p.output+c.toString('utf8')).slice(-32000)};child.stdout.on('data',append);child.stderr.on('data',append);child.stdin.on('error',e=>append('Entrée du processus fermée : '+e.message));
 child.on('error',e=>{p.active=false;append('Erreur de lancement : '+e.message)});child.on('close',code=>{p.active=false;p.exitCode=code;try{const log=resolve(liveDirectory,session+'.jsonl');const lines=readFileSync(log,'utf8').trim().split('\n');const last=JSON.parse(lines.at(-1));if(last.kind!=='session_end')appendFileSync(log,JSON.stringify({...last,timestamp:new Date().toISOString(),kind:'session_end',phase:'PROCESS_EXIT',status:'error',exitCode:code,message:'Processus interrompu'})+'\n')}catch{}});
 await new Promise((ok,no)=>{child.once('spawn',ok);child.once('error',no)});
 for(const [id,v] of processes)if(processes.size>50&&!v.active)processes.delete(id);
 await awaitObserver(session,p);res.end(JSON.stringify({sessionId:session,started:true}));return
 }
 if(req.method==='GET'&&url.pathname==='/state'){const snap=snapshot(),live=liveSnapshot();res.end(JSON.stringify(buildObsidiaState(snap,live)));return}
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
   if(p.active&&p.tool===id){await focusTerminal(p.title,p.pid);res.end(JSON.stringify({opened:true,reused:true,tool:id,sessionId:session}));return}
  }
  const session=randomUUID(),title='OBSIDIA · '+spec.title+' · '+session.slice(0,8)
  emitNativeService(session,id,spec.title,root)
  const command=`$host.UI.RawUI.WindowTitle='${title.replaceAll("'","''")}'; ${spec.command}`
  const pid=await launchTerminal(command)
  const p={pid,active:true,output:'',exitCode:null,native:true,tool:id,title};processes.set(session,p)
  res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid}));return
 }
 if(id==='jarjar'){
  if(launching.has(id))throw Error('Jarjar est déjà en cours de lancement');launchKey=id;launching.add(id)
  const jr=jarjarRoot()
  if(!existsSync(jr))throw Error('Repo Jarjar absent. Candidats : '+jarjarRootCandidates().join(' | '))
  if(!existsSync(resolve(jr,jarjarModuleFile)))throw Error('Launcher Jarjar absent : '+resolve(jr,jarjarModuleFile))
  if(!existsSync(jarjarPython()))throw Error('Python Jarjar validé absent. Candidats : '+jarjarPythonCandidates().join(' | '))
  const master=resolve(projectRoot,'scripts','start-jarjar-full.ps1')
  if(!existsSync(master))throw Error('Launcher maître Jarjar absent : '+master)
  const session=randomUUID(),title='OBSIDIA · JARJAR FULL · '+session.slice(0,8)
  const command=`$host.UI.RawUI.WindowTitle='${title}'; & '${master.replaceAll("'","''")}'; Write-Host 'Ce terminal reste ouvert.'`
  const pid=await launchTerminal(command)
  const p={pid,active:true,output:'',exitCode:null,native:true,tool:id,title};processes.set(session,p)
  res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid,repository:jr,launcher:master}));return
 }
 const file=launchers[id];if(!file)throw Error('Outil non raccordé');if(launching.has(id))throw Error('Cet outil est déjà en cours de lancement');launchKey=id;launching.add(id);const root=realpathSync(repository());contained(root,file);
 for(const [session,p] of processes){if(p.active&&p.native&&p.tool===id&&!await terminalAlive(p.pid)){p.active=false;markEnd(session,'Terminal Windows fermé')}if(p.active&&p.tool===id){if(!p.native)throw Error('Une session de cet outil est active dans la page. La sélectionner ou l’arrêter avant d’ouvrir un terminal.');const live=liveSnapshot().sessions.find(s=>s.sessionId===session);if(live?.presence==='ended')continue;await focusTerminal(p.title,p.pid);res.end(JSON.stringify({opened:true,reused:true,tool:id,sessionId:session}));return}}
 if(id==='brody')await ensureBrodyApi(root);
 const wrapper=observer,session=randomUUID(),title='OBSIDIA · '+id+' · '+session.slice(0,8);
 const pythonArgs=[wrapper,'--repo',root,'--output',liveDirectory,'--agent',id,'--session',session];
 const command=terminalCommand(root,title,pythonFor(root),pythonArgs);
 const pid=await launchTerminal(command);
 const p={pid,active:true,output:'',exitCode:null,native:true,tool:id,title};processes.set(session,p);await awaitObserver(session,p);res.end(JSON.stringify({opened:true,tool:id,sessionId:session,pid}));return
 }
 res.statusCode=404;res.end(JSON.stringify({error:'Route inconnue'}))
 }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}finally{if(launchKey)launching.delete(launchKey)}
 })}}}
