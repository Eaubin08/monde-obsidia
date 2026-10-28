import type {WorldCompositionItem} from './worldUiCompositionContract.ts'
import {resolveWorldPattern} from './worldPatternLibrary.ts'

// Pure, deterministic presentation policy. Hints are advisory and grant no permissions.
export type WorldViewContext={mode:'OVERVIEW'|'DETAIL';focusedObjectKey?:string|null}
export function selectWorldPresentation(item:WorldCompositionItem,capabilities:readonly {id:string;state:string}[],context:WorldViewContext){
 const resolved=resolveWorldPattern(item)
 const observed=new Set(capabilities.filter(c=>c.state==='OBSERVED_SOURCE').map(c=>c.id))
 const missing=resolved.pattern.requiredCapabilities.filter(id=>!observed.has(id))
 const focused=context.mode==='DETAIL'&&context.focusedObjectKey===item.objectKey
 const fallback=resolved.fallback||missing.length>0
 return {
  pattern:fallback?'INSPECTION_VIEW':resolved.pattern.id,
  requestedPattern:item.pattern,
  fallback,
  reason:resolved.fallback?'PATTERN_UNRECOGNIZED':missing.length?'REQUIRED_CAPABILITY_UNOBSERVED':null,
  missingCapabilities:[...missing],
  emphasis:focused?'FOCUS' as const:'NORMAL' as const,
  // Navigation hints must remain inspection-only when the pattern cannot be used.
  href:fallback?null:item.href,
  unknowns:[...new Set([...item.unknowns,...(resolved.fallback?['PATTERN_UNRECOGNIZED']:[]),...(missing.length?['REQUIRED_CAPABILITY_UNOBSERVED']:[])])],
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}
 }
}
