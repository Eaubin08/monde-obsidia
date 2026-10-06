import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {pythonFor} from './paths.mjs'
const endpoint='http://127.0.0.1:8000'
let owned=null,starting=null
async function probe(){try{const r=await fetch(endpoint+'/',{signal:AbortSignal.timeout(1200)});let d={};try{d=await r.json()}catch{}return {ready:r.ok&&d.service==='obsidia-api',reachable:true,foreign:d.service!=='obsidia-api'}}catch{return {ready:false,reachable:false,foreign:false}}}
export async function brodyServiceStatus(){const state=await probe();return {...state,endpoint,managed:!!owned?.active,pid:owned?.active?owned.child.pid:null,output:owned?.output||'',error:owned?.error||null}}
export async function ensureBrodyApi(root){
 if(starting)return starting
 starting=(async()=>{
  const state=await probe();if(state.ready)return {ready:true,reused:true,endpoint};if(state.reachable)throw Error('Le port 8000 répond mais ne correspond pas à l’API Obsidia attendue')
  if(!existsSync(resolve(root,'apps/obsidia_api/main.py')))throw Error('API Brody absente : apps/obsidia_api/main.py')
  if(!owned?.active){
   const child=spawn(pythonFor(root),['-m','uvicorn','apps.obsidia_api.main:app','--host','127.0.0.1','--port','8000'],{cwd:root,windowsHide:true,stdio:['ignore','pipe','pipe'],env:{...process.env,PYTHONUNBUFFERED:'1',PYTHONIOENCODING:'utf-8'}})
   const p={child,active:true,output:'',error:null};owned=p
   const append=c=>p.output=(p.output+c.toString('utf8')).slice(-16000)
   child.stdout.on('data',append);child.stderr.on('data',append);child.on('error',e=>{p.active=false;p.error=e.message});child.on('close',code=>{p.active=false;if(code)p.error='API arrêtée — code '+code})
   await new Promise((ok,no)=>{child.once('spawn',ok);child.once('error',no)})
  }
  const deadline=Date.now()+30000
  while(Date.now()<deadline){
   if(!owned.active)throw Error('Démarrage API Brody échoué. '+(owned.error||'')+'\n'+owned.output)
   if((await probe()).ready)return {ready:true,reused:false,endpoint,pid:owned.child.pid}
   await new Promise(r=>setTimeout(r,250))
  }
  owned.child.kill();throw Error('API Brody non prête après 30 secondes.\n'+owned.output)
 })();try{return await starting}finally{starting=null}
}
export function closeOwnedBrodyApi(){if(owned?.active)owned.child.kill()}
