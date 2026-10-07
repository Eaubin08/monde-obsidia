import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const root=readFileSync(resolve(process.cwd(),'src/V5Root.tsx'),'utf8')
const pokemon=readFileSync(resolve(process.cwd(),'src/V5Pokemon.tsx'),'utf8')
const launchers=readFileSync(resolve(process.cwd(),'src/V5Launchers.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')
const stateProjection=readFileSync(resolve(process.cwd(),'server/obsidia-state.mjs'),'utf8')
const jarjarLauncher=readFileSync(resolve(process.cwd(),'scripts/start-jarjar-full.ps1'),'utf8')

test('V5 cross-view navigation stays wired',()=>{
 for(const invariant of [
  "sessionStorage.setItem('obsidia-focus-entity'",
  "window.dispatchEvent(new CustomEvent('obsidia-context'",
  "sessionStorage.setItem('obsidia-workspace-area'",
  "location.hash='workspace'",
 ]) assert.ok((root+'\n'+pokemon).includes(invariant),invariant)
 assert.ok(root.includes("sessionStorage.getItem('obsidia-workspace-area')"))
 assert.ok(root.includes("openContextWorkspace"))
 assert.ok(root.includes("focusSearchAgent"))
 assert.ok(root.includes("setWorldZone('activity')"))
 assert.ok(pokemon.includes("window.addEventListener('obsidia-context'"))
})

test('Workspace launchers map to real bridge routes',()=>{
 for(const invariant of [
  "'/obsidia-local/open/'",
  "'/obsidia-local/jarjar/stop'",
  "['kernel-x108','Kernel X108','service']",
  "['obsidia-api','API Obsidia + Brody + Native Memory','service']",
  "['gps-defense','GPS / Defense / Aviation','service']",
  "['trading-x108','Trading → X108','service']",
 ]) assert.ok(launchers.includes(invariant),invariant)
 for(const route of ["/run","/input/","/stop/","/focus/","/open/","/jarjar/status","/jarjar/stop"])assert.ok(bridge.includes(route),route)
})

test('Jarjar runtime is shared across state and views',()=>{
 for(const invariant of [
  "const jarjar=live?.jarjar",
  "source:'JARJAR_RUNTIME_STATUS_V1'",
  "jarjarRuntime:true",
  "inputMode:jarjar.inputMode||null",
  "cognitionSource:jarjar.cognitionSource||''",
 ]) assert.ok(stateProjection.includes(invariant),invariant)
 for(const invariant of [
  "inputMode?:string|null",
  "cognitionSource?:string",
  "decisionAuthority?:string",
  "current.jarjarRuntime",
  "Télémétrie",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Qwen text uses direct local llama launch and current diagnostic log',()=>{
 for(const invariant of [
  "'-hfr', $qwenRepo",
  "'-hff', $qwenFile",
  "Wait-Service 8080 'QWEN TEXT'",
  "Qwen texte :8080 non READY",
 ]) assert.ok(jarjarLauncher.includes(invariant),invariant)
 assert.ok(bridge.includes("jarjar_qwen_text_llama.log"))
 assert.ok(!bridge.includes("const log=resolve(local,'Obsidia','jarjar_qwen_text.log')"))
})

test('Sigma projection does not claim verified READY from API alone',()=>{
 assert.ok(bridge.includes("API_READY_UNVERIFIED"))
 assert.ok(bridge.includes("API_8000_PRESENT_ROUTE_NOT_PROBED"))
})

test('Pokemon lifecycle includes catalog available and inactive agents',()=>{
 for(const invariant of [
  "const availableIds=",
  "const inactiveIds=",
  "Prêt à être lancé",
  "Non observé localement",
  "CYCLE VIVANT",
  "MISSIONS / ÉQUIPES",
  "Registre détaillé",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})


test('Kernel and API READY require canonical process identity',()=>{
 for(const invariant of [
  "PORT_3001_CANONICAL_PROCESS",
  "PORT_8000_CANONICAL_PROCESS",
  "PORT_3001_FOREIGN_PROCESS",
  "PORT_8000_FOREIGN_PROCESS",
  "canonicalPortOwner('kernel-x108'",
  "canonicalPortOwner('obsidia-api'",
  "Pré-requis Jarjar refusé",
 ]) assert.ok(bridge.includes(invariant),invariant)
 assert.ok(!bridge.includes("ready:portOpen(3001)"))
 assert.ok(!bridge.includes("ready:portOpen(8000)"))
})

test('Jarjar prefers a completed local Qwen GGUF',()=>{
 for(const invariant of [
  "OBSIDIA_QWEN_TEXT_MODEL",
  "Desktop\\MODELS\\QWEN\\qwen2.5-3b-instruct-q4_k_m.gguf",
  "$qwenLocalModel",
  "'-m', $qwenLocalModel",
 ]) assert.ok(jarjarLauncher.includes(invariant),invariant)
})
