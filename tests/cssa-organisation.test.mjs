import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaOrganisationState,writeCssaOrganisationState} from '../server/cssa-organisation-store.mjs'

test('organisation store starts empty and never invents people',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-org-'))
 const file=join(dir,'state.json')
 try{
  const s=readCssaOrganisationState(file)
  assert.equal(s.version,'CSSA_ORGANISATION_STATE_V1')
  assert.deepEqual(s.people,[])
  assert.deepEqual(s.roleAssignments,[])
  assert.deepEqual(s.availabilities,[])
  assert.deepEqual(s.engagements,[])
  assert.deepEqual(s.authorizations,[])
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('one canonical person can carry role availability engagement and authorization',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-org-'))
 const file=join(dir,'state.json')
 try{
  writeCssaOrganisationState({personPatch:{id:'p1',displayName:'Personne test',status:'ACTIF',contact:'INCONNU',source:'TEST'}},file)
  writeCssaOrganisationState({roleAssignmentPatch:{id:'ra1',personId:'p1',roleSlot:'CLUB_SECRETARIAT',status:'ACTIF',source:'TEST'}},file)
  writeCssaOrganisationState({availabilityPatch:{id:'av1',personId:'p1',from:'2026-10-20T10:00',to:'2026-10-20T18:00',status:'DISPONIBLE',source:'TEST'}},file)
  writeCssaOrganisationState({engagementPatch:{id:'e1',personId:'p1',type:'BENEVOLE',status:'A_VERIFIER',source:'TEST'}},file)
  writeCssaOrganisationState({authorizationPatch:{id:'au1',personId:'p1',scope:'AO',action:'VALIDER_DOSSIER',status:'EN_ATTENTE',source:'TEST'}},file)
  const s=readCssaOrganisationState(file)
  assert.equal(s.people.length,1)
  assert.equal(s.roleAssignments[0].personId,'p1')
  assert.equal(s.availabilities[0].personId,'p1')
  assert.equal(s.engagements[0].personId,'p1')
  assert.equal(s.authorizations[0].personId,'p1')
 }finally{rmSync(dir,{recursive:true,force:true})}
})

test('organisation updates are upserts and do not duplicate people',()=>{
 const dir=mkdtempSync(join(tmpdir(),'cssa-org-'))
 const file=join(dir,'state.json')
 try{
  writeCssaOrganisationState({personPatch:{id:'p1',displayName:'A',status:'ACTIF'}},file)
  writeCssaOrganisationState({personPatch:{id:'p1',displayName:'B'}},file)
  const s=readCssaOrganisationState(file)
  assert.equal(s.people.length,1)
  assert.equal(s.people[0].displayName,'B')
  assert.equal(s.people[0].status,'ACTIF')
 }finally{rmSync(dir,{recursive:true,force:true})}
})
