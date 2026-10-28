import type {WorldReadModel} from './worldReadModel.ts'
import {worldObjectKey} from './worldObjectContract.ts'

// Registry describes exposed/read capabilities, never authorization or successful execution.
// Without explicit runtime proof, AVAILABLE is deliberately not a valid capability state.
export type CapabilityState='OBSERVED_SOURCE'|'DECLARED_ONLY'|'SOURCE_UNKNOWN'|'NOT_OBSERVED'
export type CapabilityRecord={id:string;domain:string;state:CapabilityState;objectKeys:string[];sources:string[];unknowns:string[];executionAuthority:'NONE'}
export type CapabilityDeclaration={id:string;domain:string}
export function buildCapabilityRegistry(model:WorldReadModel,declarations:CapabilityDeclaration[]=[]){
 const keys=new Set<string>()
 const rows:CapabilityRecord[]=[]
 for(const item of model.objects){
  for(const id of item.capabilities){
   const key=JSON.stringify([item.identity.domain,id])
   keys.add(key)
  }
 }
 for(const d of declarations)keys.add(JSON.stringify([d.domain,d.id]))
 for(const key of [...keys].sort()){
  const [domain,id]=JSON.parse(key) as [string,string]
  const matching=model.objects.filter(o=>o.identity.domain===domain&&o.capabilities.includes(id))
  const observed=matching.filter(o=>o.source.status==='AVAILABLE')
  const declared=declarations.some(d=>d.domain===domain&&d.id===id)
  const state:CapabilityState=observed.length?'OBSERVED_SOURCE':matching.length?'SOURCE_UNKNOWN':declared?'DECLARED_ONLY':'NOT_OBSERVED'
  rows.push({id,domain,state,objectKeys:observed.map(worldObjectKey).sort(),sources:[...new Set(observed.map(o=>o.source.id))].sort(),unknowns:state==='OBSERVED_SOURCE'?[]:[state],executionAuthority:'NONE'})
 }
 return {schema:'OBSIDIA_CAPABILITY_REGISTRY_V0' as const,organizationId:model.organizationId,records:rows,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
