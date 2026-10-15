import {readCssaOrganisation} from './cssaOrganisationRead'
import {writeCssaOrganisationPatch,type OrganisationPatchKey} from './cssaOrganisationWrite'
import {useEffect,useMemo,useState,useRef} from 'react'
import './CSSAOrganisation.css'

type OrgItem={id:string;title:string;subtitle:string;kind:string;status:string;meta?:Record<string,string>;semantic?:{purpose:string;limits:string}}
type Person={id:string;displayName:string;status:'ACTIF'|'INACTIF'|'INCONNU';contact:string;source:string;note:string}
type RoleAssignment={id:string;personId:string;roleSlot:string;status:'ACTIF'|'PREVU'|'TERMINE'|'INCONNU';startAt:string;endAt:string;source:string}
type Availability={id:string;personId:string;from:string;to:string;status:'DISPONIBLE'|'INDISPONIBLE'|'INCONNU';note:string;source:string}
type Engagement={id:string;personId:string;type:'SALARIE'|'BENEVOLE'|'PRESTATAIRE'|'DIRIGEANT'|'AUTRE';startAt:string;endAt:string;status:string;compensationStatus:string;source:string}
type Authorization={id:string;personId:string;scope:string;action:string;status:'ACCORDEE'|'EN_ATTENTE'|'REVOQUEE'|'INCONNUE';source:string}
type OrgState={version:string;updatedAt:string;people:Person[];roleAssignments:RoleAssignment[];availabilities:Availability[];engagements:Engagement[];authorizations:Authorization[]}
type Props={items:OrgItem[];selectedId?:string;onOpen:(id:string)=>void;onClear:()=>void}

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
function human(v:string){return v.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())}
function uid(prefix:string){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

export default function CSSAOrganisationPage({items,selectedId,onOpen,onClear}:Props){
 const [filter,setFilter]=useState('all')
 const [mode,setMode]=useState<'structure'|'people'|'availability'|'permissions'>('structure')
 const [state,setState]=useState<OrgState|null>(null)
 const [error,setError]=useState(false)
 const [saving,setSaving]=useState(false)
 const [writeError,setWriteError]=useState('')
 const [writeSuccess,setWriteSuccess]=useState(false)
 const savingRef=useRef(false)
 const pendingIds=useRef<Partial<Record<OrganisationPatchKey,string>>>({})
 const generation=useRef(0)
 const active=useRef(true)
 const operationId=(key:OrganisationPatchKey,prefix:string)=>pendingIds.current[key]??(pendingIds.current[key]=uid(prefix))
 const [showCreate,setShowCreate]=useState(false)
 const [form,setForm]=useState<Record<string,string>>({})

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
 const selected=items.find(x=>x.id===selectedId)

 const refresh=async()=>{
  const request=++generation.current
  try{
   const next=await readCssaOrganisation<OrgState>()
   if(active.current&&request===generation.current){setState(next);setError(false)}
  }catch{if(active.current&&request===generation.current){setState(null);setError(true)}}
 }
 useEffect(()=>{active.current=true;void refresh();return()=>{active.current=false;generation.current++}},[])
 const post=async(key:OrganisationPatchKey,row:Record<string,string>)=>{
  if(savingRef.current)return false
  savingRef.current=true;generation.current++;setSaving(true);setWriteError('');setWriteSuccess(false)
  try{
   const data=await writeCssaOrganisationPatch<OrgState>(key,row)
   delete pendingIds.current[key]
   if(active.current){setState(data);setError(false);setWriteSuccess(true)}
   window.dispatchEvent(new CustomEvent('cssa-organisation-updated',{detail:data}))
   return active.current
  }catch(cause){
   if(active.current)setWriteError(`${cause instanceof Error?cause.message:'Enregistrement non confirmé.'} Saisie conservée. Réessayez pour confirmer ; le même identifiant sera réutilisé.`)
   window.dispatchEvent(new Event('cssa-organisation-updated'))
   return false
  }finally{savingRef.current=false;if(active.current)setSaving(false)}
 }
 const assignmentsFor=(roleSlot:string)=>state?.roleAssignments.filter(a=>a.roleSlot===roleSlot&&a.status==='ACTIF')||[]
 const personFor=(id:string)=>state?.people.find(p=>p.id===id)

 const addPerson=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.personName?.trim())return
  const row:Person={id:operationId('personPatch','person'),displayName:form.personName.trim(),status:'ACTIF',contact:form.personContact?.trim()||'INCONNU',source:form.personSource?.trim()||'SAISIE_INTERNE_A_VERIFIER',note:form.personNote?.trim()||''}
  if(!await post('personPatch',row))return;setForm(prev=>({...prev,personName:'',personContact:'',personSource:'',personNote:''}));setShowCreate(false)
 }
 const addAssignment=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.assignPerson||!form.assignRole)return
  const row:RoleAssignment={id:operationId('roleAssignmentPatch','assignment'),personId:form.assignPerson,roleSlot:form.assignRole,status:'ACTIF',startAt:form.assignStart||'',endAt:'',source:form.assignSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'}
  if(!await post('roleAssignmentPatch',row))return;setForm(prev=>({...prev,assignRole:'',assignStart:'',assignSource:''}))
 }
 const addAvailability=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.avPerson||!form.avFrom)return
  const row:Availability={id:operationId('availabilityPatch','availability'),personId:form.avPerson,from:form.avFrom,to:form.avTo||form.avFrom,status:(form.avStatus||'DISPONIBLE') as Availability['status'],note:form.avNote?.trim()||'',source:form.avSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'}
  if(!await post('availabilityPatch',row))return;setForm(prev=>({...prev,avFrom:'',avTo:'',avNote:'',avSource:''}))
 }
 const addEngagement=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.engPerson)return
  const row:Engagement={id:operationId('engagementPatch','engagement'),personId:form.engPerson,type:(form.engType||'AUTRE') as Engagement['type'],startAt:form.engStart||'',endAt:form.engEnd||'',status:'A_VERIFIER',compensationStatus:form.engCompensation||'INCONNU',source:form.engSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'}
  if(!await post('engagementPatch',row))return;setForm(prev=>({...prev,engStart:'',engEnd:'',engSource:''}))
 }
 const addAuthorization=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.authPerson||!form.authScope?.trim()||!form.authAction?.trim())return
  const row:Authorization={id:operationId('authorizationPatch','authorization'),personId:form.authPerson,scope:form.authScope.trim(),action:form.authAction.trim(),status:(form.authStatus||'EN_ATTENTE') as Authorization['status'],source:form.authSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'}
  if(!await post('authorizationPatch',row))return;setForm(prev=>({...prev,authScope:'',authAction:'',authSource:''}))
 }

 if(selected&&selected.id!=='org-overview'&&mode==='structure')return <section className="orgx">
  <nav className="orgx-breadcrumb"><button onClick={onClear}>Organisation</button><span>›</span><strong>{selected.title}</strong></nav>
  <article className="orgx-detail">
   <header><div><small>{selected.kind==='role'?'RÔLE':'ÉQUIPE / STRUCTURE'}</small><h2>{selected.title}</h2><p>{selected.subtitle}</p></div><span className="orgx-status">{selected.status}</span></header>
   <div className="orgx-detail-grid">
    <section><h3>Rôle dans le club</h3><p>{selected.semantic?.purpose||'Objet public de l’organisation CSSA.'}</p></section>
    <section><h3>Ce qui est connu</h3>{selected.meta?Object.entries(selected.meta).map(([k,v])=><div className="orgx-fact" key={k}><small>{k}</small><strong>{v}</strong></div>):<p>Aucune métadonnée supplémentaire.</p>}</section>
    {selected.kind==='role'&&<section><h3>Occupant interne</h3>{assignmentsFor(String(selected.meta?.['Role slot']||'')).length?assignmentsFor(String(selected.meta?.['Role slot']||'')).map(a=><div className="orgx-fact" key={a.id}><small>{a.status}</small><strong>{personFor(a.personId)?.displayName||a.personId}</strong></div>):<p>Aucun occupant interne vérifié. Le rôle reste non assigné.</p>}</section>}
    <section className="orgx-limit"><h3>Limite</h3><p>{selected.semantic?.limits||'Les informations non publiquement vérifiées restent UNKNOWN.'}</p></section>
   </div>
  </article>
 </section>

 return <section className="orgx">
  <header className="orgx-hero">
   <div><small>ORGANISATION CSSA</small><h2>Personnes, rôles et responsabilités</h2><p>{overview?.semantic?.purpose||'Organisation publique connue du club.'}</p></div>
   <span>{state?state.people.length+' personne(s) interne(s)':'Store interne indisponible'}</span>
  </header>

  <nav className="orgx-mode" aria-label="Vues organisation">
   <button className={mode==='structure'?'active':''} onClick={()=>setMode('structure')}>Structure & rôles</button>
   <button className={mode==='people'?'active':''} onClick={()=>setMode('people')}>Personnes & engagements</button>
   <button className={mode==='availability'?'active':''} onClick={()=>setMode('availability')}>Disponibilités</button>
   <button className={mode==='permissions'?'active':''} onClick={()=>setMode('permissions')}>Habilitations</button>
  </nav>

  {saving&&<p role="status">Enregistrement en cours…</p>}
  {writeError&&<div className="orgx-warning" role="alert">{writeError}</div>}
  {writeSuccess&&<p role="status">Objet confirmé dans le registre local. Cet enregistrement ne constitue pas une autorisation d’exécution.</p>}
  {error&&<div className="orgx-warning">État interne indisponible. Les rôles publics restent visibles, aucune personne n’est inventée.</div>}

  {mode==='structure'&&<>
   <nav className="orgx-filter" aria-label="Pôles de l'organisation">
    <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>Vue d’ensemble</button>
    {groups.map(g=><button key={g.id} className={filter===g.id?'active':''} onClick={()=>setFilter(g.id)}>{g.label}</button>)}
   </nav>
   <div className="orgx-tree">{shown.map(group=><section key={group.id} className="orgx-group">
    <header><div><small>PÔLE</small><h3>{group.label}</h3></div><span>{group.items.length}</span></header>
    {group.items.length?<div className="orgx-list">{group.items.map(item=>{const slot=String(item.meta?.['Role slot']||'');const assigned=slot?assignmentsFor(slot):[];return <button key={item.id} onClick={()=>onOpen(item.id)}>
     <div className="orgx-avatar">{item.kind==='role'?'R':'É'}</div>
     <div><strong>{item.title}</strong><small>{item.kind==='role'?(assigned.length?assigned.map(a=>personFor(a.personId)?.displayName||a.personId).join(', '):'Non assigné / inconnu'):item.subtitle}</small></div>
     <span className={'orgx-status '+item.status.toLowerCase()}>{item.status}</span><b>›</b>
    </button>})}</div>:<p className="orgx-empty">Aucun objet public vérifié dans ce pôle. Aucun titulaire n’est inventé.</p>}
   </section>)}</div>
  </>}

  {mode==='people'&&<div className="orgx-workspace">
   <header><div><small>ÉQUIPE INTERNE</small><h3>Personnes canoniques</h3><p>Une personne existe une seule fois puis reçoit des rôles, engagements et habilitations.</p></div><button onClick={()=>setShowCreate(v=>!v)}>+ Ajouter une personne</button></header>
   {showCreate&&<form className="orgx-form" onSubmit={addPerson}><fieldset disabled={saving} style={{display:'contents'}}><input required placeholder="Nom / identité interne" value={form.personName||''} onChange={e=>setForm({...form,personName:e.target.value})}/><input placeholder="Contact (optionnel)" value={form.personContact||''} onChange={e=>setForm({...form,personContact:e.target.value})}/><input placeholder="Source / preuve" value={form.personSource||''} onChange={e=>setForm({...form,personSource:e.target.value})}/><input placeholder="Note" value={form.personNote||''} onChange={e=>setForm({...form,personNote:e.target.value})}/><button>Créer</button></fieldset></form>}
   <form className="orgx-form" onSubmit={addAssignment}><fieldset disabled={saving} style={{display:'contents'}}><select required value={form.assignPerson||''} onChange={e=>setForm({...form,assignPerson:e.target.value})}><option value="">Personne…</option>{state?.people.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><select required value={form.assignRole||''} onChange={e=>setForm({...form,assignRole:e.target.value})}><option value="">Rôle…</option>{roles.map(r=><option key={r.id} value={String(r.meta?.['Role slot']||'')}>{r.title}</option>)}</select><input type="date" value={form.assignStart||''} onChange={e=>setForm({...form,assignStart:e.target.value})}/><input placeholder="Source / décision" value={form.assignSource||''} onChange={e=>setForm({...form,assignSource:e.target.value})}/><button>Affecter</button></fieldset></form>
   <form className="orgx-form" onSubmit={addEngagement}><fieldset disabled={saving} style={{display:'contents'}}><select required value={form.engPerson||''} onChange={e=>setForm({...form,engPerson:e.target.value})}><option value="">Personne…</option>{state?.people.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><select value={form.engType||'AUTRE'} onChange={e=>setForm({...form,engType:e.target.value})}><option>SALARIE</option><option>BENEVOLE</option><option>PRESTATAIRE</option><option>DIRIGEANT</option><option>AUTRE</option></select><input type="date" value={form.engStart||''} onChange={e=>setForm({...form,engStart:e.target.value})}/><input type="date" value={form.engEnd||''} onChange={e=>setForm({...form,engEnd:e.target.value})}/><button>Ajouter engagement</button></fieldset></form>
   <div className="orgx-people">{state?.people.length?state.people.map(p=>{const pa=state.roleAssignments.filter(a=>a.personId===p.id&&a.status==='ACTIF');const pe=state.engagements.filter(e=>e.personId===p.id);return <article key={p.id}><div className="orgx-person-head"><div className="orgx-avatar">P</div><div><strong>{p.displayName}</strong><small>{p.contact}</small></div><span>{p.status}</span></div><div className="orgx-person-meta"><b>{pa.length?pa.map(a=>human(a.roleSlot)).join(' · '):'Aucun rôle actif'}</b><small>{pe.length?pe.map(e=>human(e.type)).join(' · '):'Engagement non renseigné'}</small><small>{p.source}</small></div></article>}):<p className="orgx-empty">Aucune personne interne enregistrée. Aucun nom n’est inventé depuis l’organigramme public.</p>}</div>
  </div>}

  {mode==='availability'&&<div className="orgx-workspace">
   <header><div><small>PLANIFICATION HUMAINE</small><h3>Disponibilités</h3><p>Disponibilités déclarées uniquement ; absence d’information = inconnu.</p></div></header>
   <form className="orgx-form" onSubmit={addAvailability}><fieldset disabled={saving} style={{display:'contents'}}><select required value={form.avPerson||''} onChange={e=>setForm({...form,avPerson:e.target.value})}><option value="">Personne…</option>{state?.people.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><input required type="datetime-local" value={form.avFrom||''} onChange={e=>setForm({...form,avFrom:e.target.value})}/><input type="datetime-local" value={form.avTo||''} onChange={e=>setForm({...form,avTo:e.target.value})}/><select value={form.avStatus||'DISPONIBLE'} onChange={e=>setForm({...form,avStatus:e.target.value})}><option>DISPONIBLE</option><option>INDISPONIBLE</option><option>INCONNU</option></select><button>Ajouter</button></fieldset></form>
   <div className="orgx-table">{state?.availabilities.length?state.availabilities.map(a=><article key={a.id}><div><small>{a.from} → {a.to}</small><strong>{personFor(a.personId)?.displayName||a.personId}</strong><span>{a.note||a.source}</span></div><em>{human(a.status)}</em></article>):<p className="orgx-empty">Aucune disponibilité déclarée.</p>}</div>
  </div>}

  {mode==='permissions'&&<div className="orgx-workspace">
   <header><div><small>AUTORITÉ HUMAINE</small><h3>Habilitations</h3><p>Un rôle organisationnel ne vaut pas automatiquement droit d’action. Les autorisations sont explicites et séparées.</p></div></header>
   <form className="orgx-form" onSubmit={addAuthorization}><fieldset disabled={saving} style={{display:'contents'}}><select required value={form.authPerson||''} onChange={e=>setForm({...form,authPerson:e.target.value})}><option value="">Personne…</option>{state?.people.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><input required placeholder="Périmètre (Finance, AO…)" value={form.authScope||''} onChange={e=>setForm({...form,authScope:e.target.value})}/><input required placeholder="Action autorisée" value={form.authAction||''} onChange={e=>setForm({...form,authAction:e.target.value})}/><select value={form.authStatus||'EN_ATTENTE'} onChange={e=>setForm({...form,authStatus:e.target.value})}><option>EN_ATTENTE</option><option>ACCORDEE</option><option>REVOQUEE</option><option>INCONNUE</option></select><button>Ajouter</button></fieldset></form>
   <div className="orgx-table">{state?.authorizations.length?state.authorizations.map(a=><article key={a.id}><div><small>{a.scope}</small><strong>{personFor(a.personId)?.displayName||a.personId} · {a.action}</strong><span>{a.source}</span></div><em>{human(a.status)}</em></article>):<p className="orgx-empty">Aucune habilitation interne enregistrée.</p>}</div>
  </div>}

  <footer className="orgx-note"><strong>Frontière de vérité</strong><span>Les rôles publics restent des slots. Une personne, un engagement, une disponibilité ou une habilitation n’existe dans Monde que lorsqu’elle est explicitement enregistrée. Aucun occupant n’est déduit automatiquement.</span></footer>
 </section>
}
