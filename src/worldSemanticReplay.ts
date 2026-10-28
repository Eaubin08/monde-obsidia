import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {auditWorldCrossCheckedReplay} from './worldCrossCheckedReplay.ts'
import {auditWorldFieldIntegrity,type FieldBinding} from './worldFieldIntegrity.ts'

// Exposes two independent read passes explicitly; they are not an atomic consistency proof.
export async function auditWorldSemanticReplay(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly FieldBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const cross=await auditWorldCrossCheckedReplay(state,expectations,bindings,now,maxAgeMs,fetcher)
 const fields=await auditWorldFieldIntegrity(state,expectations,bindings,now,maxAgeMs,fetcher)
 const reviewRequests=cross.reviewRequests.map(request=>{
  const hits=fields.records.filter(f=>f.domain===request.domain&&f.capabilityId===request.requestedCapability&&f.sourceRef===request.sourceRef)
  const verdict=hits.length===1?hits[0].verdict:'FIELD_AUDIT_UNRESOLVED'
  return {...request,fieldVerdict:verdict,readiness:'HOLD' as const,
   blockers:[...new Set([...request.blockers,verdict==='FIELDS_CONSISTENT'?'NON_ATOMIC_AND_UNAUTHENTICATED_READS':'FIELD_CONSISTENCY_UNRESOLVED'])],
   buildApproved:false,deploymentApproved:false,executionAllowed:false}
 })
 return {schema:'OBSIDIA_WORLD_SEMANTIC_REPLAY_V0' as const,revision:state.revision,
  organizationId:cross.organizationId,cross,fields,reviewRequests,
  consistency:'NON_ATOMIC_MULTIPLE_READS' as const,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
