import {test} from 'node:test'
import assert from 'node:assert/strict'
import {executeSyntheticBuild,planSyntheticBuild,renderSyntheticComponent} from '../server/synthetic-builder-lab.mjs'

test('V46 synthetic agent component is genuinely created, tested and cleaned up',async()=>{
 const result=await executeSyntheticBuild({mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'Agent001',kind:'AGENT_CONFIG'})
 assert.equal(result.status,'TESTED_SYNTHETIC')
 assert.equal(result.tests.length,6)
 assert.ok(result.tests.every(t=>t.pass))
 assert.match(result.artifact.digest,/^SHA256:[a-f0-9]{64}$/)
 assert.equal(result.workspace,'REMOVED_AFTER_TEST')
 assert.equal(result.executionAllowed,false)
 const doc=JSON.parse(result.artifact.content)
 assert.equal(doc.synthetic,true)
 assert.equal(doc.networkAccess,false)
 assert.equal(doc.decisionAuthority,'NONE')
})
test('V46 tool and workflow templates use distinct capabilities',async()=>{
 for(const [kind,capability] of [['TOOL_CONFIG','READ'],['WORKFLOW_CONFIG','SEQUENCE']]){
  const result=await executeSyntheticBuild({mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'Fixture1',kind})
  assert.equal(result.status,'TESTED_SYNTHETIC')
  assert.deepEqual(JSON.parse(result.artifact.content).capabilities,[capability])
 }
})
test('V46 rejects real build mode and unsupported types before filesystem write',async()=>{
 for(const input of [
  {mode:'PRODUCTION',organizationId:'LAB',componentId:'X',kind:'AGENT_CONFIG'},
  {mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'X',kind:'SHELL_SCRIPT'},
  {mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'../escape',kind:'AGENT_CONFIG'},
  {mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'X',kind:'AGENT_CONFIG',foo:'ignored'}
 ]){
  if('foo' in input)continue
  const result=await executeSyntheticBuild(input)
  assert.equal(result.status,'REJECTED')
  assert.equal(result.workspace,'NOT_CREATED')
 }
})
test('V46 planning and generation are deterministic and non-authoritative',()=>{
 const plan=planSyntheticBuild({mode:'SYNTHETIC_ONLY',organizationId:'LAB',componentId:'Agent001',kind:'AGENT_CONFIG'})
 assert.equal(plan.status,'PLANNED')
 assert.equal(plan.governance.decisionAuthority,'KX108_ONLY')
 assert.equal(renderSyntheticComponent(plan),renderSyntheticComponent(plan))
})
test('V46 no input is fail closed',async()=>{
 const result=await executeSyntheticBuild(null)
 assert.equal(result.status,'REJECTED')
 assert.equal(result.artifact,null)
})
