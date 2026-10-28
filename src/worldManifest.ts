import {worldObjectKey,type WorldObject} from './worldObjectContract.ts'

// Organization-scoped read model: objects are observed projections, not permissions.
export type WorldManifest={
 schema:'OBSIDIA_WORLD_MANIFEST_V0'
 organizationId:string
 identity:{id:string;label:string}
 objects:WorldObject[]
 territories:{domain:string;patterns:string[];objectKeys:string[];capabilities:string[];status:'LIVE'|'OPEN'}[]
 unknowns:string[]
 governance:{authority:'NONE';decisionAuthority:'KX108_ONLY'}
}
export function composeWorldManifest(organizationId:string,label:string,objects:WorldObject[]):WorldManifest{
 if(!organizationId||!label)throw new Error('Organization identity required')
 // No cross-tenant inclusion. Duplicate identities remain unresolved, never arbitrarily collapsed.
 const scoped=objects.filter(o=>o.identity.organizationId===organizationId)
 const counts=new Map<string,number>()
 for(const o of scoped){const key=worldObjectKey(o);counts.set(key,(counts.get(key)||0)+1)}
 const unique=scoped.filter(o=>counts.get(worldObjectKey(o))===1)
 const ambiguous=[...counts].filter(([,n])=>n>1).map(([key])=>'AMBIGUOUS_OBJECT:'+key)
 const domains=[...new Set(unique.map(o=>o.identity.domain))].sort()
 return {
  schema:'OBSIDIA_WORLD_MANIFEST_V0',organizationId,identity:{id:organizationId,label},objects:unique,
  territories:domains.map(domain=>{
   const rows=unique.filter(o=>o.identity.domain===domain)
   const live=rows.filter(o=>o.source.status==='AVAILABLE')
   return {domain,patterns:[...new Set(live.map(o=>o.presentation.pattern))].sort(),objectKeys:rows.map(worldObjectKey).sort(),capabilities:[...new Set(live.flatMap(o=>o.capabilities))].sort(),status:live.length?'LIVE' as const:'OPEN' as const}
  }),
  unknowns:ambiguous,
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}
 }
}
