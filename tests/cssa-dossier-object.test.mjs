import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const dossier=readFileSync(new URL('../src/CSSADossiersPage.tsx',import.meta.url),'utf8')
test('dossier deep link requires unique identity',()=>{
 assert.match(dossier,/const selectedMatches=selectedId\?rows\.filter\(x=>x\.d\.id===selectedId\):\[\]/)
 assert.match(dossier,/const selected=selectedMatches\.length===1\?selectedMatches\[0\]:null/)
})
test('independent final validation, submission and outcome never pick arbitrary first evidence',()=>{
 assert.match(dossier,/const validations=state\.validations\.filter/)
 assert.match(dossier,/const proofs=state\.submissionProofs\.filter/)
 assert.match(dossier,/const outcomes=state\.dossierOutcomes\.filter/)
 assert.match(dossier,/const evidenceConflicts=/)
 assert.match(dossier,/CONTRADICTION · \{message\}/)
})
test('dossier opens exact document and canonical owner only',()=>{
 assert.match(dossier,/onOpen\?\.\('documents',doc\.id\)/)
 assert.match(dossier,/state\.documentRefs\.filter\(x=>x\.id===doc\.id\)\.length!==1/)
 assert.match(dossier,/organisation\?\.people\.filter\(p=>p\.id===selected\.d\.ownerPersonId\)\.length===1/)
})
test('requirements remain independent of tasks and linked documents',()=>{
 assert.match(dossier,/resolveCssaReference\(req\.documentRefId,state\.documentRefs,cssaSourceAvailable\(state\)\)/)
 assert.match(dossier,/resolveCssaReference\(req\.taskRefId,linkedTasks\.rows,linkedTasks\.available\)/)
 assert.match(dossier,/une tâche terminée ne valide pas une exigence/)
})
