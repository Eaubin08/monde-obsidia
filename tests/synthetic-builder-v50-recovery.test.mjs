import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticBuildQueue} from '../server/synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from '../server/synthetic-artifact-store.mjs'
import {createSyntheticJobJournal} from '../server/synthetic-job-journal.mjs'
import {createSyntheticRecoveryInspector} from '../server/synthetic-build-recovery.mjs'
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v50-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
function request(q){return q.submit({mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'Agent1',organizationId:'LAB'}).id}
test('V50 interrupted running job is classified HOLD without re-execution',async()=>scoped(async root=>{
 const q=createSyntheticBuildQueue(),id=request(q),j=createSyntheticJobJournal(root)
 await j.append(id,'QUEUED');await j.append(id,'RUNNING')
 const result=await createSyntheticRecoveryInspector(root).inspect(id)
 assert.equal(result.status,'INTERRUPTED_UNRESUMABLE')
 assert.equal(result.action,'HOLD');assert.equal(q.inspect(id).phase,'QUEUED')
}))
test('V50 stored artifact and complete journal reconcile read-only',async()=>scoped(async root=>{
 const q=createSyntheticBuildQueue(),id=request(q),j=createSyntheticJobJournal(root)
 await j.append(id,'QUEUED');await j.append(id,'RUNNING')
 const job=await q.run(id)
 await j.append(id,'TESTED_SYNTHETIC')
 await createSyntheticArtifactStore(root).save(job)
 assert.equal((await createSyntheticRecoveryInspector(root).inspect(id)).status,'STORE_EVENT_MISSING')
 await j.append(id,'STORED_SYNTHETIC',{digest:job.artifact.digest})
 const inspector=createSyntheticRecoveryInspector(root)
 assert.equal((await inspector.inspect(id)).status,'CONSISTENT_STORED')
 assert.equal((await inspector.inventory()).entries.length,1)
}))
test('V50 inventory bound never silently claims completeness',async()=>scoped(async root=>{
 const q=createSyntheticBuildQueue(),j=createSyntheticJobJournal(root)
 for(let i=0;i<3;i++){const id=request(q);await j.append(id,'QUEUED')}
 const inventory=await createSyntheticRecoveryInspector(root).inventory({limit:2})
 assert.equal(inventory.entries.length,2)
 assert.equal(inventory.truncated,true)
}))
test('V50 missing and corrupted journal never resumes or approves',async()=>scoped(async root=>{
 const result=await createSyntheticRecoveryInspector(root).inspect('LAB_JOB_00001_00000000000000000000000000000000')
 assert.equal(result.status,'MISSING_JOURNAL')
 assert.equal(result.executionAllowed,false)
 assert.equal((await createSyntheticRecoveryInspector(root).inspect('../escape')).status,'INVALID_ID')
}))
