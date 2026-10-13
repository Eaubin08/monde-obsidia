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
const MODULE_PATH=['periphery','native_ops','monde_native_read_model_v0.py']
const unavailable=(reason,extra={})=>({schema:SCHEMA,available:false,readonly:true,canonical_truth:false,
 decision_authority:'KX108_ONLY',reason,entities:[],relations:[],availability:{},...extra})

function modulePresent(root){
 return !!root&&existsSync(resolve(root,...MODULE_PATH))
}

export function resolveNativeReadModelRepo({repoRoot,env=process.env}={}){
 const explicit=typeof env.OBSIDIA_ENTERPRISE_READ_MODEL_REPO==='string'
  ?env.OBSIDIA_ENTERPRISE_READ_MODEL_REPO.trim():''
 if(explicit){
  const root=resolve(explicit)
  return {root,source:'OBSIDIA_ENTERPRISE_READ_MODEL_REPO',present:modulePresent(root)}
 }
 return {root:repoRoot?resolve(repoRoot):null,source:'OBSIDIA_SOURCE_REPO',present:modulePresent(repoRoot)}
}

export function readNativeEnterpriseView({
 repoRoot, env=process.env, run=execFileSync
}={}){
 const selected=resolveNativeReadModelRepo({repoRoot,env})
 if(!selected.root||!selected.present)
  return unavailable('NATIVE_READ_MODEL_MODULE_NOT_PRESENT',{
   read_model_repo_source:selected.source,
   read_model_repo_configured:!!selected.root
  })
 const roots=ROOTS.flatMap(([name,flag])=>
  typeof env[name]==='string'&&env[name].trim()?[[flag,resolve(env[name])]]:[])
 if(!roots.length) return unavailable('NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED',{
  read_model_repo_source:selected.source,read_model_repo_configured:true
 })
 if(!roots.some(([,root])=>existsSync(root)))return unavailable('NATIVE_ENTERPRISE_STORES_NOT_FOUND',{
  read_model_repo_source:selected.source,read_model_repo_configured:true
 })
 try{
  const output=run(pythonFor(selected.root),[
   '-m','periphery.native_ops.monde_native_read_model_v0',...roots.flat()
  ],{cwd:selected.root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,windowsHide:true})
  const state=JSON.parse(output)
  if(state.schema!==SCHEMA||state.readonly!==true||state.decision_authority!=='KX108_ONLY'
      ||!Array.isArray(state.entities)||!Array.isArray(state.relations))
    return unavailable('NATIVE_READ_MODEL_CONTRACT_INVALID',{
     read_model_repo_source:selected.source,read_model_repo_configured:true
    })
  return {...state,available:true,read_model_repo_source:selected.source}
 }catch(error){
  // Deliberately do not return stdout/stderr; it can contain local paths/data.
  return unavailable('NATIVE_READ_MODEL_VERIFICATION_FAILED',{
   read_model_repo_source:selected.source,read_model_repo_configured:true
  })
 }
}
