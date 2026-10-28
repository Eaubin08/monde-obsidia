import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {proposeCompanyNeeds} from './companyNeedCandidates.ts'
import type {CompanyCapabilityExpectation} from './companyDiscovery.ts'

// No Builder execution, no authorization, no inferred implementation feasibility.
export function prepareBuilderReview(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[]=[]){
 const needs=proposeCompanyNeeds(state,expectations)
 const requests=needs.candidates.map(need=>({
  id:'BUILDER_REVIEW_'+need.id,organizationId:needs.organizationId,domain:need.domain,
  requestedCapability:need.capabilityId,sourceRef:need.sourceRef,
  reason:need.reason,classification:'REVIEW_ONLY' as const,buildApproved:false,
  deploymentApproved:false,executionAllowed:false,
  requiredChecks:['CANONICAL_SOURCE','BUSINESS_REQUIREMENT','EXISTING_CAPABILITY','AUTHORIZATION','TEST_EVIDENCE'] as const
 }))
 return {schema:'OBSIDIA_BUILDER_REVIEW_HANDOFF_V0' as const,organizationId:needs.organizationId,
  revision:needs.revision,requests,unknowns:needs.unknowns,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
