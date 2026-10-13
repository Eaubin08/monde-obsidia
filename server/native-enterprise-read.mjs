// Read-only bridge to the existing Obsidia canonical native state.
// No Digital Twin is run, no synthetic entities, no write/approval routes.
import {existsSync,readdirSync,statSync} from 'node:fs'
import {execFileSync} from 'node:child_process'
import {resolve} from 'node:path'
import {homedir} from 'node:os'
import {pythonFor} from './paths.mjs'

const SCHEMA='MONDE_OBSIDIA_NATIVE_READ_MODEL_V0'
const MODULE_PATH=['periphery','native_ops','monde_native_read_model_v0.py']
const ROOT_SPECS=[
 {env:'OBSIDIA_ENTERPRISE_SOURCE_RUNTIME_ROOT',flag:'--source-runtime-root',key:'source_runtime',markers:['packets']},
 {env:'OBSIDIA_ENTERPRISE_NATIVE_STORE_ROOT',flag:'--native-store-root',key:'native_store',markers:['native_tasks','native_crm']},
 {env:'OBSIDIA_ENTERPRISE_GOVERNANCE_ROOT',flag:'--governance-root',key:'governance',markers:['decisions']},
 {env:'OBSIDIA_ENTERPRISE_EXECUTION_ROOT',flag:'--execution-root',key:'execution',markers:['receipts']}
]
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

function candidateBases({repoRoot,readModelRoot,env=process.env}){
 const local=env.LOCALAPPDATA||resolve(homedir(),'AppData','Local')
 const bases=[
  env.OBSIDIA_ENTERPRISE_DATA_ROOT,
  resolve(local,'Obsidia'),
  repoRoot,
  readModelRoot,
  repoRoot?resolve(repoRoot,'runtime'):null,
  repoRoot?resolve(repoRoot,'runtime_enterprise'):null,
  repoRoot?resolve(repoRoot,'runtime_terrain_bank_trading_gps'):null,
  readModelRoot?resolve(readModelRoot,'runtime'):null,
  readModelRoot?resolve(readModelRoot,'runtime_enterprise'):null,
 ].filter(Boolean).map(p=>resolve(p))
 return [...new Set(bases)]
}

function shallowChildren(root){
 if(!root||!existsSync(root))return []
 try{
  return readdirSync(root,{withFileTypes:true})
   .filter(x=>x.isDirectory())
   .slice(0,200)
   .map(x=>resolve(root,x.name))
 }catch{return []}
}

function scoreRoot(path,markers){
 if(!path||!existsSync(path))return 0
 let score=1
 for(const marker of markers)if(existsSync(resolve(path,marker)))score+=10
 try{
  const names=readdirSync(path).slice(0,200)
  if(names.some(name=>/state\.json$|receipt|decision|packet/i.test(name)))score+=2
 }catch{}
 return score
}

export function detectEnterpriseRoots({repoRoot,readModelRoot,env=process.env}={}){
 const bases=candidateBases({repoRoot,readModelRoot,env})
 const scanned=[...new Set(bases.flatMap(base=>[base,...shallowChildren(base),...shallowChildren(base).flatMap(shallowChildren)]))]
 const roots={}
 const provenance={}
 for(const spec of ROOT_SPECS){
  const configured=typeof env[spec.env]==='string'?env[spec.env].trim():''
  if(configured){
   const p=resolve(configured)
   if(existsSync(p)){roots[spec.key]=p;provenance[spec.key]='ENV:'+spec.env}
   continue
  }
  const ranked=scanned.map(path=>({path,score:scoreRoot(path,spec.markers)}))
   .filter(x=>x.score>=10)
   .sort((a,b)=>b.score-a.score||a.path.localeCompare(b.path))
  if(ranked.length){roots[spec.key]=ranked[0].path;provenance[spec.key]='AUTO_DETECTED'}
 }
 return {roots,provenance,scanned_count:scanned.length}
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

 const detected=detectEnterpriseRoots({repoRoot,readModelRoot:selected.root,env})
 const args=[]
 for(const spec of ROOT_SPECS){
  const root=detected.roots[spec.key]
  if(root)args.push(spec.flag,root)
 }

 if(!args.length) return unavailable('NATIVE_ENTERPRISE_ROOTS_NOT_CONFIGURED',{
  read_model_repo_source:selected.source,
  read_model_repo_configured:true,
  root_detection:{...detected,roots:{}}
 })

 try{
  const output=run(pythonFor(selected.root),[
   '-m','periphery.native_ops.monde_native_read_model_v0',...args
  ],{cwd:selected.root,encoding:'utf8',timeout:30000,maxBuffer:8*1024*1024,windowsHide:true})
  const state=JSON.parse(output)
  if(state.schema!==SCHEMA||state.readonly!==true||state.decision_authority!=='KX108_ONLY'
      ||!Array.isArray(state.entities)||!Array.isArray(state.relations))
    return unavailable('NATIVE_READ_MODEL_CONTRACT_INVALID',{
     read_model_repo_source:selected.source,read_model_repo_configured:true,
     root_detection:detected
    })
  return {...state,available:true,read_model_repo_source:selected.source,root_detection:detected}
 }catch(error){
  return unavailable('NATIVE_READ_MODEL_VERIFICATION_FAILED',{
   read_model_repo_source:selected.source,read_model_repo_configured:true,
   root_detection:detected
  })
 }
}
