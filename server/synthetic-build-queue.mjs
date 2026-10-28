// Opt-in, bounded laboratory jobs. No user-generated code execution or production deployment.
import {executeSyntheticBuild} from './synthetic-builder-lab.mjs'
import {selectSyntheticTemplate} from './synthetic-template-registry.mjs'
import {randomUUID} from 'node:crypto'
const validId=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x)
export function createSyntheticBuildQueue({limit=16}={}){
 if(!Number.isSafeInteger(limit)||limit<1||limit>256)throw Error('Invalid queue capacity')
 const jobs=new Map()
 let sequence=0
 function submit(request){
  if(jobs.size>=limit)return {status:'REJECTED',reason:'QUEUE_CAPACITY'}
  const template=selectSyntheticTemplate(request?.kind,request?.requiredCapabilities??[])
  if(!template||request?.mode!=='SYNTHETIC_ONLY'||!validId(request?.componentId)||!validId(request?.organizationId)){
   return {status:'REJECTED',reason:'INVALID_SYNTHETIC_REQUEST'}
  }
  const id='LAB_JOB_'+String(++sequence).padStart(5,'0')+'_'+randomUUID().replaceAll('-','')
  jobs.set(id,{id,request:{mode:'SYNTHETIC_ONLY',kind:template.kind,componentId:request.componentId,organizationId:request.organizationId},
   templateId:template.id,phase:'QUEUED',events:['QUEUED'],artifact:null,tests:[],governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}})
  return {status:'ACCEPTED_SYNTHETIC',id,templateId:template.id}
 }
 async function run(id){
  const job=jobs.get(id)
  if(!job)return {status:'NOT_FOUND'}
  if(job.phase!=='QUEUED')return {status:'REJECTED',reason:'JOB_NOT_QUEUED',phase:job.phase}
  job.phase='RUNNING';job.events.push('RUNNING')
  try{
   const result=await executeSyntheticBuild(job.request)
   job.tests=result.tests
   job.artifact=result.status==='TESTED_SYNTHETIC'?result.artifact:null
   job.phase=result.status==='TESTED_SYNTHETIC'?'TESTED_SYNTHETIC':'FAILED'
  }catch{job.phase='FAILED';job.tests=[];job.artifact=null}
  job.events.push(job.phase)
  return inspect(id)
 }
 function inspect(id){
  const job=jobs.get(id)
  if(!job)return null
  return structuredClone({...job,buildApproved:false,deploymentApproved:false,executionAllowed:false})
 }
 function list(){return [...jobs.keys()].map(inspect)}
 return {submit,run,inspect,list}
}
