import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildObsidiaState} from '../server/obsidia-state.mjs'

test('canonical evidence projects decision receipt and measured impact without rollback preimage leakage',()=>{
 const snapshot={
  available:true,repository:'C:/OBSIDIA',sha:'abc',branch:'main',observedAt:'2026-10-06T05:20:00Z',proposals:[],sigmaDomains:[],
  runtimeEvidence:{
   decisions:[{
    decision_record_id:'kxagent-123',decision_record_hash:'d'.repeat(64),decision_phase:'AGENT_PRE_EXECUTION',
    decision_id:'bank-1',trace_id:'trace-1',domain:'bank',x108_gate:'ALLOW',reason_code:'GUARD_ALLOW',
    severity:'S0',decision_authority:'KX108_ONLY',observedAt:'2026-10-06T05:20:00Z'
   }],
   receipts:[{
    sealed_apply_receipt_id:'sar-123',sealed_apply_receipt_hash:'a'.repeat(64),status:'CONTENT_APPLIED',
    target_path:'src/example.py',target_pre_sha256:'1'.repeat(64),target_post_sha256:'2'.repeat(64),
    source_content_sha256:'2'.repeat(64),bytes_written:42,kx108_pre_decision_record_id:'kxagent-123',
    sealed_rollback_evidence_id:'sre-123',decision_authority:'KX108_ONLY',observedAt:'2026-10-06T05:20:01Z'
   }],
   rollbacks:[{
    sealed_rollback_evidence_id:'sre-123',sealed_rollback_evidence_hash:'b'.repeat(64),target_path:'src/example.py',
    pre_write_sha256:'1'.repeat(64),pre_write_size:41,source_content_sha256:'2'.repeat(64),
    kx108_pre_decision_record_id:'kxagent-123',decision_authority:'KX108_ONLY',sealed:true,
    pre_write_bytes_b64:'SHOULD_NEVER_APPEAR',observedAt:'2026-10-06T05:19:59Z'
   }]
  }
 }
 const state=buildObsidiaState(snapshot,{sessions:[],observedAt:'2026-10-06T05:20:02Z'})
 assert.ok(state.entities.some(e=>e.id==='decision_record:kxagent-123'&&e.gate==='ALLOW'))
 assert.ok(state.entities.some(e=>e.id==='sealed_receipt:sar-123'&&e.status==='CONTENT_APPLIED'))
 const impact=state.entities.find(e=>e.id==='impact:sar-123')
 assert.equal(impact?.targetPath,'src/example.py')
 assert.equal(impact?.beforeSha256,'1'.repeat(64))
 assert.equal(impact?.afterSha256,'2'.repeat(64))
 assert.ok(state.relations.some(r=>r.from==='decision_record:kxagent-123'&&r.type==='AUTHORIZES_RECEIPT'&&r.to==='sealed_receipt:sar-123'))
 assert.ok(state.relations.some(r=>r.from==='sealed_receipt:sar-123'&&r.type==='PROVES_IMPACT'&&r.to==='impact:sar-123'))
 assert.equal(JSON.stringify(state).includes('SHOULD_NEVER_APPEAR'),false)
})
