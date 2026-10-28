import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticLabLock} from '../server/synthetic-lab-lock.mjs'
import {createSyntheticBuilderService} from '../server/synthetic-builder-service.mjs'
import {createWorldBuilderCatalogRead} from '../server/world-builder-catalog-read.mjs'
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v52-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
const input=(organizationId='LAB')=>({mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'Agent1',organizationId})
test('V52 cooperative lock prevents second writer and releases only once',async()=>scoped(async root=>{
 const a=createSyntheticLabLock(root),b=createSyntheticLabLock(root)
 const one=await a.acquire(),two=await b.acquire()
 assert.equal(one.status,'ACQUIRED')
 assert.equal(two.status,'LOCKED')
 assert.equal(await one.release(),true)
 assert.equal(await one.release(),false)
 const three=await b.acquire()
 assert.equal(three.status,'ACQUIRED')
 await three.release()
}))
test('V52 service cannot build while another process holds lab lock',async()=>scoped(async root=>{
 const service=createSyntheticBuilderService({root})
 const submit=await service.submit(input())
 const lease=await createSyntheticLabLock(root).acquire()
 try{
  const result=await service.run(submit.id)
  assert.equal(result.reason,'LAB_LOCKED')
  assert.equal((await service.inspect(submit.id)).memory.phase,'QUEUED')
 }finally{await lease.release()}
 assert.equal((await service.run(submit.id)).status,'VERIFIED_LAB_BUILD')
}))
test('V52 World catalog exposes only verified components of requested organization',async()=>scoped(async root=>{
 const service=createSyntheticBuilderService({root})
 for(const organizationId of ['LAB','OTHER']){
  const job=await service.submit(input(organizationId))
  assert.equal((await service.run(job.id)).status,'VERIFIED_LAB_BUILD')
 }
 const reader=createWorldBuilderCatalogRead(root)
 const lab=await reader.list({organizationId:'LAB'})
 assert.equal(lab.entries.length,1)
 assert.equal(lab.entries[0].status,'PREVIEW_ONLY')
 assert.equal(lab.entries[0].component.organizationId,'LAB')
 assert.equal(lab.entries[0].executionAllowed,false)
 const other=await reader.list({organizationId:'OTHER'})
 assert.equal(other.entries.length,1)
 assert.equal(other.entries[0].component.organizationId,'OTHER')
}))
test('V52 requires explicit organization and bounded inventory size',async()=>scoped(async root=>{
 const reader=createWorldBuilderCatalogRead(root)
 assert.equal((await reader.list({})).status,'HOLD')
 assert.equal((await reader.list({organizationId:'LAB',limit:101})).status,'HOLD')
}))
