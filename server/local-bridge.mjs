import {liveSnapshot,liveDirectory} from './live-events.mjs'
import {randomUUID} from 'node:crypto'
import {execFileSync,spawn} from 'node:child_process'
import {existsSync,realpathSync,readFileSync,readdirSync,statSync} from 'node:fs'
import {resolve,relative,sep} from 'node:path'
export const repository=()=>resolve(process.env.OBSIDIA_SOURCE_REPO || '../sources/obsidia-x108-proofs')
export function contained(root,path){const r=realpathSync(root),p=realpathSync(resolve(r,path));const rel=relative(r,p);if(rel.startsWith('..'+sep)||rel==='..'||rel.startsWith(sep))throw Error('Chemin hors projet');return p}
const launchers={audit:'scripts/obsidure_cli.py',cli:'scripts/obsidia_cli.py',brody:'scripts/brody_terminal_chat.py',obsidure:'scripts/obsidure_cli.py'}
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
 return {available:true,repository:root,sha,branch,observedAt:new Date().toISOString(),files,proposals,tools:Object.entries(launchers).map(([id,path])=>({id,path,available:existsSync(resolve(root,path))&&process.platform==='win32'}))}
}
export function localBridge(){return {name:'obsidia-local-bridge',configureServer(server){server.middlewares.use('/obsidia-local',async(req,res)=>{
 const url=new URL(req.url,'http://localhost');res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');
 try{
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
 const id=url.pathname.split('/').pop(),file=launchers[id];if(!file)throw Error('Outil non raccordé');const root=realpathSync(repository()),path=contained(root,file);const quote=s=>"'"+s.replaceAll("'","''")+"'";
 const wrapper=resolve('scripts/observe_agent.py'),session=randomUUID();
 const pythonArgs=[wrapper,'--repo',root,'--output',liveDirectory,'--agent',id==='audit'?'obsidure':id,'--session',session];
 if(id==='audit')pythonArgs.push('--audit');
 const command=`Set-Location -LiteralPath ${quote(root)}; python `+pythonArgs.map(quote).join(' ')+'; exit $LASTEXITCODE';
 const encoded=Buffer.from(command,'utf16le').toString('base64');
 const child=spawn('powershell.exe',['-NoExit','-EncodedCommand',encoded],{cwd:root,detached:true,stdio:'ignore',windowsHide:false});
 await new Promise((ok,no)=>{child.once('spawn',ok);child.once('error',no)});child.unref();res.end(JSON.stringify({opened:true,tool:id,sessionId:session}));return
 }
 res.statusCode=404;res.end(JSON.stringify({error:'Route inconnue'}))
 }catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}))}
 })}}}
