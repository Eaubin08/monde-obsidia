// C5.5 read-only aggregate: do not infer runtime verification from Git presence.
export function projectC55LocalDiagnostic(source,evidence) {
 const sourceOk=source?.sourcePresent===true && source?.status==='SOURCE_GIT_OBSERVED_NOT_RUNTIME_VERIFIED'
 const observations=Number.isSafeInteger(evidence?.recordCount) && evidence.recordCount>=0 ? evidence.recordCount : 0
 const status=!sourceOk?'SOURCE_NOT_READY':observations===0?'SOURCE_FOUND_NO_LOCAL_DECISIONS':'LOCAL_DECISIONS_UNATTRIBUTED'
 return Object.freeze({
  schema:'OBSIDIA_C55_LOCAL_DIAGNOSTIC_V0',readonly:true,canonicalTruth:false,
  decisionAuthority:'KX108_ONLY',status,sourceAvailable:sourceOk,
  sourceHead:sourceOk?source.gitHead:null,sourceBranch:sourceOk?source.gitBranch:null,
  observedDecisions:observations,organizationVerified:false,
  receiptIntegrityVerified:false,runtimeExecutionVerified:false,executionAllowed:false,
  note:'Source Git, local evidence observations, and runtime authenticity are separate checks.'
 })
}
