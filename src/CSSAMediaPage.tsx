import './CSSAMediaPage.css'

type Props={onOpen?:(moduleId:string,id?:string)=>void}
const channels=[
 {id:'dvcr',name:'DVCR',kind:'Diffusion / média',status:'RACCORDE',url:'https://www.dvcr.fr/',mark:'DV'},
 {id:'site',name:'Site officiel CSSA',kind:'Actualités officielles',status:'RACCORDE',url:'https://cs-sedan.fr/',mark:'CS'},
 {id:'instagram',name:'Instagram CSSA',kind:'Réseau social',status:'A_RACCORDER',url:'',mark:'IG'},
 {id:'facebook',name:'Facebook CSSA',kind:'Réseau social',status:'A_RACCORDER',url:'',mark:'FB'}
]

export default function CSSAMediaPage({onOpen}:Props){
 return <section className="medx">
  <header className="medx-hero">
   <div className="medx-feature">
    <span className="medx-kicker">MÉDIA CSSA</span>
    <h2>Le club vu, raconté et diffusé.</h2>
    <p>Un même centre pour DVCR, le site officiel, les réseaux sociaux, les contenus Matchday, les interviews, photos, lives et replays.</p>
    <div className="medx-actions"><a href="https://www.dvcr.fr/" target="_blank" rel="noreferrer">Ouvrir DVCR ↗</a><button onClick={()=>onOpen?.('sportif')}>Voir le prochain match</button></div>
   </div>
   <div className="medx-poster"><div className="medx-play">▶</div><small>DIFFUSION</small><strong>DVCR</strong><span>Lives · replays · interviews · débriefs</span></div>
  </header>

  <section className="medx-section">
   <header><div><small>CANAUX</small><h3>Présence publique du club</h3></div><span>{channels.length} canaux suivis</span></header>
   <div className="medx-channel-grid">{channels.map(c=><article key={c.id}>
    <div className={'medx-channel-mark '+c.id}>{c.mark}</div>
    <div><small>{c.kind}</small><h4>{c.name}</h4><span className={c.status==='RACCORDE'?'ok':'hold'}>{c.status==='RACCORDE'?'Raccordé':'À raccorder'}</span></div>
    {c.url?<a href={c.url} target="_blank" rel="noreferrer">Ouvrir ↗</a>:<em>URL canonique non enregistrée</em>}
   </article>)}</div>
  </section>

  <section className="medx-grid">
   <article className="medx-panel">
    <header><div><small>À LA UNE</small><h3>Contenus liés au sportif</h3></div><button onClick={()=>onOpen?.('matchday')}>Matchday →</button></header>
    <div className="medx-feature-card"><div className="medx-art">CSSA</div><div><strong>Prochain contenu de match</strong><p>Les contenus seront reliés au match, à l’équipe, au canal et à leur source. Aucun contenu n’est simulé ici.</p><button onClick={()=>onOpen?.('sportif')}>Ouvrir Sportif</button></div></div>
   </article>
   <article className="medx-panel">
    <header><div><small>BIBLIOTHÈQUE</small><h3>Photos, vidéos & publications</h3></div></header>
    <div className="medx-library-empty"><div>▧</div><strong>Aucun catalogue média canonique encore raccordé</strong><span>Le futur objet média gardera canal, date, match, équipe, personne, partenaire, URL et provenance.</span></div>
   </article>
  </section>

  <section className="medx-partner-strip">
   <div><small>PARTENAIRES × MÉDIA</small><h3>Activation & visibilité</h3><p>Les partenaires du Commerce pourront être reliés aux publications, panneaux, interviews, Matchday et contenus DVCR sans dupliquer leur identité CRM.</p></div>
   <button onClick={()=>onOpen?.('commercial')}>Voir Partenaires & Sponsors →</button>
  </section>
 </section>
}
