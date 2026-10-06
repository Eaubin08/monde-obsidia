import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const pokemon=readFileSync(resolve(process.cwd(),'src/LivePokemon.tsx'),'utf8')
const ecosystem=readFileSync(resolve(process.cwd(),'src/Ecosystem.tsx'),'utf8')
const workspace=readFileSync(resolve(process.cwd(),'src/ToolWorkspace.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')
const jarjar=readFileSync(resolve(process.cwd(),'src/JarjarCockpit.tsx'),'utf8')

test('Pokémon launcher and cross-view paths remain wired',()=>{
 for(const invariant of [
  "'/obsidia-local/run'",
  "'/obsidia-local/open/'+agentId",
  'Lancer ici',
  'Ouvrir terminal',
  'Workspace',
  'Monde',
  'obsidia-focus-entity',
  "location.hash='world'",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 assert.ok(pokemon.includes('openWorkspace(active)'))
})

test('Workspace integrated controls map to real bridge actions',()=>{
 for(const invariant of [
  "sessionAction('run'",
  "sessionAction('input/'+id",
  "act('stop/'+current.sessionId)",
  "act('focus/'+current!.sessionId)",
 ]) assert.ok(workspace.includes(invariant),invariant)
 for(const route of ['/run','/input/','/stop/','/focus/','/open/'])assert.ok(bridge.includes(route),route)
})

test('Cross-view context remains shared',()=>{
 for(const invariant of ['obsidia-focus-entity','obsidia-context',"switchView('workspace')","switchView('agents')"])assert.ok(ecosystem.includes(invariant),invariant)
 for(const invariant of ['obsidia-selected-session','obsidia-context'])assert.ok(pokemon.includes(invariant),invariant)
})

test('Pokémon visual order prioritizes work before population catalog',()=>{
 const active=pokemon.indexOf('Agents actifs')
 const launch=pokemon.indexOf('Lancer un agent')
 const scale=pokemon.indexOf('État global des agents')
 const catalog=pokemon.indexOf('Population connue')
 const village=pokemon.indexOf('Village visuel')
 const registry=pokemon.indexOf('Registre détaillé du catalogue')
 assert.ok(active>=0,'active missing')
 assert.ok(launch>active,'launcher must follow active work')
 assert.ok(scale>launch,'global state must follow launcher')
 assert.ok(catalog>scale,'catalog must follow state summary')
 assert.ok(village>catalog,'village must follow catalog')
 assert.ok(registry>village,'registry must remain last')
})


test('Jarjar cockpit stays on canonical governed paths',()=>{
 for(const invariant of [
  "scripts.run_jarjar_cockpit",
  "/jarjar/status",
  "/jarjar/health",
  "/jarjar/capabilities",
  "/jarjar/text",
  "/jarjar/voice/toggle",
  "/jarjar/voice/listen",
  "/jarjar/observe",
  "decisionAuthority:'KX108_ONLY'",
 ]) assert.ok(bridge.includes(invariant),invariant)
 for(const invariant of [
  'START JARJAR','STOP JARJAR','RESTART JARJAR',
  '/obsidia-local/jarjar/text',
  '/obsidia-local/jarjar/voice/toggle',
  '/obsidia-local/jarjar/voice/listen',
  '/obsidia-local/jarjar/observe',
  'Jarjar authority = NONE',
 ]) assert.ok(jarjar.includes(invariant),invariant)
})
