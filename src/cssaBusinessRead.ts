const collections=['dossiers','requirements','documentRefs','validations','submissionProofs','dossierOutcomes'] as const
// Read the existing Business registry; event payloads are not a source of truth.
export async function readCssaBusiness<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher('/obsidia-local/cssa-business-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source métier indisponible')
 const state=await response.json()
 if(!state||typeof state!=='object'||Array.isArray(state)||collections.some(key=>!Array.isArray(state[key])||state[key].some((row:unknown)=>!row||typeof row!=='object'||Array.isArray(row)||typeof (row as {id?:unknown}).id!=='string')))throw new Error('Registre métier invalide')
 return state as T
}
