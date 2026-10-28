import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {proposeCompanyNeeds} from './companyNeedCandidates.ts'
import {auditBuilderReadiness} from './worldBuilderReadiness.ts'
import type {RequirementEvidence} from './worldRequirementVerification.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'

// No Builder execution, no authorization, no inferred implementation feasibility.
export function prepareBuilderReview(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[]=[],evidence:readonly RequirementEvidence[]=[]){
 const needs=proposeCompanyNeeds(state,expectations)
 const audit=auditBuilderReadiness(state,expectations,evidence)
 const requests=needs.candidates.map(need=>({
  id:'BUILDER_REVIEW_'+need.id,organizationId:needs.organizationId,domain:need.domain,
  requestedCapability:need.capabilityId,sourceRef:need.sourceRef,
  reason:need.reason,classification:'REVIEW_ONLY' as const,
  readiness:audit.records.find(x=>x.domain===need.domain&&x.capabilityId===need.capabilityId&&x.sourceRef===need.sourceRef)?.readiness??'HOLD',
  blockers:audit.records.find(x=>x.domain===need.domain&&x.capabilityId===need.capabilityId&&x.sourceRef===need.sourceRef)?.blockers??['READINESS_NOT_ESTABLISHED'],buildApproved:false,
  deploymentApproved:false,executionAllowed:false,
  requiredChecks:['CANONICAL_SOURCE','BUSINESS_REQUIREMENT','EXISTING_CAPABILITY','AUTHORIZATION','TEST_EVIDENCE'] as const
 }))
 return {schema:'OBSIDIA_BUILDER_REVIEW_HANDOFF_V0' as const,organizationId:needs.organizationId,
  revision:needs.revision,requests,unknowns:needs.unknowns,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
