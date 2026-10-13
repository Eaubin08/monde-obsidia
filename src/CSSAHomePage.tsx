import {useEffect,useMemo,useState} from 'react'
import './CSSAHome.css'

type OpsTask={id:string;title:string;status:string;priority?:string;dueAt?:string;matchRef?:string}
type OpsCase={id:string;title:string;status?:string;priority?:string;truthClass?:string;isTestFixture?:boolean}
type OpsState={tasks?:OpsTask[];cases?:OpsCase[];intendanceItems?:{id:string;label?:string;title?:string;status:string}[];updatedAt?:string}

type Props={
  contradictions:string[]
  onOpen:(moduleId:string,id?:string)=>void
}

const attentionStatuses=new Set(['A_FAIRE','EN_COURS','EN_ATTENTE','BLOQUE','BLOQUÉ','OPEN','HOLD'])

export default function CSSAHomePage({contradictions,onOpen}:Props){
  const [ops,setOps]=useState<OpsState|null>(null)
  const [error,setError]=useState(false)

  const refresh=async()=>{
    try{
      const r=await fetch('/obsidia-local/cssa-ops-state',{cache:'no-store'})
      if(!r.ok)throw new Error('ops unavailable')
      setOps(await r.json())
      setError(false)
    }catch{
      setError(true)
    }
  }

  useEffect(()=>{refresh();const t=window.setInterval(refresh,15000);return()=>window.clearInterval(t)},[])

  const tasks=ops?.tasks??[]
  const realCases=(ops?.cases??[]).filter(c=>!c.isTestFixture)
  const critical=useMemo(()=>tasks.filter(t=>attentionStatuses.has(t.status)&&['CRITIQUE','HAUTE'].includes(String(t.priority||''))).slice(0,6),[tasks])
  const blocked=useMemo(()=>tasks.filter(t=>['BLOQUE','BLOQUÉ','EN_ATTENTE'].includes(t.status)).slice(0,6),[tasks])
  const activeCases=useMemo(()=>realCases.filter(c=>!['TERMINE','FERME','CLOSED'].includes(String(c.status||''))).slice(0,6),[realCases])
  const openTasks=tasks.filter(t=>attentionStatuses.has(t.status)).length

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
      <button onClick={()=>onOpen('tasks')}><small>PRIORITÉ HAUTE / CRITIQUE</small><strong>{critical.length}</strong><span>À traiter</span></button>
      <button onClick={()=>onOpen('crm')}><small>DOSSIERS ACTIFS</small><strong>{activeCases.length}</strong><span>Ouvrir le CRM</span></button>
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
          <div><strong>{c.title}</strong><small>{c.truthClass||'État sourcé'}</small></div>
          <span>{c.status||'OUVERT'}</span>
        </button>):<p className="cssa-home-empty">Aucun dossier actif observé.</p>}
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
      <button onClick={()=>onOpen('admin')}>Administration</button>
      <button onClick={()=>onOpen('mail')}>Mail</button>
    </nav>
  </section>
}
