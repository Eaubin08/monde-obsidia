import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {auditWorldEvidenceReplay} from './worldEvidenceReplay.ts'
import {crossCheckWorldEvidence,type CrossCheckBinding} from './worldEvidenceCrossCheck.ts'

// Bounded read-only graph of traceable provenance steps. No durable journal or authorization.
export async function auditWorldCrossCheckedReplay(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly CrossCheckBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const baseline=auditWorldEvidenceReplay(state,expectations,now,maxAgeMs)
 const checks=await crossCheckWorldEvidence(state,expectations,bindings,now,maxAgeMs,fetcher)
 const reviewRequests=baseline.reviewRequests.map(request=>{
  const candidates=checks.records.filter(x=>x.domain===request.domain&&x.capabilityId===request.requestedCapability&&x.sourceRef===request.sourceRef)
  const verdict=candidates.length===1?candidates[0].verdict:'CROSS_CHECK_MISSING'
  return {...request,crossCheckVerdict:verdict,readiness:'HOLD' as const,
   blockers:[...new Set([...request.blockers,verdict==='STRUCTURALLY_CONSISTENT'?'AUTHENTICITY_AND_AUTHORIZATION_NOT_PROVEN':'SOURCE_PROJECTION_CROSS_CHECK_UNRESOLVED'])],
   buildApproved:false,deploymentApproved:false,executionAllowed:false}
 })
 const provenance=checks.records.map(x=>({
  key:JSON.stringify([x.domain,x.capabilityId,x.sourceRef]),
  nodes:[{kind:'EXPECTATION' as const,id:x.sourceRef},...(x.query?[{kind:'SOURCE_RECORD' as const,id:x.query.registry+'/'+x.query.collection+'/'+x.query.id}]:[]),...(x.objectKey?[{kind:'PROJECTED_OBJECT' as const,id:x.objectKey}]:[])],
  status:x.verdict,integrity:x.integrity
 }))
 return {schema:'OBSIDIA_WORLD_CROSS_CHECKED_REPLAY_V0' as const,revision:state.revision,
  organizationId:checks.organizationId,checks,provenance,reviewRequests,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
