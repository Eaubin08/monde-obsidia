import {readCssaBusiness,validateCssaBusinessState} from './cssaBusinessRead.ts'
const collections={dossierPatch:'dossiers',requirementPatch:'requirements',documentRefPatch:'documentRefs',validationPatch:'validations',submissionProofPatch:'submissionProofs',dossierOutcomePatch:'dossierOutcomes'} as const
const creationFields:Record<string,string[]>={dossiers:['title','reference','status'],requirements:['dossierId','label'],documentRefs:['title','type'],validations:['dossierId','type'],submissionProofs:['dossierId','proofRef'],dossierOutcomes:['dossierId','result','proofRef']}
type Row=Record<string,unknown>&{id:string}
function equal(a:unknown,b:unknown):boolean{
 if(a===b)return true
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((value,index)=>equal(value,b[index]))
 if(a&&b&&typeof a==='object'&&typeof b==='object'){
  const left=Object.keys(a);const right=Object.keys(b)
  return left.length===right.length&&left.every(key=>Object.hasOwn(b,key)&&equal((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key]))
 }
 return false
}
// Confirm the existing local patch protocol. Recording a proof reference does not verify its contents.
export async function writeCssaBusinessPatch<T>(patch:Record<string,unknown>,fetcher:typeof fetch=fetch):Promise<T>{
 const entries=Object.entries(patch)
 if(!entries.length)throw new Error('Modification métier vide.')
 const operations=entries.map(([key,value])=>{
  if(!Object.hasOwn(collections,key)||!value||typeof value!=='object'||Array.isArray(value)||typeof (value as Row).id!=='string'||!(value as Row).id)throw new Error('Modification métier invalide.')
  return {list:collections[key as keyof typeof collections],row:value as Row}
 })
 const current=await readCssaBusiness<Record<string,unknown>>(fetcher)
 const source=(current._source as {status?:string}|undefined)?.status
 if(source!=='AVAILABLE'&&source!=='MISSING')throw new Error('Source métier invalide ou illisible : enregistrement bloqué.')
 for(const {list,row} of operations){
  const existing=(current[list] as Row[]).filter(item=>item.id===row.id)
  if(!existing.length&&creationFields[list].some(field=>typeof row[field]!=='string'))throw new Error('Objet métier introuvable : modification partielle bloquée.')
  if(existing.length>1)throw new Error('Objet métier ambigu : enregistrement bloqué.')
  const dossierId=row.dossierId??existing[0]?.dossierId
  if(dossierId){
   const dossiers=(current.dossiers as Row[]).filter(item=>item.id===dossierId)
   if(dossiers.length!==1)throw new Error('Dossier lié introuvable ou ambigu dans la source actuelle.')
  }
 }
 const response=await fetcher('/obsidia-local/cssa-business-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement métier non confirmé.')
 const result=await response.json()
 validateCssaBusinessState(result)
 if((result._source as {status?:string}|undefined)?.status!=='AVAILABLE')throw new Error('Source métier enregistrée non confirmée.')
 for(const {list,row} of operations){
  const matches=(result[list] as Row[]).filter(item=>item.id===row.id)
  if(matches.length!==1||Object.entries(row).some(([field,value])=>!equal(matches[0][field],value)))throw new Error('Objet métier enregistré absent, ambigu ou différent de la saisie.')
 }
 return result as T
}
