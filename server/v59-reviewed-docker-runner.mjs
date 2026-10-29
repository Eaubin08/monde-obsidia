// V59: Docker-only functional verification for exact reviewed V54 source.
// Never run arbitrary/LLM-generated code. No host mounts, network or production authority.
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from './synthetic-software-generator.mjs'
import {probeV58Isolation} from './v58-docker-isolation-probe.mjs'
const execute=promisify(execFile)
const image='node:22-alpine'
const expectedCases={PURE_TOOL:3,PURE_WORKFLOW:3,PURE_AGENT_DESCRIPTOR:1}
export function v59DockerArguments(script){
 if(typeof script!=='string'||script.length>12000)throw Error('Invalid reviewed script')
 return ['run','--rm','--pull','never','--network','none','--read-only','--cap-drop','ALL',
 '--security-opt','no-new-privileges','--pids-limit','32','--memory','128m','--memory-swap','128m',
 '--cpus','0.5','--user','65534:65534','--tmpfs','/tmp:rw,nosuid,nodev,size=8m,mode=1777',
 '--entrypoint','node',image,'-e',script]
}
function reviewedScript(artifact){
 const body=artifact.source.replace(/^export /gm,'')
 const fn=artifact.kind==='PURE_TOOL'?'transform':artifact.kind==='PURE_WORKFLOW'?'runWorkflow':'describeAgent'
 const cases=artifact.kind==='PURE_TOOL'?[[' hello ','HELLO'],['',''],[12,'12']]:
 artifact.kind==='PURE_WORKFLOW'?[[['a','','b'],['a','b']],[null,[]],[[1,2],['1','2']]]:
 [[null,{id:artifact.componentId,organizationId:artifact.organizationId,mode:'DESCRIPTOR_ONLY',authority:'NONE'}]]
 return body+'\n'+
 'const cases='+JSON.stringify(cases)+';\n'+
 'const name='+JSON.stringify(fn)+';\n'+
 'const fn=({transform:typeof transform==="function"?transform:null,runWorkflow:typeof runWorkflow==="function"?runWorkflow:null,describeAgent:typeof describeAgent==="function"?describeAgent:null})[name];\n'+
 'const tests=cases.map(([input,expected],i)=>({name:"CASE_"+(i+1),pass:JSON.stringify(fn(input))===JSON.stringify(expected)}));\n'+
 'console.log(JSON.stringify({schema:"OBSIDIA_V59_DOCKER_CASES_V0",tests}));\n'+
 'if(tests.some(t=>!t.pass))process.exitCode=3;\n'
}
export async function testReviewedSourceInDocker(artifact,{executor=execute,isolationProbe=probeV58Isolation,timeoutMs=12000}={}){
 const hold=reason=>({schema:'OBSIDIA_V59_CONTAINER_EVIDENCE_V0',status:'HOLD',reason,tests:[],
  containerTested:false,buildApproved:false,deploymentApproved:false,executionAllowed:false})
 if(!Number.isSafeInteger(timeoutMs)||timeoutMs<1000||timeoutMs>30000)return hold('INVALID_TIMEOUT')
 const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind:artifact?.kind,componentId:artifact?.componentId,organizationId:artifact?.organizationId})
 if(plan.status!=='PLANNED')return hold('INVALID_PLAN')
 const canonical=generateSoftwareSource(plan)
 const checked=await validateSoftwareSource(artifact)
 if(checked.status!=='SOURCE_VALIDATED_NOT_EXECUTED'||artifact.source!==canonical.source||artifact.digest!==canonical.digest)
  return hold('UNREVIEWED_SOURCE')
 let probe
 try{probe=await isolationProbe()}catch{return hold('ISOLATION_PROBE_FAILED')}
 if(probe?.status!=='PROBED_ISOLATION'||probe.verified!==true||probe.osIsolated!==true||
 probe.networkIsolated!==true||probe.filesystemIsolated!==true)return hold('ISOLATION_NOT_VERIFIED')
 try{
  const {stdout,stderr}=await executor('docker',v59DockerArguments(reviewedScript(canonical)),{timeout:timeoutMs,maxBuffer:16384,windowsHide:true})
  if(stderr?.trim())return hold('CONTAINER_STDERR')
  const parsed=JSON.parse(stdout.trim())
  if(parsed.schema!=='OBSIDIA_V59_DOCKER_CASES_V0'||!Array.isArray(parsed.tests)||
   parsed.tests.length!==expectedCases[artifact.kind]||
   !parsed.tests.every((t,i)=>t.name==='CASE_'+(i+1)&&t.pass===true))return hold('INVALID_TEST_RESULTS')
  return {schema:'OBSIDIA_V59_CONTAINER_EVIDENCE_V0',status:'CONTAINER_FUNCTIONAL_PASS',
   sourceDigest:canonical.digest,kind:artifact.kind,image,tests:parsed.tests,containerTested:true,
   isolationProbe:'V58_PROBED_ISOLATION',resourceLimitsConfigured:true,resourceLimitsMeasured:false,
   buildApproved:false,deploymentApproved:false,executionAllowed:false,
   governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
 }catch{return hold('DOCKER_EXECUTION_FAILED')}
}
