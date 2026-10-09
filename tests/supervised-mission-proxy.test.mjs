import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'

const fixture={
 schema_version:'OBSIDURE_SUPERVISED_MISSION_READONLY_API_V1',
 status:'R12_F4_A_TRANSITIVE_HOLD_PROJECTED',
 mission_id:'mission-f6b2',
 original_goal:'Render a governed supervised mission.',
 mandate:{human_mandate_reference:'mandate-f6b2',status:'ACTIVE',revoked:false},
 project:{repository_identity:'repo://obsidia/f6b2',worktree:'C:/secret/worktree',branch:'main',base_sha:'a'.repeat(40),local_root_visible:true,api_key:'hidden'},
 ticket_dag:[{ticket_id:'a',dependency_ids:[]},{ticket_id:'b',dependency_ids:['a']}],
 tickets:[
  {ticket_id:'a',objective:'Prepare',dependency_ids:[],status:'HELD',phase:'PREPARED',hold_reason:'PREPARED_AWAITING_APPROVAL',verification_level:'UNKNOWN',pending_approval:true,evidence_refs:['ev-a']},
  {ticket_id:'b',objective:'Wait',dependency_ids:['a'],status:'PENDING',phase:'HOLD',hold_reason:'BLOCKED_BY_HOLD(a)',verification_level:'UNKNOWN'}
 ],
 unique_next_ticket_id:null,
 hold:{reason:'UNRESOLVED_HOLD_OR_BLOCK',root_causes:[{ticket_id:'a',reason:'BLOCKED_BY_HOLD(a)'}],transitive_blocks:[{ticket_id:'b',reason:'BLOCKED_BY_HOLD(a)'}]},
 budget:{remaining_actions:2,consumed_actions:0},
 timebox:{expired:false},
 pending_approvals:[{ticket_id:'a',evidence_refs:['ev-a']}],
 evidence:{evidence_refs:['ev-a'],action_evidence_refs:['aev-a'],receipt_refs:['receipt-a']},
 verification:{ticket_levels:{a:'UNKNOWN'},mission_completion_proof_ref:null},
 binder_replay:{independent_replay_available:false,limitations:['BINDER_INDEPENDENT_REPLAY_NOT_PROVEN']},
 checkpoint:{checkpoint_id:'smc-f6b2',integrity_digest:'digest',resume_status:'CHECKPOINT_VERIFIED_READONLY'},
 status_distinctions:{prepared_is_authorized:false,executed_observed_is_verified:false,verified_is_closed:false,closed_is_mission_done_verified:false},
 readonly:true,authority:'NONE',decision_authority:'KX108_ONLY',executor_invoked:false,approval_created:false,memory_write:false
}

const prepareFixture={
 schema_version:'OBSIDURE_SUPERVISED_MISSION_PREPARE_INGRESS_API_V1',
 status:'R12_F6_C1_PREPARE_ONLY_ACCEPTED',
 state:'PREPARED_AWAITING_APPROVAL',
 reason:null,
 mission_id:'mission-f6c2',
 checkpoint_id:'smc-f6c2',
 checkpoint_projection_available:true,
 hold_reasons:[],
 provider_provenance:{provider:'QWEN_LOCAL',model:'qwen2.5-3b-instruct-q4_k_m',model_call_used:true,api_key:'hidden'},
 evidence_references:['ev-f6c2'],
 authority:'NONE',
 decision_authority:'KX108_ONLY',
 executor_invoked:false,
 approval_created:false,
 memory_write:false,
 local_root:'C:/secret/root',
 token:'hidden',
}

const authorizationFixture={
 schema_version:'OBSIDURE_SUPERVISED_MISSION_AUTHORIZATION_HANDOFF_API_V1',
 status:'R12_F6_D1_EXECUTION_OUTCOME_ACCEPTED',
 state:'EXECUTED_OBSERVED',
 reason:null,
 mission_id:'mission-f6d1',
 ticket_id:'ticket-a',
 checkpoint_id:'smc-f6d1-post',
 input_checkpoint_id:'smc-f6d1-pre',
 checkpoint_projection_available:true,
 execution_phase:'EXECUTED_OBSERVED',
 action_evidence_id:'aev-f6d1',
 r8_receipt:'receipt-f6d1',
 execution_authority_hash:'e'.repeat(64),
 human_authorization_reference_hash:'h'.repeat(64),
 authority:'NONE',
 decision_authority:'KX108_ONLY',
 supervisor_approval_created:false,
 approval_created:false,
 executor_invoked:true,
 memory_write:false,
 token:'hidden',
 local_root:'C:/secret/root',
 checkpoint_projection:{...fixture,mission_id:'mission-f6d1',checkpoint:{checkpoint_id:'smc-f6d1-post'}},
}

const verificationFixture={
 schema_version:'OBSIDURE_SUPERVISED_MISSION_VERIFICATION_OPERATOR_API_V1',
 status:'R12_F6_D2_VERIFICATION_ASSESSED',
 state:'CLOSURE_BLOCKED',
 reason:'BINDER_DECISION_RECONSTRUCTION_REQUIRED',
 mission_id:'mission-f6d2',
 ticket_id:'ticket-a',
 checkpoint_id:'smc-f6d2',
 closure_eligibility:'CLOSURE_BLOCKED',
 receipt_integrity:{r8_replay_verdict:'VERIFIED_WITH_LIMITS'},
 r8_replay:{binder_replay_status:'INLINE_STATUS_ONLY',verified_with_limits:true},
 binder_independence:{fully_independent:false,limitation:'BINDER_DECISION_RECONSTRUCTION_REQUIRED'},
 verification_assessment:{status:'R12_F5_C2_INDEPENDENT_VERIFICATION_HELD',reason:'BINDER_DECISION_RECONSTRUCTION_REQUIRED'},
 authority:'NONE',
 decision_authority:'KX108_ONLY',
 executor_invoked:false,
 approval_created:false,
 memory_write:false,
 token:'hidden',
 local_root:'C:/secret/root',
}

async function withServers(handler){
 const api=createServer(handler)
 await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve))
 process.env.OBSIDIA_API_BASE='http://127.0.0.1:'+api.address().port
 process.env.OBSIDIA_API_KEY='secret'
 const {localBridge}=await import('../server/local-bridge.mjs?case='+Math.random())
 let middleware
 const monde=createServer((req,res)=>{req.url=req.url?.replace('/obsidia-local','')||'/';void middleware(req,res)})
 localBridge().configureServer({httpServer:monde,middlewares:{use:(_path,fn)=>{middleware=fn}}})
 await new Promise(resolve=>monde.listen(0,'127.0.0.1',resolve))
 const base='http://127.0.0.1:'+monde.address().port
 return {api,monde,base}
}

test('supervised mission proxy forwards opaque ids with server-side API key and strips sensitive fields',async()=>{
 let auth=''
 const servers=await withServers((req,res)=>{
  auth=req.headers['x-api-key']||''
  assert.equal(req.url,'/api/supervised-missions/mission-f6b2/projection?checkpoint_id=smc-f6b2')
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(fixture))
 })
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/projection?mission_id=mission-f6b2&checkpoint_id=smc-f6b2')
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(auth,'secret')
  assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PROXY_V1')
  assert.equal(data.authority,'NONE')
  assert.equal(data.executor_invoked,false)
  assert.equal(data.project.worktree,undefined)
  assert.equal(data.project.worktree_visible,true)
  assert.equal(data.project.api_key,undefined)
 }finally{servers.api.close();servers.monde.close()}
})

test('supervised mission proxy reports upstream auth and offline states as unavailable',async()=>{
 const authDenied=await withServers((_req,res)=>{res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'unauthorized'}))})
 try{
  const response=await fetch(authDenied.base+'/obsidia-local/supervised-mission/projection?mission_id=mission-f6b2&checkpoint_id=smc-f6b2')
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(data.status,'UNAVAILABLE')
  assert.equal(data.reason,'UPSTREAM_AUTH_DENIED')
  assert.equal(data.executor_invoked,false)
 }finally{authDenied.api.close();authDenied.monde.close()}
 const offline=await withServers((_req,res)=>{res.destroy()})
 offline.api.close()
 try{
  const response=await fetch(offline.base+'/obsidia-local/supervised-mission/projection?mission_id=mission-f6b2&checkpoint_id=smc-f6b2')
  const data=await response.json()
  assert.equal(data.status,'UNAVAILABLE')
  assert.equal(data.reason,'UPSTREAM_API_UNAVAILABLE')
 }finally{offline.monde.close()}
})

test('supervised mission proxy rejects path-like selectors before upstream access',async()=>{
 let called=false
 const servers=await withServers((_req,res)=>{called=true;res.writeHead(500).end()})
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/projection?mission_id=mission-f6b2&checkpoint_id=../secret')
  const data=await response.json()
  assert.equal(response.status,400)
  assert.equal(data.error,'Checkpoint invalide')
  assert.equal(called,false)
 }finally{servers.api.close();servers.monde.close()}
})

test('prepare-only proxy posts mandate contract with server-side API key and reloads checkpoint projection',async()=>{
 let auth='',posted=null
 const servers=await withServers((req,res)=>{
  auth=req.headers['x-api-key']||''
  if(req.method==='POST'){
   assert.equal(req.url,'/api/supervised-missions/prepare-only')
   let body=''
   req.on('data',chunk=>{body+=chunk})
   req.on('end',()=>{
    posted=JSON.parse(body)
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(prepareFixture))
   })
   return
  }
  assert.equal(req.url,'/api/supervised-missions/mission-f6c2/projection?checkpoint_id=smc-f6c2')
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({...fixture,mission_id:'mission-f6c2',checkpoint:{checkpoint_id:'smc-f6c2'}}))
 })
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/prepare-only',{
   method:'POST',
   headers:{Origin:servers.base,'Content-Type':'application/json'},
   body:JSON.stringify({
    human_request:'Prepare a supervised mission',
    repository_context:{repository_identity:'repo://f6c2',worktree:'C:/worktree',branch:'main',base_sha:'a'.repeat(40)},
    proposed_scope:{target_paths:['src/a.ts'],operations:['MODIFY']},
    human_mandate:{human_mandate_reference:'mandate-f6c2',status:'ACTIVE',mission_authority:'KX108_ONLY',authorized_target_paths:['src/a.ts'],authorized_operations:['MODIFY'],permitted_tools:['npm test'],test_requirements:['npm test'],budgets:{max_actions:1}},
    provider_config:{status:'VERIFIED',provider:'QWEN_LOCAL',model:'qwen2.5-3b-instruct-q4_k_m'},
    phase1_candidate:{},inventory_snapshot:{},deficiency_evidence:{},validation_evidence:{},
   })
  })
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(auth,'secret')
  assert.equal(posted.human_mandate.mission_authority,'KX108_ONLY')
  assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PREPARE_PROXY_V1')
  assert.equal(data.state,'PREPARED_AWAITING_APPROVAL')
  assert.equal(data.checkpoint_projection.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PROXY_V1')
  assert.equal(data.provider_provenance.api_key,undefined)
  assert.equal(data.local_root,undefined)
  assert.equal(data.token,undefined)
  assert.equal(data.executor_invoked,false)
  assert.equal(data.approval_created,false)
  assert.equal(data.memory_write,false)
 }finally{servers.api.close();servers.monde.close()}
})

test('prepare-only proxy preserves HOLD and upstream failures without green success',async()=>{
 const hold=await withServers((_req,res)=>{
  res.writeHead(200,{'Content-Type':'application/json'})
  res.end(JSON.stringify({schema_version:'OBSIDURE_SUPERVISED_MISSION_PREPARE_INGRESS_API_V1',status:'R12_F6_C1_PREPARE_ONLY_HELD',state:'HOLD',reason:'PROVIDER_UNAVAILABLE',hold_reasons:['PROVIDER_UNAVAILABLE'],executor_invoked:false,approval_created:false,memory_write:false}))
 })
 try{
  const response=await fetch(hold.base+'/obsidia-local/supervised-mission/prepare-only',{method:'POST',headers:{Origin:hold.base,'Content-Type':'application/json'},body:JSON.stringify({human_request:'x'})})
  const data=await response.json()
  assert.equal(data.state,'HOLD')
  assert.equal(data.reason,'PROVIDER_UNAVAILABLE')
  assert.equal(data.executor_invoked,false)
 }finally{hold.api.close();hold.monde.close()}
 const denied=await withServers((_req,res)=>{res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'unauthorized'}))})
 try{
  const response=await fetch(denied.base+'/obsidia-local/supervised-mission/prepare-only',{method:'POST',headers:{Origin:denied.base,'Content-Type':'application/json'},body:JSON.stringify({human_request:'x'})})
  const data=await response.json()
  assert.equal(data.status,'UNAVAILABLE')
  assert.equal(data.reason,'UPSTREAM_AUTH_DENIED')
  assert.equal(data.executor_invoked,false)
 }finally{denied.api.close();denied.monde.close()}
})

test('authorization handoff proxy submits existing reference and reloads canonical projection',async()=>{
 let auth='',posted=null
 const servers=await withServers((req,res)=>{
  auth=req.headers['x-api-key']||''
  if(req.method==='POST'){
   assert.equal(req.url,'/api/supervised-missions/mission-f6d1/authorize-execution')
   let body=''
   req.on('data',chunk=>{body+=chunk})
   req.on('end',()=>{
    posted=JSON.parse(body)
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(authorizationFixture))
   })
   return
  }
  assert.equal(req.url,'/api/supervised-missions/mission-f6d1/projection?checkpoint_id=smc-f6d1-post')
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({...fixture,mission_id:'mission-f6d1',checkpoint:{checkpoint_id:'smc-f6d1-post'}}))
 })
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/authorize-execution',{
   method:'POST',
   headers:{Origin:servers.base,'Content-Type':'application/json'},
   body:JSON.stringify({mission_id:'mission-f6d1',checkpoint_id:'smc-f6d1-pre',ticket_id:'ticket-a',execution_authority_hash:'e'.repeat(64),human_authorization_reference:'human-auth-f6d1',session_id:'test'}),
  })
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(auth,'secret')
  assert.equal(posted.human_authorization_reference,'human-auth-f6d1')
  assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_AUTHORIZATION_PROXY_V1')
  assert.equal(data.state,'EXECUTED_OBSERVED')
  assert.equal(data.executor_invoked,true)
  assert.equal(data.approval_created,false)
  assert.equal(data.supervisor_approval_created,false)
  assert.equal(data.memory_write,false)
  assert.equal(data.local_root,undefined)
  assert.equal(data.token,undefined)
  assert.equal(data.checkpoint_projection.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PROXY_V1')
 }finally{servers.api.close();servers.monde.close()}
})

test('authorization handoff proxy preserves HOLD and upstream auth failures',async()=>{
 const hold=await withServers((_req,res)=>{
  res.writeHead(200,{'Content-Type':'application/json'})
  res.end(JSON.stringify({schema_version:'OBSIDURE_SUPERVISED_MISSION_AUTHORIZATION_HANDOFF_API_V1',status:'R12_F6_D1_EXECUTION_HELD',state:'HOLD',reason:'HOLD_AWAITING_VALID_AUTHORIZATION',executor_invoked:false,approval_created:false,memory_write:false}))
 })
 try{
  const response=await fetch(hold.base+'/obsidia-local/supervised-mission/authorize-execution',{method:'POST',headers:{Origin:hold.base,'Content-Type':'application/json'},body:JSON.stringify({mission_id:'mission-f6d1',checkpoint_id:'smc-f6d1-pre',ticket_id:'ticket-a',execution_authority_hash:'e'.repeat(64),human_authorization_reference:'human-auth-f6d1'})})
  const data=await response.json()
  assert.equal(data.state,'HOLD')
  assert.equal(data.reason,'HOLD_AWAITING_VALID_AUTHORIZATION')
  assert.equal(data.executor_invoked,false)
 }finally{hold.api.close();hold.monde.close()}
 const denied=await withServers((_req,res)=>{res.writeHead(401,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'unauthorized'}))})
 try{
  const response=await fetch(denied.base+'/obsidia-local/supervised-mission/authorize-execution',{method:'POST',headers:{Origin:denied.base,'Content-Type':'application/json'},body:JSON.stringify({mission_id:'mission-f6d1',checkpoint_id:'smc-f6d1-pre',ticket_id:'ticket-a',execution_authority_hash:'e'.repeat(64),human_authorization_reference:'human-auth-f6d1'})})
  const data=await response.json()
  assert.equal(data.status,'UNAVAILABLE')
  assert.equal(data.reason,'UPSTREAM_AUTH_DENIED')
  assert.equal(data.executor_invoked,false)
 }finally{denied.api.close();denied.monde.close()}
})

test('verification projection proxy exposes closure limits without authority',async()=>{
 let auth=''
 const servers=await withServers((req,res)=>{
  auth=req.headers['x-api-key']||''
  assert.equal(req.url,'/api/supervised-missions/mission-f6d2/verification-projection?checkpoint_id=smc-f6d2&ticket_id=ticket-a')
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(verificationFixture))
 })
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/verification-projection?mission_id=mission-f6d2&checkpoint_id=smc-f6d2&ticket_id=ticket-a')
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(auth,'secret')
  assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_VERIFICATION_PROXY_V1')
  assert.equal(data.closure_eligibility,'CLOSURE_BLOCKED')
  assert.equal(data.binder_independence.limitation,'BINDER_DECISION_RECONSTRUCTION_REQUIRED')
  assert.equal(data.executor_invoked,false)
  assert.equal(data.approval_created,false)
  assert.equal(data.local_root,undefined)
  assert.equal(data.token,undefined)
 }finally{servers.api.close();servers.monde.close()}
})

test('verification assessment proxy posts explicit evidence and preserves HOLD',async()=>{
 let posted=null
 const servers=await withServers((req,res)=>{
  assert.equal(req.url,'/api/supervised-missions/mission-f6d2/verify-ticket')
  let body=''
  req.on('data',chunk=>{body+=chunk})
  req.on('end',()=>{
   posted=JSON.parse(body)
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(verificationFixture))
  })
 })
 try{
  const response=await fetch(servers.base+'/obsidia-local/supervised-mission/verify-ticket',{
   method:'POST',
   headers:{Origin:servers.base,'Content-Type':'application/json'},
   body:JSON.stringify({mission_id:'mission-f6d2',checkpoint_id:'smc-f6d2',ticket_id:'ticket-a',verification_evidence:{verification_id:'ver-f6d2',api_key:'hidden'}}),
  })
  const data=await response.json()
  assert.equal(response.status,200)
  assert.equal(posted.verification_evidence.verification_id,'ver-f6d2')
  assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_VERIFICATION_ASSESSMENT_PROXY_V1')
  assert.equal(data.closure_eligibility,'CLOSURE_BLOCKED')
  assert.equal(data.reason,'BINDER_DECISION_RECONSTRUCTION_REQUIRED')
  assert.equal(data.executor_invoked,false)
  assert.equal(data.approval_created,false)
  assert.equal(data.memory_write,false)
  assert.equal(data.local_root,undefined)
  assert.equal(data.token,undefined)
 }finally{servers.api.close();servers.monde.close()}
})
