import test from 'node:test'
import assert from 'node:assert/strict'
import {projectC53ObservedEvidence} from '../server/universal-c53-observed.mjs'

test('matched hashes remain unattributed observations', () => {
 const actual=projectC53ObservedEvidence({
  decisions:[{decision_record_id:'decision-1',decision_record_hash:'digest-1',domain:'administration',x108_gate:'ALLOW'}],
  receipts:[{sealed_apply_receipt_id:'receipt-1',kx108_pre_decision_record_id:'decision-1',kx108_pre_decision_record_hash:'digest-1'}]
 })
 assert.equal(actual.recordCount,1)
 assert.deepEqual(actual.records[0].receiptRefs,['receipt-1'])
 assert.equal(actual.records[0].organizationId,null)
 assert.equal(actual.records[0].organizationAttribution,'NOT_VERIFIED')
 assert.equal(actual.independentIntegrityVerified,false)
 assert.equal(actual.executionAllowed,false)
})

test('hash mismatch never links a receipt', () => {
 const actual=projectC53ObservedEvidence({
  decisions:[{decision_record_id:'decision-1',decision_record_hash:'digest-1'}],
  receipts:[{sealed_apply_receipt_id:'receipt-1',kx108_pre_decision_record_id:'decision-1',kx108_pre_decision_record_hash:'wrong'}]
 })
 assert.deepEqual(actual.records[0].receiptRefs,[])
 assert.equal(actual.records[0].evidenceStatus,'RECEIPT_LINK_UNAVAILABLE')
})

test('missing inputs and duplicate decision identifiers remain bounded', () => {
 assert.equal(projectC53ObservedEvidence({}).recordCount,0)
 const actual=projectC53ObservedEvidence({decisions:[{decision_record_id:'decision-1'},{decision_record_id:'decision-1'}]})
 assert.equal(actual.recordCount,1)
})
