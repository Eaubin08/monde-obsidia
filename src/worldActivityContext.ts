import type {WorldReadModel} from './worldReadModel.ts'
import {worldObjectKey} from './worldObjectContract.ts'
import type {WorldDisplayProfile} from './worldDisplayContext.ts'

// Read-only activity context. A user-supplied role is never proof of identity or permission.
export type WorldActivityDeclaration={roleLabel?:string|null;activityObjectKey?:string|null;preferredDomains?:readonly string[]}
export function projectWorldActivity(model:WorldReadModel,declared:WorldActivityDeclaration){
 const key=declared.activityObjectKey??null
 const matches=key?model.objects.filter(o=>worldObjectKey(o)===key&&o.source.status==='AVAILABLE'):[]
 const observed=matches.length===1?matches[0]:null
 const unknowns=key&&!observed?['ACTIVITY_OBJECT_UNRESOLVED']:[]
 const profile:WorldDisplayProfile={roleLabel:declared.roleLabel??null,
  preferredDomains:declared.preferredDomains??[],focusedObjectKey:observed?worldObjectKey(observed):null}
 return {schema:'OBSIDIA_WORLD_ACTIVITY_CONTEXT_V0' as const,organizationId:model.organizationId,
  declaredRole:declared.roleLabel??null,verifiedRole:null,activity:{declaredKey:key,observedObjectKey:observed?worldObjectKey(observed):null,domain:observed?.identity.domain??null},
  profile,unknowns,authorization:{verified:false,permissions:[] as string[],authority:'NONE' as const},
  governance:{decisionAuthority:'KX108_ONLY' as const}}
}
