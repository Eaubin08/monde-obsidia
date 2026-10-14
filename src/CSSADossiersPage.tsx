import {useEffect,useMemo,useState} from 'react'
import CSSABusinessPage from './CSSABusinessPage'
import './CSSADossiersPage.css'

type Dossier={id:string;reference:string;type:string;title:string;organization:string;organizationId:string|null;deadline:string;status:string;source:string;owner:string;ownerPersonId:string|null;submissionChannel:string;createdAt:string}
type Requirement={id:string;dossierId:string;label:string;criticality:string;state:string;documentRefId:string|null;taskRefId:string|null;dueAt:string}
type DocumentRef={id:string;dossierId:string|null;title:string;status:string;validUntil:string;usedIn:string[]}
type Validation={id:string;dossierId:string;type:string;status:string}
type SubmissionProof={id:string;dossierId:string;submittedAt:string;externalReference:string;proofRef:string}
type DossierOutcome={id:string;dossierId:string;result:string;decidedAt:string;externalReference:string;amount:number|null}
type BusinessState={dossiers:Dossier[];requirements:Requirement[];documentRefs:DocumentRef[];validations:Validation[];submissionProofs:SubmissionProof[];dossierOutcomes:DossierOutcome[];updatedAt:string}
type Props={selectedId?:string;onOpen?:(moduleId:string,id?:string)=>void}
const human=(v:string)=>String(v||'').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSADossiersPage({selectedId,onOpen}:Props){
 const [state,setState]=useState<BusinessState|null>(null)
 const [filter,setFilter]=useState<'ACTIFS'|'PRETS'|'DEPOSES'|'CLOTURES'|'TOUS'>('ACTIFS')
 const [error,setError]=useState(false)
 const refresh=async()=>{try{const r=await fetch('/obsidia-local/cssa-business-state',{cache:'no-store'});if(!r.ok)throw new Error();setState(await r.json());setError(false)}catch{setError(true)}}
 useEffect(()=>{void refresh()},[])
 useEffect(()=>{const h=(e:Event)=>setState((e as CustomEvent<BusinessState>).detail);window.addEventListener('cssa-business-updated',h);return()=>window.removeEventListener('cssa-business-updated',h)},[])

 const rows=useMemo(()=>{
  if(!state)return []
  return state.dossiers.map(d=>{
   const reqs=state.requirements.filter(r=>r.dossierId===d.id)
   const required=reqs.filter(r=>r.criticality==='OBLIGATOIRE')
   const satisfied=required.filter(r=>r.state==='SATISFAIT').length
   const blocking=required.filter(r=>r.state!=='SATISFAIT')
   const validation=state.validations.find(v=>v.dossierId===d.id&&v.type==='REVUE_FINALE')
   const proof=state.submissionProofs.find(p=>p.dossierId===d.id)
   const outcome=state.dossierOutcomes.find(o=>o.dossierId===d.id)
   const docs=state.documentRefs.filter(x=>x.dossierId===d.id||x.usedIn?.includes(d.id))
   const ready=required.length>0&&blocking.length===0&&validation?.status==='VALIDE'
   const late=Boolean(d.deadline)&&new Date(d.deadline).getTime()<Date.now()&&!proof&&!['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status)
   return {d,reqs,required,satisfied,blocking,validation,proof,outcome,docs,ready,late}
  })
 },[state])

 const shown=rows.filter(x=>{
  if(filter==='PRETS')return x.ready&&!x.proof
  if(filter==='DEPOSES')return Boolean(x.proof&&!x.outcome)
  if(filter==='CLOTURES')return Boolean(x.outcome)||['ATTRIBUE','NON_RETENU','ANNULE'].includes(x.d.status)
  if(filter==='ACTIFS')return !x.outcome&&!['ATTRIBUE','NON_RETENU','ANNULE'].includes(x.d.status)
  return true
 })
 const selected=selectedId?rows.find(x=>x.d.id===selectedId):null
 const lateCount=rows.filter(x=>x.late).length
 const readyCount=rows.filter(x=>x.ready&&!x.proof).length
 const depositedCount=rows.filter(x=>x.proof&&!x.outcome).length
 const closedCount=rows.filter(x=>x.outcome).length

 if(error)return <section className="dosv"><div className="dosv-empty">Dossiers indisponibles.</div></section>
 if(!state)return <section className="dosv"><div className="dosv-empty">Chargement…</div></section>

 return <section className="dosv">
  <header className="dosv-hero">
   <div><small>DOSSIERS CSSA</small><h2>Chaque dossier comme une mission à conduire jusqu’à la preuve.</h2><p>Appels d’offres, subventions, conventions et partenariats : échéances, pièces, validation, dépôt et résultat réunis dans une lecture de progression.</p></div>
   <button onClick={()=>onOpen?.('dossiers','')}>+ Nouveau dossier</button>
  </header>

  <section className="dosv-kpis">
   <button className={lateCount?'danger':''} onClick={()=>setFilter('ACTIFS')}><small>EN RETARD</small><strong>{lateCount}</strong><span>sans preuve de dépôt</span></button>
   <button onClick={()=>setFilter('PRETS')}><small>PRÊTS À DÉPOSER</small><strong>{readyCount}</strong><span>validation finale acquise</span></button>
   <button onClick={()=>setFilter('DEPOSES')}><small>RÉSULTAT ATTENDU</small><strong>{depositedCount}</strong><span>dépôt confirmé</span></button>
   <button onClick={()=>setFilter('CLOTURES')}><small>RÉSULTATS</small><strong>{closedCount}</strong><span>décision externe sourcée</span></button>
  </section>

  <nav className="dosv-tabs">{(['ACTIFS','PRETS','DEPOSES','CLOTURES','TOUS'] as const).map(x=><button key={x} className={filter===x?'active':''} onClick={()=>setFilter(x)}>{human(x)}</button>)}</nav>

  <section className="dosv-board">
   {shown.length?shown.map(x=>{
    const pct=x.required.length?Math.round((x.satisfied/x.required.length)*100):0
    return <article key={x.d.id} className={x.late?'late':''} onClick={()=>onOpen?.('dossiers',x.d.id)}>
     <header><div><small>{human(x.d.type)}</small><h3>{x.d.reference}</h3></div><span>{human(x.d.status)}</span></header>
     <h4>{x.d.title}</h4>
     <p>{x.d.organization||'Organisme inconnu'}</p>
     <div className="dosv-progress"><div><span style={{width:pct+'%'}}></span></div><strong>{x.satisfied}/{x.required.length}</strong></div>
     <div className="dosv-meta"><span>{x.d.deadline?new Date(x.d.deadline).toLocaleDateString('fr-FR'):'Échéance inconnue'}</span><span>{x.docs.length} doc.</span><span>{x.blocking.length} blocage(s)</span></div>
     <footer>{x.outcome?<b className="result">{human(x.outcome.result)}</b>:x.proof?<b className="info">Déposé · résultat attendu</b>:x.ready?<b className="ready">Prêt à déposer</b>:x.late?<b className="latepill">Échéance dépassée</b>:<b>En préparation</b>}<em>Ouvrir →</em></footer>
    </article>
   }):<div className="dosv-empty">Aucun dossier dans cette vue.</div>}
  </section>

  {selected&&<section className="dosv-focus">
   <div><small>DOSSIER SÉLECTIONNÉ</small><h3>{selected.d.reference} · {selected.d.title}</h3><p>{selected.blocking.length} exigence(s) obligatoire(s) bloquante(s) · validation finale {selected.validation?human(selected.validation.status):'non demandée'} · {selected.proof?'dépôt prouvé':'dépôt non prouvé'}.</p></div>
   <button onClick={()=>onOpen?.('dossiers',selected.d.id)}>Piloter ce dossier →</button>
  </section>}

  <details className="dosv-tools" open={Boolean(selectedId)}>
   <summary>{selectedId?'Pilotage détaillé du dossier':'Gestion détaillée · créer / piloter un dossier'}</summary>
   <CSSABusinessPage mode="dossiers" selectedId={selectedId} onOpen={onOpen}/>
  </details>
 </section>
}
