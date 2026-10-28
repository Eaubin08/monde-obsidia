// V52 cooperative interprocess laboratory lock. Fail closed on stale/contested lock.
import {mkdir,rm,readFile,writeFile} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
export function createSyntheticLabLock(root){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit lab root required')
 const base=resolve(root),folder=join(base,'.builder-service-lock')
 async function acquire(){
  await mkdir(base,{recursive:true})
  const token=randomUUID()
  try{await mkdir(folder)}catch(err){
   if(err?.code==='EEXIST')return {status:'LOCKED',release:async()=>false}
   throw err
  }
  try{await writeFile(join(folder,'owner.json'),JSON.stringify({token,pid:process.pid}),{flag:'wx'})}
  catch(err){await rm(folder,{recursive:true,force:true});throw err}
  let released=false
  return {status:'ACQUIRED',async release(){
   if(released)return false
   const owner=JSON.parse(await readFile(join(folder,'owner.json'),'utf8'))
   if(owner.token!==token)return false
   await rm(folder,{recursive:true,force:true})
   released=true
   return true
  }}
 }
 return {acquire}
}
