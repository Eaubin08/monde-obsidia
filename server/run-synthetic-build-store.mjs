// Explicit local laboratory CLI: build, store, verify, never deploy.
import {resolve} from 'node:path'
import {createSyntheticBuildQueue} from './synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from './synthetic-artifact-store.mjs'
const [kind='AGENT_CONFIG',componentId='DemoAgent',organizationId='LAB',labRoot]=process.argv.slice(2)
if(!labRoot){console.error('Explicit LAB root path required as fourth argument');process.exitCode=2}
else{
 const queue=createSyntheticBuildQueue({limit:1})
 const submitted=queue.submit({mode:'SYNTHETIC_ONLY',kind,componentId,organizationId})
 if(submitted.status!=='ACCEPTED_SYNTHETIC'){console.log(JSON.stringify(submitted,null,2));process.exitCode=1}
 else{
  const built=await queue.run(submitted.id)
  if(built.phase!=='TESTED_SYNTHETIC'){console.log(JSON.stringify(built,null,2));process.exitCode=1}
  else{
   const store=createSyntheticArtifactStore(resolve(labRoot))
   const saved=await store.save(built)
   const verified=await store.inspect(built.id)
   console.log(JSON.stringify({jobId:built.id,buildPhase:built.phase,saved,verification:verified.status,labRoot:store.root,
    buildApproved:false,deploymentApproved:false,executionAllowed:false},null,2))
   if(verified.status!=='VERIFIED_STORED_SYNTHETIC')process.exitCode=1
  }
 }
}
