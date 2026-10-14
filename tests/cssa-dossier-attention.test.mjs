import {test} from 'node:test'
import assert from 'node:assert/strict'
import {deriveCssaDossierAttention} from '../src/cssaDossierAttention.ts'
const fixture=()=>({
 dossiers:[{id:'d1',reference:'AO1',title:'Dossier',status:'EN_PREPARATION',ownerPersonId:'p1'}],
 requirements:[{id:'r1',dossierId:'d1',label:'Assurance',criticality:'OBLIGATOIRE',state:'SATISFAIT',documentRefId:'doc1',taskRefId:'t1',source:'RC clause 4'}],
 documents:[{id:'doc1',title:'Attestation',status:'VALIDE',validUntil:'2027-01-01'}],
 tasks:[{id:'t1',status:'TERMINE'}],people:[{id:'p1',displayName:'Alice',status:'ACTIF'}],
 businessAvailable:true,opsAvailable:true,organisationAvailable:true,today:'2026-10-14'
})
test('valid recorded links produce no integrity alert and never mutate the model',()=>{
 const state=fixture();const before=JSON.stringify(state)
 assert.deepEqual(deriveCssaDossierAttention(state),[]);assert.equal(JSON.stringify(state),before)
})
test('a satisfied requirement with an expired linked piece is surfaced without auto-validation or repair',()=>{
 const state=fixture();state.documents[0].validUntil='2026-10-13'
 const alerts=deriveCssaDossierAttention(state)
 assert.equal(alerts.length,1);assert.equal(alerts[0].targetId,'d1')
 assert.match(alerts[0].detail,/pièce liée expirée/);assert.match(alerts[0].detail,/RC clause 4/)
 assert.equal(state.requirements[0].state,'SATISFAIT');assert.equal(state.documents[0].status,'VALIDE')
})
test('missing references differ from unavailable sources and ambiguous ids',()=>{
 const missing=fixture();missing.tasks=[]
 assert.match(deriveCssaDossierAttention(missing)[0].detail,/référence introuvable/)
 const unavailable=fixture();unavailable.opsAvailable=false
 assert.match(deriveCssaDossierAttention(unavailable)[0].detail,/source indisponible/)
 const duplicate=fixture();duplicate.tasks.push({...duplicate.tasks[0]})
 assert.match(deriveCssaDossierAttention(duplicate)[0].detail,/référence ambiguë/)
})
test('declared owner and unknown or inactive canonical person stay distinct',()=>{
 const declared=fixture();declared.dossiers[0].ownerPersonId=null;declared.dossiers[0].owner='Président déclaré'
 assert.match(deriveCssaDossierAttention(declared)[0].detail,/Président déclaré · sans lien personne/)
 const inactive=fixture();inactive.people[0].status='INACTIF'
 assert.match(deriveCssaDossierAttention(inactive)[0].detail,/Alice · INACTIF/)
 const unavailable=fixture();unavailable.organisationAvailable=false
 assert.match(deriveCssaDossierAttention(unavailable)[0].detail,/source indisponible/)
})
test('required unfinished work is actionable but a finished task cannot satisfy it',()=>{
 const state=fixture();state.requirements[0].state='MANQUANT';state.requirements[0].owner='UNKNOWN'
 const result=deriveCssaDossierAttention(state)
 assert.match(result[0].detail,/exigence obligatoire MANQUANT/)
 assert.equal(state.requirements[0].state,'MANQUANT');assert.equal(state.tasks[0].status,'TERMINE')
})
test('invalid expiry dates remain UNKNOWN rather than inferred expired',()=>{
 const state=fixture();state.documents[0].validUntil='2026-02-31'
 assert.match(deriveCssaDossierAttention(state)[0].detail,/validité document UNKNOWN/)
})
test('unavailable Business creates no fake dossier alerts; closed dossiers are excluded; full results are not capped at twelve',()=>{
 const unavailable=fixture();unavailable.businessAvailable=false
 assert.deepEqual(deriveCssaDossierAttention(unavailable),[])
 const closed=fixture();closed.dossiers[0].status='ANNULE';closed.documents=[]
 assert.deepEqual(deriveCssaDossierAttention(closed),[])
 const many=fixture();many.dossiers=Array.from({length:15},(_,i)=>({id:'d'+i,reference:'AO'+i,title:'Dossier',status:'EN_PREPARATION'}));many.requirements=[]
 assert.equal(deriveCssaDossierAttention(many).length,15)
})
