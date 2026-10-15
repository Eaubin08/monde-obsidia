import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaIntendance,updateCssaIntendance} from '../src/cssaIntendanceUpdate.ts'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
const item=()=>({id:'i',category:'MATERIEL',title:'Tablette',matchRef:'r1-j7',venue:'Stade',status:'UNKNOWN',notes:'à vérifier',truthClass:'CONTRADICTORY',linkedTaskId:'t',responsiblePersonId:null})
const state=()=>({tasks:[],cases:[],intendanceItems:[item()],_source:{status:'AVAILABLE'}})
const reply=data=>({ok:true,json:async()=>structuredClone(data)})
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cssa-intendance-'));const file=join(root,'ops.json')
 writeCssaOpsState({intendanceItems:[item()]},file)
 let lost=false;let posts=0;const sent=[]
 return {file,sent,close:()=>rmSync(root,{recursive:true,force:true}),lose:()=>{lost=true},get posts(){return posts},fetch:async(_url,options)=>{
  if(options?.method==='POST'){
   posts++;sent.push(JSON.parse(options.body));const data=writeCssaOpsState(sent.at(-1),file)
   if(lost){lost=false;throw Error('response lost')}
   return reply({...data,_source:{status:'AVAILABLE'}})
  }
  return reply({...readCssaOpsState(file),_source:{status:'AVAILABLE'}})
 }}
}
test('real store status and note updates preserve match, task link, truth class and other Ops objects',async()=>{
 const io=fixture()
 try{
  const before=readCssaOpsState(io.file)
  await updateCssaIntendance('i',{kind:'STATUS',value:'CONFIRMÉ'},io.fetch)
  const result=await updateCssaIntendance('i',{kind:'NOTES',value:'Contrôle déclaré'},io.fetch)
  assert.deepEqual(result.intendanceItems,[{...item(),status:'CONFIRMÉ',notes:'Contrôle déclaré'}])
  assert.deepEqual(result.tasks,before.tasks);assert.deepEqual(result.cases,before.cases)
  assert.deepEqual(io.sent.map(p=>Object.keys(p.intendancePatch).sort()),[['id','status'],['id','notes']])
 }finally{io.close()}
})
test('lost response retries a desired status without another write',async()=>{
 const io=fixture()
 try{
  io.lose();await assert.rejects(updateCssaIntendance('i',{kind:'STATUS',value:'EN ATTENTE'},io.fetch))
  const result=await updateCssaIntendance('i',{kind:'STATUS',value:'EN ATTENTE'},io.fetch)
  assert.equal(result.intendanceItems[0].status,'EN ATTENTE');assert.equal(io.posts,1)
 }finally{io.close()}
})
test('responsible assignment checks the unique canonical id without promoting inactive person or changing logistical status',async()=>{
 const person={id:'p',displayName:'Alice',status:'INACTIF'};let sent
 const result=await updateCssaIntendance('i',{kind:'RESPONSIBLE',personId:'p'},async(url,options)=>{
  if(url.endsWith('cssa-organisation-state'))return reply({people:[person],roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}})
  if(options?.method==='POST'){sent=JSON.parse(options.body);return reply({...state(),intendanceItems:[{...item(),...sent.intendancePatch}]})}
  return reply(state())
 })
 assert.equal(result.intendanceItems[0].responsiblePersonId,'p');assert.equal(result.intendanceItems[0].status,'UNKNOWN');assert.equal(person.status,'INACTIF');assert.deepEqual(Object.keys(sent.intendancePatch).sort(),['id','responsiblePersonId'])
})
test('missing, invalid or unreadable Ops, removed or ambiguous item cannot be modified',async()=>{
 for(const data of ['MISSING','INVALID','UNREADABLE'].map(status=>({...state(),_source:{status}})).concat([{...state(),intendanceItems:[]},{...state(),intendanceItems:[item(),item()]}])){
  let posts=0
  await assert.rejects(updateCssaIntendance('i',{kind:'STATUS',value:'CONFIRMÉ'},async(_url,options)=>{if(options?.method==='POST')posts++;return reply(data)}))
  assert.equal(posts,0)
 }
})
test('HTTP error, wrong value, duplicate item or unavailable response cannot confirm a change',async()=>{
 for(const output of [{ok:false},reply(state()),reply({...state(),intendanceItems:[{...item(),notes:'new'},{...item(),notes:'new'}]}),reply({...state(),intendanceItems:[{...item(),notes:'new'}],_source:{status:'MISSING'}})])await assert.rejects(updateCssaIntendance('i',{kind:'NOTES',value:'new'},async(_url,options)=>options?.method==='POST'?output:reply(state())))
})
test('unavailable, removed and ambiguous canonical person references block assignment',async()=>{
 for(const [people,status] of [[[],'AVAILABLE'],[[{id:'p',displayName:'Alice',status:'ACTIF'}],'MISSING'],[[{id:'p',displayName:'Alice',status:'ACTIF'},{id:'p',displayName:'Alice',status:'ACTIF'}],'AVAILABLE']]){
  let posts=0
  await assert.rejects(updateCssaIntendance('i',{kind:'RESPONSIBLE',personId:'p'},async(url,options)=>{
   if(options?.method==='POST')posts++
   return reply(url.endsWith('cssa-organisation-state')?{people,roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status}}:state())
  }));assert.equal(posts,0)
 }
})
test('reader preserves source metadata and rejects malformed items rather than presenting empty preparation',async()=>{
 const missing={...state(),_source:{status:'MISSING'}}
 assert.deepEqual(await readCssaIntendance(async()=>reply(missing)),missing)
 for(const intendanceItems of [undefined,{},[null],[{id:'i'}]])await assert.rejects(readCssaIntendance(async()=>reply({...state(),intendanceItems})))
})
