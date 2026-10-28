import {test} from 'node:test'
import assert from 'node:assert/strict'
import {cssaNavigationCount} from '../src/cssaNavigationCounts.ts'
const observed=state=>({available:true,state:{_source:{status:'AVAILABLE'},...state}})
test('counts match active people, open tasks, active dossiers including recorded outcomes, and document inventory',()=>{
 const observations={organisation:observed({people:[{status:'ACTIF'},{status:'INACTIF'},{status:'INCONNU'}]}),ops:observed({tasks:[{status:'A_FAIRE'},{status:'BLOQUE'},{status:'TERMINE'}]}),business:observed({dossiers:[{id:'a',status:'EN_PREPARATION'},{id:'b',status:'ATTRIBUE'},{id:'c',status:'NON_RETENU'},{id:'d',status:'ANNULE'},{id:'e',status:'DEPOSE'}],dossierOutcomes:[{dossierId:'e'}],documentRefs:[{id:'doc1'},{id:'doc2'}]})}
 const before=JSON.stringify(observations)
 assert.deepEqual(['organisation','tasks','dossiers','documents'].map(id=>cssaNavigationCount(id,observations).value),[1,2,1,2])
 assert.equal(JSON.stringify(observations),before)
})
test('an available empty registry counts zero and is distinct from an unavailable source',()=>{
 assert.equal(cssaNavigationCount('tasks',{ops:observed({tasks:[]})}).value,0)
 assert.equal(cssaNavigationCount('tasks',{}).value,null)
})
test('missing, invalid, unreadable, stale and unqualified templates never become live counts',()=>{
 for(const status of ['MISSING','INVALID','UNREADABLE',undefined]){
  assert.equal(cssaNavigationCount('tasks',{ops:{available:true,state:{_source:{status},tasks:[{status:'A_FAIRE'}]}}}).value,null)
 }
 assert.equal(cssaNavigationCount('tasks',{ops:{...observed({tasks:[{}]}),available:false}}).value,null)
})
test('malformed collections and missing outcomes keep the relevant counter unknown',()=>{
 for(const tasks of [undefined,{},[null],['task']])assert.equal(cssaNavigationCount('tasks',{ops:observed({tasks})}).value,null)
 assert.equal(cssaNavigationCount('dossiers',{business:observed({dossiers:[]})}).value,null)
})
test('source failures remain independent and unrelated navigation retains its own scope',()=>{
 const observations={ops:{available:false},business:observed({documentRefs:[{}]})}
 assert.equal(cssaNavigationCount('tasks',observations).value,null)
 assert.equal(cssaNavigationCount('documents',observations).value,1)
 assert.equal(cssaNavigationCount('finance',observations),null)
 assert.equal(cssaNavigationCount('tasks',observations).route,'cssa-ops-state')
})


test('CSSA task count returns UNKNOWN for absent statuses and excludes closed records',()=>{
 const observed=tasks=>({ops:{available:true,state:{_source:{status:'AVAILABLE'},tasks}}})
 assert.equal(cssaNavigationCount('tasks',observed([{id:'t1',status:'TERMINE'},{id:'t2',status:'CLOSED'},{id:'t3',status:'OPEN'}])).value,1)
 assert.equal(cssaNavigationCount('tasks',observed([{id:'t1'}])).value,null)
})
test('CSSA dossier count rejects malformed outcome references instead of treating them as empty',()=>{
 const business=(dossiers,dossierOutcomes)=>({business:{available:true,state:{_source:{status:'AVAILABLE'},dossiers,dossierOutcomes}}})
 assert.equal(cssaNavigationCount('dossiers',business([{id:'d1',status:'EN_COURS'}],[{id:'o1'}])).value,null)
 assert.equal(cssaNavigationCount('dossiers',business([{id:'d1',status:'EN_COURS'}],[{dossierId:'d1'}])).value,0)
})
