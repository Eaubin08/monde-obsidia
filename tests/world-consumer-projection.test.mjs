import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldConsumer} from '../src/worldConsumerProjection.ts'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
const object=projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id:'M1',label:'Machine',sourceId:'SENSOR',available:true,truth:'OBSERVED',pattern:'MAINTENANCE',capabilities:['INSPECT']})
const model=buildWorldReadModel('FACTORY',[object])
const graph=buildWorldGraph(model)
const snapshot={sourceStatus:{business:'AVAILABLE',tasks:'UNKNOWN',crm:'UNKNOWN'},model,graph,company:projectCompanyModel('FACTORY','Usine',model,graph),manifest:composeWorldManifest('FACTORY','Usine',[object])}
test('V25 consumer projects live non-CSSA context without UI dependency',()=>{
 const projection=projectWorldConsumer({phase:'DEGRADED',revision:3,snapshot,error:null},worldObjectKey(object))
 assert.equal(projection.focus.identity.id,'M1')
 assert.deepEqual(projection.capabilities,['INSPECT'])
 assert.equal(projection.consistency,'NON_ATOMIC_CROSS_SOURCE')
 assert.equal(projection.governance.authority,'NONE')
 assert.equal(projection.territories[0].domain,'PRODUCTION')
})
test('V25 consumer fails closed on LOADING and UNAVAILABLE, even if stale snapshot is supplied',()=>{
 for(const phase of ['LOADING','UNAVAILABLE','IDLE']){
  const projection=projectWorldConsumer({phase,revision:4,snapshot,error:null},worldObjectKey(object))
  assert.equal(projection.focus,null)
  assert.deepEqual(projection.capabilities,[])
  assert.ok(projection.unknowns.includes('SNAPSHOT_NOT_CURRENT'))
 }
})
test('V25 consumer does not select an unknown focus',()=>{
 const projection=projectWorldConsumer({phase:'READY',revision:1,snapshot,error:null},'not-a-key')
 assert.equal(projection.focus,null)
 assert.ok(projection.unknowns.includes('FOCUS_UNKNOWN'))
})
