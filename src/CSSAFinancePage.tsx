import {useEffect,useMemo,useState} from 'react'
import './CSSAFinancePage.css'
import CSSABusinessPage from './CSSABusinessPage'

type Revenue={id:string;category:string;label:string;amount:number;date:string;status:string;matchRef:string|null;source:string}
type Expense={id:string;category:string;label:string;amount:number;date:string;status:string;matchRef:string|null;source:string}
type Invoice={id:string;direction:'EMISE'|'RECUE';number:string;party:string;label:string;amount:number;issuedAt:string;dueAt:string;status:string}
type Payment={id:string;invoiceId:string|null;direction:'ENTREE'|'SORTIE';amount:number;date:string;method:string;account:string;status:string}
type Treasury={id:string;account:string;date:string;direction:'ENTREE'|'SORTIE';label:string;amount:number;source:string}
type BusinessState={revenues:Revenue[];expenses:Expense[];invoices:Invoice[];payments:Payment[];treasuryEntries:Treasury[];updatedAt:string}
type Props={onOpen?:(moduleId:string,id?:string)=>void}

const euro=(n:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0)
const human=(v:string)=>v.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())

export default function CSSAFinancePage({onOpen}:Props){
 const [state,setState]=useState<BusinessState|null>(null)
 const [error,setError]=useState(false)
 const [tab,setTab]=useState<'overview'|'flows'|'invoices'|'treasury'>('overview')

 const refresh=async()=>{
  try{
   const r=await fetch('/obsidia-local/cssa-business-state',{cache:'no-store'})
   if(!r.ok)throw new Error('finance unavailable')
   setState(await r.json());setError(false)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])
 useEffect(()=>{const h=(e:Event)=>setState((e as CustomEvent<BusinessState>).detail);window.addEventListener('cssa-business-updated',h);return()=>window.removeEventListener('cssa-business-updated',h)},[])

 const projection=useMemo(()=>{
  const revenues=state?.revenues||[]
  const expenses=state?.expenses||[]
  const invoices=state?.invoices||[]
  const payments=state?.payments||[]
  const treasury=state?.treasuryEntries||[]
  const revenueTotal=revenues.reduce((s,x)=>s+Number(x.amount||0),0)
  const expenseTotal=expenses.reduce((s,x)=>s+Number(x.amount||0),0)
  const receivable=invoices.filter(x=>x.direction==='EMISE'&&!['ENCAISSEE','ANNULEE'].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0)
  const payable=invoices.filter(x=>x.direction==='RECUE'&&!['PAYEE','ANNULEE'].includes(x.status)).reduce((s,x)=>s+Number(x.amount||0),0)
  const cashIn=treasury.filter(x=>x.direction==='ENTREE').reduce((s,x)=>s+Number(x.amount||0),0)
  const cashOut=treasury.filter(x=>x.direction==='SORTIE').reduce((s,x)=>s+Number(x.amount||0),0)
  const paymentIn=payments.filter(x=>x.direction==='ENTREE').reduce((s,x)=>s+Number(x.amount||0),0)
  const paymentOut=payments.filter(x=>x.direction==='SORTIE').reduce((s,x)=>s+Number(x.amount||0),0)
  const overdue=invoices.filter(x=>x.dueAt&&x.dueAt<new Date().toISOString().slice(0,10)&&!['PAYEE','ENCAISSEE','ANNULEE'].includes(x.status))
  return {revenueTotal,expenseTotal,result:revenueTotal-expenseTotal,receivable,payable,cash:cashIn-cashOut,paymentIn,paymentOut,overdue}
 },[state])

 if(error)return <section className="finx"><div className="finx-empty">État financier indisponible.</div></section>
 if(!state)return <section className="finx"><div className="finx-empty">Chargement…</div></section>

 return <section className="finx">
  <header className="finx-hero">
   <div><small>FINANCE CSSA</small><h2>Où est l’argent du club ?</h2><p>Lecture consolidée des recettes, dépenses, factures, paiements et mouvements de trésorerie déjà saisis.</p></div>
   <button onClick={refresh}>Actualiser</button>
  </header>

  <div className="finx-kpis">
   <article className="primary"><small>RÉSULTAT OBSERVÉ</small><strong>{euro(projection.result)}</strong><span>{euro(projection.revenueTotal)} recettes · {euro(projection.expenseTotal)} dépenses</span></article>
   <article><small>À ENCAISSER</small><strong>{euro(projection.receivable)}</strong><span>Factures émises ouvertes</span></article>
   <article><small>À PAYER</small><strong>{euro(projection.payable)}</strong><span>Factures reçues ouvertes</span></article>
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
     <small>PHOTO FINANCIÈRE</small><h3>{projection.result>=0?'Solde d’exploitation positif':'Solde d’exploitation négatif'}</h3>
     <div className="finx-balance"><span>Recettes</span><b>{euro(projection.revenueTotal)}</b></div>
     <div className="finx-balance"><span>Dépenses</span><b>{euro(projection.expenseTotal)}</b></div>
     <div className="finx-balance total"><span>Écart</span><b>{euro(projection.result)}</b></div>
    </article>
    <article className="finx-panel">
     <small>À SURVEILLER</small><h3>{projection.overdue.length} facture(s) en retard</h3>
     {projection.overdue.length?projection.overdue.slice(0,5).map(x=><button key={x.id} onClick={()=>setTab('invoices')}><span>{x.number||x.label}</span><b>{euro(x.amount)}</b></button>):<p>Aucune facture en retard issue des données saisies.</p>}
    </article>
   </section>
   <section className="finx-strip">
    <div><small>PAIEMENTS ENTRANTS</small><strong>{euro(projection.paymentIn)}</strong></div>
    <div><small>PAIEMENTS SORTANTS</small><strong>{euro(projection.paymentOut)}</strong></div>
    <div><small>ÉTAT</small><strong>{state.updatedAt?new Date(state.updatedAt).toLocaleString('fr-FR'):'Inconnu'}</strong></div>
   </section>
  </>}

  {tab==='flows'&&<section className="finx-columns">
   <article className="finx-panel"><header><div><small>RECETTES</small><h3>{euro(projection.revenueTotal)}</h3></div><button onClick={()=>onOpen?.('commercial')}>Ouvrir Commerce →</button></header>{state.revenues.length?state.revenues.map(x=><div className="finx-row" key={x.id}><div><strong>{x.label}</strong><small>{human(x.category)} · {x.date}</small></div><b>+ {euro(x.amount)}</b></div>):<p>Aucune recette saisie.</p>}</article>
   <article className="finx-panel"><header><div><small>DÉPENSES</small><h3>{euro(projection.expenseTotal)}</h3></div></header>{state.expenses.length?state.expenses.map(x=><div className="finx-row" key={x.id}><div><strong>{x.label}</strong><small>{human(x.category)} · {x.date}</small></div><b>− {euro(x.amount)}</b></div>):<p>Aucune dépense saisie.</p>}</article>
  </section>}

  {tab==='invoices'&&<section className="finx-panel"><header><div><small>FACTURES</small><h3>À encaisser / à payer</h3></div></header>{state.invoices.length?state.invoices.map(x=><div className="finx-row" key={x.id}><div><strong>{x.number} · {x.label}</strong><small>{x.party} · échéance {x.dueAt||'inconnue'} · {human(x.status)}</small></div><b>{euro(x.amount)}</b></div>):<p>Aucune facture saisie.</p>}</section>}

  {tab==='treasury'&&<section className="finx-panel"><header><div><small>TRÉSORERIE</small><h3>Mouvements enregistrés</h3></div></header>{state.treasuryEntries.length?state.treasuryEntries.map(x=><div className="finx-row" key={x.id}><div><strong>{x.label}</strong><small>{x.account} · {x.date} · {x.source}</small></div><b>{x.direction==='ENTREE'?'+':'−'} {euro(x.amount)}</b></div>):<p>Aucun mouvement de trésorerie enregistré.</p>}</section>}
  <details className="finx-tools"><summary>Gestion détaillée · saisir / modifier les données financières</summary><CSSABusinessPage mode="finance" onOpen={onOpen}/></details>
 </section>
}
