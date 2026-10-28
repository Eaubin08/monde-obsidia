import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import type {SourceEvidenceBinding} from './worldSourceBackedReplay.ts'
import {readCanonicalSourceEvidence} from './worldCanonicalSourceReader.ts'
import {worldObjectKey} from './worldObjectContract.ts'

// Cross-check explicitly bound source record against one current, same-tenant World object.
// A cross-check is structural, not a signature or a proof of a missing capability.
export type CrossCheckBinding=SourceEvidenceBinding&{objectKey:string}
export async function crossCheckWorldEvidence(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly CrossCheckBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const nowMs=Date.parse(now)
 if(!Number.isFinite(nowMs)||!Number.isFinite(maxAgeMs)||maxAgeMs<0)throw Error('Invalid freshness policy')
 const active=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!active)return {schema:'OBSIDIA_WORLD_EVIDENCE_CROSS_CHECK_V0' as const,revision:state.revision,organizationId:null,records:[],governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 const observations=await readCanonicalSourceEvidence(bindings.map(b=>b.query),fetcher)
 const records=expectations.map(e=>{
  const matching=bindings.map((binding,index)=>({binding,observation:observations.records[index]})).filter(x=>x.binding.sourceRef===e.sourceRef&&x.binding.domain===e.domain&&x.binding.capabilityId===e.id)
  const candidate=matching.length===1?matching[0]:null
  const objects=candidate?active.model.objects.filter(o=>worldObjectKey(o)===candidate.binding.objectKey&&o.identity.organizationId===active.model.organizationId&&o.identity.domain===e.domain&&o.source.status==='AVAILABLE'):[]
  const observedAt=candidate?.observation.observedAt??null
  const time=observedAt?Date.parse(observedAt):NaN
  const sourceFresh=Number.isFinite(time)&&time<=nowMs&&nowMs-time<=maxAgeMs
  const projectionAt=objects.length===1?objects[0].source.observedAt:null
  const projectionTime=projectionAt?Date.parse(projectionAt):NaN
  const projectionFresh=Number.isFinite(projectionTime)&&projectionTime<=nowMs&&nowMs-projectionTime<=maxAgeMs
  const identityConsistent=!!candidate&&objects.length===1&&candidate.observation.status==='OBSERVED_RECORD'&&candidate.observation.query.id===objects[0].identity.id
  const referenceConsistent=objects.length===1&&objects[0].evidenceRefs.includes(e.sourceRef)
  const verdict=matching.length!==1?'BINDING_AMBIGUOUS_OR_MISSING':
   candidate?.observation.status!=='OBSERVED_RECORD'?'SOURCE_UNRESOLVED':
   objects.length!==1?'PROJECTED_OBJECT_UNRESOLVED':
   !identityConsistent||!referenceConsistent?'IDENTITY_OR_REFERENCE_DIVERGENCE':
   !sourceFresh||!projectionFresh?'FRESHNESS_NOT_ESTABLISHED':
   // Different observedAt values do not mean an atomic snapshot; force explicit review.
   observedAt!==projectionAt?'OBSERVATION_TIME_DIVERGENCE':'STRUCTURALLY_CONSISTENT'
  return {domain:e.domain,capabilityId:e.id,sourceRef:e.sourceRef,objectKey:verdict==='STRUCTURALLY_CONSISTENT'?candidate?.binding.objectKey??null:null,
   query:candidate?.binding.query??null,verdict,sourceObservedAt:observedAt,projectionObservedAt:projectionAt,
   integrity:'NOT_VERIFIED' as const,authorization:'NONE' as const}
 })
 return {schema:'OBSIDIA_WORLD_EVIDENCE_CROSS_CHECK_V0' as const,revision:state.revision,organizationId:active.model.organizationId,
  records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
