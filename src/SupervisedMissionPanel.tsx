import {useState,type FormEvent} from 'react'

type Ticket={ticket_id:string;objective?:string;dependency_ids:string[];status:string;phase:string;hold_reason?:string;blocked_reason?:string;verification_level?:string;pending_approval?:boolean;evidence_refs?:string[];action_evidence_id?:string;receipt_refs?:string[];closed?:boolean;verified?:boolean}
type Projection={schema_version?:string;status:string;reason?:string;mission_id?:string;original_goal?:string;mandate?:{human_mandate_reference?:string;status?:string;revoked?:boolean};project?:{repository_identity?:string;branch?:string;base_sha?:string;worktree_visible?:boolean;local_root_visible?:boolean};tickets?:Ticket[];unique_next_ticket_id?:string;hold?:{reason?:string;root_causes?:unknown[];transitive_blocks?:unknown[]};budget?:Record<string,unknown>;timebox?:Record<string,unknown>;pending_approvals?:unknown[];evidence?:{evidence_refs?:string[];action_evidence_refs?:string[];receipt_refs?:string[]};verification?:{ticket_levels?:Record<string,string>;mission_completion_proof_ref?:Record<string,unknown>|null};binder_replay?:{independent_replay_available?:boolean;limitations?:string[]};checkpoint?:{checkpoint_id?:string;integrity_digest?:string;resume_status?:string};next_step?:{status?:string;selected_ticket_id?:string;requested_operation?:string;hold_reason?:string};status_distinctions?:Record<string,boolean>;readonly?:boolean;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean}

const statusOrder=['PREPARED','AUTHORIZED','EXECUTED_OBSERVED','AWAITING_VERIFICATION','VERIFIED','CLOSED','MISSION_DONE_VERIFIED','HOLD']
const compact=(value:unknown)=>JSON.stringify(value??{},null,2)

export default function SupervisedMissionPanel(){
 const [missionId,setMissionId]=useState(''),[checkpointId,setCheckpointId]=useState(''),[projection,setProjection]=useState<Projection|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 async function submit(event:FormEvent){
  event.preventDefault();setLoading(true);setError('')
  try{
   const params=new URLSearchParams({mission_id:missionId.trim(),checkpoint_id:checkpointId.trim()})
   const response=await fetch('/obsidia-local/supervised-mission/projection?'+params.toString())
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Projection indisponible')
   setProjection(data)
  }catch(e){setProjection(null);setError(String(e).replace(/^Error:\s*/,''))}finally{setLoading(false)}
 }
 const tickets=projection?.tickets||[]
 const unavailable=projection?.status==='UNAVAILABLE'
 return <section className="supervised-panel" aria-label="Projection mission supervisée">
  <div className="supervised-head"><div><span className="eyebrow">MISSION SUPERVISÉE · READONLY</span><h3>État R12 canonique</h3></div><span>{projection?.readonly?'READONLY':'NON CHARGÉ'}</span></div>
  <form className="supervised-query" onSubmit={submit}>
   <label>Mission ID<input value={missionId} onChange={e=>setMissionId(e.target.value)} placeholder="mission-..." maxLength={128}/></label>
   <label>Checkpoint ID<input value={checkpointId} onChange={e=>setCheckpointId(e.target.value)} placeholder="smc-..." maxLength={84}/></label>
   <button disabled={loading||!missionId.trim()||!checkpointId.trim()}>{loading?'Lecture…':'Afficher'}</button>
  </form>
  {error&&<p className="tool-error" role="alert">{error}</p>}
  {!projection&&!error&&<p className="empty-workspace">Renseigne des identifiants opaques pour lire une projection existante. Aucun chemin fichier n’est accepté.</p>}
  {projection&&<div className={unavailable?'supervised-unavailable':'supervised-content'}>
   {unavailable?<p role="status">UNAVAILABLE · {projection.reason||'API Obsidia indisponible'}</p>:<>
    <div className="supervised-summary">
     <div><small>Mission</small><strong>{projection.mission_id}</strong><span>{projection.original_goal}</span></div>
     <div><small>Mandat</small><strong>{projection.mandate?.status||'UNKNOWN'}</strong><span>{projection.mandate?.human_mandate_reference}</span></div>
     <div><small>Projet</small><strong>{projection.project?.repository_identity||'UNKNOWN'}</strong><span>{projection.project?.branch} · {projection.project?.base_sha?.slice(0,12)}</span></div>
     <div><small>NEXT</small><strong>{projection.unique_next_ticket_id||'HOLD'}</strong><span>{projection.next_step?.requested_operation||projection.next_step?.hold_reason||projection.hold?.reason||'Aucun'}</span></div>
    </div>
    <div className="supervised-status-row">{statusOrder.map(status=><span key={status} aria-current={projection.status===status||tickets.some(t=>t.phase===status)?'true':undefined}>{status}</span>)}</div>
    <section className="supervised-dag"><h4>Tickets / DAG</h4>{tickets.map(ticket=><article key={ticket.ticket_id}><div><strong>{ticket.ticket_id}</strong><span>{ticket.phase}</span></div><p>{ticket.objective}</p><small>Dépend de: {ticket.dependency_ids.length?ticket.dependency_ids.join(', '):'aucune'} · Vérification: {ticket.verification_level||'UNKNOWN'}</small>{(ticket.hold_reason||ticket.blocked_reason)&&<p className="proof-warning">{ticket.hold_reason||ticket.blocked_reason}</p>}</article>)}</section>
    <section className="supervised-grid">
     <div><h4>HOLD</h4><pre>{compact(projection.hold)}</pre></div>
     <div><h4>Budgets</h4><pre>{compact({budget:projection.budget,timebox:projection.timebox})}</pre></div>
     <div><h4>Autorisations en attente</h4><pre>{compact(projection.pending_approvals)}</pre></div>
     <div><h4>R8 evidence / receipts</h4><pre>{compact(projection.evidence)}</pre></div>
     <div><h4>F5-C2 vérification</h4><pre>{compact(projection.verification)}</pre></div>
     <div><h4>Binder</h4><pre>{compact(projection.binder_replay)}</pre></div>
     <div><h4>Checkpoint / reprise</h4><pre>{compact(projection.checkpoint)}</pre></div>
     <div><h4>Limites d’état</h4><pre>{compact(projection.status_distinctions)}</pre></div>
    </section>
    <p className="supervised-boundary">AUTHORITY={projection.authority} · DECISION={projection.decision_authority} · executor={String(projection.executor_invoked)} · approval={String(projection.approval_created)} · memory={String(projection.memory_write)}</p>
   </>}
  </div>}
 </section>
}
