import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {composeWorldRenderPlan} from '../src/worldUiComposer.ts'
const object=(id,pattern,available=true)=>projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id,label:id,sourceId:'SENSOR',available,truth:'OBSERVED',pattern,capabilities:['INSPECT'],href:'#/unsafe/'+id})
const objects=[object('M1','MAINTENANCE_WORKSPACE'),object('M2','UNREGISTERED'),object('M3','MAINTENANCE_WORKSPACE',false)]
const model=buildWorldReadModel('FACTORY',objects),graph=buildWorldGraph(model)
const snapshot={model,graph,company:projectCompanyModel('FACTORY','Factory',model,graph),manifest:composeWorldManifest('FACTORY','Factory',model.objects),capabilityRegistry:buildCapabilityRegistry(model)}
test('known patterns produce stable read-only blocks independently of CSSA',()=>{
 const plan=composeWorldRenderPlan({phase:'READY',revision:2,snapshot,error:null})
 assert.equal(plan.territories[0].blocks.length,2)
 assert.equal(plan.territories[0].blocks[0].pattern,'MAINTENANCE_WORKSPACE')
 assert.equal(plan.territories[0].blocks[0].interaction,'READ_ONLY')
 assert.deepEqual(plan.territories[0].capabilities,['INSPECT'])
})
test('unknown patterns fall back to inspection without executing or linking',()=>{
 const plan=composeWorldRenderPlan({phase:'READY',revision:2,snapshot,error:null})
 const block=plan.territories[0].blocks.find(b=>b.label==='M2')
 assert.equal(block.pattern,'INSPECTION_VIEW')
 assert.equal(block.href,null)
 assert.equal(block.fallback,true)
 assert.ok(block.unknowns.includes('PATTERN_UNRECOGNIZED'))
})
test('stale or absent snapshot produces zero blocks',()=>{
 for(const phase of ['IDLE','LOADING','UNAVAILABLE']){
  const plan=composeWorldRenderPlan({phase,revision:4,snapshot,error:null})
  assert.deepEqual(plan.territories,[])
  assert.equal(plan.governance.authority,'NONE')
 }
})
