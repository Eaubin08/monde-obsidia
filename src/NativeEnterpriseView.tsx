import {useEffect,useMemo,useState} from 'react'
import './NativeEnterpriseView.css'

type Entity={
 id:string;kind:string;label:string;evidence_hash:string;verification:string;
 status?:string|null;priority?:string|null;due_at?:string|null;
 provider?:string;gate?:string|null;receipt_type?:string;mode?:string
}
type Relation={from:string;type:string;to:string}
type ReadModel={
 schema:string;available:boolean;readonly:boolean;
 decision_authority:string;reason?:string;
 entities:Entity[];relations:Relation[];availability:Record<string,string>;
 projection_hash?:string
}
const categoryTitles:Record<string,string>={
 source:'Sources',case:'Dossiers',task:'Tâches',followup:'Suivis',
 interaction:'Interactions',relationship:'Relations',interpretation:'Interprétations',
 action_candidate:'Intentions / actions proposées',provider_binding:'Bindings fournisseurs',
 decision:'Décisions KX108',world_action:'Actions gouvernées',receipt:'Receipts',
 alert:'Alertes',record:'Contacts / organisations'
}
export default function NativeEnterpriseView(){
 const [model,setModel]=useState<ReadModel|null>(null)
 const [error,setError]=useState('')
 const [category,setCategory]=useState('all')
 const [selected,setSelected]=useState('')
 useEffect(()=>{
  const controller=new AbortController()
  fetch('/obsidia-local/native-enterprise',{signal:controller.signal,cache:'no-store'})
   .then(response=>{if(!response.ok)throw new Error('La lecture locale est indisponible');return response.json()})
   .then(data=>{if(!controller.signal.aborted)setModel(data)})
   .catch(e=>{if(!controller.signal.aborted)setError(String(e))})
  return()=>controller.abort()
 },[])
 const entities=model?.entities||[]
 const counts=useMemo(()=>entities.reduce<Record<string,number>>((acc,e)=>{
  acc[e.kind]=(acc[e.kind]||0)+1;return acc
 },{}),[entities])
 const categories=Object.keys(categoryTitles)
 const visible=entities.filter(e=>category==='all'||e.kind===category)
 const active=entities.find(e=>e.id===selected)
 const links=(model?.relations||[]).filter(r=>r.from===selected||r.to===selected)
 return <section className="native-enterprise" aria-label="État natif entreprise Obsidia">
  <div className="native-enterprise-head">
   <div><span className="eyebrow">DONNÉES CANONIQUES · READ-ONLY</span>
    <h1>Monde · Entreprise native</h1>
    <p>Objets persistés et preuves, sans simulation ni exécution.</p></div>
   <span className="native-readonly">Lecture seule · KX108_ONLY</span>
  </div>
  {error&&<p role="alert">{error}</p>}
  {!model&&!error&&<p>Lecture des stores natifs…</p>}
  {model&&!model.available&&<div className="native-unavailable">
   <strong>Stores natifs non raccordés.</strong>
   <p>{model.reason||'Aucun état observé'}. Configure les chemins locaux des stores pour afficher les preuves ; aucune donnée fictive n’est affichée.</p>
  </div>}
  {model?.available&&<>
   <p className="native-proof">Projection {model.projection_hash?.slice(0,16)||'indisponible'} · {entities.length} objets persistés · lecture seule</p>
   <div className="native-category-grid">
    {categories.map(kind=><button key={kind} type="button"
     className={category===kind?'selected':''} onClick={()=>{setCategory(kind);setSelected('')}}>
      <strong>{counts[kind]||0}</strong><span>{categoryTitles[kind]}</span>
      <small>{model.availability?.[kind]||'UNAVAILABLE'}</small>
     </button>)}
   </div>
   <div className="native-body">
    <div className="native-objects">
     <header><h2>{category==='all'?'Tous les objets':categoryTitles[category]}</h2>
      <button type="button" onClick={()=>{setCategory('all');setSelected('')}}>Tout voir</button></header>
     {!visible.length&&<p>Aucun objet canonique persisté pour cette catégorie. Aucun objet n’est inventé.</p>}
     {visible.map(e=><button type="button" key={e.id} className={selected===e.id?'active':''}
      onClick={()=>setSelected(e.id)}>
      <strong>{e.label}</strong><small>{e.kind} · {e.verification}</small>
      <span>{e.status||e.gate||e.mode||''}</span>
     </button>)}
    </div>
    <aside className="native-inspector">
     {active?<><span className="eyebrow">PREUVE / PROVENANCE</span>
      <h2>{active.label}</h2>
      <p>{active.kind} · {active.verification}</p>
      <dl>{Object.entries(active).filter(([k])=>!['label'].includes(k)).map(([k,v])=>
       <div key={k}><dt>{k}</dt><dd>{String(v??'—')}</dd></div>)}</dl>
      <h3>Relations constatées</h3>
      {!links.length&&<p>Aucune relation persistée ou vérifiable.</p>}
      {links.map((r,i)=><button type="button" key={i}
       onClick={()=>{const next=r.from===selected?r.to:r.from;setSelected(next);setCategory('all')}}>
       {r.type} · {r.from===selected?r.to:r.from}
      </button>)}
     </>:<><h2>Sélectionne un objet</h2><p>Inspecte son empreinte, son état et ses relations observées.</p></>}
    </aside>
   </div>
  </>}
 </section>
}
