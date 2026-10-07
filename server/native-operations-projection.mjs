import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs'
import {resolve} from 'node:path'
import {homedir} from 'node:os'

const localBase=()=>process.env.LOCALAPPDATA||resolve(homedir(),'AppData','Local')
export const defaultNativeSourceRuntimeRoot=()=>process.env.OBSIDIA_NATIVE_SOURCE_RUNTIME_ROOT||resolve(localBase(),'Obsidia','native_sources')
export const defaultNativeOpsRoot=()=>process.env.OBSIDIA_NATIVE_OPS_ROOT||resolve(localBase(),'Obsidia','native_ops')

function safeJson(path,max=2*1024*1024){
 try{
  if(!existsSync(path)||!statSync(path).isFile()||statSync(path).size>max)return null
  return JSON.parse(readFileSync(path,'utf8'))
 }catch{return null}
}

function dirs(path){
 try{return existsSync(path)?readdirSync(path,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name):[]}catch{return []}
}
function files(path){
 try{return existsSync(path)?readdirSync(path,{withFileTypes:true}).filter(x=>x.isFile()&&x.name.endsWith('.json')).map(x=>x.name):[]}catch{return []}
}

export function readNativeOperationalEvidence(sourceRootOverride=null,opsRootOverride=null){
 const sourceRoot=sourceRootOverride||defaultNativeSourceRuntimeRoot()
 const opsRoot=opsRootOverride||defaultNativeOpsRoot()
 const sources=[]
 const observations=[]
 const packets=[]
 const entities=[]
 const receipts=[]

 const registrations=resolve(sourceRoot,'registry','registrations')
 for(const name of files(registrations)){
  const data=safeJson(resolve(registrations,name))
  if(!data||data.schema!=='OBSIDIA_NATIVE_SOURCE_REGISTRATION_V0')continue
  sources.push({
   source_id:data.source_id,
   source_kind:data.source_kind,
   provider:data.provider,
   registration_hash:data.registration_hash,
   capabilities:Array.isArray(data.capabilities)?data.capabilities:[],
   active:data.active===true,
   readonly:data.readonly===true,
   external_mutation_allowed:data.external_mutation_allowed===true,
   decision_authority:data.decision_authority,
   registered_at:data.registered_at
  })
 }

 const obsRoot=resolve(sourceRoot,'observations')
 for(const sourceId of dirs(obsRoot)){
  for(const name of files(resolve(obsRoot,sourceId))){
   const data=safeJson(resolve(obsRoot,sourceId,name))
   if(!data||data.schema!=='OBSIDIA_NATIVE_SOURCE_OBSERVATION_V0')continue
   observations.push({
    observation_id:data.observation_id,
    observation_hash:data.observation_hash,
    source_id:data.source_id,
    source_kind:data.source_kind,
    provider:data.provider,
    registration_hash:data.registration_hash,
    provider_item_id_sha256:data.provider_item_id_sha256,
    content_sha256:data.content_sha256,
    metadata_sha256:data.metadata_sha256,
    observed_at:data.observed_at,
    decision_authority:data.decision_authority
   })
  }
 }

 const packetRoot=resolve(sourceRoot,'packets')
 for(const sourceId of dirs(packetRoot)){
  for(const name of files(resolve(packetRoot,sourceId))){
   const data=safeJson(resolve(packetRoot,sourceId,name))
   if(!data||data.schema!=='OBSIDIA_NATIVE_SOURCE_CONTEXT_PACKET_V0')continue
   packets.push({
    packet_id:data.packet_id,
    packet_hash:data.packet_hash,
    source_id:data.source_id,
    source_kind:data.source_kind,
    provider:data.provider,
    registration_hash:data.registration_hash,
    observation_id:data.observation_id,
    observation_hash:data.observation_hash,
    content_sha256:data.content_sha256,
    metadata_sha256:data.metadata_sha256,
    observed_at:data.observed_at,
    provenance_complete:data.provenance_complete===true,
    decision_authority:data.decision_authority
   })
  }
 }

 const domains=['native_tasks','native_crm']
 for(const domain of domains){
  const domainRoot=resolve(opsRoot,domain)
  for(const kind of dirs(domainRoot)){
   const kindRoot=resolve(domainRoot,kind)
   for(const entityId of dirs(kindRoot)){
    const entityRoot=resolve(kindRoot,entityId)
    const state=safeJson(resolve(entityRoot,'state.json'))
    if(state){
     const canonicalEntityId=
      state.task_id||state.record_id||state.followup_id||
      state.interaction_id||state.relationship_id||entityId
     entities.push({
      domain_id:domain,
      entity_kind:kind,
      entity_id:canonicalEntityId,
      storage_component:entityId,
      schema:state.schema,
      state
     })
    }
    const receiptRoot=resolve(entityRoot,'receipts')
    for(const name of files(receiptRoot)){
     const data=safeJson(resolve(receiptRoot,name))
     if(!data||data.schema!=='NATIVE_MUTATION_RECEIPT_V0')continue
     receipts.push({
      receipt_id:data.receipt_id,
      receipt_hash:data.receipt_hash,
      domain_id:data.domain_id,
      entity_kind:data.entity_kind,
      entity_id:data.entity_id,
      operation:data.operation,
      mutation_id:data.mutation_id,
      mutation_hash:data.mutation_hash,
      world_action_request_hash:data.world_action_request_hash,
      kx108_decision_record_id:data.kx108_decision_record_id,
      kx108_decision_record_hash:data.kx108_decision_record_hash,
      before_state_hash:data.before_state_hash,
      after_state_hash:data.after_state_hash,
      created_at:data.created_at,
      version:data.version,
      decision_authority:data.decision_authority
     })
    }
   }
  }
 }

 const observedTimes=[
  ...sources.map(x=>x.registered_at),
  ...observations.map(x=>x.observed_at),
  ...packets.map(x=>x.observed_at),
  ...receipts.map(x=>x.created_at)
 ].filter(Boolean).map(x=>Date.parse(x)).filter(Number.isFinite)

 return {
  schema:'OBSIDIA_NATIVE_OPERATIONAL_PROJECTION_INPUT_V0',
  readonly:true,
  decisionAuthority:'KX108_ONLY',
  sourceRoot,
  opsRoot,
  sourceRuntimePresent:existsSync(sourceRoot),
  nativeOpsPresent:existsSync(opsRoot),
  sources,
  observations,
  packets,
  entities,
  receipts,
  observedAt:observedTimes.length?new Date(Math.max(...observedTimes)).toISOString():new Date().toISOString()
 }
}
