import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldEvidenceIntegration} from '../src/worldEvidenceIntegration.ts'
const at='2026-10-28T10:00:00Z'
const obj=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[obj]),graph=buildWorldGraph(model)
const state={phase:'READY',revision:10,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const expectations=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit'}]
const binding=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(obj),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}]
const policy={organizationId:'CSSA',now:'2026-10-28T10:05:00Z',maxAgeMs:600000}
const fetcher=async()=>({ok:true,json:async()=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title:'Mission'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})})
test('V43 integrates receipt checks into final Builder HOLD',async()=>{
 const audit=await auditWorldEvidenceIntegration(state,expectations,binding,policy,fetcher)
 assert.equal(audit.receipts.length,1)
 assert.equal(audit.receiptAudit.records[0].verdict,'HOLD')
 assert.ok(audit.reviewRequests[0].blockers.includes('SOURCE_SIGNATURE_NOT_VERIFIED'))
 assert.equal(audit.reviewRequests[0].executionAllowed,false)
 assert.equal(audit.reviewRequests[0].buildApproved,false)
 assert.equal(audit.reviewRequests[0].deploymentApproved,false)
})
test('V43 foreign snapshot cannot initiate a source read or produce Builder request',async()=>{
 const audit=await auditWorldEvidenceIntegration(state,expectations,binding,{...policy,organizationId:'OTHER'},async()=>{throw Error('unexpected fetch')})
 assert.deepEqual(audit.blockers,['FOREIGN_SNAPSHOT'])
 assert.deepEqual(audit.reviewRequests,[])
})
test('V43 stale snapshot cannot initiate a source read',async()=>{
 const audit=await auditWorldEvidenceIntegration({...state,phase:'LOADING'},expectations,binding,policy,async()=>{throw Error('unexpected fetch')})
 assert.deepEqual(audit.blockers,['SNAPSHOT_NOT_CURRENT'])
 assert.deepEqual(audit.receipts,[])
})
test('V43 unavailable source never produces an authenticated receipt',async()=>{
 const audit=await auditWorldEvidenceIntegration(state,expectations,binding,policy,async()=>{throw Error('offline')})
 assert.equal(audit.receipts[0].sourceDigest,null)
 assert.ok(audit.reviewRequests[0].blockers.includes('MISSING_SOURCE_DIGEST'))
 assert.equal(audit.reviewRequests[0].readiness,'HOLD')
})
