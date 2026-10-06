import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {canonicalRuntimeEvidence} from '../server/local-bridge.mjs'

test('runtime evidence reader strips rollback preimage bytes at source',()=>{
 const root=mkdtempSync(join(tmpdir(),'obsidia-evidence-'))
 try{
  mkdirSync(join(root,'kx108_decisions'),{recursive:true})
  mkdirSync(join(root,'sealed_receipts'),{recursive:true})
  mkdirSync(join(root,'sealed_rollback_evidence'),{recursive:true})
  writeFileSync(join(root,'sealed_rollback_evidence','sre-test.json'),JSON.stringify({
   sealed_rollback_evidence_id:'sre-test',
   sealed_rollback_evidence_hash:'b'.repeat(64),
   target_path:'src/example.py',
   pre_write_sha256:'1'.repeat(64),
   pre_write_size:41,
   source_content_sha256:'2'.repeat(64),
   kx108_pre_decision_record_id:'kxagent-test',
   kx108_pre_decision_record_hash:'d'.repeat(64),
   decision_authority:'KX108_ONLY',
   sealed:true,
   pre_write_bytes_b64:'SECRET_PREIMAGE_BYTES'
  }))
  const evidence=canonicalRuntimeEvidence(root)
  assert.equal(evidence.rollbacks.length,1)
  assert.equal(evidence.rollbacks[0].sealed_rollback_evidence_id,'sre-test')
  assert.equal(JSON.stringify(evidence).includes('SECRET_PREIMAGE_BYTES'),false)
  assert.equal('pre_write_bytes_b64' in evidence.rollbacks[0],false)
 }finally{rmSync(root,{recursive:true,force:true})}
})
