// Executable synthetic Builder lab. Deterministic templates, not arbitrary generated code execution.
// This module must never be wired to production deployment or governance approval.
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createHash} from 'node:crypto'
import {runInNewContext} from 'node:vm'
const allowed=new Set(['AGENT_CONFIG','TOOL_CONFIG','WORKFLOW_CONFIG'])
const slug=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(x)
export function planSyntheticBuild(input){
 const accepted=input&&input.mode==='SYNTHETIC_ONLY'&&slug(input.organizationId)&&slug(input.componentId)&&allowed.has(input.kind)
 return {schema:'OBSIDIA_SYNTHETIC_BUILD_PLAN_V0',kind:input?.kind??null,componentId:input?.componentId??null,
  organizationId:input?.organizationId??null,mode:'SYNTHETIC_ONLY',
  status:accepted?'PLANNED':'REJECTED',reason:accepted?null:'INVALID_OR_NON_SYNTHETIC_INPUT',
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'},executionAuthority:'SANDBOX_TEMPLATE_ONLY'}
}
export function renderSyntheticComponent(plan){
 if(plan.status!=='PLANNED')throw Error('Plan rejected')
 const capability=plan.kind==='AGENT_CONFIG'?'OBSERVE':plan.kind==='TOOL_CONFIG'?'READ':'SEQUENCE'
 const artifact={schema:'OBSIDIA_SYNTHETIC_COMPONENT_V0',synthetic:true,
  organizationId:plan.organizationId,id:plan.componentId,kind:plan.kind,
  capabilities:[capability],networkAccess:false,filesystemAccess:false,deployable:false,
  decisionAuthority:'NONE'}
 return JSON.stringify(artifact,null,2)+'\n'
}
export async function executeSyntheticBuild(input){
 const plan=planSyntheticBuild(input)
 if(plan.status!=='PLANNED')return {schema:'OBSIDIA_SYNTHETIC_BUILD_RESULT_V0',plan,status:'REJECTED',tests:[],artifact:null,workspace:'NOT_CREATED',deploymentApproved:false}
 const workspace=await mkdtemp(join(tmpdir(),'obsidia-builder-lab-'))
 try{
  const filename=join(workspace,'component.json'),contents=renderSyntheticComponent(plan)
  await writeFile(filename,contents,{flag:'wx'})
  const recovered=await readFile(filename,'utf8'),parsed=JSON.parse(recovered)
  const tests=[
   {name:'SCHEMA',pass:parsed.schema==='OBSIDIA_SYNTHETIC_COMPONENT_V0'},
   {name:'IDENTITY',pass:parsed.organizationId===plan.organizationId&&parsed.id===plan.componentId},
   {name:'KIND',pass:parsed.kind===plan.kind},
   {name:'NON_SOVEREIGN',pass:parsed.synthetic===true&&parsed.decisionAuthority==='NONE'},
   {name:'NO_SIDE_EFFECTS',pass:parsed.networkAccess===false&&parsed.filesystemAccess===false&&parsed.deployable===false},
   {name:'REPRODUCIBLE',pass:renderSyntheticComponent(plan)===recovered}
  ]
  const digest='SHA256:'+createHash('sha256').update(recovered).digest('hex')
  return {schema:'OBSIDIA_SYNTHETIC_BUILD_RESULT_V0',plan,status:tests.every(t=>t.pass)?'TESTED_SYNTHETIC':'TEST_FAILED',
   tests,artifact:{name:'component.json',content:recovered,digest},workspace:'REMOVED_AFTER_TEST',deploymentApproved:false,
   buildApproved:false,executionAllowed:false,governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
 }finally{await rm(workspace,{recursive:true,force:true})}
}
