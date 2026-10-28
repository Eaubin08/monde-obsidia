import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {auditWorldFieldIntegrity} from '../src/worldFieldIntegrity.ts'
const at='2026-10-28T10:00:00Z'
const o=projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:'D1',label:'Mission',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt:at,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const model=buildWorldReadModel('CSSA',[o]),graph=buildWorldGraph(model)
const state={phase:'READY',revision:4,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
const exp=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'Declared'}]
const bind=[{domain:'BUSINESS',capabilityId:'EXPORT',sourceRef:'REQ-1',objectKey:worldObjectKey(o),query:{registry:'BUSINESS',collection:'dossiers',id:'D1'},fields:[{sourceField:'title',projectedField:'label'},{sourceField:'id',projectedField:'identity.id'}]}]
const source=(title='Mission')=>({_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]})
const fetcher=(data)=>async()=>({ok:true,json:async()=>structuredClone(data)})
test('V39 explicitly mapped equal source/projected fields are consistent without authenticity',async()=>{
 const report=await auditWorldFieldIntegrity(state,exp,bind,'2026-10-28T10:05:00Z',600000,fetcher(source()))
 assert.equal(report.records[0].verdict,'FIELDS_CONSISTENT')
 assert.deepEqual(report.records[0].comparisons.map(c=>c.status),['EQUAL','EQUAL'])
 assert.equal(report.records[0].integrity,'NOT_AUTHENTICATED')
 assert.match(report.records[0].sourceFingerprint,/^FNV1A32:/)
})
test('V39 semantic mismatch is surfaced without rewriting either side',async()=>{
 const report=await auditWorldFieldIntegrity(state,exp,bind,'2026-10-28T10:05:00Z',600000,fetcher(source('Different')))
 assert.equal(report.records[0].verdict,'FIELD_DIVERGENCE')
 assert.equal(report.records[0].comparisons[0].status,'DIVERGENT')
 assert.equal(o.label,'Mission')
})
test('V39 missing fields do not become equal to undefined',async()=>{
 const data=source()
 delete data.dossiers[0].title
 const report=await auditWorldFieldIntegrity(state,exp,bind,'2026-10-28T10:05:00Z',600000,fetcher(data))
 assert.equal(report.records[0].comparisons[0].status,'SOURCE_FIELD_MISSING')
})
test('V39 missing mapping never fabricates a verified field set',async()=>{
 const report=await auditWorldFieldIntegrity(state,exp,[],'2026-10-28T10:05:00Z',600000,async()=>{throw Error('should not fetch')})
 assert.equal(report.records[0].verdict,'CROSS_CHECK_UNRESOLVED')
})
test('V39 stale phase provides no successful equality or source reads',async()=>{
 const report=await auditWorldFieldIntegrity({...state,phase:'LOADING'},exp,bind,'2026-10-28T10:05:00Z',600000,async()=>{throw Error('should not fetch')})
 assert.equal(report.records[0].verdict,'CROSS_CHECK_UNRESOLVED')
})
