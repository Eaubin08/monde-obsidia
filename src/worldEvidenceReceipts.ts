import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import type {FieldBinding} from './worldFieldIntegrity.ts'
import {auditWorldEvidenceBatchV40} from './worldEvidenceBatchAudit.ts'

// Local receipt of a V40 observation. It authenticates neither the source nor the clock.
export type EvidenceReceipt={organizationId:string;revision:number;domain:string;capabilityId:string;sourceRef:string;verdict:string;sourceDigest:string|null;objectKey:string|null;observedAt:string;receiptDigest:string}
function ordered(value:unknown):string{
 if(value===null||typeof value==='string'||typeof value==='boolean')return JSON.stringify(value)
 if(typeof value==='number')return Number.isFinite(value)?JSON.stringify(value):'null'
 if(Array.isArray(value))return '['+value.map(ordered).join(',')+']'
 if(value&&typeof value==='object')return '{'+Object.keys(value as Record<string,unknown>).sort().filter(k=>(value as Record<string,unknown>)[k]!==undefined).map(k=>JSON.stringify(k)+':'+ordered((value as Record<string,unknown>)[k])).join(',')+'}'
 throw new Error('Unsupported receipt payload')
}
async function sha256(value:unknown):Promise<string>{
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(ordered(value)))
 return 'SHA256:'+Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
}
export async function verifyLocalEvidenceReceipt(receipt:EvidenceReceipt):Promise<boolean>{
 if(!/^SHA256:[a-f0-9]{64}$/.test(receipt.receiptDigest))return false
 const {receiptDigest,...payload}=receipt
 return receiptDigest===await sha256(payload)
}
export async function captureWorldEvidenceReceipts(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly FieldBinding[],observedAt:string,maxAgeMs:number,fetcher:typeof fetch=fetch){
 if(!Number.isFinite(Date.parse(observedAt)))throw new Error('Invalid observation time')
 const audit=await auditWorldEvidenceBatchV40(state,expectations,bindings,observedAt,maxAgeMs,fetcher)
 const receipts:EvidenceReceipt[]=[]
 if(audit.organizationId)for(const row of audit.records){
  const base={organizationId:audit.organizationId,revision:audit.revision,domain:row.domain,capabilityId:row.capabilityId,sourceRef:row.sourceRef,
   verdict:row.verdict,sourceDigest:row.sourceDigest,objectKey:row.objectKey,observedAt}
  receipts.push({...base,receiptDigest:await sha256(base)})
 }
 return {schema:'OBSIDIA_LOCAL_EVIDENCE_RECEIPTS_V0' as const,receipts,reviewRequests:audit.reviewRequests,consistency:'NON_ATOMIC' as const,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
export async function compareLocalEvidenceReceipts(previous:readonly EvidenceReceipt[],current:readonly EvidenceReceipt[]){
 const key=(r:EvidenceReceipt)=>ordered([r.organizationId,r.domain,r.capabilityId,r.sourceRef])
 const group=(rows:readonly EvidenceReceipt[])=>{
  const map=new Map<string,EvidenceReceipt[]>()
  for(const r of rows)map.set(key(r),[...(map.get(key(r))??[]),r])
  return map
 }
 const a=group(previous),b=group(current)
 const keys=[...new Set([...a.keys(),...b.keys()])].sort()
 const changes=[]
 for(const k of keys){
  const old=a.get(k)??[],next=b.get(k)??[]
  const all=[...old,...next]
  const valid=(await Promise.all(all.map(verifyLocalEvidenceReceipt))).every(Boolean)
  const status=!valid?'INVALID_RECEIPT':old.length>1||next.length>1?'AMBIGUOUS_RECEIPT':!old.length?'ADDED':!next.length?'REMOVED':
   old[0].sourceDigest!==next[0].sourceDigest?'SOURCE_DIGEST_CHANGED':
   old[0].verdict!==next[0].verdict||old[0].objectKey!==next[0].objectKey?'EVIDENCE_STATUS_CHANGED':
   old[0].revision!==next[0].revision?'SNAPSHOT_REVISION_CHANGED':'UNCHANGED'
  changes.push({key:k,status})
 }
 return {schema:'OBSIDIA_LOCAL_EVIDENCE_CHANGESET_V0' as const,changes,authority:'NONE' as const}
}
