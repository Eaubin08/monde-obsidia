import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldEvidenceIntegration} from '../src/worldEvidenceIntegration.ts'

const at='2026-10-28T10:00:00Z'
const o=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[o]),graph=buildWorldGraph(model)
const state={phase:'READY',revision:10,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const requirement={domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit'}
const binding={domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(o),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}
const policy={organizationId:'CSSA',now:'2026-10-28T10:05:00Z',maxAgeMs:600000}
const fetcher=async()=>({ok:true,json:async()=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title:'Mission'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})})

test('V44 duplicated expectation cannot be treated as unique source evidence',async()=>{
 const result=await auditWorldEvidenceIntegration(state,[requirement,requirement],[binding],policy,fetcher)
 assert.equal(result.reviewRequests.length,2)
 for(const review of result.reviewRequests){
  assert.ok(review.blockers.includes('DUPLICATE_EXPECTATION'))
  assert.ok(review.blockers.includes('MISSING_OR_AMBIGUOUS_CAPTURE_RECEIPT'))
  assert.equal(review.buildApproved,false)
  assert.equal(review.executionAllowed,false)
 }
})
test('V44 duplicated bindings remain ambiguous and cannot promote a Builder action',async()=>{
 const result=await auditWorldEvidenceIntegration(state,[requirement],[binding,binding],policy,fetcher)
 assert.equal(result.receipts[0].sourceDigest,null)
 assert.equal(result.reviewRequests[0].readiness,'HOLD')
 assert.ok(result.reviewRequests[0].blockers.includes('MISSING_SOURCE_DIGEST'))
 assert.equal(result.reviewRequests[0].executionAllowed,false)
})
test('V44 expected requirement without matching binding retains explicit blocker',async()=>{
 const result=await auditWorldEvidenceIntegration(state,[requirement],[],policy,async()=>{throw Error('Unexpected source read')})
 assert.equal(result.reviewRequests[0].readiness,'HOLD')
 assert.ok(result.reviewRequests[0].blockers.includes('MISSING_SOURCE_DIGEST'))
})
test('V44 source and projected equality never bypasses unsigned receipt gate',async()=>{
 const result=await auditWorldEvidenceIntegration(state,[requirement],[binding],policy,fetcher)
 assert.equal(result.receipts[0].verdict,'STRUCTURAL_FIELDS_MATCH')
 assert.ok(result.reviewRequests[0].blockers.includes('SOURCE_SIGNATURE_NOT_VERIFIED'))
 assert.ok(result.reviewRequests[0].blockers.includes('TENANT_SOURCE_AUTHENTICITY_NOT_VERIFIED'))
 assert.equal(result.reviewRequests[0].deploymentApproved,false)
})
test('V44 foreign organization rejects before GET or receipt processing',async()=>{
 const result=await auditWorldEvidenceIntegration(state,[requirement],[binding],{...policy,organizationId:'OTHER'},async()=>{throw Error('Unexpected source read')})
 assert.equal(result.status,'HOLD')
 assert.deepEqual(result.reviewRequests,[])
 assert.deepEqual(result.receipts,[])
})
