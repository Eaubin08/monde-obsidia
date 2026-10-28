import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'
import {discoverCompany} from './companyDiscovery.ts'
import {verifyCompanyRequirements,type RequirementEvidence} from './worldRequirementVerification.ts'

// A verified reference does NOT prove a missing capability, implementation need, or approval.
export function auditBuilderReadiness(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[],evidence:readonly RequirementEvidence[]=[]){
 const discovery=discoverCompany(state,expectations)
 const verification=verifyCompanyRequirements(state,expectations,evidence)
 const records=discovery.gaps.map(gap=>{
  const refs=verification.records.filter(v=>v.domain===gap.domain&&v.capabilityId===gap.capabilityId&&v.sourceRef===gap.sourceRef)
  const verified=refs.length===1&&refs[0].verdict==='VERIFIED_REFERENCE'
  const blockers=[...(verified?[]:['REQUIREMENT_NOT_VERIFIED']),...(state.phase==='DEGRADED'?['PARTIAL_SOURCE_AVAILABILITY']:[]),'CAPABILITY_ABSENCE_NOT_PROVEN','AUTHORIZATION_MISSING','TEST_EVIDENCE_MISSING']
  return {domain:gap.domain,capabilityId:gap.capabilityId,sourceRef:gap.sourceRef,
   requirementVerdict:refs.length===1?refs[0].verdict:'UNVERIFIED_REFERENCE',
   gapClassification:gap.observedState==='SOURCE_UNKNOWN'?'UNKNOWN_SOURCE':'NOT_OBSERVED_IN_CURRENT_MODEL',
   evidenceIds:verified?[...refs[0].evidenceIds]:[],blockers,
   readiness:'HOLD' as const,buildApproved:false,executionAllowed:false}
 })
 return {schema:'OBSIDIA_BUILDER_READINESS_V0' as const,organizationId:discovery.organizationId,revision:discovery.revision,
  records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
