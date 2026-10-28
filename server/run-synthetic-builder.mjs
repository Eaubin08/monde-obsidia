// Explicit opt-in CLI for an isolated synthetic Builder demonstration.
import {executeSyntheticBuild} from './synthetic-builder-lab.mjs'
const [kind='AGENT_CONFIG',componentId='DemoAgent',organizationId='LAB']=process.argv.slice(2)
const result=await executeSyntheticBuild({mode:'SYNTHETIC_ONLY',kind,componentId,organizationId})
console.log(JSON.stringify(result,null,2))
if(result.status!=='TESTED_SYNTHETIC')process.exitCode=1
