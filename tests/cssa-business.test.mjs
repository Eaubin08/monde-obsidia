import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaBusinessState,writeCssaBusinessState} from '../server/cssa-business-store.mjs'

test('cssa business store starts empty and never invents club financial data',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-business-'))
 const file=join(dir,'state.json')
 try{
  const s=readCssaBusinessState(file)
  assert.equal(s.version,'CSSA_BUSINESS_STATE_V1')
  assert.deepEqual(s.dossiers,[])
  assert.deepEqual(s.revenues,[])
  assert.deepEqual(s.expenses,[])
  assert.deepEqual(s.stockItems,[])
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('dossier requirement document validation and economy rows persist with stable ids',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-business-'))
 const file=join(dir,'state.json')
 try{
  writeCssaBusinessState({dossierPatch:{id:'d1',reference:'AO-TEST',type:'APPEL_OFFRES',title:'Test',organization:'INCONNU',deadline:'',status:'BROUILLON',source:'INCONNU',owner:'UNKNOWN / NON ASSIGNÉ'}},file)
  writeCssaBusinessState({requirementPatch:{id:'r1',dossierId:'d1',label:'Assurance',criticality:'OBLIGATOIRE',state:'A_VERIFIER',source:'RC art. 4.2'}},file)
  writeCssaBusinessState({documentRefPatch:{id:'doc1',dossierId:'d1',title:'Attestation',version:'1',status:'A_VERIFIER',source:'INCONNU',usedIn:['d1']}},file)
  writeCssaBusinessState({validationPatch:{id:'v1',dossierId:'d1',type:'REVUE_FINALE',status:'EN_ATTENTE'}},file)
  writeCssaBusinessState({revenuePatch:{id:'rev1',category:'BUVETTE',label:'Caisse match',amount:100,matchRef:'r1-j1',source:'SAISIE_INTERNE_A_VERIFIER'}},file)
  writeCssaBusinessState({expensePatch:{id:'exp1',category:'ACHAT_BUVETTE',label:'Appro',amount:40,matchRef:'r1-j1',source:'SAISIE_INTERNE_A_VERIFIER'}},file)
  writeCssaBusinessState({stockPatch:{id:'stock1',channel:'BUVETTE',label:'Eau',quantity:24,status:'A_VERIFIER'}},file)
  writeCssaBusinessState({contractPatch:{id:'c1',kind:'SPONSOR',label:'Convention',party:'INCONNU',status:'A_VERIFIER',source:'INCONNU'}},file)
  const s=readCssaBusinessState(file)
  assert.equal(s.dossiers[0].id,'d1')
  assert.equal(s.requirements[0].dossierId,'d1')
  assert.equal(s.documentRefs[0].id,'doc1')
  assert.equal(s.validations[0].status,'EN_ATTENTE')
  assert.equal(s.revenues[0].matchRef,'r1-j1')
  assert.equal(s.expenses[0].amount,40)
  assert.equal(s.stockItems[0].channel,'BUVETTE')
  assert.equal(s.contracts[0].kind,'SPONSOR')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('business state update is an upsert and does not duplicate canonical objects',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-business-'))
 const file=join(dir,'state.json')
 try{
  writeCssaBusinessState({revenuePatch:{id:'rev1',category:'BOUTIQUE',label:'Vente',amount:20}},file)
  writeCssaBusinessState({revenuePatch:{id:'rev1',amount:25}},file)
  const s=readCssaBusinessState(file)
  assert.equal(s.revenues.length,1)
  assert.equal(s.revenues[0].amount,25)
  assert.equal(s.revenues[0].category,'BOUTIQUE')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
