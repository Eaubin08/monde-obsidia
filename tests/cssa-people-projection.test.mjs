import {test} from 'node:test'
import assert from 'node:assert/strict'
import {resolveCssaPerson} from '../src/cssaPeopleProjection.ts'
const available={_source:{status:'AVAILABLE'},people:[{id:'p1',displayName:'Alice',status:'ACTIF',source:'REGISTER'}]}
test('canonical person id resolves the live name, never the stale declared label',()=>{
 const before=JSON.stringify(available)
 assert.equal(resolveCssaPerson('p1','Old name',available),'Alice · ACTIF · p1')
 assert.equal(JSON.stringify(available),before)
 assert.match(resolveCssaPerson('p1','Old name',{...available,people:[{id:'p1',displayName:'New name',status:'INACTIF'}]}),/New name · INACTIF/)
})
test('missing, unavailable and ambiguous person references stay UNKNOWN',()=>{
 assert.match(resolveCssaPerson('gone','Alice',available),/UNKNOWN.*introuvable/)
 assert.match(resolveCssaPerson('p1','Alice',null),/UNKNOWN.*indisponible/)
 assert.match(resolveCssaPerson('p1','Alice',{...available,_source:{status:'INVALID'}}),/UNKNOWN.*indisponible/)
 assert.match(resolveCssaPerson('p1','Alice',{...available,people:[...available.people,...available.people]}),/UNKNOWN.*ambiguë/)
})
test('a declared name or public role cannot infer a canonical person or authorization',()=>{
 assert.equal(resolveCssaPerson(null,'Alice',available),'Alice · déclaré, sans lien personne')
 assert.match(resolveCssaPerson(null,'Président',available),/déclaré, sans lien personne/)
 assert.match(resolveCssaPerson(undefined,'',available),/UNKNOWN/)
 assert.match(resolveCssaPerson('p1','Alice',{...available,people:[{id:'p1'}]}),/UNKNOWN · UNKNOWN/)
})
