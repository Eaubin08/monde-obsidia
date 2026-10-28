import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticBuilderService} from '../server/synthetic-builder-service.mjs'
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v51-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
const request={mode:'SYNTHETIC_ONLY',kind:'AGENT_CONFIG',componentId:'DemoAgent',organizationId:'LAB'}
test('V51 unified service builds, tests, stores and verifies component end to end',async()=>scoped(async root=>{
 const service=createSyntheticBuilderService({root})
 const accepted=await service.submit(request)
 assert.equal(accepted.status,'ACCEPTED_SYNTHETIC')
 const result=await service.run(accepted.id)
 assert.equal(result.status,'VERIFIED_LAB_BUILD')
 assert.equal(result.testCount,6)
 assert.equal(result.executionAllowed,false)
 const inspected=await service.inspect(accepted.id)
 assert.equal(inspected.recovery.status,'CONSISTENT_STORED')
 assert.equal(inspected.preview.status,'PREVIEW_ONLY')
 assert.equal((await service.list()).catalog.length,1)
}))
test('V51 service restart reads stored catalog but never resumes queue automatically',async()=>scoped(async root=>{
 const first=createSyntheticBuilderService({root}),accepted=await first.submit(request)
 assert.equal((await first.run(accepted.id)).status,'VERIFIED_LAB_BUILD')
 const second=createSyntheticBuilderService({root})
 assert.equal((await second.inspect(accepted.id)).recovery.status,'CONSISTENT_STORED')
 assert.equal((await second.run(accepted.id)).status,'HOLD')
 assert.equal((await second.list()).catalog.length,1)
}))
test('V51 rejects production and unknown jobs without side effects',async()=>scoped(async root=>{
 const service=createSyntheticBuilderService({root})
 assert.equal((await service.submit({...request,mode:'PRODUCTION'})).status,'REJECTED')
 assert.equal((await service.run('unknown')).status,'HOLD')
 assert.equal((await service.list()).catalog.length,0)
}))
test('V51 service maintains bounded capacity and no deploy entrypoint',async()=>scoped(async root=>{
 const service=createSyntheticBuilderService({root,limit:1})
 const a=await service.submit(request)
 assert.equal(a.status,'ACCEPTED_SYNTHETIC')
 assert.equal((await service.submit(request)).reason,'QUEUE_CAPACITY')
 assert.equal(typeof service.deploy,'undefined')
 assert.equal(typeof service.activate,'undefined')
}))
