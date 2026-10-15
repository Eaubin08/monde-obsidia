import type {OpsTask} from './CSSAOpsWorkspace'
export type CssaTasksState={tasks:OpsTask[];[key:string]:unknown}
// Keep source metadata for the notice; a successful HTTP response is not live availability.
export async function readCssaTasks(fetcher:typeof fetch=fetch):Promise<CssaTasksState>{
 const response=await fetcher('/obsidia-local/cssa-ops-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source tâches indisponible')
 const state=await response.json()
 if(!state||typeof state!=='object'||Array.isArray(state)||!Array.isArray(state.tasks)||state.tasks.some((task:unknown)=>!task||typeof task!=='object'||Array.isArray(task)||['id','title','status','priority','origin'].some(key=>typeof (task as Record<string,unknown>)[key]!=='string')))throw new Error('Registre tâches invalide')
 return state
}
