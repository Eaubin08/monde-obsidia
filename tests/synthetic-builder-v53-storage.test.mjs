import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,writeFile,mkdir} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticBuildQueue} from '../server/synthetic-build-queue.mjs'
import {createSyntheticArtifactStore} from '../server/synthetic-artifact-store.mjs'
import {createSyntheticStoragePolicy} from '../server/synthetic-storage-policy.mjs'
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v53-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
async function job(){const q=createSyntheticBuildQueue();const s=q.submit({mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'Agent1',organizationId:'LAB'});return q.run(s.id)}
test('V53 ordinary synthetic build remains storable with bounded policy',async()=>scoped(async root=>{
 const store=createSyntheticArtifactStore(root),built=await job()
 assert.equal((await store.save(built)).status,'STORED_SYNTHETIC')
 assert.equal((await store.inspect(built.id)).status,'VERIFIED_STORED_SYNTHETIC')
 assert.equal((await createSyntheticStoragePolicy(root).scan()).status,'WITHIN_QUOTA')
}))
test('V53 insufficient per-artifact quota rejects before storage',async()=>scoped(async root=>{
 const built=await job()
 const store=createSyntheticArtifactStore(root,{maxArtifactBytes:10,maxTotalBytes:2048})
 await assert.rejects(store.save(built),/LAB_STORAGE_ARTIFACT_TOO_LARGE/)
 assert.deepEqual(await store.list(),[])
}))
test('V53 manifest count bound prevents additional stored builds',async()=>scoped(async root=>{
 const store=createSyntheticArtifactStore(root,{maxManifestCount:1}),a=await job(),b=await job()
 await store.save(a)
 await assert.rejects(store.save(b),/LAB_STORAGE_MANIFEST_LIMIT/)
 assert.deepEqual(await store.list(),[a.id])
}))
test('V53 unexpected filesystem entries are rejected, not silently omitted',async()=>scoped(async root=>{
 await mkdir(join(root,'artifacts'),{recursive:true})
 await mkdir(join(root,'artifacts','unexpected'))
 await assert.rejects(createSyntheticStoragePolicy(root).scan(),/Unsafe storage entry/)
}))
test('V53 rejects invalid storage limits and malformed size estimates',async()=>scoped(async root=>{
 assert.throws(()=>createSyntheticStoragePolicy(root,{maxArtifactBytes:100,maxTotalBytes:50}))
 assert.equal((await createSyntheticStoragePolicy(root).admit({artifactBytes:-1,manifestBytes:2})).status,'REJECTED')
}))
