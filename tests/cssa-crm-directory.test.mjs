import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaCrmDirectory,writeCssaCrmDirectory} from '../server/cssa-crm-directory-store.mjs'

test('crm directory starts empty and never invents external actors',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-crm-directory-'))
 const file=join(dir,'state.json')
 try{
  const s=readCssaCrmDirectory(file)
  assert.equal(s.version,'CSSA_CRM_DIRECTORY_V1')
  assert.deepEqual(s.organizations,[])
  assert.deepEqual(s.contacts,[])
  assert.deepEqual(s.interactions,[])
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('crm directory persists one canonical organization with reusable contacts',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-crm-directory-'))
 const file=join(dir,'state.json')
 try{
  writeCssaCrmDirectory({organizationPatch:{id:'org1',name:'Organisation test',kind:'COLLECTIVITE',status:'ACTIF',source:'TEST'}},file)
  writeCssaCrmDirectory({contactPatch:{id:'c1',organizationId:'org1',displayName:'Contact test',role:'ACHATS',status:'ACTIF',source:'TEST'}},file)
  const s=readCssaCrmDirectory(file)
  assert.equal(s.organizations.length,1)
  assert.equal(s.organizations[0].id,'org1')
  assert.equal(s.contacts[0].organizationId,'org1')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('deleting an organization also removes orphan contacts',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-crm-directory-'))
 const file=join(dir,'state.json')
 try{
  writeCssaCrmDirectory({organizationPatch:{id:'org1',name:'Organisation test'}},file)
  writeCssaCrmDirectory({contactPatch:{id:'c1',organizationId:'org1',displayName:'Contact test'}},file)
  const s=writeCssaCrmDirectory({organizationDeleteId:'org1'},file)
  assert.equal(s.organizations.length,0)
  assert.equal(s.contacts.length,0)
 }finally{rmSync(dir,{recursive:true,force:true})}
})


test('crm journal persists canonical interactions and follow-up references',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-crm-journal-'))
 const file=join(dir,'state.json')
 try{
  writeCssaCrmDirectory({organizationPatch:{id:'org1',name:'Organisation test',kind:'COLLECTIVITE'}},file)
  writeCssaCrmDirectory({contactPatch:{id:'c1',organizationId:'org1',displayName:'Contact test'}},file)
  writeCssaCrmDirectory({interactionPatch:{id:'it1',organizationId:'org1',contactId:'c1',type:'EMAIL',direction:'ENTRANT',channel:'EMAIL',occurredAt:'2026-10-14T09:00:00',summary:'Réponse reçue',proof:'receipt-1',internalPersonId:'p1',followupTaskId:'task1',source:'TEST'}},file)
  const s=readCssaCrmDirectory(file)
  assert.equal(s.interactions.length,1)
  assert.equal(s.interactions[0].organizationId,'org1')
  assert.equal(s.interactions[0].contactId,'c1')
  assert.equal(s.interactions[0].followupTaskId,'task1')
  assert.equal(s.interactions[0].proof,'receipt-1')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
