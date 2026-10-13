import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readNativeEnterpriseView} from '../server/native-enterprise-read.mjs'

test('missing local canonical module never fabricates a runtime',()=>{
 const result=readNativeEnterpriseView({repoRoot:'/nonexistent/obsidia',env:{}})
 assert.equal(result.available,false)
 assert.equal(result.readonly,true)
 assert.equal(result.entities.length,0)
 assert.equal(result.reason,'NATIVE_READ_MODEL_MODULE_NOT_PRESENT')
})

test('present module without configured native roots remains unavailable',()=>{
 const root=mkdtempSync(join(tmpdir(),'monde-enterprise-'))
 try{
  mkdirSync(join(root,'periphery','native_ops'),{recursive:true})
  writeFileSync(join(root,'periphery','native_ops','monde_native_read_model_v0.py'),'# test\n')
  let calls=0
  const r=readNativeEnterpriseView({repoRoot:root,env:{},run:()=>{calls++}})
  assert.equal(r.reason,'NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
  assert.equal(calls,0)
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('configured local native path uses source read-only CLI without mutation',()=>{
 const root=mkdtempSync(join(tmpdir(),'monde-enterprise-'))
 try{
  mkdirSync(join(root,'periphery','native_ops'),{recursive:true})
  writeFileSync(join(root,'periphery','native_ops','monde_native_read_model_v0.py'),'# test\n')
  const store=join(root,'native');mkdirSync(store)
  let called=0
  const data={schema:'MONDE_OBSIDIA_NATIVE_READ_MODEL_V0',readonly:true,decision_authority:'KX108_ONLY',canonical_truth:false,entities:[],relations:[],availability:{task:'UNAVAILABLE'},projection_hash:'a'.repeat(64)}
  const result=readNativeEnterpriseView({
    repoRoot:root,env:{OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store},
    run:(python,args,opts)=>{
      called++
      assert.deepEqual(args.slice(0,2),['-m','periphery.native_ops.monde_native_read_model_v0'])
      assert.deepEqual(args.slice(-2),['--native-store-root',store])
      assert.equal(opts.cwd,root)
      return JSON.stringify(data)
    }
  })
  assert.equal(called,1)
  assert.equal(result.available,true)
  assert.equal(result.readonly,true)
  assert.equal(result.canonical_truth,false)
  assert.equal(result.entities.length,0)
 }finally{rmSync(root,{recursive:true,force:true})}
})

test('invalid or failing canonical reads never return invented objects',()=>{
 const root=mkdtempSync(join(tmpdir(),'monde-enterprise-'))
 try{
  mkdirSync(join(root,'periphery','native_ops'),{recursive:true})
  writeFileSync(join(root,'periphery','native_ops','monde_native_read_model_v0.py'),'# test\n')
  const store=join(root,'native');mkdirSync(store)
  const r=readNativeEnterpriseView({
   repoRoot:root,env:{OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store},
   run:()=>JSON.stringify({schema:'WRONG',readonly:false,entities:[{id:'fabricated'}],relations:[]})
  })
  assert.equal(r.available,false)
  assert.equal(r.entities.length,0)
  assert.equal(r.reason,'NATIVE_READ_MODEL_CONTRACT_INVALID')
 }finally{rmSync(root,{recursive:true,force:true})}
})
