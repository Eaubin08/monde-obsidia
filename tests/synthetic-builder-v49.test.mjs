import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticBuildQueue} from '../server/synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from '../server/synthetic-artifact-store.mjs'
import {createSyntheticJobJournal} from '../server/synthetic-job-journal.mjs'
import {createSyntheticComponentCatalog} from '../server/synthetic-component-catalog.mjs'
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v49-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
async function construct(){
 const q=createSyntheticBuildQueue()
 const accepted=q.submit({mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'Agent1',organizationId:'LAB'})
 return {id:accepted.id,job:await q.run(accepted.id)}
}
test('V49 job IDs remain different across fresh queue instances',async()=>{
 const a=await construct(),b=await construct()
 assert.match(a.id,/^LAB_JOB_00001_[0-9a-f]{32}$/)
 assert.notEqual(a.id,b.id)
})
test('V49 persistent manifest survives store recreation and appears in verified catalog',async()=>{
 await scoped(async root=>{
  const {id,job}=await construct()
  await createSyntheticArtifactStore(root).save(job)
  const catalog=createSyntheticComponentCatalog(root)
  const entries=await catalog.list()
  assert.equal(entries.length,1)
  assert.equal(entries[0].jobId,id)
  assert.equal(entries[0].status,'VERIFIED_STORED_SYNTHETIC')
  const preview=await catalog.preview(id)
  assert.equal(preview.status,'PREVIEW_ONLY')
  assert.equal(preview.component.deployable,false)
  assert.equal(preview.executionAllowed,false)
 })
})
test('V49 journal persists verified transitions and rejects invalid ordering',async()=>{
 await scoped(async root=>{
  const {id}=await construct(),j=createSyntheticJobJournal(root)
  await assert.rejects(j.append(id,'RUNNING'))
  for(const phase of ['QUEUED','RUNNING','TESTED_SYNTHETIC','STORED_SYNTHETIC'])await j.append(id,phase)
  assert.equal((await createSyntheticJobJournal(root).read(id)).status,'VERIFIED_LOCAL_JOURNAL')
  await assert.rejects(j.append(id,'RUNNING'))
 })
})
test('V49 journal flags edited historical event and catalog rejects corrupted artifact',async()=>{
 await scoped(async root=>{
  const {id,job}=await construct()
  const j=createSyntheticJobJournal(root)
  await j.append(id,'QUEUED')
  const event=join(root,'job-events',id,'0001.json')
  const parsed=JSON.parse(await readFile(event,'utf8'))
  parsed.phase='FAILED'
  await writeFile(event,JSON.stringify(parsed))
  assert.equal((await j.read(id)).status,'INVALID')
  await createSyntheticArtifactStore(root).save(job)
  const artifact=join(root,'artifacts',job.artifact.digest.slice(7)+'.json')
  await writeFile(artifact,'{}')
  assert.equal((await createSyntheticComponentCatalog(root).preview(id)).status,'DIGEST_MISMATCH')
 })
})
test('V49 catalog has no deployment path and rejects nonexistent ids',async()=>{
 await scoped(async root=>{
  const catalog=createSyntheticComponentCatalog(root)
  assert.deepEqual(await catalog.list(),[])
  assert.equal((await catalog.preview('LAB_JOB_99999_00000000000000000000000000000000')).status,'NOT_FOUND')
  assert.equal(typeof catalog.deploy,'undefined')
 })
})
