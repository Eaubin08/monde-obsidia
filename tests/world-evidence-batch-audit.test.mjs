import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldEvidenceBatchV40} from '../src/worldEvidenceBatchAudit.ts'
const at='2026-10-28T10:00:00Z'
const obj=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[obj]),graph=buildWorldGraph(model)
const current={phase:'READY',revision:10,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const expected=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit expectation'}]
const bindings=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(obj),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}]
const payload=(title='Mission')=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})
test('V40 uses exactly one GET for one registry and preserves SHA-256 and HOLD',async()=>{
 let calls=0
 const fetcher=async()=>{calls++;return {ok:true,json:async()=>payload()}}
 const result=await auditWorldEvidenceBatchV40(current,expected,bindings,'2026-10-28T10:05:00Z',600000,fetcher)
 assert.equal(calls,1)
 assert.equal(result.records[0].verdict,'STRUCTURAL_FIELDS_MATCH')
 assert.match(result.records[0].sourceDigest,/^SHA256:[a-f0-9]{64}$/)
 assert.equal(result.records[0].integrity,'DIGEST_ONLY_NOT_AUTHENTICATED')
 assert.equal(result.reviewRequests[0].executionAllowed,false)
 assert.equal(result.reviewRequests[0].buildApproved,false)
 assert.equal(result.consistency,'NON_ATOMIC')
})
test('V40 detects changing source values without mutating object',async()=>{
 const result=await auditWorldEvidenceBatchV40(current,expected,bindings,'2026-10-28T10:05:00Z',600000,async()=>({ok:true,json:async()=>payload('Changed')}))
 assert.equal(result.records[0].verdict,'FIELD_DIVERGENCE')
 assert.equal(obj.label,'Mission')
})
test('V40 missing bindings and stale snapshot never fetch unknown data',async()=>{
 const noBinding=await auditWorldEvidenceBatchV40(current,expected,[],'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected')})
 assert.equal(noBinding.records[0].verdict,'BINDING_UNRESOLVED')
 const stale=await auditWorldEvidenceBatchV40({...current,phase:'LOADING'},expected,bindings,'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected')})
 assert.deepEqual(stale.records,[])
 assert.deepEqual(stale.reviewRequests,[])
})
test('V40 digest is deterministic for identical records',async()=>{
 const fetcher=async()=>({ok:true,json:async()=>payload()})
 const a=await auditWorldEvidenceBatchV40(current,expected,bindings,'2026-10-28T10:05:00Z',600000,fetcher)
 const b=await auditWorldEvidenceBatchV40(current,expected,bindings,'2026-10-28T10:05:00Z',600000,fetcher)
 assert.equal(a.records[0].sourceDigest,b.records[0].sourceDigest)
})
