import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {discoverCompany} from './companyDiscovery.ts'

// A claimed reference is not a verified source. Verification needs explicit supplied evidence.
export type RequirementEvidence={sourceRef:string;organizationId:string;domain:string;capabilityId:string;status:'VERIFIED'|'REJECTED'|'UNKNOWN';evidenceId:string|null}
export type RequirementVerdict='VERIFIED_REFERENCE'|'REJECTED_REFERENCE'|'UNVERIFIED_REFERENCE'|'CONFLICTING_EVIDENCE'|'SNAPSHOT_NOT_CURRENT'
export function verifyCompanyRequirements(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],evidence:readonly RequirementEvidence[]=[]){
 const discovery=discoverCompany(state,expectations)
 const records=expectations.map(expected=>{
  const matching=evidence.filter(e=>e.sourceRef===expected.sourceRef&&e.domain===expected.domain&&e.capabilityId===expected.id&&e.organizationId===discovery.organizationId)
  const valid=matching.filter(e=>e.status==='VERIFIED'&&Boolean(e.evidenceId))
  const rejected=matching.filter(e=>e.status==='REJECTED')
  const verdict:RequirementVerdict=!discovery.organizationId?'SNAPSHOT_NOT_CURRENT':
   valid.length>1||rejected.length>0&&valid.length>0?'CONFLICTING_EVIDENCE':
   rejected.length>0?'REJECTED_REFERENCE':valid.length===1?'VERIFIED_REFERENCE':'UNVERIFIED_REFERENCE'
  return {domain:expected.domain,capabilityId:expected.id,sourceRef:expected.sourceRef,
   reason:expected.reason,verdict,evidenceIds:verdict==='VERIFIED_REFERENCE'?[valid[0].evidenceId!]:[],
   authority:'NONE' as const}
 })
 return {schema:'OBSIDIA_REQUIREMENT_VERIFICATION_V0' as const,organizationId:discovery.organizationId,revision:discovery.revision,
  records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
