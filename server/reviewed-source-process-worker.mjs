// V57 subprocess worker for byte-identical reviewed V54 templates ONLY.
// A child process with timeout is not a security sandbox for untrusted code.
import {readFileSync} from 'node:fs'
import {Script,createContext} from 'node:vm'
import {createHash} from 'node:crypto'
const [kind,componentId,organizationId,expectedDigest]=process.argv.slice(2)
const ident=x=>typeof x==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,47}$/.test(x)
function template(){
 const name=JSON.stringify(componentId),org=JSON.stringify(organizationId)
 const body=kind==='PURE_TOOL'?'export function transform(value) { return String(value).trim().toUpperCase() }\n':
 kind==='PURE_WORKFLOW'?'export function runWorkflow(steps) { return Array.isArray(steps) ? steps.map(String).filter(Boolean) : [] }\n':
 kind==='PURE_AGENT_DESCRIPTOR'?`export function describeAgent() { return Object.freeze({ id: ${name}, organizationId: ${org}, mode: "DESCRIPTOR_ONLY", authority: "NONE" }) }\n`:null
 return body===null?null:'// Generated deterministic synthetic source; not authorized for deployment.\n'+body
}
const source=ident(componentId)&&ident(organizationId)?template():null
const digest=source?'SHA256:'+createHash('sha256').update(source).digest('hex'):null
if(!source||digest!==expectedDigest){process.stdout.write(JSON.stringify({status:'HOLD',reason:'UNRECOGNIZED_TEMPLATE'}));process.exitCode=1}
else{
 const cases=kind==='PURE_TOOL'?[[' hello ','HELLO'],['',''],[12,'12']]:
 kind==='PURE_WORKFLOW'?[[['a','','b'],['a','b']],[null,[]],[[1,2],['1','2']]]:
 [[null,{id:componentId,organizationId,mode:'DESCRIPTOR_ONLY',authority:'NONE'}]]
 const fn=kind==='PURE_TOOL'?'transform':kind==='PURE_WORKFLOW'?'runWorkflow':'describeAgent'
 const tests=[]
 try{
  for(const [index,[input,expected]] of cases.entries()){
   const context=createContext({input},{codeGeneration:{strings:false,wasm:false}})
   const code=source.replace(/^export /gm,'')+'\nJSON.stringify('+fn+'(input))'
   const actual=JSON.parse(new Script(code).runInContext(context,{timeout:100}))
   tests.push({name:'CASE_'+(index+1),pass:JSON.stringify(actual)===JSON.stringify(expected)})
  }
  process.stdout.write(JSON.stringify({status:tests.every(x=>x.pass)?'PROCESS_TESTED_REVIEWED':'HOLD',digest,tests}))
  if(tests.some(x=>!x.pass))process.exitCode=1
 }catch{process.stdout.write(JSON.stringify({status:'HOLD',reason:'CASE_FAILED',tests}));process.exitCode=1}
}
