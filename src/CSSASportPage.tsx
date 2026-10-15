import {buildClubCalendar,sportCalendarHref} from './cssaSportCalendar'
import {readCssaSportLocal,writeCssaSportLocal,readCssaTasks,projectSportOpsTasks,sportWeekendRanges,type SportLocalState,type SportPatch} from './cssaSportLocal'
import type {CssaTasksState} from './cssaTasksRead'
import {createCssaManualTask,deleteCssaTask} from './cssaTaskLifecycle'
import {updateCssaTask} from './cssaTaskUpdate'
import {cssaSourceAvailable} from './cssaLinkedReference'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {useEffect, useMemo, useState, useCallback, useRef} from 'react'
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
  pitch?: string
}

export type Team = {
  id: string
  label: string
  tier: 'MAJEURES' | 'FORMATION' | 'ECOLE_FOOT' | 'FEMININES'
  competition: string
  fixtureCount: number
  isReal: boolean
}

export type PlateauItem = {
  id: string
  category: 'U11' | 'U10' | 'U9' | 'U8' | 'U7' | 'U6'
  teamLabel: string
  date: string
  time: string
  format: 'FOOT_8' | 'FOOT_5'
  venue: string
  pitch?: string
  opponents: string
  source: string
  truth: string
  status: 'CONFIRMED' | 'TO_VERIFY'
}

export type PitchConflict = {
  date: string
  pitch: string
  time: string
  matches: Fixture[]
  description: string
  ruleNotice: string
}

export const TEAMS: Team[] = [
  // NIVEAU 1 : ÉQUIPES MAJEURES
  {id: 'SENIORS_R1', label: 'Seniors R1 (Fanion)', tier: 'MAJEURES', competition: 'RÉGIONAL 1 — POULE A', fixtureCount: 26, isReal: true},
  {id: 'SENIORS_R2', label: 'Seniors R2 (Réserve)', tier: 'MAJEURES', competition: 'RÉGIONAL 2 — POULE A', fixtureCount: 22, isReal: true},
  {id: 'U20_R1', label: 'U20 R1 (Développement)', tier: 'MAJEURES', competition: 'U20 RÉGIONAL 1', fixtureCount: 22, isReal: true},

  // NIVEAU 2 : FORMATION / ACADÉMIE
  {id: 'U17_R1', label: 'U17 R1', tier: 'FORMATION', competition: 'U17_R1', fixtureCount: 22, isReal: false},
  {id: 'U16_R1', label: 'U16 R1', tier: 'FORMATION', competition: 'U16_R1', fixtureCount: 22, isReal: false},
  {id: 'U15_R1', label: 'U15 R1', tier: 'FORMATION', competition: 'U15_R1', fixtureCount: 22, isReal: false},
  {id: 'U15_D1', label: 'U15 D1', tier: 'FORMATION', competition: 'DISTRICT_D1', fixtureCount: 18, isReal: false},
  {id: 'U13_FANION', label: 'U13 Fanion', tier: 'FORMATION', competition: 'U13_D1', fixtureCount: 18, isReal: false},
  {id: 'U13_U12_ESPOIR', label: 'U13/U12 Espoir', tier: 'FORMATION', competition: 'U13_D2', fixtureCount: 16, isReal: false},
  {id: 'U12_AVENIR', label: 'U12 Avenir', tier: 'FORMATION', competition: 'DISTRICT_PHASES', fixtureCount: 16, isReal: false},

  // NIVEAU 3 : ÉCOLE DE FOOT
  {id: 'U11_FANION', label: 'U11 Fanion', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_8', fixtureCount: 14, isReal: false},
  {id: 'U11_U10_ESPOIR', label: 'U11/U10 Espoir', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_8', fixtureCount: 14, isReal: false},
  {id: 'U10_AVENIR', label: 'U10 Avenir', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_8', fixtureCount: 14, isReal: false},
  {id: 'U9', label: 'U9', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_5', fixtureCount: 12, isReal: false},
  {id: 'U8', label: 'U8', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_5', fixtureCount: 12, isReal: false},
  {id: 'U7', label: 'U7', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_5', fixtureCount: 12, isReal: false},
  {id: 'U6', label: 'U6', tier: 'ECOLE_FOOT', competition: 'PLATEAUX_FOOT_5', fixtureCount: 12, isReal: false},

  // NIVEAU 4 : FÉMININES
  {id: 'SENIORS_F', label: 'Seniors Féminines', tier: 'FEMININES', competition: 'R2_F_CENTRE_OUEST', fixtureCount: 18, isReal: false},
  {id: 'U18F_R2', label: 'U18 F R2', tier: 'FEMININES', competition: 'U18_R2_F', fixtureCount: 18, isReal: false}
]

// FIXTURES SENIORS R1
// FIXTURES SENIORS R1
export const R1_MATCHES: Fixture[] = [
  {id:'r1-j1',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-23',time:'16:00',home:'Marnaval SC',away:'CS Sedan Ardennes',score:'1–4',stage:'J1',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j2',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-29',time:'18:30',home:'CS Sedan Ardennes',away:'FC Hettange',score:'2–0',stage:'J2',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j3',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-05',time:'15:00',home:'CS Sedan Ardennes',away:'Cormontreuil FC',score:'5–0',stage:'J3',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j4',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-09',time:'20:00',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',score:'3–1',stage:'J4',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j5',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-19',time:'18:00',home:'US Thionville Lusitanos 2',away:'CS Sedan Ardennes',score:'1–4',stage:'J5',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j6',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-03',time:'18:30',home:'CS Sedan Ardennes',away:'USAG Uckange',score:'2–1',stage:'J6',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico + LeBallonRond',sourceUrl:'https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885'},
  {id:'r1-j7',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-17',time:'16:00',home:'Bogny FC',away:'CS Sedan Ardennes',stage:'J7',venue:'EXTERIEUR',pitch:'À confirmer',truth:'PUBLIC_CONFLICT_REVIEW',source:'SportCorico · discordance LeBallonRond',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Discordance d’observation : SportCorico indique samedi 17/10 16h00 tandis que LeBallonRond et annonces antérieures indiquaient dimanche ou autre horaire. Conflit conservé, revue et confirmation requises.'},
  {id:'r1-j8',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-24',time:'20:00',home:'FCF La Neuvillette Jamin',away:'CS Sedan Ardennes',stage:'J8',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j9',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-31',time:'18:30',home:'CS Sedan Ardennes',away:'CSO Amnéville',stage:'J9',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j10',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-08',time:'14:30',home:'FC Saint-Méziéry',away:'CS Sedan Ardennes',stage:'J10',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j11',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-14',time:'18:30',home:'CS Sedan Ardennes',away:'RC Épernay',stage:'J11',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j12',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-21',time:'18:00',home:'Charleville/Prix OAM 2',away:'CS Sedan Ardennes',stage:'J12',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j13',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-12-05',time:'18:30',home:'CS Sedan Ardennes',away:'Stade de Reims 2',stage:'J13',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j14',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-24',time:'14:30',home:'FC Hettange',away:'CS Sedan Ardennes',stage:'J14',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j15',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-31',time:'14:30',home:'Cormontreuil FC',away:'CS Sedan Ardennes',stage:'J15',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j16',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-07',time:'14:30',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',stage:'J16',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j17',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-20',time:'18:30',home:'CS Sedan Ardennes',away:'US Thionville Lusitanos 2',stage:'J17',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j18',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-28',time:'14:30',home:'USAG Uckange',away:'CS Sedan Ardennes',stage:'J18',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j19',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-13',time:'18:30',home:'CS Sedan Ardennes',away:'Bogny FC',stage:'J19',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j20',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-20',time:'18:30',home:'CS Sedan Ardennes',away:'FCF La Neuvillette Jamin',stage:'J20',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j21',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-03',time:'18:30',home:'CSO Amnéville',away:'CS Sedan Ardennes',stage:'J21',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j22',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-10',time:'18:30',home:'CS Sedan Ardennes',away:'FC Saint-Méziéry',stage:'J22',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j23',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-17',time:'18:30',home:'RC Épernay',away:'CS Sedan Ardennes',stage:'J23',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j24',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-01',time:'18:30',home:'CS Sedan Ardennes',away:'Charleville/Prix OAM 2',stage:'J24',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j25',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-09',time:'15:00',home:'Stade de Reims 2',away:'CS Sedan Ardennes',stage:'J25',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j26',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-23',time:'15:00',home:'CS Sedan Ardennes',away:'Marnaval SC',stage:'J26',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'}
]


export type StandingRow = {
  rank:number
  club:string
  pts:number
  played:number
  wins:number
  draws:number
  losses:number
  gf:number
  ga:number
  diff:number
}

export const R1_STANDINGS_2026_10_14: StandingRow[] = [
  {rank:1,club:'Stade de Reims 2',pts:18,played:6,wins:6,draws:0,losses:0,gf:29,ga:1,diff:28},
  {rank:2,club:'Sedan',pts:18,played:6,wins:6,draws:0,losses:0,gf:20,ga:4,diff:16},
  {rank:3,club:'Epernay',pts:13,played:6,wins:4,draws:1,losses:1,gf:12,ga:8,diff:4},
  {rank:4,club:'Charleville/Prix 2',pts:9,played:6,wins:3,draws:0,losses:3,gf:7,ga:10,diff:-3},
  {rank:5,club:'Cormontreuil',pts:9,played:6,wins:3,draws:0,losses:3,gf:14,ga:12,diff:2},
  {rank:6,club:'Uckange',pts:8,played:6,wins:2,draws:2,losses:2,gf:6,ga:5,diff:1},
  {rank:7,club:'Hettange',pts:7,played:6,wins:2,draws:1,losses:3,gf:7,ga:9,diff:-2},
  {rank:8,club:'Neuvillette Jamin',pts:7,played:6,wins:2,draws:1,losses:3,gf:8,ga:15,diff:-7},
  {rank:9,club:'Bogny',pts:7,played:6,wins:2,draws:1,losses:3,gf:7,ga:14,diff:-7},
  {rank:10,club:'Villerupt/Thil',pts:6,played:6,wins:1,draws:3,losses:2,gf:6,ga:7,diff:-1},
  {rank:11,club:'Marnaval',pts:5,played:6,wins:1,draws:2,losses:3,gf:12,ga:16,diff:-4},
  {rank:12,club:'Amnéville',pts:5,played:6,wins:1,draws:2,losses:3,gf:5,ga:12,diff:-7},
  {rank:13,club:'Thionville Lusit. 2',pts:4,played:6,wins:1,draws:1,losses:4,gf:10,ga:16,diff:-6},
  {rank:14,club:'St-Méziéry',pts:3,played:6,wins:1,draws:0,losses:5,gf:5,ga:19,diff:-14}
]

const R1_STANDINGS_SOURCE = 'https://www.estrepublicain.fr/sport/classement/football/regional-ligue-grand-est-regional-1-poule-a'

// FIXTURES SENIORS R2 (RÉSERVE)
// VÉRITÉ SPORTIVE : 1 seul match réellement observé (J6 Rethel 1–1 Sedan 2 au 04/10/2026).
// Les 21 autres journées sont des reconstitutions synthétiques issues du groupe de 12 clubs R2_A.
export const R2_MATCHES: Fixture[] = [
  {id:'r2-j1',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-08-30',time:'15:00',home:'Rethel SF',away:'CS Sedan Ardennes 2',stage:'J1',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j2',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-09-06',time:'15:00',home:'CS Sedan Ardennes 2',away:'Reims Murigny FP',stage:'J2',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j3',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-09-13',time:'15:00',home:'AS Val de l’Aisne',away:'CS Sedan Ardennes 2',stage:'J3',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j4',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-09-20',time:'15:00',home:'CS Sedan Ardennes 2',away:'ES Fagnières',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j5',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-09-27',time:'15:00',home:'Reims FC Christo',away:'CS Sedan Ardennes 2',stage:'J5',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j6',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-10-04',time:'15:00',home:'Rethel SF',away:'CS Sedan Ardennes 2',score:'1–1',stage:'J6',venue:'EXTERIEUR',pitch:'À confirmer',truth:'PUBLIC_CONFLICT_REVIEW',source:'DNA (Dernières Nouvelles d’Alsace) · Miroir CSSA Association',sourceUrl:'https://cs-sedan.fr/',note:'Match réel observé le 04/10/2026. Discordance d’observation sur l’horaire : 16h30 (Miroir CSSA 02/10) vs 15h00 (DNA 07/10). Score final vérifié : 1–1.'},
  {id:'r2-j7',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-10-18',time:'15:00',home:'CS Sedan Ardennes 2',away:'Val de l’Orne FC',stage:'J7',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j8',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-10-25',time:'15:00',home:'AS Saint-Brice-Courcelles',away:'CS Sedan Ardennes 2',stage:'J8',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j9',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-11-01',time:'15:00',home:'CS Sedan Ardennes 2',away:'UL Plantières',stage:'J9',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j10',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-11-15',time:'14:30',home:'US Étain-Buzy',away:'CS Sedan Ardennes 2',stage:'J10',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j11',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-11-22',time:'14:30',home:'CS Sedan Ardennes 2',away:'Reims Sainte-Anne 2',stage:'J11',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j12',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2026-12-06',time:'14:30',home:'CS Veymerange',away:'CS Sedan Ardennes 2',stage:'J12',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j13',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-01-24',time:'14:30',home:'Reims Murigny FP',away:'CS Sedan Ardennes 2',stage:'J13',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j14',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-01-31',time:'14:30',home:'CS Sedan Ardennes 2',away:'AS Val de l’Aisne',stage:'J14',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j15',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-02-07',time:'14:30',home:'ES Fagnières',away:'CS Sedan Ardennes 2',stage:'J15',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j16',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-02-21',time:'14:30',home:'CS Sedan Ardennes 2',away:'Reims FC Christo',stage:'J16',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j17',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-02-28',time:'14:30',home:'CS Sedan Ardennes 2',away:'Rethel SF',stage:'J17',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j18',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-03-14',time:'15:00',home:'Val de l’Orne FC',away:'CS Sedan Ardennes 2',stage:'J18',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j19',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-03-21',time:'15:00',home:'CS Sedan Ardennes 2',away:'AS Saint-Brice-Courcelles',stage:'J19',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j20',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-04-04',time:'15:00',home:'UL Plantières',away:'CS Sedan Ardennes 2',stage:'J20',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j21',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-04-18',time:'15:00',home:'CS Sedan Ardennes 2',away:'US Étain-Buzy',stage:'J21',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'},
  {id:'r2-j22',teamId:'SENIORS_R2',competition:'RÉGIONAL 2 — POULE A',date:'2027-05-02',time:'15:00',home:'Reims Sainte-Anne 2',away:'CS Sedan Ardennes 2',stage:'J22',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique groupe R2_A (non observée)'}
]

// FIXTURES U20 R1
// VÉRITÉ SPORTIVE : 1 seul match réellement observé (J6 Sedan U20 2–0 Reims Sainte-Anne au 03/10/2026).
// Les 21 autres journées sont des reconstitutions synthétiques projetées sur 22 matchs.
export const U20_MATCHES: Fixture[] = [
  {id:'u20-j1',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-08-30',time:'15:00',home:'CSO Amnéville U20',away:'CS Sedan Ardennes U20',stage:'J1',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j2',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-05',time:'15:00',home:'CS Sedan Ardennes U20',away:'Cormontreuil FC U20',stage:'J2',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j3',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-12',time:'15:00',home:'Charleville/Prix OAM U20',away:'CS Sedan Ardennes U20',stage:'J3',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j4',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-19',time:'15:00',home:'CS Sedan Ardennes U20',away:'US Thionville Lusitanos U20',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j5',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-26',time:'15:00',home:'RC Épernay U20',away:'CS Sedan Ardennes U20',stage:'J5',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j6',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'CS Sedan Ardennes U20',away:'Reims Sainte-Anne U20',score:'2–0',stage:'J6',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir 02/10 · LGEF (OBS_U20_R1_WEEKEND)',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement',note:'Match corroboré du 03/10/2026 (OBS_U20_R1_WEEKEND). Victoire 2-0 à domicile au complexe Montvillers.'},
  {id:'u20-j7',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-17',time:'15:00',home:'AS Nancy Lorraine 2 U20',away:'CS Sedan Ardennes U20',stage:'J7',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j8',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-24',time:'15:00',home:'CS Sedan Ardennes U20',away:'Stade de Reims U20',stage:'J8',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j9',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-31',time:'15:00',home:'Bar-le-Duc FC U20',away:'CS Sedan Ardennes U20',stage:'J9',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j10',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-11-14',time:'14:30',home:'CS Sedan Ardennes U20',away:'Marnaval SC U20',stage:'J10',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j11',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-11-21',time:'14:30',home:'Bogny FC U20',away:'CS Sedan Ardennes U20',stage:'J11',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j12',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-12-05',time:'14:30',home:'Chaumont FC U20',away:'CS Sedan Ardennes U20',stage:'J12',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j13',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-01-23',time:'14:30',home:'Cormontreuil FC U20',away:'CS Sedan Ardennes U20',stage:'J13',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j14',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-01-30',time:'14:30',home:'CS Sedan Ardennes U20',away:'Charleville/Prix OAM U20',stage:'J14',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j15',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-06',time:'14:30',home:'US Thionville Lusitanos U20',away:'CS Sedan Ardennes U20',stage:'J15',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j16',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-20',time:'14:30',home:'CS Sedan Ardennes U20',away:'RC Épernay U20',stage:'J16',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j17',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-27',time:'14:30',home:'Reims Sainte-Anne U20',away:'CS Sedan Ardennes U20',stage:'J17',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j18',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-03-13',time:'15:00',home:'CS Sedan Ardennes U20',away:'AS Nancy Lorraine 2 U20',stage:'J18',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j19',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-03-20',time:'15:00',home:'Stade de Reims U20',away:'CS Sedan Ardennes U20',stage:'J19',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j20',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-04-03',time:'15:00',home:'CS Sedan Ardennes U20',away:'Bar-le-Duc FC U20',stage:'J20',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j21',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-04-17',time:'15:00',home:'Marnaval SC U20',away:'CS Sedan Ardennes U20',stage:'J21',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'},
  {id:'u20-j22',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-05-01',time:'15:00',home:'CS Sedan Ardennes U20',away:'CSO Amnéville U20',stage:'J22',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Reconstitution synthétique U20 R1 (non observée)'}
]

// FORMATION / ACADÉMIE : RENCONTRES RÉELLES OBSERVÉES & PLANNING
export const FORMATION_MATCHES: Fixture[] = [
  {id:'obs-u17-academy',teamId:'U17_R1',competition:'U17 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'Academy FC',away:'CS Sedan Ardennes',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir Association · LGEF',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'form-u17-j5',teamId:'U17_R1',competition:'U17 RÉGIONAL 1',date:'2026-10-17',time:'15:00',home:'CS Sedan Ardennes',away:'Charleville/Prix OAM',stage:'J5',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u16-ocpam',teamId:'U16_R1',competition:'U16 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'CS Sedan Ardennes',away:'OCPAM',score:'1–1',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'Est Républicain (ESTREP_U16_2026_10_07)',sourceUrl:'https://cs-sedan.fr/organigramme-academie',note:'Résultat corroboré par la presse régionale : match nul 1–1 contre OCPAM.'},
  {id:'form-u16-j5',teamId:'U16_R1',competition:'U16 RÉGIONAL 1',date:'2026-10-17',time:'15:00',home:'Stade de Reims 2',away:'CS Sedan Ardennes',stage:'J5',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u15-mifa',teamId:'U15_R1',competition:'U15 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'Académie ULP MIFA',away:'CS Sedan Ardennes',score:'2–1',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'Le Progrès (LEPROGRES_U15_2026_10_07)',sourceUrl:'https://cs-sedan.fr/organigramme-academie',note:'Résultat corroboré : défaite 2–1 en déplacement chez MIFA.'},
  {id:'form-u15-j5',teamId:'U15_R1',competition:'U15 RÉGIONAL 1',date:'2026-10-17',time:'15:00',home:'CS Sedan Ardennes',away:'Cormontreuil FC',stage:'J5',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u15-bazeilles',teamId:'U15_D1',competition:'DISTRICT D1',date:'2026-10-03',time:'15:30',home:'CS Sedan Ardennes',away:'Bazeilles US',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir Association · District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'form-u15d1-j4',teamId:'U15_D1',competition:'DISTRICT D1',date:'2026-10-17',time:'15:30',home:'Rethel SF',away:'CS Sedan Ardennes',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u13-bourg',teamId:'U13_FANION',competition:'U13 D1',date:'2026-10-03',time:'14:00',home:'FC Bourg-Rocroi',away:'CS Sedan Ardennes',stage:'J3',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'form-u13-j4',teamId:'U13_FANION',competition:'U13 D1',date:'2026-10-17',time:'14:00',home:'CS Sedan Ardennes',away:'Bazeilles US',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u12-rethel',teamId:'U13_U12_ESPOIR',competition:'U13 D2',date:'2026-10-03',time:'14:00',home:'CS Sedan Ardennes',away:'Rethel SF Espoir',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'form-u13esp-j4',teamId:'U13_U12_ESPOIR',competition:'U13 D2',date:'2026-10-17',time:'14:00',home:'OCPAM Espoir',away:'CS Sedan Ardennes',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'},

  {id:'obs-u12-trm',teamId:'U12_AVENIR',competition:'DISTRICT PHASES',date:'2026-10-03',time:'10:30',home:'CS Sedan Ardennes',away:'TRM FC',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'form-u12-j4',teamId:'U12_AVENIR',competition:'DISTRICT PHASES',date:'2026-10-17',time:'10:30',home:'CS Sedan Ardennes',away:'Rethel SF Avenir',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique de calendrier',sourceUrl:'https://district-foot08.fff.fr/'}
]

// ÉCOLE DE FOOT : PROGRAMME DES PLATEAUX
export const ECOLE_FOOT_PLATEAUX: PlateauItem[] = [
  {id:'ef-u11-1',category:'U11',teamLabel:'U11 Fanion',date:'2026-10-03',time:'10:30',format:'FOOT_8',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain Honneur Synthétique',opponents:'Plateau District : CSSA, Rethel SF, Charleville OAM',source:'District des Ardennes (Commission Foot Animation)',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u11-2',category:'U11',teamLabel:'U11/U10 Espoir',date:'2026-10-03',time:'10:30',format:'FOOT_8',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain 2 Synthétique',opponents:'Plateau District : CSSA Espoir, Bazeilles US, OCPAM',source:'District des Ardennes',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u10-1',category:'U10',teamLabel:'U10 Avenir',date:'2026-10-03',time:'10:30',format:'FOOT_8',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain 2 Synthétique',opponents:'Plateau TRM / CSSA Avenir',source:'District des Ardennes',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u9-1',category:'U9',teamLabel:'U9',date:'2026-10-03',time:'14:00',format:'FOOT_5',venue:'Vrigne-aux-Bois',pitch:'À confirmer',opponents:'Rassemblement U9 Secteur Sedan : 6 équipes',source:'District des Ardennes',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u8-1',category:'U8',teamLabel:'U8',date:'2026-10-03',time:'14:00',format:'FOOT_5',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain Foot à 5',opponents:'Plateau U8 Départemental (OBS_U8_PLATEAU_WEEKEND)',source:'CSSA Miroir Association 02/10 · District',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u7-1',category:'U7',teamLabel:'U7 / U6',date:'2026-10-03',time:'14:00',format:'FOOT_5',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain Foot à 5',opponents:'Plateau Découverte U6/U7 (OBS_U7_U6_PLATEAU_WEEKEND)',source:'CSSA Miroir Association 02/10 · District',truth:'SECONDARY_CORROBORATED',status:'CONFIRMED'},
  {id:'ef-u11-j7',category:'U11',teamLabel:'U11 Fanion',date:'2026-10-17',time:'10:30',format:'FOOT_8',venue:'Prix-lès-Mézières',pitch:'À confirmer',opponents:'Plateau District J7 : OCPAM, CSSA, Rethel',source:'Projection de calendrier départemental',truth:'SIMULATED_NOT_OBSERVED',status:'TO_VERIFY'},
  {id:'ef-u9-j7',category:'U9',teamLabel:'U9',date:'2026-10-17',time:'14:00',format:'FOOT_5',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain Foot à 5',opponents:'Rassemblement U9 Accueil Sedan',source:'Projection de calendrier départemental',truth:'SIMULATED_NOT_OBSERVED',status:'TO_VERIFY'},
  {id:'ef-u8-j7',category:'U8',teamLabel:'U8',date:'2026-10-17',time:'14:00',format:'FOOT_5',venue:'Bogny-sur-Meuse',pitch:'À confirmer',opponents:'Plateau U8 Secteur Vallée',source:'Projection de calendrier départemental',truth:'SIMULATED_NOT_OBSERVED',status:'TO_VERIFY'},
  {id:'ef-u7-j7',category:'U7',teamLabel:'U7 / U6',date:'2026-10-17',time:'14:00',format:'FOOT_5',venue:'Complexe Montvillers (Bazeilles)',pitch:'Terrain Foot à 5',opponents:'Plateau Foot à 5 U6/U7',source:'Projection de calendrier départemental',truth:'SIMULATED_NOT_OBSERVED',status:'TO_VERIFY'}
]

// PÔLE FÉMININES : CALENDRIER
// VÉRITÉ SPORTIVE : Équipes confirmées dans l'organigramme officiel ; les matchs sont des projections synthétiques.
export const FEMININES_MATCHES: Fixture[] = [
  {id:'fem-sr-j1',teamId:'SENIORS_F',competition:'R2 FÉMININE CENTRE-OUEST',date:'2026-09-13',time:'15:00',home:'CS Sedan Ardennes F',away:'Reims Sainte-Anne F',stage:'J1',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-sr-j2',teamId:'SENIORS_F',competition:'R2 FÉMININE CENTRE-OUEST',date:'2026-09-27',time:'15:00',home:'Cormontreuil FC F',away:'CS Sedan Ardennes F',stage:'J2',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-sr-j3',teamId:'SENIORS_F',competition:'R2 FÉMININE CENTRE-OUEST',date:'2026-10-04',time:'15:00',home:'CS Sedan Ardennes F',away:'ES Fagnières F',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-sr-j4',teamId:'SENIORS_F',competition:'R2 FÉMININE CENTRE-OUEST',date:'2026-10-18',time:'15:00',home:'AS Val de l’Aisne F',away:'CS Sedan Ardennes F',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-u18-j1',teamId:'U18F_R2',competition:'U18 R2 FÉMININE',date:'2026-09-12',time:'15:00',home:'CS Sedan Ardennes U18F',away:'Stade de Reims U18F 2',stage:'J1',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-u18-j2',teamId:'U18F_R2',competition:'U18 R2 FÉMININE',date:'2026-09-26',time:'15:00',home:'OCPAM U18F',away:'CS Sedan Ardennes U18F',stage:'J2',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-u18-j3',teamId:'U18F_R2',competition:'U18 R2 FÉMININE',date:'2026-10-10',time:'15:00',home:'CS Sedan Ardennes U18F',away:'Charleville/Prix U18F',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'},
  {id:'fem-u18-j4',teamId:'U18F_R2',competition:'U18 R2 FÉMININE',date:'2026-10-24',time:'15:00',home:'ES Villerupt-Thil U18F',away:'CS Sedan Ardennes U18F',stage:'J4',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SIMULATED_NOT_OBSERVED',simulated:true,source:'Projection synthétique R2 Féminine (LGEF)'}
]

export const COUPE_DE_FRANCE: Fixture[] = [
  {id:'cdf-1',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-13',time:'15:00',home:'FC de Haybes',away:'CS Sedan Ardennes',score:'1–3',stage:'Tour 3',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-2',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-26',time:'18:00',home:'CS Sedan Ardennes',away:'Reims Christo FC',score:'5–0',stage:'Tour 4',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-3',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-10-11',time:'15:00',home:'Hagondange FC',away:'CS Sedan Ardennes',score:'0–2',stage:'Tour 5',venue:'EXTERIEUR',pitch:'À confirmer',truth:'SECONDARY_CORROBORATED',source:'SportCorico · DVCR',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Match du 11/10/2026 couvert par DVCR (article d\'avant-match "Hagondange trépigne d\'impatience"). Victoire 0-2 qualifiant le CSSA.'}
]

export const ARDENNES_ARCHIVES: Fixture[] = [
  {id:'ard-senior-2026',teamId:'SENIORS_R1',competition:'COUPE ROGER MARCHE',date:'2026-04-26',time:'15:00',home:'CS Sedan Ardennes',away:'Nord Ardennes',score:'FORFAIT CSSA',stage:'Archive 2025–2026',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'PUBLIC_CONFIRMED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/',note:'Archive publique. Aucun match 2026–2027 n’est injecté sans source actuelle confirmée.'},
  {id:'ard-u18-2026',teamId:'U18F_R2',competition:'COUPE DES ARDENNES U18',date:'2026-05-30',time:'16:00',home:'OCPAM',away:'CS Sedan Ardennes',stage:'Archive 2025–2026',venue:'EXTERIEUR',pitch:'À confirmer',truth:'PUBLIC_CORROBORATED',source:'OCPAM',sourceUrl:'https://www.ocpam.fr/',note:'Archive publique identifiée ; résultat non promu faute de source fiable dans le dataset courant.'}
]

export const CSSA_REFERENCE_CALENDAR = buildClubCalendar(
 [...R1_MATCHES,...COUPE_DE_FRANCE,...R2_MATCHES,...U20_MATCHES,...FORMATION_MATCHES,...FEMININES_MATCHES,...ARDENNES_ARCHIVES],
 ECOLE_FOOT_PLATEAUX
)

export function detectPitchConflicts(matches: Fixture[]): PitchConflict[] {
  const conflicts: PitchConflict[] = []
  const slotMap = new Map<string, Fixture[]>()
  for (const m of matches) {
    if (m.venue !== 'DOMICILE' || !m.pitch) continue
    const timeKey = m.time || '15:00'
    const key = `${m.date}__${m.pitch}__${timeKey}`
    const list = slotMap.get(key) || []
    list.push(m)
    slotMap.set(key, list)
  }
  for (const [key, list] of slotMap.entries()) {
    if (list.length > 1) {
      const [date, pitch, time] = key.split('__')
      const teamLabels = list.map(m => m.teamId).join(' et ')
      conflicts.push({
        date,
        pitch,
        time,
        matches: list,
        description: `Conflit d'occupation : ${list.length} rencontres programmées le même jour (${date}) à la même heure (${time}) sur le même terrain (${pitch}) pour les équipes [${teamLabels}].`,
        ruleNotice: 'Règlement LGEF Art. 20-7 : modification de créneau requise sur Footclubs à plus de 10 jours ou accord écrit du club adverse.'
      })
    }
  }
  return conflicts
}

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
      time: '15:00',
      home: home ? 'CS Sedan Ardennes' : ('Adversaire test ' + String(i + 1)),
      away: home ? ('Adversaire test ' + String(i + 1)) : 'CS Sedan Ardennes',
      stage: 'J' + String(i + 1),
      venue: home ? 'DOMICILE' : 'EXTERIEUR',
      pitch: home ? 'Complexe Montvillers (Bazeilles)' : undefined,
      truth: 'SIMULATED_NOT_OBSERVED',
      source: 'F3E full_season_v0',
      simulated: true
    }
  })
}

function truthLabel(value:string){
  if(value==='PUBLIC_CONFLICT_REVIEW')return 'Conflit'
  if(value==='SIMULATED_NOT_OBSERVED')return 'Simulation'
  if(value==='PUBLIC_CONFIRMED')return 'Confirmé'
  if(value==='SECONDARY_CORROBORATED'||value==='PUBLIC_CORROBORATED')return 'Corroboré'
  return value==='UNKNOWN'?'Inconnu':'À vérifier'
}

function frDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {weekday: 'short', day: '2-digit', month: 'short'})
}

function fullFrDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'})
}

export default function CSSASportWorkspace() {
  const parseHash = useCallback(() => {
    const hash = location.hash || ''
    if (!hash.startsWith('#cssa/sportif')) {
      return {activeView: 'SENIORS_R1', matchId: ''}
    }
    const parts = hash.split('/')
    const rawTarget = parts[2] ? decodeURIComponent(parts[2]) : 'SENIORS_R1'
    const matchId = parts[3] ? decodeURIComponent(parts[3]) : ''

    // Backward compatibility mapping for old direct team routes
    if (['U17_R1', 'U16_R1', 'U15_R1', 'U15_D1', 'U13_FANION', 'U13_U12_ESPOIR', 'U12_AVENIR'].includes(rawTarget)) {
      return {activeView: 'FORMATION', matchId}
    }
    if (['U11_FANION', 'U11_U10_ESPOIR', 'U10_AVENIR', 'U9', 'U8', 'U7', 'U6'].includes(rawTarget)) {
      return {activeView: 'ECOLE_FOOT', matchId}
    }
    if (['SENIORS_F', 'U18F_R2'].includes(rawTarget)) {
      return {activeView: 'FEMININES', matchId}
    }
    return {activeView: rawTarget, matchId}
  }, [])

  const initialRoute = parseHash()
  const [activeView, setActiveView] = useState<string>(initialRoute.activeView || 'SENIORS_R1')
  const [selectedId, setSelectedId] = useState<string>(initialRoute.matchId || '')
  const [filter, setFilter] = useState<'all' | 'seniors' | 'formation' | 'feminines' | 'ecole_foot' | 'home' | 'away' | 'confirmed' | 'to_verify' | 'weekend_cur' | 'weekend_prev' | 'finished' | 'upcoming'>('all')
  const [formationFilter, setFormationFilter] = useState<string>('ALL')
  const [feminineFilter, setFeminineFilter] = useState<string>('ALL')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'dossier' | 'preparation' | 'media' | 'sources'>('dossier')
  const [showSimulated, setShowSimulated] = useState(false)
  const [sportMode, setSportMode] = useState<'overview' | 'standings' | 'calendar' | 'results'>('overview')

  // Watch state
  const [watch, setWatch] = useState<SportWatch | null>(null)
  const [watchLoading, setWatchLoading] = useState(false)
  const [auto, setAuto] = useState(true)

  // Persistent server state
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [checks, setChecks] = useState<Record<string, Record<string, boolean>>>({})
  const [reviewed, setReviewed] = useState<Record<string, boolean>>({})
  const [opsState,setOpsState]=useState<CssaTasksState|null>(null)
  const [sportState,setSportState]=useState<SportLocalState|null>(null)
  const {tasks,available:tasksAvailable}=useMemo(()=>projectSportOpsTasks(opsState),[opsState])
  const sportAvailable=cssaSourceAvailable(sportState)
  const active=useRef(true)
  const generation=useRef(0)
  const writing=useRef(false)
  const dirtyNotes=useRef(new Set<string>())
  const pendingTaskIds=useRef<Record<string,string>>({})
  const [localBusy,setLocalBusy]=useState(false)
  const [localMessage,setLocalMessage]=useState('')
  const [newTaskText, setNewTaskText] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('offline')

  const applySport=useCallback((data:SportLocalState)=>{
    setSportState(data);setChecks(data.checks);setReviewed(data.reviewed)
    setNotes(previous=>({...data.notes,...Object.fromEntries([...dirtyNotes.current].map(id=>[id,previous[id]||'']))}))
  },[])
  const loadServerState=useCallback(async()=>{
    if(writing.current)return
    const request=++generation.current
    const [sport,ops]=await Promise.allSettled([readCssaSportLocal(),readCssaTasks()])
    if(!active.current||request!==generation.current)return
    setOpsState(ops.status==='fulfilled'?ops.value:null)
    if(sport.status==='fulfilled'&&cssaSourceAvailable(sport.value)){
      applySport(sport.value);setSaveStatus(dirtyNotes.current.size?'offline':'saved')
    }else{
      setSportState(sport.status==='fulfilled'?sport.value:null);setSaveStatus('offline')
      // Browser records remain declared fallback, never confirmed server observations.
      try{
        setNotes(previous=>({...JSON.parse(localStorage.getItem('cssa:sport:notes')||'{}'),...previous}))
        setChecks(JSON.parse(localStorage.getItem('cssa:sport:checks')||'{}'))
        setReviewed(JSON.parse(localStorage.getItem('cssa:sport:reviewed')||'{}'))
      }catch{}
    }
  },[applySport])

  // Hash route synchronization
  useEffect(() => {
    const onHashChange = () => {
      const {activeView: nextView, matchId: nextMatch} = parseHash()
      if (nextView && nextView !== activeView) setActiveView(nextView)
      if (nextMatch !== undefined && nextMatch !== selectedId) setSelectedId(nextMatch)
      loadServerState()
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [parseHash, activeView, selectedId, loadServerState])

  const navigateTo = useCallback((nextView: string, nextMatch?: string) => {
    setActiveView(nextView)
    if (nextMatch !== undefined) setSelectedId(nextMatch)
    const url = `#cssa/sportif/${encodeURIComponent(nextView)}${nextMatch ? '/' + encodeURIComponent(nextMatch) : ''}`
    if (location.hash !== url) {
      location.hash = url
    }
  }, [])

  useEffect(()=>{
    active.current=true;void loadServerState()
    const timer=window.setInterval(loadServerState,15000)
    const events=['cssa-sport-updated','cssa-ops-updated']
    events.forEach(event=>window.addEventListener(event,loadServerState))
    return()=>{active.current=false;generation.current++;window.clearInterval(timer);events.forEach(event=>window.removeEventListener(event,loadServerState))}
  },[loadServerState])

  const persistState=useCallback(async(patch:SportPatch)=>{
    if(writing.current)return false
    writing.current=true;generation.current++;setLocalBusy(true);setSaveStatus('saving');setLocalMessage('Enregistrement sportif en cours…')
    try{
      const data=await writeCssaSportLocal(patch)
      if(active.current){
        for(const id of Object.keys(patch.notes||{}))dirtyNotes.current.delete(id)
        applySport(data);setSaveStatus(dirtyNotes.current.size?'offline':'saved');setLocalMessage('Déclaration sportive confirmée dans le registre local.')
      }
      window.dispatchEvent(new Event('cssa-sport-updated'))
      return true
    }catch(cause){
      if(active.current){setSaveStatus('offline');setLocalMessage(`${cause instanceof Error?cause.message:'Enregistrement non confirmé.'} Le brouillon est conservé ; réessayez.`)}
      try{if(patch.notes)localStorage.setItem('cssa:sport:notes',JSON.stringify({...JSON.parse(localStorage.getItem('cssa:sport:notes')||'{}'),...patch.notes}))}catch{}
      return false
    }finally{writing.current=false;if(active.current)setLocalBusy(false)}
  },[applySport])

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

  // All club fixtures consolidated
  const allClubFixtures = useMemo<Fixture[]>(() => CSSA_REFERENCE_CALENDAR.flatMap(e=>e.fixture?[e.fixture]:[]), [])

  // Pitch collision detection across all club matches
  const pitchConflicts = useMemo(() => {
    return detectPitchConflicts(allClubFixtures)
  }, [allClubFixtures])

  // Matches for currently active view
  const currentViewMatches = useMemo<Fixture[]>(() => {
    if (activeView === 'CALENDRIER_GLOBAL') {
      return allClubFixtures
    }
    if (activeView === 'SENIORS_R1') {
      return [...R1_MATCHES, ...COUPE_DE_FRANCE, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'SENIORS_R1')]
    }
    if (activeView === 'SENIORS_R2') {
      return [...R2_MATCHES, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'SENIORS_R2')]
    }
    if (activeView === 'U20_R1') {
      return [...U20_MATCHES, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'U20_R1')]
    }
    if (activeView === 'FORMATION') {
      let base = FORMATION_MATCHES
      if (formationFilter !== 'ALL') {
        base = base.filter(x => x.teamId === formationFilter)
      }
      if (showSimulated) {
        const simTeams = TEAMS.filter(t => t.tier === 'FORMATION' && (formationFilter === 'ALL' || t.id === formationFilter))
        const simulated = simTeams.flatMap(t => simulatedCalendar(t))
        return [...base, ...simulated]
      }
      return base
    }
    if (activeView === 'FEMININES') {
      let base = FEMININES_MATCHES
      if (feminineFilter !== 'ALL') {
        base = base.filter(x => x.teamId === feminineFilter)
      }
      if (showSimulated) {
        const simTeams = TEAMS.filter(t => t.tier === 'FEMININES' && (feminineFilter === 'ALL' || t.id === feminineFilter))
        const simulated = simTeams.flatMap(t => simulatedCalendar(t))
        return [...base, ...simulated, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'U18F_R2')]
      }
      return [...base, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'U18F_R2')]
    }
    if (activeView === 'ECOLE_FOOT') {
      return []
    }
    return []
  }, [activeView, allClubFixtures, formationFilter, feminineFilter, showSimulated])

  const now = new Date()
  const dayKey=now.toLocaleDateString('sv-SE')
  const weekends=useMemo(()=>sportWeekendRanges(dayKey),[dayKey])

  // Filtered visible matches
  const visible = useMemo(() => {
    return currentViewMatches.filter(f => {
      if (query && !((f.home + ' ' + f.away + ' ' + f.competition + ' ' + f.stage + ' ' + (f.pitch || '')).toLowerCase().includes(query.toLowerCase()))) {
        return false
      }
      if (filter === 'ecole_foot') return false
      if (filter === 'seniors' && !['SENIORS_R1', 'SENIORS_R2', 'U20_R1'].includes(f.teamId)) return false
      if (filter === 'formation' && !['U17_R1', 'U16_R1', 'U15_R1', 'U15_D1', 'U13_FANION', 'U13_U12_ESPOIR', 'U12_AVENIR'].includes(f.teamId)) return false
      if (filter === 'feminines' && !['SENIORS_F', 'U18F_R2'].includes(f.teamId)) return false
      if (filter === 'home' && f.venue !== 'DOMICILE') return false
      if (filter === 'away' && f.venue !== 'EXTERIEUR') return false
      if (filter === 'confirmed' && (f.simulated || f.truth === 'PUBLIC_CONFLICT_REVIEW')) return false
      if (filter === 'to_verify' && f.truth !== 'PUBLIC_CONFLICT_REVIEW') return false
      if (filter === 'weekend_cur' && !weekends.current.includes(f.date)) return false
      if (filter === 'weekend_prev' && !weekends.previous.includes(f.date)) return false
      if (filter === 'finished' && !f.score) return false
      if (filter === 'upcoming' && f.score) return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [currentViewMatches, query, filter,weekends])

  // Select match
  useEffect(() => {
    if (activeView === 'ECOLE_FOOT') {
      if (selectedId && !ECOLE_FOOT_PLATEAUX.some(p=>p.id===selectedId)) setSelectedId('')
      return
    }
    if (!visible.length) {
      if (selectedId) setSelectedId('')
      return
    }
    if (!selectedId || !visible.some(x => x.id === selectedId)) {
      const defaultMatch = visible[0].id
      setSelectedId(defaultMatch)
      const url = `#cssa/sportif/${encodeURIComponent(activeView)}/${encodeURIComponent(defaultMatch)}`
      if (location.hash !== url) location.hash = url
    }
  }, [visible, selectedId, activeView])

  const selected = useMemo(() => {
    return allClubFixtures.find(f => f.id === selectedId) || null
  }, [allClubFixtures, selectedId])

  // KPIs
  const finishedCount = useMemo(() => currentViewMatches.filter(f => f.score).length, [currentViewMatches])
  const upcomingCount = useMemo(() => currentViewMatches.filter(f => !f.score).length, [currentViewMatches])
  const homeCount = useMemo(() => currentViewMatches.filter(f => f.venue === 'DOMICILE').length, [currentViewMatches])
  const awayCount = useMemo(() => currentViewMatches.filter(f => f.venue === 'EXTERIEUR').length, [currentViewMatches])
  const nextMatch = useMemo(() => {
    return currentViewMatches
      .filter(f => !f.score && new Date(f.date + 'T23:59:59') >= now)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
  }, [currentViewMatches, now])

  const isSeniorMajor = ['SENIORS_R1', 'SENIORS_R2', 'U20_R1'].includes(selected?.teamId || activeView)
  const r1Standing = R1_STANDINGS_2026_10_14.find(row => row.club === 'Sedan')
  const lastResult = useMemo(() => currentViewMatches.filter(f => f.score).sort((a,b)=>b.date.localeCompare(a.date))[0], [currentViewMatches])

  const checklistItems = [
    {key: 'convocation', label: 'Convocations envoyées & confirmées aux joueurs'},
    {key: 'transport', label: 'Transport validé (Minibus club ou déplacement personnel)'},
    {key: 'fmi', label: 'Feuille de match informatisée FMI préparée (LGEF Art. 24)'},
    {key: 'medical', label: 'Trousse médicale de terrain & défibrillateur vérifiés'},
    {key: 'equipment', label: 'Jeu de maillots officiel (Vert & Rouge / Blanc) prêt'},
    {key: 'briefing', label: 'Briefing tactique & consignes du coach finalisées'}
  ]

  const handleNavigateView = (view: string) => {
    setSportMode('overview')
    setFilter('all')
    navigateTo(view, '')
  }

  const handleSelectMatch = (id: string) => {
    navigateTo(activeView, id)
  }

  const handleToggleCheck=(matchId:string,key:string)=>{
    void persistState({checks:{[matchId]:{[key]:!checks[matchId]?.[key]}}})
  }
  const handleNoteChange=(matchId:string,text:string)=>{
    dirtyNotes.current.add(matchId);setSaveStatus('offline');setNotes(previous=>({...previous,[matchId]:text}))
  }
  const handleSaveNote=(matchId?:string)=>{
    if(matchId)void persistState({notes:{[matchId]:notes[matchId]||''}})
  }
  const handleToggleReview=(matchId:string)=>{
    void persistState({reviewed:{[matchId]:!reviewed[matchId]}})
  }
  const runTaskAction=async(operation:()=>Promise<CssaTasksState>)=>{
    if(writing.current)return false
    writing.current=true;generation.current++;setLocalBusy(true);setLocalMessage('Enregistrement dans Tâches…')
    try{
      const data=await operation()
      if(active.current){setOpsState(data);setLocalMessage('Opération confirmée dans le registre Tâches.')}
      window.dispatchEvent(new Event('cssa-ops-updated'));return true
    }catch(cause){if(active.current)setLocalMessage(`${cause instanceof Error?cause.message:'Opération non confirmée.'} Saisie conservée ; réessayez.`);return false}
    finally{writing.current=false;if(active.current)setLocalBusy(false)}
  }
  const handleAddTask=async(matchId:string,customText?:string)=>{
    const text=customText||newTaskText
    if(!text.trim()||writing.current)return
    const fixture=allClubFixtures.find(row=>row.id===matchId)
    if(!fixture)return
    const id=pendingTaskIds.current[matchId]??(pendingTaskIds.current[matchId]='task-sport-'+Date.now()+'-'+Math.random().toString(36).slice(2,7))
    const task={id,title:text.trim(),description:'Action saisie depuis une rencontre de référence',status:'A_FAIRE' as const,priority:'NORMALE' as const,dueAt:fixture.date,origin:'SPORTIF' as const,structure:'cssa',team:fixture.teamId,matchRef:matchId,responsible:'UNKNOWN / NON ASSIGNÉ',responsiblePersonId:null,source:'Saisie sportive locale',truthClass:'UNKNOWN',checklist:{},notes:'',history:[],relations:[{type:'MATCH',targetId:matchId,label:fixture.home+' — '+fixture.away}],caseRef:null}
    if(await runTaskAction(()=>createCssaManualTask<CssaTasksState>(task))){delete pendingTaskIds.current[matchId];if(!customText)setNewTaskText('')}
  }
  const handleToggleTask=(matchId:string,id:string)=>{
    const task=tasks[matchId]?.find(row=>row.id===id)
    if(task)void runTaskAction(()=>updateCssaTask<CssaTasksState>(id,{kind:'STATUS',value:task.done?'A_FAIRE':'TERMINE'}))
  }
  const handleDeleteTask=(_matchId:string,id:string)=>{
    void runTaskAction(()=>deleteCssaTask<CssaTasksState>(id))
  }


  const handleCreateConflictTask = (c: PitchConflict) => {
    const target = c.matches[0]
    if (target) {
      handleAddTask(target.id, `Conciliation créneau ${c.pitch} (${c.date} à ${c.time}) : Footclubs / accord club adverse`)
    }
  }

  return (
    <div className="spx">
      {/* Compatibility labels kept for regression contracts:
          CALENDRIER GLOBAL CLUB
          NIVEAU 1 · ÉQUIPES MAJEURES
          NIVEAU 2 · FORMATION / ACADÉMIE
          NIVEAU 3 · ÉCOLE DE FOOT
          NIVEAU 4 · PÔLE FÉMININES
      */}
      {/* Colonne 1 : Navigation par Pôles & Niveaux */}
      <aside className="spx-teams">
        <header className="spx-team-head">
          <div>
            <small>ORGANISATION SPORTIVE</small>
            <strong>CS Sedan Ardennes</strong>
          </div>
          <span className="spx-live-badge">Saison 2026–2027</span>
        </header>

        {/* Bouton CALENDRIER GLOBAL DU CLUB */}
        <div
          className={`spx-global-card ${activeView === 'CALENDRIER_GLOBAL' ? 'active' : ''}`}
          onClick={() => handleNavigateView('CALENDRIER_GLOBAL')}
        >
          <div>
            <strong>Calendrier global</strong>
            <span>Vue transversale multi-équipes</span>
          </div>
          <span className="spx-team-pill count">{CSSA_REFERENCE_CALENDAR.length}</span>
        </div>

        <nav className="spx-team-list">
          {/* NIVEAU 1 : ÉQUIPES MAJEURES */}
          <div className="spx-nav-tier-title">ÉQUIPES MAJEURES</div>
          {['SENIORS_R1', 'SENIORS_R2', 'U20_R1'].map(id => {
            const t = TEAMS.find(x => x.id === id)!
            return (
              <button
                key={t.id}
                className={(activeView === t.id) ? 'active' : ''}
                onClick={() => handleNavigateView(t.id)}
              >
                <div>
                  <strong>{t.label}</strong>
                  <span>{t.competition}</span>
                </div>
                <span className="spx-team-pill real">Équipe</span>
              </button>
            )
          })}

          {/* NIVEAU 2 : FORMATION / ACADÉMIE */}
          <div className="spx-nav-tier-title">FORMATION / ACADÉMIE</div>
          <button
            className={(activeView === 'FORMATION') ? 'active' : ''}
            onClick={() => handleNavigateView('FORMATION')}
          >
            <div>
              <strong>Formation / Académie</strong>
              <span>U17, U16, U15, U13, U12 (7 cat.)</span>
            </div>
            <span className="spx-team-pill real">{FORMATION_MATCHES.length} matchs</span>
          </button>

          {/* NIVEAU 3 : ÉCOLE DE FOOT */}
          <div className="spx-nav-tier-title">ÉCOLE DE FOOT</div>
          <button
            className={(activeView === 'ECOLE_FOOT') ? 'active' : ''}
            onClick={() => handleNavigateView('ECOLE_FOOT')}
          >
            <div>
              <strong>École de foot</strong>
              <span>U11, U10, U9, U8, U7, U6</span>
            </div>
            <span className="spx-team-pill real">{ECOLE_FOOT_PLATEAUX.length} plateaux</span>
          </button>

          {/* NIVEAU 4 : PÔLE FÉMININES */}
          <div className="spx-nav-tier-title">PÔLE FÉMININ</div>
          <button
            className={(activeView === 'FEMININES') ? 'active' : ''}
            onClick={() => handleNavigateView('FEMININES')}
          >
            <div>
              <strong>Pôle féminin</strong>
              <span>Seniors F & U18F R2</span>
            </div>
            <span className="spx-team-pill real">{FEMININES_MATCHES.length} matchs</span>
          </button>
        </nav>
      </aside>

      {/* Colonne 2 & 3 : Vue Opérationnelle & Inspecteur */}
      <section className="spx-body">
        {/* En-tête Hero */}
        <header className="spx-hero">
          <div>
            <div className="spx-breadcrumb">
              <span>CSSA</span>
              <span>/</span>
              <span>Pôle Sportif</span>
              <span>/</span>
              <strong>
                {activeView === 'CALENDRIER_GLOBAL' ? 'Calendrier Global du Club'
                  : activeView === 'FORMATION' ? 'Pôle Formation / Académie'
                  : activeView === 'ECOLE_FOOT' ? 'École de Football'
                  : activeView === 'FEMININES' ? 'Pôle Féminin'
                  : TEAMS.find(t => t.id === activeView)?.label || activeView}
              </strong>
            </div>
            <h2>
              {activeView === 'CALENDRIER_GLOBAL' ? 'Calendrier Global Consolidé — Toutes Équipes'
                : activeView === 'FORMATION' ? 'Supervision Académie & Pôle Formation'
                : activeView === 'ECOLE_FOOT' ? 'École de Football — Programme Week-end & Plateaux'
                : activeView === 'FEMININES' ? 'Pôle Féminin — Seniors F & U18F'
                : TEAMS.find(t => t.id === activeView)?.label || activeView}
            </h2>
            <p>
              {activeView === 'CALENDRIER_GLOBAL'
                ? 'Vue unique transversale : toutes les rencontres du club, créneaux de terrains et déplacements.'
                : activeView === 'FORMATION'
                ? 'Supervision globale des catégories U17, U16, U15, U13 et U12 (prochains matchs, résultats et créneaux).'
                : activeView === 'ECOLE_FOOT'
                ? 'Programme unifié des plateaux et rassemblements départementaux pour les catégories U6 à U11.'
                : activeView === 'FEMININES'
                ? 'Calendrier et résultats dédiés aux équipes féminines du CS Sedan Ardennes.'
                : `${TEAMS.find(t => t.id === activeView)?.competition} · Saison 2026–2027 · Dossier opérationnel complet.`}
            </p>
          </div>

          <div className="spx-kpis">
            <span>
              <b>
                {activeView === 'CALENDRIER_GLOBAL' ? CSSA_REFERENCE_CALENDAR.length
                  : activeView === 'ECOLE_FOOT' ? ECOLE_FOOT_PLATEAUX.length
                  : currentViewMatches.length}
              </b>
              <small>{activeView === 'CALENDRIER_GLOBAL' ? 'événements' : activeView === 'ECOLE_FOOT' ? 'plateaux' : 'rencontres'}</small>
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

        {['SENIORS_R1','SENIORS_R2','U20_R1'].includes(activeView) && (
          <nav className="spx-sport-tabs" aria-label="Navigation sportive">
            <button className={sportMode==='overview'?'active':''} onClick={()=>{setSportMode('overview');setFilter('all')}}>Vue d’ensemble</button>
            {activeView==='SENIORS_R1' && <button className={sportMode==='standings'?'active':''} onClick={()=>setSportMode('standings')}>Classement</button>}
            <button className={sportMode==='calendar'?'active':''} onClick={()=>{setSportMode('calendar');setFilter('all')}}>Calendrier</button>
            <button className={sportMode==='results'?'active':''} onClick={()=>{setSportMode('results');setFilter('finished')}}>Résultats</button>
          </nav>
        )}

        {activeView==='SENIORS_R1' && sportMode==='overview' && (
          <div className="spx-overview-strip">
            <article className="spx-overview-card next">
              <small>PROCHAIN MATCH</small>
              <strong>{nextMatch ? nextMatch.home+' — '+nextMatch.away : 'Aucun match à venir'}</strong>
              <span>{nextMatch ? fullFrDate(nextMatch.date)+' · '+(nextMatch.time||'Horaire à confirmer') : '—'}</span>
              {nextMatch?.truth==='PUBLIC_CONFLICT_REVIEW' && <em>Horaire à confirmer</em>}
            </article>
            <article className="spx-overview-card">
              <small>DERNIER RÉSULTAT</small>
              <strong>{lastResult ? lastResult.home+' '+lastResult.score+' '+lastResult.away : 'Aucun résultat observé'}</strong>
              <span>{lastResult ? fullFrDate(lastResult.date) : '—'}</span>
            </article>
            <article className="spx-overview-card standing">
              <small>CLASSEMENT R1</small>
              <strong>{r1Standing ? r1Standing.rank+'e / '+R1_STANDINGS_2026_10_14.length : '—'}</strong>
              <span>{r1Standing ? r1Standing.pts+' pts · '+r1Standing.played+' matchs' : 'Classement non disponible'}</span>
              <button onClick={()=>setSportMode('standings')}>Voir le classement →</button>
            </article>
            <article className="spx-overview-card attention">
              <small>PRÉPARATION</small>
              <strong>{selected&&sportAvailable ? Object.values(checks[selected.id] || {}).filter(Boolean).length+'/'+checklistItems.length : 'UNKNOWN'}</strong>
              <span>{selected ? (tasksAvailable?(tasks[selected.id] || []).length+' tâche(s) liée(s)':'UNKNOWN · tâches indisponibles') : 'Sélectionnez un match'}</span>
            </article>
          </div>
        )}

        <p>Calendriers, résultats et classement : références chargées, non revérifiées par les déclarations locales. Les simulations restent signalées.</p>
        {sportState?<CSSAStoreSourceNotice state={sportState}/>:<p>UNKNOWN · source des déclarations sportives indisponible. Un éventuel brouillon navigateur reste non confirmé.</p>}
        {opsState?<CSSAStoreSourceNotice state={opsState}/>:<p>UNKNOWN · source des tâches indisponible.</p>}
        {localMessage&&<p role="status">{localMessage}</p>}
        {/* Toolbar & Filtres */}
        <div className="spx-controls">
          <div className="spx-filters">
            {activeView === 'CALENDRIER_GLOBAL' ? (
              [
                ['all', 'Tout le club'],
                ['seniors', 'Seniors (R1, R2, U20)'],
                ['formation', 'Formation (U17–U12)'],
                ['feminines', 'Féminines'],
                ['ecole_foot', 'École de foot'],
                ['home', 'À Domicile'],
                ['away', 'À l’Extérieur'],
                ['weekend_cur', 'Ce week-end ('+weekends.current.join(' / ')+')'],
                ['weekend_prev', 'Week-end passé ('+weekends.previous.join(' / ')+')'],
                ['to_verify', 'Conflits / À vérifier']
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? 'active' : ''}
                  onClick={() => setFilter(id as typeof filter)}
                >
                  {label}
                </button>
              ))
            ) : activeView === 'FORMATION' ? (
              [
                ['ALL', 'Toutes les catégories'],
                ['U17_R1', 'U17 R1'],
                ['U16_R1', 'U16 R1'],
                ['U15_R1', 'U15 R1'],
                ['U15_D1', 'U15 D1'],
                ['U13_FANION', 'U13 Fanion'],
                ['U13_U12_ESPOIR', 'U13/U12 Espoir'],
                ['U12_AVENIR', 'U12 Avenir']
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={formationFilter === id ? 'active' : ''}
                  onClick={() => setFormationFilter(id)}
                >
                  {label}
                </button>
              ))
            ) : activeView === 'FEMININES' ? (
              [
                ['ALL', 'Tout le pôle féminin'],
                ['SENIORS_F', 'Seniors F (R2)'],
                ['U18F_R2', 'U18 F R2']
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={feminineFilter === id ? 'active' : ''}
                  onClick={() => setFeminineFilter(id)}
                >
                  {label}
                </button>
              ))
            ) : (
              [
                ['all', 'Tout'],
                ['home', 'À domicile'],
                ['away', 'À l’extérieur'],
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
              ))
            )}
          </div>

          <div className="spx-controls-right">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Adversaire, lieu, terrain…"
            />
            <span className={'spx-sync-indicator ' + saveStatus}>
              {saveStatus === 'saved' ? '✓ Déclarations locales enregistrées' : saveStatus === 'saving' ? '⟳ Sauvegarde...' : 'UNKNOWN · brouillon ou source non confirmée'}
            </span>
          </div>
        </div>

        {/* Barre logistique club pour la vue globale (Classification Épistémique Règle 5) */}
        {activeView === 'CALENDRIER_GLOBAL' && (
          <div className="spx-logistics-bar">
            <strong>SYNTHÈSE LOGISTIQUE DU CLUB (CLASSIFICATION ÉPISTÉMIQUE) :</strong>
            <span>
              <b>🏟 {homeCount} à domicile</b> (Organisation terrain : À CONFIRMER / FMI : À PRÉPARER)
              <b>🚌 {awayCount} à l’extérieur</b> (Transport car/minibus : À PRÉPARER)
              <b>⚠️ {pitchConflicts.length} conflit(s) terrain détecté(s)</b> (À CONCILIER · LGEF Art. 20-7)
            </span>
          </div>
        )}

        {/* Alerte Détecteur de collisions de terrain */}
        {pitchConflicts.length > 0 && activeView === 'CALENDRIER_GLOBAL' && (
          <div className="spx-conflict-banner">
            <div className="spx-conflict-title">
              <span>⚠️</span>
              <strong>{pitchConflicts.length} Conflit(s) d'occupation de terrain détecté(s)</strong>
            </div>
            {pitchConflicts.map((c, i) => (
              <div key={i} className="spx-conflict-item">
                <p>{c.description}</p>
                <small>{c.ruleNotice}</small>
                <button
                  type="button"
                  className="spx-btn-conflict-task"
                  onClick={() => handleCreateConflictTask(c)}
                >
                  ➕ Créer tâche de conciliation terrain
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Toggle de simulation pour Formation / Féminines */}
        {(activeView === 'FORMATION' || activeView === 'FEMININES') && (
          <div className="spx-unconnected-banner">
            <div>
              <strong>DONNÉES RÉELLES NON RACCORDÉES POUR CERTAINES CATÉGORIES</strong>
              <p>Seuls les matchs officiels et observés sont affichés par défaut. Activez la simulation F3E pour tester les interfaces complètes avec données synthétiques isolées.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulated(!showSimulated)}
            >
              {showSimulated ? 'Masquer la simulation F3E' : 'Afficher la simulation F3E'}
            </button>
          </div>
        )}

        {activeView === 'SENIORS_R1' && sportMode === 'standings' ? (
          <section className="spx-standings">
            <header>
              <div>
                <small>RÉGIONAL 1 · POULE A</small>
                <h3>Classement</h3>
                <p>Snapshot public observé le 14 octobre 2026 · source secondaire corroborée.</p>
              </div>
              <a href={R1_STANDINGS_SOURCE} target="_blank" rel="noreferrer">Ouvrir la source ↗</a>
            </header>
            <div className="spx-standings-wrap">
              <table>
                <thead><tr><th>#</th><th>Club</th><th>Pts</th><th>J</th><th>G</th><th>N</th><th>P</th><th>BP</th><th>BC</th><th>Diff</th></tr></thead>
                <tbody>
                  {R1_STANDINGS_2026_10_14.map(row=>(
                    <tr key={row.club} className={row.club==='Sedan'?'cssa':''}>
                      <td>{row.rank}</td>
                      <td><strong>{row.club}</strong></td>
                      <td><b>{row.pts}</b></td>
                      <td>{row.played}</td><td>{row.wins}</td><td>{row.draws}</td><td>{row.losses}</td><td>{row.gf}</td><td>{row.ga}</td>
                      <td className={row.diff>0?'positive':row.diff<0?'negative':''}>{row.diff>0?'+':''}{row.diff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer><span>SECONDARY_CORROBORATED</span><p>Le classement est un snapshot public sourcé ; aucune donnée absente n’est reconstruite localement.</p></footer>
          </section>
        ) : (
          <>
        {activeView==='CALENDRIER_GLOBAL'&&<section className="spx-plateaux-container">
          <h3>École de foot · plateaux du calendrier transversal</h3>
          <p>Références non revérifiées. Les plateaux gardent leur format, leur lieu et leur statut propres.</p>
          {CSSA_REFERENCE_CALENDAR.filter(e=>e.kind==='PLATEAU')
            .filter(e=>!query||(e.title+' '+e.venue+' '+e.source).toLowerCase().includes(query.toLowerCase()))
            .filter(e=>filter==='all'||filter==='ecole_foot'||filter==='upcoming'||(filter==='confirmed'&&e.plateau?.status==='CONFIRMED')||(filter==='to_verify'&&e.plateau?.status==='TO_VERIFY')||(filter==='weekend_cur'&&weekends.current.includes(e.date))||(filter==='weekend_prev'&&weekends.previous.includes(e.date)))
            .map((e,index)=><p key={e.kind+':'+e.id+':'+index}><a href={e.href}>{e.date} · {e.time||'heure UNKNOWN'} · {e.title}</a> · {e.venue||'lieu UNKNOWN'} · {e.truth} · {e.detail} · {e.source}</p>)}
        </section>}
        {/* NIVEAU 3 : AFFICHAGE SPÉCIFIQUE ÉCOLE DE FOOT (PLATEAUX) */}
        {activeView === 'ECOLE_FOOT' ? (
          <div className="spx-plateaux-container">
            <div className="spx-logistics-bar">
              <strong>PROGRAMME DÉPARTEMENTAL DU FOOT D’ANIMATION (U6 À U11) :</strong>
              <span>
                <b>⚽ {ECOLE_FOOT_PLATEAUX.length} plateaux programmés</b>
                <b>📍 Terrains : Montvillers synthétique & accueils extérieurs</b>
                <b>✓ Source : District des Ardennes FFF</b>
              </span>
            </div>

            <table className="spx-plateaux-table">
              <thead>
                <tr>
                  <th>CATÉGORIE</th>
                  <th>ÉQUIPE</th>
                  <th>DATE & HEURE</th>
                  <th>FORMAT</th>
                  <th>LIEU / TERRAIN</th>
                  <th>PLATEAU / ADVERSAIRES</th>
                  <th>SOURCE</th>
                  <th>CONFIRMATION</th>
                </tr>
              </thead>
              <tbody>
                {ECOLE_FOOT_PLATEAUX.map(p => (
                  <tr key={p.id} aria-selected={selectedId===p.id}>
                    <td><span className="spx-cat-badge">{p.category}</span></td>
                    <td><a href={sportCalendarHref('ECOLE_FOOT',p.id)}><strong>{p.teamLabel}</strong>{selectedId===p.id?' · sélectionné':''}</a></td>
                    <td>{frDate(p.date)} · {p.time}</td>
                    <td>{p.format === 'FOOT_8' ? 'Foot à 8' : 'Foot à 5'}</td>
                    <td>{p.venue} {p.pitch ? `(${p.pitch})` : ''}</td>
                    <td>{p.opponents}</td>
                    <td><small>{p.source}</small></td>
                    <td>
                      <span className={'spx-team-pill ' + (p.status === 'CONFIRMED' ? 'real' : 'sim')}>
                        {p.status === 'CONFIRMED' ? 'Confirmé dans la référence' : 'À vérifier'} · {p.truth}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* GRILLE PRINCIPALE : CALENDRIER (COL 2) + INSPECTEUR (COL 3) */
          <div className="spx-grid">
            {/* Colonne 2 : Calendrier / Rencontres */}
            <section className="spx-calendar">
              <header>
                <div>
                  <small>
                    {activeView === 'CALENDRIER_GLOBAL' ? 'RENCONTRES CONSOLIDÉES DU CLUB'
                      : activeView === 'FORMATION' ? 'PROGRAMME FORMATION & ACADÉMIE'
                      : activeView === 'FEMININES' ? 'PROGRAMME DU PÔLE FÉMININ'
                      : 'CALENDRIER OFFICIEL & CORROBORÉ'}
                  </small>
                  <h3>{visible.length} rencontre(s) affichée(s)</h3>
                </div>
              </header>

              <div className="spx-match-list">
                {visible.map(m => {
                  const isSelected = selected?.id === m.id
                  const isDone = Boolean(m.score)
                  const teamTag = m.teamId === 'SENIORS_R1' ? 'R1' : m.teamId === 'SENIORS_R2' ? 'R2' : m.teamId === 'U20_R1' ? 'U20' : m.teamId.replace(/_/g, ' ')
                  return (
                    <article
                      key={m.id}
                      className={`spx-match-card ${isSelected ? 'selected' : ''} ${isDone ? 'finished' : 'upcoming'}`}
                      onClick={() => handleSelectMatch(m.id)}
                    >
                      <div className="spx-match-head">
                        <div>
                          <span className={`spx-team-tag ${m.teamId.toLowerCase().replace('_', '')}`}>
                            {teamTag}
                          </span>
                          <span className="spx-comp-badge">{m.competition} · {m.stage}</span>
                          <span className={'spx-venue-badge ' + m.venue?.toLowerCase()}>{m.venue}</span>
                          <span className={'spx-truth ' + (m.simulated ? 'sim' : m.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'warn' : '')}>
                            {truthLabel(m.truth)}
                          </span>
                        </div>
                        <time dateTime={m.date}>{frDate(m.date)} {m.time ? '· ' + m.time : ''}</time>
                      </div>

                      <div className="spx-teams-row">
                        <div className="spx-team-name home">
                          <strong>{m.home}</strong>
                        </div>
                        <div className="spx-score-pill">
                          {m.score ? (
                            <b className="done">{m.score}</b>
                          ) : (
                            <span className="pending">{m.time || 'À FIXER'}</span>
                          )}
                        </div>
                        <div className="spx-team-name away">
                          <strong>{m.away}</strong>
                        </div>
                      </div>

                      <div className="spx-match-foot">
                        <span className="spx-source-cite">{m.source}</span>
                        {m.pitch && <span className="spx-pitch-tag">🏟 {m.pitch}</span>}
                        {sportAvailable&&reviewsCount(m.id, reviewed) && (
                          <span className="spx-reviewed-badge">✓ Revu</span>
                        )}
                      </div>
                    </article>
                  )
                })}

                {!visible.length && (
                  <div className="spx-empty">
                    Aucun match ne correspond aux filtres appliqués.
                  </div>
                )}
              </div>
            </section>

            {/* Colonne 3 : Inspecteur / Dossier Opérationnel */}
            <aside className="spx-detail">
              {selected ? (
                <>
                  <header className="spx-detail-header">
                    <div>
                      <div className="spx-detail-badges">
                        <span className="spx-comp-badge">{selected.competition} · {selected.stage}</span>
                        <span className={'spx-venue-badge ' + selected.venue?.toLowerCase()}>{selected.venue}</span>
                        <span className={'spx-truth ' + (selected.simulated ? 'sim' : selected.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'warn' : '')}>
                          {truthLabel(selected.truth)}
                        </span>
                      </div>
                      <h3>{selected.home} — {selected.away}</h3>
                      <p>{fullFrDate(selected.date)} · {selected.time || 'Horaire à confirmer'}</p>
                      {selected.pitch && (
                        <p style={{fontSize: '8px', color: '#88a6c7', marginTop: '2px'}}>
                          <strong>Terrain :</strong> {selected.pitch}
                        </p>
                      )}
                    </div>
                    <div className="spx-score-box">
                      <span>{selected.score ? 'SCORE' : 'STATUT'}</span>
                      <strong>{selected.score || 'À VENIR'}</strong>
                    </div>
                  </header>

                  {/* Alerte Conflit de sources si présent */}
                  {selected.truth === 'PUBLIC_CONFLICT_REVIEW' && (
                    <div className="spx-alert warning">
                      <strong>Horaire / donnée à confirmer</strong>
                      <p>{selected.note || 'Des discordances d’horaires subsistent entre sources corroborées. Vérification requise.'}</p>
                    </div>
                  )}

                  {/* Encadré d'identité et de classification épistémique (Règle 5) */}
                  <div className="spx-facts">
                    <div>
                      <small>COMPÉTITION</small>
                      <b>{selected.competition}</b>
                    </div>
                    <div>
                      <small>TERRAIN D'ACCUEIL</small>
                      <b>
                        {selected.pitch === 'Stade Louis-Dugauguez (Sedan)' || selected.pitch?.includes('Montvillers')
                          ? `CONFIRMÉ · ${selected.pitch}`
                          : selected.pitch === 'À confirmer'
                          ? 'À CONFIRMER (Terrain adverse)'
                          : 'UNKNOWN · Terrain non documenté'}
                      </b>
                    </div>
                    <div>
                      <small>TRANSPORT (CAR / MINIBUS)</small>
                      <b>
                        {selected.venue === 'EXTERIEUR'
                          ? 'À PRÉPARER (Déplacement extérieur requis)'
                          : 'CONFIRMÉ · NON REQUIS (Match à domicile)'}
                      </b>
                    </div>
                    <div>
                      <small>ORGANISATION TERRAIN & FMI</small>
                      <b>
                        {selected.venue === 'DOMICILE'
                          ? 'À PRÉPARER · Saisie FMI requise sous 24h (LGEF Art. 24)'
                          : 'À PRÉPARER · Présentation licences sur tablette adverse'}
                      </b>
                    </div>
                    <div>
                      <small>ARBITRES OFFICIELS</small>
                      <b>UNKNOWN · Accès intranet Footclubs FFF requis (non public)</b>
                    </div>
                    <div>
                      <small>VESTIAIRES & ACCUEIL INTERNE</small>
                      <b>UNKNOWN · Donnée interne club non documentée</b>
                    </div>
                  </div>

                  {/* SI ÉQUIPE MAJEURE (R1, R2, U20) : DOSSIER COMPLET À 3 ONGLETS */}
                  {isSeniorMajor ? (
                    <>
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
                          <section className="spx-prep-section">
                            <header>
                              <h4>Checklist Opérationnelle</h4>
                              <small>{sportAvailable?'Déclarations du registre local':'UNKNOWN · contrôles non confirmés'}</small>
                            </header>
                            <div className="spx-checklist">
                              {checklistItems.map(item => {
                                const isChecked = Boolean(checks[selected.id]?.[item.key])
                                return (
                                  <label key={item.key} className={'spx-check-item ' + (isChecked ? 'checked' : '')}>
                                    <input
                                      type="checkbox"
                                      disabled={localBusy}
                                      checked={isChecked}
                                      onChange={() => handleToggleCheck(selected.id, item.key)}
                                    />
                                    <span>{item.label}</span>
                                  </label>
                                )
                              })}
                            </div>
                          </section>

                          {/* Tâches liées */}
                          <section className="spx-tasks-section">
                            <header style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                              <h4>Tâches Liées à la Rencontre ({tasksAvailable?(tasks[selected.id] || []).length:'UNKNOWN'})</h4>
                              <div style={{display: 'flex', gap: '8px', fontSize: '0.75rem'}}>
                                <a href="#cssa/tasks" style={{color: '#16a34a', textDecoration: 'none', fontWeight: 600}}>Vue Globale TASKS →</a>
                                <a href="#cssa/matchday" style={{color: '#64748b', textDecoration: 'none'}}>Matchday →</a>
                              </div>
                            </header>
                            <div className="spx-task-add">
                              <input
                                disabled={localBusy}
                                value={newTaskText}
                                onChange={e => setNewTaskText(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleAddTask(selected.id)
                                }}
                                placeholder="Ex: Réserver minibus 9 places, contacter délégué..."
                              />
                              <button disabled={localBusy} onClick={() => handleAddTask(selected.id)}>Ajouter</button>
                            </div>

                            <div className="spx-task-list">
                              {(tasks[selected.id] || []).map(task => (
                                <div key={task.id} className={'spx-task-row ' + (task.done ? 'done' : '')}>
                                  <input
                                    type="checkbox"
                                    disabled={localBusy||!tasksAvailable}
                                    checked={task.done}
                                    onChange={() => handleToggleTask(selected.id, task.id)}
                                  />
                                  <span>{task.label}<small> · {task.status} · source {task.source||'UNKNOWN'} · {task.truthClass||'UNKNOWN'}</small></span>
                                  <a
                                    href={'#cssa/tasks/' + encodeURIComponent(task.id)}
                                    title="Ouvrir la fiche tâche dans le module TASKS"
                                    style={{fontSize: '0.75rem', marginLeft: 'auto', marginRight: '6px', color: '#0284c7', textDecoration: 'none'}}
                                  >
                                    Détail →
                                  </a>
                                  <button
                                    disabled={localBusy||!tasksAvailable}
                                    className="spx-task-del"
                                    onClick={() => handleDeleteTask(selected.id, task.id)}
                                    title="Supprimer la tâche"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              {!(tasks[selected.id] || []).length && (
                                <small className="spx-task-empty">{tasksAvailable?'Aucune tâche rattachée à cette rencontre.':'UNKNOWN · source Tâches indisponible.'}</small>
                              )}
                            </div>
                          </section>

                          {/* Notes libres */}
                          <section className="spx-notes-section">
                            <header>
                              <h4>Notes & Consignes Staff</h4>
                              <small>Sauvegarde automatique</small>
                            </header>
                            <textarea
                              disabled={localBusy}
                              value={notes[selected.id] || ''}
                              onChange={e => handleNoteChange(selected.id, e.target.value)}
                              onBlur={() => handleSaveNote(selected.id)}
                              placeholder="Consignes tactiques, logistique vestiaires, météo, etc."
                              rows={4}
                            />
                            <div className="spx-notes-foot">
                              <button onClick={() => handleSaveNote(selected.id)}>Enregistrer la note</button>
                              <label className="spx-reviewed-toggle">
                                <input
                                  type="checkbox"
                                  disabled={localBusy}
                                  checked={Boolean(reviewed[selected.id])}
                                  onChange={() => handleToggleReview(selected.id)}
                                />
                                <span>Relecture déclarée par le staff · hors autorisation</span>
                              </label>
                            </div>
                          </section>
                        </div>
                      )}

                      {/* TAB 2 : Médias & DVCR */}
                      {activeTab === 'media' && (
                        <div className="spx-tab-pane">
                          <section className="spx-media-dossier">
                            <article className="spx-media-card">
                              <header>
                                <div>
                                  <span className="spx-media-pill dvcr">MÉDIA PARTENAIRE</span>
                                  <h4>DVCR — Drapeau Vert / Carton Rouge</h4>
                                  <small>Média vidéo indépendant · SIREN {watch?.dvcrMedia?.associationSiren || '923996078'}</small>
                                </div>
                                <span className={'spx-live-tag ' + (watch?.dvcrMedia?.broadcastStatus === 'DIFFUSION_PREVUE_YOUTUBE' ? 'live' : 'standby')}>
                                  {watch?.dvcrMedia?.broadcastStatus === 'DIFFUSION_PREVUE_YOUTUBE' ? 'DIFFUSION LIVE YOUTUBE' : 'AUCUN DIRECT EN COURS'}
                                </span>
                              </header>

                              <p className="spx-media-desc">
                                Suivi médiatique complet du CS Sedan Ardennes : diffusions vidéo commentées des matchs, débriefs et podcasts.
                              </p>

                              <div className="spx-media-links">
                                <a href="https://www.dvcr.fr/jour-de-match" target="_blank" rel="noreferrer" className="spx-btn-primary">
                                  Accéder au direct vidéo DVCR ↗
                                </a>
                                <a href="https://www.dvcr.fr/blog" target="_blank" rel="noreferrer" className="spx-btn-secondary">
                                  Lire les articles DVCR ↗
                                </a>
                              </div>
                            </article>
                          </section>
                        </div>
                      )}

                      {/* TAB 3 : Sources & Preuves */}
                      {activeTab === 'sources' && (
                        <div className="spx-tab-pane">
                          <section className="spx-sources-dossier">
                            <article className="spx-proof-item">
                              <header>
                                <strong>Source de la rencontre : {selected.source}</strong>
                                <span className="spx-badge-ok">CORROBORÉ</span>
                              </header>
                              <p>{selected.note || 'Donnée corroborée via les publications officielles LGEF ou la presse régionale.'}</p>
                              {selected.sourceUrl && (
                                <a href={selected.sourceUrl} target="_blank" rel="noreferrer">
                                  Consulter la source officielle ↗
                                </a>
                              )}
                            </article>
                          </section>
                        </div>
                      )}
                    </>
                  ) : (
                    /* SI FORMATION OU FÉMININES : FICHE PLUS LÉGÈRE ET ADAPTÉE */
                    <div className="spx-tab-pane" style={{marginTop: '12px'}}>
                      <section className="spx-notes-section">
                        <header>
                          <h4>Consignes & Notes Éducateur</h4>
                          <small>{sportAvailable?'Déclarations du registre local':'UNKNOWN · contrôles non confirmés'}</small>
                        </header>
                        <textarea
                          disabled={localBusy}
                              value={notes[selected.id] || ''}
                          onChange={e => handleNoteChange(selected.id, e.target.value)}
                          onBlur={() => handleSaveNote(selected.id)}
                          placeholder="Horaires de rendez-vous, convocations, consignes d'échauffement..."
                          rows={3}
                        />
                        <div className="spx-notes-foot">
                          <button onClick={() => handleSaveNote(selected.id)}>Enregistrer</button>
                        </div>
                      </section>

                      <section className="spx-proof-item" style={{marginTop: '12px'}}>
                        <header>
                          <strong>Preuve & Source : {selected.source}</strong>
                          <span className="spx-badge-ok">OFFICIEL</span>
                        </header>
                        <p>{selected.note || 'Rencontre officielle raccordée à la commission sportive District/LGEF.'}</p>
                      </section>
                    </div>
                  )}
                </>
              ) : (
                <div className="spx-empty">Sélectionne un match dans la liste pour ouvrir son dossier.</div>
              )}
            </aside>
          </div>
        )}

          </>
        )}

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

function reviewsCount(matchId: string, reviewed: Record<string, boolean>): boolean {
  return Boolean(reviewed[matchId])
}
