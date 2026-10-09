import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {resolve} from 'node:path'

const pokemon=readFileSync(resolve(process.cwd(),'src/LivePokemon.tsx'),'utf8')
const ecosystem=readFileSync(resolve(process.cwd(),'src/Ecosystem.tsx'),'utf8')
const workspace=readFileSync(resolve(process.cwd(),'src/ToolWorkspace.tsx'),'utf8')
const supervisedPanel=readFileSync(resolve(process.cwd(),'src/SupervisedMissionPanel.tsx'),'utf8')
const bridge=readFileSync(resolve(process.cwd(),'server/local-bridge.mjs'),'utf8')
const stateProjection=readFileSync(resolve(process.cwd(),'server/obsidia-state.mjs'),'utf8')
const jarjarLauncher=readFileSync(resolve(process.cwd(),'scripts/start-jarjar-full.ps1'),'utf8')
const serviceLauncher=readFileSync(resolve(process.cwd(),'scripts/start-service-colored.ps1'),'utf8')

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

test('Workspace exposes supervised mission readonly projection without authority controls',()=>{
 for(const invariant of [
  "import SupervisedMissionPanel",
  '<SupervisedMissionPanel/>',
 ]) assert.ok(workspace.includes(invariant),invariant)
 for(const invariant of [
  '/obsidia-local/supervised-mission/projection',
  'MISSION SUPERVISÉE · READONLY',
  'PREPARED',
  'AUTHORIZED',
  'EXECUTED_OBSERVED',
  'AWAITING_VERIFICATION',
  'VERIFIED',
  'CLOSED',
  'MISSION_DONE_VERIFIED',
  'HOLD',
  'Binder',
  'Checkpoint / reprise',
 ]) assert.ok(supervisedPanel.includes(invariant),invariant)
 for(const forbidden of ['dangerouslySetInnerHTML','APPROVE','RESUME_EXECUTE','REPAIR'])assert.equal(supervisedPanel.includes(forbidden),false,forbidden)
 for(const invariant of [
  "'/supervised-mission/projection'",
  'supervisedMissionReadonlyProjection',
  'UPSTREAM_AUTH_DENIED',
  'UPSTREAM_API_UNAVAILABLE',
  'worktree_visible',
 ]) assert.ok(bridge.includes(invariant),invariant)
})

test('Cross-view context remains shared',()=>{
 for(const invariant of ['obsidia-focus-entity','obsidia-context',"switchView('workspace')","switchView('agents')"])assert.ok(ecosystem.includes(invariant),invariant)
 for(const invariant of ['obsidia-selected-session','obsidia-context'])assert.ok(pokemon.includes(invariant),invariant)
})

test('Pokémon keeps every existing block after navigation redesign',()=>{
 for(const invariant of [
  'État global des agents',
  'Agents actifs',
  'pokemon-v3-inspector',
  'Lancer un agent',
  'PARCOURS VIVANT',
  'MISSIONS / ÉQUIPES',
  'Population connue',
  'Village visuel',
  'Registre détaillé du catalogue',
  'Lancer Jarjar',
  'Kernel 3001',
  'Brody/API 8000',
 ]) assert.ok(pokemon.includes(invariant),invariant)
 assert.ok(!pokemon.includes('pokemon-cockpit-nav'))
})

test('Shared navigation exposes Search and contextual quick links',()=>{
 for(const invariant of [
  "['world','Monde']",
  "['workspace','Workspace']",
  "['agents','Pokémon']",
  "['search','Recherche']",
  "view==='search'",
  'obs-quick-links',
  "openSearch('agent')",
  "openSearch('file')",
  "openSearch('domain')",
  "openSearch('proof')",
 ]) assert.ok(ecosystem.includes(invariant),invariant)
})





test('Jarjar remains a real observed and controlled local stack',()=>{
 for(const invariant of [
  "fetch('/obsidia-local/jarjar/status'",
  "Lancer Jarjar",
  "Arrêter Jarjar",
  "Kernel 3001",
  "Brody/API 8000",
  "Qwen texte 8080",
  "Qwen-VL 8081",
  "HUD Jarjar",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 for(const invariant of [
  "jarjarObservedStatus",
  "'/jarjar/status'",
  "'/jarjar/stop'",
  "jarjarModuleFile='scripts/run_jarjar_live.py'",
  "state='STARTING'",
  "'READY':'DEGRADED'",
 ]) assert.ok(bridge.includes(invariant),invariant)
 for(const invariant of [
  "server.kernel.sealed.cjs",
  "apps.obsidia_api.main:app",
  "start_qwen_text.ps1",
  "start_qwen_vl.ps1",
  "scripts.run_jarjar_live",
  "JARJAR_OBSIDIA_CHAT_URL='http://127.0.0.1:8000/api/brody/chat'",
  "JARJAR_QWEN_URL='http://127.0.0.1:8080/v1/chat/completions'",
  "JARJAR_VISION_URL='http://127.0.0.1:8081/v1/chat/completions'",
 ]) assert.ok(jarjarLauncher.includes(invariant),invariant)
 assert.ok(!pokemon.includes('JarjarCockpit'))
})

test('Jarjar telemetry exposes input mode cognition and authority',()=>{
 for(const invariant of [
  "inputMode:telemetry?.mode||null",
  "cognitionSource:telemetry?.cognition_source||''",
  "decisionAuthority:telemetry?.decision_authority||'KX108_ONLY'",
  "telemetryFresh:!!telemetry",
 ]) assert.ok(bridge.includes(invariant),invariant)
 for(const invariant of [
  "Entrée",
  "Cognition",
  "Session voix",
  "jarjarStatus?.inputMode",
  "jarjarStatus?.cognitionSource",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Jarjar Pokemon exposes activity governance and last result',()=>{
 for(const invariant of [
  "confirmationPrompt:telemetry?.confirmation_prompt||''",
  "lastUserInput:telemetry?.last_user_input||''",
  "lastResult:telemetry?.last_result||''",
 ]) assert.ok(bridge.includes(invariant),invariant)
 for(const invariant of [
  "Activité",
  "Gouvernance",
  "Source gouvernée",
  "Confirmation",
  "Dernier input",
  "Dernier résultat",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Jarjar is one shared object across World Workspace and Pokemon',()=>{
 for(const invariant of [
  "const jarjar=live?.jarjar",
  "source:'JARJAR_RUNTIME_STATUS_V1'",
  "jarjarRuntime:true",
  "inputMode:jarjar.inputMode||null",
  "cognitionSource:jarjar.cognitionSource||''",
 ]) assert.ok(stateProjection.includes(invariant),invariant)
 assert.ok(bridge.includes("live.jarjar=jarjarObservedStatus()"))
 for(const invariant of [
  "const jarjarShared=",
  "const jarjarContextId=",
  "openWorkspace(jarjarShared)",
  "selectContext(jarjarContextId)",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Validated native services share one observed state across views',()=>{
 for(const invariant of [
  "function nativeServicesObservedStatus()",
  "PORT_3001",
  "PORT_8000",
  "PROCESS_AVIATION_ROBO",
  "PROCESS_TRADING_LIVE",
  "PROCESS_BRODY_ENRICHED",
  "PROCESS_OBSIDURE_DRY",
  "live.nativeServices=nativeServicesObservedStatus()",
 ]) assert.ok(bridge.includes(invariant),invariant)
 for(const invariant of [
  "for(const service of live?.nativeServices||[])",
  "source:'NATIVE_SERVICE_OBSERVATION_V1'",
  "nativeService:true",
  "existingLive.presence='ended'",
  "observationEvidence:service.evidence",
 ]) assert.ok(stateProjection.includes(invariant),invariant)
})

test('Validated Obsidia service terminals remain wired individually',()=>{
 for(const invariant of [
  "['kernel-x108','Kernel X108',true]",
  "['obsidia-api','API Obsidia + Brody + Native Memory',true]",
  "['gps-defense','GPS / Defense / Aviation',true]",
  "['trading-x108','Trading → X108',true]",
  "['brody-enriched','Brody Enriched',true]",
  "['obsidure-dry','Obsidure DryRun',true]",
  "terminalOnly=new Set",
  "'Lancer terminal'",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 for(const invariant of [
  "'kernel-x108'",
  "'obsidia-api'",
  "'gps-defense'",
  "'trading-x108'",
  "'brody-enriched'",
  "'obsidure-dry'",
  "server.kernel.sealed.cjs",
  "apps.obsidia_api.main:app",
  "connectors\\aviation_robo.py",
  "connectors\\trading_live.py",
  "run_brody_terminal_enriched.ps1",
  "run_agent_obsidure.ps1 -DryRun",
 ]) assert.ok((bridge+'\n'+serviceLauncher).includes(invariant),invariant)
})
