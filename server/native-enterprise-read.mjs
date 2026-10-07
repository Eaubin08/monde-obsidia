import {existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {pythonFor} from './paths.mjs'

const SCHEMA='MONDE_OBSIDIA_NATIVE_READ_MODEL_V0'
const ROOTS=[
 ['OBSIDIA_ENTERPRISE_SOURCE_RUNTIME_ROOT','--source-runtime-root'],
 ['OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT','--native-store-root'],
 ['OBSIDIA_ENTERPRISE_GOVERNANCE_ROOT','--governance-root'],
 ['OBSIDIA_ENTERPRISE_EXECUTION_ROOT','--execution-root']
]
const unavailable=reason=>({schema:SCHEMA,available:false,readonly:true,canonical_truth:false,
 decision_authority:'KX108_ONLY',reason,entities:[],relations:[],availability:{}})

// Matching Python canonical_hash for this persisted JSON schema.
function canonical(value){
 if(Array.isArray(value))return '['+value.map(canonical).join(',')+']'
 if(value!==null&&typeof value==='object')
  return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical(value[k])).join(',')+'}'
 if(value===null||typeof value==='string'||typeof value==='boolean'
    ||(typeof value==='number'&&Number.isSafeInteger(value)))return JSON.stringify(value)
 throw Error('READ_MODEL_CANONICAL_VALUE_UNSUPPORTED')
}
function verified(state){
 if(state?.schema!==SCHEMA||state.readonly!==true||state.canonical_truth!==false
    ||state.allowed_to_decide!==false||state.allowed_to_act!==false
    ||state.emits_act!==false||state.decision_authority!=='KX108_ONLY'
    ||state.observation_scope!=='LOCAL_PERSISTED_ONLY'
    ||!Array.isArray(state.entities)||!Array.isArray(state.relations)
    ||!state.availability||typeof state.availability!=='object'
    ||!(/^[0-9a-f]{64}$/.test(state.projection_hash||'')))return false
 const {projection_hash,...payload}=state
 const digest=createHash('sha256').update(canonical(payload),'utf8').digest('hex')
 if(digest!==projection_hash)return false
 const ids=new Set()
 for(const entity of state.entities){
  if(!entity||typeof entity.id!=='string'||ids.has(entity.id)
   ||entity.source!=='CANONICAL_PERSISTED'
   ||!(/^[0-9a-f]{64}$/.test(entity.evidence_hash||'')))return false
  ids.add(entity.id)
 }
 return state.relations.every(r=>r&&typeof r.type==='string'&&ids.has(r.from)&&ids.has(r.to))
}

export function readNativeEnterpriseView({repoRoot,env=process.env,run=execFileSync}={}){
 if(!repoRoot||!existsSync(resolve(repoRoot,'periphery','native_ops','monde_native_read_model_v0.py')))
  return unavailable('NATIVE_READ_MODEL_MODULE_NOT_PRESENT')
 const roots=ROOTS.flatMap(([name,flag])=>
  typeof env[name]==='string'&&env[name].trim()?[[flag,resolve(env[name])]]:[])
 if(!roots.length)return unavailable('NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
 if(!roots.some(([,root])=>existsSync(root)))return unavailable('NATIVE_ENTERPRISE_STORES_NOT_FOUND')
 try{
  const output=run(pythonFor(repoRoot),[
   '-m','periphery.native_ops.monde_native_read_model_v0',...roots.flat()
  ],{cwd:repoRoot,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,windowsHide:true})
  const state=JSON.parse(output)
  if(!verified(state))return unavailable('NATIVE_READ_MODEL_CONTRACT_OR_HASH_INVALID')
  return {...state,available:true}
 }catch{
  return unavailable('NATIVE_READ_MODEL_VERIFICATION_FAILED')
 }
}
