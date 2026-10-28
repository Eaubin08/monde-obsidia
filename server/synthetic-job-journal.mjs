// V49 lab-only append-log via immutable numbered event files. No production authority.
import {mkdir,writeFile,readFile,readdir,lstat} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {createHash} from 'node:crypto'
const valid=x=>typeof x==='string'&&/^LAB_JOB_[0-9]{5}_[0-9a-f]{32}$/.test(x)
const digest=x=>'SHA256:'+createHash('sha256').update(x).digest('hex')
export function createSyntheticJobJournal(root){
 if(typeof root!=='string'||!root.trim())throw Error('Explicit lab journal root required')
 const dir=join(resolve(root),'job-events')
 async function append(jobId,phase,details={}){
  if(!valid(jobId)||!['QUEUED','RUNNING','TESTED_SYNTHETIC','FAILED','STORED_SYNTHETIC'].includes(phase))throw Error('Invalid lab event')
  if(details===null||typeof details!=='object'||Array.isArray(details)||Object.keys(details).length>8)throw Error('Invalid event details')
  const previous=await read(jobId)
  if(previous.status==='INVALID')throw Error('Corrupted journal')
  const last=previous.events.at(-1)?.phase??null
  const transitions={null:['QUEUED'],QUEUED:['RUNNING'],RUNNING:['TESTED_SYNTHETIC','FAILED'],TESTED_SYNTHETIC:['STORED_SYNTHETIC'],FAILED:[],STORED_SYNTHETIC:[]}
  if(!transitions[String(last)].includes(phase))throw Error('Invalid event transition')
  const ordinal=previous.events.length+1
  await mkdir(join(dir,jobId),{recursive:true})
  const body={schema:'OBSIDIA_SYNTHETIC_JOB_EVENT_V0',jobId,ordinal,phase,details,previousDigest:previous.events.at(-1)?.digest??null}
  const payload=JSON.stringify(body)
  const record={...body,digest:digest(payload)}
  await writeFile(join(dir,jobId,String(ordinal).padStart(4,'0')+'.json'),JSON.stringify(record)+'\n',{flag:'wx'})
  return record
 }
 async function read(jobId){
  if(!valid(jobId))return {status:'INVALID',events:[]}
  let names
  try{names=(await readdir(join(dir,jobId))).filter(n=>/^\d{4}\.json$/.test(n)).sort()}catch{return {status:'EMPTY',events:[]}}
  const events=[]
  for(let i=0;i<names.length;i++){
   if(names[i]!==String(i+1).padStart(4,'0')+'.json')return {status:'INVALID',events}
   try{
    const path=join(dir,jobId,names[i])
    if(!(await lstat(path)).isFile())return {status:'INVALID',events}
    const {digest:stored,...body}=JSON.parse(await readFile(path,'utf8'))
    if(body.schema!=='OBSIDIA_SYNTHETIC_JOB_EVENT_V0'||body.jobId!==jobId||body.ordinal!==i+1||body.previousDigest!==(events.at(-1)?.digest??null)||stored!==digest(JSON.stringify(body)))return {status:'INVALID',events}
    const last=events.at(-1)?.phase??null
    const transitions={null:['QUEUED'],QUEUED:['RUNNING'],RUNNING:['TESTED_SYNTHETIC','FAILED'],TESTED_SYNTHETIC:['STORED_SYNTHETIC'],FAILED:[],STORED_SYNTHETIC:[]}
    if(!transitions[String(last)]?.includes(body.phase))return {status:'INVALID',events}
    events.push({...body,digest:stored})
   }catch{return {status:'INVALID',events}}
  }
  return {status:events.length?'VERIFIED_LOCAL_JOURNAL':'EMPTY',events}
 }
 return {append,read,root:resolve(root)}
}
