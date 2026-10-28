import {createSyntheticBuilderService} from './synthetic-builder-service.mjs'
const [root,kind='AGENT_CONFIG',componentId='DemoAgent',organizationId='LAB']=process.argv.slice(2)
if(!root){console.error('Explicit lab root required');process.exitCode=2}
else{
 const service=createSyntheticBuilderService({root})
 const submitted=await service.submit({mode:'SYNTHETIC_ONLY',kind,componentId,organizationId})
 const built=submitted.status==='ACCEPTED_SYNTHETIC'?await service.run(submitted.id):submitted
 const inspected=submitted.id?await service.inspect(submitted.id):null
 console.log(JSON.stringify({submitted,built,preview:inspected?.preview??null},null,2))
 if(built.status!=='VERIFIED_LAB_BUILD')process.exitCode=1
}
