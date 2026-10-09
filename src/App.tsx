import { useEffect, useState } from 'react'
import LegacyWorld from './LegacyWorld'
import EnterpriseOrganizations from './EnterpriseOrganizations'
import './App.css'
import './Office.css'

type Agent = { id:string; name:string; role:string; zone:string; mission:string; state:string; rights:string; exchanges:string }
type Office = { zones:string[]; agents:Agent[] }
const key = 'obsidia-office-v1'
const states = ['Non vérifié', 'Travaille', 'Attend', 'Bloqué', 'Terminé']
const empty:Office = { zones:[], agents:[] }
function read():Office {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return valid(v) ? v : empty } catch { return empty }
}
function valid(v:unknown):v is Office {
  if (!v || typeof v !== 'object') return false
  const x = v as Office
  return Array.isArray(x.zones) && x.zones.every(z=>typeof z==='string' && z.trim()) && new Set(x.zones).size===x.zones.length && Array.isArray(x.agents) && new Set(x.agents.map(a=>a?.id)).size===x.agents.length && x.agents.every(a=>a && ['id','name','role','zone','mission','state','rights','exchanges'].every(k=>typeof a[k as keyof Agent]==='string') && a.id && a.name.trim() && states.includes(a.state) && (a.zone==='' || x.zones.includes(a.zone)))
}
export default function App() {
  const resolveView = () => location.hash === '#world' ? 'world' : location.hash === '#organizations' ? 'organizations' : 'agents'
  const [view,setView]=useState<'world'|'agents'|'organizations'>(resolveView)
  const [office,setOffice]=useState<Office>(read)
  const [selected,setSelected]=useState('')
  const [zone,setZone]=useState('')
  const [filter,setFilter]=useState('')
  const [error,setError]=useState('')
  useEffect(()=>{
    const sync=(e:StorageEvent)=>{if(e.key===key) setOffice(read())}
    const hash=()=>setView(resolveView())
    window.addEventListener('storage',sync); window.addEventListener('hashchange',hash)
    return()=>{window.removeEventListener('storage',sync);window.removeEventListener('hashchange',hash)}
  },[])
  function save(next:Office) {try {localStorage.setItem(key,JSON.stringify(next));setOffice(next);setError('')}catch{setError('Enregistrement local impossible. Exportez votre bureau avant de fermer.')}}
  const current=office.agents.find(a=>a.id===selected)
  function update(field:keyof Agent,value:string) {save({...office,agents:office.agents.map(a=>a.id===selected?{...a,[field]:value}:a)})}
  function addAgent() {const a:Agent={id:crypto.randomUUID(),name:'Agent à nommer',role:'',zone:office.zones[0] || '',mission:'',state:'Non vérifié',rights:'',exchanges:''};save({...office,agents:[...office.agents,a]});setSelected(a.id)}
  function exportOffice() {const url=URL.createObjectURL(new Blob([JSON.stringify(office,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='obsidia-bureau-rd.json';a.click();URL.revokeObjectURL(url)}
  return <div className="observatory">
    <header className="obs-header"><a href="#agents" className="brand">◈ OBSIDIA <small>ÉCOSYSTÈME / BUREAU R&D</small></a><span className="authority">KX108_ONLY</span></header>
    <nav className="view-nav" aria-label="Vues de l’écosystème"><a href="#agents" aria-current={view==='agents'?'page':undefined}>Pokémon View <small>Qui travaille</small></a><a href="#world" aria-current={view==='world'?'page':undefined}>Obsidia Monde <small>Carte précédente</small></a><a href="#organizations" aria-current={view==='organizations'?'page':undefined}>Entreprises & Organisations <small>CSSA</small></a><span>Workspace <small>Étape suivante</small></span><a href="#agents" target="_blank" rel="noreferrer">↗ Fenêtre indépendante</a></nav>
    {view==='world'?<LegacyWorld/>:view==='organizations'?<EnterpriseOrganizations/>:<>
    <section className="office-heading"><div><span className="eyebrow">LÀ OÙ TU VOIS LES AGENTS TRAVAILLER</span><h1>Bureau Pokémon R&D</h1><p>Zones · missions · états · échanges</p></div><div className="office-actions"><button onClick={exportOffice}>Exporter le bureau</button><label className="import-button">Importer une copie<input type="file" accept=".json,application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const data:unknown=JSON.parse(await file.text());if(!valid(data))throw Error();if(!window.confirm('Remplacer le bureau local par cette copie ?'))return;save(data);setSelected('')}catch{setError('Fichier invalide : bureau inchangé.')}e.target.value=''}}/></label></div></section>
    <p className="connection"><span/> Suivi manuel · runtime non raccordé · états déclarés, sans exécution</p>
    {error&&<p role="alert">{error}</p>}
    <div className="office-toolbar"><form onSubmit={e=>{e.preventDefault();const name=zone.trim();if(!name)return;if(office.zones.includes(name)){setError('Cette zone existe déjà.');return}save({...office,zones:[...office.zones,name]});setZone('')}}><input aria-label="Nom de la nouvelle zone" placeholder="Nom de ta zone" value={zone} onChange={e=>setZone(e.target.value)}/><button>+ Zone</button></form><button className="mint" onClick={addAgent}>+ Agent</button><select aria-label="Filtrer les états" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">Tous les états</option>{states.map(s=><option key={s}>{s}</option>)}</select><span>{office.agents.length} agent(s) · {office.zones.length} zone(s)</span></div>
    <main className="office-main"><section className="spatial-map" aria-label="Carte des agents R&D"><div className="map-caption">BUREAU R&D <span>Configuration locale</span></div><div className="rooms">
    {!office.zones.length&&<div className="empty-room"><span className="pixel-sprite"/><h2>Ton bureau est prêt à être peuplé.</h2><p>Ajoute tes zones et tes agents. Aucun nom, rôle ou chantier n’a été prérempli.</p><button onClick={addAgent}>Créer un agent</button></div>}
    {[...office.zones,''].filter(z=>z || office.agents.some(a=>!a.zone)).map((z,i)=><section className="room" key={z} style={{'--room-hue':`${150+i*29}`} as React.CSSProperties}><div className="room-sign"><h2>{z||'Sans affectation'}</h2><span>{office.agents.filter(a=>a.zone===z).length} agent(s)</span></div><div className="room-floor">{office.agents.filter(a=>a.zone===z&&(!filter||a.state===filter)).map(a=><button className={`agent-token ${selected===a.id?'focused':''}`} key={a.id} onClick={()=>setSelected(a.id)}><span className={`pixel-sprite state-${states.indexOf(a.state)}`} aria-hidden="true"/><strong>{a.name}</strong><small>{a.state}</small><span className="mission-bubble">{a.mission||'Mission non renseignée'}</span></button>)}{!office.agents.some(a=>a.zone===z&&(!filter||a.state===filter))&&<p className="vacant">{filter?'Aucun agent dans cet état':'Zone disponible'}</p>}</div></section>)}
    </div><div className="map-caption">{states.map((s,i)=><span key={s} className={`legend state-${i}`}>● {s}</span>)}</div></section>
    <aside className="agent-inspector"><span className="eyebrow">AGENT / MISSION / CONTEXTE</span>{current?<><h2>{current.name}</h2><p className="declared">Fiche manuelle · aucun processus connecté</p><label>Nom<input value={current.name} onChange={e=>update('name',e.target.value)}/></label><label>Rôle<input value={current.role} onChange={e=>update('role',e.target.value)}/></label><label>Zone<select value={current.zone} onChange={e=>update('zone',e.target.value)}><option value="">Sans affectation</option>{office.zones.map(z=><option key={z}>{z}</option>)}</select></label><label>État déclaré<select value={current.state} onChange={e=>update('state',e.target.value)}>{states.map(s=><option key={s}>{s}</option>)}</select></label><label>Mission<textarea value={current.mission} onChange={e=>update('mission',e.target.value)}/></label><label>Droits renseignés<textarea value={current.rights} onChange={e=>update('rights',e.target.value)} placeholder="Description uniquement ; ne confère aucun droit"/></label><label>Échanges / blocages<textarea value={current.exchanges} onChange={e=>update('exchanges',e.target.value)}/></label><button className="delete-agent" onClick={()=>{if(window.confirm(`Retirer ${current.name} du bureau ?`)){save({...office,agents:office.agents.filter(a=>a.id!==current.id)});setSelected('')}}}>Retirer cet agent</button></>:<><h2>Sélectionne un agent</h2><p>Clique sur un personnage pour accéder à sa mission, son affectation et son état.</p><div className="inspector-note">La même configuration est partagée avec la fenêtre indépendante, dans ce navigateur.</div></>}</aside></main>
    </>}
    <footer className="office-footer">Obsidia Monde · Workspace · Pokémon View <span>Un même écosystème, plusieurs vues</span></footer>
  </div>
}
