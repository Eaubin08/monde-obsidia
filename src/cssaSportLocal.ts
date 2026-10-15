import {readCssaTasks,type CssaTasksState} from './cssaTasksRead.ts'
import type {OpsTask} from './CSSAOpsWorkspace'
export type SportLocalState={notes:Record<string,string>;checks:Record<string,Record<string,boolean>>;reviewed:Record<string,boolean>;tasks:Record<string,unknown[]>;_source?:{status:string}}
export type SportPatch={notes?:Record<string,string>;checks?:Record<string,Record<string,boolean>>;reviewed?:Record<string,boolean>}
const record=(value:unknown):value is Record<string,unknown>=>Boolean(value&&typeof value==='object'&&!Array.isArray(value))
function validate(value:unknown):asserts value is SportLocalState{
 if(!record(value)||!['notes','checks','reviewed','tasks'].every(key=>record(value[key])))throw new Error('Registre Sportif invalide.')
 if(Object.values(value.notes as object).some(row=>typeof row!=='string')||Object.values(value.reviewed as object).some(row=>typeof row!=='boolean')||Object.values(value.tasks as object).some(row=>!Array.isArray(row))||Object.values(value.checks as object).some(row=>!record(row)||Object.values(row).some(item=>typeof item!=='boolean')))throw new Error('Champs Sportif invalides.')
}
export async function readCssaSportLocal(fetcher:typeof fetch=fetch):Promise<SportLocalState>{
 const response=await fetcher('/obsidia-local/cssa-sport-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source Sportif indisponible.')
 const state=await response.json();validate(state);return state
}
export async function writeCssaSportLocal(patch:SportPatch,fetcher:typeof fetch=fetch){
 if(!Object.keys(patch).length||Object.keys(patch).some(key=>!['notes','checks','reviewed'].includes(key)))throw new Error('Modification sportive invalide.')
 const current=await readCssaSportLocal(fetcher)
 if(!['AVAILABLE','MISSING'].includes(current._source?.status||''))throw new Error('Source Sportif invalide ou illisible : enregistrement bloqué.')
 const response=await fetcher('/obsidia-local/cssa-sport-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement sportif non confirmé.')
 const result=await response.json();validate(result)
 if(result._source?.status!=='AVAILABLE')throw new Error('Source sportive enregistrée non confirmée.')
 for(const [match,value] of Object.entries(patch.notes||{}))if(result.notes[match]!==value)throw new Error('Note non confirmée.')
 for(const [match,value] of Object.entries(patch.reviewed||{}))if(result.reviewed[match]!==value)throw new Error('Relecture non confirmée.')
 for(const [match,checks] of Object.entries(patch.checks||{}))for(const [key,value] of Object.entries(checks))if(result.checks[match]?.[key]!==value)throw new Error('Contrôle non confirmé.')
 return result
}
export function projectSportOpsTasks(state:CssaTasksState|null){
 const available=(state?._source as {status?:string}|undefined)?.status==='AVAILABLE'
 const tasks:Record<string,(OpsTask&{label:string;done:boolean;createdAt:string})[]>={}
 if(available)for(const task of state?.tasks||[]){
  if(!task.matchRef)continue
  const row={...task,label:task.title,done:task.status==='TERMINE',createdAt:task.history?.[0]?.at||''}
  tasks[task.matchRef]=[...(tasks[task.matchRef]||[]),row]
 }
 return {available,tasks}
}
export {readCssaTasks}
export function sportWeekendRanges(today:string){
 const date=new Date(today+'T12:00:00Z')
 const day=date.getUTCDay()
 const delta=day===0?-1:(6-day+7)%7
 const at=(offset:number)=>new Date(date.getTime()+(delta+offset)*86400000).toISOString().slice(0,10)
 return {current:[at(0),at(1)],previous:[at(-7),at(-6)]}
}
