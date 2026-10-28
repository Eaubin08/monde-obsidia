import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCanonicalSourceEvidence} from '../src/worldCanonicalSourceReader.ts'
const business={_source:{status:'AVAILABLE',observedAt:'2026-10-28T10:00:00Z'},dossiers:[{id:'D1',title:'First'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]}
const ops={_source:{status:'UNKNOWN'},tasks:[{id:'T1',title:'Task',status:'OPEN',priority:'LOW',origin:'TEST'}]}
const crm={_source:{status:'AVAILABLE'},organizations:[{id:'O1',name:'Supplier'}],contacts:[],interactions:[]}
const fetcher=async(url,options)=>{
 assert.equal(options.cache,'no-store')
 const value=String(url).includes('business-state')?business:String(url).includes('ops-state')?ops:crm
 return {ok:true,json:async()=>structuredClone(value)}
}
test('V37 GET reads source registry once and resolves exact source record',async()=>{
 let count=0
 const result=await readCanonicalSourceEvidence([{registry:'BUSINESS',collection:'dossiers',id:'D1'},{registry:'BUSINESS',collection:'dossiers',id:'D2'}],async(...args)=>{count++;return fetcher(...args)})
 assert.equal(count,1)
 assert.equal(result.records[0].status,'OBSERVED_RECORD')
 assert.equal(result.records[0].observedAt,'2026-10-28T10:00:00Z')
 assert.equal(result.records[1].status,'RECORD_NOT_FOUND')
 assert.equal(result.governance.authority,'NONE')
})
test('V37 unavailable source does not promote a returned template record',async()=>{
 const result=await readCanonicalSourceEvidence([{registry:'OPS',collection:'tasks',id:'T1'}],fetcher)
 assert.equal(result.records[0].status,'SOURCE_UNKNOWN')
 assert.equal(result.records[0].record,null)
})
test('V37 no arbitrary match or unsupported collection',async()=>{
 const twice={...business,dossiers:[business.dossiers[0],business.dossiers[0]]}
 const result=await readCanonicalSourceEvidence([{registry:'BUSINESS',collection:'dossiers',id:'D1'},{registry:'BUSINESS',collection:'passwords',id:'D1'}],async()=>({ok:true,json:async()=>twice}))
 assert.equal(result.records[0].status,'AMBIGUOUS_RECORD')
 assert.equal(result.records[1].status,'COLLECTION_UNSUPPORTED')
})
test('V37 source failures fail closed, never fabricate proof',async()=>{
 const result=await readCanonicalSourceEvidence([{registry:'CRM',collection:'organizations',id:'O1'}],async()=>{throw Error('offline')})
 assert.equal(result.records[0].status,'SOURCE_UNKNOWN')
 assert.equal(result.records[0].record,null)
})
