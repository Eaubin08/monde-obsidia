import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createCssaManualTask,deleteCssaTask} from '../src/cssaTaskLifecycle.ts'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
const task=()=>({id:'manual-stable',title:'Préparer les pièces',description:'Action saisie',status:'A_FAIRE',priority:'NORMALE',dueAt:'2026-10-20',origin:'ADMINISTRATION',structure:'cssa',team:null,matchRef:null,responsible:'UNKNOWN / NON ASSIGNÉ',responsiblePersonId:null,source:'Saisie interne',truthClass:'UNKNOWN',checklist:{},notes:'',history:[],relations:[],caseRef:null})
const state=()=>({tasks:[],cases:[],intendanceItems:[],_source:{status:'AVAILABLE'}})
const reply=data=>({ok:true,json:async()=>structuredClone(data)})
function fixture(missing=false){
 const root=mkdtempSync(join(tmpdir(),'cssa-task-life-'));const file=join(root,'ops.json')
 if(!missing)writeCssaOpsState({tasks:[]},file)
 let lose=false;let posts=0
 return {file,close:()=>rmSync(root,{recursive:true,force:true}),lose:()=>{lose=true},get posts(){return posts},fetch:async(_url,options)=>{
  if(options?.method==='POST'){
   posts++;const data=writeCssaOpsState(JSON.parse(options.body),file)
   if(lose){lose=false;throw Error('response lost after save')}
   return reply({...data,_source:{status:'AVAILABLE'}})
  }
  return reply({...readCssaOpsState(file),_source:{status:existsSync(file)?'AVAILABLE':'MISSING'}})
 }}
}
test('manual task initializes MISSING through the existing store and retains UNKNOWN',async()=>{
 const io=fixture(true)
 try{
  const result=await createCssaManualTask(task(),io.fetch)
  assert.equal(result.tasks.filter(row=>row.id===task().id).length,1)
  assert.equal(result.tasks.find(row=>row.id===task().id).truthClass,'UNKNOWN');assert.equal(io.posts,1)
 }finally{io.close()}
})
test('lost creation response retries without duplication or resetting status, priority, notes or assignment',async()=>{
 const io=fixture()
 try{
  io.lose();await assert.rejects(createCssaManualTask(task(),io.fetch))
  writeCssaOpsState({taskPatch:{id:task().id,status:'EN_COURS',priority:'HAUTE',notes:'travail poursuivi',responsiblePersonId:'p',responsible:'Alice'}},io.file)
  const before=readCssaOpsState(io.file).tasks[0]
  const result=await createCssaManualTask(task(),io.fetch)
  assert.equal(io.posts,1);assert.deepEqual(result.tasks,[before])
 }finally{io.close()}
})
test('creation collision with a different task refuses without overwriting',async()=>{
 let posts=0
 await assert.rejects(createCssaManualTask(task(),async(_url,options)=>{if(options?.method==='POST')posts++;return reply({...state(),tasks:[{...task(),title:'Autre travail'}]})}))
 assert.equal(posts,0)
})
test('confirmed deletion and retry after lost response remove only the requested task',async()=>{
 const io=fixture()
 try{
  writeCssaOpsState({tasks:[task(),{...task(),id:'other'}]},io.file)
  const before=readCssaOpsState(io.file)
  io.lose();await assert.rejects(deleteCssaTask(task().id,io.fetch))
  const result=await deleteCssaTask(task().id,io.fetch)
  assert.deepEqual(result.tasks,[{...task(),id:'other'}]);assert.equal(io.posts,1)
  assert.deepEqual(result.cases,before.cases);assert.deepEqual(result.intendanceItems,before.intendanceItems)
 }finally{io.close()}
})
test('invalid and unreadable source cannot initialize or delete; MISSING cannot delete templates',async()=>{
 for(const status of ['INVALID','UNREADABLE',undefined]){
  let posts=0;const fetcher=async(_url,options)=>{if(options?.method==='POST')posts++;return reply({...state(),_source:{status}})}
  await assert.rejects(createCssaManualTask(task(),fetcher));await assert.rejects(deleteCssaTask(task().id,fetcher));assert.equal(posts,0)
 }
 await assert.rejects(deleteCssaTask(task().id,async()=>reply({...state(),_source:{status:'MISSING'}})))
})
test('HTTP failure and unconfirmed create or delete responses never count as success',async()=>{
 for(const output of [{ok:false},reply(state()),reply({...state(),tasks:[task(),task()]}),reply({...state(),tasks:[{...task(),source:'changed'}]})])await assert.rejects(createCssaManualTask(task(),async(_url,options)=>options?.method==='POST'?output:reply(state())))
 for(const output of [{ok:false},reply({...state(),tasks:[task()]}),reply({...state(),_source:{status:'MISSING'}})])await assert.rejects(deleteCssaTask(task().id,async(_url,options)=>options?.method==='POST'?output:reply({...state(),tasks:[task()]})))
})
test('new task assignment resolves the current canonical person name before creation',async()=>{
 let sent
 const organisation={people:[{id:'p',displayName:'Nom actuel',status:'ACTIF'}],roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}}
 const result=await createCssaManualTask({...task(),responsiblePersonId:'p',responsible:'ancien nom'},async(url,options)=>{
  if(url.endsWith('cssa-organisation-state'))return reply(organisation)
  if(options?.method==='POST'){sent=JSON.parse(options.body).taskPatch;return reply({...state(),tasks:[sent]})}
  return reply(state())
 })
 assert.equal(result.tasks[0].responsible,'Nom actuel');assert.equal(sent.truthClass,'UNKNOWN')
})
