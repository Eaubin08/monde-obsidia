import {useEffect, useMemo, useState, useCallback} from 'react'
import './CSSASport.css'

export type WatchSource = {
  id: string
  label: string
  url: string
  scope: string
  status: string
  observedAt: string
  changed: boolean | null
  httpStatus?: number
}

export type DvcrArticle = {
  title: string
  url: string
  category: string
}

export type DvcrMedia = {
  available: boolean
  name: string
  associationSiren: string
  channelUrl: string
  matchdayUrl: string
  blogUrl: string
  podcastUrl: string
  broadcastStatus: string
  articles: DvcrArticle[]
}

export type SportWatch = {
  schema?: string
  observedAt?: string
  refresh_interval_seconds?: number
  summary?: {ok: number; changed: number; unreachable: number}
  sources?: WatchSource[]
  liveMatches?: {
    competition: string
    date: string
    time: string | null
    home: string
    away: string
    homeScore: string | null
    awayScore: string | null
    status: string
  }[]
  dvcrMedia?: DvcrMedia
}

export type MatchTask = {
  id: string
  label: string
  done: boolean
  createdAt: string
}

export type Fixture = {
  id: string
  teamId: string
  competition: string
  date: string
  time: string | null
  home: string
  away: string
  score?: string
  stage: string
  truth: string
  source: string
  sourceUrl?: string
  note?: string
  simulated?: boolean
  venue?: 'DOMICILE' | 'EXTERIEUR'
}

export type Team = {
  id: string
  label: string
  tier: string
  competition: string
  fixtureCount: number
  isReal: boolean
}

export const TEAMS: Team[] = [
  {id: 'SENIORS_R1', label: 'Seniors R1 (Fanion)', tier: 'SENIORS_POST_FORMATION', competition: 'REGIONAL_1_A', fixtureCount: 26, isReal: true},
  {id: 'SENIORS_R2', label: 'Seniors R2 (Réserve)', tier: 'SENIORS_POST_FORMATION', competition: 'REGIONAL_2_A', fixtureCount: 22, isReal: false},
  {id: 'U20_R1', label: 'U20 R1', tier: 'SENIORS_POST_FORMATION', competition: 'U20_R1', fixtureCount: 22, isReal: false},
  {id: 'U17_R1', label: 'U17 R1', tier: 'FORMATION', competition: 'U17_R1', fixtureCount: 22, isReal: false},
  {id: 'U16_R1', label: 'U16 R1', tier: 'FORMATION', competition: 'U16_R1', fixtureCount: 22, isReal: false},
  {id: 'U15_R1', label: 'U15 R1', tier: 'FORMATION', competition: 'U15_R1', fixtureCount: 22, isReal: false},
  {id: 'U15_D1', label: 'U15 D1', tier: 'FORMATION_PREFORMATION', competition: 'DISTRICT_D1', fixtureCount: 18, isReal: false},
  {id: 'SENIORS_F', label: 'Seniors féminines', tier: 'FEMININES', competition: 'R2_F_CENTRE_OUEST', fixtureCount: 18, isReal: false},
  {id: 'U18F_R2', label: 'U18 F R2', tier: 'FEMININES', competition: 'U18_R2_F', fixtureCount: 18, isReal: false},
  {id: 'U13_FANION', label: 'U13 Fanion', tier: 'FOOT_8', competition: 'U13_D1', fixtureCount: 18, isReal: false},
  {id: 'U13_U12_ESPOIR', label: 'U13/U12 Espoir', tier: 'FOOT_8', competition: 'U13_D2', fixtureCount: 16, isReal: false},
  {id: 'U12_AVENIR', label: 'U12 Avenir', tier: 'FOOT_8', competition: 'DISTRICT_PHASES', fixtureCount: 16, isReal: false},
  {id: 'U11_FANION', label: 'U11 Fanion', tier: 'FOOT_8', competition: 'PLATEAUX', fixtureCount: 14, isReal: false},
  {id: 'U11_U10_ESPOIR', label: 'U11/U10 Espoir', tier: 'FOOT_8', competition: 'PLATEAUX', fixtureCount: 14, isReal: false},
  {id: 'U10_AVENIR', label: 'U10 Avenir', tier: 'FOOT_8', competition: 'PLATEAUX', fixtureCount: 14, isReal: false},
  {id: 'U9', label: 'U9', tier: 'FOOT_5', competition: 'PLATEAUX', fixtureCount: 12, isReal: false},
  {id: 'U8', label: 'U8', tier: 'FOOT_5', competition: 'PLATEAUX', fixtureCount: 12, isReal: false},
  {id: 'U7', label: 'U7', tier: 'FOOT_5', competition: 'PLATEAUX', fixtureCount: 12, isReal: false},
  {id: 'U6', label: 'U6', tier: 'FOOT_5', competition: 'PLATEAUX', fixtureCount: 12, isReal: false}
]

export const R1_MATCHES: Fixture[] = [
  {id:'r1-j1',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-23',time:'16:00',home:'Marnaval SC',away:'CS Sedan Ardennes',score:'1–4',stage:'J1',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j2',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-29',time:'18:30',home:'CS Sedan Ardennes',away:'FC Hettange',score:'2–0',stage:'J2',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j3',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-05',time:'15:00',home:'CS Sedan Ardennes',away:'Cormontreuil FC',score:'5–0',stage:'J3',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j4',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-09',time:'20:00',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',score:'3–1',stage:'J4',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j5',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-19',time:'18:00',home:'US Thionville Lusitanos 2',away:'CS Sedan Ardennes',score:'1–4',stage:'J5',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j6',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-03',time:'18:30',home:'CS Sedan Ardennes',away:'USAG Uckange',score:'2–1',stage:'J6',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico + LeBallonRond',sourceUrl:'https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885'},
  {id:'r1-j7',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-17',time:'16:00',home:'Bogny FC',away:'CS Sedan Ardennes',stage:'J7',venue:'EXTERIEUR',truth:'PUBLIC_CONFLICT_REVIEW',source:'SportCorico · discordance LeBallonRond',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Discordance d’observation : SportCorico indique samedi 17/10 16h00 tandis que LeBallonRond et annonces antérieures indiquaient dimanche ou autre horaire. Conflit conservé, revue et confirmation requises.'},
  {id:'r1-j8',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-24',time:'20:00',home:'FCF La Neuvillette Jamin',away:'CS Sedan Ardennes',stage:'J8',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j9',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-31',time:'18:30',home:'CS Sedan Ardennes',away:'CSO Amnéville',stage:'J9',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j10',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-08',time:'14:30',home:'FC Saint-Méziéry',away:'CS Sedan Ardennes',stage:'J10',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j11',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-14',time:'18:30',home:'CS Sedan Ardennes',away:'RC Épernay',stage:'J11',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j12',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-21',time:'18:00',home:'Charleville/Prix OAM 2',away:'CS Sedan Ardennes',stage:'J12',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j13',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-12-05',time:'18:30',home:'CS Sedan Ardennes',away:'Stade de Reims 2',stage:'J13',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j14',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-24',time:'14:30',home:'FC Hettange',away:'CS Sedan Ardennes',stage:'J14',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j15',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-31',time:'14:30',home:'Cormontreuil FC',away:'CS Sedan Ardennes',stage:'J15',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j16',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-07',time:'14:30',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',stage:'J16',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j17',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-20',time:'18:30',home:'CS Sedan Ardennes',away:'US Thionville Lusitanos 2',stage:'J17',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j18',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-28',time:'14:30',home:'USAG Uckange',away:'CS Sedan Ardennes',stage:'J18',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j19',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-13',time:'18:30',home:'CS Sedan Ardennes',away:'Bogny FC',stage:'J19',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j20',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-20',time:'18:30',home:'CS Sedan Ardennes',away:'FCF La Neuvillette Jamin',stage:'J20',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j21',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-03',time:'18:30',home:'CSO Amnéville',away:'CS Sedan Ardennes',stage:'J21',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j22',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-10',time:'18:30',home:'CS Sedan Ardennes',away:'FC Saint-Méziéry',stage:'J22',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j23',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-17',time:'18:30',home:'RC Épernay',away:'CS Sedan Ardennes',stage:'J23',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j24',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-01',time:'18:30',home:'CS Sedan Ardennes',away:'Charleville/Prix OAM 2',stage:'J24',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j25',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-09',time:'15:00',home:'Stade de Reims 2',away:'CS Sedan Ardennes',stage:'J25',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j26',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-23',time:'15:00',home:'CS Sedan Ardennes',away:'Marnaval SC',stage:'J26',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'}
]

export const COUPE_DE_FRANCE: Fixture[] = [
  {id:'cdf-1',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-13',time:'15:00',home:'FC de Haybes',away:'CS Sedan Ardennes',score:'1–3',stage:'Tour 3',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-2',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-26',time:'18:00',home:'CS Sedan Ardennes',away:'Reims Christo FC',score:'5–0',stage:'Tour 4',venue:'DOMICILE',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-3',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-10-11',time:'15:00',home:'Hagondange FC',away:'CS Sedan Ardennes',score:'0–2',stage:'Tour 5',venue:'EXTERIEUR',truth:'SECONDARY_CORROBORATED',source:'SportCorico · DVCR',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Match du 11/10/2026 couvert par DVCR (article d\'avant-match "Hagondange trépigne d\'impatience"). Victoire 0-2 qualifiant le CSSA.'}
]

export const ARDENNES_ARCHIVES: Fixture[] = [
  {id:'ard-senior-2026',teamId:'SENIORS_R1',competition:'COUPE ROGER MARCHE',date:'2026-04-26',time:'15:00',home:'CS Sedan Ardennes',away:'Nord Ardennes',score:'FORFAIT CSSA',stage:'Archive 2025–2026',venue:'DOMICILE',truth:'PUBLIC_CONFIRMED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/',note:'Archive publique. Aucun match 2026–2027 n’est injecté sans source actuelle confirmée.'},
  {id:'ard-u18-2026',teamId:'U18F_R2',competition:'COUPE DES ARDENNES U18',date:'2026-05-30',time:'16:00',home:'OCPAM',away:'CS Sedan Ardennes',stage:'Archive 2025–2026',venue:'EXTERIEUR',truth:'PUBLIC_CORROBORATED',source:'OCPAM',sourceUrl:'https://www.ocpam.fr/',note:'Archive publique identifiée ; résultat non promu faute de source fiable dans le dataset courant.'}
]

function spreadDates(count: number, offset: number) {
  const start = new Date('2026-08-22T12:00:00'), end = new Date('2027-05-30T12:00:00'), span = end.getTime() - start.getTime()
  return Array.from({length: count}, (_, i) => {
    const ratio = count === 1 ? 0 : i / (count - 1)
    const d = new Date(start.getTime() + span * ratio + offset * 86400000)
    if (d > end) d.setTime(end.getTime())
    return d.toISOString().slice(0, 10)
  })
}

function simulatedCalendar(team: Team): Fixture[] {
  return spreadDates(team.fixtureCount, TEAMS.findIndex(t => t.id === team.id) % 5).map((date, i) => {
    const home = i % 2 === 0
    return {
      id: 'sim:' + team.id + ':' + String(i + 1).padStart(2, '0'),
      teamId: team.id,
      competition: team.competition,
      date,
      time: null,
      home: home ? 'CS Sedan Ardennes' : ('Adversaire test ' + String(i + 1)),
      away: home ? ('Adversaire test ' + String(i + 1)) : 'CS Sedan Ardennes',
      stage: 'J' + String(i + 1),
      venue: home ? 'DOMICILE' : 'EXTERIEUR',
      truth: 'SIMULATED_NOT_OBSERVED',
      source: 'F3E full_season_v0',
      simulated: true
    }
  })
}

function frDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {weekday: 'short', day: '2-digit', month: 'short'})
}

function fullFrDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
}

export default function CSSASportWorkspace() {
  // Parse initial routing from location.hash (#cssa/sportif/:teamId/:matchId)
  const parseHash = useCallback(() => {
    const hash = location.hash || ''
    if (!hash.startsWith('#cssa/sportif')) {
      return {teamId: 'SENIORS_R1', matchId: ''}
    }
    const parts = hash.split('/')
    return {
      teamId: parts[2] ? decodeURIComponent(parts[2]) : 'SENIORS_R1',
      matchId: parts[3] ? decodeURIComponent(parts[3]) : ''
    }
  }, [])

  const initialRoute = parseHash()
  const [teamId, setTeamId] = useState<string>(initialRoute.teamId || 'SENIORS_R1')
  const [selectedId, setSelectedId] = useState<string>(initialRoute.matchId || '')
  const [filter, setFilter] = useState<'all' | 'league' | 'cdf' | 'ardennes' | 'finished' | 'upcoming'>('all')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'dossier' | 'preparation' | 'media' | 'sources'>('dossier')

  // Watch state
  const [watch, setWatch] = useState<SportWatch | null>(null)
  const [watchLoading, setWatchLoading] = useState(false)
  const [auto, setAuto] = useState(true)

  // Persistent server state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({})
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({})
  const [tasks, setTasks] = useState<Record<string, MatchTask[]>>({})
  const [newTaskText, setNewTaskText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved')

  // Hash route synchronization
  useEffect(() => {
    const onHashChange = () => {
      const {teamId: nextTeam, matchId: nextMatch} = parseHash()
      if (nextTeam && nextTeam !== teamId) setTeamId(nextTeam)
      if (nextMatch !== undefined && nextMatch !== selectedId) setSelectedId(nextMatch)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [parseHash, teamId, selectedId])

  const navigateTo = useCallback((nextTeam: string, nextMatch?: string) => {
    setTeamId(nextTeam)
    if (nextMatch !== undefined) setSelectedId(nextMatch)
    const url = `#cssa/sportif/${encodeURIComponent(nextTeam)}${nextMatch ? '/' + encodeURIComponent(nextMatch) : ''}`
    if (location.hash !== url) {
      location.hash = url
    }
  }, [])

  // Load persistent state from server
  const loadServerState = useCallback(async () => {
    try {
      const r = await fetch('/obsidia-local/cssa-sport-state', {cache: 'no-store'})
      if (r.ok) {
        const data = await r.json()
        if (data.notes) setNotes(data.notes)
        if (data.checks) setChecks(data.checks)
        if (data.reviewed) setReviewed(data.reviewed)
        if (data.tasks) setTasks(data.tasks)
        setSaveStatus('saved')
        return
      }
    } catch {}
    // Fallback localStorage
    try {
      setNotes(JSON.parse(localStorage.getItem('cssa:sport:notes') || '{}'))
      setChecks(JSON.parse(localStorage.getItem('cssa:sport:checks') || '{}'))
      setReviewed(JSON.parse(localStorage.getItem('cssa:sport:reviewed') || '{}'))
      setTasks(JSON.parse(localStorage.getItem('cssa:sport:tasks') || '{}'))
    } catch {}
    setSaveStatus('offline')
  }, [])

  useEffect(() => {
    loadServerState()
  }, [loadServerState])

  // Save persistent state to server with fallback
  const persistState = useCallback(async (patch: {
    notes?: Record<string, string>
    checks?: Record<string, Record<string, boolean>>
    reviewed?: Record<string, boolean>
    tasks?: Record<string, MatchTask[]>
  }) => {
    setSaveStatus('saving')
    try {
      const r = await fetch('/obsidia-local/cssa-sport-state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(patch)
      })
      if (r.ok) {
        setSaveStatus('saved')
        return
      }
    } catch {}
    // Fallback localStorage
    if (patch.notes) localStorage.setItem('cssa:sport:notes', JSON.stringify(patch.notes))
    if (patch.checks) localStorage.setItem('cssa:sport:checks', JSON.stringify(patch.checks))
    if (patch.reviewed) localStorage.setItem('cssa:sport:reviewed', JSON.stringify(patch.reviewed))
    if (patch.tasks) localStorage.setItem('cssa:sport:tasks', JSON.stringify(patch.tasks))
    setSaveStatus('offline')
  }, [])

  // Watch refresh
  const loadWatch = useCallback(async (force = false) => {
    setWatchLoading(true)
    try {
      const r = await fetch('/obsidia-local/cssa-sport-watch' + (force ? '?force=1' : ''), {cache: 'no-store'})
      if (r.ok) setWatch(await r.json())
    } catch {}
    finally { setWatchLoading(false) }
  }, [])

  useEffect(() => {
    loadWatch()
    if (!auto) return
    const t = window.setInterval(() => loadWatch(), 300000)
    return () => window.clearInterval(t)
  }, [auto, loadWatch])

  const team = TEAMS.find(t => t.id === teamId) || TEAMS[0]

  // Fixtures construction
  const allFixtures = useMemo<Fixture[]>(() => {
    if (team.id === 'SENIORS_R1') {
      return [...R1_MATCHES, ...COUPE_DE_FRANCE, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'SENIORS_R1')]
    }
    return [...simulatedCalendar(team), ...ARDENNES_ARCHIVES.filter(x => x.teamId === team.id)]
  }, [team])

  const now = new Date('2026-10-13T12:00:00')

  const visible = useMemo(() => {
    return allFixtures.filter(f => {
      if (query && !((f.home + ' ' + f.away + ' ' + f.competition + ' ' + f.stage).toLowerCase().includes(query.toLowerCase()))) {
        return false
      }
      if (filter === 'league' && !f.competition.includes('RÉGIONAL') && !f.competition.includes('REGIONAL') && !f.competition.includes('R2_') && !f.competition.includes('U')) return false
      if (filter === 'cdf' && !f.competition.includes('FRANCE')) return false
      if (filter === 'ardennes' && !f.competition.includes('ARDENNES') && !f.competition.includes('ROGER MARCHE')) return false
      const d = new Date(f.date + 'T23:59:59')
      if (filter === 'finished' && !(f.score || d < now)) return false
      if (filter === 'upcoming' && (f.score || d < now)) return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [allFixtures, query, filter, now])

  // Select match
  useEffect(() => {
    if (!visible.length) {
      if (selectedId) setSelectedId('')
      return
    }
    if (!selectedId || !visible.some(x => x.id === selectedId)) {
      const defaultMatch = visible[0].id
      setSelectedId(defaultMatch)
      const url = `#cssa/sportif/${encodeURIComponent(team.id)}/${encodeURIComponent(defaultMatch)}`
      if (location.hash !== url) location.hash = url
    }
  }, [visible, selectedId, team.id])

  const selected = visible.find(x => x.id === selectedId) || visible[0] || null

  const checklistItems = [
    'Transport & Logistique (minibus/bus, convocation)',
    'Stade & Terrain (accueil, vestiaires, équipements)',
    'Arbitrage & FMI (tablette FMI, licences vérifiées)',
    'Communication & Médias (visuels, annonce DVCR)',
    'Bénévoles & Matchday (buvette, ramasseurs de balle)',
    'Sécurité & Délégué (sécurité stade, protocole)'
  ]

  // Handlers for state updates
  const handleToggleCheck = (matchId: string, itemKey: string) => {
    const nextChecks = {
      ...checks,
      [matchId]: {
        ...(checks[matchId] || {}),
        [itemKey]: !checks[matchId]?.[itemKey]
      }
    }
    setChecks(nextChecks)
    persistState({checks: nextChecks})
  }

  const handleNoteChange = (matchId: string, text: string) => {
    const nextNotes = {...notes, [matchId]: text}
    setNotes(nextNotes)
  }

  const handleSaveNote = (_matchId?: string) => {
    persistState({notes})
  }

  const handleToggleReview = (matchId: string) => {
    const nextReviewed = {...reviewed, [matchId]: !reviewed[matchId]}
    setReviewed(nextReviewed)
    persistState({reviewed: nextReviewed})
  }

  const handleAddTask = (matchId: string) => {
    if (!newTaskText.trim()) return
    const newTask: MatchTask = {
      id: 'task-' + Date.now(),
      label: newTaskText.trim(),
      done: false,
      createdAt: new Date().toISOString()
    }
    const matchTasks = [...(tasks[matchId] || []), newTask]
    const nextTasks = {...tasks, [matchId]: matchTasks}
    setTasks(nextTasks)
    setNewTaskText('')
    persistState({tasks: nextTasks})
  }

  const handleToggleTask = (matchId: string, taskId: string) => {
    const matchTasks = (tasks[matchId] || []).map(t => t.id === taskId ? {...t, done: !t.done} : t)
    const nextTasks = {...tasks, [matchId]: matchTasks}
    setTasks(nextTasks)
    persistState({tasks: nextTasks})
  }

  const handleDeleteTask = (matchId: string, taskId: string) => {
    const matchTasks = (tasks[matchId] || []).filter(t => t.id !== taskId)
    const nextTasks = {...tasks, [matchId]: matchTasks}
    setTasks(nextTasks)
    persistState({tasks: nextTasks})
  }

  const nextMatch = allFixtures.find(f => new Date(f.date + 'T23:59:59') >= now && !f.score)
  const finishedCount = allFixtures.filter(f => !!f.score).length
  const upcomingCount = allFixtures.filter(f => !f.score && new Date(f.date + 'T23:59:59') >= now).length

  return (
    <div className="spx">
      {/* Colonne 1 : Équipes */}
      <aside className="spx-teams">
        <div className="spx-team-head">
          <div>
            <small>ORGANISATION SPORTIVE</small>
            <strong>19 structures CSSA</strong>
          </div>
          <span className="spx-live-badge">R1 ACTIVE</span>
        </div>
        <div className="spx-team-list">
          {TEAMS.map(t => (
            <button
              key={t.id}
              className={(t.id === team.id ? 'active ' : '') + (t.isReal ? 'team-real' : 'team-sim')}
              onClick={() => navigateTo(t.id)}
            >
              <div className="spx-team-info">
                <span>{t.label}</span>
                <small>{t.competition}</small>
              </div>
              <div className="spx-team-meta">
                <b>{t.fixtureCount}</b>
                <span className={'spx-tag ' + (t.isReal ? 'real' : 'sim')}>
                  {t.isReal ? 'RÉEL' : 'SIM'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Colonne 2 & 3 : Main */}
      <section className="spx-main">
        {/* Hero Header */}
        <header className="spx-hero">
          <div>
            <div className="spx-hero-top">
              <small>{team.tier}</small>
              {team.isReal ? (
                <span className="spx-pill real">COMPÉTITION RÉELLE CONFIRMÉE</span>
              ) : (
                <span className="spx-pill sim">SIMULATION DÉTERMINISTE F3E</span>
              )}
            </div>
            <h2>{team.label}</h2>
            <p>{team.competition} · Saison 2026–2027 · Club Sportif Sedan Ardennes</p>
          </div>
          <div className="spx-kpis">
            <span>
              <b>{team.fixtureCount}</b>
              <small>matchs saison</small>
            </span>
            <span>
              <b>{finishedCount}</b>
              <small>résultats</small>
            </span>
            <span>
              <b>{upcomingCount}</b>
              <small>à venir</small>
            </span>
            <span>
              <b>{nextMatch ? frDate(nextMatch.date) : '—'}</b>
              <small>prochain match</small>
            </span>
          </div>
        </header>

        {/* Toolbar & Sync state */}
        <div className="spx-controls">
          <div className="spx-filters">
            {[
              ['all', 'Tout'],
              ['league', 'Championnat R1'],
              ['cdf', 'Coupe de France'],
              ['ardennes', 'Coupes régionales'],
              ['finished', 'Résultats'],
              ['upcoming', 'À venir']
            ].map(([id, label]) => (
              <button
                key={id}
                className={filter === id ? 'active' : ''}
                onClick={() => setFilter(id as typeof filter)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="spx-controls-right">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Adversaire, lieu, tour…"
            />
            <span className={'spx-sync-indicator ' + saveStatus}>
              {saveStatus === 'saved' ? '✓ Disque .obsidia-live' : saveStatus === 'saving' ? '⟳ Sauvegarde...' : '⚠ Local (offline)'}
            </span>
          </div>
        </div>

        {!team.isReal && (
          <div className="spx-sim-banner">
            <strong>MODE SIMULATION F3E</strong>
            <span>Cette équipe utilise un calendrier synthétique déterministe pour tester les flux du club. Seuls les Seniors R1 utilisent le calendrier officiel complet.</span>
          </div>
        )}

        {/* Grille principale : Calendrier (Col 2) + Dossier Match (Col 3) */}
        <div className="spx-grid">
          {/* Colonne 2 : Calendrier / Matchs */}
          <section className="spx-calendar">
            <header>
              <div>
                <small>CALENDRIER OFFICIEL & CORROBORÉ</small>
                <h3>{visible.length} rencontre(s) affichée(s)</h3>
              </div>
              <div className="spx-watch-mini">
                <span className={watch?.summary?.unreachable ? 'warn' : 'ok'}></span>
                <small>
                  {watch?.observedAt
                    ? 'Veille ' + new Date(watch.observedAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})
                    : 'Veille en attente'}
                </small>
              </div>
            </header>

            <div className="spx-matches">
              {visible.map(f => (
                <button
                  key={f.id}
                  className={(selected?.id === f.id ? 'active ' : '') + (f.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'conflict ' : '')}
                  onClick={() => navigateTo(team.id, f.id)}
                >
                  <span className="spx-date">
                    <b>{frDate(f.date)}</b>
                    <small>{f.time || 'heure —'}</small>
                  </span>
                  <span className="spx-opponents">
                    <small>{f.stage} · {f.competition} ({f.venue})</small>
                    <strong>{f.home}</strong>
                    <em>vs</em>
                    <strong>{f.away}</strong>
                  </span>
                  <span className={'spx-result ' + (f.score ? 'done' : '')}>
                    {f.score || 'À venir'}
                  </span>
                  {reviewed[f.id] && <span className="spx-reviewed">REVU</span>}
                </button>
              ))}
              {!visible.length && (
                <div className="spx-empty">Aucune rencontre trouvée dans ce filtre.</div>
              )}
            </div>
          </section>

          {/* Colonne 3 : Dossier Match Complet */}
          <aside className="spx-detail">
            {selected ? (
              <>
                <header className="spx-detail-header">
                  <div>
                    <div className="spx-detail-badges">
                      <span className="spx-comp-badge">{selected.competition}</span>
                      <span className={'spx-venue-badge ' + selected.venue?.toLowerCase()}>{selected.venue}</span>
                      <span className={'spx-truth ' + (selected.simulated ? 'sim' : selected.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'warn' : '')}>
                        {selected.truth}
                      </span>
                    </div>
                    <h3>{selected.home} — {selected.away}</h3>
                    <p>{fullFrDate(selected.date)} · {selected.time || 'Horaire à confirmer'}</p>
                  </div>
                  <div className="spx-score-box">
                    <span>{selected.score ? 'SCORE' : 'STATUT'}</span>
                    <strong>{selected.score || 'À VENIR'}</strong>
                  </div>
                </header>

                {/* Alerte Conflit de sources (ex: Bogny J7) */}
                {selected.truth === 'PUBLIC_CONFLICT_REVIEW' && (
                  <div className="spx-alert warning">
                    <strong>DISCORDANCE OBSERVÉE SUR CETTE RENCONTRE</strong>
                    <p>{selected.note || 'Les sources publiques affichent des dates ou des horaires contradictoires pour cette rencontre. L’information est conservée pour revue opérationnelle.'}</p>
                  </div>
                )}

                {/* Métriques / Faits rapides du match */}
                <section className="spx-facts">
                  <div>
                    <small>Compétition & Tour</small>
                    <b>{selected.competition} · {selected.stage}</b>
                  </div>
                  <div>
                    <small>Localisation</small>
                    <b>{selected.venue === 'DOMICILE' ? 'Stade Louis-Dugauguez (Sedan)' : 'Extérieur'}</b>
                  </div>
                  <div>
                    <small>Couverture DVCR</small>
                    <b>{watch?.dvcrMedia?.available ? 'Média actif (Jour de Match / Blog)' : 'DVCR disponible'}</b>
                  </div>
                  <div>
                    <small>Source principale</small>
                    <b>{selected.source}</b>
                  </div>
                </section>

                {/* Onglets du Dossier Match */}
                <nav className="spx-dossier-nav">
                  <button
                    className={activeTab === 'dossier' ? 'active' : ''}
                    onClick={() => setActiveTab('dossier')}
                  >
                    Dossier & Préparation
                  </button>
                  <button
                    className={activeTab === 'media' ? 'active' : ''}
                    onClick={() => setActiveTab('media')}
                  >
                    Médias & DVCR
                  </button>
                  <button
                    className={activeTab === 'sources' ? 'active' : ''}
                    onClick={() => setActiveTab('sources')}
                  >
                    Sources & Preuves
                  </button>
                </nav>

                {/* TAB 1 : Dossier & Préparation */}
                {activeTab === 'dossier' && (
                  <div className="spx-tab-pane">
                    {/* Checklist opérationnelle */}
                    <section className="spx-work">
                      <header>
                        <h4>Checklist Opérationnelle</h4>
                        <small>Persistée sur disque (.obsidia-live)</small>
                      </header>
                      <div className="spx-checklist">
                        {checklistItems.map(key => (
                          <label key={key} className={checks[selected.id]?.[key] ? 'checked' : ''}>
                            <input
                              type="checkbox"
                              checked={!!checks[selected.id]?.[key]}
                              onChange={() => handleToggleCheck(selected.id, key)}
                            />
                            <span>{key}</span>
                          </label>
                        ))}
                      </div>
                    </section>

                    {/* Tâches spécifiques au match */}
                    <section className="spx-tasks-section">
                      <header>
                        <h4>Tâches Liées au Match</h4>
                        <small>{(tasks[selected.id] || []).length} tâche(s)</small>
                      </header>
                      <div className="spx-task-add">
                        <input
                          value={newTaskText}
                          onChange={e => setNewTaskText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleAddTask(selected.id)}
                          placeholder="Ajouter une tâche opérationnelle (ex: valider minibus)..."
                        />
                        <button onClick={() => handleAddTask(selected.id)}>+ Ajouter</button>
                      </div>
                      <div className="spx-task-list">
                        {(tasks[selected.id] || []).map(t => (
                          <div key={t.id} className={'spx-task-item ' + (t.done ? 'done' : '')}>
                            <label>
                              <input
                                type="checkbox"
                                checked={t.done}
                                onChange={() => handleToggleTask(selected.id, t.id)}
                              />
                              <span>{t.label}</span>
                            </label>
                            <button
                              className="spx-task-del"
                              onClick={() => handleDeleteTask(selected.id, t.id)}
                              title="Supprimer la tâche"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {!(tasks[selected.id] || []).length && (
                          <p className="spx-empty-inline">Aucune tâche spécifique créée pour ce match.</p>
                        )}
                      </div>
                    </section>

                    {/* Notes de staff */}
                    <section className="spx-note">
                      <header>
                        <h4>Notes du Staff & Logistique</h4>
                        <small>{notes[selected.id] ? 'Modifiée' : 'Vide'}</small>
                      </header>
                      <textarea
                        value={notes[selected.id] || ''}
                        onChange={e => handleNoteChange(selected.id, e.target.value)}
                        onBlur={() => handleSaveNote(selected.id)}
                        placeholder="Consignes de match, détails du transport, causerie, contacts adverses..."
                      />
                      <div className="spx-note-footer">
                        <small>Sauvegarde automatique à la désélection ou clic :</small>
                        <button onClick={() => handleSaveNote(selected.id)}>Enregistrer la note</button>
                      </div>
                    </section>

                    {/* Actions de validation */}
                    <div className="spx-actions">
                      <button
                        className={reviewed[selected.id] ? 'active' : ''}
                        onClick={() => handleToggleReview(selected.id)}
                      >
                        {reviewed[selected.id] ? '✓ Match vérifié & revu' : 'Marquer comme revu'}
                      </button>
                      {selected.sourceUrl && (
                        <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                          Ouvrir la source {selected.source.split('·')[0]} ↗
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2 : Médias & DVCR */}
                {activeTab === 'media' && (
                  <div className="spx-tab-pane">
                    <section className="spx-media-block">
                      <div className="spx-media-hero">
                        <span className="spx-media-icon">📺</span>
                        <div>
                          <strong>Drapeau Vert / Carton Rouge (DVCR)</strong>
                          <p>Le Média 800 % CSSA - Sedan · Média indépendant & diffuseur vidéo</p>
                          <small>Association Siren : 923996078</small>
                        </div>
                      </div>

                      <div className="spx-media-links">
                        <a
                          href="https://www.dvcr.fr/jour-de-match"
                          target="_blank"
                          rel="noreferrer"
                          className="spx-btn-primary"
                        >
                          🔴 Suivre le direct vidéo / Jour de Match DVCR ↗
                        </a>
                        <a
                          href="https://www.dvcr.fr/podcast"
                          target="_blank"
                          rel="noreferrer"
                          className="spx-btn-secondary"
                        >
                          🎙️ DVCR L'Émission (Podcast hebdomadaire) ↗
                        </a>
                        <a
                          href="https://www.dvcr.fr/blog"
                          target="_blank"
                          rel="noreferrer"
                          className="spx-btn-secondary"
                        >
                          📰 Le Blog Vert & Rouge ↗
                        </a>
                      </div>

                      <div className="spx-dvcr-articles">
                        <h4>Publications & Chroniques DVCR Récentes :</h4>
                        {watch?.dvcrMedia?.articles?.length ? (
                          watch.dvcrMedia.articles.map(a => (
                            <article key={a.title} className="spx-article-card">
                              <span>{a.category}</span>
                              <strong>{a.title}</strong>
                              <a href={a.url} target="_blank" rel="noreferrer">Lire sur DVCR ↗</a>
                            </article>
                          ))
                        ) : (
                          <div className="spx-article-card">
                            <span>Coupe de France</span>
                            <strong>Hagondange trépigne d'impatience</strong>
                            <p>Avant-match complet sur le 5e tour de Coupe de France du CSSA.</p>
                            <a href="https://www.dvcr.fr/blog" target="_blank" rel="noreferrer">Consulter sur DVCR ↗</a>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* TAB 3 : Sources & Preuves */}
                {activeTab === 'sources' && (
                  <div className="spx-tab-pane">
                    <section className="spx-sources-dossier">
                      <article className="spx-proof-item">
                        <header>
                          <strong>SportCorico</strong>
                          <span className="spx-badge-ok">CORROBORÉ</span>
                        </header>
                        <p>Calendrier officiel FFF Régional 1 Poule A et Coupe de France.</p>
                        <a href="https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027" target="_blank" rel="noreferrer">
                          Consulter la fiche SportCorico ↗
                        </a>
                      </article>

                      <article className="spx-proof-item">
                        <header>
                          <strong>LeBallonRond</strong>
                          <span className="spx-badge-ok">CORROBORÉ</span>
                        </header>
                        <p>Suivi de l'équipe première du CS Sedan Ardennes (éd. 221885).</p>
                        <a href="https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885" target="_blank" rel="noreferrer">
                          Consulter la fiche LeBallonRond ↗
                        </a>
                      </article>

                      <article className="spx-proof-item">
                        <header>
                          <strong>Site officiel CS Sedan Ardennes</strong>
                          <span className="spx-badge-ok">OFFICIEL</span>
                        </header>
                        <p>Résultats et calendrier publiés par le club.</p>
                        <a href="https://cs-sedan.fr/resultats-calendrier" target="_blank" rel="noreferrer">
                          Accéder à cs-sedan.fr ↗
                        </a>
                      </article>

                      <article className="spx-proof-item">
                        <header>
                          <strong>District des Ardennes FFF</strong>
                          <span className="spx-badge-ok">OFFICIEL</span>
                        </header>
                        <p>PV et compétitions départementales (Coupe Roger Marche).</p>
                        <a href="https://district-foot08.fff.fr/" target="_blank" rel="noreferrer">
                          Accéder au District FFF ↗
                        </a>
                      </article>

                      <article className="spx-proof-item">
                        <header>
                          <strong>DVCR (Drapeau Vert Carton Rouge)</strong>
                          <span className="spx-badge-ok">DIFFUSION</span>
                        </header>
                        <p>Diffuseur vidéo et média indépendant du CSSA.</p>
                        <a href="https://www.dvcr.fr/" target="_blank" rel="noreferrer">
                          Accéder à DVCR.fr ↗
                        </a>
                      </article>
                    </section>
                  </div>
                )}
              </>
            ) : (
              <div className="spx-empty">Sélectionne un match dans la liste pour ouvrir son dossier.</div>
            )}
          </aside>
        </div>

        {/* Panneau rétractable d'état de veille */}
        <details className="spx-sources">
          <summary>
            Veille sportive automatisée ({watch?.sources?.length || 0} sources surveillées)
            <button
              type="button"
              className="spx-btn-refresh-watch"
              disabled={watchLoading}
              onClick={e => {
                e.stopPropagation()
                loadWatch(true)
              }}
              style={{marginLeft: '1rem', fontSize: '0.75rem', padding: '2px 8px', cursor: 'pointer'}}
            >
              {watchLoading ? '⟳ Actualisation...' : '⟳ Forcer la veille'}
            </button>
            <label style={{marginLeft: '1rem', fontSize: '0.75rem', fontWeight: 'normal', cursor: 'pointer'}} onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={auto}
                onChange={e => setAuto(e.target.checked)}
                style={{marginRight: '4px'}}
              />
              Auto (5 min)
            </label>
          </summary>
          <div>
            {(watch?.sources || []).map(s => (
              <article key={s.id}>
                <header>
                  <strong>{s.label}</strong>
                  <span className={s.status === 'OK' ? 'ok' : 'bad'}>{s.status}</span>
                </header>
                <p>{s.scope}</p>
                <small>Dernière observation : {s.observedAt}</small>
                <b>{s.changed === null ? 'BASELINE' : s.changed ? 'CHANGÉ · REVUE REQUISE' : 'INCHANGÉ'}</b>
                <a href={s.url} target="_blank" rel="noreferrer">Ouvrir la source ↗</a>
              </article>
            ))}
          </div>
        </details>
      </section>
    </div>
  )
}
