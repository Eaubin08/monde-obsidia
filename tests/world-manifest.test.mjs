import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {readFileSync} from 'node:fs'
const dossier=readFileSync(new URL('../src/CSSADossiersPage.tsx',import.meta.url),'utf8')
const actor=readFileSync(new URL('../src/CSSAActorObjectView.tsx',import.meta.url),'utf8')
const obj=(organizationId,domain,id,available=true)=>projectWorldObject({organizationId,domain,kind:'CASE',id,label:id,sourceId:'registry',available,truth:'DECLARED',pattern:'CASE_WORKSPACE',capabilities:['DOSSIERS']})

test('manifest isolates organizations and only exposes live capabilities',()=>{
 const m=composeWorldManifest('A','Organisation A',[obj('A','BUSINESS','d1'),obj('A','CRM','a1',false),obj('B','BUSINESS','d2')])
 assert.equal(m.objects.length,2)
 assert.deepEqual(m.territories.map(x=>x.domain),['BUSINESS','CRM'])
 assert.equal(m.territories[0].status,'LIVE')
 assert.equal(m.territories[1].status,'OPEN')
 assert.deepEqual(m.territories[1].capabilities,[])
 assert.equal(m.governance.authority,'NONE')
})
test('manifest does not pick an object when its canonical key collides',()=>{
 const m=composeWorldManifest('A','A',[obj('A','BUSINESS','d'),obj('A','BUSINESS','d')])
 assert.deepEqual(m.objects,[])
 assert.equal(m.unknowns.length,1)
 assert.match(m.unknowns[0],/^AMBIGUOUS_OBJECT:/)
})
test('manifest supports a second organization with a different domain and pattern',()=>{
 const g=projectWorldObject({organizationId:'Factory',domain:'PRODUCTION',kind:'RESOURCE',id:'machine-1',label:'Machine',sourceId:'SENSOR',available:true,truth:'OBSERVED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['MAINTENANCE']})
 const m=composeWorldManifest('Factory','Usine',[g])
 assert.equal(m.territories[0].domain,'PRODUCTION')
 assert.deepEqual(m.territories[0].patterns,['MAINTENANCE_WORKSPACE'])
 assert.deepEqual(m.territories[0].capabilities,['MAINTENANCE'])
})
test('dossier and actor views both consume common world contract',()=>{
 assert.match(dossier,/projectWorldCase\(selected\.d,available\)/)
 assert.match(actor,/projectWorldActor\(p\.organization,p\.crmAvailable\)/)
})
