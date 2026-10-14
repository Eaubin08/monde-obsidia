import {test} from 'node:test'
import assert from 'node:assert/strict'
import {resolveCssaReference,cssaSourceAvailable} from '../src/cssaLinkedReference.ts'
test('cross-store links resolve only explicit unique ids from an available source',()=>{
 const rows=[{id:'doc-1',title:'Attestation',status:'A_VERIFIER'}]
 const before=JSON.stringify(rows)
 assert.deepEqual(resolveCssaReference('doc-1',rows,true),{status:'RESOLVED',item:rows[0]})
 assert.equal(JSON.stringify(rows),before)
 assert.equal(resolveCssaReference('doc-2',rows,true).status,'BROKEN')
 assert.equal(resolveCssaReference(null,rows,true).status,'UNLINKED')
})
test('unavailable source and duplicate ids cannot expose a navigable inferred record',()=>{
 const task={id:'t1',title:'Action',status:'TERMINE'}
 assert.deepEqual(resolveCssaReference('t1',[task],false),{status:'SOURCE_UNKNOWN',item:null})
 assert.deepEqual(resolveCssaReference('t1',[task,task],true),{status:'AMBIGUOUS',item:null})
})
test('HTTP response or initial template alone does not establish live availability',()=>{
 for(const state of [null,{}, {_source:{status:'MISSING'}},{_source:{status:'INVALID'}},{_source:{status:'UNREADABLE'}}])assert.equal(cssaSourceAvailable(state),false)
 assert.equal(cssaSourceAvailable({_source:{status:'AVAILABLE'},tasks:[]}),true)
})
