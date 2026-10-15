import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCssaOrganisation} from '../src/cssaOrganisationRead.ts'
const empty=()=>({people:[],roleAssignments:[],availabilities:[],engagements:[],authorizations:[],_source:{status:'AVAILABLE'}})
const response=state=>async()=>({ok:true,json:async()=>state})
test('source metadata is preserved, including unavailable registries with fallback data',async()=>{
 for(const status of ['AVAILABLE','MISSING','INVALID','UNREADABLE']){
  const state=empty();state._source.status=status
  assert.deepEqual(await readCssaOrganisation(response(state)),state)
 }
})
test('malformed collections and fields needed by people and availability views reject',async()=>{
 for(const key of ['people','roleAssignments','availabilities','engagements','authorizations']){
  for(const invalid of [undefined,{},[null],[{id:'incomplete'}]]){
   const state=empty();state[key]=invalid
   await assert.rejects(readCssaOrganisation(response(state)))
  }
 }
 const state=empty();state.availabilities=[{id:'a',personId:'p',from:'2026-10-15',to:123,status:'INDISPONIBLE'}]
 await assert.rejects(readCssaOrganisation(response(state)))
})
test('inactive people, duplicate ids, declarations and contradictory records remain unchanged for explicit resolution',async()=>{
 const person={id:'p',displayName:'Alice',status:'INACTIF',source:'UNKNOWN'}
 const state={...empty(),people:[person,person],authorizations:[{id:'a',personId:'p',scope:'DOSSIER',action:'DEPOT',status:'INCONNUE',source:'déclaration'}],contradictions:['à revoir']}
 const before=JSON.stringify(state)
 assert.deepEqual(await readCssaOrganisation(response(state)),state)
 assert.equal(JSON.stringify(state),before)
})
test('transport, HTTP and JSON errors reject instead of returning an empty or stale organisation',async()=>{
 for(const fetcher of [async()=>({ok:false}),async()=>({ok:true,json:async()=>{throw Error('invalid json')}}),async()=>{throw Error('offline')}])await assert.rejects(readCssaOrganisation(fetcher))
})
test('reads only the existing local Organisation endpoint with a bounded signal and no cache',async()=>{
 await readCssaOrganisation(async(url,options)=>{
  assert.equal(url,'/obsidia-local/cssa-organisation-state');assert.equal(options.cache,'no-store');assert.ok(options.signal instanceof AbortSignal)
  return {ok:true,json:async()=>empty()}
 })
})
