// READ_ONLY projection of already-observed Obsidia runtime/repository state.
// This does not define a new canonical truth schema and never mutates the source repo.
const stable=(kind,id)=>`${kind}:${id}`

export function buildObsidiaState(snapshot,live){
 const repositoryId=snapshot?.available?stable('repository',snapshot.repository||'obsidia'):'repository:unavailable'
 const entities=[
  {id:'obsidia',kind:'ecosystem',label:'Obsidia',source:'projection'},
  {id:repositoryId,kind:'repository',label:snapshot?.repository||'Dépôt Obsidia',source:'git',sha:snapshot?.sha||null,branch:snapshot?.branch||null}
 ]
 const relations=[{from:'obsidia',type:'CONTAINS',to:repositoryId}]
 const agents=new Map()
 const sessions=[]
 const sessionActionIds=new Map()
 const actionResultIds=new Map()
 const sigmaAgentDomains={}
 for(const d of snapshot?.sigmaDomains||[]){
  const domainId=stable('domain',d.id)
  entities.push({id:domainId,kind:'domain',label:d.displayName,domainId:d.id,source:d.source,sourcePath:d.sourcePath,runtimeFilePresent:d.runtimeFilePresent,canonicalRegistry:'F60',agentCount:(d.agents||[]).length})
  relations.push({from:'obsidia',type:'HAS_DOMAIN',to:domainId},{from:repositoryId,type:'DECLARES_DOMAIN',to:domainId})
  for(const rawAgentId of d.agents||[]){
   const agentId=stable('agent',rawAgentId)
   sigmaAgentDomains[rawAgentId]=domainId
   if(!entities.find(e=>e.id===agentId))entities.push({id:agentId,kind:'agent',label:rawAgentId,agentId:rawAgentId,source:'sigma',sourcePath:d.sourcePath,domainId:d.id,runtimeDeclared:true})
   relations.push({from:domainId,type:'HAS_AGENT',to:agentId},{from:agentId,type:'BELONGS_TO_DOMAIN',to:domainId})
  }
 }
 for(const s of live?.sessions||[]){
  const agentId=stable('agent',s.agentId)
  if(!agents.has(agentId)&&!entities.find(e=>e.id===agentId)){
   const agent={id:agentId,kind:'agent',label:s.name||s.agentId,agentId:s.agentId,source:'runtime'}
   agents.set(agentId,agent);entities.push(agent);relations.push({from:'obsidia',type:'HAS_AGENT',to:agentId})
  }
  const sessionId=stable('session',s.sessionId)
  const session={id:sessionId,kind:'session',label:`${s.name||s.agentId} · ${s.sessionId.slice(0,8)}`,sessionId:s.sessionId,agentId:s.agentId,name:s.name||s.agentId,pid:s.pid||0,status:s.status,phase:s.phase,presence:s.presence,message:s.message||'',objective:s.objective||null,timestamp:s.timestamp,repository:s.repository||snapshot?.repository||null,exitCode:s.exitCode,source:'OBSIDIA_VISUAL_EVENT_V1',events:s.events||[]}
  sessions.push(session);entities.push(session)
  relations.push({from:agentId,type:'RUNS',to:sessionId},{from:sessionId,type:'OPERATES_IN',to:repositoryId})
  const domainId=sigmaAgentDomains[s.agentId]
  if(domainId)relations.push({from:sessionId,type:'RUNS_IN_DOMAIN',to:domainId})
  if(s.objective){
   const objectiveId=stable('objective',s.sessionId)
   entities.push({id:objectiveId,kind:'objective',label:s.objective,source:'runtime_objective',sessionId:s.sessionId})
   relations.push({from:sessionId,type:'HAS_OBJECTIVE',to:objectiveId})
  }
  for(let i=0;i<(s.events||[]).length;i++){
   const event=s.events[i]
   const observedActionId=event?.result?.action_id||event?.result?.actionId||event?.action_id||event?.actionId
   if(observedActionId){if(!sessionActionIds.has(observedActionId))sessionActionIds.set(observedActionId,[]);if(!sessionActionIds.get(observedActionId).includes(sessionId))sessionActionIds.get(observedActionId).push(sessionId)}
   if(event.kind==='response'||event.kind==='audit_result'){
    const resultId=stable('result',s.sessionId+':'+i)
    entities.push({id:resultId,kind:'result',label:event.kind==='response'?'Réponse produite':'Résultat d’audit',source:'runtime_event',sessionId:s.sessionId,eventKind:event.kind,timestamp:event.timestamp,data:event.result||null})
    relations.push({from:sessionId,type:'PRODUCES_RESULT',to:resultId})
    if(observedActionId){if(!actionResultIds.has(observedActionId))actionResultIds.set(observedActionId,[]);actionResultIds.get(observedActionId).push(resultId)}
    if(event.result&&event.result.decision_authority==='KX108_ONLY'&&event.result.verdict){
     const decisionId=stable('decision',s.sessionId+':'+i)
     entities.push({id:decisionId,kind:'decision',label:String(event.result.verdict),source:'canonical_runtime_result',sessionId:s.sessionId,decisionAuthority:'KX108_ONLY',verdict:String(event.result.verdict),timestamp:event.timestamp})
     relations.push({from:resultId,type:'CONTAINS_DECISION',to:decisionId})
    }
   }
   if(event.kind==='report'&&event.reportFile){
    const artifactId=stable('artifact',event.reportFile)
    entities.push({id:artifactId,kind:'artifact',label:event.reportFile,source:'runtime_report',sessionId:s.sessionId,path:event.reportFile,timestamp:event.timestamp})
    relations.push({from:sessionId,type:'PRODUCES_ARTIFACT',to:artifactId})
   }
  }
 }
 for(const service of live?.nativeServices||[]){
  const agentId=stable('agent',service.id)
  let agent=entities.find(e=>e.id===agentId)
  if(!agent){
   agent={id:agentId,kind:'agent',label:service.label,agentId:service.id,source:'native_service_observation',runtimeDeclared:true}
   entities.push(agent)
   relations.push({from:'obsidia',type:'HAS_AGENT',to:agentId})
  }

  const existingLive=sessions.find(s=>s.agentId===service.id&&s.presence==='live')
  if(service.state==='OFFLINE'){
   if(existingLive){
    existingLive.presence='ended'
    existingLive.status='idle'
    existingLive.phase='OFFLINE'
    existingLive.message='Service non observé'
    const entity=entities.find(e=>e.id===existingLive.id)
    if(entity)Object.assign(entity,existingLive)
   }
   continue
  }

  const observedSessionId=service.sessionId||('observed-'+service.id)
  const sessionId=existingLive?.id||stable('session',observedSessionId)
  const status=service.state==='STARTING'?'waiting':'idle'
  const phase=service.state
  const message=service.state==='READY'?'Service observé actif':'Démarrage observé'
  if(existingLive){
   Object.assign(existingLive,{
    status,phase,presence:'live',message,
    nativeService:true,observationEvidence:service.evidence,
    decisionAuthority:service.decisionAuthority||'KX108_ONLY',
    observedState:service.state
   })
   const entity=entities.find(e=>e.id===existingLive.id)
   if(entity)Object.assign(entity,existingLive)
  }else{
   const session={
    id:sessionId,kind:'session',label:service.label+' · runtime',sessionId:observedSessionId,
    agentId:service.id,name:service.label,pid:0,status,phase,presence:'live',
    message,objective:null,timestamp:service.observedAt,
    repository:snapshot?.repository||null,exitCode:null,
    source:'NATIVE_SERVICE_OBSERVATION_V1',events:[],
    nativeService:true,observationEvidence:service.evidence,
    decisionAuthority:service.decisionAuthority||'KX108_ONLY',
    observedState:service.state
   }
   sessions.push(session);entities.push(session)
   relations.push(
    {from:agentId,type:'RUNS',to:sessionId},
    {from:sessionId,type:'OPERATES_IN',to:repositoryId}
   )
  }
 }

 const jarjar=live?.jarjar
 if(jarjar&&jarjar.state!=='OFFLINE'){
  const agentId=stable('agent','jarjar')
  let agent=entities.find(e=>e.id===agentId)
  if(!agent){
   agent={id:agentId,kind:'agent',label:'Jarjar',agentId:'jarjar',source:'jarjar_runtime',runtimeDeclared:true}
   entities.push(agent)
   relations.push({from:'obsidia',type:'HAS_AGENT',to:agentId})
  }

  const existing=sessions.find(s=>s.agentId==='jarjar')
  const observedSessionId=jarjar.sessionId||'jarjar-observed'
  const sessionId=existing?.id||stable('session',observedSessionId)
  const phase=String(jarjar.hudState||jarjar.state||'STARTING').toUpperCase()
  const statusMap={THINKING:'thinking',SPEAKING:'typing',ERROR:'error',LISTENING:'waiting',IDLE:'idle'}
  const status=statusMap[phase]||(jarjar.state==='STARTING'?'waiting':'idle')
  const message=jarjar.lastResult||jarjar.lastUserInput||('Jarjar '+jarjar.state)
  if(existing){
   Object.assign(existing,{
    status,phase,presence:'live',message,
    objective:jarjar.lastUserInput||existing.objective||null,
    jarjarRuntime:true,inputMode:jarjar.inputMode||null,
    cognitionSource:jarjar.cognitionSource||'',
    decisionAuthority:jarjar.decisionAuthority||'KX108_ONLY',
    governanceSource:jarjar.governanceSource||'',
    governancePhase:jarjar.governancePhase||'',
    humanConfirmationRequired:!!jarjar.humanConfirmationRequired,
    confirmationPrompt:jarjar.confirmationPrompt||'',
    telemetryFresh:!!jarjar.telemetryFresh,
    components:jarjar.components||null
   })
   const entity=entities.find(e=>e.id===existing.id)
   if(entity)Object.assign(entity,existing)
  }else{
   const session={
    id:sessionId,kind:'session',label:'Jarjar · runtime',sessionId:observedSessionId,
    agentId:'jarjar',name:'Jarjar',pid:0,status,phase,presence:'live',
    message,objective:jarjar.lastUserInput||null,timestamp:jarjar.observedAt,
    repository:null,exitCode:null,source:'JARJAR_RUNTIME_STATUS_V1',events:[],
    jarjarRuntime:true,inputMode:jarjar.inputMode||null,cognitionSource:jarjar.cognitionSource||'',
    decisionAuthority:jarjar.decisionAuthority||'KX108_ONLY',
    governanceSource:jarjar.governanceSource||'',governancePhase:jarjar.governancePhase||'',
    humanConfirmationRequired:!!jarjar.humanConfirmationRequired,
    confirmationPrompt:jarjar.confirmationPrompt||'',
    telemetryFresh:!!jarjar.telemetryFresh,components:jarjar.components||null
   }
   sessions.push(session);entities.push(session)
   relations.push(
    {from:agentId,type:'RUNS',to:sessionId},
    {from:sessionId,type:'OPERATES_IN',to:repositoryId}
   )
  }
 }

 for(const d of snapshot?.runtimeEvidence?.decisions||[]){
  if(!d.decision_record_id)continue
  const id=stable('decision_record',d.decision_record_id)
  entities.push({id,kind:'decision_record',label:d.x108_gate||d.decision_record_id,source:'LOCALAPPDATA/kx108_decisions',recordId:d.decision_record_id,recordHash:d.decision_record_hash,decisionId:d.decision_id,traceId:d.trace_id,domainId:d.domain,gate:d.x108_gate,reasonCode:d.reason_code,severity:d.severity,decisionAuthority:d.decision_authority,decisionPhase:d.decision_phase,observedAt:d.observedAt})
  relations.push({from:'obsidia',type:'HAS_DECISION_RECORD',to:id})
  if(d.domain){const domainId=stable('domain',d.domain);if(entities.some(e=>e.id===domainId))relations.push({from:id,type:'DECIDES_IN_DOMAIN',to:domainId})}
  if(d.agent_id){const agentId=stable('agent',d.agent_id);if(entities.some(e=>e.id===agentId))relations.push({from:agentId,type:'HAS_DECISION_RECORD',to:id})}
 }
 for(const r of snapshot?.runtimeEvidence?.receipts||[]){
  if(!r.sealed_apply_receipt_id)continue
  const rid=stable('sealed_receipt',r.sealed_apply_receipt_id)
  entities.push({id:rid,kind:'sealed_receipt',label:r.status||r.sealed_apply_receipt_id,source:'LOCALAPPDATA/sealed_receipts',receiptId:r.sealed_apply_receipt_id,receiptHash:r.sealed_apply_receipt_hash,targetPath:r.target_path,targetPreSha256:r.target_pre_sha256,targetPostSha256:r.target_post_sha256,bytesWritten:r.bytes_written,status:r.status,decisionAuthority:r.decision_authority,observedAt:r.observedAt})
  relations.push({from:'obsidia',type:'HAS_SEALED_RECEIPT',to:rid})
  if(r.kx108_pre_decision_record_id)relations.push({from:stable('decision_record',r.kx108_pre_decision_record_id),type:'AUTHORIZES_RECEIPT',to:rid})
  if(r.sealed_rollback_evidence_id)relations.push({from:stable('rollback_evidence',r.sealed_rollback_evidence_id),type:'PROTECTS_CHANGE',to:rid})
  if(r.target_path){
   const impactId=stable('impact',r.sealed_apply_receipt_id)
   entities.push({id:impactId,kind:'impact',label:r.target_path,source:'sealed_apply_receipt',targetPath:r.target_path,beforeSha256:r.target_pre_sha256,afterSha256:r.target_post_sha256,status:r.status,bytesWritten:r.bytes_written,observedAt:r.observedAt})
   relations.push({from:rid,type:'PROVES_IMPACT',to:impactId})
  }
 }
 for(const r of snapshot?.runtimeEvidence?.rollbacks||[]){
  if(!r.sealed_rollback_evidence_id)continue
  const id=stable('rollback_evidence',r.sealed_rollback_evidence_id)
  entities.push({id,kind:'rollback_evidence',label:r.target_path||r.sealed_rollback_evidence_id,source:'LOCALAPPDATA/sealed_rollback_evidence',evidenceId:r.sealed_rollback_evidence_id,evidenceHash:r.sealed_rollback_evidence_hash,targetPath:r.target_path,preWriteSha256:r.pre_write_sha256,preWriteSize:r.pre_write_size,sealed:r.sealed,decisionAuthority:r.decision_authority,observedAt:r.observedAt})
  relations.push({from:'obsidia',type:'HAS_ROLLBACK_EVIDENCE',to:id})
  if(r.kx108_pre_decision_record_id)relations.push({from:stable('decision_record',r.kx108_pre_decision_record_id),type:'HAS_ROLLBACK_EVIDENCE',to:id})
 }
 const missions=[]
 for(const d of snapshot?.runtimeEvidence?.decisions||[]){
  if(!d.action_id||!d.decision_record_id)continue
  const missionId=stable('mission',d.action_id)
  let mission=missions.find(m=>m.id===missionId)
  if(!mission){
   mission={id:missionId,kind:'mission',label:d.action_id,actionId:d.action_id,domainId:d.domain||null,agentId:d.agent_id||null,decisionRecordRefs:[],sessionRefs:[],resultRefs:[],receiptRefs:[],impactRefs:[],status:'DECISION_OBSERVED'}
   missions.push(mission);entities.push(mission);relations.push({from:'obsidia',type:'HAS_MISSION',to:missionId})
   const domainRef=d.domain?stable('domain',d.domain):null;if(domainRef&&entities.some(e=>e.id===domainRef))relations.push({from:missionId,type:'IN_DOMAIN',to:domainRef})
   const agentRef=d.agent_id?stable('agent',d.agent_id):null;if(agentRef&&entities.some(e=>e.id===agentRef))relations.push({from:missionId,type:'USES_AGENT',to:agentRef})
   for(const sessionRef of sessionActionIds.get(d.action_id)||[]){mission.sessionRefs.push(sessionRef);relations.push({from:missionId,type:'HAS_SESSION',to:sessionRef})}
   for(const resultRef of actionResultIds.get(d.action_id)||[]){mission.resultRefs.push(resultRef);relations.push({from:missionId,type:'HAS_RESULT',to:resultRef})}
  }
  const decisionRef=stable('decision_record',d.decision_record_id);if(!mission.decisionRecordRefs.includes(decisionRef))mission.decisionRecordRefs.push(decisionRef);relations.push({from:missionId,type:'HAS_DECISION',to:decisionRef})
 }
 for(const mission of missions){
  for(const decisionRef of mission.decisionRecordRefs){
   for(const rel of relations.filter(r=>r.from===decisionRef&&r.type==='AUTHORIZES_RECEIPT')){
    if(!mission.receiptRefs.includes(rel.to))mission.receiptRefs.push(rel.to)
    relations.push({from:mission.id,type:'HAS_RECEIPT',to:rel.to})
    for(const impactRel of relations.filter(r=>r.from===rel.to&&r.type==='PROVES_IMPACT')){
     if(!mission.impactRefs.includes(impactRel.to))mission.impactRefs.push(impactRel.to)
     relations.push({from:mission.id,type:'HAS_IMPACT',to:impactRel.to})
    }
   }
  }
  const gaps=[]
  if(!mission.agentId)gaps.push('AGENT_UNLINKED')
  if(!mission.sessionRefs.length)gaps.push('SESSION_UNLINKED')
  if(!mission.resultRefs.length)gaps.push('RESULT_UNLINKED')
  if(!mission.decisionRecordRefs.length)gaps.push('DECISION_MISSING')
  if(mission.decisionRecordRefs.length&&!mission.receiptRefs.length)gaps.push('RECEIPT_MISSING')
  if(mission.receiptRefs.length&&!mission.impactRefs.length)gaps.push('IMPACT_UNPROVED')
  mission.traceabilityGaps=gaps
  mission.traceabilityStatus=gaps.length?'INCOMPLETE':'COMPLETE'
  const priorityOrder=['DECISION_MISSING','RECEIPT_MISSING','RESULT_UNLINKED','IMPACT_UNPROVED','SESSION_UNLINKED','AGENT_UNLINKED']
  mission.primaryBlocker=priorityOrder.find(x=>gaps.includes(x))||null
  const advice={
   DECISION_MISSING:'Obtenir ou relier une décision KX108 canonique avant toute suite.',
   RECEIPT_MISSING:'Compléter la preuve d’exécution : aucun receipt scellé n’est relié.',
   IMPACT_UNPROVED:'Vérifier et relier l’impact mesuré avant de considérer la mission clôturée.',
   RESULT_UNLINKED:'Relier le résultat runtime portant le même action_id pour compléter la chaîne de mission.',
   SESSION_UNLINKED:'Relier la session réelle via le même action_id pour restaurer la traçabilité.',
   AGENT_UNLINKED:'Relier l’agent canonique responsable de la mission.'
  }
  mission.recommendedNextStep=mission.primaryBlocker?advice[mission.primaryBlocker]:'Aucune action de traçabilité requise.'
  mission.priorityLevel=mission.primaryBlocker?(mission.primaryBlocker==='DECISION_MISSING'||mission.primaryBlocker==='RECEIPT_MISSING'?'HIGH':'MEDIUM'):'NONE'
  mission.advisoryOnly=true
  mission.decisionAuthority='KX108_ONLY'
  mission.status=mission.impactRefs.length?'IMPACT_PROVED':mission.receiptRefs.length?'RECEIPT_OBSERVED':mission.decisionRecordRefs.length?'DECISION_OBSERVED':'OBSERVED'
 }
 for(const p of snapshot?.proposals||[]){
  const proposalId=stable('proposal',p.id)
  entities.push({id:proposalId,kind:'proposal',label:p.id,path:p.path,observedAt:p.observedAt,source:'_PATCH_PROPOSALS'})
  relations.push({from:repositoryId,type:'HAS_PROPOSAL',to:proposalId})
  if(p.receipt){
   const receiptId=stable('receipt',p.receipt)
   entities.push({id:receiptId,kind:'receipt',label:p.receipt,path:p.receipt,source:'repo'})
   relations.push({from:proposalId,type:'HAS_RECEIPT',to:receiptId})
  }
 }
 return {
  schema:'OBSIDIA_WORLD_PROJECTION_V0',
  readonly:true,
  canonicalTruth:false,
  decisionAuthority:'KX108_ONLY',
  sourceSchemas:['Event Schema Obsidia V4 (reference)','OBSIDIA_VISUAL_EVENT_V1 (runtime observation)','Git repository snapshot'],
  observedAt:live?.observedAt||snapshot?.observedAt||new Date().toISOString(),
  entities,relations,sessions,missions,agentFamilies:snapshot?.agentFamilies||[],
  views:{
   world:{question:'OÙ ?',entityRefs:entities.filter(e=>['ecosystem','repository','domain','agent','session','proposal','receipt','objective','result','artifact','decision','decision_record','sealed_receipt','rollback_evidence','impact','mission'].includes(e.kind)).map(e=>e.id)},
   workspace:{question:'QUOI ?',entityRefs:entities.filter(e=>['repository','domain','proposal','receipt','session','objective','result','artifact','decision','decision_record','sealed_receipt','rollback_evidence','impact','mission'].includes(e.kind)).map(e=>e.id)},
   pokemon:{question:'QUI ?',entityRefs:entities.filter(e=>['agent','session'].includes(e.kind)).map(e=>e.id)}
  }
 }
}
