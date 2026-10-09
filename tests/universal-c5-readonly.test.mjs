import test from 'node:test'
import assert from 'node:assert/strict'
import {projectUniversalC5Readonly,C5_SCHEMA} from '../src/universalC5Readonly.mjs'
function fixture(organization_id='org-cssa', domain_id='administration') {
  return {organization_id,domain_id,source_ref:'source-test',capability_id:'TASK.READ',
    delegation_generation:0,decision_record_id:'decision-local',ticket_hash:'ticket-local',
    receipt_id:'receipt-local',evidence_grade:'SYNTHETIC_FIXTURE',
    decision_authority:'KX108_ONLY',gate:'ALLOW',authority_verified:false,kx108_invoked:false}
}
test('two organizations are distinct and never grant action',()=>{
  const out=projectUniversalC5Readonly([fixture(),fixture('org-industry','maintenance')])
  assert.equal(out.schema,C5_SCHEMA)
  assert.equal(out.organizationCount,2)
  assert.equal(out.recordCount,2)
  assert.equal(out.readonly,true)
  assert.equal(out.canonicalTruth,false)
  assert.equal(out.executionAllowed,false)
  assert.ok(out.records.every(x=>x.canExecute===false && x.executionAuthority===false))
})
test('tenant filter cannot leak records from another organization',()=>{
  const out=projectUniversalC5Readonly([fixture(),fixture('org-industry','maintenance')],{organizationId:'org-cssa'})
  assert.deepEqual(out.organizations.map(x=>x.organizationId),['org-cssa'])
  assert.deepEqual(out.records.map(x=>x.organizationId),['org-cssa'])
})
test('synthetic ALLOW never becomes execution authority',()=>{
  const row={...fixture(),gate:'ALLOW',authority_verified:true,kx108_invoked:true,evidence_grade:'INDEPENDENTLY_VERIFIED'}
  const out=projectUniversalC5Readonly([row])
  assert.equal(out.records[0].canExecute,false)
  assert.equal(out.records[0].status,'OBSERVED_ALLOW_NOT_EXECUTION_AUTHORITY')
})
test('revoked source or delegation still blocks',()=>{
  for (const field of ['source_revoked','delegation_revoked']) {
    const row={...fixture(),gate:'ALLOW',authority_verified:true,kx108_invoked:true,evidence_grade:'INDEPENDENTLY_VERIFIED',[field]:true}
    assert.equal(projectUniversalC5Readonly([row]).records[0].status,'REVIEW_OR_BLOCK_ONLY')
  }
})
test('missing scope, forged authority and duplicates fail closed',()=>{
  assert.throws(()=>projectUniversalC5Readonly([{...fixture(),organization_id:''}]),/C5_MISSING_BOUND_FIELDS/)
  assert.throws(()=>projectUniversalC5Readonly([{...fixture(),decision_authority:'AGENT'}]),/C5_AUTHORITY_INVALID/)
  assert.throws(()=>projectUniversalC5Readonly([fixture(),fixture()]),/C5_DUPLICATE_RECORD/)
  assert.throws(()=>projectUniversalC5Readonly([fixture()],{organizationId:''}),/C5_SCOPE_INVALID/)
})
test('no input mutation and projected records immutable',()=>{
  const record=fixture()
  const out=projectUniversalC5Readonly([record])
  assert.equal(Object.isFrozen(out.records[0]),true)
  assert.equal(record.canExecute,undefined)
})
