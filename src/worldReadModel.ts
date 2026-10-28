import {worldObjectKey,type WorldObject,type WorldRelation} from './worldObjectContract.ts'

// Portable, framework-independent snapshot. Source status is explicit; objects never grant authority.
export type WorldReadModel={
 schema:'OBSIDIA_WORLD_READ_MODEL_V0'
 organizationId:string
 objects:WorldObject[]
 unknowns:string[]
 sourceStatus:Record<string,'AVAILABLE'|'UNKNOWN'>
 governance:{authority:'NONE';decisionAuthority:'KX108_ONLY'}
}
export function buildWorldReadModel(organizationId:string,inputs:WorldObject[]):WorldReadModel{
 if(!organizationId.trim())throw Error('Organization identity required')
 const scoped=inputs.filter(o=>o.identity.organizationId===organizationId)
 const occurrences=new Map<string,number>()
 for(const item of scoped){const key=worldObjectKey(item);occurrences.set(key,(occurrences.get(key)||0)+1)}
 const objects=scoped.filter(o=>occurrences.get(worldObjectKey(o))===1)
 const unknowns=[...occurrences].filter(([,n])=>n!==1).map(([key])=>'AMBIGUOUS_OBJECT:'+key).sort()
 const sourceStatus:Record<string,'AVAILABLE'|'UNKNOWN'>=Object.create(null)
 for(const item of objects){
  const id=item.source.id
  if(Object.hasOwn(sourceStatus,id)&&sourceStatus[id]!==item.source.status)sourceStatus[id]='UNKNOWN'
  else if(!Object.hasOwn(sourceStatus,id))sourceStatus[id]=item.source.status
 }
 return {schema:'OBSIDIA_WORLD_READ_MODEL_V0',organizationId,objects,unknowns,sourceStatus,governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
}
export type WorldGraphEdge={from:string;to:string;kind:string;sourceId:string;status:WorldRelation['status'];evidenceRefs:string[]}
export type WorldGraph={nodes:WorldObject[];edges:WorldGraphEdge[];unknowns:string[]}
export function buildWorldGraph(model:WorldReadModel):WorldGraph{
 const keys=new Map<string,WorldObject>()
 for(const object of model.objects)keys.set(worldObjectKey(object),object)
 const edges:WorldGraphEdge[]=[]
 const unknowns=[...model.unknowns]
 for(const item of model.objects){
  if(item.source.status!=='AVAILABLE')continue
  for(const rel of item.relations){
   const from=worldObjectKey(item)
   const targetIdentity={organizationId:model.organizationId,...rel.target}
   const to=[targetIdentity.organizationId,targetIdentity.domain,targetIdentity.kind,targetIdentity.id].map(encodeURIComponent).join(':')
   const target=keys.get(to)
   const sourceKnown=Object.hasOwn(model.sourceStatus,rel.sourceId)&&model.sourceStatus[rel.sourceId]==='AVAILABLE'
   const status:WorldGraphEdge['status']=!sourceKnown?'SOURCE_UNKNOWN':rel.status!=='RESOLVED'?rel.status:!target||target.source.status!=='AVAILABLE'?'BROKEN':'RESOLVED'
   if(status!=='RESOLVED')unknowns.push(status+':'+from+'->'+to)
   edges.push({from,to,kind:rel.kind,sourceId:rel.sourceId,status,evidenceRefs:status==='RESOLVED'?[...rel.evidenceRefs]:[]})
  }
 }
 return {nodes:model.objects,edges,unknowns:[...new Set(unknowns)].sort()}
}
export type WorldContext={
 schema:'OBSIDIA_WORLD_CONTEXT_V0'
 organizationId:string
 focus:WorldObject|null
 relations:{edge:WorldGraphEdge;object:WorldObject|null}[]
 unknowns:string[]
 contradictions:string[]
 evidenceRefs:string[]
 capabilities:string[]
 governance:{authority:'NONE';decisionAuthority:'KX108_ONLY'}
}
export function createWorldContext(model:WorldReadModel,graph:WorldGraph,objectKey:string):WorldContext{
 const matches=model.objects.filter(o=>worldObjectKey(o)===objectKey)
 const focus=matches.length===1?matches[0]:null
 const edges=focus?graph.edges.filter(e=>e.from===objectKey||e.to===objectKey):[]
 const relations=edges.map(edge=>{
  const otherKey=edge.from===objectKey?edge.to:edge.from
  const other=graph.nodes.filter(o=>worldObjectKey(o)===otherKey)
  return {edge,object:edge.status==='RESOLVED'&&other.length===1?other[0]:null}
 })
 const trusted=relations.filter(r=>r.edge.status==='RESOLVED'&&r.object).map(r=>r.object!)
 return {schema:'OBSIDIA_WORLD_CONTEXT_V0',organizationId:model.organizationId,focus,
  relations,unknowns:[...new Set([...graph.unknowns,...(focus?.unknowns||[]),...(focus?[]:['FOCUS_UNKNOWN'])])],
  contradictions:[...new Set([...(focus?.contradictions||[]),...trusted.flatMap(o=>o.contradictions)])],
  evidenceRefs:[...new Set([...(focus?.source.status==='AVAILABLE'?focus.evidenceRefs:[]),...relations.filter(r=>r.edge.status==='RESOLVED').flatMap(r=>r.edge.evidenceRefs)])],
  capabilities:[...new Set([...(focus?.source.status==='AVAILABLE'?focus.capabilities:[]),...trusted.flatMap(o=>o.capabilities)])],
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
}
