import {test} from 'node:test'
import assert from 'node:assert/strict'
import {auditEvidenceReceiptBoundary} from '../src/worldEvidenceReceiptBoundary.ts'
import {captureWorldEvidenceReceipts} from '../src/worldEvidenceReceipts.ts'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
const at='2026-10-28T10:00:00Z'
const o=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[o]),graph=buildWorldGraph(model)
const state={phase:'READY',revision:10,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const req=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit'}]
const bind=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(o),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}]
async function receipt(){
 const result=await captureWorldEvidenceReceipts(state,req,bind,'2026-10-28T10:05:00Z',600000,async()=>({ok:true,json:async()=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title:'Mission'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})}))
 return result.receipts[0]
}
const policy={organizationId:'CSSA',now:'2026-10-28T10:06:00Z',maxAgeMs:600000}
test('V42 valid unsigned local receipt is still HOLD with origin blockers',async()=>{
 const result=await auditEvidenceReceiptBoundary([await receipt()],policy)
 assert.equal(result.records[0].verdict,'HOLD')
 assert.deepEqual(result.records[0].violations,['SOURCE_SIGNATURE_NOT_VERIFIED','TENANT_SOURCE_AUTHENTICITY_NOT_VERIFIED'])
 assert.equal(result.executionAllowed,false)
})
test('V42 foreign tenant fails closed',async()=>{
 const result=await auditEvidenceReceiptBoundary([await receipt()],{...policy,organizationId:'FOREIGN'})
 assert.ok(result.records[0].violations.includes('FOREIGN_ORGANIZATION'))
})
test('V42 tampering and duplicates are explicitly rejected',async()=>{
 const r=await receipt()
 const result=await auditEvidenceReceiptBoundary([{...r,verdict:'TAMPERED'},r],policy)
 assert.ok(result.records.every(x=>x.violations.includes('DUPLICATE_IDENTITY')))
 assert.ok(result.records[0].violations.includes('INVALID_RECEIPT_DIGEST'))
})
test('V42 too-old, future and malformed observation timestamps do not verify',async()=>{
 const r=await receipt()
 for(const observedAt of ['2026-10-20T00:00:00Z','2026-11-01T00:00:00Z','bad']){
  const result=await auditEvidenceReceiptBoundary([{...r,observedAt}],policy)
  assert.ok(result.records[0].violations.includes('UNVERIFIED_FRESHNESS'))
 }
})
test('V42 malformed source digest is not promoted',async()=>{
 const result=await auditEvidenceReceiptBoundary([{...await receipt(),sourceDigest:'broken'}],policy)
 assert.ok(result.records[0].violations.includes('MISSING_SOURCE_DIGEST'))
})
