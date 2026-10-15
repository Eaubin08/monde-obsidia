import {useState} from 'react'
import {useCssaEconomy} from './useCssaEconomy'
import {emptyEconomy,projectCssaEconomy,economicParty,finite} from './cssaEconomy'
import {cssaSourceAvailable,resolveCssaReference,referenceLabels} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import useCssaPeople from './useCssaPeople'
import {resolveCssaPerson} from './cssaPeopleProjection'
import './CSSAFinancePage.css'
import CSSABusinessPage from './CSSABusinessPage'

type Props={onOpen?:(moduleId:string,id?:string)=>void}

const euro=(n:unknown)=>finite(n)?new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n):'UNKNOWN'
const human=(v:unknown)=>String(v||'UNKNOWN').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSAFinancePage({onOpen}:Props){
 const {state:observed,crm,error,refresh}=useCssaEconomy()
 const people=useCssaPeople()
 const state=cssaSourceAvailable(observed)?observed!:emptyEconomy
 const projection=projectCssaEconomy(observed,new Date().toISOString().slice(0,10))
 const [tab,setTab]=useState<'overview'|'flows'|'invoices'|'treasury'>('overview')
 return <section className="finx">
  {observed?<CSSAStoreSourceNotice state={observed}/>:<p>UNKNOWN · source Business {error?'indisponible ou invalide':'en cours de lecture'}.</p>}
  <p>Montants déclarés dans le registre local, tous statuts conservés. Aucun rapprochement automatique entre flux, factures, paiements et trésorerie.</p>
  <header className="finx-hero">
   <div><small>FINANCE CSSA</small><h2>Où est l’argent du club ?</h2><p>Lecture consolidée des recettes, dépenses, factures, paiements et mouvements de trésorerie déjà saisis.</p></div>
   <button onClick={refresh}>Actualiser</button>
  </header>

  <div className="finx-kpis">
   <article className="primary"><small>ÉCART DES FLUX SAISIS</small><strong>{euro(projection.result)}</strong><span>{euro(projection.revenueTotal)} recettes · {euro(projection.expenseTotal)} dépenses</span></article>
   <article><small>À ENCAISSER</small><strong>{euro(projection.receivable)}</strong><span>Factures émises ouvertes · hors rapprochement</span></article>
   <article><small>À PAYER</small><strong>{euro(projection.payable)}</strong><span>Factures reçues ouvertes · hors rapprochement</span></article>
   <article><small>TRÉSORERIE SAISIE</small><strong>{euro(projection.cash)}</strong><span>Entrées moins sorties enregistrées</span></article>
  </div>

  <nav className="finx-tabs">
   <button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>Vue d’ensemble</button>
   <button className={tab==='flows'?'active':''} onClick={()=>setTab('flows')}>Recettes & dépenses</button>
   <button className={tab==='invoices'?'active':''} onClick={()=>setTab('invoices')}>Factures & paiements</button>
   <button className={tab==='treasury'?'active':''} onClick={()=>setTab('treasury')}>Trésorerie</button>
  </nav>

  {tab==='overview'&&<>
   <section className="finx-visual-grid">
    <article className="finx-panel highlight">
     <small>PHOTO FINANCIÈRE</small><h3>{projection.result===null?'UNKNOWN · écart indisponible':projection.result>=0?'Écart des saisies positif':'Écart des saisies négatif'}</h3>
     <div className="finx-balance"><span>Recettes</span><b>{euro(projection.revenueTotal)}</b></div>
     <div className="finx-balance"><span>Dépenses</span><b>{euro(projection.expenseTotal)}</b></div>
     <div className="finx-balance total"><span>Écart</span><b>{euro(projection.result)}</b></div>
    </article>
    <article className="finx-panel">
     <small>À SURVEILLER</small><h3>{projection.available?projection.overdue.length:'UNKNOWN'} facture(s) datée(s) en retard</h3>
     {projection.overdue.length?projection.overdue.slice(0,5).map(x=><button key={x.id} onClick={()=>setTab('invoices')}><span>{x.number||x.label}</span><b>{euro(x.amount)}</b></button>):<p>{projection.available?'Aucune facture datée en retard dans les saisies.':'UNKNOWN · factures indisponibles.'}</p>}
    </article>
   </section>
   <p>{projection.invoiceUnknown?'UNKNOWN · sens ou statut de facture à revoir. ':''}{projection.available?projection.invalidDates.length:'UNKNOWN'} échéance(s) invalide(s) à revoir ; aucune date reconstruite.</p>
   <section className="finx-strip">
    <div><small>PAIEMENTS ENTRANTS</small><strong>{euro(projection.paymentIn)}</strong></div>
    <div><small>PAIEMENTS SORTANTS</small><strong>{euro(projection.paymentOut)}</strong></div>
    <div><small>ÉTAT</small><strong>{state.updatedAt?new Date(state.updatedAt).toLocaleString('fr-FR'):'Inconnu'}</strong></div>
   </section>
  </>}

  {tab==='flows'&&<section className="finx-columns">
   <article className="finx-panel"><header><div><small>RECETTES</small><h3>{euro(projection.revenueTotal)}</h3></div><button onClick={()=>onOpen?.('commercial')}>Ouvrir Commerce →</button></header>{state.revenues.length?state.revenues.map((x,index)=><div className="finx-row" key={x.id+':'+index}><div><strong>{x.label}</strong><small>{human(x.category)} · {x.date} · {x.status} · {x.source} · {resolveCssaPerson(x.recordedByPersonId,undefined,people)}</small></div><b>+ {euro(x.amount)}</b></div>):<p>{projection.available?'Aucune recette saisie.':'UNKNOWN · recettes indisponibles.'}</p>}</article>
   <article className="finx-panel"><header><div><small>DÉPENSES</small><h3>{euro(projection.expenseTotal)}</h3></div></header>{state.expenses.length?state.expenses.map((x,index)=><div className="finx-row" key={x.id+':'+index}><div><strong>{x.label}</strong><small>{human(x.category)} · {x.date} · {x.status} · {x.source} · {resolveCssaPerson(x.recordedByPersonId,undefined,people)}</small></div><b>− {euro(x.amount)}</b></div>):<p>{projection.available?'Aucune dépense saisie.':'UNKNOWN · dépenses indisponibles.'}</p>}</article>
  </section>}

  {tab==='invoices'&&<section className="finx-panel"><header><div><small>FACTURES</small><h3>À encaisser / à payer</h3></div></header>{state.invoices.length?state.invoices.map((x,index)=><div className="finx-row" key={x.id+':'+index}><div><strong>{x.number} · {x.label}</strong><small>{economicParty(x.partyOrganizationId,x.party,crm)} · responsable {resolveCssaPerson(x.responsiblePersonId,undefined,people)} · {x.source} · échéance {x.dueAt||'inconnue'} · {human(x.status)}</small></div><b>{euro(x.amount)}</b></div>):<p>{projection.available?'Aucune facture saisie.':'UNKNOWN · factures indisponibles.'}</p>}</section>}

  {tab==='invoices'&&<section className="finx-panel"><header><div><small>PAIEMENTS DÉCLARÉS</small><h3>Enregistrements sans rapprochement automatique</h3></div></header>
   {state.payments.length?state.payments.map((x,index)=>{
    const linked=resolveCssaReference(x.invoiceId,state.invoices,projection.available)
    return <div className="finx-row" key={x.id+':'+index}><div><strong>{x.account} · {x.direction} · {x.status}</strong><small>{x.date} · {x.source} · {resolveCssaPerson(x.recordedByPersonId,undefined,people)} · facture {linked.item?linked.item.number||linked.item.label:referenceLabels[linked.status]}{x.invoiceId?' · '+x.invoiceId:''}</small></div><b>{euro(x.amount)}</b></div>
   }):<p>{projection.available?'Aucun paiement déclaré.':'UNKNOWN · paiements indisponibles.'}</p>}
  </section>}
  {tab==='treasury'&&<section className="finx-panel"><header><div><small>TRÉSORERIE</small><h3>Mouvements enregistrés</h3></div></header>{state.treasuryEntries.length?state.treasuryEntries.map((x,index)=><div className="finx-row" key={x.id+':'+index}><div><strong>{x.label}</strong><small>{x.account} · {x.date} · {x.source} · {resolveCssaPerson(x.recordedByPersonId,undefined,people)}</small></div><b>{x.direction==='ENTREE'?'+':x.direction==='SORTIE'?'−':'UNKNOWN ·'} {euro(x.amount)}</b></div>):<p>{projection.available?'Aucun mouvement de trésorerie enregistré.':'UNKNOWN · trésorerie indisponible.'}</p>}</section>}
  <details className="finx-tools"><summary>Gestion détaillée · saisir / modifier les données financières</summary><CSSABusinessPage mode="finance" onOpen={onOpen}/></details>
 </section>
}
