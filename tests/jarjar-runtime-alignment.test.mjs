import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {spawn} from 'node:child_process'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {readFileSync} from 'node:fs'

const projectRoot=process.cwd()
const bridgeSource=readFileSync(resolve(projectRoot,'server/local-bridge.mjs'),'utf8')
const launcherSource=readFileSync(resolve(projectRoot,'scripts/start-jarjar-full.ps1'),'utf8')

function jsonServer(kind){
 const code=`
  const {createServer}=require('node:http');
  const kind=process.env.J1_KIND;
  const server=createServer((req,res)=>{
   let result={};
   if(kind==='foreign')result={service:'foreign-api',decision_authority:'NONE'};
   else if(kind==='obsidia')result={service:'obsidia-api',version:'V5B',mode:'readonly_dryrun',decision_authority:'KX108_ONLY'};
   else if(kind==='qwen')result=(req.url||'').endsWith('/models')?{data:[{id:'C:/Models/qwen2.5-3b-instruct-q4_k_m.gguf',owned_by:'llamacpp'}]}:{};
   res.setHeader('Content-Type','application/json');res.end(JSON.stringify(result));
  });
  server.listen(0,'127.0.0.1',()=>console.log(server.address().port));
 `
 const child=spawn(process.execPath,['-e',code],{env:{...process.env,J1_KIND:kind},stdio:['ignore','pipe','pipe']})
 return new Promise((resolveServer,reject)=>{
  const timer=setTimeout(()=>reject(Error('fixture server timeout')),5000)
  child.once('error',reject)
  child.stdout.once('data',chunk=>{clearTimeout(timer);resolveServer({server:{close:()=>child.kill()},base:'http://127.0.0.1:'+String(chunk).trim()})})
 })
}

async function withBridge(env,fn){
 const previous={...process.env}
 Object.assign(process.env,env)
 const {localBridge}=await import('../server/local-bridge.mjs?j1='+Math.random())
 let middleware
 const server=createServer((req,res)=>{req.url=req.url?.replace('/obsidia-local','')||'/';void middleware(req,res)})
 localBridge().configureServer({httpServer:server,middlewares:{use:(_path,handler)=>{middleware=handler}}})
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
 const base='http://127.0.0.1:'+server.address().port
 try{return await fn(base)}finally{await new Promise(resolve=>server.close(resolve));process.env={...previous}}
}

test('J1 launcher documents bounded runtime identity and optional dependencies',()=>{
 for(const invariant of [
  'Assert-ObsidiaApiIdentity',
  'Assert-QwenTextIdentity',
  'OBSIDIA_JARJAR_REQUIRE_KERNEL',
  'OPTIONAL_NOT_REQUIRED_FOR_R12_PREPARE',
  'BLOCKED_WRONG_SERVICE_IDENTITY',
  'RUN_JARJAR_LIVE_MISSING',
  'JARJAR_RUNTIME_BLOCKED',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8080/v1',
 ]) assert.ok(launcherSource.includes(invariant),invariant)
 assert.equal(launcherSource.includes('8001'),false)
 assert.equal(launcherSource.includes('7880'),false)
})

test('J1 Monde bridge reports wrong Obsidia identity as BLOCKED, not READY by port',async()=>{
 const api=await jsonServer('foreign')
 const qwen=await jsonServer('qwen')
 const jarjar=mkdtempSync(resolve(tmpdir(),'jarjar-j1-missing-'))
 try{
  await withBridge({OBSIDIA_API_BASE:api.base,JARJAR_QWEN_BASE:qwen.base,OBSIDIA_JARJAR_ROOT:jarjar},async base=>{
   const response=await fetch(base+'/obsidia-local/jarjar/status')
   const status=await response.json()
   assert.equal(status.state,'BLOCKED')
   assert.equal(status.components.brodyApi.state,'BLOCKED')
   assert.equal(status.components.brodyApi.evidence,'BLOCKED_WRONG_SERVICE_IDENTITY')
   assert.equal(status.components.qwenText.state,'READY')
  })
 }finally{api.server.close();qwen.server.close();rmSync(jarjar,{recursive:true,force:true})}
})

test('J1 Monde bridge accepts real-shaped Obsidia and Qwen identity but blocks missing Jarjar entrypoint',async()=>{
 const api=await jsonServer('obsidia')
 const qwen=await jsonServer('qwen')
 const jarjar=mkdtempSync(resolve(tmpdir(),'jarjar-j1-missing-'))
 try{
  await withBridge({OBSIDIA_API_BASE:api.base,JARJAR_QWEN_BASE:qwen.base,OBSIDIA_JARJAR_ROOT:jarjar},async base=>{
   const response=await fetch(base+'/obsidia-local/jarjar/status')
   const status=await response.json()
   assert.equal(status.components.brodyApi.state,'READY')
   assert.equal(status.components.qwenText.state,'READY')
   assert.equal(status.components.qwenVL.state,'OPTIONAL_OFFLINE')
   assert.equal(status.components.kernel.required,false)
   assert.equal(status.components.jarjarEntrypoint.state,'BLOCKED')
   assert.equal(status.state,'BLOCKED')
   assert.equal(status.decisionAuthority,'KX108_ONLY')
  })
 }finally{api.server.close();qwen.server.close();rmSync(jarjar,{recursive:true,force:true})}
})

test('J1 Monde bridge reaches PARTIAL when required identity is present and Jarjar is not running',async()=>{
 const api=await jsonServer('obsidia')
 const qwen=await jsonServer('qwen')
 const jarjar=mkdtempSync(resolve(tmpdir(),'jarjar-j1-ready-'))
 mkdirSync(resolve(jarjar,'scripts'),{recursive:true})
 writeFileSync(resolve(jarjar,'scripts','run_jarjar_live.py'),'# fixture entrypoint only\n')
 try{
  await withBridge({OBSIDIA_API_BASE:api.base,JARJAR_QWEN_BASE:qwen.base,OBSIDIA_JARJAR_ROOT:jarjar},async base=>{
   const response=await fetch(base+'/obsidia-local/jarjar/status')
   const status=await response.json()
   assert.equal(status.components.jarjarEntrypoint.state,'READY')
   assert.equal(status.components.brodyApi.state,'READY')
   assert.equal(status.components.qwenText.state,'READY')
   assert.equal(status.state,'PARTIAL')
  })
 }finally{api.server.close();qwen.server.close();rmSync(jarjar,{recursive:true,force:true})}
})

