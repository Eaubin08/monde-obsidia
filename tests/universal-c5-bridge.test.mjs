import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readUniversalC5Local} from '../server/universal-c5-local.mjs'
const example=org=>({organization_id:org,domain_id:'administration',source_ref:'fixture:source',capability_id:'TASK.READ',delegation_generation:0,decision_record_id:'fixture:decision',ticket_hash:'fixture:ticket',receipt_id:'fixture:receipt',evidence_grade:'SYNTHETIC_FIXTURE',decision_authority:'KX108_ONLY',gate:'HOLD',authority_verified:false,kx108_invoked:false})
test('C5 server is empty without explicit configured source and tenant',()=>{
  const r=readUniversalC5Local()
  assert.equal(r.status,'NOT_CONFIGURED')
  assert.deepEqual(r.records,[])
  assert.equal(r.executionAllowed,false)
})
test('C5 server filters tenant from configuration, never client argument',()=>{
  const dir=mkdtempSync(join(tmpdir(),'c5-read-'))
  try {
    const path=join(dir,'feed.json')
    writeFileSync(path,JSON.stringify([example('org-cssa'),example('org-factory')]))
    const a=readUniversalC5Local({organizationId:'org-cssa',recordsPath:path})
    assert.equal(a.status,'SCOPED_LOCAL_FIXTURE_READONLY')
    assert.equal(a.recordCount,1)
    assert.deepEqual(a.records.map(x=>x.organizationId),['org-cssa'])
    assert.equal(a.executionAllowed,false)
    assert.equal(a.records[0].canExecute,false)
    const b=readUniversalC5Local({organizationId:'org-factory',recordsPath:path})
    assert.deepEqual(b.records.map(x=>x.organizationId),['org-factory'])
  } finally {rmSync(dir,{recursive:true,force:true})}
})
test('C5 invalid or forged records fail closed',()=>{
  const dir=mkdtempSync(join(tmpdir(),'c5-read-'))
  try {
    const path=join(dir,'feed.json')
    writeFileSync(path,JSON.stringify([{...example('org-cssa'),decision_authority:'BRODY'}]))
    const r=readUniversalC5Local({organizationId:'org-cssa',recordsPath:path})
    assert.equal(r.status,'SOURCE_INVALID_OR_UNAVAILABLE')
    assert.equal(r.recordCount,0)
    assert.equal(r.executionAllowed,false)
  } finally {rmSync(dir,{recursive:true,force:true})}
})
test('C5 route is GET only, and UI is read-only',async()=>{
  const {readFileSync}=await import('node:fs')
  const server=readFileSync(new URL('../server/local-bridge.mjs',import.meta.url),'utf8')
  const ui=readFileSync(new URL('../src/V5Root.tsx',import.meta.url),'utf8')
  assert.match(server,/req\.method==='GET'&&url\.pathname==='\/universal-c5'/)
  assert.match(server,/process\.env\.OBSIDIA_C5_ORGANIZATION_ID/)
  assert.match(ui,/worldZone==='governance'/)
  assert.match(ui,/Universal C5 — Organisations/)
  assert.doesNotMatch(ui,/fetch\('\/obsidia-local\/universal-c5',[\s\S]{0,100}method:'POST'/)
})
