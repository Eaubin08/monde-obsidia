import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readCssaWorldSnapshot} from '../src/cssaWorldSnapshot.ts'
const business={_source:{status:'AVAILABLE'},dossiers:[{id:'D',title:'Dossier',source:'CSSA_BUSINESS',status:'OUVERT',organizationId:'A'}],requirements:[{id:'R',dossierId:'D',label:'Pièce',documentRefId:'DOC',taskRefId:'T'}],documentRefs:[{id:'DOC',title:'Attestation',dossierId:'D',usedIn:['D']}],validations:[],submissionProofs:[],dossierOutcomes:[]}
const ops={_source:{status:'AVAILABLE'},tasks:[{id:'T',title:'Récolter pièce',status:'A_FAIRE',priority:'HAUTE',origin:'DOSSIER'}]}
const crm={_source:{status:'AVAILABLE'},organizations:[{id:'A',name:'Partenaire',status:'ACTIF'}],contacts:[],interactions:[]}
const fetcher=(mode='all')=>async(url,options)=>{
 assert.equal(options.cache,'no-store')
 assert.equal(options.method,undefined)
 const value=String(url).includes('cssa-business-state')?business:String(url).includes('cssa-ops-state')?ops:crm
 if(mode==='crm-fail'&&String(url).includes('cssa-crm-directory'))throw Error('offline')
 if(mode==='tasks-unknown'&&String(url).includes('cssa-ops-state'))return {ok:true,json:async()=>({...ops,_source:{status:'UNKNOWN'}})}
 return {ok:true,json:async()=>structuredClone(value)}
}
test('V23 assembles one cross-registry snapshot without writes',async()=>{
 const result=await readCssaWorldSnapshot(fetcher())
 assert.equal(result.schema,'OBSIDIA_CSSA_WORLD_SNAPSHOT_V0')
 assert.equal(result.model.objects.length,5)
 assert.equal(result.graph.edges.filter(e=>e.status==='RESOLVED').length,7)
 assert.equal(result.company.resolvedRelationCount,7)
 assert.deepEqual(result.sourceStatus,{business:'AVAILABLE',tasks:'AVAILABLE',crm:'AVAILABLE'})
 assert.equal(result.manifest.governance.authority,'NONE')
})
test('failed CRM read remains UNKNOWN and does not fabricate actors',async()=>{
 const result=await readCssaWorldSnapshot(fetcher('crm-fail'))
 assert.equal(result.sourceStatus.crm,'UNKNOWN')
 assert.equal(result.model.objects.some(o=>o.identity.domain==='CRM'),false)
 assert.equal(result.graph.edges.some(e=>e.status==='SOURCE_UNKNOWN'),true)
})
test('successful HTTP with non AVAILABLE metadata does not promote tasks',async()=>{
 const result=await readCssaWorldSnapshot(fetcher('tasks-unknown'))
 assert.equal(result.sourceStatus.tasks,'UNKNOWN')
 assert.equal(result.model.objects.some(o=>o.identity.domain==='OPS'),false)
 assert.ok(result.company.unknowns.some(x=>x.includes('SOURCE_UNKNOWN')))
})
