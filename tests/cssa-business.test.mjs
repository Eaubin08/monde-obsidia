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
  assert.deepEqual(s.invoices,[])
  assert.deepEqual(s.payments,[])
  assert.deepEqual(s.treasuryEntries,[])
  assert.deepEqual(s.assets,[])
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
  writeCssaBusinessState({supplierPatch:{id:'sup1',name:'Fournisseur test',category:'BUVETTE',contact:'INCONNU',status:'A_VERIFIER',source:'INCONNU'}},file)
  writeCssaBusinessState({invoicePatch:{id:'inv1',direction:'RECUE',number:'F-1',party:'INCONNU',label:'Appro',amount:40,status:'A_PAYER',source:'INCONNU'}},file)
  writeCssaBusinessState({paymentPatch:{id:'pay1',invoiceId:'inv1',direction:'SORTIE',amount:40,date:'2026-10-14',method:'INCONNU',account:'INCONNU',status:'A_VERIFIER',source:'INCONNU'}},file)
  writeCssaBusinessState({treasuryPatch:{id:'tre1',account:'CAISSE',date:'2026-10-14',direction:'SORTIE',label:'Paiement',amount:40,source:'INCONNU',paymentId:'pay1'}},file)
  writeCssaBusinessState({assetPatch:{id:'asset1',kind:'VEHICULE',label:'Minibus',status:'A_VERIFIER',location:'INCONNU',maintenanceDueAt:'',source:'INCONNU'}},file)
  const s=readCssaBusinessState(file)
  assert.equal(s.dossiers[0].id,'d1')
  assert.equal(s.requirements[0].dossierId,'d1')
  assert.equal(s.documentRefs[0].id,'doc1')
  assert.equal(s.validations[0].status,'EN_ATTENTE')
  assert.equal(s.revenues[0].matchRef,'r1-j1')
  assert.equal(s.expenses[0].amount,40)
  assert.equal(s.stockItems[0].channel,'BUVETTE')
  assert.equal(s.contracts[0].kind,'SPONSOR')
  assert.equal(s.suppliers[0].category,'BUVETTE')
  assert.equal(s.invoices[0].status,'A_PAYER')
  assert.equal(s.payments[0].invoiceId,'inv1')
  assert.equal(s.treasuryEntries[0].direction,'SORTIE')
  assert.equal(s.assets[0].kind,'VEHICULE')
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


test('business state preserves Organisation person references across dossiers and finance',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-business-person-'))
 const file=join(dir,'state.json')
 try{
  writeCssaBusinessState({dossierPatch:{id:'d-person',reference:'AO-P',title:'Dossier personne',ownerPersonId:'p1'}},file)
  writeCssaBusinessState({validationPatch:{id:'v-person',dossierId:'d-person',type:'REVUE_FINALE',status:'VALIDE',decidedBy:'p1'}},file)
  writeCssaBusinessState({revenuePatch:{id:'rev-person',category:'BUVETTE',label:'Caisse',amount:12,recordedByPersonId:'p1'}},file)
  writeCssaBusinessState({invoicePatch:{id:'inv-person',label:'Facture',amount:12,responsiblePersonId:'p1'}},file)
  writeCssaBusinessState({paymentPatch:{id:'pay-person',amount:12,recordedByPersonId:'p1'}},file)
  writeCssaBusinessState({treasuryPatch:{id:'tre-person',label:'Mouvement',amount:12,recordedByPersonId:'p1'}},file)
  const s=readCssaBusinessState(file)
  assert.equal(s.dossiers.find(x=>x.id==='d-person').ownerPersonId,'p1')
  assert.equal(s.validations.find(x=>x.id==='v-person').decidedBy,'p1')
  assert.equal(s.revenues.find(x=>x.id==='rev-person').recordedByPersonId,'p1')
  assert.equal(s.invoices.find(x=>x.id==='inv-person').responsiblePersonId,'p1')
  assert.equal(s.payments.find(x=>x.id==='pay-person').recordedByPersonId,'p1')
  assert.equal(s.treasuryEntries.find(x=>x.id==='tre-person').recordedByPersonId,'p1')
 }finally{rmSync(dir,{recursive:true,force:true})}
})


test('business documents preserve Mail provenance and requirement links',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-business-mail-doc-'))
 const file=join(dir,'state.json')
 try{
  writeCssaBusinessState({dossierPatch:{id:'d-mail',reference:'AO-MAIL',title:'Dossier mail'}},file)
  writeCssaBusinessState({requirementPatch:{id:'r-mail',dossierId:'d-mail',label:'Attestation requise',state:'A_VERIFIER',documentRefId:null}},file)
  writeCssaBusinessState({documentRefPatch:{id:'doc-mail',dossierId:'d-mail',type:'ATTESTATION',title:'Attestation reçue',version:'1',status:'A_VERIFIER',source:'MAIL:m1',fileRef:'msg-1',usedIn:['d-mail'],originType:'MAIL',originMailId:'m1',requirementIds:['r-mail'],receivedAt:'2026-10-14T10:00:00',proof:'msg-1'}},file)
  writeCssaBusinessState({requirementPatch:{id:'r-mail',documentRefId:'doc-mail',state:'A_VERIFIER'}},file)
  const s=readCssaBusinessState(file)
  const doc=s.documentRefs.find(x=>x.id==='doc-mail')
  const req=s.requirements.find(x=>x.id==='r-mail')
  assert.equal(doc.originType,'MAIL')
  assert.equal(doc.originMailId,'m1')
  assert.equal(doc.proof,'msg-1')
  assert.deepEqual(doc.requirementIds,['r-mail'])
  assert.equal(req.documentRefId,'doc-mail')
  assert.equal(req.state,'A_VERIFIER')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
