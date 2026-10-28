import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {projectWorldActivity,type WorldActivityDeclaration} from './worldActivityContext.ts'
import {deriveWorldViewContext} from './worldDisplayContext.ts'
import {composeWorldRenderPlan} from './worldUiComposer.ts'
import {createWorldContext} from './worldReadModel.ts'

// Unified V33 read-only package, reusable by future Monde/Workspace/Copilot UI adapters.
// A declared role is a view hint, not an authenticated principal or ACL.
export function composeWorldActivityPlan(state:WorldSnapshotState,request:WorldActivityDeclaration){
 const current=(state.phase==='READY'||state.phase==='DEGRADED')?state.snapshot:null
 if(!current){
  return {schema:'OBSIDIA_WORLD_ACTIVITY_PLAN_V0' as const,phase:state.phase,revision:state.revision,
   organizationId:null,activity:null,context:null,plan:composeWorldRenderPlan(state),
   unknowns:['SNAPSHOT_NOT_CURRENT'],governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
 }
 const activity=projectWorldActivity(current.model,request)
 const selectedKey=activity.activity.observedObjectKey
 const context=selectedKey?createWorldContext(current.model,current.graph,selectedKey):null
 const view=deriveWorldViewContext(activity.profile,selectedKey?'DETAIL':'OVERVIEW')
 const plan=composeWorldRenderPlan(state,view,activity.profile)
 return {schema:'OBSIDIA_WORLD_ACTIVITY_PLAN_V0' as const,phase:state.phase,revision:state.revision,
  organizationId:current.model.organizationId,activity,context,plan,
  unknowns:[...new Set([...activity.unknowns,...(context?.unknowns??[]),...current.company.unknowns])].sort(),
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
