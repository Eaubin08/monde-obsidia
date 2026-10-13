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

async function capture(source){
 const observedAt=new Date().toISOString()
 try{
  const response=await fetch(source.url,{headers:{'User-Agent':'Obsidia-CSSA-Sport-Watch/0.1','Accept':'text/html,application/xhtml+xml'},signal:AbortSignal.timeout(15000)})
  const body=await response.text()
  const text=visibleText(body)
  const hash=createHash('sha256').update(text).digest('hex')
  const before=previousHashes.get(source.id)
  previousHashes.set(source.id,hash)
  return {...source,observedAt,httpStatus:response.status,status:response.ok?'OK':'HTTP_ERROR',visibleTextSha256:hash,visibleChars:text.length,changed:before?before!==hash:null,preview:text.slice(0,700)}
 }catch(error){
  return {...source,observedAt,status:'UNREACHABLE',errorType:error?.name||'Error',error:String(error?.message||error),changed:null}
 }
}

export async function readCssaSportWatch({force=false}={}){
 const now=Date.now()
 if(!force&&cache.value&&now-cache.at<5*60*1000)return cache.value
 const sources=await Promise.all(SOURCES.map(capture))
 const value={
  schema:'CSSA_SPORT_PUBLIC_WATCH_V0',
  readonly:true,
  external_action:false,
  semantic_auto_promotion:false,
  refresh_interval_seconds:300,
  observedAt:new Date().toISOString(),
  sources,
  summary:{
   ok:sources.filter(x=>x.status==='OK').length,
   changed:sources.filter(x=>x.changed===true).length,
   unreachable:sources.filter(x=>x.status==='UNREACHABLE').length
  }
 }
 cache={at:now,value}
 return value
}
