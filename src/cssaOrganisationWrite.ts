import {readCssaOrganisation,validateCssaOrganisationState} from './cssaOrganisationRead.ts'
const collections={personPatch:'people',roleAssignmentPatch:'roleAssignments',availabilityPatch:'availabilities',engagementPatch:'engagements',authorizationPatch:'authorizations'} as const
export type OrganisationPatchKey=keyof typeof collections
// Confirmation of a local record only. No role or authorization grants execution authority.
export async function writeCssaOrganisationPatch<T>(key:OrganisationPatchKey,row:Record<string,string>,fetcher:typeof fetch=fetch):Promise<T>{
 if(!row.id||!collections[key])throw new Error('Objet Organisation invalide.')
 const current=await readCssaOrganisation<Record<string,unknown>>(fetcher)
 const source=(current._source as {status?:string}|undefined)?.status
 if(source!=='AVAILABLE'&&source!=='MISSING')throw new Error('Source Organisation invalide ou illisible : enregistrement bloqué.')
 const list=collections[key]
 if((current[list] as {id:string}[]).filter(item=>item.id===row.id).length>1)throw new Error('Identifiant Organisation ambigu : enregistrement bloqué.')
 if(key!=='personPatch'&&(source!=='AVAILABLE'||!row.personId||(current.people as {id:string}[]).filter(person=>person.id===row.personId).length!==1))throw new Error('Personne introuvable ou ambiguë dans la source actuelle.')
 const response=await fetcher('/obsidia-local/cssa-organisation-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({[key]:row}),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement non confirmé par le registre local.')
 const result=await response.json()
 validateCssaOrganisationState(result)
 if((result._source as {status?:string}|undefined)?.status!=='AVAILABLE')throw new Error('Source enregistrée non confirmée.')
 const matches=(result[list] as Record<string,unknown>[]).filter(item=>item.id===row.id)
 if(matches.length!==1||Object.entries(row).some(([field,value])=>matches[0][field]!==value))throw new Error('Objet enregistré absent, ambigu ou différent de la saisie.')
 return result as T
}
