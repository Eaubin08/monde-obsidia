import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {worldObjectKey} from './worldObjectContract.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'

// Evidence IDs are matched to already projected canonical object references, never invented from labels.
export function linkCanonicalEvidence(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],now:string,maxAgeMs:number){
 const snapshot=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 const time=Date.parse(now)
 if(!Number.isFinite(time)||!Number.isFinite(maxAgeMs)||maxAgeMs<0)throw Error('Invalid freshness policy')
 const records=expectations.map(expected=>{
  const matches=snapshot?.model.objects.filter(o=>o.identity.organizationId===snapshot.model.organizationId&&o.identity.domain===expected.domain&&o.source.status==='AVAILABLE'&&o.evidenceRefs.includes(expected.sourceRef))??[]
  const verdict=!snapshot?'SNAPSHOT_NOT_CURRENT':matches.length===0?'REFERENCE_NOT_FOUND':matches.length>1?'AMBIGUOUS_REFERENCE':(()=>{
   const at=matches[0].source.observedAt
   const ts=at?Date.parse(at):NaN
   return !Number.isFinite(ts)?'FRESHNESS_UNKNOWN':ts>time||time-ts>maxAgeMs?'STALE_OR_FUTURE':'OBSERVED_REFERENCE'
  })()
  return {domain:expected.domain,capabilityId:expected.id,sourceRef:expected.sourceRef,
   verdict,objectKeys:verdict==='OBSERVED_REFERENCE'?[worldObjectKey(matches[0])]:[],
   observedAt:verdict==='OBSERVED_REFERENCE'?matches[0].source.observedAt??null:null}
 })
 return {schema:'OBSIDIA_CANONICAL_EVIDENCE_LINKS_V0' as const,organizationId:snapshot?.model.organizationId??null,revision:state.revision,
  records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
