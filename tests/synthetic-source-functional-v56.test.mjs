import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {planSoftwareComponent,generateSoftwareSource} from '../server/synthetic-software-generator.mjs'
import {testReviewedSoftwareSource} from '../server/reviewed-software-functional-tests.mjs'
import {createSyntheticSourceBuildPipeline} from '../server/synthetic-source-build-pipeline.mjs'
const input=(kind='PURE_TOOL')=>({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId:'Example1',organizationId:'LAB'})
async function scoped(fn){const root=await mkdtemp(join(tmpdir(),'obsidia-v56-'));try{return await fn(root)}finally{await rm(root,{recursive:true,force:true})}}
test('V56 exercises reviewed tool, workflow and descriptor behaviors in laboratory',async()=>{
 for(const kind of ['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR']){
  const artifact=generateSoftwareSource(planSoftwareComponent(input(kind)))
  const evidence=await testReviewedSoftwareSource(artifact)
  assert.equal(evidence.status,'FUNCTIONAL_TESTED_LAB')
  assert.equal(evidence.osIsolated,false)
  assert.equal(evidence.executionAllowed,false)
  assert.ok(evidence.tests.length>0&&evidence.tests.every(x=>x.pass))
 }
})
test('V56 rejects forged source even with recalculated digest, never executing it',async()=>{
 const artifact=generateSoftwareSource(planSoftwareComponent(input()))
 const source=artifact.source+'\nprocess.exit(1)\n'
 const digest='SHA256:'+createHash('sha256').update(source).digest('hex')
 const evidence=await testReviewedSoftwareSource({...artifact,source,digest})
 assert.equal(evidence.status,'HOLD')
 assert.equal(evidence.reason,'NOT_REVIEWED_SOURCE')
 assert.equal(evidence.tests.length,0)
})
test('V56 pipeline retains V55 status, stores functional evidence and verifies it on restart',async()=>scoped(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root)
 const build=await pipeline.build(input('PURE_WORKFLOW'))
 assert.equal(build.status,'STORED_SOURCE_NOT_EXECUTED')
 assert.equal(build.functionalStatus,'FUNCTIONAL_TESTED_LAB')
 const reopened=createSyntheticSourceBuildPipeline(root)
 const read=await reopened.inspect(build.jobId)
 assert.equal(read.status,'VERIFIED_SOURCE_PREVIEW')
 assert.equal(read.manifest.functional.status,'FUNCTIONAL_TESTED_LAB')
 assert.equal(read.manifest.functional.osIsolated,false)
}))
test('V56 modified functional evidence becomes HOLD even when source remains unchanged',async()=>scoped(async root=>{
 const pipeline=createSyntheticSourceBuildPipeline(root),built=await pipeline.build(input())
 assert.equal(built.status,'STORED_SOURCE_NOT_EXECUTED')
 const file=join(root,'source-builds',built.jobId+'.json')
 const record=JSON.parse(await readFile(file,'utf8'))
 record.manifest.functional.tests[0].pass=false
 await writeFile(file,JSON.stringify(record))
 assert.equal((await pipeline.inspect(built.jobId)).status,'FUNCTIONAL_EVIDENCE_FAILED')
}))
test('V56 invalid or unsupported source refuses all functional execution',async()=>{
 assert.equal((await testReviewedSoftwareSource(null)).status,'HOLD')
 const artifact=generateSoftwareSource(planSoftwareComponent(input()))
 assert.equal((await testReviewedSoftwareSource({...artifact,kind:'UNKNOWN'})).status,'HOLD')
})
