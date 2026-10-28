import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject,worldObjectKey,resolveWorldObject} from '../src/worldObjectContract.ts'
import {projectWorldMatch,projectWorldCase,projectWorldActor} from '../src/cssaWorldObjects.ts'
const base={organizationId:'CSSA',domain:'SPORT',kind:'OPERATION',id:'m/1',label:'Match',sourceId:'PUBLIC_SPORT',available:true,truth:'DECLARED',pattern:'EVENT_OPERATIONS_WORKSPACE'}
test('world objects keep sovereign authority outside presentation',()=>{
 const o=projectWorldObject(base)
 assert.equal(o.governance.authority,'NONE')
 assert.equal(o.governance.decisionAuthority,'KX108_ONLY')
 assert.equal(o.identity.id,'m/1')
})
test('unavailable source never promotes relations, evidence or capabilities',()=>{
 const o=projectWorldObject({...base,available:false,relations:[{kind:'TASK',target:{domain:'OPS',kind:'OPERATION',id:'t1'},sourceId:'OPS',status:'RESOLVED',evidenceRefs:[]}],evidenceRefs:['proof'],capabilities:['WRITE']})
 assert.equal(o.truth,'UNKNOWN')
 assert.equal(o.relations.length,0)
 assert.deepEqual(o.evidenceRefs,[])
 assert.deepEqual(o.capabilities,[])
 assert.ok(o.unknowns.includes('SOURCE_UNAVAILABLE'))
})
test('world object keys distinguish organizations and resolve fail closed',()=>{
 const one=projectWorldObject(base),other=projectWorldObject({...base,organizationId:'ANOTHER'})
 assert.notEqual(worldObjectKey(one),worldObjectKey(other))
 assert.equal(resolveWorldObject(worldObjectKey(one),[one,one]),null)
 assert.equal(resolveWorldObject(worldObjectKey(one),[one,other]),one)
})
test('CSSA object adapters share one contract and do not invent evidence',()=>{
 const match=projectWorldMatch({id:'m',kind:'MATCH',date:'2026-10-28',time:null,title:'A — B',competition:'R1',venue:null,source:'SPORT',truth:'PUBLIC_CONFLICT_REVIEW',detail:'',href:'#cssa/sportif/R1/m'})
 const dossier=projectWorldCase({id:'d',title:'Dossier',status:'OUVERT',source:'BUSINESS',organizationId:null},true)
 const actor=projectWorldActor({id:'a',name:'Acteur',status:'ACTIF'},true)
 assert.equal(match.truth,'CONTRADICTION')
 assert.ok(match.unknowns.includes('TIME_UNKNOWN'))
 assert.equal(dossier.presentation.pattern,'CASE_WORKSPACE')
 assert.ok(dossier.unknowns.includes('ORGANIZATION_NOT_LINKED'))
 assert.equal(actor.presentation.pattern,'RELATIONSHIP_WORKSPACE')
 for(const o of [match,dossier,actor])assert.deepEqual(o.evidenceRefs,[])
})
