import {composeWorldUiContract} from './worldUiCompositionContract'
import {useEffect,useState} from 'react'
import {createCssaWorldSnapshotController,type WorldSnapshotState} from './cssaWorldSnapshotController'
import {projectWorldConsumer} from './worldConsumerProjection'
import {worldObjectKey} from './worldObjectContract'

// Explicit opt-in diagnostic only: existing mission page remains backed by its canonical business reader.
const controller=createCssaWorldSnapshotController()
export default function CSSAWorldSnapshotDiagnostic({dossierId}:{dossierId:string|null}){
 const [state,setState]=useState<WorldSnapshotState>(()=>controller.read())
 useEffect(()=>controller.subscribe(setState),[])
 const focus=state.snapshot?.model.objects.find(o=>o.identity.domain==='BUSINESS'&&o.identity.kind==='CASE'&&o.identity.id===dossierId)
 const projection=projectWorldConsumer(state,focus?worldObjectKey(focus):'')
 const composition=composeWorldUiContract(state)
 return <details className="dosv-world-diagnostic">
  <summary>Diagnostic du modèle Monde V26 (lecture seule)</summary>
  <button type="button" disabled={state.phase==='LOADING'} onClick={()=>{void controller.refresh()}}>Actualiser le modèle Monde</button>
  <p>Lecture : {state.phase} · révision {state.revision} · cohérence {projection.consistency}.</p>
  <p>Sources : {projection.sourceStatus?Object.entries(projection.sourceStatus).map(([key,value])=>key+': '+value).join(' · '):'Aucune projection actuelle'}.</p>
  <p>Objets : {state.snapshot?.model.objects.length??0} · relations : {state.snapshot?.graph.edges.length??0} · domaines : {projection.territories.length}.</p>
  <p>Contrat UI V28 · {composition.schema} · territoires composables : {composition.territories.length} · objets navigables : {composition.territories.reduce((sum,t)=>sum+t.items.length,0)}. Aucun choix graphique définitif.</p>
  <p>Capacités observées dans les sources : {state.snapshot?.capabilityRegistry.records.filter(c=>c.state==='OBSERVED_SOURCE').length??0} · déclarées seulement : {state.snapshot?.capabilityRegistry.records.filter(c=>c.state==='DECLARED_ONLY').length??0}. Aucune ne confère une autorisation d’exécution.</p>
  {dossierId&&<p>Dossier : {projection.focus?.label??'UNKNOWN'} · liens : {projection.relations.length} · inconnues : {projection.unknowns.length}.</p>}
  {state.error&&<p role="status">Erreur de lecture : {state.error}</p>}
  <p>Cette projection ne modifie pas les registres et ne représente aucune décision KX108.</p>
 </details>
}
