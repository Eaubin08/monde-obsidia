import {useEffect,useState} from 'react'

type JarjarStatus={
 runtime:string
 process?:{sessionId:string;pid:number;active?:boolean;output?:string}|null
 cockpit?:{
  runtime:string;pid:number;authority:string;decision_authority:string
  last_transcript:string;last_response:string;response_source:string;action_verdict:string
  hud:{state:string;voice_enabled:boolean;session_open:boolean;governance_active:boolean;decision_authority:string;governance_source:string;governance_phase:string;human_confirmation_required:boolean;confirmation_prompt:string}
 }|null
 error?:string|null
 evidence?:{scope:string;decisions:any[];receipts:any[];rollbacks:any[]}
 authority:string;decisionAuthority:string
}
type Health={jarjar_alive:boolean;pid:number;voice_ready:boolean;micro_ready:boolean;obsidia:{reachable:boolean;url?:string|null};kx108_ready:boolean|null;kx108_note?:string;screens:{ready:boolean;count:number};canonical_environment?:{ok:boolean;brody:{ready:boolean;memory_source_mode?:string|null;decision_authority?:string|null;readonly?:boolean};qwen_text:{ready:boolean};qwen_vision:{ready:boolean};environment:Record<string,string>};process?:{sessionId:string;pid:number}|null}
type Caps={families:{family:string;wired:boolean;authority:string;note?:string;capabilities:string[]}[]}

export default function JarjarCockpit(){
 const [status,setStatus]=useState<JarjarStatus|null>(null)
 const [health,setHealth]=useState<Health|null>(null)
 const [caps,setCaps]=useState<Caps|null>(null)
 const [text,setText]=useState('')
 const [busy,setBusy]=useState('')
 const [message,setMessage]=useState('')
 const [observation,setObservation]=useState<any>(null)

 const readJson=async(url:string,init?:RequestInit)=>{const r=await fetch(url,init);const d=await r.json();if(!r.ok)throw Error(d.error||('HTTP '+r.status));return d}
 const refresh=async()=>{
  try{
   const s=await readJson('/obsidia-local/jarjar/status');setStatus(s)
   if(s.runtime==='RUNNING'||s.runtime==='DEGRADED'){
    const [h,c]=await Promise.allSettled([readJson('/obsidia-local/jarjar/health'),readJson('/obsidia-local/jarjar/capabilities')])
    if(h.status==='fulfilled')setHealth(h.value)
    if(c.status==='fulfilled')setCaps(c.value)
   }
  }catch(e){setMessage(String(e))}
 }
 useEffect(()=>{void refresh();const id=setInterval(refresh,2000);return()=>clearInterval(id)},[])

 const post=async(url:string,data:Record<string,unknown>={})=>{
  const r=await readJson(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
  await refresh();return r
 }
 const start=async()=>{setBusy('start');setMessage('Démarrage Jarjar…');try{await post('/obsidia-local/run',{tool:'jarjar',mode:'interactive'});setMessage('Jarjar démarré.')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const stop=async()=>{const id=status?.process?.sessionId;if(!id)return;setBusy('stop');setMessage('Arrêt Jarjar…');try{await post('/obsidia-local/stop/'+id);setMessage('Jarjar arrêté.')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const restart=async()=>{setBusy('restart');setMessage('Redémarrage Jarjar…');try{const id=status?.process?.sessionId;if(id)await post('/obsidia-local/stop/'+id);for(let i=0;i<30;i++){const p=await readJson('/obsidia-local/processes');if(!p.processes?.some((x:any)=>x.tool==='jarjar'&&x.active))break;await new Promise(r=>setTimeout(r,150))}await post('/obsidia-local/run',{tool:'jarjar',mode:'interactive'});setMessage('Jarjar redémarré.')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const send=async()=>{if(!text.trim())return;setBusy('text');try{const d=await post('/obsidia-local/jarjar/text',{text});setMessage(d.reply||'Réponse reçue.');setText('')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const toggleVoice=async()=>{setBusy('voice');try{await post('/obsidia-local/jarjar/voice/toggle');setMessage('État voix mis à jour.')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const listen=async()=>{setBusy('listen');setMessage('Jarjar écoute…');try{const d=await post('/obsidia-local/jarjar/voice/listen');setMessage(d.turn?('Transcript : '+d.turn[0]):'Aucune parole exploitable.')}catch(e){setMessage(String(e))}finally{setBusy('')}}
 const observe=async()=>{setBusy('observe');setMessage('Observation physique READ_ONLY…');try{const d=await post('/obsidia-local/jarjar/observe');setObservation(d.observation);setMessage('Observation terminée.')}catch(e){setMessage(String(e))}finally{setBusy('')}}

 const live=status?.runtime==='RUNNING'||status?.runtime==='DEGRADED'
 const cockpit=status?.cockpit
 const hud=cockpit?.hud
 const verdict=cockpit?.action_verdict||'NONE'
 const decisions=status?.evidence?.decisions||[]
 const receipts=status?.evidence?.receipts||[]

 return <section className="jarjar-cockpit">
  <header className="jarjar-cockpit-head compact">
   <div><span className="eyebrow">JARJAR</span><h2>Cockpit</h2></div>
   <div className={"jarjar-runtime "+(live?'live':'stopped')}><strong>{status?.runtime||'UNKNOWN'}</strong><span>PID {status?.process?.pid||cockpit?.pid||'—'}</span></div>
  </header>

  <div className="jarjar-control-row">
   {!live?<button disabled={!!busy} onClick={start}>START JARJAR</button>:<button disabled={!!busy} onClick={stop}>STOP JARJAR</button>}
   <button disabled={!!busy} onClick={restart}>RESTART JARJAR</button>
   <button disabled={!live||!!busy} onClick={toggleVoice}>{hud?.voice_enabled?'VOICE ON':'VOICE OFF'}</button>
   <button disabled={!live||!!busy} onClick={listen}>LISTEN ONCE</button>
   <button disabled={!live||!!busy} onClick={observe}>OBSERVER</button>
  </div>

  {message&&<p className="jarjar-message" role="status">{message}</p>}
  {(status?.process?.output||status?.error)&&<details className="jarjar-observation"><summary>Diagnostic démarrage Jarjar</summary><pre>{status?.process?.output||status?.error}</pre></details>}

  <div className="jarjar-status-grid">
   <article><span>GOUVERNANCE</span><strong>{cockpit?.decision_authority||status?.decisionAuthority||'KX108_ONLY'}</strong><small>Jarjar authority = NONE</small></article>
   <article data-verdict={verdict}><span>VERDICT ACTION</span><strong>{verdict}</strong><small>{hud?.governance_phase||'aucune action gouvernée courante'}</small></article>
   <article><span>SOURCE</span><strong>{cockpit?.response_source||'—'}</strong><small>{hud?.governance_source||'cognition / action source'}</small></article>
   <article><span>VOIX</span><strong>{hud?.voice_enabled?'ON':'OFF'}</strong><small>{hud?.session_open?'conversation ouverte':'wake/follow-up fermé'}</small></article>
  </div>

  <section className="jarjar-text-console">
   <div><span className="eyebrow">ENTRÉE TEXTE</span><strong>{cockpit?.last_transcript||'Aucune commande récente'}</strong>{cockpit?.last_response&&<p>{cockpit.last_response}</p>}</div>
   <div className="jarjar-text-input"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void send()}} placeholder="Commande texte vers Jarjar…" disabled={!live||!!busy}/><button disabled={!live||!!busy||!text.trim()} onClick={send}>ENVOYER</button></div>
  </section>

  <section className="jarjar-health">
   <div className="pokemon-families-head"><div><span className="eyebrow">HEALTH</span><h3>Runtime réel</h3></div></div>
   <div className="jarjar-health-grid">
    <span data-ok={live}>Jarjar<strong>{live?'ALIVE':'STOPPED'}</strong></span>
    <span data-ok={!!health?.obsidia?.reachable}>Obsidia<strong>{health?.obsidia?.reachable?'REACHABLE':'UNKNOWN/OFF'}</strong></span>
    <span data-ok={health?.kx108_ready===true}>KX108<strong>{health?.kx108_ready===true?'READY':'NON CONFIRMÉ'}</strong></span>
    <span data-ok={!!health?.micro_ready}>Micro<strong>{health?.micro_ready?'READY':'OFF/UNKNOWN'}</strong></span>
    <span data-ok={!!health?.screens?.ready}>Écrans<strong>{health?.screens?.ready?(health.screens.count+' détecté(s)'):'UNKNOWN'}</strong></span>
    <span data-ok={health?.canonical_environment?.ok===true}>Env canonique<strong>{health?.canonical_environment?.ok?'PASS':'BLOCK/UNKNOWN'}</strong><small>{health?.canonical_environment?.brody?.memory_source_mode||'Native Memory non prouvée'}</small></span>
    <span data-ok={health?.canonical_environment?.qwen_text?.ready===true}>Qwen texte<strong>{health?.canonical_environment?.qwen_text?.ready?'READY':'OFF'}</strong></span>
    <span data-ok={health?.canonical_environment?.qwen_vision?.ready===true}>Qwen-VL<strong>{health?.canonical_environment?.qwen_vision?.ready?'READY':'OFF'}</strong></span>
   </div>
  </section>

  <section className="jarjar-capabilities">
   <div className="pokemon-families-head"><div><span className="eyebrow">ZONES / CAPACITÉS</span><h3>Ce que Jarjar peut atteindre</h3><p>Présence d’un outil ≠ autorité. Les familles non câblées restent visibles comme surfaces futures/donneurs.</p></div></div>
   <div className="jarjar-cap-grid">{caps?.families?.map(f=><article key={f.family} className={f.wired?'wired':'unwired'}><span>{f.wired?'CÂBLÉ':'NON CÂBLÉ'}</span><strong>{f.family}</strong><small>authority={f.authority}</small>{f.note&&<p>{f.note}</p>}<div>{f.capabilities.map(x=><code key={x}>{x}</code>)}</div></article>)||<p className="muted">Capacités disponibles quand Jarjar est lancé.</p>}</div>
  </section>

  {hud?.human_confirmation_required&&<section className="jarjar-confirm"><span>CONFIRMATION HUMAINE REQUISE</span><strong>{hud.confirmation_prompt}</strong><p>Le cockpit n’auto-confirme rien.</p></section>}

  <section className="jarjar-proof-grid">
   <article><span className="eyebrow">DERNIÈRES DÉCISIONS KX108</span>{decisions.length?decisions.slice(0,5).map((d:any,i:number)=><p key={i}><strong>{d.x108_gate||'UNKNOWN'}</strong> · {d.reason_code||'—'}<small>{d.action_id||d.decision_record_id||''}</small></p>):<p className="muted">Aucune décision canonique observée.</p>}</article>
   <article><span className="eyebrow">DERNIERS RECEIPTS</span>{receipts.length?receipts.slice(0,5).map((r:any,i:number)=><p key={i}><strong>{r.status||'UNKNOWN'}</strong> · {r.target_path||'—'}<small>KX108_PRE {r.kx108_pre_gate||r.kx108_pre_decision_record_id?.slice(0,12)||'—'} · realized_state_verified={String(r.realized_state_verified??'UNKNOWN')} · {r.target_post_sha256?'post hash présent':'post hash non exposé'}</small></p>):<p className="muted">Aucun receipt scellé observé.</p>}</article>
  </section>

  {observation&&<details className="jarjar-observation" open><summary>Dernière observation physique · READ_ONLY</summary><div className="jarjar-health-grid">{observation.items?.map((x:any)=><span key={x.name} data-ok={!!x.ok}>{x.name}<strong>{x.ok?'PASS':'FAIL'}</strong><small>{x.error||JSON.stringify(x.data).slice(0,180)}</small></span>)}</div><p>Evidence : {observation.evidence_file||'—'}</p></details>}
 </section>
}
