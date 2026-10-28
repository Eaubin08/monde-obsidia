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

import {readFileSync} from 'node:fs'
const shell=readFileSync(new URL('../src/CSSAPage.tsx',import.meta.url),'utf8')
test('shell handles hashchange for back/forward and clears stale cross-module query',()=>{
 assert.match(shell,/window\.addEventListener\('hashchange',onHash\)/)
 assert.match(shell,/setModuleId\(route\.moduleId\);setSelectedId\(route\.selectedId\);setQuery\(''\)/)
 assert.match(shell,/formatCssaHash\(\{moduleId:id,selectedId:picked\}\)/)
})

test('malformed CSSA identity segments stay invalid and never silently select dashboard',()=>{
 assert.equal(parseCssaHash('#cssa//42',modules),null)
 assert.equal(parseCssaHash('#cssa/mail/',modules),null)
 assert.equal(parseCssaHash('#cssa/mail/a%00b',modules),null)
 assert.equal(parseCssaHash('#cssa/mail/a?b',modules),null)
})

test('malformed CSSA browser history entry clears the previous selection',()=>{
 assert.match(shell,/if\(!location\.hash\.startsWith\('#cssa'\)\)return/)
 assert.match(shell,/setModuleId\(route\?\.moduleId\?\?'dashboard'\)/)
 assert.match(shell,/setSelectedId\(route\?\.selectedId\?\?''\)/)
})
