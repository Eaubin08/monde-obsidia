import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildCssaWorldGraph} from '../src/cssaWorldGraph.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {createWorldContext} from '../src/worldReadModel.ts'
import {worldObjectKey} from '../src/worldObjectContract.ts'
const sources={
 business:{dossiers:[{id:'D1',title:'Subvention',source:'CSSA_BUSINESS',status:'OUVERT',organizationId:'A1'}],
 requirements:[{id:'R1',dossierId:'D1',label:'Attestation',documentRefId:'DOC1',taskRefId:'T1'}],
 documentRefs:[{id:'DOC1',title:'Assurance',dossierId:'D1',usedIn:['D1']}]},
 tasks:{tasks:[{id:'T1',title:'Vérifier assurance',status:'A_FAIRE'}]},
 crm:{organizations:[{id:'A1',name:'Organisme',status:'ACTIF'}]}
}
test('CSSA canonical adapter constructs connected dossier, requirement, document, task and actor graph',()=>{
 const {model,graph}=buildCssaWorldGraph(sources)
 assert.equal(model.objects.length,5)
 assert.equal(graph.edges.length,7)
 assert.ok(graph.edges.every(e=>e.status==='RESOLVED'))
 const dossier=model.objects.find(o=>o.identity.id==='D1')
 const context=createWorldContext(model,graph,worldObjectKey(dossier))
 assert.equal(context.focus?.label,'Subvention')
 // Context deliberately includes both outgoing and incoming relations: 3 + 2.
 assert.equal(context.relations.length,5)
 assert.equal(context.relations.filter(r=>r.edge.from===worldObjectKey(dossier)).length,3)
 assert.equal(context.relations.filter(r=>r.edge.to===worldObjectKey(dossier)).length,2)
 assert.equal(context.governance.authority,'NONE')
})
test('source missing stays unknown and never materializes referenced task or actor',()=>{
 const {model,graph}=buildCssaWorldGraph({...sources,tasks:null,crm:null})
 assert.equal(model.objects.length,3)
 assert.equal(graph.edges.filter(e=>e.status==='SOURCE_UNKNOWN').length,2)
 assert.equal(graph.edges.some(e=>e.status==='RESOLVED'&&e.to.includes('OPS')),false)
})
test('dangling source-available canonical ID stays BROKEN, not guessed by label',()=>{
 const {graph}=buildCssaWorldGraph({...sources,tasks:{tasks:[{id:'OTHER',title:'Vérifier assurance',status:'A_FAIRE'}]}})
 assert.equal(graph.edges.some(e=>e.status==='BROKEN'&&e.to.endsWith(':T1')),true)
})
test('company model describes observed domains without inventing roles or needs',()=>{
 const {model,graph}=buildCssaWorldGraph(sources)
 const company=projectCompanyModel('CSSA','Club',model,graph)
 assert.equal(company.objectCount,5)
 assert.equal(company.resolvedRelationCount,7)
 assert.deepEqual(company.epistemics.detectedNeeds,[])
 assert.equal(company.governance.decisionAuthority,'KX108_ONLY')
 assert.throws(()=>projectCompanyModel('OTHER','Other',model,graph),/mismatch/)
})
