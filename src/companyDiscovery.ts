import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import type {CapabilityDeclaration} from './worldCapabilityRegistry.ts'
import {buildCapabilityRegistry} from './worldCapabilityRegistry.ts'

// Discovery is a bounded observation, not a universal inventory of what a company needs.
export type CompanyCapabilityExpectation=CapabilityDeclaration&{reason:string;sourceRef:string}
export function discoverCompany(state:WorldSnapshotState,expectations:readonly CompanyCapabilityExpectation[]=[]){
 const current=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!current)return {schema:'OBSIDIA_COMPANY_DISCOVERY_V0' as const,organizationId:null,revision:state.revision,domains:[],capabilities:[],gaps:[],unknowns:['SNAPSHOT_NOT_CURRENT'],governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 const registry=buildCapabilityRegistry(current.model,expectations.map(x=>({domain:x.domain,id:x.id})))
 const gaps=expectations.flatMap(expected=>{
  const record=registry.records.find(r=>r.domain===expected.domain&&r.id===expected.id)
  if(!record||record.state==='OBSERVED_SOURCE')return []
  return [{domain:expected.domain,capabilityId:expected.id,observedState:record.state,
   reason:expected.reason,sourceRef:expected.sourceRef,classification:'REVIEW_CANDIDATE' as const}]
 })
 return {schema:'OBSIDIA_COMPANY_DISCOVERY_V0' as const,organizationId:current.model.organizationId,
  revision:state.revision,domains:current.company.domains,capabilities:registry.records,gaps,
  unknowns:[...new Set([...current.company.unknowns,...(state.phase==='DEGRADED'?['PARTIAL_SOURCE_AVAILABILITY']:[])])].sort(),
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
