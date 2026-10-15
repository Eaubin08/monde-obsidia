import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {updateCssaTask} from '../src/cssaTaskUpdate.ts'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
const task=()=>({id:'t',title:'Assurance',status:'A_FAIRE',priority:'NORMALE',origin:'ADMINISTRATION',notes:'consigne',checklist:{proof:false,other:false},source:'UNKNOWN',truthClass:'CONTRADICTORY',relations:[{type:'DOSSIER',targetId:'d'}],history:[]})
const base=()=>({tasks:[task()],cases:[],intendanceItems:[],_source:{status:'AVAILABLE'}})
const reply=state=>({ok:true,json:async()=>structuredClone(state)})
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cssa-task-confirm-'));const file=join(root,'ops.json')
 writeCssaOpsState({tasks:[task()]},file)
 let lost=false;let posts=0;const sent=[]
 return {file,sent,close:()=>rmSync(root,{recursive:true,force:true}),lose:()=>{lost=true},get posts(){return posts},fetch:async(_url,options)=>{
  if(options?.method==='POST'){
   posts++;sent.push(JSON.parse(options.body));const state=writeCssaOpsState(sent.at(-1),file)
   if(lost){lost=false;throw Error('response lost')}
   return reply({...state,_source:{status:'AVAILABLE'}})
  }
  return reply({...readCssaOpsState(file),_source:{status:'AVAILABLE'}})
 }}
}
test('status, priority and notes are confirmed against the real store and send only requested fields',async()=>{
 const io=fixture()
 try{
  for(const change of [{kind:'STATUS',value:'TERMINE'},{kind:'PRIORITY',value:'HAUTE'},{kind:'NOTES',value:'Nouvelle consigne'}])await updateCssaTask('t',change,io.fetch)
  const result=readCssaOpsState(io.file).tasks[0]
  assert.equal(result.status,'TERMINE');assert.equal(result.priority,'HAUTE');assert.equal(result.notes,'Nouvelle consigne')
  assert.equal(result.truthClass,'CONTRADICTORY');assert.equal(result.source,'UNKNOWN');assert.deepEqual(result.relations,task().relations);assert.equal(result.history.length,3)
  assert.deepEqual(io.sent.map(p=>Object.keys(p.taskPatch).sort()),[['id','status'],['id','priority'],['id','notes']])
 }finally{io.close()}
})
test('checklist uses the current registry and preserves another point changed since display',async()=>{
 const io=fixture()
 try{
  writeCssaOpsState({taskPatch:{id:'t',checklist:{proof:false,other:true,newPoint:true}}},io.file)
  const result=await updateCssaTask('t',{kind:'CHECKLIST',key:'proof',value:true},io.fetch)
  assert.deepEqual(result.tasks[0].checklist,{proof:true,other:true,newPoint:true})
  assert.equal(result.tasks[0].status,'A_FAIRE')
 }finally{io.close()}
})
test('retry after a lost response observes the desired value without a second write or history entry',async()=>{
 const io=fixture()
 try{
  io.lose();await assert.rejects(updateCssaTask('t',{kind:'CHECKLIST',key:'proof',value:true},io.fetch))
  const result=await updateCssaTask('t',{kind:'CHECKLIST',key:'proof',value:true},io.fetch)
  assert.equal(result.tasks[0].checklist.proof,true);assert.equal(io.posts,1);assert.equal(result.tasks[0].history.length,1)
 }finally{io.close()}
})
test('responsible person uses current canonical identity, not a stale display name or role',async()=>{
 let sent
 const organisation={people:[{id:'p',displayName:'Current name',status:'INACTIF'}],roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}}
 const result=await updateCssaTask('t',{kind:'RESPONSIBLE',personId:'p'},async(url,options)=>{
  if(url.endsWith('cssa-organisation-state'))return reply(organisation)
  if(options?.method==='POST'){sent=JSON.parse(options.body);return reply({...base(),tasks:[{...task(),...sent.taskPatch}]})}
  return reply(base())
 })
 assert.equal(result.tasks[0].responsible,'Current name');assert.equal(organisation.people[0].status,'INACTIF');assert.deepEqual(Object.keys(sent.taskPatch).sort(),['id','responsible','responsiblePersonId'])
})
test('missing, invalid and unreadable sources, removed or ambiguous tasks and removed checklist keys block writes',async()=>{
 for(const state of ['MISSING','INVALID','UNREADABLE'].map(status=>({...base(),_source:{status}})).concat([{...base(),tasks:[]},{...base(),tasks:[task(),task()]}])){
  let posts=0;await assert.rejects(updateCssaTask('t',{kind:'STATUS',value:'TERMINE'},async(_url,options)=>{if(options?.method==='POST')posts++;return reply(state)}));assert.equal(posts,0)
 }
 await assert.rejects(updateCssaTask('t',{kind:'CHECKLIST',key:'removed',value:true},async()=>reply(base())))
})
test('HTTP failure and stale, duplicate or unavailable response cannot confirm a task update',async()=>{
 for(const output of [{ok:false},reply(base()),reply({...base(),tasks:[{...task(),status:'TERMINE'},{...task(),status:'TERMINE'}]}),reply({...base(),tasks:[{...task(),status:'TERMINE'}],_source:{status:'MISSING'}})])await assert.rejects(updateCssaTask('t',{kind:'STATUS',value:'TERMINE'},async(_url,options)=>options?.method==='POST'?output:reply(base())))
})
test('unavailable, removed or duplicate canonical people cannot be assigned',async()=>{
 for(const people of [[],[{id:'p',displayName:'Alice',status:'ACTIF'},{id:'p',displayName:'Alice',status:'ACTIF'}]]){
  let posts=0;await assert.rejects(updateCssaTask('t',{kind:'RESPONSIBLE',personId:'p'},async(url,options)=>{
   if(options?.method==='POST')posts++
   return reply(url.endsWith('cssa-organisation-state')?{people,roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}}:base())
  }));assert.equal(posts,0)
 }
})
