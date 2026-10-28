import type {WorldSnapshotState} from './cssaWorldSnapshotController.ts'
import {composeWorldUiContract} from './worldUiCompositionContract.ts'
import {selectWorldPresentation,type WorldViewContext} from './worldCompositionRules.ts'
import {WORLD_PATTERNS} from './worldPatternLibrary.ts'

// A render plan is a proposal for a renderer, not a rendered screen.
// Disallow links from unavailable/stale sources, and avoid binding unknown patterns to arbitrary modules.
export function composeWorldRenderPlan(state:WorldSnapshotState,context:WorldViewContext={mode:'OVERVIEW'}){
 const input=composeWorldUiContract(state)
 const territories=input.territories.map(t=>({
  domain:t.domain,status:t.status,
  blocks:t.items.map(item=>{
   const selected=selectWorldPresentation(item,t.capabilities,context)
   const pattern=WORLD_PATTERNS.find(p=>p.id===selected.pattern)!
   return {objectKey:item.objectKey,label:item.label,pattern:selected.pattern,
    requestedPattern:selected.requestedPattern,fallback:selected.fallback,
    family:pattern.family,interaction:'READ_ONLY' as const,emphasis:selected.emphasis,reason:selected.reason,
    href:selected.href,unknowns:selected.unknowns}
  }),
  capabilities:t.capabilities.filter(c=>c.state==='OBSERVED_SOURCE').map(c=>c.id)
 }))
 return {schema:'OBSIDIA_WORLD_RENDER_PLAN_V0' as const,
  revision:input.revision,organizationId:input.organizationId,phase:input.phase,
  territories,unknowns:input.unknowns,governance:input.governance}
}
