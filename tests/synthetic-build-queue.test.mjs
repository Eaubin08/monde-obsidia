import {test} from 'node:test'
import assert from 'node:assert/strict'
import {listSyntheticTemplates,selectSyntheticTemplate} from '../server/synthetic-template-registry.mjs'
import {createSyntheticBuildQueue} from '../server/synthetic-build-queue.mjs'

test('V47 registry selects reusable synthetic template by explicit kind and capability',()=>{
 assert.equal(listSyntheticTemplates().length,3)
 assert.equal(selectSyntheticTemplate('AGENT_CONFIG',['OBSERVE']).id,'agent-observer-v1')
 assert.equal(selectSyntheticTemplate('AGENT_CONFIG',['READ']),null)
 assert.equal(selectSyntheticTemplate('SCRIPT',[]),null)
})
test('V47 queue actually builds and retains a validated synthetic component',async()=>{
 const queue=createSyntheticBuildQueue()
 const accepted=queue.submit({mode:'SYNTHETIC_ONLY',kind:'TOOL_CONFIG',componentId:'Tool1',organizationId:'LAB',requiredCapabilities:['READ']})
 assert.equal(accepted.status,'ACCEPTED_SYNTHETIC')
 assert.equal(queue.inspect(accepted.id).phase,'QUEUED')
 const built=await queue.run(accepted.id)
 assert.equal(built.phase,'TESTED_SYNTHETIC')
 assert.deepEqual(built.events,['QUEUED','RUNNING','TESTED_SYNTHETIC'])
 assert.equal(built.tests.length,6)
 assert.ok(built.tests.every(x=>x.pass))
 assert.match(built.artifact.digest,/^SHA256:[a-f0-9]{64}$/)
 assert.equal(built.executionAllowed,false)
 assert.equal(built.deploymentApproved,false)
 assert.equal((await queue.run(accepted.id)).reason,'JOB_NOT_QUEUED')
})
test('V47 invalid requests and unknown job fail closed',async()=>{
 const queue=createSyntheticBuildQueue()
 for(const invalid of [
  {mode:'PRODUCTION',kind:'AGENT_CONFIG',componentId:'A',organizationId:'LAB'},
  {mode:'SYNTHETIC_ONLY',kind:'TOOL_CONFIG',componentId:'../escape',organizationId:'LAB'},
  {mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'A',organizationId:'LAB',requiredCapabilities:['DELETE']}
 ]){
  assert.equal(queue.submit(invalid).status,'REJECTED')
 }
 assert.equal((await queue.run('not-found')).status,'NOT_FOUND')
 assert.equal(queue.list().length,0)
})
test('V47 capacity is enforced and inspection cannot mutate stored job',()=>{
 const queue=createSyntheticBuildQueue({limit:1})
 const request={mode:'SYNTHETIC_ONLY',kind:'WORKFLOW_CONFIG',componentId:'Flow',organizationId:'LAB'}
 const accepted=queue.submit(request)
 assert.equal(accepted.status,'ACCEPTED_SYNTHETIC')
 assert.equal(queue.submit(request).reason,'QUEUE_CAPACITY')
 const copy=queue.inspect(accepted.id)
 copy.events.push('FAKE_APPROVED')
 assert.deepEqual(queue.inspect(accepted.id).events,['QUEUED'])
 assert.equal(queue.inspect(accepted.id).buildApproved,false)
})
test('V47 three component families execute through the same queue',async()=>{
 const queue=createSyntheticBuildQueue()
 for(const kind of ['AGENT_CONFIG','TOOL_CONFIG','WORKFLOW_CONFIG']){
  const accepted=queue.submit({mode:'SYNTHETIC_ONLY',kind,componentId:'Demo'+kind,organizationId:'LAB'})
  assert.equal((await queue.run(accepted.id)).phase,'TESTED_SYNTHETIC')
 }
 assert.equal(queue.list().length,3)
})
