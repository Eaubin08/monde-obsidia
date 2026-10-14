import {useEffect,useMemo,useState} from 'react'
import './CSSAHome.css'

type OpsTask={id:string;title:string;status:string;priority?:string;dueAt?:string;matchRef?:string}
type OpsCase={id:string;title?:string;subject?:string;status?:string;priority?:string;truthClass?:string;isTestFixture?:boolean}
type OpsState={tasks?:OpsTask[];cases?:OpsCase[];intendanceItems?:{id:string;label?:string;title?:string;status:string}[];updatedAt?:string}
type DossierRow={id:string;reference:string;type:string;title:string;organization:string;deadline:string;status:string}
type RequirementRow={id:string;dossierId:string;criticality:string;state:string}
type ValidationRow={id:string;dossierId:string;type:string;status:string}
type SubmissionProofRow={id:string;dossierId:string;submittedAt:string;externalReference:string}
type OutcomeRow={id:string;dossierId:string;result:string;decidedAt:string;externalReference:string;amount:number|null}
type BusinessState={dossiers?:DossierRow[];requirements?:RequirementRow[];validations?:ValidationRow[];submissionProofs?:SubmissionProofRow[];dossierOutcomes?:OutcomeRow[];revenues?:{amount:number}[];expenses?:{amount:number}[];updatedAt?:string}

type Props={
  contradictions:string[]
  onOpen:(moduleId:string,id?:string)=>void
}

const attentionStatuses=new Set(['A_FAIRE','EN_COURS','EN_ATTENTE','BLOQUE','BLOQUÉ','OPEN','HOLD'])

export default function CSSAHomePage({contradictions,onOpen}:Props){
  const [ops,setOps]=useState<OpsState|null>(null)
  const [business,setBusiness]=useState<BusinessState|null>(null)
  const [error,setError]=useState(false)

  const refresh=async()=>{
    try{
      const [opsRes,businessRes]=await Promise.all([
        fetch('/obsidia-local/cssa-ops-state',{cache:'no-store'}),
        fetch('/obsidia-local/cssa-business-state',{cache:'no-store'})
      ])
      if(!opsRes.ok)throw new Error('ops unavailable')
      setOps(await opsRes.json())
      if(businessRes.ok)setBusiness(await businessRes.json())
      setError(false)
    }catch{
      setError(true)
    }
  }

  useEffect(()=>{refresh();const t=window.setInterval(refresh,15000);return()=>window.clearInterval(t)},[])

  const tasks=ops?.tasks??[]
  const realCases=(ops?.cases??[]).filter(c=>!c.isTestFixture)
  const highPriority=useMemo(()=>tasks.filter(t=>attentionStatuses.has(t.status)&&['CRITIQUE','HAUTE'].includes(String(t.priority||''))),[tasks])
  const critical=highPriority.slice(0,6)
  const blocked=useMemo(()=>tasks.filter(t=>['BLOQUE','BLOQUÉ','EN_ATTENTE'].includes(t.status)).slice(0,6),[tasks])
  const openCaseRows=useMemo(()=>realCases.filter(c=>!['TERMINE','FERME','CLOSED'].includes(String(c.status||''))),[realCases])
  const activeCases=openCaseRows.slice(0,6)
  const openTasks=tasks.filter(t=>attentionStatuses.has(t.status)).length
  const dossiers=business?.dossiers??[]
  const requirements=business?.requirements??[]
  const validations=business?.validations??[]
  const submissionProofs=business?.submissionProofs??[]
  const dossierOutcomes=business?.dossierOutcomes??[]
  const activeDossiers=dossiers.filter(d=>!['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status))
  const upcomingDossiers=[...activeDossiers].filter(d=>!['DEPOSE'].includes(d.status)).sort((a,b)=>(a.deadline||'9999').localeCompare(b.deadline||'9999')).slice(0,6)
  const today=new Date().toISOString().slice(0,10)
  const attentionDossiers=dossiers.map(d=>{
    const reqs=requirements.filter(r=>r.dossierId===d.id&&r.criticality==='OBLIGATOIRE')
    const blocking=reqs.filter(r=>r.state!=='SATISFAIT').length
    const finalValidation=validations.find(v=>v.dossierId===d.id&&v.type==='REVUE_FINALE')
    const proof=submissionProofs.find(p=>p.dossierId===d.id)
    const outcome=dossierOutcomes.find(o=>o.dossierId===d.id)
    const ready=reqs.length>0&&blocking===0&&finalValidation?.status==='VALIDE'
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
  const unresolvedDossierAttention=attentionDossiers.filter(x=>x.level!=='INFO').length

  return <section className="cssa-home">
    <header className="cssa-home-hero">
      <div>
        <small>ACCUEIL CSSA</small>
        <h2>Ce qui demande votre attention</h2>
        <p>Priorités opérationnelles du club. Les données absentes restent inconnues plutôt que complétées.</p>
      </div>
      <button onClick={refresh}>Actualiser</button>
    </header>

    {error&&<div className="cssa-home-warning">État opérationnel local indisponible. Les raccourcis restent accessibles, aucune donnée n’est inventée.</div>}

    <div className="cssa-home-kpis">
      <button onClick={()=>onOpen('tasks')}><small>TÂCHES OUVERTES</small><strong>{openTasks}</strong><span>Voir le suivi</span></button>
      <button onClick={()=>onOpen('tasks')}><small>PRIORITÉ HAUTE / CRITIQUE</small><strong>{highPriority.length}</strong><span>À traiter</span></button>
      <button onClick={()=>onOpen('dossiers')}><small>DOSSIERS À TRAITER</small><strong>{unresolvedDossierAttention}</strong><span>Validation, deadline, dépôt</span></button>
      <button onClick={()=>onOpen('sources')}><small>CONTRADICTIONS PUBLIQUES</small><strong>{contradictions.length}</strong><span>À examiner</span></button>
    </div>

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
      <button onClick={()=>onOpen('mail')}>Mail</button>
    </nav>
  </section>
}
