import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {linkCanonicalEvidence} from './worldCanonicalEvidence.ts'
import {auditBuilderReadiness} from './worldBuilderReadiness.ts'
import {prepareBuilderReview} from './worldBuilderReviewHandoff.ts'

// Deterministic replay input, no writes. Linking a reference is not authenticity verification.
export function auditWorldEvidenceReplay(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],now:string,maxAgeMs:number){
 const links=linkCanonicalEvidence(state,expectations,now,maxAgeMs)
 const readiness=auditBuilderReadiness(state,expectations)
 const handoff=prepareBuilderReview(state,expectations)
 const decisions=readiness.records.map(row=>{
  const linked=links.records.filter(r=>r.domain===row.domain&&r.capabilityId===row.capabilityId&&r.sourceRef===row.sourceRef)
  const provenance=linked.length===1?linked[0]:null
  const blockers=[...new Set([...row.blockers,provenance?.verdict==='OBSERVED_REFERENCE'?'SOURCE_AUTHENTICITY_NOT_PROVEN':'CANONICAL_EVIDENCE_NOT_ESTABLISHED'])]
  return {domain:row.domain,capabilityId:row.capabilityId,sourceRef:row.sourceRef,
   canonicalVerdict:provenance?.verdict??'UNRESOLVED',
   objectKeys:provenance?.objectKeys??[],blockers,readiness:'HOLD' as const}
 })
 return {schema:'OBSIDIA_WORLD_EVIDENCE_REPLAY_V0' as const,organizationId:links.organizationId,
  revision:state.revision,policy:{now,maxAgeMs},links,decisions,
  reviewRequests:handoff.requests.map(req=>{
   const row=decisions.find(x=>x.domain===req.domain&&x.capabilityId===req.requestedCapability&&x.sourceRef===req.sourceRef)
   return {...req,blockers:row?.blockers??['READINESS_NOT_ESTABLISHED'],readiness:'HOLD' as const,
    buildApproved:false,deploymentApproved:false,executionAllowed:false}
  }),
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
