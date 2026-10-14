import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectCssaPersonWork} from '../src/cssaPersonWork.ts'
const people=[{id:'p1',displayName:'Alice',status:'ACTIF'},{id:'p2',displayName:'Alice',status:'ACTIF'}]
const available={organisation:true,ops:true,business:true}
test('person work uses only explicit ids, not equal names, declared roles or task titles',()=>{
 const tasks=[{id:'t1',title:'Action',status:'A_FAIRE',responsiblePersonId:'p1'},{id:'t2',title:'Action',status:'A_FAIRE',responsiblePersonId:'p2'},{id:'t3',title:'Alice',responsible:'Alice',status:'A_FAIRE'}]
 const dossiers=[{id:'d1',reference:'AO',title:'Dossier',status:'EN_PREPARATION',ownerPersonId:'p1'},{id:'d2',reference:'AO2',title:'Alice',owner:'Alice',status:'EN_PREPARATION'}]
 const result=projectCssaPersonWork('p1',people,tasks,dossiers,[],available)
 assert.deepEqual(result.tasks.map(x=>x.id),['t1']);assert.deepEqual(result.dossiers.map(x=>x.id),['d1'])
})
test('finished and fixture tasks, closed dossiers and satisfied requirements are excluded from open work',()=>{
 const tasks=[{id:'finished',title:'Task',status:'TERMINE',responsiblePersonId:'p1'},{id:'fixture',title:'Task',status:'A_FAIRE',responsiblePersonId:'p1',isTestFixture:true}]
 const dossiers=[{id:'d1',reference:'AO',title:'Closed',status:'ATTRIBUE',ownerPersonId:'p1'}]
 const requirements=[{id:'r1',dossierId:'d1',label:'Closed work',state:'MANQUANT',ownerPersonId:'p1'},{id:'r2',dossierId:'d2',label:'Done',state:'SATISFAIT',ownerPersonId:'p1'}]
 const result=projectCssaPersonWork('p1',people,tasks,dossiers,requirements,available)
 assert.equal(result.tasks.length,0);assert.equal(result.dossiers.length,0);assert.equal(result.requirements.length,0)
})
test('inactive person retains explicitly assigned outstanding work without promotion or mutation',()=>{
 const inactive=[{id:'p1',displayName:'Alice',status:'INACTIF'}]
 const tasks=[{id:'t1',title:'Task',status:'EN_COURS',responsiblePersonId:'p1'}]
 const before=JSON.stringify({inactive,tasks})
 const result=projectCssaPersonWork('p1',inactive,tasks,[],[],available)
 assert.equal(result.person.status,'INACTIF');assert.equal(result.tasks.length,1)
 assert.equal(JSON.stringify({inactive,tasks}),before)
})
test('unavailable, removed or ambiguous canonical person cannot resolve work',()=>{
 for(const [rows,flags] of [[people,{...available,organisation:false}],[[],available],[[people[0],people[0]],available]]){
  const result=projectCssaPersonWork('p1',rows,[{id:'t1',title:'Task',status:'A_FAIRE',responsiblePersonId:'p1'}],[],[],flags)
  assert.equal(result.person,null);assert.equal(result.tasks.length,0);assert.notEqual(result.status,'RESOLVED')
 }
})
test('missing work source does not expose retained or initial records as live work',()=>{
 const tasks=[{id:'t1',title:'Task',status:'A_FAIRE',responsiblePersonId:'p1'}]
 const dossiers=[{id:'d1',reference:'AO',title:'Dossier',status:'EN_PREPARATION',ownerPersonId:'p1'}]
 const result=projectCssaPersonWork('p1',people,tasks,dossiers,[],{...available,ops:false,business:false})
 assert.equal(result.person.id,'p1');assert.deepEqual(result.tasks,[]);assert.deepEqual(result.dossiers,[])
})
test('an assigned requirement with a broken dossier reference remains visible for review',()=>{
 const requirements=[{id:'r1',dossierId:'gone',label:'Assurance',state:'MANQUANT',ownerPersonId:'p1'}]
 const result=projectCssaPersonWork('p1',people,[],[],requirements,available)
 assert.equal(result.requirements[0].dossierId,'gone');assert.equal(result.dossiers.length,0)
})
