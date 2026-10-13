import {useMemo,useState} from 'react'
import './CSSAOrganisation.css'

type OrgItem={id:string;title:string;subtitle:string;kind:string;status:string;meta?:Record<string,string>;semantic?:{purpose:string;limits:string}}
type Props={items:OrgItem[];onOpen:(id:string)=>void}

const roleGroups=[
  {id:'direction',label:'Gouvernance & direction',roles:['PRESIDENT','GENERAL_MANAGER','TECHNICAL_DIRECTOR']},
  {id:'administration',label:'Administration & support',roles:['ADMINISTRATIVE_MANAGER','TREASURY_ADMINISTRATION','CLUB_SECRETARIAT']},
  {id:'commercial',label:'Commercial & communication',roles:['PARTNERSHIPS','MERCHANDISING','COMMUNICATION']},
  {id:'operations',label:'Opérations matchday',roles:['MATCHDAY_ORGANIZATION_EVENTS','MATCHDAY_SECURITY']}
]

function teamGroup(item:OrgItem){
  const tier=String(item.meta?.Tier||'')
  if(tier==='SENIORS_POST_FORMATION')return 'sportif'
  if(['FORMATION','FORMATION_PREFORMATION'].includes(tier))return 'academy'
  if(['FOOT_8','FOOT_5'].includes(tier))return 'school'
  if(tier==='FEMININES')return 'feminines'
  return 'other'
}

export default function CSSAOrganisationPage({items,onOpen}:Props){
  const [filter,setFilter]=useState('all')
  const roles=items.filter(x=>x.kind==='role')
  const teams=items.filter(x=>x.kind==='team')
  const overview=items.find(x=>x.id==='org-overview')
  const groups=useMemo(()=>[
    ...roleGroups.map(g=>({...g,items:roles.filter(r=>g.roles.includes(String(r.meta?.['Role slot']||'')))})),
    {id:'sportif',label:'Sportif · équipes majeures',items:teams.filter(t=>teamGroup(t)==='sportif')},
    {id:'academy',label:'Formation / Académie',items:teams.filter(t=>teamGroup(t)==='academy')},
    {id:'school',label:'École de foot',items:teams.filter(t=>teamGroup(t)==='school')},
    {id:'feminines',label:'Pôle féminin',items:teams.filter(t=>teamGroup(t)==='feminines')}
  ],[roles,teams])
  const shown=filter==='all'?groups:groups.filter(g=>g.id===filter)

  return <section className="orgx">
    <header className="orgx-hero">
      <div><small>ORGANISATION CSSA</small><h2>Qui fait quoi dans le club ?</h2><p>{overview?.semantic?.purpose||'Organisation publique connue du club.'}</p></div>
      <span>Sources publiques · trous conservés UNKNOWN</span>
    </header>

    <nav className="orgx-filter" aria-label="Pôles de l'organisation">
      <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Vue d’ensemble</button>
      {groups.map(g=><button key={g.id} className={filter===g.id?'active':''} onClick={()=>setFilter(g.id)}>{g.label}</button>)}
    </nav>

    <div className="orgx-tree">
      {shown.map(group=><section key={group.id} className="orgx-group">
        <header><div><small>PÔLE</small><h3>{group.label}</h3></div><span>{group.items.length}</span></header>
        {group.items.length?<div className="orgx-list">{group.items.map(item=><button key={item.id} onClick={()=>onOpen(item.id)}>
          <div className="orgx-avatar">{item.kind==='role'?'R':'É'}</div>
          <div><strong>{item.title}</strong><small>{item.subtitle}</small></div>
          <span className={'orgx-status '+item.status.toLowerCase()}>{item.status}</span>
          <b>›</b>
        </button>)}</div>:<p className="orgx-empty">Aucun objet public vérifié dans ce pôle. Aucun titulaire n’est inventé.</p>}
      </section>)}
    </div>

    <footer className="orgx-note">
      <strong>Frontière de vérité</strong>
      <span>Les rôles représentent des fonctions publiques. Un rôle n’implique pas qu’un titulaire actuel soit vérifié. Les responsabilités internes non sourcées restent UNKNOWN.</span>
    </footer>
  </section>
}
