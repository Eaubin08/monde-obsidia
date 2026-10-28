import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {verifyCompanyRequirements} from '../src/worldRequirementVerification.ts'
import {auditBuilderReadiness} from '../src/worldBuilderReadiness.ts'
import {prepareBuilderReview} from '../src/worldBuilderReviewHandoff.ts'
const o=projectWorldObject({organizationId:'A',domain:'OPS',kind:'TASK',id:'1',label:'Task',sourceId:'OPS_SOURCE',available:true,truth:'DECLARED',pattern:'TASK_VIEW',capabilities:['READ']})
const model=buildWorldReadModel('A',[o]),graph=buildWorldGraph(model)
const snapshot={model,graph,company:projectCompanyModel('A','Example',model,graph),manifest:composeWorldManifest('A','Example',model.objects),capabilityRegistry:buildCapabilityRegistry(model)}
const current={phase:'READY',revision:3,snapshot,error:null}
const expectation=[{domain:'OPS',id:'EXPORT',reason:'Explicit request',sourceRef:'REQ-1'}]
const proof={sourceRef:'REQ-1',organizationId:'A',domain:'OPS',capabilityId:'EXPORT',status:'VERIFIED',evidenceId:'PROOF-1'}
test('V35 unverified source reference fails closed',()=>{
 const result=verifyCompanyRequirements(current,expectation)
 assert.equal(result.records[0].verdict,'UNVERIFIED_REFERENCE')
 assert.deepEqual(result.records[0].evidenceIds,[])
})
test('V35 tenant-scoped verification excludes foreign or mismatched evidence',()=>{
 const result=verifyCompanyRequirements(current,expectation,[{...proof,organizationId:'B'},{...proof,capabilityId:'DIFFERENT'}])
 assert.equal(result.records[0].verdict,'UNVERIFIED_REFERENCE')
})
test('V35 one explicit verified reference does not authorize building',()=>{
 const verification=verifyCompanyRequirements(current,expectation,[proof])
 assert.equal(verification.records[0].verdict,'VERIFIED_REFERENCE')
 const readiness=auditBuilderReadiness(current,expectation,[proof])
 assert.equal(readiness.records[0].readiness,'HOLD')
 assert.ok(readiness.records[0].blockers.includes('AUTHORIZATION_MISSING'))
 const handoff=prepareBuilderReview(current,expectation,[proof])
 assert.equal(handoff.requests[0].buildApproved,false)
 assert.equal(handoff.requests[0].executionAllowed,false)
})
test('V35 duplicates and contradictions never select an arbitrary requirement proof',()=>{
 const result=verifyCompanyRequirements(current,expectation,[proof,{...proof,evidenceId:'PROOF-2'}])
 assert.equal(result.records[0].verdict,'CONFLICTING_EVIDENCE')
 assert.deepEqual(result.records[0].evidenceIds,[])
 const conflict=verifyCompanyRequirements(current,expectation,[proof,{...proof,status:'REJECTED',evidenceId:null}])
 assert.equal(conflict.records[0].verdict,'CONFLICTING_EVIDENCE')
})
test('V35 source degradation remains a readiness blocker',()=>{
 const records=auditBuilderReadiness({...current,phase:'DEGRADED'},expectation,[proof]).records
 assert.ok(records[0].blockers.includes('PARTIAL_SOURCE_AVAILABILITY'))
})
test('V35 unavailable snapshot produces no Builder handoff even with supplied proof',()=>{
 const stale={...current,phase:'LOADING'}
 assert.deepEqual(auditBuilderReadiness(stale,expectation,[proof]).records,[])
 assert.deepEqual(prepareBuilderReview(stale,expectation,[proof]).requests,[])
})
test('V35 capability already observed is not flagged as a gap',()=>{
 const observed=[{domain:'OPS',id:'READ',reason:'Read',sourceRef:'REQ-2'}]
 assert.deepEqual(auditBuilderReadiness(current,observed,[]).records,[])
})
