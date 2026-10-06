import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs'
import {resolve} from 'node:path'
import {tmpdir} from 'node:os'
import {execFileSync} from 'node:child_process'
import {createServer} from 'node:http'

// Explicit fixtures verify launch/IO/telemetry, not the reasoning of Obsidia.
const scratch=mkdtempSync(resolve(tmpdir(),'obsidia-launch-'))
const repo=resolve(scratch,"équipe l'agent"),output=resolve(scratch,'events')
mkdirSync(resolve(repo,'scripts'),{recursive:true})
mkdirSync(resolve(repo,'periphery/agents'),{recursive:true})
writeFileSync(resolve(repo,'periphery/agents/agent_obsidure.py'),`from types import SimpleNamespace
import time
def phase_a_audit(objective):
 time.sleep(.1)
 return SimpleNamespace(intent='AUDIT_ONLY',source='TEST_FIXTURE_ONLY',risk_flags=[])
`)
const interactive=`import sys
from periphery.agents.agent_obsidure import phase_a_audit
if '--dry-run' in sys.argv:
 phase_a_audit('fixture')
 print('AUDIT_FIXTURE_ONLY',flush=True)
else:
 while True:
  value=input('DEMANDE > ')
  if value in ('exit','quit','/exit'):break
  print('RESULT '+value,flush=True)
`
for(const name of ['obsidure_cli','obsidia_cli'])writeFileSync(resolve(repo,'scripts',name+'.py'),interactive)
writeFileSync(resolve(repo,'scripts/brody_terminal_chat.py'),`import json,urllib.request
def call_brody_api(endpoint,payload):
 request=urllib.request.Request(endpoint+'/api/brody/chat',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json'})
 with urllib.request.urlopen(request) as r:return json.load(r)
compact=True
while True:
 value=input('You > ')
 if value=='/compact off':
  compact=False
  print('compact=OFF',flush=True)
  continue
 if value=='/exit':break
 result=call_brody_api('http://127.0.0.1:8000',{'message':value,'compact':compact})
 print(json.dumps(result),flush=True)
`)
mkdirSync(resolve(repo,'apps/obsidia_api'),{recursive:true})
writeFileSync(resolve(repo,'apps/obsidia_api/main.py'),'# API startup fixture only\n')
writeFileSync(resolve(repo,'uvicorn.py'),`from http.server import HTTPServer,BaseHTTPRequestHandler
import json
class Handler(BaseHTTPRequestHandler):
 def do_GET(self):
  self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers();self.wfile.write(b'{"service":"obsidia-api"}')
 def do_POST(self):
  d=json.loads(self.rfile.read(int(self.headers['Content-Length'])))
  self.send_response(200);self.send_header('Content-Type','application/json');self.end_headers()
  self.wfile.write(json.dumps({'final_answer':'TEST_FIXTURE_ONLY '+d['message'],'final_answer_source':'TEST_FIXTURE_ONLY','compact_received':d['compact']}).encode())
HTTPServer(('127.0.0.1',8000),Handler).serve_forever()
`)
execFileSync('git',['init','-q',repo])
execFileSync('git',['-C',repo,'add','.'])
execFileSync('git',['-C',repo,'-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','fixture'])
process.env.OBSIDIA_SOURCE_REPO=repo
process.env.OBSIDIA_LIVE_DIRECTORY=output
const python=process.env.OBSIDIA_PYTHON||(process.platform==='win32'?'python':'python3')
process.env.OBSIDIA_PYTHON=python
const {localBridge}=await import('../server/local-bridge.mjs')
const native=await import('../server/native-terminal.mjs')
let middleware
const server=createServer((req,res)=>{
 if(!req.url.startsWith('/obsidia-local/')){res.writeHead(404).end();return}
 req.url=req.url.slice('/obsidia-local'.length)
 void middleware(req,res)
})
localBridge().configureServer({httpServer:server,middlewares:{use:(_path,handler)=>{middleware=handler}}})
await new Promise(r=>server.listen(0,'127.0.0.1',r))
const base='http://127.0.0.1:'+server.address().port
async function get(path){const r=await fetch(base+'/obsidia-local/'+path);assert.equal(r.status,200);return r.json()}
async function post(path,data={}){const r=await fetch(base+'/obsidia-local/'+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify(data)});const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d}
async function until(read,predicate,timeout=8000){const end=Date.now()+timeout;while(Date.now()<end){const v=await read();if(predicate(v))return v;await new Promise(r=>setTimeout(r,100))}throw Error('Condition non atteinte')}
const session=id=>get('live').then(d=>d.sessions.find(s=>s.sessionId===id))

test('Launchers and live process contracts',async t=>{
 try{
  await t.test('Reject foreign origins before launching a process',async()=>{
   const r=await fetch(base+'/obsidia-local/run',{method:'POST',headers:{Origin:'https://example.invalid','Content-Type':'application/json'},body:JSON.stringify({mode:'audit'})})
   assert.equal(r.status,400);assert.equal((await get('processes')).processes.length,0)
  })
  await t.test('Integrated CLI: unicode input, live objective, graceful exit',async()=>{
   const {sessionId}=await post('run',{mode:'interactive',tool:'cli'})
   await until(()=>session(sessionId),s=>s?.phase==='WAITING_INPUT')
   await post('input/'+sessionId,{text:'demande épreuve'})
   await until(()=>get('processes'),d=>d.processes.some(p=>p.sessionId===sessionId&&p.output.includes('RESULT demande épreuve')))
   assert.equal((await session(sessionId)).objective,'demande épreuve')
   await post('input/'+sessionId,{text:'exit'})
   const s=await until(()=>session(sessionId),s=>s?.presence==='ended');assert.equal(s.exitCode,0)
  })
  await t.test('Audit returns phase A evidence and a report',async()=>{
   const {sessionId}=await post('run',{mode:'audit'})
   const s=await until(()=>session(sessionId),s=>s?.presence==='ended')
   assert.equal(s.exitCode,0);assert.ok(s.events.some(e=>e.kind==='audit_result'&&e.result.source==='TEST_FIXTURE_ONLY'))
   const report=JSON.parse(readFileSync(resolve(output,sessionId+'.report.json'),'utf8'))
   assert.equal(report.requestedCycles,1);assert.equal(report.entries[0].exists,true)
  })
  await t.test('Shared state projects one runtime fact across World, Workspace and Pokémon',async()=>{
   const {sessionId}=await post('run',{mode:'audit'})
   await until(()=>session(sessionId),s=>s?.presence==='ended')
   const state=await get('state')
   assert.equal(state.schema,'OBSIDIA_WORLD_PROJECTION_V0')
   assert.equal(state.readonly,true);assert.equal(state.canonicalTruth,false);assert.equal(state.decisionAuthority,'KX108_ONLY')
   const sid='session:'+sessionId
   const projected=state.entities.filter(e=>e.id===sid)
   assert.equal(projected.length,1)
   assert.ok(state.views.world.entityRefs.includes(sid))
   assert.ok(state.views.workspace.entityRefs.includes(sid))
   assert.ok(state.views.pokemon.entityRefs.includes(sid))
   assert.ok(state.relations.some(r=>r.from==='agent:obsidure'&&r.type==='RUNS'&&r.to===sid))
  })
  await t.test('Long audit really runs repeatedly and can be stopped during interval',async()=>{
   const {sessionId}=await post('run',{mode:'audit-long'})
   await until(()=>session(sessionId),s=>s?.phase==='AUDIT_INTERVAL')
   await post('stop/'+sessionId)
   const s=await until(()=>session(sessionId),s=>s?.presence==='ended')
   assert.equal(s.status,'error');assert.notEqual(s.exitCode,0)
   const events=readFileSync(resolve(output,sessionId+'.jsonl'),'utf8')
   assert.ok(events.includes('Audit réel 1/20'));assert.ok(!events.includes('Audit réel 20/20'))
  })
  await t.test('Brody API starts automatically, receives non-compact request and emits answer',async()=>{
   const {sessionId}=await post('run',{mode:'interactive',tool:'brody'})
   await until(()=>session(sessionId),s=>s?.phase==='WAITING_INPUT')
   await post('input/'+sessionId,{text:'demande Brody'})
   const s=await until(()=>session(sessionId),s=>s?.events.some(e=>e.kind==='response'))
   assert.ok(s.events.some(e=>e.phase==='BRODY_REQUEST'))
   assert.equal(s.events.find(e=>e.kind==='response').result.final_answer_source,'TEST_FIXTURE_ONLY')
   const p=(await get('processes')).processes.find(p=>p.sessionId===sessionId)
   assert.ok(p.output.includes('"compact_received": false'))
   assert.equal((await get('services')).brody.ready,true)
   await post('stop/'+sessionId)
   await until(()=>session(sessionId),s=>s?.presence==='ended')
  })
  await t.test('Windows: real PowerShell windows launch each tool and stop their process tree',{skip:process.platform!=='win32'},async()=>{
   for(const tool of ['cli','brody','obsidure']){
    const {sessionId,pid}=await post('open/'+tool)
    assert.ok(await native.terminalAlive(pid))
    await until(()=>session(sessionId),s=>s?.phase==='WAITING_INPUT',15000)
    const p=(await get('processes')).processes.find(p=>p.sessionId===sessionId)
    assert.equal(p.native,true);assert.equal(p.active,true)
    // CI has no interactive desktop; AppActivate itself is a local-PC check.
    await post('stop/'+sessionId)
    assert.equal(await native.terminalAlive(pid),false)
    assert.equal((await session(sessionId)).presence,'ended')
   }
  })
 }finally{
  for(const p of (await get('processes')).processes.filter(p=>p.active))await post('stop/'+p.sessionId)
  await new Promise(r=>server.close(r))
  await new Promise(r=>setTimeout(r,500))
  rmSync(scratch,{recursive:true,force:true,maxRetries:3,retryDelay:100})
 }
})

test('Windows launcher enforces one local Vite instance on fixed port',()=>{
 const start=readFileSync(resolve(process.cwd(),'scripts/start-windows.ps1'),'utf8')
 const vite=readFileSync(resolve(process.cwd(),'vite.config.ts'),'utf8')
 const stop=start.indexOf('Stop-ProjectVite -Root $projectRoot')
 const dev=start.indexOf("Invoke-CheckedCommand -Command $npm -Arguments @('run', 'dev', '--', '--open')")
 assert.ok(stop>=0&&dev>stop)
 assert.match(vite,/host:'127\.0\.0\.1'/)
 assert.match(vite,/port:5180/)
 assert.match(vite,/strictPort:true/)
})
