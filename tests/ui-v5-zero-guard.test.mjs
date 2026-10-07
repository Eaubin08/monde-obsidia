import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const root=readFileSync(resolve(process.cwd(),'src/V5Root.tsx'),'utf8')
const main=readFileSync(resolve(process.cwd(),'src/main.tsx'),'utf8')
const pokemon=readFileSync(resolve(process.cwd(),'src/V5Pokemon.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')
const state=readFileSync(resolve(process.cwd(),'server/obsidia-state.mjs'),'utf8')

test('V5 is the active frontend and has one primary navigation',()=>{
 assert.ok(main.includes("import App from './V5Root.tsx'"))
 for(const x of ["['world','Monde']","['workspace','Workspace']","['agents','Pokémon']","['search','Recherche']"])assert.ok(root.includes(x),x)
 assert.ok(root.includes('v5-sidebar'))
 assert.ok(root.includes('v5-topbar'))
})

test('V5 reuses canonical data endpoints',()=>{
 for(const x of ["/obsidia-local/snapshot","/obsidia-local/state","/obsidia-local/file?path="])assert.ok(root.includes(x),x)
 for(const x of ['nativeServicesObservedStatus','jarjarObservedStatus','KX108_ONLY'])assert.ok(bridge.includes(x),x)
 for(const x of ['NATIVE_SERVICE_OBSERVATION_V1','JARJAR_RUNTIME_STATUS_V1'])assert.ok(state.includes(x),x)
})

test('V5 preserves functional capabilities without legacy renderers',()=>{
 for(const x of ['<V5Pokemon/>',"workspaceArea==='brody'","workspaceArea==='obsidure'","workspaceArea==='cli'","workspaceArea==='files'","view==='search'","worldZone==='layers'"])assert.ok(root.includes(x),x)
 for(const x of ['sessionAction(\'run\'','sessionAction(\'input/\'','sessionAction(\'stop/\''])assert.ok(root.includes(x),x)
})

test('Pokemon block keeps its existing capabilities',()=>{
 for(const x of [
  'Total','Agents actifs','Lancer un agent ou un service','Lancer Jarjar',
  'Kernel X108','API Obsidia + Brody + Native Memory','GPS / Defense / Aviation',
  'Trading → X108','Brody Enriched','Obsidure DryRun','PARCOURS VIVANT',
  'MISSIONS / ÉQUIPES','POPULATION CONNUE','Village visuel','Registre détaillé du catalogue'
 ])assert.ok(pokemon.includes(x),x)
})

test('V5 keeps World Workspace Search categories',()=>{
 for(const x of ['Activité','R&D / Build','Agents & organes','Gouvernance & preuves','Objets & résultats','Domaines','Couches documentaires',"Aujourd'hui",'Fichiers & preuves','Activité récente'])assert.ok(root.includes(x),x)
})
