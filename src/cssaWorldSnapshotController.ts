import {readCssaWorldSnapshot,type CssaWorldSnapshot} from './cssaWorldSnapshot.ts'

// UI-independent, read-only consumption boundary.
// Coalesce concurrent requests; never reuse a failed snapshot as current truth.
export type WorldSnapshotState={
 phase:'IDLE'|'LOADING'|'READY'|'DEGRADED'|'UNAVAILABLE'
 revision:number
 snapshot:CssaWorldSnapshot|null
 error:string|null
}
export type WorldSnapshotListener=(state:WorldSnapshotState)=>void
export function createCssaWorldSnapshotController(reader:()=>Promise<CssaWorldSnapshot>=()=>readCssaWorldSnapshot()){
 let state:WorldSnapshotState={phase:'IDLE',revision:0,snapshot:null,error:null}
 let pending:Promise<WorldSnapshotState>|null=null
 let generation=0
 const listeners=new Set<WorldSnapshotListener>()
 const publish=(next:WorldSnapshotState)=>{state=next;for(const listener of [...listeners])listener(state);return state}
 const read=():WorldSnapshotState=>state
 const subscribe=(listener:WorldSnapshotListener)=>{
  listeners.add(listener)
  listener(state)
  return ()=>{listeners.delete(listener)}
 }
 const refresh=():Promise<WorldSnapshotState>=>{
  if(pending)return pending
  const ticket=++generation
  publish({...state,phase:'LOADING',snapshot:null,error:null})
  const task=Promise.resolve().then(reader).then(snapshot=>{
   if(ticket!==generation)return state
   const statuses=Object.values(snapshot.sourceStatus)
   const phase:WorldSnapshotState['phase']=statuses.every(s=>s==='AVAILABLE')?'READY':statuses.some(s=>s==='AVAILABLE')?'DEGRADED':'UNAVAILABLE'
   return publish({phase,revision:state.revision+1,snapshot,error:null})
  }).catch((err:unknown)=>{
   if(ticket!==generation)return state
   return publish({phase:'UNAVAILABLE',revision:state.revision+1,snapshot:null,error:err instanceof Error?err.message:'SNAPSHOT_READ_FAILED'})
  }).finally(()=>{if(pending===task)pending=null})
  pending=task
  return task
 }
 const invalidate=()=>{
  generation++
  pending=null
  return publish({phase:'IDLE',revision:state.revision+1,snapshot:null,error:null})
 }
 return {read,subscribe,refresh,invalidate}
}
export type CssaWorldSnapshotController=ReturnType<typeof createCssaWorldSnapshotController>
