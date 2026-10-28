import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {createWorldContext} from './worldReadModel.ts'

// Stable non-React consumer contract. Never treat an old/invalidated snapshot as live.
export function projectWorldConsumer(state:WorldSnapshotState,objectKey:string){
 const active=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 const context=active?createWorldContext(active.model,active.graph,objectKey):null
 return {
  schema:'OBSIDIA_WORLD_CONSUMER_V0' as const,
  revision:state.revision,
  phase:state.phase,
  organizationId:active?.model.organizationId??null,
  focus:context?.focus??null,
  relations:context?.relations??[],
  unknowns:[...new Set([...(context?.unknowns??[]),...(active?.company.unknowns??[]),...(active?[]:['SNAPSHOT_NOT_CURRENT'])])],
  contradictions:context?.contradictions??[],
  evidenceRefs:context?.evidenceRefs??[],
  capabilities:context?.capabilities??[],
  territories:active?.manifest.territories??[],
  sourceStatus:active?.sourceStatus??null,
  consistency:'NON_ATOMIC_CROSS_SOURCE' as const,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}
 }
}
