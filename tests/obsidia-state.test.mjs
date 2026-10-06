import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildObsidiaState} from '../server/obsidia-state.mjs'

test('shared Obsidia state is a readonly projection, not a competing truth model',()=>{
 const snapshot={
  available:true,repository:'C:/OBSIDIA',sha:'abc123',branch:'main',observedAt:'2026-10-06T05:00:00Z',
  proposals:[{id:'p1',path:'_PATCH_PROPOSALS/p1/proposal.json',receipt:'_PATCH_PROPOSALS/p1/RECEIPT.md',observedAt:'2026-10-06T05:00:00Z'}]
 }
 const live={observedAt:'2026-10-06T05:00:01Z',sessions:[{
  sessionId:'s1',agentId:'obsidure',name:'Obsidure',status:'working',phase:'AUDIT',presence:'live',
  objective:'Auditer M8-E',timestamp:'2026-10-06T05:00:01Z',repository:'C:/OBSIDIA',events:[]
 }]}
 const state=buildObsidiaState(snapshot,live)
 assert.equal(state.readonly,true)
 assert.equal(state.canonicalTruth,false)
 assert.equal(state.decisionAuthority,'KX108_ONLY')
 assert.equal(state.entities.filter(e=>e.id==='session:s1').length,1)
 assert.ok(state.views.world.entityRefs.includes('session:s1'))
 assert.ok(state.views.workspace.entityRefs.includes('session:s1'))
 assert.ok(state.views.pokemon.entityRefs.includes('session:s1'))
 assert.ok(state.relations.some(r=>r.from==='agent:obsidure'&&r.type==='RUNS'&&r.to==='session:s1'))
 assert.ok(state.relations.some(r=>r.from==='session:s1'&&r.type==='HAS_OBJECTIVE'&&r.to==='objective:s1'))
 assert.equal(state.entities.find(e=>e.id==='objective:s1')?.label,'Auditer M8-E')
 assert.equal(state.entities.some(e=>e.id==='project:sens'),false)
 assert.ok(state.relations.some(r=>r.from==='proposal:p1'&&r.type==='HAS_RECEIPT'))
})
