import {useEffect,useMemo,useState} from 'react'
import './CSSACommercePage.css'
import CSSABusinessPage from './CSSABusinessPage'

type Revenue={id:string;category:string;label:string;amount:number;date:string;status:string;matchRef:string|null;source:string}
type StockItem={id:string;label:string;channel:string;quantity:number;threshold:number|null;unitCost:number|null;unitPrice:number|null;status:string;source:string}
type Contract={id:string;kind:string;label:string;party:string;partyOrganizationId?:string|null;startAt:string;endAt:string;amount:number|null;status:string;source:string}
type Supplier={id:string;name:string;category:string;contact:string;status:string;source:string;organizationId?:string|null}
type BusinessState={revenues:Revenue[];stockItems:StockItem[];contracts:Contract[];suppliers:Supplier[];updatedAt:string}
type ExternalOrganization={id:string;name:string;kind:string;status:string}
type CrmDirectory={organizations:ExternalOrganization[]}
type Props={onOpen?:(moduleId:string,id?:string)=>void}

const euro=(n:number)=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0)
const human=(v:string)=>v.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())
const channels=[
 {id:'BILLETTERIE',label:'Billetterie',icon:'🎟',hint:'Matchs & abonnements'},
 {id:'BUVETTE',label:'Buvette',icon:'◉',hint:'Matchday & événements'},
 {id:'BOUTIQUE',label:'Boutique',icon:'◆',hint:'Merchandising'},
 {id:'SPONSORING',label:'Sponsoring',icon:'★',hint:'Visibilité partenaires'},
 {id:'PARTENARIAT',label:'Partenariats',icon:'◎',hint:'Relations commerciales'},
 {id:'EVENEMENT',label:'Événements',icon:'✦',hint:'Activations club'}
]

export default function CSSACommercePage({onOpen}:Props){
 const [state,setState]=useState<BusinessState|null>(null)
 const [crm,setCrm]=useState<CrmDirectory|null>(null)
 const [error,setError]=useState(false)

 const refresh=async()=>{
  try{
   const [r,crmRes]=await Promise.all([
    fetch('/obsidia-local/cssa-business-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-crm-directory',{cache:'no-store'})
   ])
   if(!r.ok)throw new Error('commerce unavailable')
   setState(await r.json())
   if(crmRes.ok)setCrm(await crmRes.json())
   setError(false)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])
 useEffect(()=>{const h=(e:Event)=>setState((e as CustomEvent<BusinessState>).detail);window.addEventListener('cssa-business-updated',h);return()=>window.removeEventListener('cssa-business-updated',h)},[])

 const view=useMemo(()=>{
  const revenues=state?.revenues||[]
  const stocks=state?.stockItems||[]
  const contracts=state?.contracts||[]
  const partners=(crm?.organizations||[]).filter(x=>['SPONSOR','PARTENAIRE'].includes(x.kind))
  const total=revenues.reduce((s,x)=>s+Number(x.amount||0),0)
  const byChannel=Object.fromEntries(channels.map(c=>[c.id,revenues.filter(x=>x.category===c.id).reduce((s,x)=>s+Number(x.amount||0),0)]))
  const lowStock=stocks.filter(x=>x.threshold!=null&&x.quantity<=Number(x.threshold))
  const renewals=contracts.filter(x=>x.endAt&&x.endAt>=new Date().toISOString().slice(0,10)&&x.endAt<=new Date(Date.now()+60*86400000).toISOString().slice(0,10))
  return {partners,total,byChannel,lowStock,renewals}
 },[state,crm])

 if(error)return <section className="comx"><div className="comx-empty">État Commerce indisponible.</div></section>
 if(!state)return <section className="comx"><div className="comx-empty">Chargement…</div></section>

 return <section className="comx">
  <header className="comx-hero">
   <div className="comx-hero-copy"><small>COMMERCE CSSA</small><h2>Faire vivre les revenus du club</h2><p>Billetterie, buvette, boutique, sponsoring, partenariats et événements réunis dans une vue orientée exploitation.</p><div className="comx-hero-actions"><button onClick={()=>onOpen?.('crm')}>Voir les relations partenaires</button><button className="ghost" onClick={()=>onOpen?.('finance')}>Voir la lecture Finance</button></div></div>
   <div className="comx-hero-number"><small>RECETTES SAISIES</small><strong>{euro(view.total)}</strong><span>{state.revenues.length} flux observé(s)</span></div>
  </header>

  <section className="comx-channels">
   <header><div><small>ACTIVITÉ</small><h3>Canaux commerciaux</h3></div></header>
   <div className="comx-card-grid">{channels.map(c=><article key={c.id}>
    <div className="comx-card-icon">{c.icon}</div><small>{c.hint}</small><h4>{c.label}</h4><strong>{euro(Number(view.byChannel[c.id]||0))}</strong>
    <span>{state.revenues.filter(x=>x.category===c.id).length} opération(s)</span>
   </article>)}</div>
  </section>

  <section className="comx-partners">
   <header><div><small>PARTENAIRES & SPONSORS</small><h3>Écosystème commercial</h3></div><button onClick={()=>onOpen?.('crm')}>Ouvrir CRM →</button></header>
   {view.partners.length?<div className="comx-partner-grid">{view.partners.slice(0,8).map(p=><article key={p.id}><div className="comx-logo">{p.name.slice(0,2).toUpperCase()}</div><div><strong>{p.name}</strong><small>{human(p.kind)} · {human(p.status)}</small></div></article>)}</div>:<div className="comx-empty">Aucun partenaire canonique enregistré dans le CRM. Aucun logo ou partenaire n’est inventé.</div>}
  </section>

  <section className="comx-split">
   <article className="comx-panel">
    <header><div><small>STOCKS COMMERCIAUX</small><h3>Boutique & buvette</h3></div><span>{view.lowStock.length} alerte(s)</span></header>
    {state.stockItems.length?state.stockItems.slice(0,10).map(x=><div className="comx-row" key={x.id}><div><strong>{x.label}</strong><small>{x.channel} · seuil {x.threshold??'—'}</small></div><b>{x.quantity}</b></div>):<p>Aucun stock saisi.</p>}
   </article>
   <article className="comx-panel">
    <header><div><small>CONTRATS COMMERCIAUX</small><h3>À renouveler bientôt</h3></div><span>{view.renewals.length}</span></header>
    {view.renewals.length?view.renewals.map(x=><div className="comx-row" key={x.id}><div><strong>{x.label}</strong><small>{x.party} · {human(x.kind)}</small></div><b>{x.endAt}</b></div>):<p>Aucune échéance commerciale dans les 60 jours.</p>}
   </article>
  </section>

  <section className="comx-feed">
   <header><div><small>DERNIÈRES RECETTES</small><h3>Activité enregistrée</h3></div><button onClick={()=>onOpen?.('finance')}>Consolidation Finance →</button></header>
   {state.revenues.length?<div>{state.revenues.slice(0,12).map(x=><article key={x.id}><span>{human(x.category)}</span><div><strong>{x.label}</strong><small>{x.date}{x.matchRef?' · '+x.matchRef:''}</small></div><b>{euro(x.amount)}</b></article>)}</div>:<p className="comx-empty">Aucune recette saisie.</p>}
  </section>
  <details className="comx-tools"><summary>Gestion détaillée · saisir / modifier l’activité commerciale</summary><CSSABusinessPage mode="commerce" onOpen={onOpen}/></details>
 </section>
}
