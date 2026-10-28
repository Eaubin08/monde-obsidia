import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {projectWorldActivity} from '../src/worldActivityContext.ts'
import {composeWorldActivityPlan} from '../src/worldActivityPlan.ts'
const o=(org,id,available=true)=>projectWorldObject({organizationId:org,domain:'PRODUCTION',kind:'RESOURCE',id,label:id,sourceId:'SENSOR',available,truth:'OBSERVED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['INSPECT']})
const observed=o('FACTORY','M1'),unavailable=o('FACTORY','M2',false),foreign=o('OTHER','M3')
const model=buildWorldReadModel('FACTORY',[observed,unavailable,foreign])
const graph=buildWorldGraph(model)
const snapshot={model,graph,company:projectCompanyModel('FACTORY','Factory',model,graph),manifest:composeWorldManifest('FACTORY','Factory',model.objects),capabilityRegistry:buildCapabilityRegistry(model),sourceStatus:{business:'AVAILABLE',tasks:'UNKNOWN',crm:'UNKNOWN'}}
const state={phase:'DEGRADED',revision:9,snapshot,error:null}
test('V33 resolves only exact available same-organization activity object',()=>{
 const a=projectWorldActivity(model,{roleLabel:'Supervisor',activityObjectKey:worldObjectKey(observed)})
 assert.equal(a.activity.observedObjectKey,worldObjectKey(observed))
 assert.equal(a.verifiedRole,null)
 assert.deepEqual(a.authorization.permissions,[])
 for(const key of [worldObjectKey(unavailable),worldObjectKey(foreign),'nonexistent']){
  const b=projectWorldActivity(model,{roleLabel:'Admin',activityObjectKey:key})
  assert.equal(b.activity.observedObjectKey,null)
  assert.ok(b.unknowns.includes('ACTIVITY_OBJECT_UNRESOLVED'))
 }
})
test('V33 composes focus and personal domain ordering without granting access',()=>{
 const p=composeWorldActivityPlan(state,{roleLabel:'Admin',activityObjectKey:worldObjectKey(observed),preferredDomains:['PRODUCTION']})
 assert.equal(p.context.focus.identity.id,'M1')
 assert.equal(p.plan.territories[0].blocks.find(b=>b.label==='M1').emphasis,'FOCUS')
 assert.equal(p.activity.authorization.verified,false)
 assert.equal(p.plan.governance.authority,'NONE')
 assert.equal(p.organizationId,'FACTORY')
})
test('V33 missing activity is explicit and does not guess nearby object',()=>{
 const p=composeWorldActivityPlan(state,{activityObjectKey:worldObjectKey(foreign)})
 assert.equal(p.context,null)
 assert.equal(p.plan.territories[0].blocks.every(b=>b.emphasis==='NORMAL'),true)
 assert.ok(p.unknowns.includes('ACTIVITY_OBJECT_UNRESOLVED'))
})
test('V33 invalidated/loading snapshots cannot restore prior role or business data',()=>{
 for(const phase of ['IDLE','LOADING','UNAVAILABLE']){
  const p=composeWorldActivityPlan({...state,phase},{roleLabel:'Admin',activityObjectKey:worldObjectKey(observed)})
  assert.equal(p.context,null)
  assert.equal(p.activity,null)
  assert.equal(p.organizationId,null)
  assert.deepEqual(p.plan.territories,[])
  assert.deepEqual(p.unknowns,['SNAPSHOT_NOT_CURRENT'])
 }
})
test('V33 no role label can alter organization scope or action authority',()=>{
 const first=composeWorldActivityPlan(state,{roleLabel:'Reader',activityObjectKey:worldObjectKey(observed)})
 const second=composeWorldActivityPlan(state,{roleLabel:'Owner',activityObjectKey:worldObjectKey(observed)})
 assert.deepEqual(first.plan.territories,second.plan.territories)
 assert.deepEqual(first.context,second.context)
 assert.equal(first.governance.authority,'NONE')
})
