import {readCanonicalSourceEvidence,type SourceEvidenceQuery} from './worldCanonicalSourceReader.ts'

// One GET per requested registry per audit. A batch is NOT an atomic multi-registry transaction.
export async function collectWorldEvidenceBatch(queries:readonly SourceEvidenceQuery[],fetcher:typeof fetch=fetch){
 const response=await readCanonicalSourceEvidence(queries,fetcher)
 return {schema:'OBSIDIA_EVIDENCE_BATCH_V0' as const,records:response.records,
  consistency:'SINGLE_READ_PER_REGISTRY_NON_ATOMIC' as const,
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
