import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldSemanticReplay} from '../src/worldSemanticReplay.ts'
const stamp='2026-10-28T10:00:00Z'
const o=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:stamp,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[o]),graph=buildWorldGraph(model)
const current={phase:'READY',revision:4,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const expected=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Test'}]
const bindings=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(o),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}]
const fetcher=async()=>({ok:true,json:async()=>({_source:{status:'AVAILABLE',observedAt:stamp},dossiers:[{id:'D1',title:'Mission'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})})
test('V39 equality never authorizes Builder or claims an atomic source view',async()=>{
 const replay=await auditWorldSemanticReplay(current,expected,bindings,'2026-10-28T10:05:00Z',600000,fetcher)
 assert.equal(replay.fields.records[0].verdict,'FIELDS_CONSISTENT')
 assert.equal(replay.consistency,'NON_ATOMIC_MULTIPLE_READS')
 assert.ok(replay.reviewRequests[0].blockers.includes('NON_ATOMIC_AND_UNAUTHENTICATED_READS'))
 assert.equal(replay.reviewRequests[0].buildApproved,false)
 assert.equal(replay.reviewRequests[0].executionAllowed,false)
})
test('V39 stale snapshot never reads source or produces Builder requests',async()=>{
 const replay=await auditWorldSemanticReplay({...current,phase:'LOADING'},expected,bindings,'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected read')})
 assert.deepEqual(replay.reviewRequests,[])
 assert.equal(replay.governance.authority,'NONE')
})
