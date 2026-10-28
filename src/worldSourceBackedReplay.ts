import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {auditWorldEvidenceReplay} from './worldEvidenceReplay.ts'
import {readCanonicalSourceEvidence,type SourceEvidenceQuery} from './worldCanonicalSourceReader.ts'

// Explicit mapping is mandatory: an expectation sourceRef is NOT assumed to be a record ID.
export type SourceEvidenceBinding={sourceRef:string;domain:string;capabilityId:string;query:SourceEvidenceQuery}
export async function auditSourceBackedBuilderReplay(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly SourceEvidenceBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const baseline=auditWorldEvidenceReplay(state,expectations,now,maxAgeMs)
 if(state.phase!=='READY'&&state.phase!=='DEGRADED')return {...baseline,schema:'OBSIDIA_SOURCE_BACKED_BUILDER_REPLAY_V0' as const,sourceObservations:[],reviewRequests:[]}
 const observations=await readCanonicalSourceEvidence(bindings.map(b=>b.query),fetcher)
 const sourceObservations=expectations.map(expected=>{
  const matching=bindings.map((binding,index)=>({binding,result:observations.records[index]})).filter(x=>x.binding.sourceRef===expected.sourceRef&&x.binding.domain===expected.domain&&x.binding.capabilityId===expected.id)
  const status=matching.length!==1?'BINDING_AMBIGUOUS_OR_MISSING':matching[0].result.status
  return {domain:expected.domain,capabilityId:expected.id,sourceRef:expected.sourceRef,status,
   query:matching.length===1?matching[0].binding.query:null,
   observedAt:matching.length===1?matching[0].result.observedAt:null}
 })
 const reviewRequests=baseline.reviewRequests.map(req=>{
  const matches=sourceObservations.filter(x=>x.domain===req.domain&&x.capabilityId===req.requestedCapability&&x.sourceRef===req.sourceRef)
  const observation=matches.length===1?matches[0]:null
  const timestamp=observation?.observedAt?Date.parse(observation.observedAt):NaN
  const nowMs=Date.parse(now)
  const fresh=observation?.status==='OBSERVED_RECORD'&&Number.isFinite(timestamp)&&timestamp<=nowMs&&nowMs-timestamp<=maxAgeMs
  return {...req,sourceStatus:observation?.status??'BINDING_MISSING',sourceFresh:!!fresh,
   blockers:[...new Set([...req.blockers,...(fresh?['SOURCE_AUTHENTICITY_NOT_PROVEN']:['SOURCE_RECORD_OR_FRESHNESS_UNVERIFIED'])])],
   readiness:'HOLD' as const,buildApproved:false,deploymentApproved:false,executionAllowed:false}
 })
 return {...baseline,schema:'OBSIDIA_SOURCE_BACKED_BUILDER_REPLAY_V0' as const,sourceObservations,reviewRequests}
}
