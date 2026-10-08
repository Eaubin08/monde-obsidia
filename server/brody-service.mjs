import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {Socket} from 'node:net'

const endpoint='http://127.0.0.1:8000'

function portOpen(port=8000,timeout=700){
 return new Promise(resolve=>{
  const socket=new Socket()
  let done=false
  const finish=value=>{if(done)return;done=true;socket.destroy();resolve(value)}
  socket.setTimeout(timeout)
  socket.once('connect',()=>finish(true))
  socket.once('timeout',()=>finish(false))
  socket.once('error',()=>finish(false))
  socket.connect(port,'127.0.0.1')
 })
}

async function probe(timeout=1500){
 try{
  const r=await fetch(endpoint+'/',{signal:AbortSignal.timeout(timeout)})
  let d={}
  try{d=await r.json()}catch{}
  return {ready:r.ok&&d.service==='obsidia-api',reachable:true,foreign:d.service!=='obsidia-api',data:d}
 }catch{
  return {ready:false,reachable:false,foreign:false,data:null}
 }
}

export async function brodyServiceStatus(){
 const state=await probe()
 const listening=state.ready||await portOpen()
 return {...state,ready:state.ready,reachable:listening,foreign:listening&&!state.ready,endpoint,managed:false,pid:null,output:'',error:null}
}

export async function ensureBrodyApi(root){
 if(!existsSync(resolve(root,'apps/obsidia_api/main.py')))throw Error('API Brody absente : apps/obsidia_api/main.py')

 const state=await probe()
 if(state.ready)return {ready:true,reused:true,endpoint}
 if(await portOpen())throw Error('Port 8000 occupé par un service non reconnu comme obsidia-api.')

 throw Error('API Obsidia/Brody non prête sur 8000. Lance d’abord API depuis Monde > Workspace > Lancements.')
}

export function closeOwnedBrodyApi(){}
