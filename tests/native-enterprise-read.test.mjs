import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readNativeEnterpriseView,resolveNativeReadModelRepo} from '../server/native-enterprise-read.mjs'

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
  const selected=resolveNativeReadModelRepo({
   repoRoot:active,
   env:{OBSIDIA_ENTERPRISE_READ_MODEL_REPO:readModel}
  })
  assert.equal(selected.root,readModel)
  assert.equal(selected.source,'OBSIDIA_ENTERPRISE_READ_MODEL_REPO')
  assert.equal(selected.present,true)
 }finally{
  rmSync(active,{recursive:true,force:true})
  rmSync(readModel,{recursive:true,force:true})
 }
})

test('present module without configured native roots remains unavailable',()=>{
 const root=makeModuleRoot()
 try{
  let calls=0
  const r=readNativeEnterpriseView({repoRoot:root,env:{},run:()=>{calls++}})
  assert.equal(r.reason,'NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
  assert.equal(calls,0)
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('configured dedicated checkout runs read model from dedicated root',()=>{
 const active=mkdtempSync(join(tmpdir(),'obsidia-active-'))
 const readModel=makeModuleRoot('obsidia-read-model-')
 const store=join(readModel,'native');mkdirSync(store)
 try{
  let called=0
  const data={schema:'MONDE_OBSIDIA_NATIVE_READ_MODEL_V0',readonly:true,decision_authority:'KX108_ONLY',canonical_truth:false,entities:[],relations:[],availability:{task:'UNAVAILABLE'},projection_hash:'a'.repeat(64)}
  const result=readNativeEnterpriseView({
    repoRoot:active,
    env:{
      OBSIDIA_ENTERPRISE_READ_MODEL_REPO:readModel,
      OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store
    },
    run:(python,args,opts)=>{
      called++
      assert.deepEqual(args.slice(0,2),['-m','periphery.native_ops.monde_native_read_model_v0'])
      assert.deepEqual(args.slice(-2),['--native-store-root',store])
      assert.equal(opts.cwd,readModel)
      return JSON.stringify(data)
    }
  })
  assert.equal(called,1)
  assert.equal(result.available,true)
  assert.equal(result.read_model_repo_source,'OBSIDIA_ENTERPRISE_READ_MODEL_REPO')
 }finally{
  rmSync(active,{recursive:true,force:true})
  rmSync(readModel,{recursive:true,force:true})
 }
})

test('invalid or failing canonical reads never return invented objects',()=>{
 const root=makeModuleRoot()
 const store=join(root,'native');mkdirSync(store)
 try{
  const r=readNativeEnterpriseView({
   repoRoot:root,env:{OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store},
   run:()=>JSON.stringify({schema:'WRONG',readonly:false,entities:[{id:'fabricated'}],relations:[]})
  })
  assert.equal(r.available,false)
  assert.equal(r.entities.length,0)
  assert.equal(r.reason,'NATIVE_READ_MODEL_CONTRACT_INVALID')
 }finally{rmSync(root,{recursive:true,force:true})}
})
