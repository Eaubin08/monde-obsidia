import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolveCssaReference} from '../src/cssaLinkedReference.ts'
import {cssaNavigationCount} from '../src/cssaNavigationCounts.ts'

const shell=readFileSync(new URL('../src/CSSAPage.tsx',import.meta.url),'utf8')
const mail=readFileSync(new URL('../src/CSSAMailPage.tsx',import.meta.url),'utf8')
const home=readFileSync(new URL('../src/CSSAHomePage.tsx',import.meta.url),'utf8')
const docs=readFileSync(new URL('../src/CSSADocumentsPage.tsx',import.meta.url),'utf8')
const crm=readFileSync(new URL('../src/CSSACrmPage.tsx',import.meta.url),'utf8')
const available=state=>({available:true,state:{_source:{status:'AVAILABLE'},...state}})

test('CSSA shell passes the deep-linked Mail identity into the Mail page',()=>{
 assert.match(shell,/CSSAMailPage selectedId=\{selectedId\}/)
 assert.match(mail,/selectedId:requestedId/)
 assert.match(mail,/setSelectedId\(requestedId\|\|''\)/)
 assert.match(mail,/onOpen\?\.\('mail',m\.id\)/)
})
test('Mail missing and ambiguous selections remain explicit, not first-row substitutions',()=>{
 assert.match(mail,/selectedRows\.length>1\?'UNKNOWN · référence Mail ambiguë':'UNKNOWN · référence Mail introuvable'/)
 assert.match(mail,/selectionIssue\?selectionIssue/)
})
test('cross-links require unique exact ids in their available source',()=>{
 assert.match(mail,/directory\?\.organizations\.filter\(o=>o\.id===selected\.organizationId\)\.length===1/)
 assert.match(mail,/business\?\.dossiers\.filter\(d=>d\.id===selected\.dossierId\)\.length===1/)
 assert.equal(resolveCssaReference('x',[],false).status,'SOURCE_UNKNOWN')
 assert.equal(resolveCssaReference('x',[],true).status,'BROKEN')
 assert.equal(resolveCssaReference('x',[{id:'x'},{id:'x'}],true).status,'AMBIGUOUS')
 assert.equal(resolveCssaReference('x',[{id:'x'}],true).status,'RESOLVED')
})
test('navigation counts preserve 0 vs UNKNOWN independently per store',()=>{
 assert.equal(cssaNavigationCount('tasks',{ops:available({tasks:[]})}).value,0)
 assert.equal(cssaNavigationCount('tasks',{ops:{available:false}}).value,null)
 assert.equal(cssaNavigationCount('documents',{business:available({documentRefs:[{id:'d'}]})}).value,1)
})

test('Accueil uses the same task count semantics as CSSA side navigation',()=>{
 assert.match(home,/cssaNavigationCount\('tasks',countObservations\)/)
 assert.match(home,/openTasks\?\?'UNKNOWN'/)
 assert.match(home,/data\._source\?\.status!=='AVAILABLE'/)
 assert.doesNotMatch(home,/const openTasks=tasks\.filter/)
})

test('deep links do not silently pick the first unrelated item',()=>{
 assert.doesNotMatch(shell,/if\(!items\.some\(x=>x\.id===selectedId\)\)setSelectedId\(items\[0\]\.id\)/)
 assert.match(shell,/if\(selectedId\)return/)
})
test('document cards reject ambiguous dossier and requirement references',()=>{
 assert.match(docs,/const dossierRef=resolveCssaReference\(d\.dossierId,state\.dossiers,cssaSourceAvailable\(state\)\)/)
 assert.match(docs,/requirements\.length===1\?requirements\[0\]:null/)
 assert.match(docs,/UNKNOWN · plusieurs exigences associées/)
})

test('Accueil resolves people and outcome dossiers without arbitrary first match',()=>{
 assert.match(home,/resolveCssaReference\(id,people,cssaSourceAvailable\(organisation\)\)/)
 assert.match(home,/resolveCssaReference\(o\.dossierId,dossiers,cssaSourceAvailable\(business\)\)/)
 assert.match(home,/referenceLabels\[dossierRef\.status\]/)
})

test('Accueil flags duplicate final validations, proofs and outcomes',()=>{
 assert.match(home,/finalValidations\.length>1\|\|proofs\.length>1\|\|outcomes\.length>1/)
 assert.match(home,/UNKNOWN · validations, dépôts ou résultats multiples à réconcilier/)
 assert.match(home,/!dossierOutcomes\.some\(o=>o\.dossierId===d\.id\)/)
})

test('CRM interaction links are disabled unless organization identity resolves uniquely',()=>{
 assert.match(crm,/resolveCssaReference\(i\.organizationId,view\.orgs,directoryAvailable\)/)
 assert.match(crm,/disabled=\{!o\}/)
 assert.match(crm,/referenceLabels\[ref\.status\]/)
 assert.doesNotMatch(crm,/view\.orgs\.find\(x=>x\.id===i\.organizationId\)/)
})

test('CRM followups require an observed, unique task reference',()=>{
 assert.match(crm,/resolveCssaReference\(i\.followupTaskId,opsAvailable\?ops\?\.tasks\|\|\[\]:\[\],opsAvailable\)/)
 assert.match(crm,/unresolvedFollowups/)
 assert.match(crm,/relance\(s\) reliée\(s\) à une tâche vérifiée/)
})

const opsWorkspace=readFileSync(new URL('../src/CSSAOpsWorkspace.tsx',import.meta.url),'utf8')
const tasksPage=readFileSync(new URL('../src/CSSATasksPage.tsx',import.meta.url),'utf8')
test('Ops Workspace preserves missing or ambiguous explicit selections',()=>{
 assert.match(opsWorkspace,/state\.tasks\.filter\(t => t\.id === selectedId\)\.length === 1/)
 assert.match(opsWorkspace,/state\.cases\.filter\(c => c\.id === selectedId\)\.length === 1/)
 assert.match(opsWorkspace,/directory\.organizations\.filter\(x=>x\.id===directorySelectedId\)\.length===1/)
})
test('Task-to-person navigation requires a unique observed person',()=>{
 assert.match(tasksPage,/organisation\?\.people\.filter\(person=>person\.id===t\.responsiblePersonId\)\.length===1/)
 assert.match(tasksPage,/UNKNOWN · référence personne ambiguë ou introuvable/)
})

test('CRM namespace collisions and Intendance deep links never select another identity',()=>{
 assert.match(opsWorkspace,/orgMatches===1&&caseMatches===0/)
 assert.match(opsWorkspace,/caseMatches===1&&orgMatches===0/)
 assert.match(opsWorkspace,/state\.intendanceItems\.filter\(i => i\.id === selectedId\)\.length === 1/)
 assert.match(opsWorkspace,/cssaSourceAvailable\(directory\)/)
 assert.match(opsWorkspace,/cssaSourceAvailable\(state\)/)
})

test('Tasks page KPI and navigation share the canonical source-based counter',()=>{
 assert.match(tasksPage,/cssaNavigationCount\('tasks',\{ops:/)
 assert.match(tasksPage,/view\.openCount\?\?'UNKNOWN'/)
 assert.match(tasksPage,/!\['TERMINE','FERME','CLOSED'\]\.includes\(t\.status\)/)
})
test('CRM collision also blocks displaying a case with an organization id',()=>{
 assert.match(opsWorkspace,/!\(directory\?\.organizations\.some\(o=>o\.id===selectedId\)\)/)
})

test('unresolved CRM deep link clears previous selected organization and never falls back',()=>{
 assert.match(opsWorkspace,/setDirectorySelectedId\(''\);appliedCrmSelection\.current=''/)
 assert.match(opsWorkspace,/selectedId \? null : directory\.organizations\[0\]/)
 assert.match(opsWorkspace,/!state\?\.cases\.some\(c=>c\.id===directorySelectedId\)/)
})

test('CRM selection is revalidated on source refresh, not frozen by prior resolved ID',()=>{
 assert.match(opsWorkspace,/if\(activeModule!=='crm'\|\|!selectedId\)return/)
 assert.doesNotMatch(opsWorkspace,/appliedCrmSelection\.current===selectedId\)return/)
 assert.match(opsWorkspace,/setDirectorySelectedId\(''\);appliedCrmSelection\.current=''/)
})

test('CSSA catalogue deep links require exactly one matching item',()=>{
 assert.match(shell,/const selectedMatches=selectedId\?items\.filter\(x=>x\.id===selectedId\):\[\]/)
 assert.match(shell,/const selected=selectedMatches\.length===1\?selectedMatches\[0\]:null/)
 assert.doesNotMatch(shell,/const selected=items\.find\(x=>x\.id===selectedId\)/)
})
