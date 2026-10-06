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
   if(event.kind==='response'||event.kind==='audit_result'){
    const resultId=stable('result',s.sessionId+':'+i)
    entities.push({id:resultId,kind:'result',label:event.kind==='response'?'Réponse produite':'Résultat d’audit',source:'runtime_event',sessionId:s.sessionId,eventKind:event.kind,timestamp:event.timestamp,data:event.result||null})
    relations.push({from:sessionId,type:'PRODUCES_RESULT',to:resultId})
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
  entities,relations,sessions,
  views:{
   world:{question:'OÙ ?',entityRefs:entities.filter(e=>['ecosystem','repository','domain','agent','session','proposal','receipt','objective','result','artifact','decision'].includes(e.kind)).map(e=>e.id)},
   workspace:{question:'QUOI ?',entityRefs:entities.filter(e=>['repository','domain','proposal','receipt','session','objective','result','artifact','decision'].includes(e.kind)).map(e=>e.id)},
   pokemon:{question:'QUI ?',entityRefs:entities.filter(e=>['agent','session'].includes(e.kind)).map(e=>e.id)}
  }
 }
}
