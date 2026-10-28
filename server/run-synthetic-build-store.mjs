// Explicit local laboratory CLI: build, store, verify, never deploy.
import {resolve} from 'node:path'
import {createSyntheticBuildQueue} from './synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from './synthetic-artifact-store.mjs'
import {createSyntheticJobJournal} from './synthetic-job-journal.mjs'
const [kind='AGENT_CONFIG',componentId='DemoAgent',organizationId='LAB',labRoot]=process.argv.slice(2)
if(!labRoot){console.error('Explicit LAB root path required as fourth argument');process.exitCode=2}
else{
 const queue=createSyntheticBuildQueue({limit:1})
 const submitted=queue.submit({mode:'SYNTHETIC_ONLY',kind,componentId,organizationId})
 if(submitted.status!=='ACCEPTED_SYNTHETIC'){console.log(JSON.stringify(submitted,null,2));process.exitCode=1}
 else{
  const journal=createSyntheticJobJournal(resolve(labRoot))
  await journal.append(submitted.id,'QUEUED')
  await journal.append(submitted.id,'RUNNING')
  const built=await queue.run(submitted.id)
  await journal.append(submitted.id,built.phase==='TESTED_SYNTHETIC'?'TESTED_SYNTHETIC':'FAILED')
  if(built.phase!=='TESTED_SYNTHETIC'){console.log(JSON.stringify(built,null,2));process.exitCode=1}
  else{
   const store=createSyntheticArtifactStore(resolve(labRoot))
   const saved=await store.save(built)
   await journal.append(submitted.id,'STORED_SYNTHETIC',{digest:saved.digest})
   const verified=await store.inspect(built.id)
   console.log(JSON.stringify({jobId:built.id,buildPhase:built.phase,saved,verification:verified.status,journal:(await journal.read(built.id)).status,labRoot:store.root,
    buildApproved:false,deploymentApproved:false,executionAllowed:false},null,2))
   if(verified.status!=='VERIFIED_STORED_SYNTHETIC')process.exitCode=1
  }
 }
}
