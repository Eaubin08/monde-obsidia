import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,readFileSync,writeFileSync,existsSync,mkdirSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {observeCssaSource} from '../server/cssa-source-observation.mjs'

test('missing source is UNKNOWN and observation never creates a file',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-source-'));const file=join(dir,'state.json')
 try{
  const result=observeCssaSource({people:[]},file,['people'])
  assert.equal(result._source.status,'MISSING');assert.equal(result._source.updatedAt,null)
  assert.equal(result._source.file,'state.json');assert.equal(existsSync(file),false)
 }finally{rmSync(dir,{recursive:true,force:true})}
})
test('valid empty source differs from missing; malformed JSON and schema remain UNKNOWN without repair',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-source-'));const file=join(dir,'state.json')
 try{
  writeFileSync(file,JSON.stringify({people:[],updatedAt:'2026-10-14T10:00:00Z'}))
  const empty=observeCssaSource({people:[]},file,['people'])
  assert.equal(empty._source.status,'AVAILABLE');assert.equal(empty._source.updatedAt,'2026-10-14T10:00:00Z')
  for(const content of ['{broken','null','[]','{"people":"not an array"}','{"people":[null]}']){
   writeFileSync(file,content)
   const result=observeCssaSource({people:[{id:'stale'}]},file,['people'])
   assert.equal(result._source.status,'INVALID');assert.deepEqual(result.people,[])
   assert.equal(readFileSync(file,'utf8'),content)
  }
 }finally{rmSync(dir,{recursive:true,force:true})}
})
test('unreadable source is UNKNOWN and missing Ops template never claims live presence',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-source-'));const file=join(dir,'state.json')
 try{
  const state={tasks:[{id:'seed'}]}
  const missing=observeCssaSource(state,file,['tasks'],{fallback:'TEMPLATE'})
  assert.equal(missing._source.status,'MISSING');assert.equal(missing._source.fallback,'TEMPLATE')
  assert.equal(missing.tasks[0].id,'seed');assert.ok(!('_source' in state))
  mkdirSync(file)
  const unreadable=observeCssaSource(state,file,['tasks'],{fallback:'TEMPLATE'})
  assert.equal(unreadable._source.status,'UNREADABLE');assert.deepEqual(unreadable.tasks,[])
 }finally{rmSync(dir,{recursive:true,force:true})}
})
