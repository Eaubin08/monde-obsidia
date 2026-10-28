import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import type {FieldBinding} from './worldFieldIntegrity.ts'
import {captureWorldEvidenceReceipts} from './worldEvidenceReceipts.ts'
import {auditEvidenceReceiptBoundary} from './worldEvidenceReceiptBoundary.ts'

// Integrates the V40→V41→V42 gates. Never promotes a local receipt to source authority.
export async function auditWorldEvidenceIntegration(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],bindings:readonly FieldBinding[],policy:{organizationId:string;now:string;maxAgeMs:number},fetcher:typeof fetch=fetch){
 const {organizationId,now,maxAgeMs}=policy
 if(!organizationId||!Number.isFinite(Date.parse(now))||!Number.isFinite(maxAgeMs)||maxAgeMs<0)throw new Error('Invalid evidence policy')
 const current=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!current||current.model.organizationId!==organizationId){
  return {schema:'OBSIDIA_WORLD_EVIDENCE_INTEGRATION_V0' as const,organizationId,revision:state.revision,
   status:'HOLD' as const,blockers:[!current?'SNAPSHOT_NOT_CURRENT':'FOREIGN_SNAPSHOT'],
   receipts:[],receiptAudit:null,reviewRequests:[],
   governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 }
 const capture=await captureWorldEvidenceReceipts(state,expectations,bindings,now,maxAgeMs,fetcher)
 const boundary=await auditEvidenceReceiptBoundary(capture.receipts,policy)
 const duplicateExpectationKeys=new Set<string>()
 const seenExpectationKeys=new Set<string>()
 for(const e of expectations){
  const key=JSON.stringify([e.domain,e.id,e.sourceRef])
  if(seenExpectationKeys.has(key))duplicateExpectationKeys.add(key)
  seenExpectationKeys.add(key)
 }
 const reviews=capture.reviewRequests.map(request=>{
  const matching=boundary.records.filter(row=>{
   try{const key=JSON.parse(row.identity) as string[];return key[0]===organizationId&&key[1]===request.domain&&key[2]===request.requestedCapability&&key[3]===request.sourceRef}catch{return false}
  })
  const expectedKey=JSON.stringify([request.domain,request.requestedCapability,request.sourceRef])
  const correspondingReceipts=capture.receipts.filter(r=>r.organizationId===organizationId&&r.domain===request.domain&&r.capabilityId===request.requestedCapability&&r.sourceRef===request.sourceRef)
  const boundaryBlockers=[
   ...(matching.length===1?matching[0].violations:['MISSING_OR_AMBIGUOUS_RECEIPT']),
   ...(correspondingReceipts.length===1?[]:['MISSING_OR_AMBIGUOUS_CAPTURE_RECEIPT']),
   ...(duplicateExpectationKeys.has(expectedKey)?['DUPLICATE_EXPECTATION']:[])
  ]
  return {...request,receiptStatus:'HOLD' as const,
   blockers:[...new Set([...request.blockers,...boundaryBlockers])],
   readiness:'HOLD' as const,buildApproved:false,deploymentApproved:false,executionAllowed:false}
 })
 return {schema:'OBSIDIA_WORLD_EVIDENCE_INTEGRATION_V0' as const,organizationId,revision:state.revision,
  status:'HOLD' as const,blockers:['SOURCE_AUTHENTICITY_NOT_PROVEN','NON_ATOMIC_SOURCE_SNAPSHOT'],
  receipts:capture.receipts,receiptAudit:boundary,reviewRequests:reviews,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
