import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {composeWorldUiContract} from './worldUiCompositionContract.ts'
import {resolveWorldPattern} from './worldPatternLibrary.ts'

// A render plan is a proposal for a renderer, not a rendered screen.
// Disallow links from unavailable/stale sources, and avoid binding unknown patterns to arbitrary modules.
export function composeWorldRenderPlan(state:WorldSnapshotState){
 const input=composeWorldUiContract(state)
 const territories=input.territories.map(t=>({
  domain:t.domain,status:t.status,
  blocks:t.items.map(item=>{
   const resolved=resolveWorldPattern(item)
   return {objectKey:item.objectKey,label:item.label,pattern:resolved.pattern.id,
    requestedPattern:resolved.requested,fallback:resolved.fallback,
    family:resolved.pattern.family,interaction:'READ_ONLY' as const,
    href:resolved.fallback?null:item.href,unknowns:[...item.unknowns,...(resolved.fallback?['PATTERN_UNRECOGNIZED']:[])]}
  }),
  capabilities:t.capabilities.filter(c=>c.state==='OBSERVED_SOURCE').map(c=>c.id)
 }))
 return {schema:'OBSIDIA_WORLD_RENDER_PLAN_V0' as const,
  revision:input.revision,organizationId:input.organizationId,phase:input.phase,
  territories,unknowns:input.unknowns,governance:input.governance}
}
