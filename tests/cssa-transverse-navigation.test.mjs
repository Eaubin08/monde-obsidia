import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolveCssaReference} from '../src/cssaLinkedReference.ts'
import {cssaNavigationCount} from '../src/cssaNavigationCounts.ts'

const shell=readFileSync(new URL('../src/CSSAPage.tsx',import.meta.url),'utf8')
const mail=readFileSync(new URL('../src/CSSAMailPage.tsx',import.meta.url),'utf8')
const home=readFileSync(new URL('../src/CSSAHomePage.tsx',import.meta.url),'utf8')
const available=state=>({available:true,state:{_source:{status:'AVAILABLE'},...state}})

test('CSSA shell passes the deep-linked Mail identity into the Mail page',()=>{
 assert.match(shell,/CSSAMailPage selectedId=\{selectedId\}/)
 assert.match(mail,/selectedId:requestedId/)
 assert.match(mail,/setSelectedId\(requestedId\|\|''\)/)
 assert.match(mail,/onOpen\?\.\('mail',m\.id\)/)
})
test('Mail missing and ambiguous selections remain explicit, not first-row substitutions',()=>{
 assert.match(mail,/selectedRows\.length>1\?'UNKNOWN · référence Mail ambiguë':'UNKNOWN · référence Mail introuvable'/)
 assert.match(mail,/selectionIssue\?selectionIssue/)
})
test('cross-links require unique exact ids in their available source',()=>{
 assert.match(mail,/directory\?\.organizations\.filter\(o=>o\.id===selected\.organizationId\)\.length===1/)
 assert.match(mail,/business\?\.dossiers\.filter\(d=>d\.id===selected\.dossierId\)\.length===1/)
 assert.equal(resolveCssaReference('x',[],false).status,'SOURCE_UNKNOWN')
 assert.equal(resolveCssaReference('x',[],true).status,'BROKEN')
 assert.equal(resolveCssaReference('x',[{id:'x'},{id:'x'}],true).status,'AMBIGUOUS')
 assert.equal(resolveCssaReference('x',[{id:'x'}],true).status,'RESOLVED')
})
test('navigation counts preserve 0 vs UNKNOWN independently per store',()=>{
 assert.equal(cssaNavigationCount('tasks',{ops:available({tasks:[]})}).value,0)
 assert.equal(cssaNavigationCount('tasks',{ops:{available:false}}).value,null)
 assert.equal(cssaNavigationCount('documents',{business:available({documentRefs:[{id:'d'}]})}).value,1)
})

test('Accueil uses the same task count semantics as CSSA side navigation',()=>{
 assert.match(home,/cssaNavigationCount\('tasks',countObservations\)/)
 assert.match(home,/openTasks\?\?'UNKNOWN'/)
 assert.match(home,/data\._source\?\.status!=='AVAILABLE'/)
 assert.doesNotMatch(home,/const openTasks=tasks\.filter/)
})
