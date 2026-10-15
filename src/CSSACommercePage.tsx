import {useMemo} from 'react'
import {useCssaEconomy} from './useCssaEconomy'
import {emptyEconomy,projectCssaEconomy,economicParty,sumDeclared,finite,validDay} from './cssaEconomy'
import {cssaSourceAvailable} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import './CSSACommercePage.css'
import CSSABusinessPage from './CSSABusinessPage'

type Props={onOpen?:(moduleId:string,id?:string)=>void}

const euro=(n:unknown)=>finite(n)?new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n):'UNKNOWN'
const human=(v:unknown)=>String(v||'UNKNOWN').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())
const channels=[
 {id:'BILLETTERIE',label:'Billetterie',icon:'🎟',hint:'Matchs & abonnements'},
 {id:'BUVETTE',label:'Buvette',icon:'◉',hint:'Matchday & événements'},
 {id:'BOUTIQUE',label:'Boutique',icon:'◆',hint:'Merchandising'},
 {id:'SPONSORING',label:'Sponsoring',icon:'★',hint:'Visibilité partenaires'},
 {id:'PARTENARIAT',label:'Partenariats',icon:'◎',hint:'Relations commerciales'},
 {id:'EVENEMENT',label:'Événements',icon:'✦',hint:'Activations club'}
]

export default function CSSACommercePage({onOpen}:Props){
 const {state:observed,crm,error}=useCssaEconomy()
 const available=cssaSourceAvailable(observed),crmAvailable=cssaSourceAvailable(crm)
 const state=available?observed!:emptyEconomy
 const projection=projectCssaEconomy(observed,new Date().toISOString().slice(0,10))
 const view=useMemo(()=>{
  const revenues=state?.revenues||[]
  const stocks=state?.stockItems||[]
  const contracts=state?.contracts||[]
  const partners=(crmAvailable?crm?.organizations||[]:[]).filter(x=>['SPONSOR','PARTENAIRE'].includes(x.kind))
  const total=projection.revenueTotal
  const byChannel=Object.fromEntries(channels.map(c=>[c.id,available?sumDeclared(revenues.filter(x=>x.category===c.id)):null]))
  const lowStock=stocks.filter(x=>finite(x.threshold)&&finite(x.quantity)&&x.quantity<=x.threshold)
  const renewals=contracts.filter(x=>!['TERMINE','ANNULE'].includes(x.status)&&validDay(x.endAt)&&x.endAt>=new Date().toISOString().slice(0,10)&&x.endAt<=new Date(Date.now()+60*86400000).toISOString().slice(0,10))
  return {partners,total,byChannel,lowStock,renewals,unknownStock:stocks.filter(x=>!finite(x.quantity)||!finite(x.threshold)).length}
 },[state,crm,crmAvailable,available,projection.revenueTotal])

 return <section className="comx">
  {observed?<CSSAStoreSourceNotice state={observed}/>:<p>UNKNOWN · source Business {error?'indisponible ou invalide':'en cours de lecture'}.</p>}
  {crm?<CSSAStoreSourceNotice state={crm}/>:<p>UNKNOWN · répertoire CRM indisponible ou en cours de lecture.</p>}
  <header className="comx-hero">
   <div className="comx-hero-copy"><small>COMMERCE CSSA</small><h2>Faire vivre les revenus du club</h2><p>Billetterie, buvette, boutique, sponsoring, partenariats et événements réunis dans une vue orientée exploitation.</p><div className="comx-hero-actions"><button onClick={()=>onOpen?.('crm')}>Voir les relations partenaires</button><button className="ghost" onClick={()=>onOpen?.('finance')}>Voir la lecture Finance</button></div></div>
   <div className="comx-hero-number"><small>RECETTES SAISIES</small><strong>{euro(view.total)}</strong><span>{available?state.revenues.length:'UNKNOWN'} flux saisi(s)</span></div>
  </header>

  <section className="comx-channels">
   <header><div><small>ACTIVITÉ</small><h3>Canaux commerciaux</h3></div></header>
   <div className="comx-card-grid">{channels.map(c=><article key={c.id}>
    <div className="comx-card-icon">{c.icon}</div><small>{c.hint}</small><h4>{c.label}</h4><strong>{euro(view.byChannel[c.id])}</strong>
    <span>{available?state.revenues.filter(x=>x.category===c.id).length:'UNKNOWN'} opération(s)</span>
   </article>)}</div>
  </section>

  <section className="comx-partners">
   <header><div><small>PARTENAIRES & SPONSORS</small><h3>Écosystème commercial</h3><span>{crmAvailable?Math.min(view.partners.length,8)+'/'+view.partners.length:'UNKNOWN'} affichés</span></div><button onClick={()=>onOpen?.('crm')}>Ouvrir CRM →</button></header>
   {!crmAvailable?<p>UNKNOWN · source partenaires CRM indisponible.</p>:view.partners.length?<div className="comx-partner-grid">{view.partners.slice(0,8).map((p,index)=><article key={p.id+':'+index}><div className="comx-logo">{p.name.slice(0,2).toUpperCase()}</div><div><button onClick={()=>onOpen?.('crm',p.id)}><strong>{p.name}</strong></button><small>{human(p.kind)} · {human(p.status)}</small></div></article>)}</div>:<div className="comx-empty">Aucun partenaire canonique enregistré dans le CRM. Aucun logo ou partenaire n’est inventé.</div>}
  </section>

  <section className="comx-split">
   <article className="comx-panel">
    <header><div><small>STOCKS COMMERCIAUX</small><h3>Boutique & buvette</h3></div><span>{available?view.lowStock.length:'UNKNOWN'} alerte(s)</span></header><p>{available?view.unknownStock:'UNKNOWN'} stock(s) à quantité ou seuil inconnu.</p>
    {state.stockItems.length?state.stockItems.slice(0,10).map((x,index)=><div className="comx-row" key={x.id+':'+index}><div><strong>{x.label}</strong><small>{x.channel} · seuil {x.threshold??'—'}</small></div><b>{finite(x.quantity)?x.quantity:'UNKNOWN'}</b></div>):<p>{available?'Aucun stock saisi.':'UNKNOWN · stocks indisponibles.'}</p>}
   </article>
   <article className="comx-panel">
    <header><div><small>CONTRATS COMMERCIAUX</small><h3>À renouveler bientôt</h3></div><span>{available?view.renewals.length:'UNKNOWN'}</span></header>
    {view.renewals.length?view.renewals.map((x,index)=><div className="comx-row" key={x.id+':'+index}><div><strong>{x.label}</strong><small>{economicParty(x.partyOrganizationId,x.party,crm)} · {human(x.kind)} · {x.status} · {x.source}</small></div><b>{x.endAt}</b></div>):<p>{available?'Aucune échéance commerciale dans les 60 jours.':'UNKNOWN · contrats indisponibles.'}</p>}
   </article>
  </section>

  <section className="comx-feed">
   <header><div><small>DERNIÈRES RECETTES</small><h3>Activité enregistrée</h3></div><button onClick={()=>onOpen?.('finance')}>Consolidation Finance →</button></header>
   {state.revenues.length?<div>{state.revenues.slice(0,12).map((x,index)=><article key={x.id+':'+index}><span>{human(x.category)}</span><div><strong>{x.label}</strong><small>{x.date}{x.matchRef?' · '+x.matchRef:''} · {x.status} · {x.source}</small></div><b>{euro(x.amount)}</b></article>)}</div>:<p className="comx-empty">{available?'Aucune recette saisie.':'UNKNOWN · recettes indisponibles.'}</p>}
  </section>
  <details className="comx-tools"><summary>Gestion détaillée · saisir / modifier l’activité commerciale</summary><CSSABusinessPage mode="commerce" onOpen={onOpen}/></details>
 </section>
}
