// Process boundary is a reliability limit, NOT a secure untrusted-code sandbox.
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from './synthetic-software-generator.mjs'
const exec=promisify(execFile)
const worker=fileURLToPath(new URL('./reviewed-source-process-worker.mjs',import.meta.url))
export async function testReviewedSourceInProcess(artifact,{timeoutMs=1500}={}){
 const hold=(reason)=>({schema:'OBSIDIA_REVIEWED_SOURCE_PROCESS_EVIDENCE_V0',status:'HOLD',reason,tests:[],osSandbox:false,processSeparated:false,
  buildApproved:false,deploymentApproved:false,executionAllowed:false})
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<100||timeoutMs>5000)return hold('INVALID_TIMEOUT')
 const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind:artifact?.kind,componentId:artifact?.componentId,organizationId:artifact?.organizationId})
 if(plan.status!=='PLANNED')return hold('UNREVIEWED_PLAN')
 const canonical=generateSoftwareSource(plan)
 const staticResult=await validateSoftwareSource(artifact)
 if(staticResult.status!=='SOURCE_VALIDATED_NOT_EXECUTED'||artifact.source!==canonical.source||artifact.digest!==canonical.digest)return hold('UNREVIEWED_SOURCE')
 try{
  const {stdout,stderr}=await exec(process.execPath,['--max-old-space-size=64',worker,artifact.kind,artifact.componentId,artifact.organizationId,artifact.digest],
   {timeout:timeoutMs,maxBuffer:32768,windowsHide:true,env:{PATH:process.env.PATH??'',SystemRoot:process.env.SystemRoot??''}})
  const data=JSON.parse(stdout)
  const expectedCases=artifact.kind==='PURE_AGENT_DESCRIPTOR'?1:3
  if(stderr||data.status!=='PROCESS_TESTED_REVIEWED'||data.digest!==canonical.digest||!Array.isArray(data.tests)||
   data.tests.length!==expectedCases||!data.tests.every((t,i)=>t.name==='CASE_'+(i+1)&&t.pass===true))return hold('INVALID_WORKER_OUTPUT')
  return {schema:'OBSIDIA_REVIEWED_SOURCE_PROCESS_EVIDENCE_V0',status:'PROCESS_TESTED_REVIEWED',sourceDigest:data.digest,tests:data.tests,
   osSandbox:false,processSeparated:true,networkIsolated:false,filesystemIsolated:false,
   buildApproved:false,deploymentApproved:false,executionAllowed:false,
   governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
 }catch{return hold('WORKER_FAILED_OR_TIMEOUT')}
}
