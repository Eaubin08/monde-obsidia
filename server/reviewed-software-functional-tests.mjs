// V56: functional tests of ONLY byte-for-byte trusted, deterministic V54 templates.
// Node VM is NOT a security sandbox. Never accept unknown or arbitrary source here.
import {Script,createContext} from 'node:vm'
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from './synthetic-software-generator.mjs'
import {createHash} from 'node:crypto'
const stable=s=>'SHA256:'+createHash('sha256').update(s).digest('hex')
export async function testReviewedSoftwareSource(artifact){
 const baseline=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind:artifact?.kind,componentId:artifact?.componentId,organizationId:artifact?.organizationId})
 if(baseline.status!=='PLANNED')return {status:'HOLD',reason:'UNSUPPORTED_SOURCE',tests:[],executionAllowed:false}
 const expected=generateSoftwareSource(baseline)
 const validation=await validateSoftwareSource(artifact)
 if(validation.status!=='SOURCE_VALIDATED_NOT_EXECUTED'||artifact.source!==expected.source||artifact.digest!==expected.digest)
  return {status:'HOLD',reason:'NOT_REVIEWED_SOURCE',tests:[],executionAllowed:false}
 const exportsCode=expected.source.replace(/^export /gm,'')
 const fn=artifact.kind==='PURE_TOOL'?'transform':artifact.kind==='PURE_WORKFLOW'?'runWorkflow':'describeAgent'
 const cases=artifact.kind==='PURE_TOOL'?
  [{input:' hello ',expected:'HELLO'},{input:'',expected:''},{input:12,expected:'12'}]:
  artifact.kind==='PURE_WORKFLOW'?
  [{input:['a','','b'],expected:['a','b']},{input:null,expected:[]},{input:[1,2],expected:['1','2']}]:
  [{input:null,expected:{id:artifact.componentId,organizationId:artifact.organizationId,mode:'DESCRIPTOR_ONLY',authority:'NONE'}}]
 const tests=[]
 try{
  for(const [index,tc] of cases.entries()){
   const context=createContext({__input:tc.input},{codeGeneration:{strings:false,wasm:false}})
   const code=exportsCode+'\nJSON.stringify('+fn+'(__input))'
   const actualJSON=new Script(code,{filename:'reviewed-template-test.mjs'}).runInContext(context,{timeout:100})
   const actual=JSON.parse(actualJSON)
   tests.push({name:'FUNCTIONAL_CASE_'+(index+1),pass:JSON.stringify(actual)===JSON.stringify(tc.expected)})
  }
 }catch{return {status:'HOLD',reason:'FUNCTIONAL_TEST_EXCEPTION',tests,executionAllowed:false}}
 const passed=tests.length===cases.length&&tests.every(x=>x.pass)
 return {schema:'OBSIDIA_REVIEWED_SOFTWARE_FUNCTIONAL_TEST_V0',status:passed?'FUNCTIONAL_TESTED_LAB':'HOLD',
  kind:artifact.kind,sourceDigest:stable(expected.source),tests,
  labExecution:true,osIsolated:false,buildApproved:false,deploymentApproved:false,executionAllowed:false,
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
}
