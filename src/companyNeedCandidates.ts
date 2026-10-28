import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {discoverCompany,type CompanyCapabilityExpectation} from './companyDiscovery.ts'

// Candidates are requests for investigation, never established needs or authority to build.
export function proposeCompanyNeeds(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[]=[]){
 const discovery=discoverCompany(state,expectations)
 const candidates=discovery.gaps.map((gap,index)=>({
  id:'NEED_CANDIDATE_'+String(index+1).padStart(3,'0'),domain:gap.domain,capabilityId:gap.capabilityId,
  issue:'CAPABILITY_NOT_OBSERVED' as const,sourceRef:gap.sourceRef,reason:gap.reason,
  evidenceStatus:'INSUFFICIENT' as const,decision:'HOLD' as const,
  nextAction:'VERIFY_SOURCE_AND_BUSINESS_REQUIREMENT' as const
 }))
 return {schema:'OBSIDIA_COMPANY_NEEDS_V0' as const,organizationId:discovery.organizationId,
  revision:discovery.revision,candidates,unknowns:discovery.unknowns,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
