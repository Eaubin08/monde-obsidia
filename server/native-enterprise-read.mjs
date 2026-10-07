// Read-only bridge to the existing Obsidia canonical native state.
// No Digital Twin is run, no synthetic entities, no write/approval routes.
import {existsSync} from 'node:fs'
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

export function readNativeEnterpriseView({
 repoRoot, env=process.env, run=execFileSync
}={}){
 if(!repoRoot||!existsSync(resolve(repoRoot,'periphery','native_ops','monde_native_read_model_v0.py')))
  return unavailable('NATIVE_READ_MODEL_MODULE_NOT_PRESENT')
 const roots=ROOTS.flatMap(([name,flag])=>
  typeof env[name]==='string'&&env[name].trim()?[[flag,resolve(env[name])]]:[])
 if(!roots.length) return unavailable('NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED')
 if(!roots.some(([,root])=>existsSync(root)))return unavailable('NATIVE_ENTERPRISE_STORES_NOT_FOUND')
 try{
  const output=run(pythonFor(repoRoot),[
   '-m','periphery.native_ops.monde_native_read_model_v0',...roots.flat()
  ],{cwd:repoRoot,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,windowsHide:true})
  const state=JSON.parse(output)
  if(state.schema!==SCHEMA||state.readonly!==true||state.decision_authority!=='KX108_ONLY'
      ||!Array.isArray(state.entities)||!Array.isArray(state.relations))
    return unavailable('NATIVE_READ_MODEL_CONTRACT_INVALID')
  return {...state,available:true}
 }catch(error){
  // Deliberately do not return stdout/stderr; it can contain local paths/data.
  return unavailable('NATIVE_READ_MODEL_VERIFICATION_FAILED')
 }
}
