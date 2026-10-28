import {useEffect,useState} from 'react'
import {readCssaMediaCache,publicMediaUrl,type MediaCache} from './cssaMediaLocal'
import {readCssaCrm} from './cssaCrmWrite'
import {cssaSourceAvailable} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import './CSSAMediaPage.css'

type Props={onOpen?:(moduleId:string,id?:string)=>void}
const channels=[
 {id:'dvcr',name:'DVCR',kind:'Diffusion / média',status:'REFERENCE',url:'https://www.dvcr.fr/',mark:'DV'},
 {id:'site',name:'Site officiel CSSA',kind:'Actualités officielles',status:'REFERENCE',url:'https://cs-sedan.fr/',mark:'CS'},
 {id:'instagram',name:'Instagram CSSA',kind:'Réseau social',status:'A_RACCORDER',url:'',mark:'IG'},
 {id:'facebook',name:'Facebook CSSA',kind:'Réseau social',status:'A_RACCORDER',url:'',mark:'FB'}
]

export default function CSSAMediaPage({onOpen}:Props){
 const [cache,setCache]=useState<MediaCache|null>(null)
 const [crm,setCrm]=useState<{organizations:{id:string;name:string;kind:string;status:string}[]}|null>(null)
 useEffect(()=>{
  let active=true,generation=0
  const refresh=async()=>{
   const request=++generation
   const [media,directory]=await Promise.allSettled([readCssaMediaCache(),readCssaCrm<{organizations:{id:string;name:string;kind:string;status:string}[]}>()])
   if(!active||request!==generation)return
   setCache(media.status==='fulfilled'?media.value:null)
   setCrm(directory.status==='fulfilled'&&cssaSourceAvailable(directory.value)?directory.value:null)
  }
  void refresh();const timer=window.setInterval(refresh,15000);window.addEventListener('cssa-crm-updated',refresh)
  return()=>{active=false;generation++;window.clearInterval(timer);window.removeEventListener('cssa-crm-updated',refresh)}
 },[])
 const available=cssaSourceAvailable(cache)
 const articles=available?cache?.dvcrMedia?.articles||[]:[]
 const partners=(crm?.organizations||[]).filter(x=>['SPONSOR','PARTENAIRE'].includes(x.kind))
 return <section className="medx">
  {cache?<CSSAStoreSourceNotice state={cache}/>:<p>UNKNOWN · cache local de veille indisponible ou en cours de lecture.</p>}
  <p>Liens de référence et captures locales historiques. Aucun état de diffusion actuel n’est déduit du cache. Dernière capture : {available?cache?.observedAt:'UNKNOWN'}.</p>
  <header className="medx-hero">
   <div className="medx-feature">
    <span className="medx-kicker">MÉDIA CSSA</span>
    <h2>Le club vu, raconté et diffusé.</h2>
    <p>Un même centre pour DVCR, le site officiel, les réseaux sociaux, les contenus Matchday, les interviews, photos, lives et replays.</p>
    <div className="medx-actions"><a href="https://www.dvcr.fr/" target="_blank" rel="noreferrer">Ouvrir DVCR ↗</a><button onClick={()=>onOpen?.('sportif')}>Ouvrir le calendrier sportif</button></div>
   </div>
   <div className="medx-poster"><div className="medx-play">▶</div><small>DIFFUSION</small><strong>DVCR</strong><span>Lives · replays · interviews · débriefs</span></div>
  </header>

  <section className="medx-section">
   <header><div><small>CANAUX</small><h3>Présence publique du club</h3></div><span>{channels.length} références de canaux</span></header>
   <div className="medx-channel-grid">{channels.map(c=>{const observations=cache?.sources.filter(x=>x.id===(c.id==='dvcr'?'DVCR_HOME':c.id==='site'?'CSSA_OFFICIAL_RESULTS':''))||[];const observation=available&&observations.length===1?observations[0]:null;return <article key={c.id}>
    <div className={'medx-channel-mark '+c.id}>{c.mark}</div>
    <div><small>{c.kind}</small><h4>{c.name}</h4><span className="hold">{c.url?'Lien de référence':'URL UNKNOWN'} · capture {observation?observation.status+' · '+observation.observedAt:'UNKNOWN'}</span></div>
    {c.url?<a href={c.url} target="_blank" rel="noreferrer">Ouvrir ↗</a>:<em>URL canonique non enregistrée</em>}
   </article>})}</div>
  </section>

  <section className="medx-grid">
   <article className="medx-panel">
    <header><div><small>À LA UNE</small><h3>Contenus liés au sportif</h3></div><button onClick={()=>onOpen?.('matchday')}>Matchday →</button></header>
    <div className="medx-feature-card"><div className="medx-art">CSSA</div><div><strong>Prochain contenu de match</strong><p>Les captures disponibles ci-dessous gardent leur source. Aucun lien vers un match ou une équipe n’est déduit des titres.</p><button onClick={()=>onOpen?.('sportif')}>Ouvrir Sportif</button></div></div>
   </article>
   <article className="medx-panel">
    <header><div><small>BIBLIOTHÈQUE</small><h3>Photos, vidéos & publications</h3></div></header>
    {articles.length?<div>{articles.map((article,index)=><article key={article.url+':'+index}><strong>{article.title}</strong><p>{article.category} · DVCR · capture {cache?.observedAt}</p>{publicMediaUrl(article.url)?<a href={publicMediaUrl(article.url)} target="_blank" rel="noreferrer">Page source ↗</a>:<span>URL UNKNOWN</span>}</article>)}<p>Titres repérés par la veille existante ; aucun catalogue canonique de photos ou vidéos n’est déduit.</p></div>:<div className="medx-library-empty"><div>▧</div><strong>{available?'Aucun article repéré dans cette capture ; aucun catalogue média canonique raccordé':'UNKNOWN · contenus de la veille locale indisponibles'}</strong><span>Le futur objet média gardera canal, date, match, équipe, personne, partenaire, URL et provenance.</span></div>}
   </article>
  </section>

  <section className="medx-partner-strip">
   <div><small>PARTENAIRES × MÉDIA</small><h3>Activation & visibilité</h3><p>Les partenaires du Commerce pourront être reliés aux publications, panneaux, interviews, Matchday et contenus DVCR sans dupliquer leur identité CRM.</p></div>
   <p>{crm?partners.length:'UNKNOWN'} partenaire(s) CRM ; aucune association à une publication déduite.</p><button onClick={()=>onOpen?.('commercial')}>Voir Partenaires & Sponsors →</button>
  </section>
 </section>
}
