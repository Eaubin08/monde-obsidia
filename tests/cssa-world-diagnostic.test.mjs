import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const diagnostic=readFileSync(new URL('../src/CSSAWorldSnapshotDiagnostic.tsx',import.meta.url),'utf8')
const dossiers=readFileSync(new URL('../src/CSSADossiersPage.tsx',import.meta.url),'utf8')
test('V26 reads through shared controller and consumer projection, not direct competing fetch',()=>{
 assert.match(diagnostic,/createCssaWorldSnapshotController\(\)/)
 assert.match(diagnostic,/controller\.subscribe\(setState\)/)
 assert.match(diagnostic,/projectWorldConsumer\(state,/)
 assert.doesNotMatch(diagnostic,/fetch\(/)
})
test('V26 never starts read implicitly or changes the canonical dossiers workflow',()=>{
 assert.match(diagnostic,/onClick=\{\(\)=>\{void controller\.refresh\(\)\}\}/)
 assert.doesNotMatch(diagnostic,/useEffect\(\(\)=>\{.*refresh\(/)
 assert.match(dossiers,/<CSSAWorldSnapshotDiagnostic dossierId=\{selected\?\.d\.id\?\?null\}\/>/)
 assert.match(dossiers,/useCssaBusinessRead<BusinessState>\(\)/)
})
