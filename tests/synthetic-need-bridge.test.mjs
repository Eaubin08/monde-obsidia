import {test} from 'node:test'
import assert from 'node:assert/strict'
import {proposeSyntheticBuildFromNeed} from '../server/synthetic-need-bridge.mjs'
const need={id:'NEED_CANDIDATE_001',domain:'OPS',capabilityId:'MONITOR',decision:'HOLD',evidenceStatus:'INSUFFICIENT'}
const map=[{domain:'OPS',capabilityId:'MONITOR',kind:'AGENT_CONFIG',requiredCapabilities:['OBSERVE']}]
test('V47 needs bridge suggests a reusable template but never submits or authorizes building',()=>{
 const result=proposeSyntheticBuildFromNeed(need,map)
 assert.equal(result.status,'REVIEW_ONLY')
 assert.equal(result.templateId,'agent-observer-v1')
 assert.equal(result.request,null)
 assert.equal(result.buildApproved,false)
 assert.equal(result.executionAllowed,false)
})
test('V47 ambiguous templates and unsupported needs remain HOLD',()=>{
 assert.equal(proposeSyntheticBuildFromNeed(need,[...map,...map]).status,'HOLD')
 assert.equal(proposeSyntheticBuildFromNeed({...need,decision:'APPROVED'},map).status,'HOLD')
 assert.equal(proposeSyntheticBuildFromNeed(need,[]).status,'HOLD')
})
