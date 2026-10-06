import {brodyServiceStatus,ensureBrodyApi,closeOwnedBrodyApi} from './brody-service.mjs'
import {terminalCommand,launchTerminal,focusTerminal,stopTerminal,terminalAlive} from './native-terminal.mjs'
import {liveSnapshot,liveDirectory} from './live-events.mjs'
import {buildObsidiaState} from './obsidia-state.mjs'
import {randomUUID} from 'node:crypto'
import {execFileSync,spawn} from 'node:child_process'
import {existsSync,realpathSync,readFileSync,readdirSync,statSync,appendFileSync} from 'node:fs'
import {resolve,relative,sep} from 'node:path'
import {repository,observer,pythonFor} from './paths.mjs'
export {repository} from './paths.mjs'
export function contained(root,path){const r=realpathSync(root),p=realpathSync(resolve(r,path));const rel=relative(r,p);if(rel.startsWith('..'+sep)||rel==='..'||rel.startsWith(sep))throw Error('Chemin hors projet');return p}
const launchers={cli:'scripts/obsidia_cli.py',brody:'scripts/brody_terminal_chat.py',obsidure:'scripts/obsidure_cli.py'}
const git=(root,...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',maxBuffer:12*1024*1024,timeout:10000,windowsHide:true}).trim()
export function snapshot(root=repository()){
 if(!existsSync(root))return {available:false,error:'Copie locale du dépôt non trouvée',observedAt:new Date().toISOString(),files:[],proposals:[],tools:[]}
 const sha=git(root,'rev-parse','HEAD'),branch=git(root,'branch','--show-current');
 const files=git(root,'ls-files').split('\n').filter(p=>/\.(md|json|jsonl|ya?ml|py|tsx?|ps1|lean)$/.test(p)&&!p.startsWith('.')&&!/(^|\/)(secrets|audit\/local|node_modules)\//.test(p)&&!/(^|\/)(credentials|tokens?)\./i.test(p));
 let proposals=[];const dir=resolve(root,'_PATCH_PROPOSALS');if(existsSync(dir)){
  for(const item of readdirSync(dir,{withFileTypes:true}).filter(x=>x.isDirectory()).slice(-100)){
   try{const p=contained(root,`_PATCH_PROPOSALS/${item.name}/proposal.json`);if(statSync(p).size>1024*1024)continue;const data=JSON.parse(readFileSync(p,'utf8'));proposals.push({id:item.name,path:`_PATCH_PROPOSALS/${item.name}/proposal.json`,data,observedAt:statSync(p).mtime.toISOString(),receipt:existsSync(resolve(dir,item.name,'RECEIPT.md'))?`_PATCH_PROPOSALS/${item.name}/RECEIPT.md`:null})}catch{}
  }
 }
 return {available:true,repository:root,sha,branch,observedAt:new Date().toISOString(),files,proposals,agentSources:files.filter(p=>/^(agents\/prompts\/.*\.md|periphery\/agents\/[^/]+\.py)$/.test(p)),tools:Object.entries(launchers).map(([id,path])=>({id,path,available:existsSync(resolve(root,path))&&process.platform==='win32',reason:process.platform!=='win32'?'Terminal Windows requis':!existsSync(resolve(root,path))?'Point d’entrée absent':null}))}
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
 if([...processes.entries()].some(([sid,p])=>p.active&&p.tool===tool&&(!p.native||liveSnapshot().sessions.find(s=>s.sessionId===sid)?.presence!=='ended')))throw Error('Une session est déjà en cours : arrête-la ou attends sa fin');
 if(launching.has(tool))throw Error('Cet outil est déjà en cours de lancement');launchKey=tool;launching.add(tool);
 const root=realpathSync(repository());contained(root,launchers[tool]);const session=randomUUID();
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
 const id=url.pathname.split('/').pop(),file=launchers[id];if(!file)throw Error('Outil non raccordé');if(launching.has(id))throw Error('Cet outil est déjà en cours de lancement');launchKey=id;launching.add(id);const root=realpathSync(repository());contained(root,file);
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
