import test from 'node:test'
import assert from 'node:assert/strict'
import {projectC55LocalDiagnostic} from '../server/universal-c55-diagnostic.mjs'
const source={sourcePresent:true,status:'SOURCE_GIT_OBSERVED_NOT_RUNTIME_VERIFIED',gitHead:'a'.repeat(40),gitBranch:'branch'}
test('C5.5 never claims runtime authority when source and records exist',()=>{
 const d=projectC55LocalDiagnostic(source,{recordCount:4})
 assert.equal(d.status,'LOCAL_DECISIONS_UNATTRIBUTED')
 assert.equal(d.observedDecisions,4)
 assert.equal(d.organizationVerified,false)
 assert.equal(d.receiptIntegrityVerified,false)
 assert.equal(d.runtimeExecutionVerified,false)
 assert.equal(d.executionAllowed,false)
})
test('C5.5 reports missing evidence without declaring success',()=>{
 assert.equal(projectC55LocalDiagnostic(source,{recordCount:0}).status,'SOURCE_FOUND_NO_LOCAL_DECISIONS')
 assert.equal(projectC55LocalDiagnostic(null,{recordCount:9}).status,'SOURCE_NOT_READY')
})
test('C5.5 route is GET-only',async()=>{
 const {readFileSync}=await import('node:fs')
 const s=readFileSync(new URL('../server/local-bridge.mjs',import.meta.url),'utf8')
 assert.match(s,/req\.method==='GET'&&url\.pathname==='\/universal-c55-diagnostic'/)
})
