const fields:Record<string,string[]>={
 people:['id','displayName','status'],
 roleAssignments:['id','personId','roleSlot','status'],
 availabilities:['id','personId','from','to','status'],
 engagements:['id','personId','type','status'],
 authorizations:['id','personId','scope','action','status']
}
// Read-only validation of the existing registry, without assigning people or authority.
export async function readCssaOrganisation<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher('/obsidia-local/cssa-organisation-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source Organisation indisponible')
 const state=await response.json()
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.entries(fields).some(([list,keys])=>!Array.isArray(state[list])||state[list].some((row:unknown)=>!row||typeof row!=='object'||Array.isArray(row)||keys.some(key=>typeof (row as Record<string,unknown>)[key]!=='string'))))throw new Error('Registre Organisation invalide')
 return state as T
}
