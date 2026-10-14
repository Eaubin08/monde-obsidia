import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectCssaProfile} from '../src/cssaLiveProfile.ts'
const fallback={capabilities:[{id:'tasks',label:'TASKS',status:'PROVEN',summary:'historical',details:['receipt']}],unknowns:['REAL_ACCESS_RIGHTS'],contradictions:['old conflict'],evidence:['181 tests PASS'],risks:['ACTUATION_UNKNOWN']}
test('unavailable stores retain historical material explicitly and never imply proven capacity',()=>{
 const result=projectCssaProfile(fallback,{})
 assert.equal(result.capabilities[0].status,'UNKNOWN')
 assert.ok(result.unknowns.includes('REAL_ACCESS_RIGHTS'))
 assert.ok(result.unknowns.some(x=>x.includes('cssa-business-state')))
 assert.ok(result.evidence[0].includes('non revérifiée'))
 assert.ok(result.contradictions[0].includes('historique'))
 assert.equal(fallback.capabilities[0].status,'PROVEN')
})
test('observed records preserve provenance and uncertainty without granting authority',()=>{
 const result=projectCssaProfile(fallback,{
  ops:{available:true,state:{tasks:[{id:'t1',title:'Horaire',responsible:'UNKNOWN / NON ASSIGNÉ',truthClass:'PUBLIC_CONFLICT_REVIEW',source:'A vs B'},{id:'fixture',isTestFixture:true,truthClass:'CONTRADICTION'}],cases:[],updatedAt:'2026-10-14'}},
  business:{available:true,state:{dossiers:[],requirements:[],documentRefs:[],validations:[],submissionProofs:[{id:'p1',externalReference:'ref1',source:'mail'}],dossierOutcomes:[]}}
 })
 assert.equal(result.capabilities[0].status,'OBSERVED')
 assert.ok(result.unknowns.some(x=>x.includes('tasks/t1')&&x.includes('UNKNOWN')))
 assert.ok(result.contradictions.some(x=>x.includes('A vs B')))
 assert.ok(!result.contradictions.some(x=>x.includes('fixture')))
 assert.ok(result.evidence.some(x=>x.includes('submissionProofs/p1')&&x.includes('non vérifiée')&&x.includes('ref1')))
 assert.ok(result.unknowns.some(x=>x.includes('organisation-state')))
 assert.ok(result.unknowns.includes('REAL_ACCESS_RIGHTS'))
})
test('empty live stores do not erase unresolved historical contradictions or unknowns',()=>{
 const result=projectCssaProfile(fallback,{ops:{available:true,state:{tasks:[],cases:[]}}})
 assert.equal(result.contradictions.length,1)
 assert.ok(result.unknowns.includes('REAL_ACCESS_RIGHTS'))
 assert.equal(result.evidence.length,1)
})
test('HTTP success with missing or invalid local file never projects live evidence or capabilities',()=>{
 for(const status of ['MISSING','INVALID','UNREADABLE']){
  const result=projectCssaProfile(fallback,{ops:{available:true,state:{_source:{status,file:'cssa_ops_state.json'},tasks:[{id:'seed',truthClass:'PUBLIC_CONFLICT_REVIEW'}],cases:[]}}})
  assert.equal(result.capabilities[0].status,'UNKNOWN')
  assert.ok(result.unknowns.some(x=>x.includes(status)))
  assert.ok(!result.contradictions.some(x=>x.includes('seed')))
 }
})
