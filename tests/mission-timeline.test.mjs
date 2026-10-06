import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildObsidiaState} from '../server/obsidia-state.mjs'

test('mission timeline links sessions only by exact action identity and leaves gaps explicit',()=>{
 const snapshot={
  available:true,repository:'C:/OBSIDIA',sha:'abc',branch:'main',observedAt:'2026-10-06T05:30:00Z',proposals:[],sigmaDomains:[],
  runtimeEvidence:{
   decisions:[
    {decision_record_id:'kxagent-a',decision_record_hash:'a'.repeat(64),decision_phase:'AGENT_PRE_EXECUTION',decision_id:'bank-a',trace_id:'trace-a',domain:'bank',x108_gate:'ALLOW',reason_code:'GUARD_ALLOW',decision_authority:'KX108_ONLY',agent_id:'AgentA',action_id:'action-1',observedAt:'2026-10-06T05:30:00Z'},
    {decision_record_id:'kxagent-b',decision_record_hash:'b'.repeat(64),decision_phase:'AGENT_PRE_EXECUTION',decision_id:'bank-b',trace_id:'trace-b',domain:'bank',x108_gate:'HOLD',reason_code:'RISK',decision_authority:'KX108_ONLY',agent_id:'AgentB',action_id:'action-2',observedAt:'2026-10-06T05:31:00Z'}
   ],
   receipts:[
    {sealed_apply_receipt_id:'sar-a',sealed_apply_receipt_hash:'c'.repeat(64),status:'CONTENT_APPLIED',target_path:'src/a.py',target_pre_sha256:'1'.repeat(64),target_post_sha256:'2'.repeat(64),bytes_written:8,kx108_pre_decision_record_id:'kxagent-a',decision_authority:'KX108_ONLY',observedAt:'2026-10-06T05:30:10Z'}
   ],
   rollbacks:[]
  }
 }
 const live={observedAt:'2026-10-06T05:31:01Z',sessions:[{
  sessionId:'s1',agentId:'AgentA',name:'AgentA',status:'working',phase:'DONE',presence:'ended',timestamp:'2026-10-06T05:30:05Z',events:[
   {kind:'response',timestamp:'2026-10-06T05:30:05Z',result:{action_id:'action-1'}}
  ]
 }]}
 const state=buildObsidiaState(snapshot,live)
 const linked=state.missions.find(m=>m.actionId==='action-1')
 const unlinked=state.missions.find(m=>m.actionId==='action-2')
 assert.deepEqual(linked?.sessionRefs,['session:s1'])
 assert.deepEqual(linked?.decisionRecordRefs,['decision_record:kxagent-a'])
 assert.deepEqual(linked?.receiptRefs,['sealed_receipt:sar-a'])
 assert.deepEqual(linked?.impactRefs,['impact:sar-a'])
 assert.equal(linked?.status,'IMPACT_PROVED')
 assert.equal(linked?.traceabilityStatus,'COMPLETE')
 assert.deepEqual(linked?.traceabilityGaps,[])
 assert.deepEqual(unlinked?.sessionRefs,[])
 assert.equal(unlinked?.status,'DECISION_OBSERVED')
 assert.equal(unlinked?.traceabilityStatus,'INCOMPLETE')
 assert.ok(unlinked?.traceabilityGaps.includes('SESSION_UNLINKED'))
 assert.ok(unlinked?.traceabilityGaps.includes('RECEIPT_MISSING'))
 assert.equal(state.relations.some(r=>r.from==='mission:action-2'&&r.type==='HAS_SESSION'),false)
})
