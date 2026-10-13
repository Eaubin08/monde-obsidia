import {createHash} from 'node:crypto'

const SOURCES=[
 {id:'SPORTCORICO_SENIORS1',label:'SportCorico · Seniors 1',url:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',scope:'CALENDAR_ALL_COMPETITIONS'},
 {id:'LEBALLONROND_R1',label:'LeBallonRond · R1',url:'https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885',scope:'R1_CALENDAR_CORROBORATION'},
 {id:'CSSA_OFFICIAL_RESULTS',label:'CSSA · Résultats & calendrier',url:'https://cs-sedan.fr/resultats-calendrier',scope:'OFFICIAL_ENTRY_POINT'},
 {id:'DISTRICT_ARDENNES',label:'District des Ardennes',url:'https://district-foot08.fff.fr/',scope:'ARDENNES_CUPS_AUTHORITY_ENTRY'}
]

let cache={at:0,value:null}
let previousHashes=new Map()

function visibleText(html){
 return String(html)
  .replace(/<script[\s\S]*?<\/script>/gi,' ')
  .replace(/<style[\s\S]*?<\/style>/gi,' ')
  .replace(/<svg[\s\S]*?<\/svg>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;/gi,' ')
  .replace(/&amp;/gi,'&')
  .replace(/&#39;/g,"'")
  .replace(/&quot;/gi,'"')
  .replace(/\s+/g,' ')
  .trim()
}


function parseSportCoricoMatches(text){
 const boundary=/(MATCHS AMICAUX|RÉGIONAL 1 HOMIRIS|U20 RÉGIONAL 1|COUPE DE FRANCE CRÉDIT AGRICOLE(?: GRAND EST)?|COUPE ROGER MARCHE|COUPE DU GRAND EST)/g
 const parts=String(text).split(boundary)
 const rows=[]
 for(let i=1;i<parts.length;i+=2){
  const competition=parts[i]
  const body=(parts[i+1]||'').replace(/^\s+|\s+$/g,'')
  const m=body.match(/^(.*?)\s+(\d{2}\/\d{2}\/\d{4})\s+(?:(\d{1,2}:\d{2})\s+)?(?:(\d+)\s*-\s*(\d+)\s+)?(.*)$/)
  if(!m)continue
  const home=m[1].trim(),date=m[2],time=m[3]||null,homeScore=m[4]??null,awayScore=m[5]??null,away=m[6].trim()
  if(!/Sedan Ardennes CS 1/i.test(home)&&!/Sedan Ardennes CS 1/i.test(away))continue
  rows.push({competition,date,time,home,away,homeScore,awayScore,status:homeScore!==null?'FINISHED':'SCHEDULED'})
 }
 return rows
}

async function capture(source){
 const observedAt=new Date().toISOString()
 try{
  const response=await fetch(source.url,{headers:{'User-Agent':'Obsidia-CSSA-Sport-Watch/0.1','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(15000)})
  const body=await response.text()
  const text=visibleText(body)
  const hash=createHash('sha256').update(text).digest('hex')
  const before=previousHashes.get(source.id)
  previousHashes.set(source.id,hash)
  return {...source,observedAt,httpStatus:response.status,status:response.ok?'OK':'HTTP_ERROR',visibleTextSha256:hash,visibleChars:text.length,changed:before?before!==hash:null,preview:text.slice(0,700),previewFull:text.slice(0,60000)}
 }catch(error){
  return {...source,observedAt,status:'UNREACHABLE',errorType:error?.name||'Error',error:String(error?.message||error),changed:null}
 }
}

export async function readCssaSportWatch({force=false}={}){
 const now=Date.now()
 if(!force&&cache.value&&now-cache.at<5*60*1000)return cache.value
 const sources=await Promise.all(SOURCES.map(capture))
 const sportCorico=sources.find(x=>x.id==='SPORTCORICO_SENIORS1')
 const liveMatches=sportCorico?.status==='OK'?parseSportCoricoMatches(sportCorico.previewFull||sportCorico.preview||''):[]
 const value={
  schema:'CSSA_SPORT_PUBLIC_WATCH_V0',
  readonly:true,
  external_action:false,
  semantic_auto_promotion:false,
  refresh_interval_seconds:300,
  observedAt:new Date().toISOString(),
  sources:sources.map(({previewFull,...row})=>row),
  liveMatches,
  summary:{
   ok:sources.filter(x=>x.status==='OK').length,
   changed:sources.filter(x=>x.changed===true).length,
   unreachable:sources.filter(x=>x.status==='UNREACHABLE').length
  }
 }
 cache={at:now,value}
 return value
}
