import {test} from 'node:test'
import assert from 'node:assert/strict'
import {composeWorldUiContract} from '../src/worldUiCompositionContract.ts'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
const a=projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id:'machine-1',label:'Machine 1',sourceId:'SENSOR',available:true,truth:'OBSERVED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['INSPECT'],unknowns:['NEXT_SERVICE_UNKNOWN']})
const b=projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id:'machine-2',label:'Machine 2',sourceId:'SENSOR',available:false,truth:'DECLARED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['WRITE']})
const model=buildWorldReadModel('FACTORY',[a,b])
const graph=buildWorldGraph(model)
const snapshot={model,graph,company:projectCompanyModel('FACTORY','Usine',model,graph),manifest:composeWorldManifest('FACTORY','Usine',model.objects),capabilityRegistry:buildCapabilityRegistry(model),sourceStatus:{business:'UNKNOWN',tasks:'UNKNOWN',crm:'UNKNOWN'}}
test('V28 composes portable presentation patterns for a non-CSSA organization',()=>{
 const v=composeWorldUiContract({phase:'DEGRADED',revision:2,snapshot,error:null})
 assert.equal(v.organizationId,'FACTORY')
 assert.equal(v.territories.length,1)
 assert.equal(v.territories[0].items.length,1)
 assert.equal(v.territories[0].items[0].pattern,'MAINTENANCE_WORKSPACE')
 assert.deepEqual(v.territories[0].items[0].unknowns,['NEXT_SERVICE_UNKNOWN'])
 assert.deepEqual(v.territories[0].capabilities,[{id:'INSPECT',state:'OBSERVED_SOURCE'}])
 assert.equal(v.governance.authority,'NONE')
})
test('V28 does not expose stale content during loading or failures',()=>{
 for(const phase of ['IDLE','LOADING','UNAVAILABLE']){
  const v=composeWorldUiContract({phase,revision:5,snapshot,error:null})
  assert.deepEqual(v.territories,[])
  assert.deepEqual(v.unknowns,['SNAPSHOT_NOT_CURRENT'])
 }
})
test('V28 does not promote missing-source objects to navigable items',()=>{
 const v=composeWorldUiContract({phase:'DEGRADED',revision:4,snapshot,error:null})
 assert.equal(v.territories[0].items.some(x=>x.label==='Machine 2'),false)
 assert.equal(v.territories[0].items.some(x=>x.pattern==='MAINTENANCE_WORKSPACE'),true)
})
