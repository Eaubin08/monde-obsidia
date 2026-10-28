import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const actor=readFileSync(new URL('../src/CSSAActorObjectView.tsx',import.meta.url),'utf8')
const crm=readFileSync(new URL('../src/CSSACrmPage.tsx',import.meta.url),'utf8')
test('actor graph starts from one canonical CRM reference only',()=>{
 assert.match(actor,/resolveCssaReference\(selectedId,directory\?\.organizations\|\|\[\],crmAvailable\)/)
 assert.match(actor,/aucune organisation substituée/)
 assert.match(actor,/organizationId===id/)
})
test('actor graph joins dossiers contracts and invoices by explicit ids, never labels',()=>{
 assert.match(actor,/business!\.dossiers\.filter\(x=>x\.organizationId===id\)/)
 assert.match(actor,/economy!\.contracts\.filter\(x=>x\.partyOrganizationId===id\)/)
 assert.match(actor,/economy!\.invoices\.filter\(x=>x\.partyOrganizationId===id\)/)
 assert.match(actor,/economy!\.payments\.filter\(pay=>pay\.invoiceId===i\.id\)/)
})
test('actor graph preserves independent source availability and bounded CRM followups',()=>{
 assert.match(actor,/resolveCssaReference\(i\.followupTaskId,ops\?\.tasks\|\|\[\],p\.opsAvailable\)/)
 assert.match(actor,/UNKNOWN · registre économique non disponible/)
 assert.match(actor,/UNKNOWN · registre Dossiers indisponible/)
 assert.match(actor,/Gouvernance KX108_ONLY/)
})
test('CRM integrates actor detail only for unique observed selected organization',()=>{
 assert.match(crm,/directory\?\.organizations\.filter\(o=>o\.id===selectedId\)\.length===1/)
 assert.match(crm,/<CSSAActorObjectView selectedId=\{selectedId\}/)
})
