// Opt-in Node lab CLI: performs queue lifecycle; no production Builder or deployment.
import {createSyntheticBuildQueue} from './synthetic-build-queue.mjs'
const [kind='AGENT_CONFIG',componentId='DemoAgent',organizationId='LAB']=process.argv.slice(2)
const queue=createSyntheticBuildQueue({limit:1})
const submitted=queue.submit({mode:'SYNTHETIC_ONLY',kind,componentId,organizationId})
const result=submitted.status==='ACCEPTED_SYNTHETIC'?await queue.run(submitted.id):submitted
console.log(JSON.stringify({submitted,result},null,2))
if(result?.phase!=='TESTED_SYNTHETIC')process.exitCode=1
