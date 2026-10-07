import {existsSync} from 'node:fs'
import {resolve} from 'node:path'

const endpoint='http://127.0.0.1:8000'

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
 return {...state,endpoint,managed:false,pid:null,output:'',error:null}
}

export async function ensureBrodyApi(root){
 if(!existsSync(resolve(root,'apps/obsidia_api/main.py')))throw Error('API Brody absente : apps/obsidia_api/main.py')

 const deadline=Date.now()+10000
 let last=null
 while(Date.now()<deadline){
  last=await probe(1500)
  if(last.ready)return {ready:true,reused:true,endpoint}
  if(last.reachable&&last.foreign)throw Error('Le port 8000 répond mais ne correspond pas à l’API Obsidia attendue')
  await new Promise(r=>setTimeout(r,250))
 }

 throw Error('API Obsidia/Brody non prête sur 8000. Lance d’abord API depuis Monde > Workspace > Lancements.')
}

export function closeOwnedBrodyApi(){}
