// V53 bounded storage policy. Cooperative lab use only, never an OS isolation boundary.
import {readdir,lstat} from 'node:fs/promises'
import {join,resolve} from 'node:path'
export function createSyntheticStoragePolicy(root,{maxArtifactBytes=65536,maxTotalBytes=10485760,maxManifestCount=1000}={}){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit lab root required')
 if(![maxArtifactBytes,maxTotalBytes,maxManifestCount].every(Number.isSafeInteger)||maxArtifactBytes<1||maxTotalBytes<maxArtifactBytes||maxManifestCount<1)throw Error('Invalid storage limits')
 const base=resolve(root)
 async function scan(){
  let bytes=0,manifestCount=0
  for(const sub of ['artifacts','manifests']){
   let entries
   try{entries=await readdir(join(base,sub),{withFileTypes:true})}catch(e){if(e.code==='ENOENT')continue;throw e}
   for(const entry of entries){
    if(!entry.isFile())throw Error('Unsafe storage entry')
    const stat=await lstat(join(base,sub,entry.name))
    if(!stat.isFile())throw Error('Unsafe storage entry')
    bytes+=stat.size
    if(sub==='manifests')manifestCount++
    if(bytes>maxTotalBytes)return {status:'QUOTA_EXCEEDED',bytes,manifestCount}
   }
  }
  return {status:'WITHIN_QUOTA',bytes,manifestCount}
 }
 async function admit({artifactBytes,manifestBytes}){
  if(!Number.isSafeInteger(artifactBytes)||!Number.isSafeInteger(manifestBytes)||artifactBytes<0||manifestBytes<0)return {status:'REJECTED',reason:'INVALID_SIZE'}
  if(artifactBytes>maxArtifactBytes)return {status:'REJECTED',reason:'ARTIFACT_TOO_LARGE'}
  const state=await scan()
  if(state.status!=='WITHIN_QUOTA')return {status:'REJECTED',reason:state.status}
  if(state.manifestCount>=maxManifestCount)return {status:'REJECTED',reason:'MANIFEST_LIMIT'}
  if(state.bytes+artifactBytes+manifestBytes>maxTotalBytes)return {status:'REJECTED',reason:'TOTAL_BYTES_LIMIT'}
  return {status:'ADMITTED',bytesBefore:state.bytes}
 }
 return {scan,admit,limits:{maxArtifactBytes,maxTotalBytes,maxManifestCount}}
}
