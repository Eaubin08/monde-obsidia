import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {captureWorldEvidenceReceipts,compareLocalEvidenceReceipts,verifyLocalEvidenceReceipt} from '../src/worldEvidenceReceipts.ts'
const at='2026-10-28T10:00:00Z'
const obj=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[obj]),graph=buildWorldGraph(model)
const current={phase:'READY',revision:10,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const expectations=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit'}]
const bindings=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(obj),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'}]}]
const fetcher=(title='Mission')=>async()=>({ok:true,json:async()=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})})
test('V41 observation receipt repeatable and locally verifiable without authorization',async()=>{
 const a=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher())
 const b=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(a.receipts[0].receiptDigest,b.receipts[0].receiptDigest)
 assert.equal(await verifyLocalEvidenceReceipt(a.receipts[0]),true)
 assert.equal(a.reviewRequests[0].executionAllowed,false)
 assert.equal(a.reviewRequests[0].buildApproved,false)
})
test('V41 tampered receipt fails digest verification',async()=>{
 const result=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(await verifyLocalEvidenceReceipt({...result.receipts[0],verdict:'FABRICATED'}),false)
})
test('V41 source content changes detected by receipts',async()=>{
 const a=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher())
 const b=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher('Changed'))
 const diff=await compareLocalEvidenceReceipts(a.receipts,b.receipts)
 assert.equal(diff.changes[0].status,'SOURCE_DIGEST_CHANGED')
})
test('V41 missing or duplicated receipts preserve ambiguity',async()=>{
 const a=await captureWorldEvidenceReceipts(current,expectations,bindings,'2026-10-28T10:05:00Z',600000,fetcher())
 const duplicate=await compareLocalEvidenceReceipts(a.receipts,[...a.receipts,...a.receipts])
 assert.equal(duplicate.changes[0].status,'AMBIGUOUS_RECEIPT')
 const removed=await compareLocalEvidenceReceipts(a.receipts,[])
 assert.equal(removed.changes[0].status,'REMOVED')
})
test('V41 unavailable snapshot creates no receipt and no Builder requests',async()=>{
 const result=await captureWorldEvidenceReceipts({...current,phase:'LOADING'},expectations,bindings,'2026-10-28T10:05:00Z',600000,async()=>{throw Error('unexpected fetch')})
 assert.deepEqual(result.receipts,[])
 assert.deepEqual(result.reviewRequests,[])
})
