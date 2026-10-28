import useCssaBusinessRead from './useCssaBusinessRead'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {resolveCssaReference,cssaSourceAvailable,referenceLabels} from './cssaLinkedReference'
import {useMemo,useState} from 'react'
import CSSABusinessPage from './CSSABusinessPage'
import './CSSADocumentsPage.css'

type DocumentRef={id:string;dossierId:string|null;type:string;title:string;version:string;status:'VALIDE'|'EXPIRE'|'A_VERIFIER'|'INCONNU';issuedAt:string;validUntil:string;source:string;fileRef:string;usedIn:string[];originType?:string;originMailId?:string|null;requirementIds?:string[];receivedAt?:string;proof?:string}
type Dossier={id:string;reference:string;title:string}
type Requirement={id:string;dossierId:string;label:string;state:string;documentRefId:string|null}
type BusinessState={documentRefs:DocumentRef[];dossiers:Dossier[];requirements:Requirement[];updatedAt:string}
type Props={selectedId?:string;onOpen?:(moduleId:string,id?:string)=>void}
const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSADocumentsPage({selectedId,onOpen}:Props){
 const {state,error}=useCssaBusinessRead<BusinessState>()
 const available=cssaSourceAvailable(state)
 const [query,setQuery]=useState('')
 const [filter,setFilter]=useState<'TOUS'|'VALIDE'|'A_VERIFIER'|'EXPIRE'|'MAIL'>('TOUS')

 const view=useMemo(()=>{
  const docs=available?state?.documentRefs||[]:[]
  const today=new Date().toISOString().slice(0,10)
  const expiring=docs.filter(d=>d.validUntil&&d.validUntil>=today&&d.validUntil<=new Date(Date.now()+60*86400000).toISOString().slice(0,10))
  const mail=docs.filter(d=>d.originType==='MAIL')
  const used=new Set(docs.flatMap(d=>d.usedIn||[])).size
  const shown=docs.filter(d=>{
   if(filter==='VALIDE'&&d.status!=='VALIDE')return false
   if(filter==='A_VERIFIER'&&!['A_VERIFIER','INCONNU'].includes(d.status))return false
   if(filter==='EXPIRE'&&d.status!=='EXPIRE')return false
   if(filter==='MAIL'&&d.originType!=='MAIL')return false
   if(query.trim()){const q=query.toLowerCase();return d.title.toLowerCase().includes(q)||d.type.toLowerCase().includes(q)||d.source.toLowerCase().includes(q)}
   return true
  })
  return {docs,shown,expiring,mail,used}
 },[state,available,query,filter])

 if(error)return <section className="docxv"><div className="docxv-empty">UNKNOWN · source documents indisponible ou invalide.</div></section>
 if(!state)return <section className="docxv"><div className="docxv-empty">Chargement…</div></section>

 const selected=resolveCssaReference(selectedId,state.documentRefs,cssaSourceAvailable(state))
 const selectedDoc=selected.item
 const linkedDossierIds=selectedDoc?[...new Set([selectedDoc.dossierId,...(selectedDoc.usedIn||[]),...state.requirements.filter(req=>req.documentRefId===selectedDoc.id).map(req=>req.dossierId)].filter((id):id is string=>Boolean(id)))]:[]
 return <section className="docxv">
  <CSSAStoreSourceNotice state={state}/>
  <header className="docxv-hero">
   <div><small>DOCUMENTS CSSA</small><h2>La bibliothèque utile du club</h2><p>Trouver rapidement une pièce, voir sa validité, sa provenance et les dossiers qui l’utilisent sans passer par un registre technique.</p></div>
   <div className="docxv-hero-card"><span>▤</span><strong>{available?view.docs.length:'UNKNOWN'}</strong><small>documents canoniques</small></div>
  </header>

  <section className="docxv-kpis">
   <button onClick={()=>setFilter('VALIDE')}><small>VALIDES</small><strong>{available?view.docs.filter(d=>d.status==='VALIDE').length:'UNKNOWN'}</strong><span>Pièces utilisables</span></button>
   <button onClick={()=>setFilter('A_VERIFIER')}><small>À VÉRIFIER</small><strong>{available?view.docs.filter(d=>['A_VERIFIER','INCONNU'].includes(d.status)).length:'UNKNOWN'}</strong><span>Revue nécessaire</span></button>
   <button onClick={()=>setFilter('EXPIRE')}><small>EXPIRÉS</small><strong>{available?view.docs.filter(d=>d.status==='EXPIRE').length:'UNKNOWN'}</strong><span>À renouveler</span></button>
   <button onClick={()=>setFilter('MAIL')}><small>REÇUS PAR MAIL</small><strong>{available?view.mail.length:'UNKNOWN'}</strong><span>Provenance conservée</span></button>
  </section>

  {selectedId&&<section className="docxv-focus">
   {selectedDoc?<><h3>{selectedDoc.title}</h3><p>{selectedDoc.type} · version {selectedDoc.version||'UNKNOWN'} · {human(selectedDoc.status)}</p><p>Source : {selectedDoc.source||'UNKNOWN'} · fichier référencé : {selectedDoc.fileRef||'UNKNOWN'}</p><p>Validité : {selectedDoc.validUntil||'UNKNOWN'} · origine mail : {selectedDoc.originMailId||'Aucun lien renseigné'}</p>
    <h4>Dossiers utilisateurs</h4>{linkedDossierIds.length?linkedDossierIds.map(id=>{
     const dossier=resolveCssaReference(id,state.dossiers,cssaSourceAvailable(state))
     return <div key={id}>{dossier.item?<button onClick={()=>onOpen?.('dossiers',id)}>{dossier.item.reference} · {dossier.item.title} →</button>:<p>{referenceLabels[dossier.status]} · {id}</p>}</div>
    }):<p>Aucun dossier lié enregistré.</p>}
   </>:<p>{referenceLabels[selected.status]} · {selectedId}</p>}
  </section>}
  <section className="docxv-library">
   <header><div><small>BIBLIOTHÈQUE</small><h3>Documents</h3></div><div className="docxv-search"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Rechercher un document…"/><select value={filter} onChange={e=>setFilter(e.target.value as any)}><option>TOUS</option><option>VALIDE</option><option>A_VERIFIER</option><option>EXPIRE</option><option>MAIL</option></select></div></header>
   {view.shown.length?<div className="docxv-grid">{view.shown.map(d=>{
    const dossierRef=resolveCssaReference(d.dossierId,state.dossiers,cssaSourceAvailable(state))
    const dossier=dossierRef.item
    const requirements=state.requirements.filter(r=>r.documentRefId===d.id)
    const req=requirements.length===1?requirements[0]:null
    return <article key={d.id} onClick={()=>onOpen?.('documents',d.id)}>
     <div className="docxv-file"><span>{d.type.slice(0,3).toUpperCase()}</span></div>
     <div className="docxv-copy"><small>{human(d.type)} · v{d.version}</small><h4>{d.title}</h4><p>{dossier?dossier.reference+' · '+dossier.title:d.dossierId?referenceLabels[dossierRef.status]+' · '+d.dossierId:'Bibliothèque générale'}</p>{req?<em>Exigence : {req.label}</em>:requirements.length>1?<em>UNKNOWN · plusieurs exigences associées</em>:null}</div>
     <div className="docxv-meta"><span className={'status '+d.status.toLowerCase()}>{human(d.status)}</span><small>{d.validUntil?'jusqu’au '+d.validUntil:'validité inconnue'}</small>{d.originType==='MAIL'&&<small>✉ reçu par mail</small>}</div>
    </article>})}</div>:<div className="docxv-empty">{available?'Aucun document dans cette vue.':'UNKNOWN · source documents indisponible ; aucune pièce réelle ne peut être déduite du modèle de secours.'}</div>}
  </section>

  <section className="docxv-strip"><div><small>ÉCHÉANCE 60 JOURS</small><strong>{available?view.expiring.length:'UNKNOWN'}</strong><span>document(s)</span></div><div><small>DOSSIERS UTILISATEURS</small><strong>{available?view.used:'UNKNOWN'}</strong><span>dossier(s) liés</span></div><div><small>PRINCIPE</small><strong>1 document</strong><span>réutilisable, versionné, sourcé</span></div></section>

  <details className="docxv-tools" open={Boolean(selectedId)}><summary>Gestion détaillée · ajouter / vérifier / modifier les documents</summary><CSSABusinessPage mode="documents" selectedId={selectedId} onOpen={onOpen}/></details>
 </section>
}
