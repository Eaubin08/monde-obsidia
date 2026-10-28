import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticSourceBuildPipeline} from '../server/synthetic-source-build-pipeline.mjs'
async function withLab(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v55-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
const input=(kind='PURE_TOOL')=>({mode:'SYNTHETIC_SOURCE_ONLY',organizationId:'LAB',componentId:'Demo1',kind})
test('V55 generates, stores, reopens and statically revalidates source after restart',async()=>withLab(async root=>{
 const initial=createSyntheticSourceBuildPipeline(root)
 const created=await initial.build(input())
 assert.equal(created.status,'STORED_SOURCE_NOT_EXECUTED')
 assert.match(created.jobId,/^SOURCE_JOB_[a-f0-9]{32}$/)
 const second=createSyntheticSourceBuildPipeline(root)
 const preview=await second.inspect(created.jobId)
 assert.equal(preview.status,'VERIFIED_SOURCE_PREVIEW')
 assert.match(preview.source,/export function transform/)
 assert.equal(preview.executionAllowed,false)
 assert.equal((await second.list()).entries.length,1)
}))
test('V55 supports the three reviewed source kinds and never executes them',async()=>withLab(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root)
 for(const kind of ['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR']){
  const created=await pipeline.build(input(kind))
  assert.equal(created.status,'STORED_SOURCE_NOT_EXECUTED')
  assert.equal((await pipeline.inspect(created.jobId)).manifest.kind,kind)
 }
 assert.equal((await pipeline.list()).entries.length,3)
}))
test('V55 rejects production and arbitrary module types before persistence',async()=>withLab(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root)
 for(const req of [{...input(),mode:'PRODUCTION'},{...input(),kind:'ARBITRARY_JS'},{...input(),componentId:'../escape'}]){
  assert.equal((await pipeline.build(req)).status,'REJECTED')
 }
 assert.deepEqual((await pipeline.list()).entries,[])
}))
test('V55 rejects code tampering even with no changed approval flags',async()=>withLab(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root),created=await pipeline.build(input())
 const path=join(root,'source-builds',created.jobId+'.json')
 const saved=JSON.parse(await readFile(path,'utf8'))
 saved.artifact.source+='\nconsole.log("malicious")\n'
 await writeFile(path,JSON.stringify(saved))
 assert.equal((await pipeline.inspect(created.jobId)).status,'SOURCE_INTEGRITY_FAILED')
}))
test('V55 rejects forged approval, respects enumeration bound and does not deploy',async()=>withLab(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root)
 const first=await pipeline.build(input()),second=await pipeline.build(input('PURE_WORKFLOW'))
 const path=join(root,'source-builds',first.jobId+'.json')
 const saved=JSON.parse(await readFile(path,'utf8'))
 saved.manifest.deploymentApproved=true
 await writeFile(path,JSON.stringify(saved))
 assert.equal((await pipeline.inspect(first.jobId)).status,'INVALID_MANIFEST')
 const listing=await pipeline.list({limit:1})
 assert.equal(listing.entries.length,1)
 assert.equal(listing.truncated,true)
 assert.equal(typeof pipeline.deploy,'undefined')
 assert.equal((await pipeline.inspect('../unsafe')).status,'INVALID_ID')
 assert.match(second.jobId,/^SOURCE_JOB_/)
}))
