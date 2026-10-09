// C5.4 local readiness: metadata only. No runtime launch, no file contents.
import {existsSync,statSync} from 'node:fs'
import {resolve} from 'node:path'
import {execFileSync} from 'node:child_process'
import {repository} from './paths.mjs'

export function c54SourceReadiness({root=repository()}={}) {
 const result={schema:'OBSIDIA_C54_LOCAL_SOURCE_READINESS_V0',readonly:true,
  canonicalTruth:false,decisionAuthority:'KX108_ONLY',sourcePresent:false,
  gitHead:null,gitBranch:null,decisionsObserved:null,receiptsObserved:null,
  status:'SOURCE_UNAVAILABLE',executionAllowed:false}
 try {
  if(!existsSync(root)||!statSync(root).isDirectory())return result
  const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8',timeout:3000,windowsHide:true}).trim()
  const head=git('rev-parse','--verify','HEAD')
  const branch=git('branch','--show-current')
  if(!/^[a-f0-9]{40,64}$/.test(head))return result
  return {...result,sourcePresent:true,gitHead:head,gitBranch:branch,status:'SOURCE_GIT_OBSERVED_NOT_RUNTIME_VERIFIED'}
 }catch{return result}
}
