import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readNativeEnterpriseView,resolveNativeReadModelRepo,detectEnterpriseRoots} from '../server/native-enterprise-read.mjs'

function makeModuleRoot(prefix='monde-enterprise-'){
 const root=mkdtempSync(join(tmpdir(),prefix))
 mkdirSync(join(root,'periphery','native_ops'),{recursive:true})
 writeFileSync(join(root,'periphery','native_ops','monde_native_read_model_v0.py'),'# test\n')
 return root
}

test('missing local canonical module never fabricates a runtime',()=>{
 const result=readNativeEnterpriseView({repoRoot:'/nonexistent/obsidia',env:{}})
 assert.equal(result.available,false)
 assert.equal(result.readonly,true)
 assert.equal(result.entities.length,0)
 assert.equal(result.reason,'NATIVE_READ_MODEL_MODULE_NOT_PRESENT')
})

test('dedicated read-model checkout can differ from active Obsidia checkout',()=>{
 const active=mkdtempSync(join(tmpdir(),'obsidia-active-'))
 const readModel=makeModuleRoot('obsidia-read-model-')
 try{
  const selected=resolveNativeReadModelRepo({repoRoot:active,env:{OBSIDIA_ENTERPRISE_READ_MODEL_REPO:readModel}})
  assert.equal(selected.root,readModel)
  assert.equal(selected.source,'OBSIDIA_ENTERPRISE_READ_MODEL_REPO')
  assert.equal(selected.present,true)
 }finally{rmSync(active,{recursive:true,force:true});rmSync(readModel,{recursive:true,force:true})}
})

test('auto-detection finds only existing marker-backed roots',()=>{
 const active=mkdtempSync(join(tmpdir(),'obsidia-detect-'))
 const runtime=join(active,'runtime')
 const native=join(active,'native')
 mkdirSync(join(runtime,'packets'),{recursive:true})
 mkdirSync(join(native,'native_tasks'),{recursive:true})
 mkdirSync(join(native,'native_crm'),{recursive:true})
 try{
  const detected=detectEnterpriseRoots({repoRoot:active,readModelRoot:active,env:{LOCALAPPDATA:join(active,'none')}})
  assert.equal(detected.roots.source_runtime,runtime)
  assert.equal(detected.roots.native_store,native)
  assert.equal(detected.provenance.source_runtime,'AUTO_DETECTED')
  assert.equal(detected.provenance.native_store,'AUTO_DETECTED')
  assert.equal(detected.roots.governance,undefined)
  assert.equal(detected.roots.execution,undefined)
 }finally{rmSync(active,{recursive:true,force:true})}
})

test('configured environment roots take priority over auto detection',()=>{
 const active=mkdtempSync(join(tmpdir(),'obsidia-env-'))
 const automatic=join(active,'native');mkdirSync(join(automatic,'native_tasks'),{recursive:true})
 const explicit=join(active,'explicit-native');mkdirSync(join(explicit,'native_crm'),{recursive:true})
 try{
  const detected=detectEnterpriseRoots({
   repoRoot:active,readModelRoot:active,
   env:{LOCALAPPDATA:join(active,'none'),OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:explicit}
  })
  assert.equal(detected.roots.native_store,explicit)
  assert.equal(detected.provenance.native_store,'ENV:OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT')
 }finally{rmSync(active,{recursive:true,force:true})}
})

test('present module without any real roots remains unavailable',()=>{
 const root=makeModuleRoot()
 try{
  let calls=0
  const r=readNativeEnterpriseView({repoRoot:root,env:{LOCALAPPDATA:join(root,'missing')},run:()=>{calls++}})
  assert.equal(r.reason,'NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
  assert.equal(calls,0)
  assert.equal(Object.keys(r.root_detection.roots).length,0)
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('auto-detected native store is passed to read model without mutation',()=>{
 const root=makeModuleRoot()
 const store=join(root,'native');mkdirSync(join(store,'native_tasks'),{recursive:true})
 try{
  let called=0
  const data={schema:'MONDE_OBSIDIA_NATIVE_READ_MODEL_V0',readonly:true,decision_authority:'KX108_ONLY',canonical_truth:false,entities:[],relations:[],availability:{task:'UNAVAILABLE'},projection_hash:'a'.repeat(64)}
  const result=readNativeEnterpriseView({
    repoRoot:root,env:{LOCALAPPDATA:join(root,'missing')},
    run:(python,args,opts)=>{
      called++
      assert.deepEqual(args.slice(0,2),['-m','periphery.native_ops.monde_native_read_model_v0'])
      assert.ok(args.includes('--native-store-root'))
      assert.ok(args.includes(store))
      assert.equal(opts.cwd,root)
      return JSON.stringify(data)
    }
  })
  assert.equal(called,1)
  assert.equal(result.available,true)
  assert.equal(result.root_detection.provenance.native_store,'AUTO_DETECTED')
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('invalid canonical read never returns invented objects',()=>{
 const root=makeModuleRoot()
 const store=join(root,'native');mkdirSync(join(store,'native_tasks'),{recursive:true})
 try{
  const r=readNativeEnterpriseView({
   repoRoot:root,env:{LOCALAPPDATA:join(root,'missing')},
   run:()=>JSON.stringify({schema:'WRONG',readonly:false,entities:[{id:'fabricated'}],relations:[]})
  })
  assert.equal(r.available,false)
  assert.equal(r.entities.length,0)
  assert.equal(r.reason,'NATIVE_READ_MODEL_CONTRACT_INVALID')
 }finally{rmSync(root,{recursive:true,force:true})}
})
