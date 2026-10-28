import {test} from 'node:test'
import assert from 'node:assert/strict'
import {rankWorldTerritories,deriveWorldViewContext} from '../src/worldDisplayContext.ts'
import {readFileSync} from 'node:fs'
test('display profile orders territories but preserves every observed item',()=>{
 const rows=[{domain:'FINANCE',objects:[1]},{domain:'SPORT',objects:[2]},{domain:'CRM',objects:[3]}]
 const sorted=rankWorldTerritories(rows,{roleLabel:'manager',preferredDomains:['SPORT','CRM']})
 assert.deepEqual(sorted.map(x=>x.domain),['SPORT','CRM','FINANCE'])
 assert.deepEqual(sorted.flatMap(x=>x.objects).sort(),[1,2,3])
 assert.deepEqual(rows.map(x=>x.domain),['FINANCE','SPORT','CRM'])
})
test('arbitrary role does not grant access or change projection scope',()=>{
 const a=rankWorldTerritories([{domain:'OPS'},{domain:'BUSINESS'}],{roleLabel:'ADMIN'})
 const b=rankWorldTerritories([{domain:'OPS'},{domain:'BUSINESS'}],{roleLabel:'VISITOR'})
 assert.deepEqual(a,b)
 assert.equal(deriveWorldViewContext({roleLabel:'ADMIN',focusedObjectKey:'item'},'DETAIL').focusedObjectKey,'item')
 assert.equal(deriveWorldViewContext({focusedObjectKey:'item'},'OVERVIEW').focusedObjectKey,null)
})
test('composer applies only display reordering, no role-based filtering',()=>{
 const src=readFileSync(new URL('../src/worldUiComposer.ts',import.meta.url),'utf8')
 assert.match(src,/rankWorldTerritories\(input\.territories,profile\)/)
 assert.doesNotMatch(src,/roleLabel===|roleLabel==/)
})
