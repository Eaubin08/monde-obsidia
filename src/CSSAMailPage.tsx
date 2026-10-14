import {useEffect,useMemo,useState} from 'react'
import './CSSAMail.css'

type MailMessage={
 id:string;threadId:string|null;from:string;to:string[];cc:string[];subject:string;receivedAt:string;bodyPreview:string;source:string;direction:'ENTRANT'|'SORTANT'|'INTERNE';organizationId:string|null;contactId:string|null;dossierId:string|null;caseId:string|null;crmInteractionId:string|null;status:'RACCORDE_CRM'|'A_RAPPROCHER';proof:string;externalMessageId:string|null
}
type MailDraft={id:string;to:string[];subject:string;body:string;organizationId:string|null;contactId:string|null;dossierId:string|null;status:'BROUILLON'|'A_VALIDER'|'VALIDE'|'HOLD';approvedByPersonId:string|null;source:string}
type MailState={version:string;updatedAt:string;messages:MailMessage[];drafts:MailDraft[]}
type ExternalOrganization={id:string;name:string;kind:string;status:string;email?:string}
type ExternalContact={id:string;organizationId:string;displayName:string;role:string;email:string;status:string}
type Directory={organizations:ExternalOrganization[];contacts:ExternalContact[]}
type Person={id:string;displayName:string;status:string}
type OrgState={people:Person[]}
type Props={onOpen?:(moduleId:string,id?:string)=>void}

function human(v:string){return v.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())}
function uid(prefix:string){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

export default function CSSAMailPage({onOpen}:Props){
 const [state,setState]=useState<MailState|null>(null)
 const [directory,setDirectory]=useState<Directory|null>(null)
 const [orgState,setOrgState]=useState<OrgState|null>(null)
 const [selectedId,setSelectedId]=useState('')
 const [mode,setMode]=useState<'inbox'|'import'|'drafts'>('inbox')
 const [query,setQuery]=useState('')
 const [form,setForm]=useState<Record<string,string>>({direction:'ENTRANT'})
 const [error,setError]=useState(false)

 const refresh=async()=>{
  try{
   const [mailRes,crmRes,orgRes]=await Promise.all([
    fetch('/obsidia-local/cssa-mail-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-crm-directory',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-organisation-state',{cache:'no-store'})
   ])
   if(!mailRes.ok)throw new Error('mail unavailable')
   const mail=await mailRes.json()
   setState(mail)
   if(crmRes.ok)setDirectory(await crmRes.json())
   if(orgRes.ok)setOrgState(await orgRes.json())
   if(!selectedId&&mail.messages?.length)setSelectedId(mail.messages[0].id)
   setError(false)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])

 const post=async(patch:Record<string,unknown>)=>{
  const r=await fetch('/obsidia-local/cssa-mail-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})
  if(r.ok)setState(await r.json())
 }
 const ingest=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.from?.trim()||!form.subject?.trim())return
  const r=await fetch('/obsidia-local/cssa-mail-ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   id:uid('mail'),
   from:form.from.trim(),
   to:form.to?[form.to.trim()]:[],
   cc:form.cc?[form.cc.trim()]:[],
   subject:form.subject.trim(),
   receivedAt:form.receivedAt||new Date().toISOString(),
   bodyPreview:form.bodyPreview?.trim()||'',
   direction:form.direction||'ENTRANT',
   proof:form.proof?.trim()||undefined,
   source:'SAISIE_MAIL_MANUELLE_A_VERIFIER'
  })})
  if(r.ok){
   const data=await r.json()
   setState(data.state)
   setSelectedId(data.message.id)
   setMode('inbox')
   setForm({direction:'ENTRANT'})
   const crmRes=await fetch('/obsidia-local/cssa-crm-directory',{cache:'no-store'})
   if(crmRes.ok)setDirectory(await crmRes.json())
  }
 }

 const createDraft=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.draftTo?.trim()||!form.draftSubject?.trim())return
  const contact=(directory?.contacts||[]).find(c=>c.email?.toLowerCase()===form.draftTo.trim().toLowerCase())
  const draft:MailDraft={
   id:uid('draft'),
   to:[form.draftTo.trim()],
   subject:form.draftSubject.trim(),
   body:form.draftBody?.trim()||'',
   organizationId:contact?.organizationId||null,
   contactId:contact?.id||null,
   dossierId:null,
   status:'BROUILLON',
   approvedByPersonId:null,
   source:'BROUILLON_LOCAL_NON_ENVOYE'
  }
  await post({draftPatch:draft})
  setForm({})
 }

 const messages=useMemo(()=>state?.messages.filter(m=>{
  if(!query.trim())return true
  const q=query.toLowerCase()
  return m.subject.toLowerCase().includes(q)||m.from.toLowerCase().includes(q)||m.bodyPreview.toLowerCase().includes(q)
 })||[],[state,query])
 const selected=state?.messages.find(m=>m.id===selectedId)||messages[0]||null
 const orgName=(id:string|null)=>id?(directory?.organizations.find(o=>o.id===id)?.name||'Organisme inconnu'):'Non raccordé'
 const contactName=(id:string|null)=>id?(directory?.contacts.find(c=>c.id===id)?.displayName||'Contact inconnu'):'Contact non identifié'
 const personName=(id:string|null)=>id?(orgState?.people.find(p=>p.id===id)?.displayName||'Personne inconnue'):'Non assigné'

 if(error)return <section className="mailx"><div className="mailx-empty">Mail indisponible. Aucun message n’est inventé.</div></section>
 if(!state)return <section className="mailx"><div className="mailx-empty">Chargement…</div></section>

 return <section className="mailx">
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
   <p>Rapprochement automatique uniquement par adresse email exacte connue dans le CRM. Sinon le message reste « À rapprocher ».</p>
  </form>}

  {mode==='inbox'&&<div className="mailx-layout">
   <aside className="mailx-list">
    <div className="mailx-search"><input placeholder="Rechercher…" value={query} onChange={e=>setQuery(e.target.value)}/><span>{messages.length}</span></div>
    {messages.length?messages.map(m=><button key={m.id} className={selected?.id===m.id?'active':''} onClick={()=>setSelectedId(m.id)}>
     <div><strong>{m.subject}</strong><span>{m.from}</span></div>
     <small>{m.receivedAt?.slice(0,16).replace('T',' ')}</small>
     <em className={m.status==='RACCORDE_CRM'?'linked':'pending'}>{m.status==='RACCORDE_CRM'?'CRM lié':'À rapprocher'}</em>
    </button>):<div className="mailx-empty">Aucun mail importé. Monde n’invente pas de boîte réelle.</div>}
   </aside>
   <main className="mailx-detail">{selected?<>
    <header><div><small>{selected.direction}</small><h3>{selected.subject}</h3><p>{selected.from} → {selected.to.join(', ')||'destinataire non renseigné'}</p></div><span className={selected.status==='RACCORDE_CRM'?'ok':'hold'}>{selected.status==='RACCORDE_CRM'?'Raccordé CRM':'À rapprocher'}</span></header>
    <section className="mailx-body"><p>{selected.bodyPreview||'Aucun contenu importé.'}</p></section>
    <section className="mailx-meta">
     <div><small>Organisme</small><strong>{orgName(selected.organizationId)}</strong></div>
     <div><small>Contact</small><strong>{contactName(selected.contactId)}</strong></div>
     <div><small>Interaction CRM</small><strong>{selected.crmInteractionId||'Aucune'}</strong></div>
     <div><small>Preuve</small><strong>{selected.proof||'NON_RACCORDEE'}</strong></div>
     <div><small>Source</small><strong>{selected.source}</strong></div>
    </section>
    {selected.organizationId&&<div className="mailx-actions"><button onClick={()=>onOpen?.('crm')}>Ouvrir CRM →</button>{selected.dossierId&&<button onClick={()=>onOpen?.('dossiers',selected.dossierId!)}>Ouvrir dossier →</button>}</div>}
   </>:<div className="mailx-empty">Sélectionnez un message.</div>}</main>
  </div>}

  {mode==='drafts'&&<div className="mailx-drafts">
   <form className="mailx-form compact" onSubmit={createDraft}>
    <input required placeholder="À (email)" value={form.draftTo||''} onChange={e=>setForm({...form,draftTo:e.target.value})}/>
    <input required placeholder="Objet" value={form.draftSubject||''} onChange={e=>setForm({...form,draftSubject:e.target.value})}/>
    <textarea rows={4} placeholder="Corps du brouillon" value={form.draftBody||''} onChange={e=>setForm({...form,draftBody:e.target.value})}/>
    <button>Créer brouillon local</button>
   </form>
   <div className="mailx-draft-list">{state.drafts.length?state.drafts.map(d=><article key={d.id}>
    <div><small>{d.status}</small><strong>{d.subject}</strong><span>À : {d.to.join(', ')}</span></div>
    <div><em>{d.organizationId?orgName(d.organizationId):'Destinataire non raccordé'}</em><small>Validation : {personName(d.approvedByPersonId)}</small></div>
   </article>):<div className="mailx-empty">Aucun brouillon.</div>}</div>
   <div className="mailx-governance"><strong>Frontière d’autorité</strong><span>Un brouillon peut être préparé et validé localement. L’envoi réel reste indisponible tant qu’un canal externe gouverné et une autorisation d’action ne sont pas raccordés.</span></div>
  </div>}
 </section>
}
