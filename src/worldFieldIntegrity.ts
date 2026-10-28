import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {crossCheckWorldEvidence,type CrossCheckBinding} from './worldEvidenceCrossCheck.ts'
import {readCanonicalSourceEvidence} from './worldCanonicalSourceReader.ts'
import {worldObjectKey} from './worldObjectContract.ts'

// Compare only explicitly named shared fields. Hashes are local repeatability markers, not authentication.
export type FieldBinding=CrossCheckBinding&{fields:readonly {sourceField:string;projectedField:'label'|'identity.id'|'source.id'}[]}
function canonical(value:unknown):string{
 if(value===null||typeof value!=='object')return JSON.stringify(value)
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
 return '{'+Object.keys(value as Record<string,unknown>).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}'
}
function fingerprint(value:unknown):string{
 const data=canonical(value)
 let hash=2166136261
 for(let i=0;i<data.length;i++){hash^=data.charCodeAt(i);hash=Math.imul(hash,16777619)}
 return 'FNV1A32:'+String(hash>>>0).padStart(10,'0')
}
export async function auditWorldFieldIntegrity(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly FieldBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const cross=await crossCheckWorldEvidence(state,expectations,bindings,now,maxAgeMs,fetcher)
 const source=state.phase==='READY'||state.phase==='DEGRADED'?await readCanonicalSourceEvidence(bindings.map(b=>b.query),fetcher):null
 const records=expectations.map(expected=>{
  const match=bindings.map((binding,index)=>({binding,index})).filter(x=>x.binding.domain===expected.domain&&x.binding.capabilityId===expected.id&&x.binding.sourceRef===expected.sourceRef)
  const base=cross.records.find(x=>x.domain===expected.domain&&x.capabilityId===expected.id&&x.sourceRef===expected.sourceRef)
  const candidate=match.length===1?match[0]:null
  const observation=candidate&&source?source.records[candidate.index]:null
  const objects=candidate&&state.snapshot?state.snapshot.model.objects.filter(o=>worldObjectKey(o)===candidate.binding.objectKey&&o.identity.organizationId===state.snapshot!.model.organizationId&&o.source.status==='AVAILABLE'):[]
  const object=objects.length===1?objects[0]:null
  const comparisons=candidate&&observation?.record&&object?candidate.binding.fields.map(field=>{
   const left=observation.record![field.sourceField]
   const right=field.projectedField==='label'?object.label:field.projectedField==='identity.id'?object.identity.id:object.source.id
   const supported=Object.hasOwn(observation.record!,field.sourceField)
   return {sourceField:field.sourceField,projectedField:field.projectedField,status:!supported?'SOURCE_FIELD_MISSING' as const:canonical(left)===canonical(right)?'EQUAL' as const:'DIVERGENT' as const}
  }):[]
  const verdict=!base||base.verdict!=='STRUCTURALLY_CONSISTENT'?'CROSS_CHECK_UNRESOLVED':
   !candidate||!observation||!object||candidate.binding.fields.length===0?'FIELDS_UNVERIFIED':
   comparisons.every(x=>x.status==='EQUAL')?'FIELDS_CONSISTENT':'FIELD_DIVERGENCE'
  return {domain:expected.domain,capabilityId:expected.id,sourceRef:expected.sourceRef,verdict,
   comparisons,sourceFingerprint:observation?.record?fingerprint(observation.record):null,
   projectedFingerprint:object?fingerprint({identity:object.identity,label:object.label,source:object.source}):null,
   integrity:'NOT_AUTHENTICATED' as const}
 })
 return {schema:'OBSIDIA_WORLD_FIELD_INTEGRITY_V0' as const,revision:state.revision,organizationId:cross.organizationId,
  records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
