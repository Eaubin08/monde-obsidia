// V59 explicit local Docker functional test; no production integration.
import {planSoftwareComponent,generateSoftwareSource} from './synthetic-software-generator.mjs'
import {testReviewedSourceInDocker} from './v59-reviewed-docker-runner.mjs'
const [kind='PURE_TOOL',componentId='Demo1',organizationId='LAB']=process.argv.slice(2)
const plan=planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId,organizationId})
if(plan.status!=='PLANNED'){console.log(JSON.stringify(plan,null,2));process.exitCode=2}
else{
 const result=await testReviewedSourceInDocker(generateSoftwareSource(plan))
 console.log(JSON.stringify(result,null,2))
 if(result.status!=='CONTAINER_FUNCTIONAL_PASS')process.exitCode=1
}
