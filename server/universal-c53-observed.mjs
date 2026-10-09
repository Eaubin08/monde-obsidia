// C5.3: runtime evidence inventory WITHOUT inferring organizational identity.
// Input is the existing safe projection emitted by canonicalRuntimeEvidence().
const valid = value => typeof value === 'string' && value.length > 0 && value.length <= 256
export function projectC53ObservedEvidence(snapshot) {
  const decisions=Array.isArray(snapshot?.decisions)?snapshot.decisions:[]
  const receipts=Array.isArray(snapshot?.receipts)?snapshot.receipts:[]
  const matches=new Map()
  const entries=[]
  for (const d of decisions.slice(-100)) {
    if (!valid(d.decision_record_id)) continue
    const linked=receipts.filter(r=>r.kx108_pre_decision_record_id===d.decision_record_id &&
      valid(r.kx108_pre_decision_record_hash) && r.kx108_pre_decision_record_hash===d.decision_record_hash)
    const record=Object.freeze({
      decisionRecordId:d.decision_record_id,recordHash:valid(d.decision_record_hash)?d.decision_record_hash:null,
      domainId:valid(d.domain)?d.domain:null,gate:valid(d.x108_gate)?d.x108_gate:'UNKNOWN',
      observedAt:valid(d.observedAt)?d.observedAt:null,
      receiptRefs:Object.freeze(linked.filter(r=>valid(r.sealed_apply_receipt_id)).map(r=>r.sealed_apply_receipt_id)),
      organizationId:null,organizationAttribution:'NOT_VERIFIED',
      evidenceStatus:linked.length?'OBSERVED_RECORD_HASH_LINK_NOT_CRYPTO_VERIFIED':'RECEIPT_LINK_UNAVAILABLE',
      authority:'KX108_ONLY',executionAllowed:false,
    })
    if (matches.has(record.decisionRecordId)) continue
    matches.set(record.decisionRecordId,true)
    entries.push(record)
  }
  return Object.freeze({
    schema:'OBSIDIA_C53_OBSERVED_EVIDENCE_QUARANTINE_V0',
    readonly:true,canonicalTruth:false,decisionAuthority:'KX108_ONLY',
    status:'UNATTRIBUTED_OBSERVATION_ONLY',organizationId:null,
    recordCount:entries.length,records:Object.freeze(entries),
    executionAllowed:false,independentIntegrityVerified:false,
    caveat:'Local file observations are not authenticated organizational scope or verified KX108 authority.'
  })
}
