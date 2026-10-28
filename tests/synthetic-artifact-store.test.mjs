import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticBuildQueue} from '../server/synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from '../server/synthetic-artifact-store.mjs'
async function withStore(fn){
 const root=await mkdtemp(join(tmpdir(),'obsidia-v48-test-'))
 try{return await fn(createSyntheticArtifactStore(root),root)}finally{await rm(root,{recursive:true,force:true})}
}
async function built(){
 const queue=createSyntheticBuildQueue()
 const sub=queue.submit({mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'Agent1',organizationId:'LAB'})
 return queue.run(sub.id)
}
test('V48 stores a real tested artifact and retrieves it after a new store instance',async()=>{
 await withStore(async(store,root)=>{
  const job=await built()
  const saved=await store.save(job)
  assert.equal(saved.status,'STORED_SYNTHETIC')
  const recovered=await createSyntheticArtifactStore(root).inspect(job.id)
  assert.equal(recovered.status,'VERIFIED_STORED_SYNTHETIC')
  assert.equal(recovered.artifact.digest,job.artifact.digest)
  assert.equal(recovered.manifest.buildApproved,false)
  assert.deepEqual(await store.list(),[job.id])
 })
})
test('V48 rejects untested or forged jobs before persistence',async()=>{
 await withStore(async(store)=>{
  await assert.rejects(store.save({id:'LAB_JOB_00001',phase:'QUEUED'}))
  const job=await built()
  await assert.rejects(store.save({...job,artifact:{...job.artifact,content:'{}'}}))
  assert.deepEqual(await store.list(),[])
 })
})
test('V48 detects corrupted artifact at readback and refuses second manifest for same job id',async()=>{
 await withStore(async(store,root)=>{
  const job=await built()
  await store.save(job)
  const filename=join(root,'artifacts',job.artifact.digest.slice(7)+'.json')
  await writeFile(filename,'{"tampered":true}\n')
  assert.equal((await store.inspect(job.id)).status,'DIGEST_MISMATCH')
  await assert.rejects(store.save(job))
 })
})
test('V48 detects manifest tampering and invalid identifiers',async()=>{
 await withStore(async(store,root)=>{
  const job=await built()
  await store.save(job)
  const path=join(root,'manifests',job.id+'.json')
  const record=JSON.parse(await readFile(path,'utf8'))
  record.executionAllowed=true
  await writeFile(path,JSON.stringify(record))
  assert.equal((await store.inspect(job.id)).status,'INVALID_MANIFEST')
  assert.equal((await store.inspect('../escape')).status,'INVALID_ID')
 })
})
test('V48 store requires explicit root, never writes to implicit production location',()=>{
 assert.throws(()=>createSyntheticArtifactStore(''))
})
