import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCssaTasks} from '../src/cssaTasksRead.ts'
const task={id:'t1',title:'Assurance',status:'EN_COURS',priority:'HAUTE',origin:'ADMINISTRATION',source:'document-local',relations:[{type:'DOSSIER',targetId:'d1'}]}
const response=state=>async()=>({ok:true,json:async()=>state})
test('task read preserves status, explicit relations, source and contradictory metadata without mutation',async()=>{
 const state={tasks:[task],_source:{status:'AVAILABLE'},contradictions:['à revoir']}
 const before=JSON.stringify(state)
 assert.deepEqual(await readCssaTasks(response(state)),state)
 assert.equal(JSON.stringify(state),before)
})
test('missing-file templates keep MISSING metadata and cannot masquerade as AVAILABLE',async()=>{
 const state=await readCssaTasks(response({tasks:[task],_source:{status:'MISSING',fallback:'TEMPLATE'}}))
 assert.equal(state._source.status,'MISSING')
})
test('HTTP failure and malformed task registries reject instead of exposing stale work',async()=>{
 await assert.rejects(readCssaTasks(async()=>({ok:false})))
 for(const state of [null,[],{tasks:{}},{tasks:[null]},{tasks:[{id:'t'}]}])await assert.rejects(readCssaTasks(response(state)))
})
test('available empty task registry remains available with zero tasks',async()=>{
 const state=await readCssaTasks(response({tasks:[],_source:{status:'AVAILABLE'}}))
 assert.deepEqual(state.tasks,[]);assert.equal(state._source.status,'AVAILABLE')
})
test('read uses the existing local endpoint with no cache and a bounded signal',async()=>{
 await readCssaTasks(async(url,options)=>{
  assert.equal(url,'/obsidia-local/cssa-ops-state');assert.equal(options.cache,'no-store');assert.ok(options.signal instanceof AbortSignal)
  return {ok:true,json:async()=>({tasks:[]})}
 })
})
