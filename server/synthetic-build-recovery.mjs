// V50 read-only recovery assessment. Never replays an interrupted build.
import {readdir} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {createSyntheticJobJournal} from './synthetic-job-journal.mjs'
import {createSyntheticArtifactStore} from './synthetic-artifact-store.mjs'
const valid=/^LAB_JOB_[0-9]{5}_[0-9a-f]{32}$/
export function createSyntheticRecoveryInspector(root){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit lab root required')
 const base=resolve(root),journal=createSyntheticJobJournal(base),store=createSyntheticArtifactStore(base)
 async function inspect(jobId){
  if(!valid.test(jobId))return {jobId,status:'INVALID_ID',action:'HOLD',executionAllowed:false}
  const history=await journal.read(jobId)
  if(history.status!=='VERIFIED_LOCAL_JOURNAL')return {jobId,status:history.status==='EMPTY'?'MISSING_JOURNAL':'INVALID_JOURNAL',action:'HOLD',executionAllowed:false}
  const last=history.events.at(-1).phase
  const artifact=await store.inspect(jobId)
  const validStored=artifact.status==='VERIFIED_STORED_SYNTHETIC'
  let status
  if(last==='STORED_SYNTHETIC')status=validStored?'CONSISTENT_STORED':'STORE_INCONSISTENT'
  else if(last==='TESTED_SYNTHETIC')status=validStored?'STORE_EVENT_MISSING':'PENDING_STORE_RECONCILIATION'
  else if(last==='QUEUED'||last==='RUNNING')status='INTERRUPTED_UNRESUMABLE'
  else status='FAILED_RECORDED'
  return {jobId,status,lastPhase:last,artifactStatus:artifact.status,action:'HOLD',executionAllowed:false,buildApproved:false,deploymentApproved:false}
 }
 async function inventory({limit=100}={}){
  if(!Number.isSafeInteger(limit)||limit<1||limit>1000)throw Error('Invalid inventory bound')
  let names
  try{names=(await readdir(join(base,'job-events'),{withFileTypes:true})).filter(x=>x.isDirectory()&&valid.test(x.name)).map(x=>x.name).sort()}catch{return {schema:'OBSIDIA_SYNTHETIC_RECOVERY_INVENTORY_V0',entries:[],truncated:false}}
  const entries=await Promise.all(names.slice(0,limit).map(inspect))
  return {schema:'OBSIDIA_SYNTHETIC_RECOVERY_INVENTORY_V0',entries,truncated:names.length>limit}
 }
 return {inspect,inventory}
}
