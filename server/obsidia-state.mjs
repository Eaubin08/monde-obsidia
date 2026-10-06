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
 for(const s of live?.sessions||[]){
  const agentId=stable('agent',s.agentId)
  if(!agents.has(agentId)){
   const agent={id:agentId,kind:'agent',label:s.name||s.agentId,agentId:s.agentId,source:'runtime'}
   agents.set(agentId,agent);entities.push(agent);relations.push({from:'obsidia',type:'HAS_AGENT',to:agentId})
  }
  const sessionId=stable('session',s.sessionId)
  const session={id:sessionId,kind:'session',label:`${s.name||s.agentId} · ${s.sessionId.slice(0,8)}`,sessionId:s.sessionId,agentId:s.agentId,status:s.status,phase:s.phase,presence:s.presence,objective:s.objective||null,timestamp:s.timestamp,repository:s.repository||snapshot?.repository||null,source:'OBSIDIA_VISUAL_EVENT_V1',events:s.events||[]}
  sessions.push(session);entities.push(session)
  relations.push({from:agentId,type:'RUNS',to:sessionId},{from:sessionId,type:'OPERATES_IN',to:repositoryId})
  if(s.objective){
   const objectiveId=stable('objective',s.sessionId)
   entities.push({id:objectiveId,kind:'objective',label:s.objective,source:'runtime_objective',sessionId:s.sessionId})
   relations.push({from:sessionId,type:'HAS_OBJECTIVE',to:objectiveId})
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
   world:{question:'OÙ ?',entityRefs:entities.map(e=>e.id)},
   workspace:{question:'QUOI ?',entityRefs:entities.filter(e=>['repository','proposal','receipt','session','objective'].includes(e.kind)).map(e=>e.id)},
   pokemon:{question:'QUI ?',entityRefs:entities.filter(e=>['agent','session'].includes(e.kind)).map(e=>e.id)}
  }
 }
}
