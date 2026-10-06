export type MissionTimelineEntity={id:string;kind:string;label:string;gate?:string;targetPath?:string}
export type MissionTimelineMission={
 id:string;actionId:string;agentId:string|null;sessionRefs:string[];resultRefs:string[];decisionRecordRefs:string[];receiptRefs:string[];impactRefs:string[];
 status:string;traceabilityStatus:'COMPLETE'|'INCOMPLETE';traceabilityGaps:string[];primaryBlocker:string|null;recommendedNextStep:string;
 priorityLevel:'HIGH'|'MEDIUM'|'NONE';advisoryOnly:true;decisionAuthority:'KX108_ONLY'
}
export default function MissionTimeline({mission,entities=[],onFocus,compact=false}:{mission:MissionTimelineMission;entities?:MissionTimelineEntity[];onFocus?:(id:string)=>void;compact?:boolean}){
 const label=(id:string)=>entities.find(e=>e.id===id)?.label||id
 const gate=(id:string)=>entities.find(e=>e.id===id)?.gate||label(id)
 const impact=(id:string)=>entities.find(e=>e.id===id)?.targetPath||label(id)
 const ref=(id:string,text:string)=>onFocus?<button key={id} onClick={()=>onFocus(id)}>{text}</button>:<code key={id}>{text}</code>
 return <div className="mission-timeline">
  <h3>{compact?'Mission liée':'Timeline mission'} · {mission.actionId}</h3>
  <p>Statut : {mission.status} · Traçabilité : <strong>{mission.traceabilityStatus}</strong></p>
  {mission.traceabilityGaps.length>0&&<><p>Blockers : {mission.traceabilityGaps.join(' · ')}</p><p><strong>Priorité {mission.priorityLevel}</strong> · {mission.recommendedNextStep}</p><p className="muted">Conseil UI uniquement · {mission.decisionAuthority}</p></>}
  {!compact&&<p>Agent : {mission.agentId?ref('agent:'+mission.agentId,mission.agentId):'non relié'}</p>}
  <p>Session : {mission.sessionRefs.length?mission.sessionRefs.map(id=>ref(id,label(id))):'non reliée'}</p>
  <p>Résultat : {mission.resultRefs.length?mission.resultRefs.map(id=>ref(id,label(id))):'non relié'}</p>
  <p>Décision : {mission.decisionRecordRefs.length?mission.decisionRecordRefs.map(id=>ref(id,gate(id))):'absente'}</p>
  <p>Preuve : {mission.receiptRefs.length?mission.receiptRefs.map(id=>ref(id,label(id))):'aucun receipt relié'}</p>
  <p>Impact : {mission.impactRefs.length?mission.impactRefs.map(id=>ref(id,impact(id))):'aucun impact mesuré'}</p>
 </div>
}
