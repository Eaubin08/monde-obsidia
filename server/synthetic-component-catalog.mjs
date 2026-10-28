// Read-only synthetic artifact catalog: no API server, no activation.
import {createSyntheticArtifactStore} from './synthetic-artifact-store.mjs'
export function createSyntheticComponentCatalog(root){
 const store=createSyntheticArtifactStore(root)
 async function list(){
  const ids=await store.list()
  return Promise.all(ids.map(async jobId=>{
   const result=await store.inspect(jobId)
   if(result.status!=='VERIFIED_STORED_SYNTHETIC')return {jobId,status:result.status,preview:null}
   const obj=JSON.parse(result.artifact.content)
   return {jobId,status:'VERIFIED_STORED_SYNTHETIC',
    preview:{organizationId:obj.organizationId,id:obj.id,kind:obj.kind,capabilities:obj.capabilities,
     synthetic:true,digest:result.artifact.digest,testsPassed:result.manifest.tests.length,deployable:false},
    executionAllowed:false,buildApproved:false,deploymentApproved:false}
  }))
 }
 async function preview(jobId){
  const result=await store.inspect(jobId)
  if(result.status!=='VERIFIED_STORED_SYNTHETIC')return {status:result.status,preview:null}
  const obj=JSON.parse(result.artifact.content)
  return {status:'PREVIEW_ONLY',jobId,component:{id:obj.id,organizationId:obj.organizationId,kind:obj.kind,capabilities:obj.capabilities,
   synthetic:true,deployable:false},digest:result.artifact.digest,tests:result.manifest.tests,
   buildApproved:false,deploymentApproved:false,executionAllowed:false}
 }
 return {list,preview}
}
