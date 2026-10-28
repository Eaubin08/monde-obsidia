import {observeCssaSource} from './cssa-source-observation.mjs'
import {createHash} from 'node:crypto'
import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {liveDirectory} from './live-events.mjs'

const CACHE_FILE = resolve(liveDirectory, 'cssa_sport_watch_cache.json')

const SOURCES = [
  {id:'SPORTCORICO_SENIORS1',label:'SportCorico · Seniors 1',url:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',scope:'CALENDAR_ALL_COMPETITIONS'},
  {id:'LEBALLONROND_R1',label:'LeBallonRond · R1',url:'https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885',scope:'R1_CALENDAR_CORROBORATION'},
  {id:'CSSA_OFFICIAL_RESULTS',label:'CSSA · Résultats & calendrier',url:'https://cs-sedan.fr/resultats-calendrier',scope:'OFFICIAL_ENTRY_POINT'},
  {id:'DISTRICT_ARDENNES',label:'District des Ardennes',url:'https://district-foot08.fff.fr/',scope:'ARDENNES_CUPS_AUTHORITY_ENTRY'},
  {id:'DVCR_HOME',label:'DVCR · Drapeau Vert Carton Rouge',url:'https://www.dvcr.fr/',scope:'MEDIA_INDEPENDANT_MATCHDAY_BROADCAST'},
  {id:'DVCR_MATCHDAY',label:'DVCR · Jour de Match (Direct vidéo)',url:'https://www.dvcr.fr/jour-de-match',scope:'MATCH_BROADCAST_STATUS'},
  {id:'DVCR_BLOG',label:'DVCR · Blog & Débriefs',url:'https://www.dvcr.fr/blog',scope:'EDITORIAL_MATCH_REPORTS'}
]

let cache = {at: 0, value: null}
let previousHashes = new Map()

// Initialisation des hashs depuis le fichier persistant
try {
  if (existsSync(CACHE_FILE)) {
    const saved = JSON.parse(readFileSync(CACHE_FILE, 'utf8'))
    if (saved && typeof saved.hashes === 'object') {
      for (const [k, v] of Object.entries(saved.hashes)) {
        previousHashes.set(k, v)
      }
    }
    if (saved && saved.cachedValue && Date.now() - (saved.cachedAt || 0) < 5 * 60 * 1000) {
      cache = {at: saved.cachedAt, value: saved.cachedValue}
    }
  }
} catch {}

function saveWatchDisk() {
  try {
    const dir = resolve(CACHE_FILE, '..')
    if (!existsSync(dir)) mkdirSync(dir, {recursive: true})
    const serializable = {
      cachedAt: cache.at,
      cachedValue: cache.value,
      hashes: Object.fromEntries(previousHashes.entries())
    }
    writeFileSync(CACHE_FILE, JSON.stringify(serializable, null, 2), 'utf8')
  } catch {}
}

function visibleText(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseSportCoricoMatches(text) {
  const boundary = /(MATCHS AMICAUX|RÉGIONAL 1 HOMIRIS|U20 RÉGIONAL 1|COUPE DE FRANCE CRÉDIT AGRICOLE(?: GRAND EST)?|COUPE ROGER MARCHE|COUPE DU GRAND EST)/g
  const parts = String(text).split(boundary)
  const rows = []
  for (let i = 1; i < parts.length; i += 2) {
    const competition = parts[i]
    const body = (parts[i+1] || '').replace(/^\s+|\s+$/g, '')
    const m = body.match(/^(.*?)\s+(\d{2}\/\d{2}\/\d{4})\s+(?:(\d{1,2}:\d{2})\s+)?(?:(\d+)\s*-\s*(\d+)\s+)?(.*)$/)
    if (!m) continue
    const home = m[1].trim(), date = m[2], time = m[3] || null, homeScore = m[4] ?? null, awayScore = m[5] ?? null, away = m[6].trim()
    if (!/Sedan Ardennes CS 1/i.test(home) && !/Sedan Ardennes CS 1/i.test(away)) continue
    rows.push({competition, date, time, home, away, homeScore, awayScore, status: homeScore !== null ? 'FINISHED' : 'SCHEDULED'})
  }
  return rows
}

function parseDvcrMedia(blogSource, matchdaySource) {
  const articles = []
  if (blogSource?.status === 'OK' && blogSource.previewFull) {
    const titles = ['Hagondange trépigne d\'impatience', 'CHRONIQUES SEDANAISES IX', 'ENCHAÎNER LES PERFORMANCES', 'DVCR RECRUTE']
    for (const t of titles) {
      if (blogSource.previewFull.includes(t)) {
        articles.push({
          title: t,
          url: 'https://www.dvcr.fr/blog',
          category: t.includes('Hagondange') ? 'Coupe de France' : t.includes('CHRONIQUES') ? 'Chroniques Sedanaises' : 'Actualités'
        })
      }
    }
  }

  let broadcastLive = false
  if (matchdaySource?.status === 'OK' && matchdaySource.previewFull) {
    broadcastLive = /Diffusion en LIVE/i.test(matchdaySource.previewFull) || /YouTube/i.test(matchdaySource.previewFull)
  }

  return {
    available: (blogSource?.status === 'OK' || matchdaySource?.status === 'OK'),
    name: 'Drapeau Vert / Carton Rouge (DVCR)',
    associationSiren: '923996078',
    channelUrl: 'https://www.dvcr.fr/',
    matchdayUrl: 'https://www.dvcr.fr/jour-de-match',
    blogUrl: 'https://www.dvcr.fr/blog',
    podcastUrl: 'https://www.dvcr.fr/podcast',
    broadcastStatus: broadcastLive ? 'DIFFUSION_PREVUE_YOUTUBE' : 'AUCUN_DIRECT_ACTIF',
    articles
  }
}

async function capture(source) {
  const observedAt = new Date().toISOString()
  try {
    const response = await fetch(source.url, {
      headers: {'User-Agent': 'Obsidia-CSSA-Sport-Watch/0.2', 'Accept': 'text/html,application/xhtml+xml'},
      signal: AbortSignal.timeout(15000)
    })
    const body = await response.text()
    const text = visibleText(body)
    const hash = createHash('sha256').update(text).digest('hex')
    const before = previousHashes.get(source.id)
    previousHashes.set(source.id, hash)
    return {
      ...source,
      observedAt,
      httpStatus: response.status,
      status: response.ok ? 'OK' : 'HTTP_ERROR',
      visibleTextSha256: hash,
      visibleChars: text.length,
      changed: before ? before !== hash : null,
      preview: text.slice(0, 700),
      previewFull: text.slice(0, 60000)
    }
  } catch (error) {
    return {
      ...source,
      observedAt,
      status: 'UNREACHABLE',
      errorType: error?.name || 'Error',
      error: String(error?.message || error),
      changed: null
    }
  }
}

export async function readCssaSportWatch({force = false} = {}) {
  const now = Date.now()
  if (!force && cache.value && now - cache.at < 5 * 60 * 1000) {
    return cache.value
  }
  const sources = await Promise.all(SOURCES.map(capture))
  const sportCorico = sources.find(x => x.id === 'SPORTCORICO_SENIORS1')
  const dvcrBlog = sources.find(x => x.id === 'DVCR_BLOG')
  const dvcrMatchday = sources.find(x => x.id === 'DVCR_MATCHDAY')

  const liveMatches = sportCorico?.status === 'OK' ? parseSportCoricoMatches(sportCorico.previewFull || sportCorico.preview || '') : []
  const dvcrMedia = parseDvcrMedia(dvcrBlog, dvcrMatchday)

  const value = {
    schema: 'CSSA_SPORT_PUBLIC_WATCH_V0',
    readonly: true,
    external_action: false,
    semantic_auto_promotion: false,
    refresh_interval_seconds: 300,
    observedAt: new Date().toISOString(),
    sources: sources.map(({previewFull, ...row}) => row),
    liveMatches,
    dvcrMedia,
    summary: {
      ok: sources.filter(x => x.status === 'OK').length,
      changed: sources.filter(x => x.changed === true).length,
      unreachable: sources.filter(x => x.status === 'UNREACHABLE').length
    }
  }
  cache = {at: now, value}
  saveWatchDisk()
  return value
}

// Read the existing disk observation without initiating or refreshing web requests.
export function readCssaSportWatchCache(file=CACHE_FILE){
 let saved=null
 try{saved=JSON.parse(readFileSync(file,'utf8'))}catch{}
 const observed=observeCssaSource({},file,[])
 const value=saved?.cachedValue
 const valid=value&&typeof value==='object'&&!Array.isArray(value)&&Array.isArray(value.sources)&&typeof value.observedAt==='string'
 return {...(valid?value:{}),_source:{...observed._source,status:observed._source.status==='AVAILABLE'&&!valid?'INVALID':observed._source.status},cacheOnly:true}
}
