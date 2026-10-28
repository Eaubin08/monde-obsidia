// Read-only CRM projection reader, deliberately independent from CRM write actions.
export async function readCssaCrmDirectory<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher('/obsidia-local/cssa-crm-directory',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw Error('CRM unavailable')
 const state=await response.json()
 if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.organizations)||!Array.isArray(state.contacts)||!Array.isArray(state.interactions)||[...state.organizations,...state.contacts,...state.interactions].some(row=>!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'))throw Error('Invalid CRM directory')
 return state as T
}
