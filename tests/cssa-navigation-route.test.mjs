import {test} from 'node:test'
import assert from 'node:assert/strict'
import {parseCssaHash,formatCssaHash} from '../src/cssaNavigationRoute.ts'
const modules=['dashboard','mail','documents','tasks','dossiers']
test('CSSA route round-trips encoded identities',()=>{
 for(const id of ['mail/42','dossier à revoir','a%2Fb','']) {
  const route={moduleId:'mail',selectedId:id}
  assert.deepEqual(parseCssaHash(formatCssaHash(route),modules),route)
 }
})
test('CSSA route refuses foreign, unknown and invalid hash paths',()=>{
 assert.equal(parseCssaHash('#world/mail/42',modules),null)
 assert.equal(parseCssaHash('#cssa/unknown/42',modules),null)
 assert.equal(parseCssaHash('#cssa/mail/%XX',modules),null)
 assert.deepEqual(parseCssaHash('#cssa',modules),{moduleId:'dashboard',selectedId:''})
})
