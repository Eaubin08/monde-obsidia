// V54 explicit source-generation demo; outputs code but never imports or evaluates it.
import {planSoftwareComponent,generateSoftwareSource,validateSoftwareSource} from './synthetic-software-generator.mjs'
const [kind='PURE_TOOL',componentId='Demo1',organizationId='LAB']=process.argv.slice(2)
const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId,organizationId})
if(plan.status!=='PLANNED'){console.log(JSON.stringify(plan,null,2));process.exitCode=1}
else{
 const artifact=generateSoftwareSource(plan),validation=await validateSoftwareSource(artifact)
 console.log(JSON.stringify({plan,artifact,validation,buildApproved:false,deploymentApproved:false,executionAllowed:false},null,2))
 if(validation.status!=='SOURCE_VALIDATED_NOT_EXECUTED')process.exitCode=1
}
