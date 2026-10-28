import {readCssaBusiness} from './cssaBusinessRead.ts'
import {readCssaTasks} from './cssaTasksRead.ts'
import {readCssaCrmDirectory} from './cssaCrmReadOnly.ts'
import {cssaSourceAvailable} from './cssaLinkedReference.ts'

// Actual read-only GET readers; identity lookup is exact and scoped to a known registry.
export type SourceEvidenceQuery={registry:'BUSINESS'|'OPS'|'CRM';collection:string;id:string}
export type SourceEvidenceResult={query:SourceEvidenceQuery;status:'OBSERVED_RECORD'|'SOURCE_UNKNOWN'|'RECORD_NOT_FOUND'|'AMBIGUOUS_RECORD'|'COLLECTION_UNSUPPORTED';source:'EXISTING_LOCAL_GET';observedAt:string|null;record:Record<string,unknown>|null}
const allowed:Record<SourceEvidenceQuery['registry'],readonly string[]>={
 BUSINESS:['dossiers','requirements','documentRefs','validations','submissionProofs','dossierOutcomes'],
 OPS:['tasks'],
 CRM:['organizations','contacts','interactions']
}
export async function readCanonicalSourceEvidence(queries:readonly SourceEvidenceQuery[],fetcher:typeof fetch=fetch){
 const requested=[...new Set(queries.map(q=>q.registry))]
 const results=await Promise.all(requested.map(async registry=>{
  try{
   const data:unknown=registry==='BUSINESS'?await readCssaBusiness(fetcher):
    registry==='OPS'?await readCssaTasks(fetcher):await readCssaCrmDirectory(fetcher)
   return {registry,data:cssaSourceAvailable(data)?data:null}
  }catch{return {registry,data:null}}
 }))
 const sources=new Map(results.map(result=>[result.registry,result.data]))
 const records:SourceEvidenceResult[]=queries.map(query=>{
  const base={query,source:'EXISTING_LOCAL_GET' as const,observedAt:null,record:null}
  if(!allowed[query.registry].includes(query.collection)||!query.id)return {...base,status:'COLLECTION_UNSUPPORTED' as const}
  const data=sources.get(query.registry)
  if(!data||typeof data!=='object')return {...base,status:'SOURCE_UNKNOWN' as const}
  const root=data as Record<string,unknown>
  const rows=root[query.collection]
  if(!Array.isArray(rows))return {...base,status:'SOURCE_UNKNOWN' as const}
  const matches=rows.filter(row=>row&&typeof row==='object'&&!Array.isArray(row)&&(row as Record<string,unknown>).id===query.id)
  if(matches.length!==1)return {...base,status:matches.length?'AMBIGUOUS_RECORD' as const:'RECORD_NOT_FOUND' as const}
  const source=root._source
  const observedAt=source&&typeof source==='object'&&typeof (source as Record<string,unknown>).observedAt==='string'?(source as Record<string,string>).observedAt:null
  return {...base,status:'OBSERVED_RECORD' as const,observedAt,record:structuredClone(matches[0]) as Record<string,unknown>}
 })
 return {schema:'OBSIDIA_CANONICAL_SOURCE_EVIDENCE_V0' as const,records,governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
