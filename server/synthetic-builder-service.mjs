// V51 unified explicit synthetic Builder service. No production permissions or autonomous worker.
import {createSyntheticBuildQueue} from './synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from './synthetic-artifact-store.mjs'
import {createSyntheticJobJournal} from './synthetic-job-journal.mjs'
import {createSyntheticComponentCatalog} from './synthetic-component-catalog.mjs'
import {createSyntheticRecoveryInspector} from './synthetic-build-recovery.mjs'
import {createSyntheticLabLock} from './synthetic-lab-lock.mjs'
export function createSyntheticBuilderService({root,limit=16}={}){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit laboratory root required')
 const queue=createSyntheticBuildQueue({limit}),journal=createSyntheticJobJournal(root),store=createSyntheticArtifactStore(root)
 const catalog=createSyntheticComponentCatalog(root),recovery=createSyntheticRecoveryInspector(root),lock=createSyntheticLabLock(root)
 let busy=false
 async function submit(request){
  if(busy)return {status:'REJECTED',reason:'SERVICE_BUSY'}
  const result=queue.submit(request)
  if(result.status!=='ACCEPTED_SYNTHETIC')return result
  try{await journal.append(result.id,'QUEUED')}
  catch{return {status:'HOLD',reason:'JOURNAL_CREATION_FAILED',id:result.id}}
  return result
 }
 async function run(jobId){
  if(busy)return {status:'HOLD',reason:'SERVICE_BUSY',executionAllowed:false}
  const job=queue.inspect(jobId)
  if(!job||job.phase!=='QUEUED')return {status:'HOLD',reason:'JOB_NOT_QUEUED',executionAllowed:false}
  busy=true
  let lease=null
  try{
   lease=await lock.acquire()
   if(lease.status!=='ACQUIRED')return {status:'HOLD',reason:'LAB_LOCKED',executionAllowed:false}
   const original=await journal.read(jobId)
   if(original.status!=='VERIFIED_LOCAL_JOURNAL'||original.events.length!==1||original.events[0].phase!=='QUEUED')
    return {status:'HOLD',reason:'INVALID_JOB_JOURNAL',executionAllowed:false}
   await journal.append(jobId,'RUNNING')
   const built=await queue.run(jobId)
   const completed=built?.phase==='TESTED_SYNTHETIC'
   await journal.append(jobId,completed?'TESTED_SYNTHETIC':'FAILED')
   if(!completed)return {status:'HOLD',reason:'SYNTHETIC_TEST_FAILED',executionAllowed:false}
   const saved=await store.save(built)
   const checked=await store.inspect(jobId)
   if(checked.status!=='VERIFIED_STORED_SYNTHETIC')return {status:'HOLD',reason:'ARTIFACT_VERIFICATION_FAILED',executionAllowed:false}
   await journal.append(jobId,'STORED_SYNTHETIC',{digest:saved.digest})
   const reconciled=await recovery.inspect(jobId)
   return {schema:'OBSIDIA_SYNTHETIC_BUILDER_SERVICE_RESULT_V0',jobId,status:reconciled.status==='CONSISTENT_STORED'?'VERIFIED_LAB_BUILD':'HOLD',
    artifactDigest:saved.digest,testCount:built.tests.length,recovery:reconciled.status,
    buildApproved:false,deploymentApproved:false,executionAllowed:false,governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
  }catch{return {status:'HOLD',reason:'SERVICE_OR_STORAGE_FAILURE',executionAllowed:false}}
  finally{
   if(lease?.status==='ACQUIRED')await lease.release().catch(()=>false)
   busy=false
  }
 }
 async function inspect(jobId){return {memory:queue.inspect(jobId),recovery:await recovery.inspect(jobId),preview:await catalog.preview(jobId)}}
 async function list(){return {jobs:queue.list().map(x=>({id:x.id,phase:x.phase,templateId:x.templateId})),catalog:await catalog.list(),recovery:await recovery.inventory()}}
 return {submit,run,inspect,list}
}
