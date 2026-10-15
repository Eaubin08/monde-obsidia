import {readCssaTasks} from './cssaTasksRead.ts'
import {readCssaOrganisation} from './cssaOrganisationRead.ts'
import type {IntendanceItem} from './CSSAOpsWorkspace'
type IntendanceState={intendanceItems:IntendanceItem[];_source?:{status:string}}
export type IntendanceChange={kind:'STATUS';value:IntendanceItem['status']}|{kind:'NOTES';value:string}|{kind:'RESPONSIBLE';personId:string|null}
export async function readCssaIntendance<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const state=await readCssaTasks(fetcher)
 if(!Array.isArray(state.cases)||!Array.isArray(state.intendanceItems)||state.intendanceItems.some(row=>!row||typeof row!=='object'||Array.isArray(row)||['id','category','title','matchRef','venue','status','notes','truthClass'].some(key=>typeof (row as Record<string,unknown>)[key]!=='string')))throw new Error('Registre Intendance invalide.')
 return state as T
}
function available(state:IntendanceState){
 if(state._source?.status!=='AVAILABLE')throw new Error('UNKNOWN · source Intendance indisponible ou invalide.')
}
// A confirmed logistical status is a registry entry, never an execution authorization.
export async function updateCssaIntendance<T>(id:string,change:IntendanceChange,fetcher:typeof fetch=fetch):Promise<T>{
 const current=await readCssaIntendance<IntendanceState>(fetcher)
 available(current)
 const rows=current.intendanceItems.filter(item=>item.id===id)
 if(rows.length!==1)throw new Error('Élément Intendance introuvable ou ambigu.')
 const patch:Record<string,unknown>={id}
 switch(change.kind){
  case 'STATUS':
   if(!['CONFIRMÉ','À PRÉPARER','EN ATTENTE','UNKNOWN'].includes(change.value))throw new Error('Statut Intendance invalide.')
   patch.status=change.value;break
  case 'NOTES':
   if(typeof change.value!=='string')throw new Error('Note invalide.')
   patch.notes=change.value;break
  case 'RESPONSIBLE':
   if(change.personId){
    const organisation=await readCssaOrganisation<{_source?:{status:string};people:{id:string}[]}>(fetcher)
    if(organisation._source?.status!=='AVAILABLE'||organisation.people.filter(person=>person.id===change.personId).length!==1)throw new Error('Responsable introuvable ou ambigu dans Organisation.')
   }
   patch.responsiblePersonId=change.personId||null;break
  default:throw new Error('Modification Intendance invalide.')
 }
 const confirmed=(state:IntendanceState)=>{
  const matches=state.intendanceItems.filter(item=>item.id===id)
  return matches.length===1&&Object.entries(patch).every(([key,value])=>(matches[0] as unknown as Record<string,unknown>)[key]===value)
 }
 if(confirmed(current))return current as T
 const response=await fetcher('/obsidia-local/cssa-ops-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({intendancePatch:patch}),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Modification Intendance non confirmée.')
 const result=await readCssaIntendance<IntendanceState>(async()=>response)
 available(result)
 if(!confirmed(result))throw new Error('Modification Intendance absente, ambiguë ou différente de la demande.')
 return result as T
}
