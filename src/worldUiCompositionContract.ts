import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {worldObjectKey} from './worldObjectContract.ts'

// Presentation instructions only: no layout decisions, action permission or executable capabilities.
export type WorldCompositionItem={objectKey:string;label:string;pattern:string;href:string|null;truth:string;unknowns:string[]}
export type WorldCompositionTerritory={domain:string;status:'OBSERVED'|'UNKNOWN';items:WorldCompositionItem[];capabilities:{id:string;state:string}[]}
export function composeWorldUiContract(state:WorldSnapshotState){
 const snapshot=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!snapshot)return {schema:'OBSIDIA_WORLD_UI_CONTRACT_V0' as const,revision:state.revision,phase:state.phase,organizationId:null,territories:[] as WorldCompositionTerritory[],unknowns:['SNAPSHOT_NOT_CURRENT'],governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 const territories:WorldCompositionTerritory[]=snapshot.manifest.territories.map(t=>{
  const items=snapshot.model.objects.filter(o=>o.identity.domain===t.domain&&o.source.status==='AVAILABLE').map(o=>({
   objectKey:worldObjectKey(o),label:o.label,pattern:o.presentation.pattern,href:o.presentation.href??null,truth:o.truth,unknowns:[...o.unknowns]
  })).sort((a,b)=>a.objectKey.localeCompare(b.objectKey))
  const capabilities=snapshot.capabilityRegistry.records.filter(c=>c.domain===t.domain).map(c=>({id:c.id,state:c.state}))
  return {domain:t.domain,status:items.length?'OBSERVED' as const:'UNKNOWN' as const,items,capabilities}
 })
 return {schema:'OBSIDIA_WORLD_UI_CONTRACT_V0' as const,revision:state.revision,phase:state.phase,organizationId:snapshot.model.organizationId,territories,unknowns:[...new Set([...snapshot.company.unknowns,...snapshot.manifest.unknowns])],governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
