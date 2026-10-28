import {test} from 'node:test'
import assert from 'node:assert/strict'
import {projectWorldObject} from '../src/worldObjectContract.ts'
import {buildWorldReadModel} from '../src/worldReadModel.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
import {readCssaWorldSnapshot} from '../src/cssaWorldSnapshot.ts'
const entry=(organizationId,available=true)=>projectWorldObject({organizationId,domain:'OPS',kind:'TASK',id:'T1',label:'Tâche',sourceId:'CANONICAL_OPS',available,truth:'DECLARED',pattern:'TASK_VIEW',capabilities:['TASK_READ']})
test('capabilities are scoped to one organization and represent source observation, not execution permission',()=>{
 const model=buildWorldReadModel('A',[entry('A'),entry('B')])
 const registry=buildCapabilityRegistry(model,[{domain:'OPS',id:'TASK_READ'},{domain:'OPS',id:'TASK_WRITE'}])
 assert.equal(registry.organizationId,'A')
 assert.deepEqual(registry.records.map(x=>[x.id,x.state]),[['TASK_READ','OBSERVED_SOURCE'],['TASK_WRITE','DECLARED_ONLY']])
 assert.equal(registry.records[0].executionAuthority,'NONE')
 assert.equal(registry.governance.decisionAuthority,'KX108_ONLY')
})
test('unavailable source cannot become observed capability',()=>{
 const model=buildWorldReadModel('A',[entry('A',false)])
 const registry=buildCapabilityRegistry(model,[{domain:'OPS',id:'TASK_READ'}])
 assert.equal(registry.records[0].state,'DECLARED_ONLY')
 assert.deepEqual(registry.records[0].objectKeys,[])
})
test('snapshot surfaces registry without inferring rights from a successful GET',async()=>{
 const data={
  business:{_source:{status:'AVAILABLE'},dossiers:[{id:'D',title:'D',source:'CSSA_BUSINESS',status:'OUVERT',organizationId:null}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[]},
  tasks:{_source:{status:'UNKNOWN'},tasks:[]},crm:{_source:{status:'UNKNOWN'},organizations:[],contacts:[],interactions:[]}
 }
 const fetcher=async(url,options)=>{
  assert.equal(options.method,undefined)
  const value=String(url).includes('business-state')?data.business:String(url).includes('ops-state')?data.tasks:data.crm
  return {ok:true,json:async()=>structuredClone(value)}
 }
 const result=await readCssaWorldSnapshot(fetcher)
 assert.equal(result.capabilityRegistry.records.some(x=>x.id==='DOSSIERS'&&x.state==='OBSERVED_SOURCE'),true)
 assert.equal(result.capabilityRegistry.records.some(x=>x.executionAuthority!=='NONE'),false)
 assert.equal(result.sourceStatus.tasks,'UNKNOWN')
})
