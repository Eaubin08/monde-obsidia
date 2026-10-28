import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import type {FieldBinding} from './worldFieldIntegrity.ts'
import {worldObjectKey} from './worldObjectContract.ts'
import {collectWorldEvidenceBatch} from './worldEvidenceBatch.ts'
import {prepareBuilderReview} from './worldBuilderReviewHandoff.ts'

// Canonical JSON for ordinary source records. A SHA-256 digest detects changes to these
// observed bytes; absent a trusted signed origin it cannot authenticate the source.
function canonicalJson(value:unknown):string{
 if(value===null||typeof value==='boolean'||typeof value==='string')return JSON.stringify(value)
 if(typeof value==='number')return Number.isFinite(value)?JSON.stringify(value):'null'
 if(Array.isArray(value))return '['+value.map(canonicalJson).join(',')+']'
 if(value&&typeof value==='object')return '{'+Object.keys(value as Record<string,unknown>).sort().filter(k=>(value as Record<string,unknown>)[k]!==undefined).map(k=>JSON.stringify(k)+':'+canonicalJson((value as Record<string,unknown>)[k])).join(',')+'}'
 throw Error('Unsupported canonical record value')
}
async function digest(value:unknown):Promise<string>{
 const data=new TextEncoder().encode(canonicalJson(value))
 const bytes=await crypto.subtle.digest('SHA-256',data)
 return 'SHA256:'+Array.from(new Uint8Array(bytes),x=>x.toString(16).padStart(2,'0')).join('')
}
export async function auditWorldEvidenceBatchV40(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly FieldBinding[],now:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 const nowMs=Date.parse(now)
 if(!Number.isFinite(nowMs)||!Number.isFinite(maxAgeMs)||maxAgeMs<0)throw Error('Invalid freshness policy')
 const active=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!active)return {schema:'OBSIDIA_WORLD_EVIDENCE_BATCH_AUDIT_V0' as const,revision:state.revision,organizationId:null,records:[],reviewRequests:[],consistency:'NON_ATOMIC' as const,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 // Do not fetch unsupported/unused bindings: only explicit, unique expectation matches are eligible.
 const admissible=bindings.filter(b=>expectations.some(e=>e.domain===b.domain&&e.id===b.capabilityId&&e.sourceRef===b.sourceRef))
 const batch=await collectWorldEvidenceBatch(admissible.map(b=>b.query),fetcher)
 const records=await Promise.all(expectations.map(async expected=>{
  const matches=admissible.map((binding,index)=>({binding,observation:batch.records[index]})).filter(x=>x.binding.domain===expected.domain&&x.binding.capabilityId===expected.id&&x.binding.sourceRef===expected.sourceRef)
  const pair=matches.length===1?matches[0]:null
  const obj=pair?active.model.objects.filter(o=>worldObjectKey(o)===pair.binding.objectKey&&o.identity.organizationId===active.model.organizationId&&o.identity.domain===expected.domain&&o.source.status==='AVAILABLE'):[]
  const projected=obj.length===1?obj[0]:null
  const source=pair?.observation
  const timestamp=source?.observedAt?Date.parse(source.observedAt):NaN
  const projectedTimestamp=projected?.source.observedAt?Date.parse(projected.source.observedAt):NaN
  const fresh=Number.isFinite(timestamp)&&timestamp<=nowMs&&nowMs-timestamp<=maxAgeMs&&Number.isFinite(projectedTimestamp)&&projectedTimestamp<=nowMs&&nowMs-projectedTimestamp<=maxAgeMs
  const tenantClaim=source?.record?.organizationId
  const tenantConsistent=tenantClaim===undefined||tenantClaim===active.model.organizationId
  const identity=!!projected&&source?.status==='OBSERVED_RECORD'&&source.query.id===projected.identity.id&&projected.evidenceRefs.includes(expected.sourceRef)
  const fields=pair&&projected&&source?.record?pair.binding.fields.map(f=>{
   const known=Object.hasOwn(source.record!,f.sourceField)
   const right=f.projectedField==='label'?projected.label:f.projectedField==='identity.id'?projected.identity.id:projected.source.id
   return {sourceField:f.sourceField,projectedField:f.projectedField,status:!known||source.record![f.sourceField]===undefined?'MISSING' as const:canonicalJson(source.record![f.sourceField])===canonicalJson(right)?'EQUAL' as const:'DIVERGENT' as const}
  }):[]
  const verdict=!pair?'BINDING_UNRESOLVED':!projected?'PROJECTION_UNRESOLVED':source?.status!=='OBSERVED_RECORD'?'SOURCE_UNRESOLVED':!tenantConsistent?'SOURCE_TENANT_CLAIM_MISMATCH':!identity?'IDENTITY_DIVERGENCE':!fresh?'FRESHNESS_UNVERIFIED':source.observedAt!==projected.source.observedAt?'OBSERVATION_TIME_DIVERGENCE':fields.length===0?'FIELDS_UNVERIFIED':fields.some(f=>f.status!=='EQUAL')?'FIELD_DIVERGENCE':'STRUCTURAL_FIELDS_MATCH'
  return {domain:expected.domain,capabilityId:expected.id,sourceRef:expected.sourceRef,verdict,fields,
   sourceDigest:source?.status==='OBSERVED_RECORD'&&source.record?await digest(source.record):null,
   integrity:'DIGEST_ONLY_NOT_AUTHENTICATED' as const,objectKey:verdict==='STRUCTURAL_FIELDS_MATCH'?worldObjectKey(projected!):null}
 }))
 const pending=prepareBuilderReview(state,expectations)
 const reviewRequests=pending.requests.map(req=>{
  const match=records.filter(x=>x.domain===req.domain&&x.capabilityId===req.requestedCapability&&x.sourceRef===req.sourceRef)
  return {...req,batchVerdict:match.length===1?match[0].verdict:'AMBIGUOUS_AUDIT',readiness:'HOLD' as const,
   blockers:[...new Set([...req.blockers,'SOURCE_AUTHENTICITY_AND_ATOMICITY_UNVERIFIED'])],buildApproved:false,deploymentApproved:false,executionAllowed:false}
 })
 return {schema:'OBSIDIA_WORLD_EVIDENCE_BATCH_AUDIT_V0' as const,revision:state.revision,organizationId:active.model.organizationId,
  records,reviewRequests,consistency:'NON_ATOMIC' as const,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
