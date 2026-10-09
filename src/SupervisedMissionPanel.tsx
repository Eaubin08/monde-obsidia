import {useState,type FormEvent} from 'react'

type Ticket={ticket_id:string;objective?:string;dependency_ids:string[];status:string;phase:string;hold_reason?:string;blocked_reason?:string;verification_level?:string;pending_approval?:boolean;evidence_refs?:string[];action_evidence_id?:string;receipt_refs?:string[];closed?:boolean;verified?:boolean}
type Projection={schema_version?:string;status:string;reason?:string;mission_id?:string;original_goal?:string;mandate?:{human_mandate_reference?:string;status?:string;revoked?:boolean};project?:{repository_identity?:string;branch?:string;base_sha?:string;worktree_visible?:boolean;local_root_visible?:boolean};tickets?:Ticket[];unique_next_ticket_id?:string;hold?:{reason?:string;root_causes?:unknown[];transitive_blocks?:unknown[]};budget?:Record<string,unknown>;timebox?:Record<string,unknown>;pending_approvals?:unknown[];evidence?:{evidence_refs?:string[];action_evidence_refs?:string[];receipt_refs?:string[]};verification?:{ticket_levels?:Record<string,string>;mission_completion_proof_ref?:Record<string,unknown>|null};binder_replay?:{independent_replay_available?:boolean;limitations?:string[]};checkpoint?:{checkpoint_id?:string;integrity_digest?:string;resume_status?:string};next_step?:{status?:string;selected_ticket_id?:string;requested_operation?:string;hold_reason?:string};status_distinctions?:Record<string,boolean>;readonly?:boolean;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean}
type PrepareResult={status:string;state?:string;reason?:string;mission_id?:string;checkpoint_id?:string;checkpoint_projection?:Projection;hold_reasons?:string[];provider_provenance?:Record<string,unknown>;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean}
type AuthorizationResult={status:string;state?:string;reason?:string;mission_id?:string;ticket_id?:string;checkpoint_id?:string;checkpoint_projection?:Projection;execution_phase?:string;action_evidence_id?:string;execution_outcome?:Record<string,unknown>;r8_receipt?:string;r10_repair_classification?:Record<string,unknown>;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean}
type VerificationResult={status:string;state?:string;reason?:string;mission_id?:string;ticket_id?:string;checkpoint_id?:string;verification_projection?:Record<string,unknown>;verification_assessment?:Record<string,unknown>;receipt_integrity?:Record<string,unknown>;r8_replay?:Record<string,unknown>;binder_independence?:Record<string,unknown>;closure_eligibility?:string;authority?:string;decision_authority?:string;executor_invoked?:boolean;approval_created?:boolean;memory_write?:boolean}

const statusOrder=['PREPARED','AUTHORIZED','EXECUTED_OBSERVED','AWAITING_VERIFICATION','VERIFIED','CLOSED','MISSION_DONE_VERIFIED','HOLD']
const prepareStates=['PREPARED_AWAITING_APPROVAL','HOLD','UNAVAILABLE','ERROR']
const authorizationStates=['EXECUTION_ATTEMPTED','EXECUTED_OBSERVED','OUTCOME_UNCERTAIN','EXECUTION_FAILED','HOLD','UNAVAILABLE','ERROR']
const compact=(value:unknown)=>JSON.stringify(value??{},null,2)
const list=(value:string)=>value.split(',').map(x=>x.trim()).filter(Boolean)
const json=(value:string)=>value.trim()?JSON.parse(value):{}

export default function SupervisedMissionPanel(){
 const [missionId,setMissionId]=useState(''),[checkpointId,setCheckpointId]=useState(''),[projection,setProjection]=useState<Projection|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false)
 const [goal,setGoal]=useState(''),[mandateRef,setMandateRef]=useState(''),[repoId,setRepoId]=useState(''),[worktree,setWorktree]=useState(''),[branch,setBranch]=useState(''),[baseSha,setBaseSha]=useState(''),[targetPaths,setTargetPaths]=useState(''),[operations,setOperations]=useState('MODIFY'),[tools,setTools]=useState('pytest'),[tests,setTests]=useState(''),[budgets,setBudgets]=useState('{"max_attempts":1,"max_actions":1}'),[provider,setProvider]=useState('{"status":"VERIFIED","provider":"QWEN_LOCAL","model":"qwen2.5-3b-instruct-q4_k_m"}'),[artifacts,setArtifacts]=useState('{"phase1_candidate":{},"inventory_snapshot":{},"deficiency_evidence":{},"validation_evidence":{}}'),[prepareResult,setPrepareResult]=useState<PrepareResult|null>(null),[preparing,setPreparing]=useState(false)
 const [authTicket,setAuthTicket]=useState(''),[authEah,setAuthEah]=useState(''),[authRef,setAuthRef]=useState(''),[authResult,setAuthResult]=useState<AuthorizationResult|null>(null),[authorizing,setAuthorizing]=useState(false)
 const [verifyTicket,setVerifyTicket]=useState(''),[verificationEvidence,setVerificationEvidence]=useState('{}'),[verificationResult,setVerificationResult]=useState<VerificationResult|null>(null),[verifying,setVerifying]=useState(false)
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
 async function prepare(event:FormEvent){
  event.preventDefault();setPreparing(true);setError('');setPrepareResult(null)
  try{
   const parsedArtifacts=json(artifacts)
   const payload={
    human_request:goal.trim(),
    repository_context:{repository_identity:repoId.trim(),worktree:worktree.trim(),branch:branch.trim(),base_sha:baseSha.trim()},
    proposed_scope:{target_paths:list(targetPaths),operations:list(operations)},
    human_mandate:{
     human_mandate_reference:mandateRef.trim(),
     status:'ACTIVE',
     mission_authority:'KX108_ONLY',
     authorized_target_paths:list(targetPaths),
     authorized_operations:list(operations),
     permitted_tools:list(tools),
     test_requirements:list(tests),
     budgets:json(budgets),
    },
    provider_config:json(provider),
    phase1_candidate:parsedArtifacts.phase1_candidate,
    inventory_snapshot:parsedArtifacts.inventory_snapshot,
    deficiency_evidence:parsedArtifacts.deficiency_evidence,
    validation_evidence:parsedArtifacts.validation_evidence,
   }
   const response=await fetch('/obsidia-local/supervised-mission/prepare-only',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Préparation indisponible')
   setPrepareResult(data)
   if(data.checkpoint_id)setCheckpointId(data.checkpoint_id)
   if(data.mission_id)setMissionId(data.mission_id)
   if(data.checkpoint_projection)setProjection(data.checkpoint_projection)
  }catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setPreparing(false)}
 }
 async function authorize(event:FormEvent){
  event.preventDefault();setAuthorizing(true);setError('');setAuthResult(null)
  try{
   const payload={mission_id:missionId.trim(),checkpoint_id:checkpointId.trim(),ticket_id:authTicket.trim(),execution_authority_hash:authEah.trim(),human_authorization_reference:authRef.trim(),session_id:'monde-r12-f6-d1'}
   const response=await fetch('/obsidia-local/supervised-mission/authorize-execution',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Handoff indisponible')
   setAuthResult(data)
   if(data.checkpoint_id)setCheckpointId(data.checkpoint_id)
   if(data.mission_id)setMissionId(data.mission_id)
  if(data.checkpoint_projection)setProjection(data.checkpoint_projection)
  }catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setAuthorizing(false)}
 }
 async function verify(event:FormEvent){
  event.preventDefault();setVerifying(true);setError('');setVerificationResult(null)
  try{
   const payload={mission_id:missionId.trim(),checkpoint_id:checkpointId.trim(),ticket_id:verifyTicket.trim(),verification_evidence:json(verificationEvidence)}
   const response=await fetch('/obsidia-local/supervised-mission/verify-ticket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
   const data=await response.json()
   if(!response.ok)throw Error(data.error||'Vérification indisponible')
   setVerificationResult(data)
  }catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setVerifying(false)}
 }
 const tickets=projection?.tickets||[]
 const unavailable=projection?.status==='UNAVAILABLE'
 const selectedTicket=tickets.find(ticket=>ticket.ticket_id===authTicket)||tickets.find(ticket=>ticket.pending_approval)||tickets[0]
 return <section className="supervised-panel" aria-label="Projection mission supervisée">
  <div className="supervised-head"><div><span className="eyebrow">MISSION SUPERVISÉE · READONLY</span><h3>État R12 canonique</h3></div><span>{projection?.readonly?'READONLY':'NON CHARGÉ'}</span></div>
  <form className="supervised-query" onSubmit={submit}>
   <label>Mission ID<input value={missionId} onChange={e=>setMissionId(e.target.value)} placeholder="mission-..." maxLength={128}/></label>
   <label>Checkpoint ID<input value={checkpointId} onChange={e=>setCheckpointId(e.target.value)} placeholder="smc-..." maxLength={84}/></label>
   <button disabled={loading||!missionId.trim()||!checkpointId.trim()}>{loading?'Lecture…':'Afficher'}</button>
  </form>
  {error&&<p className="tool-error" role="alert">{error}</p>}
  {!projection&&!error&&<p className="empty-workspace">Renseigne des identifiants opaques pour lire une projection existante. Aucun chemin fichier n’est accepté.</p>}
  <form className="supervised-prepare" onSubmit={prepare} aria-label="Préparer une mission supervisée">
   <div className="supervised-prepare-title"><div><span className="eyebrow">PRÉPARER UNE MISSION</span><h4>PREPARE_ONLY · KX108_ONLY</h4></div><span>aucun ACT</span></div>
   <div className="supervised-status-row">{prepareStates.map(status=><span key={status} aria-current={prepareResult?.state===status||prepareResult?.status===status?'true':undefined}>{status}</span>)}</div>
   <label>Objectif humain<textarea value={goal} onChange={e=>setGoal(e.target.value)} maxLength={2048} placeholder="Demande de développement supervisée"/></label>
   <div className="supervised-form-grid">
    <label>Mandat humain<input value={mandateRef} onChange={e=>setMandateRef(e.target.value)} placeholder="mandate-..." maxLength={128}/></label>
    <label>Repository identity<input value={repoId} onChange={e=>setRepoId(e.target.value)} placeholder="repo://..." maxLength={160}/></label>
    <label>Worktree<input value={worktree} onChange={e=>setWorktree(e.target.value)} placeholder="C:\\..."/></label>
    <label>Branche<input value={branch} onChange={e=>setBranch(e.target.value)} maxLength={128}/></label>
    <label>Base SHA<input value={baseSha} onChange={e=>setBaseSha(e.target.value)} maxLength={40}/></label>
    <label>Chemins autorisés<input value={targetPaths} onChange={e=>setTargetPaths(e.target.value)} placeholder="src/a.ts, tests/a.test.ts"/></label>
    <label>Opérations<input value={operations} onChange={e=>setOperations(e.target.value)} placeholder="MODIFY, CREATE"/></label>
    <label>Outils permis<input value={tools} onChange={e=>setTools(e.target.value)} placeholder="pytest, npm test"/></label>
    <label>Tests requis<input value={tests} onChange={e=>setTests(e.target.value)} placeholder="npm test, pytest"/></label>
   </div>
   <label>Budgets JSON<textarea value={budgets} onChange={e=>setBudgets(e.target.value)} maxLength={1024}/></label>
   <label>Provider JSON<textarea value={provider} onChange={e=>setProvider(e.target.value)} maxLength={2048}/></label>
   <label>Artefacts R9 existants JSON<textarea value={artifacts} onChange={e=>setArtifacts(e.target.value)} maxLength={32768}/></label>
   <button disabled={preparing||!goal.trim()||!mandateRef.trim()||!repoId.trim()||!worktree.trim()||!branch.trim()||!baseSha.trim()||!targetPaths.trim()}>{preparing?'Préparation…':'Préparer une mission'}</button>
  </form>
  {prepareResult&&<div className={`supervised-prepare-result status-${prepareResult.state||prepareResult.status}`} role="status">
   <strong>{prepareResult.state||prepareResult.status}</strong>
   <span>{prepareResult.reason||prepareResult.hold_reasons?.join(' · ')||prepareResult.checkpoint_id||'Résultat reçu'}</span>
   <pre>{compact({mission_id:prepareResult.mission_id,checkpoint_id:prepareResult.checkpoint_id,provider:prepareResult.provider_provenance,authority:prepareResult.authority,decision_authority:prepareResult.decision_authority,executor_invoked:prepareResult.executor_invoked,approval_created:prepareResult.approval_created,memory_write:prepareResult.memory_write})}</pre>
  </div>}
  {projection&&!unavailable&&<form className="supervised-prepare" onSubmit={authorize} aria-label="Handoff d’autorisation supervisée">
   <div className="supervised-prepare-title"><div><span className="eyebrow">HANDOFF D’AUTORISATION</span><h4>Référence humaine existante · exécution gouvernée</h4></div><span>pas de création d’autorité</span></div>
   <div className="supervised-status-row">{authorizationStates.map(status=><span key={status} aria-current={authResult?.state===status||authResult?.execution_phase===status||authResult?.status===status?'true':undefined}>{status}</span>)}</div>
   <section className="supervised-grid">
    <div><h4>Inspection opérateur</h4><pre>{compact({checkpoint:projection.checkpoint,mandate:projection.mandate,selected_ticket:selectedTicket,budget:projection.budget,binder:projection.binder_replay})}</pre></div>
    <div><h4>Dépendances</h4><pre>{compact({next:projection.next_step,hold:projection.hold,pending_approvals:projection.pending_approvals})}</pre></div>
   </section>
   <div className="supervised-form-grid">
    <label>Ticket préparé<input value={authTicket} onChange={e=>setAuthTicket(e.target.value)} placeholder={selectedTicket?.ticket_id||'ticket-...'} maxLength={160}/></label>
    <label>Execution authority hash<input value={authEah} onChange={e=>setAuthEah(e.target.value)} placeholder="64 hex" maxLength={64}/></label>
    <label>Référence humaine<input value={authRef} onChange={e=>setAuthRef(e.target.value)} placeholder="human-auth-..." maxLength={256}/></label>
   </div>
   <button disabled={authorizing||!missionId.trim()||!checkpointId.trim()||!authTicket.trim()||!authEah.trim()||!authRef.trim()}>{authorizing?'Handoff…':'Soumettre la référence'}</button>
  </form>}
  {authResult&&<div className={`supervised-prepare-result status-${authResult.state||authResult.status}`} role="status">
   <strong>{authResult.state||authResult.status}</strong>
   <span>{authResult.reason||authResult.action_evidence_id||authResult.checkpoint_id||'Résultat reçu'}</span>
   <pre>{compact({mission_id:authResult.mission_id,ticket_id:authResult.ticket_id,checkpoint_id:authResult.checkpoint_id,execution_phase:authResult.execution_phase,action_evidence_id:authResult.action_evidence_id,r8_receipt:authResult.r8_receipt,r10:authResult.r10_repair_classification,authority:authResult.authority,decision_authority:authResult.decision_authority,executor_invoked:authResult.executor_invoked,approval_created:authResult.approval_created,memory_write:authResult.memory_write})}</pre>
  </div>}
  {projection&&!unavailable&&<form className="supervised-prepare" onSubmit={verify} aria-label="Projection de vérification indépendante">
   <div className="supervised-prepare-title"><div><span className="eyebrow">VÉRIFICATION INDÉPENDANTE</span><h4>Éligibilité de clôture · readonly</h4></div><span>aucune clôture automatique</span></div>
   <section className="supervised-grid">
    <div><h4>Observation ≠ vérification</h4><pre>{compact({tickets:tickets.map(t=>({ticket_id:t.ticket_id,phase:t.phase,verification_level:t.verification_level,closed:t.closed})),status_distinctions:projection.status_distinctions})}</pre></div>
    <div><h4>Limite Binder</h4><pre>{compact({binder:projection.binder_replay,required:'BINDER_DECISION_RECONSTRUCTION_REQUIRED'})}</pre></div>
   </section>
   <div className="supervised-form-grid">
    <label>Ticket à évaluer<input value={verifyTicket} onChange={e=>setVerifyTicket(e.target.value)} placeholder={selectedTicket?.ticket_id||'ticket-...'} maxLength={160}/></label>
   </div>
   <label>Preuve de vérification JSON<textarea value={verificationEvidence} onChange={e=>setVerificationEvidence(e.target.value)} maxLength={65536}/></label>
   <button disabled={verifying||!missionId.trim()||!checkpointId.trim()||!verifyTicket.trim()}>{verifying?'Évaluation…':'Évaluer l’éligibilité'}</button>
  </form>}
  {verificationResult&&<div className={`supervised-prepare-result status-${verificationResult.state||verificationResult.status}`} role="status">
   <strong>{verificationResult.closure_eligibility||verificationResult.state||verificationResult.status}</strong>
   <span>{verificationResult.reason||'Projection de vérification reçue'}</span>
   <pre>{compact({mission_id:verificationResult.mission_id,ticket_id:verificationResult.ticket_id,checkpoint_id:verificationResult.checkpoint_id,receipt_integrity:verificationResult.receipt_integrity,r8_replay:verificationResult.r8_replay,binder_independence:verificationResult.binder_independence,assessment:verificationResult.verification_assessment,authority:verificationResult.authority,decision_authority:verificationResult.decision_authority,executor_invoked:verificationResult.executor_invoked,approval_created:verificationResult.approval_created,memory_write:verificationResult.memory_write})}</pre>
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
