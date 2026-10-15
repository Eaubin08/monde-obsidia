import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {writeCssaOrganisationPatch} from '../src/cssaOrganisationWrite.ts'
import {readCssaOrganisationState,writeCssaOrganisationState} from '../server/cssa-organisation-store.mjs'
const empty=()=>({people:[],roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}})
const person={id:'person-stable',displayName:'Alice',status:'ACTIF',contact:'UNKNOWN',source:'déclaration',note:''}
const reply=state=>({ok:true,json:async()=>structuredClone(state)})
function mock(initial,transform){
 let state=structuredClone(initial);let posts=0
 return {get posts(){return posts},fetch:async(_url,options)=>{
  if(options?.method!=='POST')return reply(state)
  posts++
  if(transform)return transform(state,JSON.parse(options.body))
  const mappings={personPatch:'people',roleAssignmentPatch:'roleAssignments',availabilityPatch:'availabilities',engagementPatch:'engagements',authorizationPatch:'authorizations'}
  for(const [key,row] of Object.entries(JSON.parse(options.body)))state[mappings[key]]=[row,...state[mappings[key]].filter(item=>item.id!==row.id)]
  state._source.status='AVAILABLE';return reply(state)
 }}
}
test('person creation can initialize MISSING and is confirmed with exact source and fields',async()=>{
 const state=empty();state._source.status='MISSING'
 const io=mock(state)
 const result=await writeCssaOrganisationPatch('personPatch',person,io.fetch)
 assert.deepEqual(result.people,[person]);assert.equal(result._source.status,'AVAILABLE');assert.equal(io.posts,1)
})
test('all four person-linked forms preserve their independent declared states',async()=>{
 const state=empty();state.people=[person]
 const rows=[['roleAssignmentPatch','roleAssignments',{id:'r',personId:person.id,roleSlot:'PRESIDENT',status:'ACTIF'}],['availabilityPatch','availabilities',{id:'a',personId:person.id,from:'2026-10-15',to:'2026-10-16',status:'INCONNU'}],['engagementPatch','engagements',{id:'e',personId:person.id,type:'BENEVOLE',status:'A_VERIFIER'}],['authorizationPatch','authorizations',{id:'h',personId:person.id,scope:'DOSSIER',action:'DEPOT',status:'INCONNUE'}]]
 for(const [key,list,row] of rows){
  const io=mock(state);const result=await writeCssaOrganisationPatch(key,row,io.fetch)
  assert.deepEqual(result[list],[row]);assert.deepEqual(result.people,[person])
 }
})
test('invalid and unreadable files cannot be replaced by an empty fallback write',async()=>{
 for(const status of ['INVALID','UNREADABLE',undefined]){
  const state=empty();state._source.status=status;const io=mock(state)
  await assert.rejects(writeCssaOrganisationPatch('personPatch',person,io.fetch));assert.equal(io.posts,0)
 }
})
test('removed and duplicate canonical person references block person-linked writes',async()=>{
 for(const people of [[],[person,person]]){
  const state=empty();state.people=people;const io=mock(state)
  await assert.rejects(writeCssaOrganisationPatch('authorizationPatch',{id:'h',personId:person.id,scope:'DOSSIER',action:'DEPOT',status:'EN_ATTENTE'},io.fetch));assert.equal(io.posts,0)
 }
})
test('HTTP failure and missing, duplicate, unavailable or changed response object never confirm',async()=>{
 for(const transform of [()=>({ok:false}),state=>reply(state),state=>reply({...state,people:[person,person]}),state=>reply({...state,people:[person],_source:{status:'MISSING'}}),state=>reply({...state,people:[{...person,source:'different'}]})]){
  const io=mock(empty(),transform)
  await assert.rejects(writeCssaOrganisationPatch('personPatch',person,io.fetch));assert.equal(io.posts,1)
 }
})
test('actual store retry after a lost response reuses the same id without duplicating or erasing other records',async()=>{
 const root=mkdtempSync(join(tmpdir(),'cssa-org-confirm-'));const file=join(root,'organisation.json')
 try{
  writeCssaOrganisationState({personPatch:{...person,id:'other',displayName:'Bob'}},file)
  let fail=true;let posts=0
  const fetcher=async(_url,options)=>{
   if(options?.method==='POST'){
    posts++;const state=writeCssaOrganisationState(JSON.parse(options.body),file)
    if(fail){fail=false;throw Error('response lost after save')}
    return reply({...state,_source:{status:'AVAILABLE'}})
   }
   return reply({...readCssaOrganisationState(file),_source:{status:'AVAILABLE'}})
  }
  await assert.rejects(writeCssaOrganisationPatch('personPatch',person,fetcher))
  const result=await writeCssaOrganisationPatch('personPatch',person,fetcher)
  assert.equal(posts,2);assert.equal(result.people.length,2);assert.deepEqual(result.people.find(p=>p.id===person.id),person)
  assert.equal(result.people.find(p=>p.id==='other').displayName,'Bob')
 }finally{rmSync(root,{recursive:true,force:true})}
})
