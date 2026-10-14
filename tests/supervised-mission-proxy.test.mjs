import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {after} from 'node:test'

let upstreamHandler=(req,res)=>{res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'not configured'}))}
const upstream=createServer((req,res)=>upstreamHandler(req,res))
await new Promise(resolve=>upstream.listen(0,'127.0.0.1',resolve))
const upstreamBase='http://127.0.0.1:'+upstream.address().port
process.env.OBSIDIA_API_BASE=upstreamBase
process.env.OBSIDIA_API_KEY='server-secret-key'

const {localBridge}=await import('../server/local-bridge.mjs')
let middleware
const bridge=createServer((req,res)=>{
 if(!req.url.startsWith('/obsidia-local/')){res.writeHead(404).end();return}
 req.url=req.url.slice('/obsidia-local'.length)
 void middleware(req,res)
})
localBridge().configureServer({httpServer:bridge,middlewares:{use:(_path,handler)=>{middleware=handler}}})
await new Promise(resolve=>bridge.listen(0,'127.0.0.1',resolve))
const base='http://127.0.0.1:'+bridge.address().port
after(async()=>{await Promise.all([new Promise(resolve=>bridge.close(resolve)),new Promise(resolve=>upstream.close(resolve))])})

function json(res){return res.text().then(text=>text?JSON.parse(text):{})}

test('supervised mission readonly projection strips secrets and preserves Binder limits',async()=>{
 upstreamHandler=(req,res)=>{
  assert.equal(req.url,'/api/supervised-missions/mission-c3r/projection?checkpoint_id=smc-c3r')
  assert.equal(req.headers['x-api-key'],'server-secret-key')
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({
   status:'PREPARED_AWAITING_APPROVAL',mission_id:'mission-c3r',local_root:'C:/secret',api_key:'hidden',
   project:{worktree:'C:/private',branch:'main',base_sha:'abc'},
   binder_replay:{independent_replay_available:false,limitations:['INLINE_STATUS_ONLY','BINDER_DECISION_RECONSTRUCTION_REQUIRED']},
   checkpoint:{checkpoint_id:'smc-c3r'},executor_invoked:false,approval_created:false,memory_write:false,
  }))
 }
 const response=await fetch(base+'/obsidia-local/supervised-mission/projection?mission_id=mission-c3r&checkpoint_id=smc-c3r')
 const data=await json(response)
 assert.equal(response.status,200)
 assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PROXY_V1')
 assert.equal(data.decision_authority,'KX108_ONLY')
 assert.equal(data.emits_act,false)
 assert.equal(data.executor_invoked,false)
 assert.equal(data.approval_created,false)
 assert.equal(data.memory_write,false)
 assert.equal(data.api_key,undefined)
 assert.equal(data.local_root,undefined)
 assert.equal(data.project.worktree,undefined)
 assert.equal(data.project.worktree_visible,true)
 assert.deepEqual(data.binder_replay.limitations,['INLINE_STATUS_ONLY','BINDER_DECISION_RECONSTRUCTION_REQUIRED'])
})

test('prepare-only proxy posts mandate contract and reloads opaque checkpoint projection',async()=>{
 const calls=[]
 upstreamHandler=(req,res)=>{
  calls.push(req.url)
  if(req.url==='/api/supervised-missions/prepare-only'){
   assert.equal(req.method,'POST')
   assert.equal(req.headers['x-api-key'],'server-secret-key')
   let body='';req.on('data',chunk=>body+=chunk);req.on('end',()=>{
    const payload=JSON.parse(body)
    assert.equal(payload.human_mandate.mission_authority,'KX108_ONLY')
    res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'PREPARED_AWAITING_APPROVAL',mission_id:'mission-c3r2',checkpoint_id:'smc-c3r2',checkpoint_projection_available:true,api_key:'hidden'}))
   })
   return
  }
  if(req.url==='/api/supervised-missions/mission-c3r2/projection?checkpoint_id=smc-c3r2'){
   res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify({status:'PREPARED_AWAITING_APPROVAL',mission_id:'mission-c3r2',checkpoint:{checkpoint_id:'smc-c3r2'},binder_replay:{limitations:['INLINE_STATUS_ONLY']}}))
   return
  }
  res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'unexpected'}))
 }
 const response=await fetch(base+'/obsidia-local/supervised-mission/prepare-only',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({human_mandate:{mission_authority:'KX108_ONLY'}})})
 const data=await json(response)
 assert.equal(response.status,200)
 assert.equal(data.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PREPARE_PROXY_V1')
 assert.equal(data.api_key,undefined)
 assert.equal(data.executor_invoked,false)
 assert.equal(data.approval_created,false)
 assert.equal(data.checkpoint_projection.monde_proxy_schema,'OBSIDIA_MONDE_SUPERVISED_MISSION_PROXY_V1')
 assert.deepEqual(calls,['/api/supervised-missions/prepare-only','/api/supervised-missions/mission-c3r2/projection?checkpoint_id=smc-c3r2'])
})

test('supervised proxy fails closed for invalid checkpoint, unavailable backend and hidden authority routes',async()=>{
 let response=await fetch(base+'/obsidia-local/supervised-mission/projection?mission_id=mission-c3r&checkpoint_id=../secret')
 let data=await json(response)
 assert.equal(response.status,400);assert.match(data.error,/Checkpoint invalide/)
 upstreamHandler=(req)=>{req.socket.destroy()}
 response=await fetch(base+'/obsidia-local/supervised-mission/projection?mission_id=mission-c3r&checkpoint_id=smc-c3r')
 data=await json(response)
 assert.equal(response.status,200)
 assert.equal(data.status,'UNAVAILABLE')
 assert.equal(data.reason,'UPSTREAM_API_UNAVAILABLE')
 response=await fetch(base+'/obsidia-local/supervised-mission/authorize-execution',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({})})
 data=await json(response)
 assert.equal(response.status,404)
 assert.equal(data.error,'Route inconnue')
 response=await fetch(base+'/obsidia-local/supervised-mission/verify-ticket',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({})})
 data=await json(response)
 assert.equal(response.status,404)
 assert.equal(data.error,'Route inconnue')
})
