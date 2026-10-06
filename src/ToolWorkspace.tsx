import {useEffect,useState} from 'react'
import {sessionAction} from './SessionControls'

type RuntimeEvent={kind:string;phase:string;message:string;timestamp:string;objective?:string;result?:Record<string,unknown>}
type Session={sessionId:string;agentId:string;name:string;presence:'live'|'unknown'|'ended';phase:string;message:string;objective:string|null;events:RuntimeEvent[]}
type Process={sessionId:string;active:boolean;runtimeActive:boolean;native:boolean;tool:string;output:string}

const titles={brody:'Brody',obsidure:'Obsidure',cli:'CLI Obsidia'} as const
type Tool=keyof typeof titles

function answerText(result?:Record<string,unknown>){
 if(!result)return ''
 const value=result.final_answer??result.response
 return typeof value==='string'?value:''
}

export default function ToolWorkspace({tool,sessions,onSelect}:{tool:Tool;sessions:Session[];onSelect:(id:string)=>void}){
 const [processes,setProcesses]=useState<Process[]>([]),[text,setText]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
 const current=[...sessions].reverse().find(s=>s.agentId===tool&&s.presence==='live')||[...sessions].reverse().find(s=>s.agentId===tool)
 const process=current?processes.find(p=>p.sessionId===current.sessionId):undefined
 const waiting=current?.presence==='live'&&current.phase==='WAITING_INPUT'
 useEffect(()=>{const c=new AbortController();const poll=async()=>{try{const r=await fetch('/obsidia-local/processes',{signal:c.signal});if(r.ok)setProcesses((await r.json()).processes)}catch{}}
  void poll();const id=setInterval(poll,1200);return()=>{c.abort();clearInterval(id)}},[])
 async function act(path:string,data:Record<string,unknown>={}){setBusy(true);setError('');try{const d=await sessionAction(path,data);if(d.sessionId)onSelect(d.sessionId);if(path.startsWith('input/'))setText('')}catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setBusy(false)}}
 async function ensureSession(){
  if(current?.presence==='live')return current.sessionId
  const d=await sessionAction('run',{mode:'interactive',tool});if(d.sessionId)onSelect(d.sessionId);return d.sessionId as string
 }
 async function submit(e:React.FormEvent){e.preventDefault();if(!text.trim()||busy)return;setBusy(true);setError('');try{const id=await ensureSession();let ready=current?.presence==='live'&&current.phase==='WAITING_INPUT';if(!ready){for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,150));const r=await fetch('/obsidia-local/live');const d=await r.json();const s=d.sessions?.find((x:Session)=>x.sessionId===id);if(s?.phase==='WAITING_INPUT'){ready=true;break}}}if(!ready)throw Error('Le processus est démarré mais n’est pas encore prêt à recevoir la demande.');await sessionAction('input/'+id,{text:text.trim()});setText('')}catch(e){setError(String(e).replace(/^Error:\s*/,''))}finally{setBusy(false)}}
 const conversation=(current?.events||[]).flatMap((e,i)=>{
  if(e.phase==='INPUT_RECEIVED'&&e.objective)return [{id:'u'+i,who:'Vous',text:e.objective}]
  if(tool==='brody'&&e.kind==='response'){const text=answerText(e.result);return text?[{id:'a'+i,who:'Brody',text}]:[]}
  return []
 })
 return <section className="tool-workspace">
  <div className="tool-workspace-head"><div><span className="eyebrow">ESPACE DE TRAVAIL</span><h2>{titles[tool]}</h2></div><div className="tool-state">{current?.presence==='live'?'SESSION ACTIVE':'PRÊT À DÉMARRER'}{current?.phase&&<small>{current.phase}</small>}</div></div>
  {error&&<p role="alert" className="tool-error">{error}</p>}
  {tool==='brody'?<div className="chat-panel">
    <div className="chat-thread">{conversation.length?conversation.map(m=><article key={m.id} className={m.who==='Vous'?'chat-user':'chat-agent'}><strong>{m.who}</strong><p>{m.text}</p></article>):<div className="empty-workspace"><h3>Discussion Brody</h3><p>Écris directement ta demande. La session démarre automatiquement si nécessaire.</p></div>}</div>
    <form className="workspace-composer" onSubmit={submit}><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Écris à Brody…" maxLength={4096}/><button disabled={busy||!text.trim()}>{busy?'Envoi…':'Envoyer'}</button></form>
   </div>:tool==='obsidure'?<div className="mission-workspace">
    <div className="mission-main"><h3>Donner une mission</h3><form className="workspace-composer" onSubmit={submit}><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Décris précisément ce qu’Obsidure doit auditer ou construire…" maxLength={4096}/><button disabled={busy||!text.trim()}>{busy?'Démarrage…':'Lancer la mission'}</button></form><div className="office-toolbar"><button disabled={busy} onClick={()=>act('run',{mode:'audit'})}>Audit rapide</button><button disabled={busy} onClick={()=>act('run',{mode:'audit-long'})}>Audit long</button></div></div>
    <div className="mission-output"><h3>Résultat / activité</h3><p>{current?.objective||'Aucune mission active.'}</p><pre className="source-content">{process?.output||current?.message||'Le résultat apparaîtra ici.'}</pre></div>
   </div>:<div className="cli-workspace">
    <div className="cli-console"><pre>{process?.output||'CLI Obsidia prête. Lance une session et sa sortie apparaîtra ici.'}</pre></div>
    <form className="workspace-composer" onSubmit={submit}><input value={text} onChange={e=>setText(e.target.value)} placeholder="Commande / demande CLI" maxLength={4096}/><button disabled={busy||!text.trim()}>{busy?'Envoi…':'Envoyer'}</button></form>
   </div>}
  <div className="workspace-actions">{current?.presence==='live'&&<button disabled={busy} onClick={()=>act('stop/'+current.sessionId)}>Arrêter la session</button>}{process?.native&&<button disabled={busy} onClick={()=>act('focus/'+current!.sessionId)}>Voir le terminal Windows</button>}</div>
 </section>
}
