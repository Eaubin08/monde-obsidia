// Content-addressed synthetic lab store. Explicit root only, no production state.
import {mkdir,writeFile,readFile,rename,rm,readdir,lstat} from 'node:fs/promises'
import {join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
const hex=x=>typeof x==='string'&&/^SHA256:[0-9a-f]{64}$/.test(x)
const id=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x)
const hash=s=>'SHA256:'+createHash('sha256').update(s,'utf8').digest('hex')
export function createSyntheticArtifactStore(root){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit lab root required')
 const base=resolve(root)
 const artifacts=join(base,'artifacts')
 const manifests=join(base,'manifests')
 async function init(){await mkdir(artifacts,{recursive:true});await mkdir(manifests,{recursive:true})}
 async function save(job){
  if(!id(job?.id)||job?.phase!=='TESTED_SYNTHETIC'||!job.artifact||!job.tests?.length||!job.tests.every(x=>x.pass))throw Error('Only tested synthetic jobs may be stored')
  const {content,digest}=job.artifact
  if(typeof content!=='string'||!hex(digest)||hash(content)!==digest)throw Error('Artifact digest invalid')
  const parsed=JSON.parse(content)
  if(parsed.synthetic!==true||parsed.deployable!==false||parsed.decisionAuthority!=='NONE'||parsed.organizationId!==job.request?.organizationId||parsed.id!==job.request?.componentId)throw Error('Non-synthetic artifact rejected')
  await init()
  const name=digest.slice(7)+'.json',file=join(artifacts,name)
  const manifest={schema:'OBSIDIA_SYNTHETIC_STORED_JOB_V0',jobId:job.id,organizationId:job.request.organizationId,
   componentId:job.request.componentId,kind:job.request.kind,templateId:job.templateId,
   status:'TESTED_SYNTHETIC',artifactDigest:digest,tests:job.tests,events:job.events,
   buildApproved:false,deploymentApproved:false,executionAllowed:false}
  const dest=join(manifests,job.id+'.json')
  // Exclusive create: another job ID cannot overwrite its previous manifest.
  await writeFile(file,content,{flag:'wx'}).catch(async err=>{
   if(err.code!=='EEXIST')throw err
   const existing=await readFile(file,'utf8')
   if(hash(existing)!==digest||existing!==content)throw Error('Digest collision or corrupted stored artifact')
  })
  await writeFile(dest,JSON.stringify(manifest,null,2)+'\n',{flag:'wx'})
  return {status:'STORED_SYNTHETIC',jobId:job.id,digest,manifest}
 }
 async function inspect(jobId){
  if(!id(jobId))return {status:'INVALID_ID'}
  let manifest
  try{manifest=JSON.parse(await readFile(join(manifests,jobId+'.json'),'utf8'))}catch{return {status:'NOT_FOUND'}}
  if(manifest.jobId!==jobId||!hex(manifest.artifactDigest)||manifest.schema!=='OBSIDIA_SYNTHETIC_STORED_JOB_V0'||manifest.status!=='TESTED_SYNTHETIC'||manifest.buildApproved!==false||manifest.executionAllowed!==false||manifest.deploymentApproved!==false)return {status:'INVALID_MANIFEST'}
  const path=join(artifacts,manifest.artifactDigest.slice(7)+'.json')
  try{
   if(!(await lstat(path)).isFile())return {status:'INVALID_ARTIFACT'}
   const content=await readFile(path,'utf8')
   if(hash(content)!==manifest.artifactDigest)return {status:'DIGEST_MISMATCH'}
   const parsed=JSON.parse(content)
   if(parsed.synthetic!==true||parsed.deployable!==false||parsed.decisionAuthority!=='NONE'||parsed.organizationId!==manifest.organizationId||parsed.id!==manifest.componentId)return {status:'INVALID_ARTIFACT'}
   return {status:'VERIFIED_STORED_SYNTHETIC',manifest,artifact:{content,digest:manifest.artifactDigest},buildApproved:false,deploymentApproved:false,executionAllowed:false}
  }catch{return {status:'INVALID_ARTIFACT'}}
 }
 async function list(){
  try{return (await readdir(manifests)).filter(x=>/^LAB_JOB_[0-9]{5}\.json$/.test(x)).map(x=>x.slice(0,-5)).sort()}catch{return []}
 }
 return {save,inspect,list,root:base}
}
