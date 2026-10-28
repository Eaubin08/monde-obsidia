import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {linkCanonicalEvidence} from '../src/worldCanonicalEvidence.ts'
import {auditWorldEvidenceReplay} from '../src/worldEvidenceReplay.ts'
const expected=[{domain:'OPS',id:'EXPORT',sourceRef:'REQ-1',reason:'Explicit requirement'}]
const obj=(id,ref='REQ-1',observedAt='2026-10-28T10:00:00Z',org='A')=>projectWorldObject({organizationId:org,domain:'OPS',kind:'TASK',id,label:id,sourceId:'OPS_SOURCE',available:true,truth:'OBSERVED',observedAt,evidenceRefs:[ref],pattern:'TASK_VIEW',capabilities:['READ']})
function state(objects,phase='READY'){
 const model=buildWorldReadModel('A',objects),graph=buildWorldGraph(model)
 return {phase,revision:7,snapshot:{model,graph,company:projectCompanyModel('A','Org A',model,graph),manifest:composeWorldManifest('A','Org A',model.objects),capabilityRegistry:buildCapabilityRegistry(model)},error:null}
}
test('V36 exact projected reference is linked but does not approve Builder',()=>{
 const s=state([obj('one')])
 const result=auditWorldEvidenceReplay(s,expected,'2026-10-28T10:05:00Z',600000)
 assert.equal(result.links.records[0].verdict,'OBSERVED_REFERENCE')
 assert.equal(result.decisions[0].readiness,'HOLD')
 assert.ok(result.decisions[0].blockers.includes('SOURCE_AUTHENTICITY_NOT_PROVEN'))
 assert.equal(result.reviewRequests[0].executionAllowed,false)
 assert.deepEqual(result,auditWorldEvidenceReplay(s,expected,'2026-10-28T10:05:00Z',600000))
})
test('V36 stale or future observation cannot support current link',()=>{
 for(const date of ['2026-10-25T00:00:00Z','2026-10-29T00:00:00Z']){
  const result=linkCanonicalEvidence(state([obj('one','REQ-1',date)]),expected,'2026-10-28T10:05:00Z',600000)
  assert.equal(result.records[0].verdict,'STALE_OR_FUTURE')
  assert.deepEqual(result.records[0].objectKeys,[])
 }
})
test('V36 unknown timestamps remain unknown, not fresh',()=>{
 const result=linkCanonicalEvidence(state([obj('one','REQ-1','not-a-date')]),expected,'2026-10-28T10:05:00Z',600000)
 assert.equal(result.records[0].verdict,'FRESHNESS_UNKNOWN')
})
test('V36 duplicate references are ambiguous, never chosen arbitrarily',()=>{
 const result=linkCanonicalEvidence(state([obj('one'),obj('two')]),expected,'2026-10-28T10:05:00Z',600000)
 assert.equal(result.records[0].verdict,'AMBIGUOUS_REFERENCE')
})
test('V36 rejects foreign tenant and missing references',()=>{
 const result=linkCanonicalEvidence(state([obj('foreign','REQ-1','2026-10-28T10:00:00Z','B'),obj('local','OTHER')]),expected,'2026-10-28T10:05:00Z',600000)
 assert.equal(result.records[0].verdict,'REFERENCE_NOT_FOUND')
})
test('V36 no stale snapshots can yield canonical evidence or Builder requests',()=>{
 const result=auditWorldEvidenceReplay(state([obj('one')],'LOADING'),expected,'2026-10-28T10:05:00Z',600000)
 assert.equal(result.links.records[0].verdict,'SNAPSHOT_NOT_CURRENT')
 assert.deepEqual(result.reviewRequests,[])
})
