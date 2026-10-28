import {test} from 'node:test'
import assert from 'node:assert/strict'
import {planSoftwareComponent,generateSoftwareSource} from '../server/synthetic-software-generator.mjs'
import {testReviewedSourceInProcess} from '../server/reviewed-source-process-runner.mjs'
const make=(kind)=>generateSoftwareSource(planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId:'Demo1',organizationId:'LAB'}))
test('V57 three reviewed source templates pass separate-process behavior tests',async()=>{
 for(const kind of ['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR']){
  const result=await testReviewedSourceInProcess(make(kind))
  assert.equal(result.status,'PROCESS_TESTED_REVIEWED')
  assert.equal(result.processSeparated,true)
  assert.equal(result.osSandbox,false)
  assert.equal(result.executionAllowed,false)
  assert.ok(result.tests.every(x=>x.pass))
 }
})
test('V57 modified source is refused before any worker launches',async()=>{
 const artifact=make('PURE_TOOL')
 const result=await testReviewedSourceInProcess({...artifact,source:artifact.source+'\nconsole.log(1)'})
 assert.equal(result.status,'HOLD')
 assert.equal(result.reason,'UNREVIEWED_SOURCE')
 assert.equal(result.processSeparated,false)
})
test('V57 invalid request and timeout policy fail closed',async()=>{
 assert.equal((await testReviewedSourceInProcess(null)).status,'HOLD')
 const result=await testReviewedSourceInProcess(make('PURE_TOOL'),{timeoutMs:999999})
 assert.equal(result.reason,'INVALID_TIMEOUT')
})
