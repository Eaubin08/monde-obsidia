// World Object Contract V0 — projection only. No source promotion, mutation, or decision authority.
export type WorldObjectKind='OPERATION'|'CASE'|'ACTOR'|'RESOURCE'|string
export type WorldTruth='OBSERVED'|'DECLARED'|'INFERRED'|'UNKNOWN'|'CONTRADICTION'
export type WorldRelation={kind:string;target:{domain:string;kind:WorldObjectKind;id:string};sourceId:string;status:'RESOLVED'|'BROKEN'|'AMBIGUOUS'|'SOURCE_UNKNOWN';evidenceRefs:string[]}
export type WorldObject={
 identity:{organizationId:string;domain:string;kind:WorldObjectKind;id:string}
 label:string
 source:{id:string;status:'AVAILABLE'|'UNKNOWN';observedAt?:string}
 truth:WorldTruth
 relations:WorldRelation[]
 unknowns:string[]
 contradictions:string[]
 evidenceRefs:string[]
 capabilities:string[]
 presentation:{pattern:string;href?:string}
 governance:{authority:'NONE';decisionAuthority:'KX108_ONLY'}
}
export type WorldObjectInput={
 organizationId:string;domain:string;kind:WorldObjectKind;id:string;label:string
 sourceId:string;available:boolean;truth:WorldTruth;observedAt?:string
 relations?:WorldRelation[];unknowns?:string[];contradictions?:string[];evidenceRefs?:string[]
 capabilities?:string[];pattern:string;href?:string
}
export function projectWorldObject(input:WorldObjectInput):WorldObject{
 if(!input.organizationId||!input.domain||!input.kind||!input.id||!input.sourceId)throw new Error('World object identity or source missing')
 // Fail closed: no relationships or capabilities from an unavailable source.
 const available=input.available
 return {
  identity:{organizationId:input.organizationId,domain:input.domain,kind:input.kind,id:input.id},
  label:input.label||'UNKNOWN',
  source:{id:input.sourceId,status:available?'AVAILABLE':'UNKNOWN',...(input.observedAt?{observedAt:input.observedAt}:{})},
  truth:available?input.truth:'UNKNOWN',
  relations:available?[...(input.relations||[])]:[],
  unknowns:available?[...(input.unknowns||[])]:['SOURCE_UNAVAILABLE',...(input.unknowns||[])],
  contradictions:[...(input.contradictions||[])],
  evidenceRefs:available?[...(input.evidenceRefs||[])]:[],
  capabilities:available?[...(input.capabilities||[])]:[],
  presentation:{pattern:input.pattern, ...(input.href?{href:input.href}:{})},
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}
 }
}
export function worldObjectKey(item:WorldObject):string{
 const {organizationId,domain,kind,id}=item.identity
 return [organizationId,domain,kind,id].map(encodeURIComponent).join(':')
}
export function resolveWorldObject(id:string,objects:WorldObject[]):WorldObject|null{
 const matches=objects.filter(o=>worldObjectKey(o)===id)
 return matches.length===1?matches[0]:null
}
