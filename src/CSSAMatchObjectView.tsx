import {useMemo} from 'react'
import type {ClubCalendarEvent} from './cssaSportCalendar'
import {resolveCssaReference,referenceLabels} from './cssaLinkedReference'
import {resolveCssaPerson,type CssaPeopleState} from './cssaPeopleProjection'

// One match is an entry point to observed relations, not a separate source of truth.
type LinkedTask={id:string;title:string;status:string;priority:string;matchRef:string|null;responsible:string;responsiblePersonId?:string|null;source?:string}
type LinkedPreparation={id:string;title:string;status:string;category:string;matchRef:string;linkedTaskId:string|null;truthClass:string;venue:string}
type Props={
 events:ClubCalendarEvent[]
 selectedEventId:string
 opsAvailable:boolean
 tasks:LinkedTask[]
 preparations:LinkedPreparation[]
 organisation:CssaPeopleState|null
 onSelect:(moduleId:string,id:string)=>void
}
export function projectMatchRelations(events:ClubCalendarEvent[],selectedEventId:string,opsAvailable:boolean,tasks:LinkedTask[],preparations:LinkedPreparation[]){
 const matches=events.filter(e=>e.id===selectedEventId)
 const event=matches.length===1?matches[0]:null
 const eventTasks=event&&opsAvailable?tasks.filter(t=>t.matchRef===event.id):[]
 const eventPreparation=event&&opsAvailable?preparations.filter(p=>p.matchRef===event.id):[]
 const missing=eventPreparation.filter(p=>p.linkedTaskId&&!resolveCssaReference(p.linkedTaskId,eventTasks,opsAvailable).item)
 return {event,eventCount:matches.length,tasks:eventTasks,preparations:eventPreparation,unresolved:missing,opsAvailable}
}
export default function CSSAMatchObjectView({events,selectedEventId,opsAvailable,tasks,preparations,organisation,onSelect}:Props){
 const model=useMemo(()=>projectMatchRelations(events,selectedEventId,opsAvailable,tasks,preparations),[events,selectedEventId,opsAvailable,tasks,preparations])
 const event=model.event
 if(!event)return <section className="mday-panel" aria-label="Objet match"><h3>Objet événement</h3><p>{model.eventCount>1?'UNKNOWN · identifiant de match ambigu':'UNKNOWN · événement introuvable dans le calendrier de référence'}</p><p>La navigation ne substitue aucun autre événement.</p></section>
 return <section className="mday-panel" aria-label="Objet match" data-object-id={event.id}>
  <header><div><small>OBJET MÉTIER · {event.kind}</small><h3>{event.title}</h3></div><a href={event.href}>Ouvrir dans Sportif →</a></header>
  <p>{event.competition} · {event.date} · {event.time||'Horaire UNKNOWN'} · {event.venue||'Lieu UNKNOWN'}</p>
  <p><strong>État de la référence :</strong> {event.truth} · {event.detail||'Détail UNKNOWN'}</p>
  <p><strong>Source :</strong> {event.source||'UNKNOWN'}{event.sourceUrl&&<> · <a href={event.sourceUrl} target="_blank" rel="noreferrer">Consulter la source ↗</a></>}</p>
  {event.truth.includes('CONFLICT')&&<p>CONTRADICTION · Ne pas retenir un horaire ou résultat sans résolution et preuve.</p>}
  <h4>Préparation reliée ({opsAvailable?model.preparations.length:'UNKNOWN'})</h4>
  {!opsAvailable?<p>UNKNOWN · registre Ops indisponible : aucune préparation n'est inférée.</p>:model.preparations.length?model.preparations.map(p=>{
   const ref=resolveCssaReference(p.linkedTaskId,model.tasks,opsAvailable)
   return <div key={p.id}>
    <button type="button" onClick={()=>onSelect('matchday',p.id)}>{p.title} · {p.status} · {p.truthClass||'UNKNOWN'}</button>
    {p.linkedTaskId&&(ref.item?<button type="button" onClick={()=>onSelect('tasks',ref.item!.id)}>Tâche liée : {ref.item.title} →</button>:<span>{referenceLabels[ref.status]} · tâche {p.linkedTaskId}</span>)}
   </div>
  }):<p>Aucune préparation enregistrée pour cet événement.</p>}
  <h4>Tâches reliées ({opsAvailable?model.tasks.length:'UNKNOWN'})</h4>
  {opsAvailable&&model.tasks.map(t=><div key={t.id}>
   <button type="button" onClick={()=>onSelect('tasks',t.id)}>{t.title} · {t.status} · {t.priority}</button>
   <small> Responsable : {resolveCssaPerson(t.responsiblePersonId,t.responsible,organisation)} · Source : {t.source||'UNKNOWN'}</small>
   {t.responsiblePersonId&&organisation?.people.filter(p=>p.id===t.responsiblePersonId).length===1&&<button type="button" onClick={()=>onSelect('organisation','person:'+t.responsiblePersonId)}>Ouvrir la personne →</button>}
  </div>)}
  {!opsAvailable?<p>UNKNOWN · tâches non observables.</p>:!model.tasks.length&&<p>Aucune tâche explicitement reliée par matchRef.</p>}
  <h4>Relations et preuves</h4>
  <p>{model.unresolved.length?model.unresolved.length+' lien(s) préparation → tâche à réconcilier.':'Les relations de préparation sont examinées par identifiant exact.'}</p>
  <p>Le calendrier est une référence documentaire ; ni la préparation ni le statut d'une tâche ne prouvent une autorisation KX108 ou l'exécution de l'événement. Preuves et validations restent dans leurs stores canoniques.</p>
  <nav aria-label="Territoires liés"><button type="button" onClick={()=>onSelect('tasks','')}>Toutes les tâches</button><button type="button" onClick={()=>onSelect('organisation','')}>Organisation</button><button type="button" onClick={()=>onSelect('media','')}>Médias</button><button type="button" onClick={()=>onSelect('documents','')}>Documents</button><button type="button" onClick={()=>onSelect('commercial','')}>Commerce</button></nav>
 </section>
}
