import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditSourceBackedBuilderReplay} from '../src/worldSourceBackedReplay.ts'
const object=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Case',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[object]),graph=buildWorldGraph(model)
const snapshot={model,graph,company:projectCompanyModel('CSSA','Test',model,graph),manifest:composeWorldManifest('CSSA','Test',model.objects),capabilityRegistry:buildCapabilityRegistry(model)}
const state={phase:'READY',revision:2,snapshot,error:null}
const expectations=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-001',reason:'Request'}]
const bindings=[{sourceRef:'REQ-001',domain:'BUSINESS',capabilityId:'EXPORT',query:{registry:'BUSINESS',collection:'dossiers',id:'D1'}}]
const data={_source:{status:'AVAILABLE',observedAt:'2026-10-28T10:00:00Z'},dossiers:[{id:'D1',title:'Case'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]}
test('V37 source-backed replay uses exact explicit binding yet remains HOLD',async()=>{
 const result=await auditSourceBackedBuilderReplay(state,expectations,bindings,'2026-10-28T10:05:00Z',600000,async()=>({ok:true,json:async()=>structuredClone(data)}))
 assert.equal(result.sourceObservations[0].status,'OBSERVED_RECORD')
 assert.equal(result.reviewRequests[0].sourceFresh,true)
 assert.equal(result.reviewRequests[0].buildApproved,false)
 assert.equal(result.reviewRequests[0].executionAllowed,false)
})
test('V37 no binding never guesses record from requirement reference',async()=>{
 const result=await auditSourceBackedBuilderReplay(state,expectations,[],'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected fetch')})
 assert.equal(result.sourceObservations[0].status,'BINDING_AMBIGUOUS_OR_MISSING')
 assert.equal(result.reviewRequests[0].sourceFresh,false)
})
test('V37 stale source does not become current proof',async()=>{
 const result=await auditSourceBackedBuilderReplay(state,expectations,bindings,'2026-10-28T10:05:00Z',600000,async()=>({ok:true,json:async()=>({...data,_source:{status:'AVAILABLE',observedAt:'2026-10-20T00:00:00Z'}})}))
 assert.equal(result.reviewRequests[0].sourceFresh,false)
 assert.ok(result.reviewRequests[0].blockers.includes('SOURCE_RECORD_OR_FRESHNESS_UNVERIFIED'))
})
test('V37 invalidated snapshot makes no source fetch or review requests',async()=>{
 const result=await auditSourceBackedBuilderReplay({...state,phase:'LOADING'},expectations,bindings,'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected fetch')})
 assert.deepEqual(result.reviewRequests,[])
 assert.deepEqual(result.sourceObservations,[])
})
