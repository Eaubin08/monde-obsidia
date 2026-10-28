import {readCssaMail,writeCssaMail,ingestCssaLocalMail,promoteCssaMailDocument,mailReference} from './cssaMailLocal'
import {readCssaCrm} from './cssaCrmWrite'
import {readCssaBusiness} from './cssaBusinessRead'
import {readCssaOrganisation} from './cssaOrganisationRead'
import {cssaSourceAvailable} from './cssaLinkedReference'
import {resolveCssaPerson} from './cssaPeopleProjection'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {useEffect,useMemo,useState,useRef} from 'react'
import './CSSAMail.css'

type MailMessage={
 id:string;reconciliationStatus?:string;threadId:string|null;from:string;to:string[];cc:string[];subject:string;receivedAt:string;bodyPreview:string;source:string;direction:'ENTRANT'|'SORTANT'|'INTERNE';organizationId:string|null;contactId:string|null;dossierId:string|null;caseId:string|null;crmInteractionId:string|null;status:'RACCORDE_CRM'|'A_RAPPROCHER';proof:string;externalMessageId:string|null
}
type MailDraft={id:string;to:string[];subject:string;body:string;organizationId:string|null;contactId:string|null;dossierId:string|null;status:'BROUILLON'|'A_VALIDER'|'VALIDE'|'HOLD';approvedByPersonId:string|null;source:string}
type MailState={version:string;updatedAt:string;messages:MailMessage[];drafts:MailDraft[]}
type ExternalOrganization={id:string;name:string;kind:string;status:string;email?:string}
type ExternalContact={id:string;organizationId:string;displayName:string;role:string;email:string;status:string}
type Directory={organizations:ExternalOrganization[];contacts:ExternalContact[]}
type Person={id:string;displayName:string;status:string}
type OrgState={people:Person[]}
type Dossier={id:string;reference:string;title:string;organizationId?:string|null}
type Requirement={id:string;dossierId:string;label:string;state:string;documentRefId:string|null}
type DocumentRef={id:string;dossierId:string|null;type:string;title:string;version:string;status:string;issuedAt:string;validUntil:string;source:string;fileRef:string;usedIn:string[];originType?:string;originMailId?:string|null;requirementIds?:string[];receivedAt?:string;proof?:string}
type BusinessState={dossiers:Dossier[];requirements:Requirement[];documentRefs:DocumentRef[]}
type Props={onOpen?:(moduleId:string,id?:string)=>void}

function uid(prefix:string){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

export default function CSSAMailPage({onOpen}:Props){
 const [observed,setState]=useState<MailState|null>(null)
 const [directory,setDirectory]=useState<Directory|null>(null)
 const [orgState,setOrgState]=useState<OrgState|null>(null)
 const [business,setBusiness]=useState<BusinessState|null>(null)
 const [selectedId,setSelectedId]=useState('')
 const [mode,setMode]=useState<'inbox'|'import'|'drafts'>('inbox')
 const [query,setQuery]=useState('')
 const [form,setForm]=useState<Record<string,string>>({direction:'ENTRANT'})
 const [error,setError]=useState(false)

 const active=useRef(true),generation=useRef(0),writing=useRef(false)
 const [busy,setBusy]=useState(false),[writeMessage,setWriteMessage]=useState('')
 const pending=useRef<Record<string,string>>({})
 const times=useRef<Record<string,string>>({})
 const operationId=(kind:string)=>pending.current[kind]??(pending.current[kind]=uid(kind))
 const available=cssaSourceAvailable(observed)
 const state=available?observed:null
 const refresh=async()=>{
  if(writing.current)return
  const request=++generation.current
  const [mail,crm,org,biz]=await Promise.allSettled([readCssaMail<MailState>(),readCssaCrm<Directory>(),readCssaOrganisation<OrgState>(),readCssaBusiness<BusinessState>()])
  if(!active.current||request!==generation.current)return
  setState(mail.status==='fulfilled'?mail.value:null);setError(mail.status==='rejected')
  setDirectory(crm.status==='fulfilled'&&cssaSourceAvailable(crm.value)?crm.value:null)
  setOrgState(org.status==='fulfilled'&&cssaSourceAvailable(org.value)?org.value:null)
  setBusiness(biz.status==='fulfilled'&&cssaSourceAvailable(biz.value)?biz.value:null)
  if(mail.status==='fulfilled'&&cssaSourceAvailable(mail.value))setSelectedId(previous=>previous||mail.value.messages[0]?.id||'')
 }
 useEffect(()=>{
  active.current=true;void refresh();const timer=window.setInterval(refresh,15000)
  const events=['cssa-mail-updated','cssa-crm-updated','cssa-business-updated','cssa-organisation-updated']
  for(const name of events)window.addEventListener(name,refresh)
  return()=>{active.current=false;generation.current++;window.clearInterval(timer);for(const name of events)window.removeEventListener(name,refresh)}
 },[])
 const runWrite=async(operation:()=>Promise<void>)=>{
  if(writing.current)return
  writing.current=true;generation.current++;setBusy(true);setWriteMessage('Enregistrement en cours…')
  try{await operation();if(active.current)setWriteMessage('Enregistrement local et liens demandés confirmés. Aucun envoi externe.')}
  catch(cause){if(active.current)setWriteMessage((cause instanceof Error?cause.message:'Enregistrement non confirmé.')+' Saisie conservée ; reprendre sans recharger la page.')}
  finally{
   writing.current=false
   if(active.current){setBusy(false);void refresh()}
   for(const name of ['cssa-mail-updated','cssa-crm-updated','cssa-business-updated'])window.dispatchEvent(new Event(name))
  }
 }
 const ingest=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.from?.trim()||!form.subject?.trim())return
  await runWrite(async()=>{
   const id=operationId('mail')
   const receivedAt=form.receivedAt||(times.current[id]??(times.current[id]=new Date().toISOString()))
   const result=await ingestCssaLocalMail<MailState>({id,from:form.from.trim(),to:form.to?[form.to.trim()]:[],cc:form.cc?[form.cc.trim()]:[],subject:form.subject.trim(),receivedAt,bodyPreview:form.bodyPreview?.trim()||'',direction:form.direction||'ENTRANT',...(form.proof?.trim()?{proof:form.proof.trim()}:{}),source:'SAISIE_MAIL_MANUELLE_A_VERIFIER'})
   if(!active.current)return
   setState(result.state);setSelectedId(id);setMode('inbox');setForm({direction:'ENTRANT'});delete pending.current.mail
  })
 }

 const promoteMailToDocument=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!selected||(!linkedDocument&&!form.docTitle?.trim()))return
  const docId=operationId('doc-mail:'+selected.id)
  const dossierId=form.docDossierId||null
  const requirementId=form.docRequirementId||null
  const document:DocumentRef=linkedDocument||{
   id:docId,
   dossierId,
   type:form.docType?.trim()||'PIECE_RECUE_PAR_MAIL',
   title:form.docTitle.trim(),
   version:form.docVersion?.trim()||'1',
   status:'A_VERIFIER',
   issuedAt:'',
   validUntil:form.docValidUntil||'',
   source:'MAIL:'+selected.id,
   fileRef:selected.proof||selected.externalMessageId||'MAIL_RECEIPT_NON_RACCORDE',
   usedIn:dossierId?[dossierId]:[],
   originType:'MAIL',
   originMailId:selected.id,
   requirementIds:requirementId?[requirementId]:[],
   receivedAt:selected.receivedAt,
   proof:selected.proof
  }
  await runWrite(async()=>{
   const next=await promoteCssaMailDocument<BusinessState>(selected.id,document,requirementId)
   if(!active.current)return
   setBusiness(next);delete pending.current['doc-mail:'+selected.id]
   setForm({...form,docTitle:'',docType:'',docVersion:'',docValidUntil:'',docDossierId:'',docRequirementId:''})
  })
 }

 const createDraft=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.draftTo?.trim()||!form.draftSubject?.trim())return
  const draft:MailDraft={
   id:operationId('draft'),
   to:[form.draftTo.trim()],
   subject:form.draftSubject.trim(),
   body:form.draftBody?.trim()||'',
   organizationId:null,
   contactId:null,
   dossierId:null,
   status:'BROUILLON',
   approvedByPersonId:null,
   source:'BROUILLON_LOCAL_NON_ENVOYE'
  }
  await runWrite(async()=>{const next=await writeCssaMail<MailState>({draftPatch:draft});if(active.current){setState(next);setForm({});delete pending.current.draft}})
 }

 const messages=useMemo(()=>state?.messages.filter(m=>{
  if(!query.trim())return true
  const q=query.toLowerCase()
  return m.subject.toLowerCase().includes(q)||m.from.toLowerCase().includes(q)||m.bodyPreview.toLowerCase().includes(q)
 })||[],[state,query])
 const selectedRows=state?.messages.filter(m=>m.id===selectedId)||[]
 const selected=selectedRows.length===1?selectedRows[0]:null
 const orgName=(id:string|null)=>mailReference(id,directory?.organizations||[],cssaSourceAvailable(directory),'name')
 const contactName=(id:string|null)=>mailReference(id,directory?.contacts||[],cssaSourceAvailable(directory),'displayName')
 const personName=(id:string|null)=>resolveCssaPerson(id,undefined,orgState)
 const dossierName=(id:string|null)=>mailReference(id,business?.dossiers||[],cssaSourceAvailable(business),'reference')
 const linkedDocuments=selected?business?.documentRefs.filter(d=>d.originMailId===selected.id)||[]:[]
 const linkedDocument=linkedDocuments.length===1?linkedDocuments[0]:null

 const candidateRequirements=(business?.requirements||[]).filter(r=>!(form.docDossierId||linkedDocument?.dossierId)||r.dossierId===(form.docDossierId||linkedDocument?.dossierId))


 return <section className="mailx">
  {observed?<CSSAStoreSourceNotice state={observed}/>:<p>UNKNOWN · source Mail {error?'indisponible ou invalide':'en cours de lecture'}.</p>}
  <p>{directory?'CRM disponible':'UNKNOWN · CRM indisponible'} · {business?'Dossiers disponibles':'UNKNOWN · Dossiers indisponibles'} · {orgState?'Organisation disponible':'UNKNOWN · Organisation indisponible'}</p>
  {writeMessage&&<p role="status">{writeMessage}</p>}
  <fieldset disabled={busy} style={{display:'contents'}}>
  <header className="mailx-hero">
   <div><small>MAIL CSSA</small><h2>Boîte gouvernée & journal CRM</h2><p>Les messages importés peuvent devenir des interactions CRM déterministes. Aucun envoi externe n’est exécuté depuis Monde.</p></div>
   <span className="mailx-hold">ENVOI EXTERNE · HOLD</span>
  </header>

  <nav className="mailx-tabs">
   <button className={mode==='inbox'?'active':''} onClick={()=>setMode('inbox')}>Boîte</button>
   <button className={mode==='import'?'active':''} onClick={()=>setMode('import')}>Importer un message</button>
   <button className={mode==='drafts'?'active':''} onClick={()=>setMode('drafts')}>Brouillons</button>
  </nav>

  {mode==='import'&&<form className="mailx-form" onSubmit={ingest}>
   <select value={form.direction||'ENTRANT'} onChange={e=>setForm({...form,direction:e.target.value})}><option>ENTRANT</option><option>SORTANT</option><option>INTERNE</option></select>
   <input required placeholder="De (email)" value={form.from||''} onChange={e=>setForm({...form,from:e.target.value})}/>
   <input placeholder="À (email)" value={form.to||''} onChange={e=>setForm({...form,to:e.target.value})}/>
   <input placeholder="Cc" value={form.cc||''} onChange={e=>setForm({...form,cc:e.target.value})}/>
   <input required placeholder="Objet" value={form.subject||''} onChange={e=>setForm({...form,subject:e.target.value})}/>
   <input type="datetime-local" value={form.receivedAt||''} onChange={e=>setForm({...form,receivedAt:e.target.value})}/>
   <textarea rows={5} placeholder="Aperçu / contenu utile" value={form.bodyPreview||''} onChange={e=>setForm({...form,bodyPreview:e.target.value})}/>
   <input placeholder="Preuve / Message-ID / receipt" value={form.proof||''} onChange={e=>setForm({...form,proof:e.target.value})}/>
   <button>Importer & rapprocher CRM</button>
   <p>Rapprochement automatique uniquement par adresse email exacte et correspondance unique dans le CRM. Sinon le message reste « À rapprocher ».</p>
  </form>}

  {mode==='inbox'&&<div className="mailx-layout">
   <aside className="mailx-list">
    <div className="mailx-search"><input placeholder="Rechercher…" value={query} onChange={e=>setQuery(e.target.value)}/><span>{available?messages.length:'UNKNOWN'}</span></div>
    {messages.length?messages.map(m=><button key={m.id} className={selected?.id===m.id?'active':''} onClick={()=>setSelectedId(m.id)}>
     <div><strong>{m.subject}</strong><span>{m.from}</span></div>
     <small>{m.receivedAt?.slice(0,16).replace('T',' ')}</small>
     <em className={m.status==='RACCORDE_CRM'?'linked':'pending'}>{m.status==='RACCORDE_CRM'?'Lien CRM déclaré':'À rapprocher'}</em>
    </button>):<div className="mailx-empty">{available?'Aucun mail importé. Monde n’invente pas de boîte réelle.':'UNKNOWN · registre Mail indisponible.'}</div>}
   </aside>
   <main className="mailx-detail">{selected?<>
    <header><div><small>{selected.direction}</small><h3>{selected.subject}</h3><p>{selected.from} → {selected.to.join(', ')||'destinataire non renseigné'}</p></div><span className={selected.status==='RACCORDE_CRM'?'ok':'hold'}>{selected.status==='RACCORDE_CRM'?'Raccord CRM déclaré':'À rapprocher'}</span></header>
    <section className="mailx-body"><p>{selected.bodyPreview||'Aucun contenu importé.'}</p></section>
    <section className="mailx-meta">
     <div><small>Organisme</small><strong>{orgName(selected.organizationId)}</strong></div>
     <div><small>Contact</small><strong>{contactName(selected.contactId)}</strong></div>
     <div><small>Rapprochement enregistré</small><strong>{selected.reconciliationStatus||'UNKNOWN · déclaration historique'}</strong></div>
     <div><small>Interaction CRM</small><strong>{mailReference(selected.crmInteractionId,(directory as (Directory&{interactions:{id:string}[]})|null)?.interactions||[],cssaSourceAvailable(directory),'id')}</strong></div>
     <div><small>Référence de preuve déclarée</small><strong>{selected.proof||'NON_RACCORDEE'}</strong></div>
     <div><small>Source</small><strong>{selected.source}</strong></div>
     <div><small>Dossier</small><strong>{dossierName(selected.dossierId)}</strong></div>
     <div><small>Document canonique</small><strong>{!business?'UNKNOWN · Business indisponible':linkedDocuments.length>1?'UNKNOWN · plusieurs pièces liées':linkedDocument?linkedDocument.title:'Aucun'}</strong></div>
    </section>
    {selected.organizationId&&<div className="mailx-actions"><button onClick={()=>onOpen?.('crm')}>Ouvrir CRM →</button>{selected.dossierId&&<button onClick={()=>onOpen?.('dossiers',selected.dossierId!)}>Ouvrir dossier →</button>}{linkedDocument&&<button onClick={()=>onOpen?.('documents',linkedDocument.id)}>Ouvrir document →</button>}</div>}
    <section className="mailx-document-link">
     <header><div><small>DOCUMENTS</small><h4>Transformer une pièce reçue en document canonique</h4></div><span>{linkedDocument?'Déjà créé':'Revue humaine requise'}</span></header>
     {linkedDocument&&<p><strong>{linkedDocument.title}</strong> est déjà relié à ce mail. Son statut reste {linkedDocument.status} tant qu’il n’est pas vérifié.</p>}<form onSubmit={promoteMailToDocument}>
      <input required={!linkedDocument} readOnly={Boolean(linkedDocument)} placeholder="Titre du document" value={linkedDocument?.title||form.docTitle||''} onChange={e=>setForm({...form,docTitle:e.target.value})}/>
      <input placeholder="Type (attestation, RIB, convention…)" value={form.docType||''} onChange={e=>setForm({...form,docType:e.target.value})}/>
      <select disabled={Boolean(linkedDocument)} value={linkedDocument?.dossierId||form.docDossierId||''} onChange={e=>setForm({...form,docDossierId:e.target.value,docRequirementId:''})}><option value="">Dossier : non lié</option>{(business?.dossiers||[]).map(d=><option key={d.id} value={d.id}>{d.reference} · {d.title}</option>)}</select>
      <select value={form.docRequirementId||''} onChange={e=>setForm({...form,docRequirementId:e.target.value})}><option value="">Exigence : aucune</option>{candidateRequirements.map(r=><option key={r.id} value={r.id}>{r.label}</option>)}</select>
      <input type="date" aria-label="Validité du document" value={form.docValidUntil||''} onChange={e=>setForm({...form,docValidUntil:e.target.value})}/>
      <button>Créer le document / reprendre les liens</button>
      <p>La pièce est enregistrée <strong>À vérifier</strong>. Le lien ne modifie pas l’état déclaré de l’exigence. Le système ne considère jamais automatiquement qu’une pièce satisfait une exigence.</p>
     </form>
    </section>
   </>:<div className="mailx-empty">Sélectionnez un message.</div>}</main>
  </div>}

  {mode==='drafts'&&<div className="mailx-drafts">
   <form className="mailx-form compact" onSubmit={createDraft}>
    <input required placeholder="À (email)" value={form.draftTo||''} onChange={e=>setForm({...form,draftTo:e.target.value})}/>
    <input required placeholder="Objet" value={form.draftSubject||''} onChange={e=>setForm({...form,draftSubject:e.target.value})}/>
    <textarea rows={4} placeholder="Corps du brouillon" value={form.draftBody||''} onChange={e=>setForm({...form,draftBody:e.target.value})}/>
    <button>Créer brouillon local</button>
   </form>
   <div className="mailx-draft-list">{state?.drafts.length?state.drafts.map(d=><article key={d.id}>
    <div><small>{d.status}</small><strong>{d.subject}</strong><span>À : {d.to.join(', ')}</span></div>
    <div><em>{d.organizationId?orgName(d.organizationId):'Destinataire non raccordé'}</em><small>Validation : {personName(d.approvedByPersonId)}</small></div>
   </article>):<div className="mailx-empty">{available?'Aucun brouillon.':'UNKNOWN · brouillons indisponibles.'}</div>}</div>
   <div className="mailx-governance"><strong>Frontière d’autorité</strong><span>Un brouillon peut être préparé et validé localement. L’envoi réel reste indisponible tant qu’un canal externe gouverné et une autorisation d’action ne sont pas raccordés.</span></div>
  </div>}
 </fieldset></section>
}
