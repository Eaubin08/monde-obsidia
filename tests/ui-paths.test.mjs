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

test('Qwen text uses the frozen local GGUF without automatic network fallback',()=>{
 for(const invariant of [
  "Desktop\\MODELS\\QWEN\\qwen2.5-3b-instruct-q4_k_m.gguf",
  "Desktop\\llama-b11193\\llama-server.exe",
  "Aucun telechargement automatique",
  "'-m', $qwenLocalModel",
  "Wait-Service 8080 'QWEN TEXT'",
  "Qwen texte :8080 non READY",
 ]) assert.ok(jarjarLauncher.includes(invariant),invariant)
 for(const forbidden of ["'-hfr'", "'-hff'", "Clear-QwenBrokenDownload", "downloadInProgress"]) assert.ok(!jarjarLauncher.includes(forbidden),forbidden)
 assert.ok(bridge.includes("jarjar_qwen_text_llama.log"))
 assert.ok(!bridge.includes("const log=resolve(local,'Obsidia','jarjar_qwen_text.log')"))
})

test('Sigma READY requires the canonical readonly F63 monitoring route',()=>{
 for(const invariant of [
  "canonicalSigmaMonitoringStatus",
  "/api/periphery/monitoring/sigma/domains",
  "SIGMA_F63_DOMAINS_ROUTE_VERIFIED",
  "SIGMA_F63_ROUTE_INVALID_PAYLOAD",
  "decision_authority==='KX108_ONLY'",
  "d?.readonly===true",
  "d?.emits_act===false",
  "d?.kernel_mutation===false",
  "['bank','trading','ecom','gps_defense_aviation']",
  "sigmaProbe.ready?'READY':api?.ready?'ROUTE_UNVERIFIED':'OFFLINE'",
 ]) assert.ok(bridge.includes(invariant),invariant)
 assert.ok(!bridge.includes("API_READY_UNVERIFIED"))
 assert.ok(!bridge.includes("API_8000_PRESENT_ROUTE_NOT_PROBED"))
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
  "canonicalPortOwner('qwen-text'",
  "canonicalPortOwner('qwen-vl'",
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

test('Monde exposes navigable territories without inventing new runtime truth',()=>{
 for(const invariant of [
  "['territories','Territoires']",
  "Terrains & domaines",
  "R&D / Build",
  "Agents & organes",
  "Gouvernance & preuves",
  "Objets & résultats",
  "Couches documentaires",
  "const territoryCards=useMemo",
  "territoryCards.map(t=>",
  "setWorldZone(t.zone)",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde territories expose sublayers as navigation projection only',()=>{
 for(const invariant of [
  "const territorySublayers",
  "Observations / terrain",
  "Traduction domaine",
  "Runtime domaine",
  "Preuves / gouvernance",
  "Chantiers",
  "Cycle de vie",
  "projection de navigation",
  "territorySublayers[worldZone]",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde territories project only observed relation mechanisms',()=>{
 for(const invariant of [
  "const territoryRelationTypes",
  "HAS_DOMAIN",
  "RUNS_IN_DOMAIN",
  "AUTHORIZES_RECEIPT",
  "PROVES_IMPACT",
  "const observedMechanisms",
  "shared.relations",
  "LIAISONS OBSERVÉES",
  "Mécanismes visibles dans la projection",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Observed Monde mechanisms are clickable and reveal their concrete relations',()=>{
 for(const invariant of [
  "const [selectedMechanism,setSelectedMechanism]",
  "const mechanismRelations",
  "shared.relations.filter(r=>r.type===selectedMechanism)",
  "aria-pressed={selectedMechanism===x.type}",
  "onClick={()=>setSelectedMechanism(selectedMechanism===x.type?'':x.type)}",
  "className=\"v5-mechanism-detail\"",
  "onClick={()=>openWorldObject(r.from)}",
  "onClick={()=>openWorldObject(r.to)}",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde territory cards summarize only observed state and expose sublayers',()=>{
 for(const invariant of [
  "const territoryCards=useMemo",
  "runtime non confirmé",
  "bloqués observés",
  "missions bloquées",
  "runtime canonique",
  "non revendiqué",
  "className=\"v5-territory-map\"",
  "className=\"v5-territory-card\"",
  "className=\"v5-territory-facts\"",
  "className=\"v5-territory-sublayers\"",
  "Ouvrir le territoire →",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde supports micro macro navigation between territory and concrete object',()=>{
 for(const invariant of [
  "const zoneForEntity",
  "const openWorldObject",
  "const backToTerritories",
  "aria-label=\"Navigation micro macro\"",
  "← Territoires",
  "Son territoire",
  "openWorldObject(r.from)",
  "openWorldObject(r.to)",
  "openWorldObject(item.id)",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde territories expose observed state blocker proof and advisory next action',()=>{
 for(const invariant of [
  "const currentTerritory",
  "Aucun blocage observé",
  "Aucune action dérivée de la projection.",
  "runtime(s) domaine non confirmé(s)",
  "mission(s) avec blocage de traçabilité",
  "recommendedNextStep",
  "className=\"v5-territory-health\"",
  "BLOCAGE",
  "PREUVE",
  "PROCHAINE ACTION",
  "sans autorité d’action",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde connects observed mission routines to territory mechanisms without inventing chronology',()=>{
 for(const invariant of [
  "const observedRoutines=useMemo",
  "const territoryRoutines=useMemo",
  "Projection de traçabilité",
  "Aucun ordre temporel supplémentaire n’est inféré.",
  "USES_AGENT",
  "HAS_SESSION",
  "HAS_RESULT",
  "HAS_DECISION",
  "HAS_RECEIPT",
  "HAS_IMPACT",
  "className=\"v5-routines\"",
  "openWorldObject(s.ref)",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Monde operational cockpit derives attention only from observed territory state',()=>{
 for(const invariant of [
  "const worldOperational=useMemo",
  "territoires en attention",
  "sessions live",
  "missions bloquées",
  "preuves observées",
  "Runtime domaine non confirmé",
  "Session ",
  "recommendedNextStep",
  "className=\"v5-world-cockpit\"",
  "À examiner",
  "projection readonly",
  "Aucun signal bloquant observé dans la projection.",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace exposes the selected Monde context as a workbench summary',()=>{
 for(const invariant of [
  "const workspaceContext=useMemo",
  "CONTEXTE DE TRAVAIL",
  "OBJECTIF",
  "BLOCAGE",
  "PREUVES LIÉES",
  "RÉSULTATS LIÉS",
  "Voir dans Monde",
  "Voir dans Pokémon",
  "Voir la mission",
  "className=\"v5-work-context\"",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace groups the current mission results proofs and linked tool in one dossier',()=>{
 for(const invariant of [
  "missionRefs",
  "DOSSIER DE TRAVAIL",
  "Mission, résultats et preuves liés",
  "Aucun résultat lié.",
  "Aucune preuve liée.",
  "Outil relié au contexte",
  "Continuer dans l’outil",
  "className=\"v5-work-dossier\"",
  "workspaceContext.toolArea",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace exposes only context-aware actions backed by existing views and tools',()=>{
 for(const invariant of [
  "const workspaceActions=useMemo",
  "ACTIONS DISPONIBLES",
  "Continuer depuis ce contexte",
  "Session de travail reliée au contexte",
  "Fichiers & preuves",
  "Revenir à l’objet dans son territoire",
  "Voir l’agent ou la session dans sa vue dédiée",
  "Ces actions réutilisent uniquement les vues, outils et liaisons déjà présents dans Workspace.",
  "className=\"v5-work-actions-panel\"",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace preserves observed session mission result proof continuity for task resumption',()=>{
 for(const invariant of [
  "const workspaceContinuity=useMemo",
  "obsidia-selected-session",
  "const resumeWorkspace",
  "CONTINUITÉ DE TRAVAIL",
  "Reprendre sans perdre le contexte",
  "RÉSULTAT LIÉ",
  "PREUVE LIÉE",
  "Reprendre la session",
  "Revoir la session",
  "aucun nouvel ordre de workflow",
  "className=\"v5-work-continuity\"",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace summarizes current observed work state missing ready proof and resume',()=>{
 for(const invariant of [
  "const workspaceSummary=useMemo",
  "SYNTHÈSE DU CONTEXTE",
  "État de travail courant",
  "MANQUE",
  "PRÊT",
  "PREUVE",
  "REPRISE",
  "Aucun manque de traçabilité observé",
  "Aucune reprise directe observée",
  "Synthèse calculée uniquement depuis le contexte, la session, la mission et les preuves déjà observés.",
  "className=\"v5-work-summary\"",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Workspace post V5 keeps one shared context and preserves runtime authority boundaries',()=>{
 for(const invariant of [
  "sessionStorage.setItem('obsidia-focus-entity',id)",
  "window.dispatchEvent(new CustomEvent('obsidia-context'",
  "sessionStorage.setItem('obsidia-workspace-area',area)",
  "const workspaceContext=useMemo",
  "const workspaceContinuity=useMemo",
  "const workspaceActions=useMemo",
  "const workspaceSummary=useMemo",
  "shared?.decisionAuthority||'KX108_ONLY'",
  "projection readonly",
 ]) assert.ok(root.includes(invariant),invariant)
 for(const forbidden of [
  "workspaceDecisionAuthority",
  "workspaceCanonicalTruth",
  "workspace_write",
  "workspace_execute_decision",
 ]) assert.equal(root.includes(forbidden),false,forbidden)
})

