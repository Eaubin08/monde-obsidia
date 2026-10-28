import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldEvidenceBatchV40} from '../src/worldEvidenceBatchAudit.ts'
import {auditWorldEvidenceIntegration} from '../src/worldEvidenceIntegration.ts'
const at='2026-10-28T10:00:00Z'
const o=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[o]),graph=buildWorldGraph(model)
const state={phase:'READY',revision:11,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const expectations=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit'}]
const binding={domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(o),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}
const payload=(title='Mission')=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})
const policy={organizationId:'CSSA',now:'2026-10-28T10:05:00Z',maxAgeMs:600000}

test('V45 ignores unrelated foreign registry bindings; no unexpected extra network reads',async()=>{
 let calls=0
 const unused={...binding,domain:'FOREIGN',sourceRef:'OTHER',query:{registry:'CRM',collection:'organizations',id:'X'}}
 const result=await auditWorldEvidenceBatchV40(state,expectations,[binding,unused],policy.now,policy.maxAgeMs,async url=>{
  calls++
  assert.match(String(url),/cssa-business-state/)
  return {ok:true,json:async()=>payload()}
 })
 assert.equal(calls,1)
 assert.equal(result.records[0].verdict,'STRUCTURAL_FIELDS_MATCH')
})
test('V45 undefined source field is classified MISSING rather than throwing',async()=>{
 const data=payload()
 data.dossiers[0].title=undefined
 const audit=await auditWorldEvidenceBatchV40(state,expectations,[binding],policy.now,policy.maxAgeMs,async()=>({ok:true,json:async()=>data}))
 assert.equal(audit.records[0].fields[0].status,'MISSING')
 assert.equal(audit.records[0].verdict,'FIELD_DIVERGENCE')
})
test('V45 no matched requirement means no network read',async()=>{
 const report=await auditWorldEvidenceBatchV40(state,expectations,[{...binding,sourceRef:'OTHER'}],policy.now,policy.maxAgeMs,async()=>{throw Error('unexpected GET')})
 assert.equal(report.records[0].verdict,'BINDING_UNRESOLVED')
})
test('V45 integrated gate rejects undefined fields despite internally valid receipt',async()=>{
 const data=payload()
 data.dossiers[0].title=undefined
 const report=await auditWorldEvidenceIntegration(state,expectations,[binding],policy,async()=>({ok:true,json:async()=>data}))
 assert.equal(report.receipts[0].verdict,'FIELD_DIVERGENCE')
 assert.equal(report.reviewRequests[0].readiness,'HOLD')
 assert.equal(report.reviewRequests[0].executionAllowed,false)
})
