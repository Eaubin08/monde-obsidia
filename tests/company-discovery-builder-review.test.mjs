import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {discoverCompany} from '../src/companyDiscovery.ts'
import {proposeCompanyNeeds} from '../src/companyNeedCandidates.ts'
import {prepareBuilderReview} from '../src/worldBuilderReviewHandoff.ts'
function makeState(){
 const object=projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id:'M1',label:'Machine',sourceId:'SENSOR',available:true,truth:'OBSERVED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['INSPECT']})
 const model=buildWorldReadModel('FACTORY',[object]),graph=buildWorldGraph(model)
 const snapshot={model,graph,company:projectCompanyModel('FACTORY','Factory',model,graph),manifest:composeWorldManifest('FACTORY','Factory',model.objects),capabilityRegistry:buildCapabilityRegistry(model)}
 return {phase:'DEGRADED',revision:8,snapshot,error:null}
}
const expectations=[{domain:'PRODUCTION',id:'INSPECT',reason:'Source explicitly requires inspection',sourceRef:'SPEC-1'},{domain:'PRODUCTION',id:'CALIBRATE',reason:'Requested in fixture',sourceRef:'SPEC-2'}]
test('V34 observed capability produces no gap; missing declared capability creates review candidate only',()=>{
 const discovery=discoverCompany(makeState(),expectations)
 assert.equal(discovery.organizationId,'FACTORY')
 assert.equal(discovery.gaps.length,1)
 assert.equal(discovery.gaps[0].capabilityId,'CALIBRATE')
 assert.equal(discovery.gaps[0].sourceRef,'SPEC-2')
 assert.equal(discovery.gaps[0].classification,'REVIEW_CANDIDATE')
 assert.ok(discovery.unknowns.includes('PARTIAL_SOURCE_AVAILABILITY'))
})
test('V34 no declared expectation means no fabricated business need',()=>{
 assert.deepEqual(discoverCompany(makeState()).gaps,[])
 assert.deepEqual(proposeCompanyNeeds(makeState()).candidates,[])
 assert.deepEqual(prepareBuilderReview(makeState()).requests,[])
})
test('V34 needs preserve review HOLD and never become proven requirements',()=>{
 const needs=proposeCompanyNeeds(makeState(),expectations)
 assert.equal(needs.candidates.length,1)
 assert.equal(needs.candidates[0].decision,'HOLD')
 assert.equal(needs.candidates[0].evidenceStatus,'INSUFFICIENT')
})
test('V34 Builder handoff never authorizes building or deployment',()=>{
 const result=prepareBuilderReview(makeState(),expectations)
 assert.equal(result.requests.length,1)
 assert.equal(result.requests[0].buildApproved,false)
 assert.equal(result.requests[0].deploymentApproved,false)
 assert.equal(result.requests[0].executionAllowed,false)
 assert.equal(result.governance.decisionAuthority,'KX108_ONLY')
})
test('V34 stale snapshots never leak needs or review requests',()=>{
 const state=makeState()
 for(const phase of ['IDLE','LOADING','UNAVAILABLE']){
  const input={...state,phase}
  assert.equal(discoverCompany(input,expectations).organizationId,null)
  assert.deepEqual(proposeCompanyNeeds(input,expectations).candidates,[])
  assert.deepEqual(prepareBuilderReview(input,expectations).requests,[])
 }
})
