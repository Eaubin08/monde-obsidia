import {createSyntheticSourceBuildPipeline} from './synthetic-source-build-pipeline.mjs'
const [root,kind='PURE_TOOL',componentId='Demo1',organizationId='LAB']=process.argv.slice(2)
if(!root){console.error('Explicit lab root required');process.exitCode=2}
else{
 const pipeline=createSyntheticSourceBuildPipeline(root)
 const built=await pipeline.build({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId,organizationId})
 const preview=built.jobId?await pipeline.inspect(built.jobId):null
 console.log(JSON.stringify({built,preview},null,2))
 if(preview?.status!=='VERIFIED_SOURCE_PREVIEW')process.exitCode=1
}
