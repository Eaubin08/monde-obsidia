import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const ecosystem=readFileSync(resolve(process.cwd(),'src/Ecosystem.tsx'),'utf8')
const pokemon=readFileSync(resolve(process.cwd(),'src/LivePokemon.tsx'),'utf8')
const search=readFileSync(resolve(process.cwd(),'src/GlobalSearch.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')
const state=readFileSync(resolve(process.cwd(),'server/obsidia-state.mjs'),'utf8')

test('V4 preserves primary views and shared context',()=>{
 for(const x of [
  "['world','Monde']","['workspace','Workspace']","['agents','Pokémon']","['search','Recherche']",
  'obsidia-focus-entity','obsidia-context'
 ]) assert.ok(ecosystem.includes(x),x)
})

test('V4 preserves Pokemon capabilities',()=>{
 for(const x of [
  'État global des agents','Agents actifs','pokemon-v3-inspector','Lancer un agent',
  'Lancer Jarjar','Kernel X108','API Obsidia + Brody + Native Memory','GPS / Defense / Aviation',
  'Trading → X108','Brody Enriched','Obsidure DryRun','PARCOURS VIVANT',
  'MISSIONS / ÉQUIPES','Population connue','Village visuel','Registre détaillé du catalogue'
 ]) assert.ok(pokemon.includes(x),x)
})

test('V4 preserves Workspace and World capabilities',()=>{
 for(const x of [
  "Aujourd'hui",'Brody','Obsidure','CLI','Fichiers & preuves',
  'Activité','R&D / Build','Agents & organes','Gouvernance & preuves',
  'Objets & résultats','Domaines','Couches documentaires'
 ]) assert.ok(ecosystem.includes(x),x)
})

test('V4 preserves Search capabilities',()=>{
 for(const x of ['RECHERCHE GLOBALE','Agents','Missions','Domaines','Fichiers','Preuves / résultats','Couches'])
  assert.ok(search.includes(x),x)
})

test('V4 does not replace canonical observation backend',()=>{
 for(const x of ['nativeServicesObservedStatus','jarjarObservedStatus','KX108_ONLY']) assert.ok(bridge.includes(x),x)
 for(const x of ['NATIVE_SERVICE_OBSERVATION_V1','JARJAR_RUNTIME_STATUS_V1']) assert.ok(state.includes(x),x)
})
