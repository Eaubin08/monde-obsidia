// V52 bounded read-only World projection, no server route or deployment path.
import {createSyntheticComponentCatalog} from './synthetic-component-catalog.mjs'
import {createSyntheticRecoveryInspector} from './synthetic-build-recovery.mjs'
export function createWorldBuilderCatalogRead(root){
 const catalog=createSyntheticComponentCatalog(root),recovery=createSyntheticRecoveryInspector(root)
 async function list({organizationId,limit=50}={}){
  if(typeof organizationId!=='string'||!/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(organizationId))return {status:'HOLD',reason:'ORGANIZATION_REQUIRED',entries:[]}
  if(!Number.isSafeInteger(limit)||limit<1||limit>100)return {status:'HOLD',reason:'INVALID_LIMIT',entries:[]}
  const all=await catalog.list()
  const visible=all.filter(x=>x.status==='VERIFIED_STORED_SYNTHETIC'&&x.preview?.organizationId===organizationId)
  const selected=visible.slice(0,limit)
  const entries=await Promise.all(selected.map(async row=>{
   const state=await recovery.inspect(row.jobId)
   return {jobId:row.jobId,status:state.status==='CONSISTENT_STORED'?'PREVIEW_ONLY':'HOLD',
    component:state.status==='CONSISTENT_STORED'?row.preview:null,
    buildApproved:false,deploymentApproved:false,executionAllowed:false}
  }))
  return {schema:'OBSIDIA_WORLD_BUILDER_CATALOG_READ_V0',organizationId,status:'READ_ONLY',
   entries,truncated:visible.length>limit,authority:'NONE',decisionAuthority:'KX108_ONLY'}
 }
 return {list}
}
