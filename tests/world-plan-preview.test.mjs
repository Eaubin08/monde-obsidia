import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const renderer=readFileSync(new URL('../src/WorldPlanPreview.tsx',import.meta.url),'utf8')
const diagnostic=readFileSync(new URL('../src/CSSAWorldSnapshotDiagnostic.tsx',import.meta.url),'utf8')
test('V30 preview takes only a semantic render plan and no writable store',()=>{
 assert.match(renderer,/plan:Plan/)
 assert.match(renderer,/data-world-renderer="V0"/)
 assert.match(renderer,/plan\.territories\.map/)
 assert.doesNotMatch(renderer,/fetch\(|onClick|POST|PUT|DELETE/)
})
test('V30 fails closed when no current snapshot is present',()=>{
 assert.match(renderer,/plan\.phase!=='READY'&&plan\.phase!=='DEGRADED'/)
 assert.match(renderer,/Aucun plan Monde actuel disponible/)
})
test('V30 is opt-in inside existing CSSA readonly diagnostic',()=>{
 assert.match(diagnostic,/<WorldPlanPreview plan=\{renderPlan\}\/>/)
 assert.match(diagnostic,/Aperçu expérimental du rendu Monde V30/)
})
