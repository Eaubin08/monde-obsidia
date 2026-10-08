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

test('Pokemon projects observed agent context without inventing authority or workflow',()=>{
 for(const invariant of [
  "const agentContext=useMemo",
  "BELONGS_TO_DOMAIN",
  "CONTEXTE AGENT",
  "DOMAINE",
  "MISSION",
  "RÉSULTATS",
  "PREUVES",
  "RELATIONS",
  "Projection readonly des liaisons déjà observées pour cet agent.",
  "className=\"v5pk-agent-context\"",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Pokemon navigates observed agent context across World mission domain and Workspace',()=>{
 for(const invariant of [
  "const openWorld=(id:string,zone:'agents'|'activity'|'domains'|'knowledge'|'governance')",
  "new CustomEvent('obsidia-world-zone'",
  "Voir l’agent dans Monde",
  "Voir la mission",
  "Voir le domaine",
  "Continuer dans Workspace",
  "agentContext.agentEntity",
  "agentContext.mission",
  "agentContext.domain",
  "className=\"v5pk-agent-context-actions\"",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 for(const invariant of [
  "const worldZoneEvent=(e:Event)",
  "window.addEventListener('obsidia-world-zone'",
  "setWorldZone(zone)",
 ]) assert.ok(root.includes(invariant),invariant)
})

test('Pokemon exposes recent observed agent evidence and session history without duplicating Workspace',()=>{
 for(const invariant of [
  "const agentHistory=useMemo",
  "PREUVES & HISTORIQUE",
  "Traces récentes liées à l’agent",
  "RÉSULTATS / PREUVES",
  "HISTORIQUE SESSION",
  "Aucune preuve ou résultat lié à la mission courante.",
  "Aucun événement récent observé.",
  "sans dupliquer le dossier complet du Workspace",
  "className=\"v5pk-agent-evidence\"",
  "openWorld(e.id,['result','artifact'].includes(e.kind)?'knowledge':'governance')",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Pokemon shows only observed mission teammates and direct agent relations',()=>{
 for(const invariant of [
  "const agentNetwork=useMemo",
  "mission?.sessionRefs",
  "state.relations.filter(r=>anchors.has(r.from)||anchors.has(r.to))",
  "ÉQUIPE & LIENS",
  "SESSIONS DE LA MISSION",
  "RELATIONS OBSERVÉES",
  "Aucune autre session reliée à cette mission.",
  "Aucune relation directe observée autour de cet agent.",
  "Aucune collaboration n’est déduite",
  "className=\"v5pk-agent-network\"",
 ]) assert.ok(pokemon.includes(invariant),invariant)
})

test('Pokemon summarizes only observed agent operational state and gaps',()=>{
 for(const invariant of [
  "const agentOperational=useMemo",
  "SYNTHÈSE OPÉRATIONNELLE",
  "Aucun blocage observé",
  "Aucun manque observé",
  "Aucune prochaine action observée",
  "mission?.recommendedNextStep||null",
  "mission?.traceabilityStatus==='COMPLETE'",
  "Synthèse calculée uniquement depuis la session, la mission et les preuves déjà observées.",
  "className=\"v5pk-agent-operational\"",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 for(const forbidden of [
  "pokemonDecisionAuthority",
  "pokemonCanonicalTruth",
  "pokemon_execute",
 ]) assert.equal(pokemon.includes(forbidden),false,forbidden)
})

test('Pokemon post V5 remains a readonly QUI projection with shared cross-view context',()=>{
 for(const invariant of [
  "<small>QUI ?</small><h1>Pokémon</h1>",
  "fetch('/obsidia-local/state'",
  "sessionStorage.setItem('obsidia-focus-entity',id)",
  "window.dispatchEvent(new CustomEvent('obsidia-context'",
  "window.dispatchEvent(new CustomEvent('obsidia-world-zone'",
  "sessionStorage.setItem('obsidia-workspace-area'",
  "current.decisionAuthority||'KX108_ONLY'",
  "Projection readonly des liaisons déjà observées pour cet agent.",
  "Synthèse calculée uniquement depuis la session, la mission et les preuves déjà observées.",
  "Aucune collaboration n’est déduite",
 ]) assert.ok(pokemon.includes(invariant),invariant)
 for(const forbidden of [
  "method:'POST'",
  "method:\"POST\"",
  "/obsidia-local/run",
  "/obsidia-local/stop",
  "canonicalTruth:true",
  "decisionAuthority:'POKEMON'",
  "decisionAuthority:\"POKEMON\"",
  "pokemonDecisionAuthority",
  "pokemon_execute",
 ]) assert.equal(pokemon.includes(forbidden),false,forbidden)
})

test('Monde Workspace and Pokemon share one context without changing object kind or authority',()=>{
 for(const invariant of [
  "sessionStorage.setItem('obsidia-focus-entity',id)",
  "window.dispatchEvent(new CustomEvent('obsidia-context'",
  "window.addEventListener('obsidia-context'",
  "window.dispatchEvent(new CustomEvent('obsidia-world-zone'",
  "sessionStorage.setItem('obsidia-workspace-area'",
 ]) assert.ok((root+'\n'+pokemon).includes(invariant),invariant)

 assert.ok(root.includes("kind:session?'session':(entity?.kind||(mission?'mission':'aucun'))"))
 assert.ok(root.includes("shared?.decisionAuthority||'KX108_ONLY'"))
 assert.ok(pokemon.includes("current.decisionAuthority||'KX108_ONLY'"))

 for(const forbidden of [
  "canonicalTruth:true",
  "decisionAuthority:'WORKSPACE'",
  "decisionAuthority:'POKEMON'",
  "workspaceCanonicalTruth",
  "pokemonCanonicalTruth",
 ]) assert.equal((root+'\n'+pokemon).includes(forbidden),false,forbidden)
})

test('Post V5 new Monde final architecture keeps one readonly projection and preserved view boundaries',()=>{
 for(const invariant of [
  "['world','Monde']",
  "['workspace','Workspace']",
  "['agents','Pokémon']",
  "const territoryCards=useMemo",
  "const worldOperational=useMemo",
  "const workspaceContext=useMemo",
  "const workspaceContinuity=useMemo",
  "const workspaceSummary=useMemo",
  "const agentContext=useMemo",
  "const agentNetwork=useMemo",
  "const agentOperational=useMemo",
  "shared?.decisionAuthority||'KX108_ONLY'",
  "current.decisionAuthority||'KX108_ONLY'",
 ]) assert.ok((root+'\n'+pokemon).includes(invariant),invariant)
 for(const invariant of [
  "readonly:true",
  "canonicalTruth:false",
  "decisionAuthority:'KX108_ONLY'",
  "views:{",
  "world:{question:'OÙ ?',entityRefs:",
  "workspace:{question:'QUOI ?',entityRefs:",
  "pokemon:{question:'QUI ?',entityRefs:",
 ]) assert.ok(stateProjection.includes(invariant),invariant)
 for(const forbidden of [
  "canonicalTruth:true",
  "decisionAuthority:'WORKSPACE'",
  "decisionAuthority:'POKEMON'",
  "decisionAuthority:'MONDE'",
  "workspaceCanonicalTruth",
  "pokemonCanonicalTruth",
  "worldCanonicalTruth",
 ]) assert.equal((root+'\n'+pokemon+'\n'+stateProjection).includes(forbidden),false,forbidden)
})

test('Jarjar launchers prefer the canonical source clone and keep legacy venv only as Python fallback',()=>{
 for(const invariant of [
  "Desktop\\Jarvis-iron-obsidia-github",
  "Desktop\\Jarvis-iron-obsidia-\\.venv\\Scripts\\python.exe",
 ]) assert.ok(jarjarLauncher.includes(invariant),invariant)
 for(const invariant of [
  "resolve(homedir(),'Desktop','Jarvis-iron-obsidia-github')",
  "resolve(homedir(),'Desktop','Jarvis-iron-obsidia-','.venv','Scripts','python.exe')",
 ]) assert.ok(bridge.includes(invariant),invariant)
})

test('README documents the frozen Qwen path as local only',()=>{
 const readme=readFileSync(resolve(process.cwd(),'README.md'),'utf8')
 assert.ok(readme.includes('aucun téléchargement automatique ni fallback Hugging Face'))
 assert.ok(!readme.includes("Hugging Face n'est utilisé qu'en absence de modèle local prêt"))
})

