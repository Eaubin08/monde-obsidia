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
 return <div className={"mission-timeline "+(compact?'compact':'')}>
  <div className="mission-timeline-head"><div><span className="eyebrow">{compact?'CHAÎNE DE PREUVE':'MISSION / PREUVE'}</span><h3>{mission.actionId}</h3></div><span className={"trace-badge "+mission.traceabilityStatus.toLowerCase()}>{mission.traceabilityStatus}</span></div>
  {!compact&&<p>Statut : <strong>{mission.status}</strong> · Autorité : {mission.decisionAuthority}</p>}
  <div className="proof-chain">
   <div className={mission.sessionRefs.length?'proof-step ok':'proof-step missing'}><small>1</small><strong>Session</strong><span>{mission.sessionRefs.length?mission.sessionRefs.map(id=>ref(id,label(id))):'non reliée'}</span></div>
   <div className={mission.resultRefs.length?'proof-step ok':'proof-step missing'}><small>2</small><strong>Résultat</strong><span>{mission.resultRefs.length?mission.resultRefs.map(id=>ref(id,label(id))):'non relié'}</span></div>
   <div className={mission.decisionRecordRefs.length?'proof-step ok':'proof-step missing'}><small>3</small><strong>Décision</strong><span>{mission.decisionRecordRefs.length?mission.decisionRecordRefs.map(id=>ref(id,gate(id))):'absente'}</span></div>
   <div className={mission.receiptRefs.length?'proof-step ok':'proof-step missing'}><small>4</small><strong>Receipt</strong><span>{mission.receiptRefs.length?mission.receiptRefs.map(id=>ref(id,label(id))):'absent'}</span></div>
   <div className={mission.impactRefs.length?'proof-step ok':'proof-step missing'}><small>5</small><strong>Impact</strong><span>{mission.impactRefs.length?mission.impactRefs.map(id=>ref(id,impact(id))):'non prouvé'}</span></div>
  </div>
  {mission.traceabilityGaps.length>0&&<div className="proof-warning"><strong>{mission.primaryBlocker||'Traçabilité incomplète'}</strong><p>{mission.recommendedNextStep}</p></div>}
  {!compact&&<p className="muted">Agent : {mission.agentId?ref('agent:'+mission.agentId,mission.agentId):'non relié'} · conseil UI uniquement</p>}
 </div>
}
