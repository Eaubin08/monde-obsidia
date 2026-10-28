import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createSyntheticSourceBuildPipeline} from '../server/synthetic-source-build-pipeline.mjs'
test('V57 source pipeline stores verified child-process evidence and detects tampering',async()=>{
 const root=await mkdtemp(join(tmpdir(),'obsidia-v57-'))
 try{
  const pipeline=createSyntheticSourceBuildPipeline(root)
  const built=await pipeline.build({mode:'SYNTHETIC_SOURCE_ONLY',kind:'PURE_TOOL',componentId:'Demo1',organizationId:'LAB'})
  assert.equal(built.status,'STORED_SOURCE_NOT_EXECUTED')
  assert.equal(built.processTests.length,3)
  let preview=await pipeline.inspect(built.jobId)
  assert.equal(preview.status,'VERIFIED_SOURCE_PREVIEW')
  assert.equal(preview.manifest.processEvidence.status,'PROCESS_TESTED_REVIEWED')
  assert.equal(preview.manifest.processEvidence.osSandbox,false)
  const path=join(root,'source-builds',built.jobId+'.json')
  const saved=JSON.parse(await readFile(path,'utf8'))
  saved.manifest.processEvidence.tests[0].pass=false
  await writeFile(path,JSON.stringify(saved))
  preview=await pipeline.inspect(built.jobId)
  assert.equal(preview.status,'PROCESS_EVIDENCE_FAILED')
 }finally{await rm(root,{recursive:true,force:true})}
})
