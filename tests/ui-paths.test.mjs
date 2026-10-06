import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const pokemon=readFileSync(resolve(process.cwd(),'src/LivePokemon.tsx'),'utf8')
const ecosystem=readFileSync(resolve(process.cwd(),'src/Ecosystem.tsx'),'utf8')
const workspace=readFileSync(resolve(process.cwd(),'src/ToolWorkspace.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')

test('Pokémon launcher and cross-view paths remain wired',()=>{
 assert.match(pokemon,/fetch\('\/obsidia-local\/run'/)
 assert.match(pokemon,/fetch\('\/obsidia-local\/open\/'\+agentId/)
 assert.match(pokemon,/openWorkspace\(active\)/)
 assert.match(pokemon,/location\.hash='world'/)
 assert.match(pokemon,/sessionStorage\.setItem\('obsidia-focus-entity'/)
 assert.match(pokemon,/Lancer ici/)
 assert.match(pokemon,/Ouvrir terminal/)
 assert.match(pokemon,/Workspace/)
 assert.match(pokemon,/Monde/)
})

test('Workspace integrated controls map to real bridge actions',()=>{
 assert.match(workspace,/sessionAction\('run'/)
 assert.match(workspace,/sessionAction\('input\/'\+id/)
 assert.match(workspace,/act\('stop\/'\+current\.sessionId\)/)
 assert.match(workspace,/act\('focus\/'\+current!\.sessionId\)/)
 assert.match(bridge,/url\.pathname==='\/run'/)
 assert.match(bridge,/url\.pathname\.startsWith\('\/input\/'\)/)
 assert.match(bridge,/url\.pathname\.startsWith\('\/stop\/'\)/)
 assert.match(bridge,/url\.pathname\.startsWith\('\/focus\/'\)/)
 assert.match(bridge,/url\.pathname\.startsWith\('\/open\/'\)/)
})

test('Cross-view context remains shared',()=>{
 assert.match(ecosystem,/obsidia-focus-entity/)
 assert.match(ecosystem,/obsidia-context/)
 assert.match(ecosystem,/switchView\('workspace'\)/)
 assert.match(ecosystem,/switchView\('agents'\)/)
 assert.match(pokemon,/obsidia-selected-session/)
 assert.match(pokemon,/obsidia-context/)
})

test('Pokémon visual order prioritizes work before population catalog',()=>{
 const active=pokemon.indexOf('Agents actifs')
 const launch=pokemon.indexOf('Lancer un agent')
 const scale=pokemon.indexOf('État global des agents')
 const catalog=pokemon.indexOf('Population connue')
 const village=pokemon.indexOf('Village visuel')
 const registry=pokemon.indexOf('Registre détaillé du catalogue')
 assert.ok(active>=0&&launch>active&&scale>launch&&catalog>scale&&village>catalog&&registry>village)
})
