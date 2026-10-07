import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {resolve} from 'node:path'
import {tmpdir} from 'node:os'

import {readNativeOperationalEvidence} from '../server/native-operations-projection.mjs'
import {buildObsidiaState} from '../server/obsidia-state.mjs'

function write(path,data){mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,JSON.stringify(data,null,2))}

test('native operational projection exposes only canonical readonly objects',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'obsidia-native-projection-'))
 try{
  const source=resolve(root,'sources'),ops=resolve(root,'ops')
  const registration={
   schema:'OBSIDIA_NATIVE_SOURCE_REGISTRATION_V0',source_id:'source:mail',source_kind:'MAILBOX',provider:'LOCAL_MAIL_FIXTURE',
   registration_hash:'r'.repeat(64),capabilities:['READ_MESSAGE','SEARCH'],active:true,readonly:true,
   external_mutation_allowed:false,decision_authority:'KX108_ONLY',registered_at:'2026-10-07T12:00:00+00:00'
  }
  write(resolve(source,'registry','registrations','source-mail.json'),registration)
  write(resolve(source,'observations','id-source-mail','obs.json'),{
   schema:'OBSIDIA_NATIVE_SOURCE_OBSERVATION_V0',observation_id:'obs-1',observation_hash:'o'.repeat(64),
   source_id:'source:mail',source_kind:'MAILBOX',provider:'LOCAL_MAIL_FIXTURE',registration_hash:'r'.repeat(64),
   provider_item_id_sha256:'i'.repeat(64),content_sha256:'c'.repeat(64),metadata_sha256:'m'.repeat(64),
   observed_at:'2026-10-07T12:01:00+00:00',decision_authority:'KX108_ONLY'
  })
  write(resolve(source,'packets','id-source-mail','packet.json'),{
   schema:'OBSIDIA_NATIVE_SOURCE_CONTEXT_PACKET_V0',packet_id:'packet-1',packet_hash:'p'.repeat(64),
   source_id:'source:mail',source_kind:'MAILBOX',provider:'LOCAL_MAIL_FIXTURE',registration_hash:'r'.repeat(64),
   observation_id:'obs-1',observation_hash:'o'.repeat(64),content_sha256:'c'.repeat(64),metadata_sha256:'m'.repeat(64),
   observed_at:'2026-10-07T12:01:00+00:00',provenance_complete:true,decision_authority:'KX108_ONLY'
  })
  write(resolve(ops,'native_tasks','task','id-task-storage','state.json'),{
   schema:'TASK_NATIVE_V0',task_id:'office-task:abc',title:'Prepare dossier',status:'TODO',priority:'HIGH',
   assignee_ref:'role:operator',due_at:'2026-10-10T17:00:00+00:00',dependency_ids:[],tags:[],
   created_at:'2026-10-07T12:02:00+00:00',updated_at:'2026-10-07T12:02:00+00:00',version:1
  })
  write(resolve(ops,'native_crm','record','id-case-storage','state.json'),{
   schema:'CRM_RECORD_NATIVE_V0',record_id:'office-case:abc',record_type:'CASE',display_label:'Dossier case',
   lifecycle_status:'OPEN',owner_ref:'role:operator',fields:{},tags:[],created_at:'2026-10-07T12:02:00+00:00',
   updated_at:'2026-10-07T12:02:00+00:00',version:1
  })
  write(resolve(ops,'native_crm','followup','id-followup-storage','state.json'),{
   schema:'CRM_FOLLOWUP_NATIVE_V0',followup_id:'office-followup:abc',record_id:'office-case:abc',task_ref:'task-1',
   due_at:'2026-10-10T17:00:00+00:00',status:'OPEN',created_at:'2026-10-07T12:02:00+00:00',
   updated_at:'2026-10-07T12:02:00+00:00',version:1
  })
  write(resolve(ops,'native_tasks','task','id-task-storage','receipts','00000001-native-r1.json'),{
   schema:'NATIVE_MUTATION_RECEIPT_V0',receipt_id:'native-r1',receipt_hash:'h'.repeat(64),domain_id:'native_tasks',
   entity_kind:'task',entity_id:'office-task:abc',operation:'CREATE_TASK',mutation_id:'m-1',mutation_hash:'u'.repeat(64),
   world_action_request_hash:'w'.repeat(64),kx108_decision_record_id:'kxworld-1',kx108_decision_record_hash:'k'.repeat(64),
   before_state_hash:'b'.repeat(64),after_state_hash:'a'.repeat(64),created_at:'2026-10-07T12:02:00+00:00',
   version:1,decision_authority:'KX108_ONLY'
  })

  const evidence=readNativeOperationalEvidence(source,ops)
  assert.equal(evidence.readonly,true)
  assert.equal(evidence.sources.length,1)
  assert.equal(evidence.observations.length,1)
  assert.equal(evidence.packets.length,1)
  assert.equal(evidence.entities.length,3)
  assert.equal(evidence.receipts.length,1)
  assert.equal(evidence.sources[0].external_mutation_allowed,false)
  assert.ok(!JSON.stringify(evidence).includes('raw body'))

  const state=buildObsidiaState({
   available:true,repository:'fixture',sha:'abc',branch:'test',observedAt:evidence.observedAt,
   sigmaDomains:[],runtimeEvidence:{decisions:[{
    decision_record_id:'kxworld-1',decision_record_hash:'k'.repeat(64),domain:'native_tasks',x108_gate:'ALLOW',
    reason_code:'ALLOW',severity:'LOW',decision_authority:'KX108_ONLY',decision_phase:'WORLD_ACTION_PRE_EXECUTION',
    observedAt:'2026-10-07T12:02:00+00:00'
   }],receipts:[],rollbacks:[]},proposals:[],agentFamilies:[],nativeOperationalEvidence:evidence
  },{sessions:[],nativeServices:[],jarjar:null,observedAt:evidence.observedAt})

  for(const id of ['native_source:source:mail','source_observation:obs-1','source_packet:packet-1','task:office-task:abc','crm_record:office-case:abc','followup:office-followup:abc','native_receipt:native-r1']){
   assert.ok(state.entities.some(e=>e.id===id),id)
   assert.ok(state.views.world.entityRefs.includes(id),id+' world')
   assert.ok(state.views.workspace.entityRefs.includes(id),id+' workspace')
  }
  assert.ok(state.relations.some(r=>r.from==='crm_record:office-case:abc'&&r.type==='HAS_FOLLOWUP'&&r.to==='followup:office-followup:abc'))
  assert.ok(state.relations.some(r=>r.from==='followup:office-followup:abc'&&r.type==='LINKS_TASK'&&r.to==='task:office-task:abc'))
  assert.ok(state.relations.some(r=>r.from==='decision_record:kxworld-1'&&r.type==='AUTHORIZES_NATIVE_RECEIPT'&&r.to==='native_receipt:native-r1'))
  assert.equal(state.readonly,true)
  assert.equal(state.canonicalTruth,false)
  assert.equal(state.projectionContract.allowedToDecide,false)
  assert.equal(state.projectionContract.allowedToAct,false)
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('absent native runtime produces no fake operational entities',()=>{
 const root=mkdtempSync(resolve(tmpdir(),'obsidia-native-empty-'))
 try{
  const evidence=readNativeOperationalEvidence(resolve(root,'missing-source'),resolve(root,'missing-ops'))
  assert.equal(evidence.sources.length,0)
  assert.equal(evidence.entities.length,0)
  const state=buildObsidiaState({
   available:true,repository:'fixture',sha:'abc',branch:'test',observedAt:evidence.observedAt,
   sigmaDomains:[],runtimeEvidence:{decisions:[],receipts:[],rollbacks:[]},proposals:[],agentFamilies:[],nativeOperationalEvidence:evidence
  },{sessions:[],nativeServices:[],jarjar:null,observedAt:evidence.observedAt})
  assert.equal(state.entities.filter(e=>['native_source','source_observation','source_packet','crm_record','task','followup','native_receipt'].includes(e.kind)).length,0)
 }finally{rmSync(root,{recursive:true,force:true})}
})
