import type {EvidenceReceipt} from './worldEvidenceReceipts.ts'
import {verifyLocalEvidenceReceipt} from './worldEvidenceReceipts.ts'

// A local receipt can be checked for internal consistency; it is not signed by its source.
export type ReceiptPolicy={organizationId:string;maxAgeMs:number;now:string}
export async function auditEvidenceReceiptBoundary(receipts:readonly EvidenceReceipt[],policy:ReceiptPolicy){
 const nowMs=Date.parse(policy.now)
 if(!policy.organizationId||!Number.isFinite(nowMs)||!Number.isFinite(policy.maxAgeMs)||policy.maxAgeMs<0)throw Error('Invalid receipt verification policy')
 const keys=new Map<string,number>()
 for(const r of receipts){
  const key=JSON.stringify([r.organizationId,r.domain,r.capabilityId,r.sourceRef])
  keys.set(key,(keys.get(key)??0)+1)
 }
 const rows=await Promise.all(receipts.map(async receipt=>{
  const key=JSON.stringify([receipt.organizationId,receipt.domain,receipt.capabilityId,receipt.sourceRef])
  const violations:string[]=[]
  if(receipt.organizationId!==policy.organizationId)violations.push('FOREIGN_ORGANIZATION')
  if(keys.get(key)!==1)violations.push('DUPLICATE_IDENTITY')
  if(!Number.isSafeInteger(receipt.revision)||receipt.revision<0)violations.push('INVALID_SNAPSHOT_REVISION')
  if(!receipt.domain||!receipt.capabilityId||!receipt.sourceRef||!receipt.organizationId)violations.push('MISSING_IDENTITY')
  const t=Date.parse(receipt.observedAt)
  if(!Number.isFinite(t)||t>nowMs||nowMs-t>policy.maxAgeMs)violations.push('UNVERIFIED_FRESHNESS')
  if(!receipt.sourceDigest||!/^SHA256:[a-f0-9]{64}$/.test(receipt.sourceDigest))violations.push('MISSING_SOURCE_DIGEST')
  if(!await verifyLocalEvidenceReceipt(receipt).catch(()=>false))violations.push('INVALID_RECEIPT_DIGEST')
  // No downstream security decision from a local unsigned digest.
  violations.push('SOURCE_SIGNATURE_NOT_VERIFIED','TENANT_SOURCE_AUTHENTICITY_NOT_VERIFIED')
  return {identity:key,verdict:'HOLD' as const,violations:[...new Set(violations)],authority:'NONE' as const}
 }))
 return {schema:'OBSIDIA_EVIDENCE_RECEIPT_BOUNDARY_V0' as const,organizationId:policy.organizationId,records:rows,
  buildApproved:false,deploymentApproved:false,executionAllowed:false,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
