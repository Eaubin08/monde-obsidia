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
