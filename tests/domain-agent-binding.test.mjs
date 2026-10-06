import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildObsidiaState} from '../server/obsidia-state.mjs'

test('declared Sigma agents bind live sessions to their canonical domain without duplication',()=>{
 const snapshot={
  available:true,repository:'C:/OBSIDIA',sha:'abc123',branch:'main',observedAt:'2026-10-06T05:10:00Z',proposals:[],
  sigmaDomains:[{
   id:'gps_defense_aviation',
   displayName:'GPS / Defense / Aviation Safety',
   source:'sigma/registry.py',
   sourcePath:'sigma/domains/gps_defense_aviation_agents.py',
   runtimeFilePresent:true,
   agents:['SourceAvailabilityAgent','TrajectoryIntegrityAgent']
  }]
 }
 const live={observedAt:'2026-10-06T05:10:01Z',sessions:[{
  sessionId:'gps-session-1',
  agentId:'SourceAvailabilityAgent',
  name:'SourceAvailabilityAgent',
  status:'working',
  phase:'AUDIT',
  presence:'live',
  objective:'Vérifier la disponibilité des sources',
  timestamp:'2026-10-06T05:10:01Z',
  repository:'C:/OBSIDIA',
  events:[]
 }]}
 const state=buildObsidiaState(snapshot,live)
 assert.equal(state.entities.filter(e=>e.id==='agent:SourceAvailabilityAgent').length,1)
 assert.ok(state.relations.some(r=>r.from==='domain:gps_defense_aviation'&&r.type==='HAS_AGENT'&&r.to==='agent:SourceAvailabilityAgent'))
 assert.ok(state.relations.some(r=>r.from==='agent:SourceAvailabilityAgent'&&r.type==='BELONGS_TO_DOMAIN'&&r.to==='domain:gps_defense_aviation'))
 assert.ok(state.relations.some(r=>r.from==='agent:SourceAvailabilityAgent'&&r.type==='RUNS'&&r.to==='session:gps-session-1'))
 assert.ok(state.relations.some(r=>r.from==='session:gps-session-1'&&r.type==='RUNS_IN_DOMAIN'&&r.to==='domain:gps_defense_aviation'))
})
