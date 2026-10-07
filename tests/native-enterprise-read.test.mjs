import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readNativeEnterpriseView} from '../server/native-enterprise-read.mjs'

const canonical=value=>Array.isArray(value)?'['+value.map(canonical).join(',')+']':
 value!==null&&typeof value==='object'?
 '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}':
 JSON.stringify(value)
function fixture(){
 const data={
  schema:'MONDE_OBSIDIA_NATIVE_READ_MODEL_V0',readonly:true,canonical_truth:false,
  allowed_to_decide:false,allowed_to_act:false,emits_act:false,
  decision_authority:'KX108_ONLY',observation_scope:'LOCAL_PERSISTED_ONLY',
  availability:{task:'UNAVAILABLE'},entities:[],relations:[]
 }
 return {...data,projection_hash:createHash('sha256').update(canonical(data)).digest('hex')}
}
function local(consumer){
 const root=mkdtempSync(join(tmpdir(),'monde-native-'))
 try{
  mkdirSync(join(root,'periphery','native_ops'),{recursive:true})
  writeFileSync(join(root,'periphery','native_ops','monde_native_read_model_v0.py'),'')
  const store=join(root,'native');mkdirSync(store)
  return consumer(root,store)
 }finally{rmSync(root,{recursive:true,force:true})}
}

test('no native module returns unavailable, never fabricated',()=>{
 const r=readNativeEnterpriseView({repoRoot:'/nonexistent/obsidia',env:{}})
 assert.equal(r.available,false)
 assert.equal(r.entities.length,0)
 assert.equal(r.readonly,true)
})

test('no configured roots never invokes Python',()=>local(root=>{
 let calls=0
 const r=readNativeEnterpriseView({repoRoot:root,env:{},run:()=>{calls++}})
 assert.equal(r.reason,'NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
 assert.equal(calls,0)
}))

test('signed canonical read is accepted on exact read-only CLI',()=>local((root,store)=>{
 let calls=0
 const r=readNativeEnterpriseView({
  repoRoot:root,env:{OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store},
  run:(python,args,options)=>{
   calls++
   assert.deepEqual(args.slice(0,2),['-m','periphery.native_ops.monde_native_read_model_v0'])
   assert.deepEqual(args.slice(-2),['--native-store-root',store])
   assert.equal(options.cwd,root)
   return JSON.stringify(fixture())
  }
 })
 assert.equal(calls,1)
 assert.equal(r.available,true)
 assert.equal(r.canonical_truth,false)
 assert.equal(r.readonly,true)
}))

test('altered, malformed or non-sovereign contract violations refuse data',()=>local((root,store)=>{
 const read=data=>readNativeEnterpriseView({
  repoRoot:root,env:{OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT:store},
  run:()=>JSON.stringify(data)
 })
 const good=fixture()
 assert.equal(read(good).available,true)
 assert.equal(read({...good,availability:{task:'OBSERVED'}}).available,false)
 assert.equal(read({...good,allowed_to_act:true}).available,false)
 assert.equal(read({...good,decision_authority:'PROVIDER'}).available,false)
 assert.equal(read({...good,entities:[{id:'task:unverified'}]}).available,false)
 assert.equal(read({schema:'WRONG',entities:[],relations:[]}).available,false)
}))
