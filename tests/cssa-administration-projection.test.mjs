import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectCssaAdministration} from '../src/cssaAdministrationProjection.ts'
const observed=data=>({...data,_source:{status:'AVAILABLE'}})
const base=()=>({business:observed({documentRefs:[],dossiers:[]}),organisation:observed({engagements:[],authorizations:[]}),ops:observed({tasks:[]})})
test('Administration retains available sources when another source is missing; affected totals stay UNKNOWN',()=>{
 const sources=base();sources.business=null;sources.organisation.engagements=[{id:'e',status:'ACTIF'}];sources.ops.tasks=[{id:'t',origin:'ADMINISTRATION',status:'EN_COURS'}]
 const view=projectCssaAdministration(sources,'2026-10-15')
 assert.equal(view.points,null);assert.equal(view.engagements.length,1);assert.equal(view.tasks.length,1);assert.deepEqual(view.docs,[])
})
test('available empty differs from missing templates for each of the three sources',()=>{
 assert.equal(projectCssaAdministration(base(),'2026-10-15').points,0)
 const sources=base();sources.ops={tasks:[{id:'t',origin:'ADMINISTRATION',status:'A_FAIRE'}],_source:{status:'MISSING'}}
 const view=projectCssaAdministration(sources,'2026-10-15')
 assert.deepEqual(view.tasks,[]);assert.equal(view.points,null)
 sources.business={documentRefs:[{id:'doc',status:'EXPIRE',validUntil:''}],dossiers:[],_source:{status:'INVALID'}}
 sources.organisation={engagements:[{id:'e',status:'ACTIF'}],authorizations:[{id:'a',status:'ACCORDEE'}],_source:{status:'UNREADABLE'}}
 const unknown=projectCssaAdministration(sources,'2026-10-15');assert.deepEqual(unknown.review,[]);assert.deepEqual(unknown.engagements,[]);assert.deepEqual(unknown.auth,[])
})
test('expired and unverified document appears once and upcoming validity contributes to unique review points',()=>{
 const sources=base();sources.business.documentRefs=[{id:'d',status:'A_VERIFIER',validUntil:'2026-10-01',source:'clause 3'},{id:'soon',status:'VALIDE',validUntil:'2026-11-01',source:'pièce'}]
 sources.ops.tasks=[{id:'t',origin:'ADMINISTRATION',status:'EN_COURS'},{id:'done',origin:'ADMINISTRATION',status:'TERMINE'},{id:'match',origin:'MATCHDAY',status:'A_FAIRE'}]
 const before=JSON.stringify(sources);const view=projectCssaAdministration(sources,'2026-10-15')
 assert.equal(view.expired.length,1);assert.equal(view.unknown.length,1);assert.deepEqual(view.review.map(row=>row.id),['d','soon']);assert.equal(view.points,3);assert.equal(JSON.stringify(sources),before)
})
test('invalid dates require review, statuses and contradictory records are not rewritten or discarded',()=>{
 const sources=base();sources.business.documentRefs=[{id:'d',status:'VALIDE',validUntil:'2026-02-30',source:'UNKNOWN'},{id:'d',status:'EXPIRE',validUntil:'',source:'contradiction'}]
 sources.organisation.engagements=[{id:'a',status:'ANNULE'},{id:'e',status:'A_VERIFIER'}];sources.organisation.authorizations=[{id:'h',status:'INCONNUE'},{id:'r',status:'REVOQUEE'}]
 const view=projectCssaAdministration(sources,'2026-10-15')
 assert.equal(view.review.length,2);assert.equal(view.points,1);assert.equal(view.review[0].status,'VALIDE');assert.equal(view.unknown.length,1);assert.equal(view.expired.length,1);assert.equal(view.engagements.length,1);assert.equal(view.auth[0].status,'INCONNUE')
})
test('review totals count all unique objects even when the UI shows only twelve rows',()=>{
 const sources=base();sources.business.documentRefs=Array.from({length:15},(_,i)=>({id:'doc'+i,status:'A_VERIFIER',validUntil:'',source:'UNKNOWN'}))
 const view=projectCssaAdministration(sources,'2026-10-15')
 assert.equal(view.review.length,15);assert.equal(view.points,15)
})
