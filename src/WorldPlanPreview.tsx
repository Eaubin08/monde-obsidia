import type {ReactNode} from 'react'
import type {composeWorldRenderPlan} from './worldUiComposer'

// Disposable visual renderer for a read-only semantic plan. Never interprets URLs as commands.
type Plan=ReturnType<typeof composeWorldRenderPlan>
export default function WorldPlanPreview({plan}:{plan:Plan}):ReactNode{
 if(plan.phase!=='READY'&&plan.phase!=='DEGRADED')return <p role="status">Aucun plan Monde actuel disponible.</p>
 return <section aria-label="Aperçu expérimental du Monde" data-world-renderer="V0">
  <p>Projection expérimentale · révision {plan.revision} · {plan.phase} · lecture seule.</p>
  {plan.territories.map(territory=><section key={territory.domain} aria-label={'Territoire '+territory.domain}>
   <h4>{territory.domain} · {territory.status}</h4>
   {territory.blocks.length===0?<p>Pas d'objet observable.</p>:<ul>{territory.blocks.map(block=><li key={block.objectKey}>
    <strong>{block.label}</strong> · {block.family} · {block.pattern}
    {block.fallback&&<span> · Pattern inconnu : consultation générique</span>}
    {block.unknowns.length>0&&<span> · {block.unknowns.length} inconnue(s)</span>}
   </li>)}</ul>}
   <p>Capacités de lecture exposées : {territory.capabilities.length?territory.capabilities.join(', '):'UNKNOWN'}.</p>
  </section>)}
  {plan.unknowns.length>0&&<p>{plan.unknowns.length} inconnue(s) de projection.</p>}
  <p>Ce rendu ne permet aucune action et ne constitue pas une autorisation KX108.</p>
 </section>
}
