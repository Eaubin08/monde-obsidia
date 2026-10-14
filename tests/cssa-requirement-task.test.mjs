import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createCssaRequirementTask} from '../src/cssaRequirementTask.ts'
const req={id:'r1',dossierId:'d1',label:'Assurance',source:'RC clause 4',state:'A_VERIFIER',owner:'UNKNOWN'}
const draft={id:'candidate',title:'Old label',status:'A_FAIRE',relations:[{type:'DOSSIER',targetId:'d1'},{type:'REQUIREMENT',targetId:'r1'}]}
function fixture(options={}){
 const state={dossiers:[{id:'d1'}],requirements:[structuredClone(req)],tasks:[]};const calls=[]
 let failed=Boolean(options.failLinkOnce)
 const request=async(url,init={})=>{
  const isOps=url.endsWith('cssa-ops-state');const list=isOps?'tasks':'requirements';calls.push({list,method:init.method||'GET'})
  if(init.method==='POST'){
   if(isOps&&options.failTask)return new Response('{}',{status:500})
   if(!isOps&&failed){failed=false;return new Response('{}',{status:500})}
   const patch=JSON.parse(init.body);const item=isOps?patch.taskPatch:patch.requirementPatch
   const existing=state[list].findIndex(x=>x.id===item.id)
   if(existing<0)state[list].push(item);else state[list][existing]={...state[list][existing],...item}
   if(isOps&&options.mutateRequirement)state.requirements[0].state='SATISFAIT'
  }
  return Response.json({_source:{status:options.invalidOps&&isOps?'INVALID':'AVAILABLE'},[list]:state[list],...(!isOps?{dossiers:state.dossiers}:{})})
 }
 return {state,calls,request}
}
test('a failed task write never creates a requirement link',async()=>{
 const f=fixture({failTask:true});const result=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(result.ok,false);assert.equal(result.taskConfirmed,false)
 assert.ok(!f.state.requirements[0].taskRefId)
 assert.ok(!f.calls.some(x=>x.list==='requirements'&&x.method==='POST'))
})
test('successful task/link creation preserves requirement state and uses fresh source fields',async()=>{
 const f=fixture({mutateRequirement:true});const result=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(result.ok,true);assert.equal(f.state.tasks.length,1)
 assert.equal(f.state.tasks[0].id,'task-dossier-r1');assert.equal(f.state.tasks[0].title,'Assurance')
 assert.equal(f.state.tasks[0].source,'RC clause 4');assert.equal(f.state.requirements[0].state,'SATISFAIT')
 assert.equal(f.state.requirements[0].taskRefId,'task-dossier-r1')
})
test('retry after a failed link reuses the task without resetting progress or duplicating',async()=>{
 const f=fixture({failLinkOnce:true})
 const first=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(first.ok,false);assert.equal(first.taskConfirmed,true);assert.equal(f.state.tasks.length,1)
 assert.ok(!f.state.requirements[0].taskRefId)
 f.state.tasks[0].status='EN_COURS'
 const second=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(second.ok,true);assert.equal(f.state.tasks.length,1)
 assert.equal(f.state.tasks[0].status,'EN_COURS')
 assert.equal(f.calls.filter(x=>x.list==='tasks'&&x.method==='POST').length,1)
})
test('an already linked task performs no new writes',async()=>{
 const f=fixture();await createCssaRequirementTask(req,draft,f.request);f.calls.length=0
 const result=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(result.ok,true);assert.ok(f.calls.every(x=>x.method==='GET'))
})
test('ambiguous related tasks and invalid source fail without selecting an arbitrary task',async()=>{
 const f=fixture();f.state.tasks.push({...draft,id:'t1'},{...draft,id:'t2'})
 assert.equal((await createCssaRequirementTask(req,draft,f.request)).ok,false)
 assert.ok(f.calls.every(x=>x.method==='GET'))
 const invalid=fixture({invalidOps:true})
 assert.equal((await createCssaRequirementTask(req,draft,invalid.request)).ok,false)
 assert.ok(invalid.calls.every(x=>x.method==='GET'))
})
test('broken existing reference is preserved rather than silently replaced',async()=>{
 const f=fixture();f.state.requirements[0].taskRefId='gone'
 assert.equal((await createCssaRequirementTask(req,draft,f.request)).ok,false)
 assert.equal(f.state.requirements[0].taskRefId,'gone');assert.ok(f.calls.every(x=>x.method==='GET'))
})

test('a removed dossier prevents task creation and leaves the requirement untouched',async()=>{
 const f=fixture();f.state.dossiers=[]
 const result=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(result.ok,false);assert.equal(f.state.tasks.length,0)
 assert.ok(f.calls.every(x=>x.method==='GET'))
})
test('an occupied deterministic id with unrelated relations is never overwritten',async()=>{
 const f=fixture();f.state.tasks=[{id:'task-dossier-r1',status:'EN_COURS',relations:[]}]
 const result=await createCssaRequirementTask(req,draft,f.request)
 assert.equal(result.ok,false);assert.equal(f.state.tasks[0].status,'EN_COURS')
 assert.ok(f.calls.every(x=>x.method==='GET'))
})
