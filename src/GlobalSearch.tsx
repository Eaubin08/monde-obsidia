import {useEffect,useMemo,useState} from 'react'

type Layer={id:string;title:string;content:string;path:string;commit:string}
type Agent={id:number;name:string;family:string;role:string|null;output:string|null}
type Entity={id:string;kind:string;label:string;path?:string;source?:string;agentId?:string;targetPath?:string}
type Mission={id:string;label:string;actionId:string;agentId:string|null;status:string}
type Shared={entities:Entity[];missions:Mission[]}

type SearchKind='all'|'agent'|'mission'|'domain'|'file'|'proof'|'layer'

export default function GlobalSearch({layers,agents,files,shared,onFocus,onOpenFile,onOpenLayer}:{layers:Layer[];agents:Agent[];files:string[];shared:Shared|null;onFocus:(id:string)=>void;onOpenFile:(path:string)=>void;onOpenLayer:(id:string)=>void}){
 const initial=(sessionStorage.getItem('obsidia-search-kind')||'all') as SearchKind
 const [query,setQuery]=useState('')
 const [kindFilter,setKindFilter]=useState<SearchKind>(['all','agent','mission','domain','file','proof','layer'].includes(initial)?initial:'all')
 useEffect(()=>{const sync=(e:Event)=>{const kind=(e as CustomEvent<SearchKind>).detail;if(['all','agent','mission','domain','file','proof','layer'].includes(kind))setKindFilter(kind)};window.addEventListener('obsidia-search-kind',sync as EventListener);return()=>window.removeEventListener('obsidia-search-kind',sync as EventListener)},[])
 const q=query.trim().toLowerCase()
 const results=useMemo(()=>{
  if(q.length<2)return []
  const out:{id:string;kind:string;label:string;meta:string;action:()=>void}[]=[]
  for(const a of agents)if((a.name+' '+a.family+' '+(a.role||'')+' '+(a.output||'')).toLowerCase().includes(q))out.push({id:'agent-rd:'+a.id,kind:'Agent R&D',label:a.name,meta:a.family,action:()=>{}})
  for(const l of layers)if((l.title+' '+l.id+' '+l.path+' '+l.content).toLowerCase().includes(q))out.push({id:'layer:'+l.id,kind:'Couche',label:l.title,meta:l.path,action:()=>onOpenLayer(l.id)})
  for(const p of files)if(p.toLowerCase().includes(q))out.push({id:'file:'+p,kind:'Fichier',label:p.split('/').at(-1)||p,meta:p,action:()=>onOpenFile(p)})
  for(const e of shared?.entities||[])if((e.label+' '+e.kind+' '+(e.path||'')+' '+(e.source||'')+' '+(e.targetPath||'')).toLowerCase().includes(q))out.push({id:e.id,kind:e.kind,label:e.label,meta:e.path||e.targetPath||e.source||e.id,action:()=>onFocus(e.id)})
  for(const m of shared?.missions||[])if((m.label+' '+m.actionId+' '+(m.agentId||'')+' '+m.status).toLowerCase().includes(q))out.push({id:m.id,kind:'Mission',label:m.actionId,meta:(m.agentId||'agent non relié')+' · '+m.status,action:()=>onFocus(m.id)})
  const matches=(r:{kind:string})=>{
   if(kindFilter==='all')return true
   const k=r.kind.toLowerCase()
   if(kindFilter==='agent')return k.includes('agent')
   if(kindFilter==='mission')return k.includes('mission')
   if(kindFilter==='domain')return k.includes('domain')
   if(kindFilter==='file')return k.includes('fichier')
   if(kindFilter==='layer')return k.includes('couche')
   if(kindFilter==='proof')return ['decision_record','sealed_receipt','rollback_evidence','impact','result','artifact','receipt'].some(x=>k.includes(x))
   return true
  }
  return out.filter(matches).slice(0,80)
 },[q,kindFilter,layers,agents,files,shared,onFocus,onOpenFile,onOpenLayer])
 const setKind=(kind:SearchKind)=>{sessionStorage.setItem('obsidia-search-kind',kind);setKindFilter(kind)}
 return <section className="global-search">
  <div className="global-search-head"><div><span className="eyebrow">RECHERCHE GLOBALE</span><h2>Retrouver n’importe quoi dans Obsidia</h2><p>Agents · couches · fichiers · missions · résultats · preuves.</p></div><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Chercher agent, mission, fichier, preuve…" aria-label="Recherche globale Obsidia"/></div>
  <nav className="global-search-filters" aria-label="Filtres de recherche">{([['all','Tout'],['agent','Agents'],['mission','Missions'],['domain','Domaines'],['file','Fichiers'],['proof','Preuves / résultats'],['layer','Couches']] as [SearchKind,string][]).map(([id,label])=><button key={id} aria-pressed={kindFilter===id} onClick={()=>setKind(id)}>{label}</button>)}</nav>
  {q.length>=2&&<div className="global-search-results">{results.length?results.map(r=><button key={r.id} onClick={r.action}><span>{r.kind}</span><strong>{r.label}</strong><small>{r.meta}</small></button>):<p>Aucun résultat.</p>}</div>}
 </section>
}
