import {readCssaTasks,type CssaTasksState} from './cssaTasksRead.ts'
import {readCssaOrganisation} from './cssaOrganisationRead.ts'
import type {OpsTask} from './CSSAOpsWorkspace'
function sourceStatus(state:CssaTasksState){return (state._source as {status?:string}|undefined)?.status}
function validate(state:CssaTasksState,initializing=false){
 if((sourceStatus(state)!=='AVAILABLE'&&!(initializing&&sourceStatus(state)==='MISSING'))||!Array.isArray(state.cases)||!Array.isArray(state.intendanceItems))throw new Error('UNKNOWN · source Ops indisponible ou invalide.')
}
function equal(a:unknown,b:unknown):boolean{
 if(a===b)return true
 if(Array.isArray(a)&&Array.isArray(b))return a.length===b.length&&a.every((value,index)=>equal(value,b[index]))
 if(a&&b&&typeof a==='object'&&typeof b==='object')return Object.keys(a).length===Object.keys(b).length&&Object.keys(a).every(key=>Object.hasOwn(b,key)&&equal((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key]))
 return false
}
async function send(patch:Record<string,unknown>,fetcher:typeof fetch){
 const response=await fetcher('/obsidia-local/cssa-ops-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Opération tâche non confirmée.')
 const result=await readCssaTasks(async()=>response)
 validate(result)
 return result
}
export async function createCssaManualTask<T>(candidate:OpsTask,fetcher:typeof fetch=fetch):Promise<T>{
 if(!candidate.id||!candidate.title.trim())throw new Error('Tâche à créer invalide.')
 const current=await readCssaTasks(fetcher)
 validate(current,true)
 const existing=current.tasks.filter(task=>task.id===candidate.id)
 if(existing.length>1)throw new Error('Identifiant de tâche ambigu.')
 if(existing.length){
  // Retry only the same creation; do not reset progress, assignment, notes or priority.
  const identityFields=['title','description','source','origin','structure','matchRef','team','relations','caseRef'] as const
  if(sourceStatus(current)!=='AVAILABLE'||identityFields.some(key=>!equal(existing[0][key],candidate[key])))throw new Error('Cet identifiant désigne déjà une tâche différente. Ouvrez la tâche enregistrée avant de poursuivre.')
  return current as T
 }
 const task={...candidate}
 if(task.responsiblePersonId){
  const organisation=await readCssaOrganisation<{people:{id:string;displayName:string}[];_source?:{status:string}}>(fetcher)
  const people=organisation.people.filter(person=>person.id===task.responsiblePersonId)
  if(organisation._source?.status!=='AVAILABLE'||people.length!==1||!people[0].displayName)throw new Error('Responsable introuvable ou ambigu dans Organisation.')
  task.responsible=people[0].displayName
 }
 const result=await send({taskPatch:task},fetcher)
 const matches=result.tasks.filter(row=>row.id===task.id)
 // Creation history is produced by the existing store, not by the UI.
 if(matches.length!==1||Object.entries(task).some(([key,value])=>key!=='history'&&!equal((matches[0] as unknown as Record<string,unknown>)[key],value)))throw new Error('Création tâche absente, ambiguë ou différente de la saisie.')
 return result as T
}
export async function deleteCssaTask<T>(id:string,fetcher:typeof fetch=fetch):Promise<T>{
 if(!id)throw new Error('Identifiant tâche absent.')
 const current=await readCssaTasks(fetcher)
 validate(current)
 const matches=current.tasks.filter(task=>task.id===id)
 if(matches.length>1)throw new Error('Tâche ambiguë : suppression bloquée.')
 if(!matches.length)return current as T
 const result=await send({taskDeleteId:id},fetcher)
 if(result.tasks.some(task=>task.id===id))throw new Error('Suppression tâche non confirmée.')
 return result as T
}
