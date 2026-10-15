import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaSportLocal,writeCssaSportLocal,projectSportOpsTasks,sportWeekendRanges} from '../src/cssaSportLocal.ts'
import {readCssaSportState,writeCssaSportState} from '../server/cssa-sport-store.mjs'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
import {observeCssaSource} from '../server/cssa-source-observation.mjs'
const maps=['notes','checks','reviewed','tasks']
const empty=()=>({notes:{},checks:{},reviewed:{},tasks:{},_source:{status:'AVAILABLE'}})
const reply=value=>({ok:true,json:async()=>structuredClone(value)})
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cssa-sport-local-'));const file=join(root,'sport.json'),ops=join(root,'ops.json')
 return {file,ops,close:()=>rmSync(root,{recursive:true,force:true}),fetch:async(_url,options)=>{
  const state=options?.method==='POST'?writeCssaSportState(JSON.parse(options.body),file,ops):readCssaSportState(file,ops)
  return reply(observeCssaSource(state,file,[],{maps}))
 }}
}
test('missing and malformed Sport source remain UNKNOWN without repair or mutation',async()=>{
 const io=fixture()
 try{
  assert.equal((await readCssaSportLocal(io.fetch))._source.status,'MISSING')
  writeFileSync(io.file,'invalid-json')
  assert.equal((await readCssaSportLocal(io.fetch))._source.status,'INVALID')
  await assert.rejects(writeCssaSportLocal({notes:{m:'note'}},io.fetch))
  assert.equal(readFileSync(io.file,'utf8'),'invalid-json')
 }finally{io.close()}
})
test('map schema rejects arrays and nested invalid values, preserving available empty vs unavailable source',async()=>{
 for(const invalid of [{...empty(),checks:[]},{...empty(),notes:{m:1}},{...empty(),checks:{m:{check:'yes'}}},{...empty(),reviewed:{m:'yes'}}])await assert.rejects(readCssaSportLocal(async()=>reply(invalid)))
 const io=fixture()
 try{
  writeFileSync(io.file,JSON.stringify({...empty(),notes:[]}))
  assert.equal((await readCssaSportLocal(io.fetch))._source.status,'INVALID')
  assert.equal((await readCssaSportLocal(async()=>reply(empty())))._source.status,'AVAILABLE')
 }finally{io.close()}
})
test('real Sport store confirms narrow notes/check/review patches and keeps other matches intact',async()=>{
 const io=fixture()
 try{
  await writeCssaSportLocal({notes:{m1:'source UNKNOWN',m2:'autre note'},checks:{m1:{fmi:true,transport:false}},reviewed:{m1:false}},io.fetch)
  const result=await writeCssaSportLocal({checks:{m1:{transport:true}},reviewed:{m1:true}},io.fetch)
  assert.deepEqual(result.checks.m1,{fmi:true,transport:true});assert.equal(result.notes.m2,'autre note');assert.equal(result.reviewed.m1,true)
 }finally{io.close()}
})
test('saving a sporting note does not copy Ops tasks into Sport or rewrite their progress',async()=>{
 const io=fixture()
 try{
  writeCssaOpsState({tasks:[{id:'task',title:'Assurance',matchRef:'m1',status:'EN_COURS',priority:'HAUTE',origin:'SPORTIF',source:'UNKNOWN',history:[]}]},io.ops)
  const before=readFileSync(io.ops,'utf8')
  await writeCssaSportLocal({notes:{m1:'consigne'}},io.fetch)
  assert.deepEqual(JSON.parse(readFileSync(io.file,'utf8')).tasks,{})
  assert.equal(readFileSync(io.ops,'utf8'),before)
  assert.equal(readCssaOpsState(io.ops).tasks[0].status,'EN_COURS')
 }finally{io.close()}
})
test('sporting task projection uses explicit Ops match refs only and retains provenance, status and ambiguity',()=>{
 const rows=[{id:'a',title:'Action',matchRef:'m1',status:'EN_COURS',source:'UNKNOWN',truthClass:'CONTRADICTORY'},{id:'b',title:'m1',matchRef:null,status:'TERMINE'},{id:'a',title:'Contradiction',matchRef:'m1',status:'TERMINE'}]
 const before=JSON.stringify(rows)
 const view=projectSportOpsTasks({tasks:rows,_source:{status:'AVAILABLE'}})
 assert.equal(view.tasks.m1.length,2);assert.equal(view.tasks.m1[0].done,false);assert.equal(view.tasks.m1[1].done,true);assert.equal(view.tasks.m1[0].truthClass,'CONTRADICTORY');assert.equal(JSON.stringify(rows),before)
 assert.deepEqual(projectSportOpsTasks({tasks:rows,_source:{status:'MISSING'}}),{available:false,tasks:{}})
})
test('HTTP and unconfirmed Sport responses never imply a saved checklist or note',async()=>{
 for(const output of [{ok:false},reply(empty()),reply({...empty(),notes:{m:'different'}}),reply({...empty(),notes:{m:'note'},_source:{status:'MISSING'}})])await assert.rejects(writeCssaSportLocal({notes:{m:'note'}},async(_url,options)=>options?.method==='POST'?output:reply(empty())))
})
test('weekend filters use the current date across Sundays and month/year boundaries',()=>{
 assert.deepEqual(sportWeekendRanges('2026-10-15'),{current:['2026-10-17','2026-10-18'],previous:['2026-10-10','2026-10-11']})
 assert.deepEqual(sportWeekendRanges('2026-10-18').current,['2026-10-17','2026-10-18'])
 assert.deepEqual(sportWeekendRanges('2026-12-31').current,['2027-01-02','2027-01-03'])
})
