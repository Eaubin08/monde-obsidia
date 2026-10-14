import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaMailState,writeCssaMailState,ingestCssaMail} from '../server/cssa-mail-store.mjs'
import {writeCssaCrmDirectory,readCssaCrmDirectory} from '../server/cssa-crm-directory-store.mjs'

test('mail store starts empty and never invents a mailbox',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-mail-'))
 const file=join(dir,'mail.json')
 try{
  const s=readCssaMailState(file)
  assert.equal(s.version,'CSSA_MAIL_STATE_V1')
  assert.deepEqual(s.messages,[])
  assert.deepEqual(s.drafts,[])
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('mail ingest deterministically links exact known contact email into CRM interaction',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-mail-'))
 const mailFile=join(dir,'mail.json')
 const crmFile=join(dir,'crm.json')
 try{
  writeCssaCrmDirectory({organizationPatch:{id:'org1',name:'Ville test',kind:'COLLECTIVITE',status:'ACTIF',email:'contact@ville.test',source:'TEST'}},crmFile)
  writeCssaCrmDirectory({contactPatch:{id:'c1',organizationId:'org1',displayName:'Contact test',email:'agent@ville.test',status:'ACTIF',source:'TEST'}},crmFile)
  const out=ingestCssaMail({id:'m1',from:'agent@ville.test',to:['club@test.fr'],subject:'Réponse AO',bodyPreview:'Pièce jointe reçue',receivedAt:'2026-10-14T10:00:00',proof:'msg-1',source:'TEST'},mailFile,crmFile)
  assert.equal(out.message.organizationId,'org1')
  assert.equal(out.message.contactId,'c1')
  assert.equal(out.message.status,'RACCORDE_CRM')
  assert.ok(out.message.crmInteractionId)
  const crm=readCssaCrmDirectory(crmFile)
  const interaction=crm.interactions.find(x=>x.id===out.message.crmInteractionId)
  assert.equal(interaction.organizationId,'org1')
  assert.equal(interaction.contactId,'c1')
  assert.equal(interaction.type,'EMAIL')
  assert.equal(interaction.proof,'msg-1')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('unknown email remains unlinked instead of inventing an actor',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-mail-'))
 const mailFile=join(dir,'mail.json')
 const crmFile=join(dir,'crm.json')
 try{
  const out=ingestCssaMail({id:'m2',from:'unknown@example.test',subject:'Message inconnu'},mailFile,crmFile)
  assert.equal(out.message.organizationId,null)
  assert.equal(out.message.contactId,null)
  assert.equal(out.message.status,'A_RAPPROCHER')
  assert.equal(out.message.crmInteractionId,null)
  assert.equal(readCssaCrmDirectory(crmFile).interactions.length,0)
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('mail drafts persist locally without external send state',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-mail-'))
 const file=join(dir,'mail.json')
 try{
  writeCssaMailState({draftPatch:{id:'d1',to:['x@test.fr'],subject:'Projet',body:'Texte',status:'BROUILLON',source:'BROUILLON_LOCAL_NON_ENVOYE'}},file)
  const s=readCssaMailState(file)
  assert.equal(s.drafts.length,1)
  assert.equal(s.drafts[0].status,'BROUILLON')
  assert.equal(s.drafts[0].source,'BROUILLON_LOCAL_NON_ENVOYE')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
