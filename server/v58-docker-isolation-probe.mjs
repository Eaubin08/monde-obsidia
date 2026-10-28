// V58 Docker isolation probe. Fail closed: no Docker, missing cached image, unsupported OS, or failed probes = HOLD.
// The child executes fixed probe logic only; this is NOT an arbitrary code executor.
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
const run=promisify(execFile)
const image='node:22-alpine'
const probe=[
 "const fs=require('node:fs');const net=require('node:net');",
 "const checks={readOnlyRoot:false,writableTmp:false,networkDenied:false,nonRoot:process.getuid?.()!==0};",
 "try{fs.writeFileSync('/etc/obsidia-v58-probe','x')}catch(e){checks.readOnlyRoot=['EROFS','EACCES','EPERM'].includes(e.code)}",
 "try{fs.writeFileSync('/tmp/obsidia-v58-probe','x');fs.unlinkSync('/tmp/obsidia-v58-probe');checks.writableTmp=true}catch{}",
 "const s=net.connect({host:'1.1.1.1',port:53,timeout:500});",
 "s.on('connect',()=>{checks.networkDenied=false;s.destroy();finish()});",
 "s.on('error',()=>{checks.networkDenied=true;finish()});",
 "s.on('timeout',()=>{checks.networkDenied=true;s.destroy();finish()});",
 "let complete=false;function finish(){if(complete)return;complete=true;console.log(JSON.stringify({schema:'OBSIDIA_V58_CONTAINER_PROBE_V0',checks}));process.exit(Object.values(checks).every(Boolean)?0:3)}"
].join('')
const args=['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL',
 '--security-opt','no-new-privileges','--pids-limit','32','--memory','128m','--memory-swap','128m',
 '--cpus','0.5','--user','65534:65534','--tmpfs','/tmp:rw,nosuid,nodev,size=8m,mode=1777',
 '--entrypoint','node',image,'-e',probe]
export const V58_CONTAINER_IMAGE=image
export function v58IsolationDockerArguments(){return [...args]}
export async function probeV58Isolation({timeoutMs=12000,executor=run}={}){
 const hold=reason=>({schema:'OBSIDIA_V58_ISOLATION_ATTESTATION_V0',status:'HOLD',reason,
  verified:false,osIsolated:false,networkIsolated:false,filesystemIsolated:false,resourceLimitsApplied:false,
  executionAllowed:false,buildApproved:false,deploymentApproved:false})
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)return hold('INVALID_TIMEOUT')
 if(process.platform!=='linux'&&process.platform!=='win32'&&process.platform!=='darwin')return hold('UNSUPPORTED_HOST')
 try{
  const {stdout,stderr}=await executor('docker',args,{timeout:timeoutMs,maxBuffer:16384,windowsHide:true})
  const parsed=JSON.parse(stdout.trim())
  if(stderr?.trim()||parsed.schema!=='OBSIDIA_V58_CONTAINER_PROBE_V0'||
   !parsed.checks||Object.keys(parsed.checks).sort().join('|')!=='networkDenied|nonRoot|readOnlyRoot|writableTmp'||
   !Object.values(parsed.checks).every(v=>v===true))return hold('PROBE_OUTPUT_INVALID')
  return {schema:'OBSIDIA_V58_ISOLATION_ATTESTATION_V0',status:'PROBED_ISOLATION',verified:true,
   osIsolated:true,networkIsolated:true,filesystemIsolated:true,resourceLimitsApplied:true,
   image,checks:parsed.checks,scope:'LOCAL_PROBE_ONLY',executionAllowed:false,buildApproved:false,deploymentApproved:false,
   governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
 }catch{return hold('DOCKER_UNAVAILABLE_OR_PROBE_FAILED')}
}
