import type {WorldCompositionItem} from './worldUiCompositionContract.ts'

// Patterns are semantic UI hints, not React components or authorization routes.
// Unknown patterns always fall back to an inspection-only representation.
export type WorldPattern={id:string;family:'CASE'|'RELATION'|'OPERATION'|'DOCUMENT'|'TASK'|'RESOURCE'|'INSPECTION';interaction:'READ_ONLY';requiredCapabilities:readonly string[]}
export const WORLD_PATTERNS:readonly WorldPattern[]=[
 {id:'CASE_WORKSPACE',family:'CASE',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'RELATIONSHIP_WORKSPACE',family:'RELATION',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'EVENT_OPERATIONS_WORKSPACE',family:'OPERATION',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'TASK_VIEW',family:'TASK',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'DOCUMENT_VIEW',family:'DOCUMENT',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'REQUIREMENT_VIEW',family:'CASE',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'MAINTENANCE_WORKSPACE',family:'RESOURCE',interaction:'READ_ONLY',requiredCapabilities:[]},
 {id:'INSPECTION_VIEW',family:'INSPECTION',interaction:'READ_ONLY',requiredCapabilities:[]}
]
export function resolveWorldPattern(item:WorldCompositionItem):{pattern:WorldPattern;requested:string;fallback:boolean}{
 const matches=WORLD_PATTERNS.filter(p=>p.id===item.pattern)
 if(matches.length===1)return {pattern:matches[0],requested:item.pattern,fallback:false}
 return {pattern:WORLD_PATTERNS[WORLD_PATTERNS.length-1],requested:item.pattern,fallback:true}
}
