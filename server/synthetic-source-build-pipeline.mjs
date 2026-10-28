// V55 separate source-only pipeline. It never imports or evaluates generated code.
import {mkdir,writeFile,readFile,readdir} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from './synthetic-software-generator.mjs'
import {createSyntheticLabLock} from './synthetic-lab-lock.mjs'
const valid=x=>typeof x==='string'&&/^SOURCE_JOB_[0-9a-f]{32}$/.test(x)
export function createSyntheticSourceBuildPipeline(root){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit laboratory root required')
 const base=resolve(root),directory=join(base,'source-builds'),lock=createSyntheticLabLock(base)
 async function build(request){
  const plan=planSoftwareComponent(request)
  if(plan.status!=='PLANNED')return {status:'REJECTED',reason:plan.reason,executionAllowed:false}
  const lease=await lock.acquire()
  if(lease.status!=='ACQUIRED')return {status:'HOLD',reason:'LAB_LOCKED',executionAllowed:false}
  try{
   const artifact=generateSoftwareSource(plan)
   const validation=await validateSoftwareSource(artifact)
   if(validation.status!=='SOURCE_VALIDATED_NOT_EXECUTED')return {status:'HOLD',reason:'VALIDATION_FAILED',executionAllowed:false}
   await mkdir(directory,{recursive:true})
   const jobId='SOURCE_JOB_'+randomUUID().replaceAll('-','')
   const manifest={schema:'OBSIDIA_SYNTHETIC_SOURCE_JOB_V0',jobId,organizationId:plan.organizationId,componentId:plan.componentId,kind:plan.kind,
    digest:artifact.digest,status:'SOURCE_VALIDATED_NOT_EXECUTED',tests:validation.tests,
    buildApproved:false,deploymentApproved:false,executionAllowed:false}
   const dest=join(directory,jobId+'.json')
   // Persist source and manifest together; fail-closed inspect detects partial/corrupt writes.
   await writeFile(dest,JSON.stringify({manifest,artifact},null,2)+'\n',{flag:'wx'})
   return {status:'STORED_SOURCE_NOT_EXECUTED',jobId,digest:artifact.digest,tests:validation.tests,executionAllowed:false}
  }catch{return {status:'HOLD',reason:'SOURCE_STORE_FAILURE',executionAllowed:false}}
  finally{await lease.release().catch(()=>false)}
 }
 async function inspect(jobId){
  if(!valid(jobId))return {status:'INVALID_ID',executionAllowed:false}
  let data
  try{data=JSON.parse(await readFile(join(directory,jobId+'.json'),'utf8'))}catch{return {status:'NOT_FOUND',executionAllowed:false}}
  const {manifest,artifact}=data
  if(manifest?.schema!=='OBSIDIA_SYNTHETIC_SOURCE_JOB_V0'||manifest.jobId!==jobId||manifest.status!=='SOURCE_VALIDATED_NOT_EXECUTED'||
   manifest.buildApproved!==false||manifest.deploymentApproved!==false||manifest.executionAllowed!==false||
   manifest.digest!==artifact?.digest||manifest.kind!==artifact.kind||manifest.organizationId!==artifact.organizationId||manifest.componentId!==artifact.componentId)
   return {status:'INVALID_MANIFEST',executionAllowed:false}
  const validation=await validateSoftwareSource(artifact)
  if(validation.status!=='SOURCE_VALIDATED_NOT_EXECUTED'||!Array.isArray(manifest.tests)||manifest.tests.length!==validation.tests.length||
   !manifest.tests.every((t,i)=>t.name===validation.tests[i].name&&t.pass===true))
   return {status:'SOURCE_INTEGRITY_FAILED',executionAllowed:false}
  return {status:'VERIFIED_SOURCE_PREVIEW',jobId,manifest,source:artifact.source,
   buildApproved:false,deploymentApproved:false,executionAllowed:false}
 }
 async function list({limit=50}={}){
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)return {status:'HOLD',entries:[]}
  let names=[]
  try{names=(await readdir(directory)).filter(n=>/^SOURCE_JOB_[0-9a-f]{32}\.json$/.test(n)).sort()}catch{}
  const entries=await Promise.all(names.slice(0,limit).map(n=>inspect(n.slice(0,-5))))
  return {status:'READ_ONLY',entries:entries.map(x=>({jobId:x.jobId??null,status:x.status,organizationId:x.manifest?.organizationId??null})),truncated:names.length>limit}
 }
 return {build,inspect,list}
}
