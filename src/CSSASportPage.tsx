import {useEffect,useMemo,useState} from 'react'
import './CSSASport.css'

type WatchSource={id:string;label:string;url:string;scope:string;status:string;observedAt:string;changed:boolean|null;httpStatus?:number}
type SportWatch={observedAt?:string;refresh_interval_seconds?:number;summary?:{ok:number;changed:number;unreachable:number};sources?:WatchSource[];liveMatches?:{competition:string;date:string;time:string|null;home:string;away:string;homeScore:string|null;awayScore:string|null;status:string}[]}
type Fixture={id:string;teamId:string;competition:string;date:string;time:string|null;home:string;away:string;score?:string;stage:string;truth:string;source:string;sourceUrl?:string;note?:string;simulated?:boolean}
type Team={id:string;label:string;tier:string;competition:string;fixtureCount:number}

const TEAMS:Team[]=[
 ['SENIORS_R1','Seniors R1','SENIORS_POST_FORMATION','REGIONAL_1_A',26],
 ['SENIORS_R2','Seniors R2','SENIORS_POST_FORMATION','REGIONAL_2_A',22],
 ['U20_R1','U20 R1','SENIORS_POST_FORMATION','U20_R1',22],
 ['U17_R1','U17 R1','FORMATION','U17_R1',22],
 ['U16_R1','U16 R1','FORMATION','U16_R1',22],
 ['U15_R1','U15 R1','FORMATION','U15_R1',22],
 ['U15_D1','U15 D1','FORMATION_PREFORMATION','DISTRICT_D1',18],
 ['SENIORS_F','Seniors féminines','FEMININES','R2_F_CENTRE_OUEST',18],
 ['U18F_R2','U18 F R2','FEMININES','U18_R2_F',18],
 ['U13_FANION','U13 Fanion','FOOT_8','U13_D1',18],
 ['U13_U12_ESPOIR','U13/U12 Espoir','FOOT_8','U13_D2',16],
 ['U12_AVENIR','U12 Avenir','FOOT_8','DISTRICT_PHASES',16],
 ['U11_FANION','U11 Fanion','FOOT_8','PLATEAUX',14],
 ['U11_U10_ESPOIR','U11/U10 Espoir','FOOT_8','PLATEAUX',14],
 ['U10_AVENIR','U10 Avenir','FOOT_8','PLATEAUX',14],
 ['U9','U9','FOOT_5','PLATEAUX',12],['U8','U8','FOOT_5','PLATEAUX',12],['U7','U7','FOOT_5','PLATEAUX',12],['U6','U6','FOOT_5','PLATEAUX',12],
].map(([id,label,tier,competition,fixtureCount])=>({id:String(id),label:String(label),tier:String(tier),competition:String(competition),fixtureCount:Number(fixtureCount)}))

const R1_REAL:Fixture[]=[
 ['r1-j1','2026-08-23','16:00','Marnaval SC','CS Sedan Ardennes','1–4','J1'],
 ['r1-j2','2026-08-29','18:30','CS Sedan Ardennes','FC Hettange','2–0','J2'],
 ['r1-j3','2026-09-05','15:00','CS Sedan Ardennes','Cormontreuil FC','5–0','J3'],
 ['r1-j4','2026-09-09','20:00','CS Sedan Ardennes','ES Villerupt-Thil','3–1','J4'],
 ['r1-j5','2026-09-19','18:00','US Thionville Lusitanos 2','CS Sedan Ardennes','1–4','J5'],
 ['r1-j6','2026-10-03','18:30','CS Sedan Ardennes','USAG Uckange','2–1','J6'],
 ['r1-j7','2026-10-17','16:00','Bogny FC','CS Sedan Ardennes','','J7'],
 ['r1-j8','2026-10-24','20:00','FCF La Neuvillette Jamin','CS Sedan Ardennes','','J8'],
 ['r1-j9','2026-10-31','18:30','CS Sedan Ardennes','CSO Amnéville','','J9'],
 ['r1-j10','2026-11-08','14:30','FC Saint-Méziéry','CS Sedan Ardennes','','J10'],
 ['r1-j11','2026-11-14','18:30','CS Sedan Ardennes','RC Épernay','','J11'],
 ['r1-j12','2026-11-21','18:00','Charleville/Prix OAM 2','CS Sedan Ardennes','','J12'],
 ['r1-j13','2026-12-05','18:30','CS Sedan Ardennes','Stade de Reims 2','','J13'],
 ['r1-j14','2027-01-24','14:30','FC Hettange','CS Sedan Ardennes','','J14'],
 ['r1-j15','2027-01-31','14:30','Cormontreuil FC','CS Sedan Ardennes','','J15'],
 ['r1-j16','2027-02-07','14:30','CS Sedan Ardennes','ES Villerupt-Thil','','J16'],
 ['r1-j17','2027-02-20','18:30','CS Sedan Ardennes','US Thionville Lusitanos 2','','J17'],
 ['r1-j18','2027-02-28','14:30','USAG Uckange','CS Sedan Ardennes','','J18'],
 ['r1-j19','2027-03-13','18:30','CS Sedan Ardennes','Bogny FC','','J19'],
 ['r1-j20','2027-03-20','18:30','CS Sedan Ardennes','FCF La Neuvillette Jamin','','J20'],
 ['r1-j21','2027-04-03','18:30','CSO Amnéville','CS Sedan Ardennes','','J21'],
 ['r1-j22','2027-04-10','18:30','CS Sedan Ardennes','FC Saint-Méziéry','','J22'],
 ['r1-j23','2027-04-17','18:30','RC Épernay','CS Sedan Ardennes','','J23'],
 ['r1-j24','2027-05-01','18:30','CS Sedan Ardennes','Charleville/Prix OAM 2','','J24'],
 ['r1-j25','2027-05-09','15:00','Stade de Reims 2','CS Sedan Ardennes','','J25'],
 ['r1-j26','2027-05-23','15:00','CS Sedan Ardennes','Marnaval SC','','J26'],
].map(([id,date,time,home,away,score,stage])=>({id:String(id),teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:String(date),time:String(time),home:String(home),away:String(away),score:score?String(score):undefined,stage:String(stage),truth:id==='r1-j7'?'PUBLIC_CONFLICT_REVIEW':'SECONDARY_CORROBORATED',source:id==='r1-j6'?'SportCorico + LeBallonRond':'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:id==='r1-j7'?'Date/heure contradictoires dans les observations précédentes : conserver la revue au lieu de trancher silencieusement.':undefined}))

const CDF:Fixture[]=[
 {id:'cdf-1',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-13',time:null,home:'FC de Haybes',away:'CS Sedan Ardennes',score:'1–3',stage:'Coupe de France',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
 {id:'cdf-2',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-26',time:null,home:'CS Sedan Ardennes',away:'Reims Christo FC',score:'5–0',stage:'Coupe de France',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
 {id:'cdf-3',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-10-11',time:null,home:'Hagondange FC',away:'CS Sedan Ardennes',score:'0–2',stage:'Coupe de France',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'}
]

const ARDENNES:Fixture[]=[
 {id:'ard-senior-2026',teamId:'SENIORS_R1',competition:'COUPE ROGER MARCHE',date:'2026-04-26',time:'15:00',home:'CS Sedan Ardennes',away:'Nord Ardennes',score:'FORFAIT CSSA',stage:'Archive 2025–2026',truth:'PUBLIC_CONFIRMED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/',note:'Archive publique. Aucun match 2026–2027 n’est injecté sans source actuelle confirmée.'},
 {id:'ard-u18-2026',teamId:'U18F_R2',competition:'COUPE DES ARDENNES U18',date:'2026-05-30',time:'16:00',home:'OCPAM',away:'CS Sedan Ardennes',stage:'Archive 2025–2026',truth:'PUBLIC_CORROBORATED',source:'OCPAM',sourceUrl:'https://www.ocpam.fr/',note:'Archive publique identifiée ; résultat non promu faute de source fiable dans le dataset courant.'}
]

function spreadDates(count:number,offset:number){
 const start=new Date('2026-08-22T12:00:00'),end=new Date('2027-05-30T12:00:00'),span=end.getTime()-start.getTime()
 return Array.from({length:count},(_,i)=>{
  const ratio=count===1?0:i/(count-1)
  const d=new Date(start.getTime()+span*ratio+offset*86400000)
  if(d>end)d.setTime(end.getTime())
  return d.toISOString().slice(0,10)
 })
}
function simulatedCalendar(team:Team):Fixture[]{
 return spreadDates(team.fixtureCount,TEAMS.findIndex(t=>t.id===team.id)%5).map((date,i)=>{
  const home=i%2===0
  return {id:'sim:'+team.id+':'+String(i+1).padStart(2,'0'),teamId:team.id,competition:team.competition,date,time:null,home:home?'CS Sedan Ardennes':('Adversaire test '+String(i+1)),away:home?('Adversaire test '+String(i+1)):'CS Sedan Ardennes',stage:'J'+String(i+1),truth:'SIMULATED_NOT_OBSERVED',source:'F3E full_season_v0',simulated:true}
 })
}
function frDate(date:string){return new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short',day:'2-digit',month:'short'})}
function fullFrDate(date:string){return new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}

export default function CSSASportWorkspace(){
 const [teamId,setTeamId]=useState(()=>localStorage.getItem('cssa:sport:team')||'SENIORS_R1')
 const [filter,setFilter]=useState<'all'|'league'|'cdf'|'ardennes'|'finished'|'upcoming'>('all')
 const [selectedId,setSelectedId]=useState('')
 const [query,setQuery]=useState('')
 const [watch,setWatch]=useState<SportWatch|null>(null)
 const [watchLoading,setWatchLoading]=useState(false)
 const [auto,setAuto]=useState(true)
 const [notes,setNotes]=useState<Record<string,string>>(()=>{try{return JSON.parse(localStorage.getItem('cssa:sport:notes')||'{}')}catch{return {}}})
 const [reviewed,setReviewed]=useState<Record<string,boolean>>(()=>{try{return JSON.parse(localStorage.getItem('cssa:sport:reviewed')||'{}')}catch{return {}}})
 const [checks,setChecks]=useState<Record<string,Record<string,boolean>>>(()=>{try{return JSON.parse(localStorage.getItem('cssa:sport:checks')||'{}')}catch{return {}}})

 const team=TEAMS.find(t=>t.id===teamId)||TEAMS[0]
 useEffect(()=>localStorage.setItem('cssa:sport:team',teamId),[teamId])
 useEffect(()=>localStorage.setItem('cssa:sport:notes',JSON.stringify(notes)),[notes])
 useEffect(()=>localStorage.setItem('cssa:sport:reviewed',JSON.stringify(reviewed)),[reviewed])
 useEffect(()=>localStorage.setItem('cssa:sport:checks',JSON.stringify(checks)),[checks])

 const refresh=async(force=false)=>{
  setWatchLoading(true)
  try{const r=await fetch('/obsidia-local/cssa-sport-watch'+(force?'?force=1':''),{cache:'no-store'});if(r.ok)setWatch(await r.json())}finally{setWatchLoading(false)}
 }
 useEffect(()=>{refresh();if(!auto)return;const t=window.setInterval(()=>refresh(),300000);return()=>window.clearInterval(t)},[auto])

 const liveR1=useMemo(()=>watch?.liveMatches?.filter(x=>x.competition.includes('RÉGIONAL 1')).map((m,i):Fixture=>({
  id:'live:'+i,teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:m.date.includes('/')?m.date.split('/').reverse().join('-'):m.date,time:m.time,home:m.home.replace(/\s+1$/,''),away:m.away.replace(/\s+1$/,''),score:m.homeScore!==null?m.homeScore+'–'+m.awayScore:undefined,stage:'SOURCE LIVE',truth:'LIVE_PUBLIC_SOURCE',source:'SportCorico · veille automatique',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'
 }))||[],[watch])

 const base=team.id==='SENIORS_R1'?(liveR1.length>=10?liveR1:R1_REAL):simulatedCalendar(team)
 const allFixtures=team.id==='SENIORS_R1'?[...base,...CDF,...ARDENNES.filter(x=>x.teamId==='SENIORS_R1')]:[...base,...ARDENNES.filter(x=>x.teamId===team.id)]
 const now=new Date('2026-10-13T12:00:00')
 const visible=allFixtures.filter(f=>{
  if(query&&!((f.home+' '+f.away+' '+f.competition+' '+f.stage).toLowerCase().includes(query.toLowerCase())))return false
  if(filter==='league'&&!f.competition.includes('RÉGIONAL')&&!f.competition.includes('REGIONAL')&&!f.competition.includes('R2_')&&!f.competition.includes('U'))return false
  if(filter==='cdf'&&!f.competition.includes('FRANCE'))return false
  if(filter==='ardennes'&&!f.competition.includes('ARDENNES')&&!f.competition.includes('ROGER MARCHE'))return false
  const d=new Date(f.date+'T23:59:59')
  if(filter==='finished'&&!(f.score||d<now))return false
  if(filter==='upcoming'&&(f.score||d<now))return false
  return true
 }).sort((a,b)=>a.date.localeCompare(b.date))

 useEffect(()=>{if(!visible.length){setSelectedId('');return}if(!visible.some(x=>x.id===selectedId))setSelectedId(visible[0].id)},[teamId,filter,query,watch])
 const selected=visible.find(x=>x.id===selectedId)||visible[0]||null
 const checklist=['Transport','Stade / terrain','Arbitrage / FMI','Communication','Bénévoles / matchday']
 const next=allFixtures.find(f=>new Date(f.date+'T23:59:59')>=now&&!f.score)
 const finished=allFixtures.filter(f=>!!f.score).length
 const upcoming=allFixtures.filter(f=>!f.score&&new Date(f.date+'T23:59:59')>=now).length

 return <div className="spx">
  <aside className="spx-teams">
   <div className="spx-team-head"><small>ÉQUIPES CSSA</small><strong>19 structures</strong></div>
   <div className="spx-team-list">{TEAMS.map(t=><button key={t.id} className={t.id===team.id?'active':''} onClick={()=>{setTeamId(t.id);setFilter('all');setQuery('')}}><span>{t.label}</span><small>{t.competition}</small><b>{t.fixtureCount}</b></button>)}</div>
  </aside>

  <section className="spx-main">
   <header className="spx-hero"><div><small>{team.tier}</small><h2>{team.label}</h2><p>{team.competition} · Saison 2026–2027</p></div><div className="spx-kpis"><span><b>{team.fixtureCount}</b><small>matchs saison</small></span><span><b>{finished}</b><small>résultats connus</small></span><span><b>{upcoming}</b><small>à venir</small></span><span><b>{next?frDate(next.date):'—'}</b><small>prochain</small></span></div></header>

   <div className="spx-controls">
    <div className="spx-filters">{[['all','Tout'],['league','Championnat'],['cdf','Coupe de France'],['ardennes','Coupes Ardennes'],['finished','Résultats'],['upcoming','À venir']].map(([id,label])=><button key={id} className={filter===id?'active':''} onClick={()=>setFilter(id as typeof filter)}>{label}</button>)}</div>
    <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Adversaire, compétition…"/>
   </div>

   {team.id!=='SENIORS_R1'&&<div className="spx-sim-banner"><strong>MODE TEST F3E</strong><span>Calendrier synthétique déterministe pour cette équipe. Il sert à tester le fonctionnement complet ; il ne prétend pas être le calendrier réel.</span></div>}

   <div className="spx-grid">
    <section className="spx-calendar"><header><div><small>CALENDRIER</small><h3>{visible.length} rencontres affichées</h3></div><div className="spx-watch-mini"><span className={watch?.summary?.unreachable?'warn':'ok'}></span><small>{watch?.observedAt?'veille '+new Date(watch.observedAt).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}):'veille en attente'}</small></div></header>
     <div className="spx-matches">{visible.map(f=><button key={f.id} className={selected?.id===f.id?'active':''} onClick={()=>setSelectedId(f.id)}>
      <span className="spx-date"><b>{frDate(f.date)}</b><small>{f.time||'heure —'}</small></span>
      <span className="spx-opponents"><small>{f.stage} · {f.competition}</small><strong>{f.home}</strong><em>—</em><strong>{f.away}</strong></span>
      <span className={'spx-result '+(f.score?'done':'')}>{f.score||'À venir'}</span>
      {reviewed[f.id]&&<span className="spx-reviewed">REVU</span>}
     </button>)}</div>
    </section>

    <aside className="spx-detail">{selected?<><header><div><small>{selected.competition}</small><h3>{selected.home}<span> — </span>{selected.away}</h3><p>{fullFrDate(selected.date)} · {selected.time||'heure non renseignée'}</p></div><span className={'spx-truth '+(selected.simulated?'sim':'')}>{selected.truth}</span></header>
     {selected.note&&<div className="spx-alert"><strong>À vérifier</strong><p>{selected.note}</p></div>}
     <section className="spx-facts"><div><small>Statut</small><b>{selected.score?'Terminé':'À venir'}</b></div><div><small>Score</small><b>{selected.score||'—'}</b></div><div><small>Lieu logique</small><b>{/Sedan/.test(selected.home)?'Domicile':'Extérieur'}</b></div><div><small>Source</small><b>{selected.source}</b></div></section>

     <section className="spx-work"><header><h4>Préparation du match</h4><small>état local de travail</small></header>{checklist.map(key=><label key={key}><input type="checkbox" checked={!!checks[selected.id]?.[key]} onChange={e=>setChecks(prev=>({...prev,[selected.id]:{...(prev[selected.id]||{}),[key]:e.target.checked}}))}/><span>{key}</span></label>)}</section>

     <section className="spx-note"><header><h4>Note de travail</h4><small>enregistrée localement</small></header><textarea value={notes[selected.id]||''} onChange={e=>setNotes(prev=>({...prev,[selected.id]:e.target.value}))} placeholder="Préparation, contact, logistique, point à vérifier…"/></section>

     <div className="spx-actions"><button className={reviewed[selected.id]?'active':''} onClick={()=>setReviewed(prev=>({...prev,[selected.id]:!prev[selected.id]}))}>{reviewed[selected.id]?'✓ Match revu':'Marquer comme revu'}</button>{selected.sourceUrl&&<a href={selected.sourceUrl} target="_blank" rel="noreferrer">Ouvrir la source ↗</a>}</div>

     <section className="spx-source-state"><header><h4>Mise à jour automatique</h4><label><input type="checkbox" checked={auto} onChange={e=>setAuto(e.target.checked)}/> toutes les 5 min</label></header><div><span>Sources accessibles</span><b>{watch?.summary?.ok??0}/{watch?.sources?.length??0}</b></div><div><span>Pages modifiées</span><b>{watch?.summary?.changed??0}</b></div><div><span>Inaccessibles</span><b>{watch?.summary?.unreachable??0}</b></div><button onClick={()=>refresh(true)} disabled={watchLoading}>{watchLoading?'Actualisation…':'Actualiser maintenant'}</button></section>
    </>:<div className="spx-empty">Aucun match dans ce filtre.</div>}</aside>
   </div>

   <details className="spx-sources"><summary>Sources sportives et état de veille</summary><div>{(watch?.sources||[]).map(s=><article key={s.id}><header><strong>{s.label}</strong><span className={s.status==='OK'?'ok':'bad'}>{s.status}</span></header><p>{s.scope}</p><small>{s.observedAt}</small><b>{s.changed===null?'BASELINE':s.changed?'CHANGÉ · REVUE':'INCHANGÉ'}</b><a href={s.url} target="_blank" rel="noreferrer">ouvrir ↗</a></article>)}</div></details>
  </section>
 </div>
}
