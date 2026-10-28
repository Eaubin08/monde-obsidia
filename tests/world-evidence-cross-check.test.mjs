import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {crossCheckWorldEvidence} from '../src/worldEvidenceCrossCheck.ts'
import {auditWorldCrossCheckedReplay} from '../src/worldCrossCheckedReplay.ts'
const at='2026-10-28T10:00:00Z'
const object=(id='D1',observedAt=at,org='CSSA')=>projectWorldObject({organizationId:org,domain:'BUSINESS',kind:'CASE',id,label:'Dossier',sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',observedAt,evidenceRefs:['REQ-1'],pattern:'CASE_WORKSPACE'})
const expected=[{domain:'BUSINESS',id:'EXPORT',sourceRef:'REQ-1',reason:'explicit fixture'}]
const source={_source:{status:'AVAILABLE',observedAt:at},dossiers:[{id:'D1',title:'Dossier'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]}
const fetcher=(data=source)=>async()=>({ok:true,json:async()=>structuredClone(data)})
function fixture(objs=[object()],phase='READY'){
 const model=buildWorldReadModel('CSSA',objs),graph=buildWorldGraph(model)
 return {phase,revision:5,snapshot:{model,graph,company:projectCompanyModel('CSSA','Club',model,graph),manifest:composeWorldManifest('CSSA','Club',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
}
const binding=(key=worldObjectKey(object()),id='D1')=>[{sourceRef:'REQ-1',domain:'BUSINESS',capabilityId:'EXPORT',objectKey:key,query:{registry:'BUSINESS',collection:'dossiers',id}}]
test('V38 exact source and projection are structurally consistent, not authenticated or authorized',async()=>{
 const result=await auditWorldCrossCheckedReplay(fixture(),expected,binding(), '2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(result.checks.records[0].verdict,'STRUCTURALLY_CONSISTENT')
 assert.equal(result.checks.records[0].integrity,'NOT_VERIFIED')
 assert.equal(result.reviewRequests[0].readiness,'HOLD')
 assert.equal(result.reviewRequests[0].executionAllowed,false)
 assert.equal(result.provenance[0].nodes.length,3)
})
test('V38 projected identity does not silently match another canonical record',async()=>{
 const result=await crossCheckWorldEvidence(fixture(),expected,binding(worldObjectKey(object()),'D2'),'2026-10-28T10:05:00Z',600000,fetcher({...source,dossiers:[{id:'D2',title:'Else'}]}))
 assert.equal(result.records[0].verdict,'IDENTITY_OR_REFERENCE_DIVERGENCE')
})
test('V38 differing source and projected clocks remain explicitly inconsistent',async()=>{
 const result=await crossCheckWorldEvidence(fixture([object('D1','2026-10-28T10:01:00Z')]),expected,binding(),'2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(result.records[0].verdict,'OBSERVATION_TIME_DIVERGENCE')
})
test('V38 foreign projection or missing binding never resolves another tenant',async()=>{
 const result=await crossCheckWorldEvidence(fixture([object('D1',at,'OTHER')]),expected,binding(),'2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(result.records[0].verdict,'PROJECTED_OBJECT_UNRESOLVED')
 const absent=await crossCheckWorldEvidence(fixture(),expected,[],'2026-10-28T10:05:00Z',600000,fetcher())
 assert.equal(absent.records[0].verdict,'BINDING_AMBIGUOUS_OR_MISSING')
})
test('V38 stale snapshot triggers no network read and no Builder request',async()=>{
 const result=await auditWorldCrossCheckedReplay(fixture([object()],'LOADING'),expected,binding(),'2026-10-28T10:05:00Z',600000,async()=>{throw Error('must not fetch')})
 assert.deepEqual(result.checks.records,[])
 assert.deepEqual(result.reviewRequests,[])
})
test('V38 old or missing timestamps never become current proof',async()=>{
 const stale=await crossCheckWorldEvidence(fixture(),expected,binding(),'2026-10-28T10:05:00Z',600000,fetcher({...source,_source:{status:'AVAILABLE',observedAt:'2026-10-20T00:00:00Z'}}))
 assert.equal(stale.records[0].verdict,'FRESHNESS_NOT_ESTABLISHED')
 const unknown=await crossCheckWorldEvidence(fixture(),expected,binding(),'2026-10-28T10:05:00Z',600000,fetcher({...source,_source:{status:'AVAILABLE'}}))
 assert.equal(unknown.records[0].verdict,'FRESHNESS_NOT_ESTABLISHED')
})
