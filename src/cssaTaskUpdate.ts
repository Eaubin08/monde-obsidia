import {readCssaTasks,type CssaTasksState} from './cssaTasksRead.ts'
import {readCssaOrganisation} from './cssaOrganisationRead.ts'
import type {TaskStatus,TaskPriority} from './CSSAOpsWorkspace'
export type TaskChange={kind:'STATUS';value:TaskStatus}|{kind:'PRIORITY';value:TaskPriority}|{kind:'CHECKLIST';key:string;value:boolean}|{kind:'NOTES';value:string}|{kind:'RESPONSIBLE';personId:string|null}
function available(state:CssaTasksState){
 if((state._source as {status?:string}|undefined)?.status!=='AVAILABLE'||!Array.isArray(state.cases)||!Array.isArray(state.intendanceItems))throw new Error('UNKNOWN · source Ops indisponible ou invalide.')
}
function same(a:unknown,b:unknown):boolean{
 if(a===b)return true
 if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
  const keys=Object.keys(a)
  return keys.length===Object.keys(b).length&&keys.every(key=>Object.hasOwn(b,key)&&(a as Record<string,unknown>)[key]===(b as Record<string,unknown>)[key])
 }
 return false
}
// Update only requested fields. The store retains its history and all independent business links.
export async function updateCssaTask<T>(id:string,change:TaskChange,fetcher:typeof fetch=fetch):Promise<T>{
 const current=await readCssaTasks(fetcher)
 available(current)
 const matches=current.tasks.filter(task=>task.id===id)
 if(matches.length!==1)throw new Error('Tâche introuvable ou ambiguë dans la source actuelle.')
 const task=matches[0]
 const patch:Record<string,unknown>={id}
 switch(change.kind){
  case 'STATUS':
   if(!['A_FAIRE','EN_COURS','EN_ATTENTE','BLOQUE','TERMINE'].includes(change.value))throw new Error('Statut tâche invalide.')
   patch.status=change.value;break
  case 'PRIORITY':
   if(!['CRITIQUE','HAUTE','NORMALE','BASSE'].includes(change.value))throw new Error('Priorité tâche invalide.')
   patch.priority=change.value;break
  case 'CHECKLIST':
   if(!task.checklist||typeof task.checklist!=='object'||Array.isArray(task.checklist)||!Object.hasOwn(task.checklist,change.key)||typeof task.checklist[change.key]!=='boolean'||typeof change.value!=='boolean')throw new Error('Point de checklist introuvable ou invalide.')
   patch.checklist={...task.checklist,[change.key]:change.value};break
  case 'NOTES':
   if(typeof change.value!=='string')throw new Error('Note invalide.')
   patch.notes=change.value;break
  case 'RESPONSIBLE':
   if(change.personId){
    const organisation=await readCssaOrganisation<{_source?:{status:string};people:{id:string;displayName:string}[]}>(fetcher)
    const people=organisation.people.filter(person=>person.id===change.personId)
    if(organisation._source?.status!=='AVAILABLE'||people.length!==1||!people[0].displayName)throw new Error('Personne introuvable ou ambiguë dans Organisation.')
    patch.responsiblePersonId=change.personId;patch.responsible=people[0].displayName
   }else{patch.responsiblePersonId=null;patch.responsible='UNKNOWN / NON ASSIGNÉ'}
   break
  default:throw new Error('Modification tâche invalide.')
 }
 const confirmed=(state:CssaTasksState)=>{
  const rows=state.tasks.filter(row=>row.id===id)
  return rows.length===1&&Object.entries(patch).every(([key,value])=>same((rows[0] as unknown as Record<string,unknown>)[key],value))
 }
 // A retry whose desired fields are already present needs no second write or history entry.
 if(confirmed(current))return current as T
 const response=await fetcher('/obsidia-local/cssa-ops-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskPatch:patch}),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Modification tâche non confirmée.')
 const result=await readCssaTasks(async()=>response)
 available(result)
 if(!confirmed(result))throw new Error('Modification tâche absente, ambiguë ou différente de la demande.')
 return result as T
}
