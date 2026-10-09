import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {execFileSync} from 'node:child_process'
import {c54SourceReadiness} from '../server/universal-c54-readiness.mjs'
test('C5.4 missing source is non-authoritative and empty',()=>{
 const r=c54SourceReadiness({root:join(tmpdir(),'absent-c54-source')})
 assert.equal(r.sourcePresent,false)
 assert.equal(r.executionAllowed,false)
 assert.equal(r.gitHead,null)
})
test('C5.4 only observes Git revision metadata',()=>{
 const d=mkdtempSync(join(tmpdir(),'c54-source-'))
 try{
  execFileSync('git',['init',d],{stdio:'ignore'})
  execFileSync('git',['-C',d,'-c','user.name=fixture','-c','user.email=fixture@example.invalid','commit','--allow-empty','-m','fixture'],{stdio:'ignore'})
  const r=c54SourceReadiness({root:d})
  assert.equal(r.sourcePresent,true)
  assert.match(r.gitHead,/^[a-f0-9]{40,64}$/)
  assert.equal(r.status,'SOURCE_GIT_OBSERVED_NOT_RUNTIME_VERIFIED')
  assert.equal(r.executionAllowed,false)
  assert.equal(r.decisionsObserved,null)
 }finally{rmSync(d,{recursive:true,force:true})}
})
