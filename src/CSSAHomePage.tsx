import {deriveCssaDossierAttention} from './cssaDossierAttention'
import {cssaSourceAvailable} from './cssaLinkedReference'
import {cssaNavigationCount} from './cssaNavigationCounts'
import type {Observations} from './cssaLiveProfile'
import {useEffect,useMemo,useState} from 'react'
import './CSSAHome.css'
import {CSSA_REFERENCE_CALENDAR} from './CSSASportPage'
import {clubCalendarWindow} from './cssaSportCalendar'

type OpsTask={id:string;title:string;status:string;priority?:string;dueAt?:string;matchRef?:string;origin?:string}
type OpsCase={id:string;title?:string;subject?:string;status?:string;priority?:string;truthClass?:string;isTestFixture?:boolean}
type IntendanceRow={id:string;label?:string;title?:string;status:string;matchRef?:string;category?:string;responsiblePersonId?:string|null}
type OpsState={tasks?:OpsTask[];cases?:OpsCase[];intendanceItems?:IntendanceRow[];updatedAt?:string}
type DossierRow={id:string;reference:string;type:string;title:string;organization:string;deadline:string;status:string;owner?:string;ownerPersonId?:string|null}
type RequirementRow={id:string;dossierId:string;label?:string;criticality:string;state:string;source?:string;documentRefId?:string|null;taskRefId?:string|null;owner?:string;ownerPersonId?:string|null}
type DocumentRow={id:string;title:string;status:string;validUntil?:string}
type ValidationRow={id:string;dossierId:string;type:string;status:string}
type SubmissionProofRow={id:string;dossierId:string;submittedAt:string;externalReference:string}
type OutcomeRow={id:string;dossierId:string;result:string;decidedAt:string;externalReference:string;amount:number|null}
type InvoiceRow={id:string;number:string;label:string;amount:number;dueAt:string;status:string}
type StockRow={id:string;label:string;channel:string;quantity:number;threshold:number|null}
type ContractRow={id:string;label:string;kind:string;endAt:string;status:string}
type AssetRow={id:string;label:string;kind:string;maintenanceDueAt:string;status:string}
type BusinessState={dossiers?:DossierRow[];requirements?:RequirementRow[];documentRefs?:DocumentRow[];validations?:ValidationRow[];submissionProofs?:SubmissionProofRow[];dossierOutcomes?:OutcomeRow[];revenues?:{amount:number}[];expenses?:{amount:number}[];invoices?:InvoiceRow[];stockItems?:StockRow[];contracts?:ContractRow[];assets?:AssetRow[];updatedAt?:string}
type MailRow={id:string;subject:string;status:string;receivedAt:string;organizationId:string|null}
type MailState={messages?:MailRow[];drafts?:{id:string;status:string}[];updatedAt?:string}
type ClubAttention={id:string;level:'CRITIQUE'|'ACTION'|'INFO';domain:'TASK'|'MATCHDAY'|'DOSSIER'|'FINANCE'|'STOCK'|'CONTRAT'|'MAINTENANCE'|'MAIL';title:string;detail:string;moduleId:string;targetId?:string}
type AvailabilityRow={id:string;personId:string;from:string;to:string;status:string;note:string}
type PersonRow={id:string;displayName:string;status:string}
type OrganisationState={people?:PersonRow[];availabilities?:AvailabilityRow[]}
type AgendaItem={href?:string;id:string;date:string;time:string;domain:'MATCH'|'PLATEAU'|'TASK'|'DOSSIER'|'FINANCE'|'CONTRAT'|'MAINTENANCE'|'HUMAIN';title:string;detail:string;moduleId:string;targetId?:string}

type Props={
  contradictions:string[]
  onOpen:(moduleId:string,id?:string)=>void
}

const attentionStatuses=new Set(['A_FAIRE','EN_COURS','EN_ATTENTE','BLOQUE','BLOQUÉ','OPEN','HOLD'])

export default function CSSAHomePage({contradictions,onOpen}:Props){
  const [ops,setOps]=useState<OpsState|null>(null)
  const [business,setBusiness]=useState<BusinessState|null>(null)
  const [mail,setMail]=useState<MailState|null>(null)
  const [organisation,setOrganisation]=useState<OrganisationState|null>(null)
  const [error,setError]=useState(false)

  const [unavailable,setUnavailable]=useState<string[]>([])
  const refresh=async()=>{
    const sources=[
      {route:'cssa-ops-state',set:setOps,lists:['tasks','cases','intendanceItems']},
      {route:'cssa-business-state',set:setBusiness,lists:['dossiers','requirements','documentRefs','validations','submissionProofs','dossierOutcomes','invoices','stockItems','contracts','assets','revenues','expenses']},
      {route:'cssa-mail-state',set:setMail,lists:['messages','drafts']},
      {route:'cssa-organisation-state',set:setOrganisation,lists:['people','availabilities']}
    ]
    const results=await Promise.all(sources.map(async source=>{
      try{
        const response=await fetch(`/obsidia-local/${source.route}`,{cache:'no-store',signal:AbortSignal.timeout(4000)})
        if(!response.ok)throw new Error('unavailable')
        const data=await response.json()
        if(!data||typeof data!=='object'||Array.isArray(data)||source.lists.some(key=>!Array.isArray(data[key])))throw new Error('invalid state')
        if(data._source?.status!=='AVAILABLE')throw new Error('source not available')
        source.set(data)
        return null
      }catch{source.set(null);return source.route}
    }))
    setUnavailable(results.filter((x):x is string=>x!==null))
    setError(results.some(Boolean))
  }

  useEffect(()=>{
    void refresh();const timer=window.setInterval(refresh,15000)
    const events=['cssa-ops-updated','cssa-business-updated','cssa-organisation-updated']
    const changed=()=>{void refresh()}
    events.forEach(event=>window.addEventListener(event,changed))
    return()=>{window.clearInterval(timer);events.forEach(event=>window.removeEventListener(event,changed))}
  },[])

  const tasks=ops?.tasks??[]
  const realCases=(ops?.cases??[]).filter(c=>!c.isTestFixture)
  const highPriority=useMemo(()=>tasks.filter(t=>attentionStatuses.has(t.status)&&['CRITIQUE','HAUTE'].includes(String(t.priority||''))),[tasks])
  const critical=highPriority.slice(0,6)
  const blocked=useMemo(()=>tasks.filter(t=>['BLOQUE','BLOQUÉ','EN_ATTENTE'].includes(t.status)).slice(0,6),[tasks])
  const openCaseRows=useMemo(()=>realCases.filter(c=>!['TERMINE','FERME','CLOSED'].includes(String(c.status||''))),[realCases])
  const activeCases=openCaseRows.slice(0,6)
  const countObservations:Observations={
    ops:{available:cssaSourceAvailable(ops),state:(ops??undefined) as unknown as Record<string,unknown>|undefined},
    business:{available:cssaSourceAvailable(business),state:(business??undefined) as unknown as Record<string,unknown>|undefined},
    organisation:{available:cssaSourceAvailable(organisation),state:(organisation??undefined) as unknown as Record<string,unknown>|undefined}
  }
  const openTasks=cssaNavigationCount('tasks',countObservations)?.value
  const dossiers=business?.dossiers??[]
  const requirements=business?.requirements??[]
  const validations=business?.validations??[]
  const submissionProofs=business?.submissionProofs??[]
  const dossierOutcomes=business?.dossierOutcomes??[]
  const activeDossiers=dossiers.filter(d=>!['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status))
  const upcomingDossiers=[...activeDossiers].filter(d=>!['DEPOSE'].includes(d.status)).sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')).slice(0,6)
  const today=new Date().toISOString().slice(0,10)
  const dossierLinkAttention=deriveCssaDossierAttention({
    dossiers,requirements,documents:business?.documentRefs??[],tasks,people:organisation?.people??[],
    businessAvailable:cssaSourceAvailable(business),opsAvailable:cssaSourceAvailable(ops),organisationAvailable:cssaSourceAvailable(organisation),today
  })
  const attentionDossiers=dossiers.map(d=>{
    const reqs=requirements.filter(r=>r.dossierId===d.id&&r.criticality==='OBLIGATOIRE')
    const blocking=reqs.filter(r=>r.state!=='SATISFAIT').length
    const finalValidation=validations.find(v=>v.dossierId===d.id&&v.type==='REVUE_FINALE')
    const proof=submissionProofs.find(p=>p.dossierId===d.id)
    const outcome=dossierOutcomes.find(o=>o.dossierId===d.id)
    const ready=reqs.length>0&&blocking===0&&finalValidation?.status==='VALIDE'&&!dossierLinkAttention.some(alert=>alert.targetId===d.id)
    let level:'CRITIQUE'|'ACTION'|'INFO'='INFO'
    let reason=''
    if(d.deadline&&d.deadline.slice(0,10)<today&&!proof&&!['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status)){level='CRITIQUE';reason='Échéance dépassée sans preuve de dépôt'}
    else if(finalValidation&&['EN_ATTENTE','HOLD'].includes(finalValidation.status)){level='ACTION';reason=finalValidation.status==='HOLD'?'Validation finale en HOLD':'Validation finale en attente'}
    else if(ready&&!proof){level='ACTION';reason='Dossier prêt : preuve de dépôt manquante'}
    else if(proof&&!outcome){level='INFO';reason='Déposé : résultat externe attendu'}
    return reason?{d,level,reason}:null
  }).filter(Boolean) as {d:DossierRow;level:'CRITIQUE'|'ACTION'|'INFO';reason:string}[]
  const dossierAttention=attentionDossiers.sort((a,b)=>{
    const rank={CRITIQUE:0,ACTION:1,INFO:2}
    return rank[a.level]-rank[b.level]||String(a.d.deadline||'9999').localeCompare(String(b.d.deadline||'9999'))
  }).slice(0,8)
  const recentOutcomes=[...dossierOutcomes].sort((a,b)=>String(b.decidedAt||'').localeCompare(String(a.decidedAt||''))).slice(0,6)
  const unresolvedDossierAttention=new Set([...attentionDossiers.filter(x=>x.level!=='INFO').map(x=>x.d.id),...dossierLinkAttention.map(x=>x.targetId)]).size

  const invoices=business?.invoices??[]
  const stockItems=business?.stockItems??[]
  const contracts=business?.contracts??[]
  const assets=business?.assets??[]
  const intendance=ops?.intendanceItems??[]
  const mailMessages=mail?.messages??[]
  const horizon30=new Date(Date.now()+30*86400000).toISOString().slice(0,10)
  const overdueInvoices=invoices.filter(x=>x.dueAt&&x.dueAt<today&&!['PAYEE','ENCAISSEE','ANNULEE'].includes(x.status))
  const lowStock=stockItems.filter(x=>x.threshold!=null&&x.quantity<=Number(x.threshold))
  const contractsDue=contracts.filter(x=>x.endAt&&x.endAt>=today&&x.endAt<=horizon30&&!['TERMINE','ANNULE'].includes(x.status))
  const maintenanceDue=assets.filter(x=>x.maintenanceDueAt&&x.maintenanceDueAt<=horizon30&&!['TERMINE','ANNULE'].includes(x.status))
  const unmatchedMail=mailMessages.filter(x=>x.status==='A_RAPPROCHER')
  const matchdayAttention=intendance.filter(x=>!['TERMINE','FERME','CLOSED','PRÊT','PRET'].includes(String(x.status||'').toUpperCase()))
  const rank={CRITIQUE:0,ACTION:1,INFO:2}
  const allClubAttention=([
    ...dossierLinkAttention,
    ...tasks.filter(t=>attentionStatuses.has(t.status)).map<ClubAttention>(t=>({
      id:'task:'+t.id,
      level:['CRITIQUE'].includes(String(t.priority||''))?'CRITIQUE':'ACTION',
      domain:'TASK',
      title:t.title,
      detail:[t.priority,t.status,t.dueAt?'échéance '+t.dueAt:null].filter(Boolean).join(' · '),
      moduleId:'tasks',
      targetId:t.id
    })),
    ...matchdayAttention.map<ClubAttention>(m=>({
      id:'matchday:'+m.id,
      level:['BLOQUE','BLOQUÉ','HOLD'].includes(String(m.status||'').toUpperCase())?'CRITIQUE':'ACTION',
      domain:'MATCHDAY',
      title:m.title||m.label||m.id,
      detail:[m.matchRef?'match '+m.matchRef:null,m.status].filter(Boolean).join(' · '),
      moduleId:'matchday',
      targetId:m.id
    })),
    ...attentionDossiers.map<ClubAttention>(x=>({
      id:'dossier:'+x.d.id,
      level:x.level,
      domain:'DOSSIER',
      title:x.d.reference+' · '+x.d.title,
      detail:x.reason,
      moduleId:'dossiers',
      targetId:x.d.id
    })),
    ...overdueInvoices.map<ClubAttention>(x=>({
      id:'invoice:'+x.id,
      level:'CRITIQUE',
      domain:'FINANCE',
      title:'Facture en retard · '+(x.number||x.label),
      detail:(x.dueAt?'échéance '+x.dueAt+' · ':'')+new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x.amount||0),
      moduleId:'finance'
    })),
    ...lowStock.map<ClubAttention>(x=>({
      id:'stock:'+x.id,
      level:x.quantity<=0?'CRITIQUE':'ACTION',
      domain:'STOCK',
      title:'Stock '+x.channel.toLowerCase()+' · '+x.label,
      detail:x.quantity+' restant(s) · seuil '+x.threshold,
      moduleId:'commercial'
    })),
    ...contractsDue.map<ClubAttention>(x=>({
      id:'contract:'+x.id,
      level:'ACTION',
      domain:'CONTRAT',
      title:'Contrat à échéance · '+x.label,
      detail:[x.kind,x.endAt].filter(Boolean).join(' · '),
      moduleId:'commercial'
    })),
    ...maintenanceDue.map<ClubAttention>(x=>({
      id:'asset:'+x.id,
      level:x.maintenanceDueAt<today?'CRITIQUE':'ACTION',
      domain:'MAINTENANCE',
      title:'Maintenance · '+x.label,
      detail:[x.kind,x.maintenanceDueAt].filter(Boolean).join(' · '),
      moduleId:'finance'
    })),
    ...unmatchedMail.map<ClubAttention>(x=>({
      id:'mail:'+x.id,
      level:'ACTION',
      domain:'MAIL',
      title:'Mail à rapprocher · '+x.subject,
      detail:x.receivedAt?x.receivedAt.slice(0,16).replace('T',' '):'Date inconnue',
      moduleId:'mail',
      targetId:x.id
    }))
  ] as ClubAttention[]).sort((a,b)=>rank[a.level]-rank[b.level])
  const clubAttention=allClubAttention.slice(0,12)
  const criticalClub=allClubAttention.filter(x=>x.level==='CRITIQUE').length
  const actionClub=allClubAttention.filter(x=>x.level==='ACTION').length
  const horizon7=new Date(Date.now()+7*86400000).toISOString().slice(0,10)
  const people=organisation?.people??[]
  const availabilities=organisation?.availabilities??[]
  const personName=(id:string)=>people.find(p=>p.id===id)?.displayName||'Personne inconnue'
  const fixtures=clubCalendarWindow(CSSA_REFERENCE_CALENDAR,today,horizon7)
  const agenda=([
    ...fixtures.map<AgendaItem>((f,index)=>({
      id:f.kind+':'+f.id+':'+index,date:f.date,time:f.time||'',domain:f.kind,
      title:f.title,
      detail:[f.competition,f.venue,f.truth,f.detail,f.source,'référence non revérifiée'].filter(Boolean).join(' · '),
      moduleId:'sportif',href:f.href
    })),
    ...tasks.filter(t=>attentionStatuses.has(t.status)&&t.dueAt&&t.dueAt.slice(0,10)>=today&&t.dueAt.slice(0,10)<=horizon7).map<AgendaItem>(t=>({
      id:'agenda-task:'+t.id,date:t.dueAt!.slice(0,10),time:'',domain:'TASK',title:t.title,
      detail:[t.priority,t.status,t.origin].filter(Boolean).join(' · '),moduleId:'tasks',targetId:t.id
    })),
    ...activeDossiers.filter(d=>d.deadline&&d.deadline.slice(0,10)>=today&&d.deadline.slice(0,10)<=horizon7).map<AgendaItem>(d=>({
      id:'agenda-dossier:'+d.id,date:d.deadline.slice(0,10),time:d.deadline.includes('T')?d.deadline.slice(11,16):'',domain:'DOSSIER',
      title:d.reference+' · '+d.title,detail:d.status.replaceAll('_',' '),moduleId:'dossiers',targetId:d.id
    })),
    ...invoices.filter(x=>x.dueAt&&x.dueAt>=today&&x.dueAt<=horizon7&&!['PAYEE','ENCAISSEE','ANNULEE'].includes(x.status)).map<AgendaItem>(x=>({
      id:'agenda-invoice:'+x.id,date:x.dueAt,time:'',domain:'FINANCE',title:'Échéance facture · '+(x.number||x.label),
      detail:new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(x.amount||0)+' · '+x.status,moduleId:'finance'
    })),
    ...contracts.filter(x=>x.endAt&&x.endAt>=today&&x.endAt<=horizon7&&!['TERMINE','ANNULE'].includes(x.status)).map<AgendaItem>(x=>({
      id:'agenda-contract:'+x.id,date:x.endAt,time:'',domain:'CONTRAT',title:'Échéance contrat · '+x.label,detail:x.kind,moduleId:'commercial'
    })),
    ...assets.filter(x=>x.maintenanceDueAt&&x.maintenanceDueAt>=today&&x.maintenanceDueAt<=horizon7&&!['TERMINE','ANNULE'].includes(x.status)).map<AgendaItem>(x=>({
      id:'agenda-maintenance:'+x.id,date:x.maintenanceDueAt,time:'',domain:'MAINTENANCE',title:'Maintenance · '+x.label,detail:x.kind,moduleId:'finance'
    })),
    ...availabilities.filter(a=>a.from&&a.from.slice(0,10)>=today&&a.from.slice(0,10)<=horizon7&&['INDISPONIBLE','INCONNU'].includes(a.status)).map<AgendaItem>(a=>({
      id:'agenda-human:'+a.id,date:a.from.slice(0,10),time:a.from.includes('T')?a.from.slice(11,16):'',domain:'HUMAIN',
      title:personName(a.personId)+' · '+(a.status==='INDISPONIBLE'?'indisponible':'disponibilité inconnue'),
      detail:a.note||'Disponibilité déclarée',moduleId:'organisation'
    }))
  ] as AgendaItem[]).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99'))
  const agendaToday=agenda.filter(x=>x.date===today)
  const agendaWeek=agenda.filter(x=>x.date>today).slice(0,18)



  return <section className="cssa-home">
    <header className="cssa-home-hero">
      <div>
        <small>ACCUEIL CSSA</small>
        <h2>Ce qui demande votre attention</h2>
        <p>Priorités opérationnelles du club. Les données absentes restent inconnues plutôt que complétées.</p>
      </div>
      <button onClick={refresh}>Actualiser</button>
    </header>

    {error&&<div className="cssa-home-warning">Sources locales indisponibles · UNKNOWN : {unavailable.join(' · ')}. Les compteurs de ces sources ne constituent pas un état observé.</div>}

    <div className="cssa-home-kpis">
      <button onClick={()=>onOpen('tasks')}><small>ATTENTION CLUB</small><strong>{allClubAttention.length}</strong><span>{criticalClub} critique(s) · {actionClub} action(s){error?' · vue partielle':''}</span></button>
      <button onClick={()=>onOpen('tasks')}><small>TÂCHES OUVERTES</small><strong>{openTasks??'UNKNOWN'}</strong><span>{highPriority.length} haute / critique</span></button>
      <button onClick={()=>onOpen('dossiers')}><small>DOSSIERS À TRAITER</small><strong>{business?unresolvedDossierAttention:'UNKNOWN'}</strong><span>Validation, deadline, dépôt</span></button>
      <button onClick={()=>onOpen('mail')}><small>MAILS À RAPPROCHER</small><strong>{mail?unmatchedMail.length:'UNKNOWN'}</strong><span>CRM / dossier / contact</span></button>
    </div>

    <section className="cssa-home-unified">
      <header><div><small>PILOTAGE GLOBAL</small><h3>File d’attention du club</h3></div><span>{clubAttention.length} affichées / {allClubAttention.length} observées</span></header>
      {clubAttention.length?<div className="cssa-home-attention-list">{clubAttention.map(a=><button key={a.id} onClick={()=>onOpen(a.moduleId,a.targetId)}>
        <span className={'cssa-home-level '+a.level.toLowerCase()}>{a.level}</span>
        <div><strong>{a.title}</strong><small>{a.detail}</small></div>
        <em>{a.domain}</em>
      </button>)}</div>:<p className="cssa-home-empty">Aucune attention transverse dérivée des données actuelles.</p>}
    </section>

    <section className="cssa-home-agenda">
      <header><div><small>TEMPS CLUB</small><h3>Aujourd’hui & 7 prochains jours</h3></div><span>{agenda.length} échéance(s)</span></header>
      <div className="cssa-home-agenda-grid">
        <div><h4>Aujourd’hui · {today}</h4>{agendaToday.length?agendaToday.map(x=><button key={x.id} onClick={()=>x.href?location.hash=x.href:onOpen(x.moduleId,x.targetId)}>
          <time>{x.time||'—'}</time><div><strong>{x.title}</strong><small>{x.detail}</small></div><em>{x.domain}</em>
        </button>):<p className="cssa-home-empty">Aucune échéance datée aujourd’hui.</p>}</div>
        <div><h4>Cette semaine · {agendaWeek.length}/{agenda.filter(x=>x.date>today).length} affichées</h4>{agendaWeek.length?agendaWeek.map(x=><button key={x.id} onClick={()=>x.href?location.hash=x.href:onOpen(x.moduleId,x.targetId)}>
          <time>{x.date.slice(5)}{x.time?' · '+x.time:''}</time><div><strong>{x.title}</strong><small>{x.detail}</small></div><em>{x.domain}</em>
        </button>):<p className="cssa-home-empty">Aucune échéance datée dans les 7 prochains jours.</p>}</div>
      </div>
      <footer>Agenda dérivé uniquement des dates déjà présentes : matchs et plateaux de référence non revérifiés, tâches, dossiers, factures, contrats, maintenance et disponibilités humaines.</footer>
    </section>

    <div className="cssa-home-grid">
      <section>
        <header><h3>Priorités</h3><button onClick={()=>onOpen('tasks')}>Toutes les tâches →</button></header>
        {critical.length?critical.map(t=><button className="cssa-home-row" key={t.id} onClick={()=>onOpen('tasks',t.id)}>
          <div><strong>{t.title}</strong><small>{t.matchRef?'Match '+t.matchRef:'Opération club'}</small></div>
          <span>{t.priority||'NORMALE'} · {t.status}</span>
        </button>):<p className="cssa-home-empty">Aucune tâche haute ou critique actuellement observée.</p>}
      </section>

      <section>
        <header><h3>En attente / bloqué</h3><button onClick={()=>onOpen('tasks')}>Suivi →</button></header>
        {blocked.length?blocked.map(t=><button className="cssa-home-row" key={t.id} onClick={()=>onOpen('tasks',t.id)}>
          <div><strong>{t.title}</strong><small>{t.dueAt?'Échéance '+t.dueAt:'Échéance non renseignée'}</small></div>
          <span>{t.status}</span>
        </button>):<p className="cssa-home-empty">Aucun blocage opérationnel observé.</p>}
      </section>

      <section>
        <header><h3>Dossiers en cours</h3><button onClick={()=>onOpen('crm')}>CRM →</button></header>
        {activeCases.length?activeCases.map(c=><button className="cssa-home-row" key={c.id} onClick={()=>onOpen('crm',c.id)}>
          <div><strong>{c.subject||c.title||c.id}</strong><small>{c.truthClass||'État sourcé'}</small></div>
          <span>{c.status||'OUVERT'}</span>
        </button>):<p className="cssa-home-empty">Aucun dossier actif observé.</p>}
      </section>

      <section>
        <header><h3>Dossiers & échéances</h3><button onClick={()=>onOpen('dossiers')}>Tous les dossiers →</button></header>
        {upcomingDossiers.length?upcomingDossiers.map(d=><button className="cssa-home-row" key={d.id} onClick={()=>onOpen('dossiers',d.id)}>
          <div><strong>{d.reference} · {d.title}</strong><small>{d.organization||'Organisme inconnu'} · {d.deadline?'échéance '+d.deadline:'échéance inconnue'}</small></div>
          <span>{d.status.replaceAll('_',' ')}</span>
        </button>):<p className="cssa-home-empty">Aucun dossier transverse actif. Rien n’est inventé.</p>}
      </section>

      <section className="cssa-home-attention">
        <header><h3>Alertes dossiers</h3><button onClick={()=>onOpen('dossiers')}>Piloter →</button></header>
        {dossierAttention.length?dossierAttention.map(({d,level,reason})=><button className="cssa-home-row" key={d.id+'-'+reason} onClick={()=>onOpen('dossiers',d.id)}>
          <div><strong>{d.reference} · {d.title}</strong><small>{reason}</small></div>
          <span className={'cssa-home-level '+level.toLowerCase()}>{level}</span>
        </button>):<p className="cssa-home-empty">Aucune alerte dossier dérivée des données actuelles.</p>}
      </section>

      <section>
        <header><h3>Liens dossiers à revoir</h3><button onClick={()=>onOpen('dossiers')}>Dossiers →</button></header>
        {dossierLinkAttention.length?dossierLinkAttention.slice(0,8).map(alert=><button className="cssa-home-row" key={alert.id} onClick={()=>onOpen('dossiers',alert.targetId)}><div><strong>{alert.title}</strong><small>{alert.detail}</small></div><span>{alert.reasons.length} point(s)</span></button>):<p className="cssa-home-empty">{business?'Aucun écart de lien détecté dans les données disponibles.':'UNKNOWN · source Business indisponible.'}</p>}
      </section>

      <section>
        <header><h3>Résultats dossiers</h3><button onClick={()=>onOpen('dossiers')}>Historique →</button></header>
        {recentOutcomes.length?recentOutcomes.map(o=>{const d=dossiers.find(x=>x.id===o.dossierId);return <button className="cssa-home-row" key={o.id} onClick={()=>onOpen('dossiers',o.dossierId)}>
          <div><strong>{d?d.reference+' · '+d.title:o.dossierId}</strong><small>{o.decidedAt||'Date inconnue'} · {o.externalReference||'Référence inconnue'}</small></div>
          <span>{o.result.replaceAll('_',' ')}{o.amount!=null?' · '+new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(o.amount):''}</span>
        </button>}):<p className="cssa-home-empty">Aucun résultat externe enregistré.</p>}
      </section>

      <section>
        <header><h3>Contradictions à revoir</h3><button onClick={()=>onOpen('sources')}>Sources →</button></header>
        {contradictions.length?contradictions.slice(0,6).map((c,i)=><div className="cssa-home-row static" key={i}>
          <div><strong>{c}</strong><small>Aucune réconciliation automatique</small></div><span>À REVOIR</span>
        </div>):<p className="cssa-home-empty">Aucune contradiction déclarée.</p>}
      </section>
    </div>

    <nav className="cssa-home-shortcuts" aria-label="Raccourcis CSSA">
      <button onClick={()=>onOpen('sportif')}>Sportif</button>
      <button onClick={()=>onOpen('tasks')}>Opérations</button>
      <button onClick={()=>onOpen('organisation')}>Organisation</button>
      <button onClick={()=>onOpen('crm')}>Relations</button>
      <button onClick={()=>onOpen('dossiers')}>Dossiers</button>
      <button onClick={()=>onOpen('admin')}>Administration</button>
      <button onClick={()=>onOpen('commercial')}>Commerce</button>
      <button onClick={()=>onOpen('finance')}>Finance</button>
      <button onClick={()=>onOpen('media')}>Média</button>
      <button onClick={()=>onOpen('mail')}>Mail</button>
    </nav>
  </section>
}
