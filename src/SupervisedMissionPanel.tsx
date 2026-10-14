import {useState,type FormEvent} from 'react'

type Ticket={ticket_id:string;objective?:string;dependency_ids?:string[];status?:string;phase?:string;hold_reason?:string;blocked_reason?:string;verification_level?:string;pending_approval?:boolean;evidence_refs?:string[];action_evidence_id?:string;receipt_refs?:string[];closed?:boolean;verified?:boolean}
type Projection={schema_version?:string;status?:string;reason?:string;mission_id?:string;original_goal?:string;mandate?:{human_mandate_reference?:string;status?:string;revoked?:boolean};project?:{repository_identity?:string;branch?:string;base_sha?:string;worktree_visible?:boolean;local_root_visible?:boolean};tickets?:Ticket[];unique_next_ticket_id?:string;hold?:{reason?:string;root_causes?:unknown[];transitive_blocks?:unknown[]};budget?:Record<string,unknown>;timebox?:Record<string,unknown>;pending_approvals?:unknown[];evidence?:{evidence_refs?:string[];action_evidence_refs?:string[];receipt_refs?:string[]};verification?:{ticket_levels?:Record<string,string>;mission_completion_proof_ref?:Record<string,unknown>|null};binder_replay?:{independent_replay_available?:boolean;limitations?:string[]};checkpoint?:{checkpoint_id?:string;integrity_digest?:string;resume_status?:string};next_step?:{status?:string;selected_ticket_id?:string;requested_operation?:string;hold_reason?:string};status_distinctions?:Record<string,boolean>;readonly?:boolean;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean;emits_act?:boolean}
type PrepareResult={status?:string;state?:string;reason?:string;mission_id?:string;checkpoint_id?:string;checkpoint_projection?:Projection;hold_reasons?:string[];provider_provenance?:Record<string,unknown>;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean;emits_act?:boolean}

const statusOrder=['PREPARED_AWAITING_APPROVAL','HOLD','BLOCK','EXECUTED_OBSERVED','AWAITING_VERIFICATION','VERIFIED','CLOSED','MISSION_DONE_VERIFIED']
const compact=(value:unknown)=>JSON.stringify(value??{},null,2)
const list=(value:string)=>value.split(',').map(x=>x.trim()).filter(Boolean)
const json=(value:string)=>value.trim()?JSON.parse(value):{}

export default function SupervisedMissionPanel(){
 const [missionId,setMissionId]=useState(''),[checkpointId,setCheckpointId]=useState(''),[projection,setProjection]=useState<Projection|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [goal,setGoal]=useState(''),[mandateRef,setMandateRef]=useState(''),[repoId,setRepoId]=useState(''),[worktree,setWorktree]=useState(''),[branch,setBranch]=useState(''),[baseSha,setBaseSha]=useState(''),[targetPaths,setTargetPaths]=useState(''),[operations,setOperations]=useState('MODIFY'),[tools,setTools]=useState('pytest'),[tests,setTests]=useState(''),[budgets,setBudgets]=useState('{"max_attempts":1,"max_actions":1}'),[provider,setProvider]=useState('{"status":"VERIFIED","provider":"QWEN_LOCAL","model_call_used":true,"real_local_model_verified":true}'),[artifacts,setArtifacts]=useState('{"phase1_candidate":{},"inventory_snapshot":{},"deficiency_evidence":{},"validation_evidence":{}}'),[prepareResult,setPrepareResult]=useState<PrepareResult|null>(null),[preparing,setPreparing]=useState(false)
 async function loadProjection(event?:FormEvent){
  event?.preventDefault();setLoading(true);setError('')
  try{
   const params=new URLSearchParams({mission_id:missionId.trim(),checkpoint_id:checkpointId.trim()})
   const response=await fetch('/obsidia-local/supervised-mission/projection?'+params.toString())
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Projection indisponible')
   setProjection(data)
  }catch(e){setProjection(null);setError(String(e).replace(/^Error:\s*/,''))}finally{setLoading(false)}
 }
 async function prepare(event:FormEvent){
  event.preventDefault();setPreparing(true);setError('');setPrepareResult(null)
  try{
   const parsedArtifacts=json(artifacts)
   const payload={
    human_request:goal.trim(),
    repository_context:{repository_identity:repoId.trim(),worktree:worktree.trim(),branch:branch.trim(),base_sha:baseSha.trim()},
    proposed_scope:{target_paths:list(targetPaths),operations:list(operations)},
    human_mandate:{
     human_mandate_reference:mandateRef.trim(),status:'ACTIVE',mission_authority:'KX108_ONLY',
     authorized_target_paths:list(targetPaths),authorized_operations:list(operations),permitted_tools:list(tools),
     test_requirements:list(tests),budgets:json(budgets),
    },
    provider_config:json(provider),
    phase1_candidate:parsedArtifacts.phase1_candidate,
    inventory_snapshot:parsedArtifacts.inventory_snapshot,
    deficiency_evidence:parsedArtifacts.deficiency_evidence,
    validation_evidence:parsedArtifacts.validation_evidence,
   }
   const response=await fetch('/obsidia-local/supervised-mission/prepare-only',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Preparation indisponible')
   setPrepareResult(data)
   if(data.checkpoint_id)setCheckpointId(data.checkpoint_id)
   if(data.mission_id)setMissionId(data.mission_id)
   if(data.checkpoint_projection)setProjection(data.checkpoint_projection)
  }catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setPreparing(false)}
 }
 const tickets=projection?.tickets||[]
 const unavailable=projection?.status==='UNAVAILABLE'
 return <section className="supervised-panel" aria-label="Projection mission supervisee">
  <div className="supervised-head"><div><span className="eyebrow">MISSION SUPERVISEE R12</span><h3>Projection canonique</h3></div><span>{projection?.readonly?'READONLY':'PREPARE_ONLY'}</span></div>
  <p className="supervised-boundary">Monde affiche et prepare seulement. Aucun ACT, aucune approbation, aucun executor direct, aucune mutation memoire.</p>
  <form className="supervised-query" onSubmit={loadProjection}>
   <label>Mission ID<input value={missionId} onChange={e=>setMissionId(e.target.value)} placeholder="mission-..." maxLength={128}/></label>
   <label>Checkpoint ID<input value={checkpointId} onChange={e=>setCheckpointId(e.target.value)} placeholder="smc-..." maxLength={84}/></label>
   <button disabled={loading||!missionId.trim()||!checkpointId.trim()}>{loading?'Lecture...':'Afficher'}</button>
  </form>
  {error&&<p className="tool-error" role="alert">{error}</p>}
  {!projection&&!error&&<p className="empty-workspace">Renseigne des identifiants opaques pour lire une projection existante. Aucun chemin fichier n'est accepte.</p>}
  <form className="supervised-prepare" onSubmit={prepare} aria-label="Preparer une mission supervisee">
   <div className="supervised-prepare-title"><div><span className="eyebrow">PREPARER UNE MISSION</span><h4>PREPARE_ONLY · KX108_ONLY</h4></div><span>aucune execution</span></div>
   <label>Objectif humain<textarea value={goal} onChange={e=>setGoal(e.target.value)} maxLength={2048} placeholder="Demande de developpement supervisee"/></label>
   <div className="supervised-form-grid">
    <label>Mandat humain<input value={mandateRef} onChange={e=>setMandateRef(e.target.value)} placeholder="mandate-..." maxLength={128}/></label>
    <label>Repository identity<input value={repoId} onChange={e=>setRepoId(e.target.value)} placeholder="repo://..." maxLength={160}/></label>
    <label>Worktree<input value={worktree} onChange={e=>setWorktree(e.target.value)} placeholder="C:\\..."/></label>
    <label>Branche<input value={branch} onChange={e=>setBranch(e.target.value)} maxLength={128}/></label>
    <label>Base SHA<input value={baseSha} onChange={e=>setBaseSha(e.target.value)} maxLength={40}/></label>
    <label>Chemins autorises<input value={targetPaths} onChange={e=>setTargetPaths(e.target.value)} placeholder="src/a.ts, tests/a.test.ts"/></label>
    <label>Operations<input value={operations} onChange={e=>setOperations(e.target.value)} placeholder="MODIFY, CREATE"/></label>
    <label>Outils permis<input value={tools} onChange={e=>setTools(e.target.value)} placeholder="pytest, npm test"/></label>
    <label>Tests requis<input value={tests} onChange={e=>setTests(e.target.value)} placeholder="npm test, pytest"/></label>
   </div>
   <label>Budgets JSON<textarea value={budgets} onChange={e=>setBudgets(e.target.value)} maxLength={1024}/></label>
   <label>Provider JSON<textarea value={provider} onChange={e=>setProvider(e.target.value)} maxLength={2048}/></label>
   <label>Artefacts R9 existants JSON<textarea value={artifacts} onChange={e=>setArtifacts(e.target.value)} maxLength={32768}/></label>
   <button disabled={preparing||!goal.trim()||!mandateRef.trim()||!repoId.trim()||!worktree.trim()||!branch.trim()||!baseSha.trim()||!targetPaths.trim()}>{preparing?'Preparation...':'Preparer seulement'}</button>
  </form>
  {prepareResult&&<div className={`supervised-prepare-result status-${prepareResult.state||prepareResult.status}`} role="status">
   <strong>{prepareResult.state||prepareResult.status}</strong>
   <span>{prepareResult.reason||prepareResult.hold_reasons?.join(' · ')||prepareResult.checkpoint_id||'Resultat recu'}</span>
   <pre>{compact({mission_id:prepareResult.mission_id,checkpoint_id:prepareResult.checkpoint_id,provider:prepareResult.provider_provenance,authority:prepareResult.authority,decision_authority:prepareResult.decision_authority,emits_act:prepareResult.emits_act,executor_invoked:prepareResult.executor_invoked,approval_created:prepareResult.approval_created,memory_write:prepareResult.memory_write})}</pre>
  </div>}
  {projection&&<div className={unavailable?'supervised-unavailable':'supervised-content'}>
   {unavailable?<p role="status">UNAVAILABLE · {projection.reason||'API Obsidia indisponible'}</p>:<>
    <div className="supervised-summary">
     <div><small>Mission</small><strong>{projection.mission_id}</strong><span>{projection.original_goal}</span></div>
     <div><small>Mandat</small><strong>{projection.mandate?.status||'UNKNOWN'}</strong><span>{projection.mandate?.human_mandate_reference}</span></div>
     <div><small>Projet</small><strong>{projection.project?.repository_identity||'UNKNOWN'}</strong><span>{projection.project?.branch} · {projection.project?.base_sha?.slice(0,12)}</span></div>
     <div><small>NEXT</small><strong>{projection.unique_next_ticket_id||'HOLD'}</strong><span>{projection.next_step?.requested_operation||projection.next_step?.hold_reason||projection.hold?.reason||'Aucun'}</span></div>
    </div>
    <div className="supervised-status-row">{statusOrder.map(status=><span key={status} aria-current={projection.status===status||tickets.some(t=>t.phase===status)?'true':undefined}>{status}</span>)}</div>
    <section className="supervised-dag"><h4>Tickets / DAG</h4>{tickets.length?tickets.map(ticket=><article key={ticket.ticket_id}><div><strong>{ticket.ticket_id}</strong><span>{ticket.phase||ticket.status}</span></div><p>{ticket.objective}</p><small>Depend de: {ticket.dependency_ids?.length?ticket.dependency_ids.join(', '):'aucune'} · Verification: {ticket.verification_level||'UNKNOWN'}</small>{(ticket.hold_reason||ticket.blocked_reason)&&<p className="proof-warning">{ticket.hold_reason||ticket.blocked_reason}</p>}</article>):<p className="v5-empty">Aucun ticket projete.</p>}</section>
    <section className="supervised-grid">
     <div><h4>HOLD</h4><pre>{compact(projection.hold)}</pre></div>
     <div><h4>Budgets</h4><pre>{compact({budget:projection.budget,timebox:projection.timebox})}</pre></div>
     <div><h4>Autorisations en attente</h4><pre>{compact(projection.pending_approvals)}</pre></div>
     <div><h4>R8 evidence / receipts</h4><pre>{compact(projection.evidence)}</pre></div>
     <div><h4>F5-C2 verification</h4><pre>{compact(projection.verification)}</pre></div>
     <div><h4>Binder</h4><pre>{compact(projection.binder_replay)}</pre></div>
     <div><h4>Checkpoint / reprise</h4><pre>{compact(projection.checkpoint)}</pre></div>
     <div><h4>Limites d'etat</h4><pre>{compact(projection.status_distinctions)}</pre></div>
    </section>
    <p className="supervised-boundary">AUTHORITY={projection.authority} · DECISION={projection.decision_authority} · ACT={String(projection.emits_act)} · executor={String(projection.executor_invoked)} · approval={String(projection.approval_created)} · memory={String(projection.memory_write)}</p>
   </>}
  </div>}
 </section>
}
