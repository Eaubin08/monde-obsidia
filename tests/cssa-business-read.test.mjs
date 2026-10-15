import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCssaBusiness} from '../src/cssaBusinessRead.ts'
const empty=()=>({dossiers:[],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[],_source:{status:'AVAILABLE'}})
const response=state=>async()=>({ok:true,json:async()=>state})
test('available empty Business registry is distinct from missing, invalid or unreadable source metadata',async()=>{
 for(const status of ['AVAILABLE','MISSING','INVALID','UNREADABLE']){
  const state=empty();state._source.status=status
  assert.deepEqual(await readCssaBusiness(response(state)),state)
 }
})
test('all projection collections must be present and readable',async()=>{
 for(const key of ['dossiers','requirements','documentRefs','validations','submissionProofs','dossierOutcomes']){
  for(const invalid of [undefined,{},[null],[{id:1}],['row']]){
   const state=empty();state[key]=invalid
   await assert.rejects(readCssaBusiness(response(state)))
  }
 }
})
test('read preserves independent requirements, proof references, contradictions and UNKNOWN without promotion',async()=>{
 const state={...empty(),dossiers:[{id:'d',status:'EN_PREPARATION',source:'UNKNOWN'}],requirements:[{id:'r',dossierId:'d',state:'MANQUANT',taskRefId:'t'}],submissionProofs:[{id:'p',dossierId:'d',proofRef:'UNKNOWN'}],contradictions:['à revoir']}
 const before=JSON.stringify(state)
 assert.deepEqual(await readCssaBusiness(response(state)),state)
 assert.equal(JSON.stringify(state),before)
})
test('HTTP, JSON and transport failures reject instead of retaining stale content',async()=>{
 for(const fetcher of [async()=>({ok:false}),async()=>({ok:true,json:async()=>{throw Error('invalid json')}}),async()=>{throw Error('offline')}])await assert.rejects(readCssaBusiness(fetcher))
})
test('reads the served Business endpoint without cache and with a timeout signal',async()=>{
 await readCssaBusiness(async(url,options)=>{
  assert.equal(url,'/obsidia-local/cssa-business-state');assert.equal(options.cache,'no-store');assert.ok(options.signal instanceof AbortSignal)
  return {ok:true,json:async()=>empty()}
 })
})
