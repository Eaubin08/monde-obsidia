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
 validateCssaOrganisationState(state)
 return state as T
}

export function validateCssaOrganisationState(state:unknown):asserts state is Record<string,unknown>{
 const data=state as Record<string,unknown>
 if(!data||typeof data!=='object'||Array.isArray(data)||Object.entries(fields).some(([list,keys])=>!Array.isArray(data[list])||(data[list] as unknown[]).some((row:unknown)=>!row||typeof row!=='object'||Array.isArray(row)||keys.some(key=>typeof (row as Record<string,unknown>)[key]!=='string'))))throw new Error('Registre Organisation invalide')
}
