import {readCssaEconomy,validateCssaEconomy,finite} from './cssaEconomy.ts'
import {readCssaCrm} from './cssaCrmWrite.ts'
import {readCssaOrganisation} from './cssaOrganisationRead.ts'
import {cssaSourceAvailable} from './cssaLinkedReference.ts'
const lists={revenuePatch:'revenues',expensePatch:'expenses',stockPatch:'stockItems',supplierPatch:'suppliers',contractPatch:'contracts',invoicePatch:'invoices',paymentPatch:'payments',treasuryPatch:'treasuryEntries',assetPatch:'assets'} as const
type Row=Record<string,unknown>&{id:string}
const labels:Record<string,string>={revenues:'label',expenses:'label',stockItems:'label',suppliers:'name',contracts:'label',invoices:'label',payments:'account',treasuryEntries:'label',assets:'label'}
function unique(rows:unknown,id:unknown,label:string){
 if(!Array.isArray(rows))throw new Error(label+' : registre invalide.')
 const found=rows.filter(row=>row.id===id)
 if(found.length!==1)throw new Error(label+' : référence introuvable ou ambiguë.')
 return found[0] as Row
}
// Confirm declarations in the existing registry; no bank transfer or authority is inferred.
export async function writeCssaEconomy<T>(patch:Record<string,unknown>,fetcher:typeof fetch=fetch):Promise<T>{
 const entries=Object.entries(patch)
 if(entries.length!==1||!Object.hasOwn(lists,entries[0][0]))throw new Error('Modification économique invalide.')
 const [key,value]=entries[0],row=value as Row,list=lists[key as keyof typeof lists]
 if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id)throw new Error('Identifiant économique invalide.')
 const current=await readCssaEconomy(fetcher)
 if(!cssaSourceAvailable(current)&&current._source?.status!=='MISSING')throw new Error('Source économique invalide ou illisible.')
 const existing=current[list].filter(item=>item.id===row.id)
 if(existing.length>1)throw new Error('Objet économique ambigu.')
 if(!existing.length&&typeof row[labels[list]]!=='string')throw new Error('Objet économique absent : modification partielle bloquée.')
 for(const field of ['amount','quantity','threshold','unitCost','salePrice','value'])if(Object.hasOwn(row,field)&&row[field]!==null&&!finite(row[field]))throw new Error('Valeur économique invalide : '+field)
 const merged={...existing[0],...row} as Row
 const orgId=merged.partyOrganizationId||merged.organizationId
 if(orgId){const crm=await readCssaCrm<{organizations:Row[]}>(fetcher);if(!cssaSourceAvailable(crm))throw new Error('Source CRM indisponible.');unique(crm.organizations,orgId,'Organisme CRM')}
 const personId=merged.responsiblePersonId||merged.recordedByPersonId
 if(personId){const org=await readCssaOrganisation<{people:Row[]}>(fetcher);if(!cssaSourceAvailable(org))throw new Error('Source Organisation indisponible.');unique(org.people,personId,'Personne')}
 for(const [field,target] of [['dossierId','dossiers'],['invoiceId','invoices'],['paymentId','payments'],['supplierId','suppliers']] as const){
  if(merged[field]){
   if(!cssaSourceAvailable(current))throw new Error('Source métier indisponible pour le lien '+field)
   const linked=unique((current as unknown as Record<string,unknown>)[target],merged[field],field)
   if(field==='invoiceId'&&(!['EMISE','RECUE'].includes(String(linked.direction))||merged.direction!==(linked.direction==='EMISE'?'ENTREE':'SORTIE')))throw new Error('Sens du paiement incompatible avec la facture liée.')
  }
 }
 const confirmed=(state:typeof current)=>{
  const matches=state[list].filter(item=>item.id===row.id)
  return matches.length===1&&Object.entries(row).every(([field,wanted])=>(matches[0] as unknown as Row)[field]===wanted)
 }
 if(cssaSourceAvailable(current)&&confirmed(current))return current as T
 if(existing.length&&Object.hasOwn(row,labels[list]))throw new Error('Identifiant déjà utilisé pour un objet différent : saisie conservée.')
 const response=await fetcher('/obsidia-local/cssa-business-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement économique non confirmé.')
 const result=await response.json();validateCssaEconomy(result)
 if(!cssaSourceAvailable(result)||!confirmed(result))throw new Error('Objet économique absent, ambigu ou différent de la saisie.')
 return result as T
}
