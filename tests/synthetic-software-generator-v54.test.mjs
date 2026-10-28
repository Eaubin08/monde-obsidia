import {test} from 'node:test'
import assert from 'node:assert/strict'
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from '../server/synthetic-software-generator.mjs'
test('V54 creates three genuine finite JavaScript source templates',async()=>{
 for(const kind of ['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR']){
  const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',organizationId:'LAB',componentId:'Demo1',kind})
  assert.equal(plan.status,'PLANNED')
  const artifact=generateSoftwareSource(plan)
  assert.match(artifact.source,/export function/)
  assert.equal(artifact.deployable,false)
  const checked=await validateSoftwareSource(artifact)
  assert.equal(checked.status,'SOURCE_VALIDATED_NOT_EXECUTED')
  assert.ok(checked.tests.every(x=>x.pass))
 }
})
test('V54 generation is deterministic and rejects arbitrary source requests',()=>{
 const input={mode:'SYNTHETIC_SOURCE_ONLY',organizationId:'LAB',componentId:'Demo1',kind:'PURE_TOOL'}
 assert.deepEqual(generateSoftwareSource(planSoftwareComponent(input)),generateSoftwareSource(planSoftwareComponent(input)))
 assert.equal(planSoftwareComponent({...input,kind:'SHELL'}).status,'REJECTED')
 assert.equal(planSoftwareComponent({...input,componentId:'../evil'}).status,'REJECTED')
 assert.equal(planSoftwareComponent({...input,mode:'PRODUCTION'}).status,'REJECTED')
})
test('V54 modified source fails even when a matching local digest is supplied',async()=>{
 const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',organizationId:'LAB',componentId:'Demo1',kind:'PURE_TOOL'})
 const artifact=generateSoftwareSource(plan)
 const {createHash}=await import('node:crypto')
 const modified=artifact.source+'\nconsole.log("not allowed")\n'
 const digest='SHA256:'+createHash('sha256').update(modified).digest('hex')
 const result=await validateSoftwareSource({...artifact,source:modified,digest})
 assert.equal(result.status,'HOLD')
 assert.ok(result.tests.some(t=>t.name==='REVIEWED_TEMPLATE'&&!t.pass))
})
test('V54 invalid artifact and mismatched digest are not validated',async()=>{
 assert.equal((await validateSoftwareSource(null)).status,'REJECTED')
 const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',organizationId:'LAB',componentId:'Demo1',kind:'PURE_AGENT_DESCRIPTOR'})
 const artifact=generateSoftwareSource(plan)
 assert.equal((await validateSoftwareSource({...artifact,digest:'SHA256:'+'0'.repeat(64)})).status,'HOLD')
})
