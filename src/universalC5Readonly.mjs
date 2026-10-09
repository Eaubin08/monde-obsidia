// C5 Universal read-only projection. Pure data transformation: no IO, no authority.
export const C5_SCHEMA = 'OBSIDIA_C5_UNIVERSAL_READ_MODEL_V0'
const FIELDS = ['organization_id','domain_id','source_ref','capability_id','delegation_generation','decision_record_id','ticket_hash','receipt_id']
const allowedEvidence = new Set(['SYNTHETIC_FIXTURE','SANDBOX_RECEIPT','DOCUMENTED_REFERENCE','INDEPENDENTLY_VERIFIED'])
const safeId = x => typeof x === 'string' && x.length > 0 && x.length <= 256 && !/[\u0000-\u001f]/.test(x)
export function projectUniversalC5Readonly(records, {organizationId = null} = {}) {
  if (!Array.isArray(records) || records.length > 10000) throw Error('C5_RECORD_SET_INVALID')
  if (organizationId !== null && !safeId(organizationId)) throw Error('C5_SCOPE_INVALID')
  const seen = new Set()
  const organizations = new Map()
  const projected = []
  for (const item of records) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw Error('C5_RECORD_INVALID')
    if (FIELDS.some(key => !safeId(item[key]) && !(key==='delegation_generation' && Number.isSafeInteger(item[key]) && item[key]>=0))) {
      throw Error('C5_MISSING_BOUND_FIELDS')
    }
    if (typeof item.delegation_generation !== 'number' || !Number.isSafeInteger(item.delegation_generation) || item.delegation_generation < 0) throw Error('C5_GENERATION_INVALID')
    if (!allowedEvidence.has(item.evidence_grade)) throw Error('C5_EVIDENCE_GRADE_INVALID')
    if (item.decision_authority !== 'KX108_ONLY') throw Error('C5_AUTHORITY_INVALID')
    const id = [item.organization_id,item.domain_id,item.source_ref,item.capability_id,item.decision_record_id,item.receipt_id].map(x => x.length + ':' + x).join('|')
    if (seen.has(id)) throw Error('C5_DUPLICATE_RECORD')
    seen.add(id)
    if (organizationId !== null && item.organization_id !== organizationId) continue
    const verified = item.evidence_grade === 'INDEPENDENTLY_VERIFIED' && item.authority_verified === true
    const blocked = item.gate !== 'ALLOW' || !verified || item.source_revoked === true || item.delegation_revoked === true || item.kx108_invoked !== true
    const row = Object.freeze({
      organizationId:item.organization_id,domainId:item.domain_id,sourceRef:item.source_ref,
      capabilityId:item.capability_id,delegationGeneration:item.delegation_generation,
      decisionRecordId:item.decision_record_id,ticketHash:item.ticket_hash,receiptId:item.receipt_id,
      gate:typeof item.gate==='string'?item.gate:'UNKNOWN',
      evidenceGrade:item.evidence_grade,
      sourceRevoked:item.source_revoked===true,delegationRevoked:item.delegation_revoked===true,
      verifiedAuthority:verified,kx108Invoked:item.kx108_invoked===true,
      // This projection is not an execution authorizer even if inputs claim valid ALLOW.
      canExecute:false,executionAuthority:false,
      status:blocked?'REVIEW_OR_BLOCK_ONLY':'OBSERVED_ALLOW_NOT_EXECUTION_AUTHORITY',
    })
    projected.push(row)
    if (!organizations.has(row.organizationId)) organizations.set(row.organizationId,new Set())
    organizations.get(row.organizationId).add(row.domainId)
  }
  return Object.freeze({
    schema:C5_SCHEMA,readonly:true,canonicalTruth:false,decisionAuthority:'KX108_ONLY',
    organizationFilter:organizationId,organizationCount:organizations.size,recordCount:projected.length,
    organizations:Object.freeze([...organizations].map(([organizationId,domains])=>Object.freeze({organizationId,domains:Object.freeze([...domains].sort())})).sort((a,b)=>a.organizationId.localeCompare(b.organizationId))),
    records:Object.freeze(projected),
    executionAllowed:false,providerCallsPerformed:false,
    caveat:'Projection de preuves fournies; aucun contrôle indépendant ni autorisation d action.'
  })
}
