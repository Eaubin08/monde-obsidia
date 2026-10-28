// V54 deterministic source generator; never evaluates generated or externally supplied code.
// Source is produced from finite, reviewed templates and contains no imports or side effects.
import {createHash} from 'node:crypto'
import {Script} from 'node:vm'
const names=new Set(['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR'])
const ident=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,47}$/.test(x)
const digest=s=>'SHA256:'+createHash('sha256').update(s).digest('hex')
export function planSoftwareComponent(input){
 const accepted=input?.mode==='SYNTHETIC_SOURCE_ONLY'&&ident(input?.componentId)&&ident(input?.organizationId)&&names.has(input?.kind)
 return {schema:'OBSIDIA_SOFTWARE_SOURCE_PLAN_V0',status:accepted?'PLANNED':'REJECTED',kind:input?.kind??null,
  componentId:input?.componentId??null,organizationId:input?.organizationId??null,reason:accepted?null:'UNSUPPORTED_SOURCE_REQUEST',
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
}
export function generateSoftwareSource(plan){
 if(plan?.status!=='PLANNED'||!names.has(plan.kind)||!ident(plan.componentId)||!ident(plan.organizationId))throw Error('Invalid source plan')
 const name=JSON.stringify(plan.componentId),org=JSON.stringify(plan.organizationId)
 const body=plan.kind==='PURE_TOOL'?
  `export function transform(value) { return String(value).trim().toUpperCase() }\n`:
  plan.kind==='PURE_WORKFLOW'?
  `export function runWorkflow(steps) { return Array.isArray(steps) ? steps.map(String).filter(Boolean) : [] }\n`:
  `export function describeAgent() { return Object.freeze({ id: ${name}, organizationId: ${org}, mode: "DESCRIPTOR_ONLY", authority: "NONE" }) }\n`
 const source=`// Generated deterministic synthetic source; not authorized for deployment.\n${body}`
 return {schema:'OBSIDIA_SOFTWARE_SOURCE_ARTIFACT_V0',name:plan.componentId+'.mjs',componentId:plan.componentId,kind:plan.kind,organizationId:plan.organizationId,
  source,digest:digest(source),deployable:false,executableInWorld:false}
}
export async function validateSoftwareSource(artifact){
 if(!artifact||typeof artifact.source!=='string'||artifact.source.length>4096||artifact.deployable!==false||
 !names.has(artifact.kind)||!ident(artifact.organizationId)||!ident(artifact.componentId)||!/^SHA256:[0-9a-f]{64}$/.test(artifact.digest))
 return {status:'REJECTED',tests:[]}
 let syntax=false
 try{new Script(artifact.source.replace(/^export /gm,''),{filename:'synthetic-source-check.mjs'});syntax=true}catch{}
 const tests=[{name:'DIGEST',pass:digest(artifact.source)===artifact.digest},
  {name:'SYNTAX_NO_EXECUTION',pass:syntax},
  {name:'REVIEWED_TEMPLATE',pass:artifact.source===generateSoftwareSource(planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind:artifact.kind,componentId:artifact.componentId,organizationId:artifact.organizationId})).source},
  {name:'NO_MODULE_IMPORT',pass:!/(?:^|\n)\s*import\b/.test(artifact.source)},
  {name:'NON_DEPLOYABLE',pass:artifact.deployable===false&&artifact.executableInWorld===false}]
 return {status:tests.every(t=>t.pass)?'SOURCE_VALIDATED_NOT_EXECUTED':'HOLD',tests}
}
