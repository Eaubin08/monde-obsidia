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
  pitch?: string
}

export type Team = {
  id: string
  label: string
  tier: string
  competition: string
  fixtureCount: number
  isReal: boolean
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
  {id: 'SENIORS_R1', label: 'Seniors R1 (Fanion)', tier: 'SENIORS_POST_FORMATION', competition: 'RÉGIONAL 1 — POULE A', fixtureCount: 26, isReal: true},
  {id: 'SENIORS_R2', label: 'Seniors R2 (Réserve)', tier: 'SENIORS_POST_FORMATION', competition: 'RÉGIONAL 2 — POULE A', fixtureCount: 22, isReal: true},
  {id: 'U20_R1', label: 'U20 R1 (Développement)', tier: 'SENIORS_POST_FORMATION', competition: 'U20 RÉGIONAL 1', fixtureCount: 22, isReal: true},
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
  {id:'r1-j1',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-23',time:'16:00',home:'Marnaval SC',away:'CS Sedan Ardennes',score:'1–4',stage:'J1',venue:'EXTERIEUR',pitch:'Stade des Aciéries (Saint-Dizier)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j2',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-08-29',time:'18:30',home:'CS Sedan Ardennes',away:'FC Hettange',score:'2–0',stage:'J2',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j3',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-05',time:'15:00',home:'CS Sedan Ardennes',away:'Cormontreuil FC',score:'5–0',stage:'J3',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j4',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-09',time:'20:00',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',score:'3–1',stage:'J4',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j5',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-09-19',time:'18:00',home:'US Thionville Lusitanos 2',away:'CS Sedan Ardennes',score:'1–4',stage:'J5',venue:'EXTERIEUR',pitch:'Stade de Guentrange (Thionville)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j6',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-03',time:'18:30',home:'CS Sedan Ardennes',away:'USAG Uckange',score:'2–1',stage:'J6',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico + LeBallonRond',sourceUrl:'https://www.leballonrond.fr/edicao_calendario.php?equipa=129&fase_in=245883&id_edicao=221885'},
  {id:'r1-j7',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-17',time:'16:00',home:'Bogny FC',away:'CS Sedan Ardennes',stage:'J7',venue:'EXTERIEUR',pitch:'Stade de l’Étang (Bogny-sur-Meuse)',truth:'PUBLIC_CONFLICT_REVIEW',source:'SportCorico · discordance LeBallonRond',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Discordance d’observation : SportCorico indique samedi 17/10 16h00 tandis que LeBallonRond et annonces antérieures indiquaient dimanche ou autre horaire. Conflit conservé, revue et confirmation requises.'},
  {id:'r1-j8',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-24',time:'20:00',home:'FCF La Neuvillette Jamin',away:'CS Sedan Ardennes',stage:'J8',venue:'EXTERIEUR',pitch:'Complexe Neuvillette (Reims)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j9',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-10-31',time:'18:30',home:'CS Sedan Ardennes',away:'CSO Amnéville',stage:'J9',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j10',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-08',time:'14:30',home:'FC Saint-Méziéry',away:'CS Sedan Ardennes',stage:'J10',venue:'EXTERIEUR',pitch:'Stade Municipal (Saint-Mesmin)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j11',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-14',time:'18:30',home:'CS Sedan Ardennes',away:'RC Épernay',stage:'J11',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j12',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-11-21',time:'18:00',home:'Charleville/Prix OAM 2',away:'CS Sedan Ardennes',stage:'J12',venue:'EXTERIEUR',pitch:'Stade de la Poterie (Prix-lès-Mézières)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j13',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2026-12-05',time:'18:30',home:'CS Sedan Ardennes',away:'Stade de Reims 2',stage:'J13',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j14',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-24',time:'14:30',home:'FC Hettange',away:'CS Sedan Ardennes',stage:'J14',venue:'EXTERIEUR',pitch:'Stade Municipal (Hettange-Grande)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j15',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-01-31',time:'14:30',home:'Cormontreuil FC',away:'CS Sedan Ardennes',stage:'J15',venue:'EXTERIEUR',pitch:'Stade Bâtillat (Cormontreuil)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j16',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-07',time:'14:30',home:'CS Sedan Ardennes',away:'ES Villerupt-Thil',stage:'J16',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j17',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-20',time:'18:30',home:'CS Sedan Ardennes',away:'US Thionville Lusitanos 2',stage:'J17',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j18',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-02-28',time:'14:30',home:'USAG Uckange',away:'CS Sedan Ardennes',stage:'J18',venue:'EXTERIEUR',pitch:'Stade Municipal (Uckange)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j19',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-13',time:'18:30',home:'CS Sedan Ardennes',away:'Bogny FC',stage:'J19',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j20',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-03-20',time:'18:30',home:'CS Sedan Ardennes',away:'FCF La Neuvillette Jamin',stage:'J20',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j21',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-03',time:'18:30',home:'CSO Amnéville',away:'CS Sedan Ardennes',stage:'J21',venue:'EXTERIEUR',pitch:'Stade Municipal (Amnéville)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j22',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-10',time:'18:30',home:'CS Sedan Ardennes',away:'FC Saint-Méziéry',stage:'J22',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j23',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-04-17',time:'18:30',home:'RC Épernay',away:'CS Sedan Ardennes',stage:'J23',venue:'EXTERIEUR',pitch:'Stade Paul-Chandon (Épernay)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j24',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-01',time:'18:30',home:'CS Sedan Ardennes',away:'Charleville/Prix OAM 2',stage:'J24',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j25',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-09',time:'15:00',home:'Stade de Reims 2',away:'CS Sedan Ardennes',stage:'J25',venue:'EXTERIEUR',pitch:'Centre de Vie Kopa (Bétheny)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'r1-j26',teamId:'SENIORS_R1',competition:'RÉGIONAL 1',date:'2027-05-23',time:'15:00',home:'CS Sedan Ardennes',away:'Marnaval SC',stage:'J26',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'}
]

export const R2_MATCHES: Fixture[] = [
  {id:'r2-j1',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-08-30',time:'15:00',home:'Rethel SF',away:'CS Sedan Ardennes 2',score:'1–2',stage:'J1',venue:'EXTERIEUR',pitch:'Stade Municipal (Rethel)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j2',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-09-06',time:'15:00',home:'CS Sedan Ardennes 2',away:'Reims Murigny FP',score:'3–1',stage:'J2',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j3',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-09-13',time:'15:00',home:'AS Val de l’Aisne',away:'CS Sedan Ardennes 2',score:'0–2',stage:'J3',venue:'EXTERIEUR',pitch:'Stade Municipal (Vouziers)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j4',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-09-20',time:'15:00',home:'CS Sedan Ardennes 2',away:'ES Fagnières',score:'4–0',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j5',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-09-27',time:'15:00',home:'Reims FC Christo',away:'CS Sedan Ardennes 2',score:'1–3',stage:'J5',venue:'EXTERIEUR',pitch:'Stade des Thiolettes (Reims)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j6',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-10-04',time:'15:00',home:'Rethel SF',away:'CS Sedan Ardennes 2',score:'1–1',stage:'J6',venue:'EXTERIEUR',pitch:'Stade Municipal (Rethel)',truth:'PUBLIC_CONFLICT_REVIEW',source:'DNA (Dernières Nouvelles d’Alsace) · Miroir CSSA Association',sourceUrl:'https://cs-sedan.fr/',note:'Discordance d’observation sur l’horaire : 16h30 (Miroir CSSA 02/10) vs 15h00 (DNA 07/10). Score final vérifié : 1–1.'},
  {id:'r2-j7',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-10-18',time:'15:00',home:'CS Sedan Ardennes 2',away:'Val de l’Orne FC',stage:'J7',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j8',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-10-25',time:'15:00',home:'AS Saint-Brice-Courcelles',away:'CS Sedan Ardennes 2',stage:'J8',venue:'EXTERIEUR',pitch:'Stade Municipal (Saint-Brice)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j9',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-11-01',time:'15:00',home:'CS Sedan Ardennes 2',away:'UL Plantières',stage:'J9',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j10',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-11-15',time:'14:30',home:'US Étain-Buzy',away:'CS Sedan Ardennes 2',stage:'J10',venue:'EXTERIEUR',pitch:'Stade Municipal (Étain)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j11',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-11-22',time:'14:30',home:'CS Sedan Ardennes 2',away:'Reims Sainte-Anne 2',stage:'J11',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j12',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2026-12-06',time:'14:30',home:'CS Veymerange',away:'CS Sedan Ardennes 2',stage:'J12',venue:'EXTERIEUR',pitch:'Stade de Veymerange (Thionville)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j13',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-01-24',time:'14:30',home:'Reims Murigny FP',away:'CS Sedan Ardennes 2',stage:'J13',venue:'EXTERIEUR',pitch:'Complexe Murigny (Reims)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j14',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-01-31',time:'14:30',home:'CS Sedan Ardennes 2',away:'AS Val de l’Aisne',stage:'J14',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j15',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-02-07',time:'14:30',home:'ES Fagnières',away:'CS Sedan Ardennes 2',stage:'J15',venue:'EXTERIEUR',pitch:'Stade Municipal (Fagnières)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j16',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-02-21',time:'14:30',home:'CS Sedan Ardennes 2',away:'Reims FC Christo',stage:'J16',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j17',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-02-28',time:'14:30',home:'CS Sedan Ardennes 2',away:'Rethel SF',stage:'J17',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j18',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-03-14',time:'15:00',home:'Val de l’Orne FC',away:'CS Sedan Ardennes 2',stage:'J18',venue:'EXTERIEUR',pitch:'Stade Municipal (Moyeuvre-Grande)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j19',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-03-21',time:'15:00',home:'CS Sedan Ardennes 2',away:'AS Saint-Brice-Courcelles',stage:'J19',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j20',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-04-04',time:'15:00',home:'UL Plantières',away:'CS Sedan Ardennes 2',stage:'J20',venue:'EXTERIEUR',pitch:'Stade des Plantières (Metz)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j21',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-04-18',time:'15:00',home:'CS Sedan Ardennes 2',away:'US Étain-Buzy',stage:'J21',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'r2-j22',teamId:'SENIORS_R2',competition:'RÉGIONAL 2',date:'2027-05-02',time:'15:00',home:'Reims Sainte-Anne 2',away:'CS Sedan Ardennes 2',stage:'J22',venue:'EXTERIEUR',pitch:'Stade Robert-Pires (Reims)',truth:'SECONDARY_CORROBORATED',source:'LGEF · R2 Poule A',sourceUrl:'https://district-foot08.fff.fr/'}
]

export const U20_MATCHES: Fixture[] = [
  {id:'u20-j1',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-08-30',time:'15:00',home:'CSO Amnéville U20',away:'CS Sedan Ardennes U20',score:'2–2',stage:'J1',venue:'EXTERIEUR',pitch:'Stade Municipal (Amnéville)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j2',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-05',time:'15:00',home:'CS Sedan Ardennes U20',away:'Cormontreuil FC U20',score:'3–1',stage:'J2',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j3',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-12',time:'15:00',home:'Charleville/Prix OAM U20',away:'CS Sedan Ardennes U20',score:'1–2',stage:'J3',venue:'EXTERIEUR',pitch:'Stade de la Poterie',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j4',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-19',time:'15:00',home:'CS Sedan Ardennes U20',away:'US Thionville Lusitanos U20',score:'4–1',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j5',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-09-26',time:'15:00',home:'RC Épernay U20',away:'CS Sedan Ardennes U20',score:'0–2',stage:'J5',venue:'EXTERIEUR',pitch:'Stade Paul-Chandon',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j6',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'CS Sedan Ardennes U20',away:'Reims Sainte-Anne U20',score:'2–0',stage:'J6',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir 02/10 · LGEF (OBS_U20_R1_WEEKEND)',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement',note:'Match corroboré du 03/10/2026 (OBS_U20_R1_WEEKEND). Victoire 2-0 à domicile au complexe Montvillers.'},
  {id:'u20-j7',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-17',time:'15:00',home:'AS Nancy Lorraine 2 U20',away:'CS Sedan Ardennes U20',stage:'J7',venue:'EXTERIEUR',pitch:'Forêt de Haye (Bois-de-Haye)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j8',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-24',time:'15:00',home:'CS Sedan Ardennes U20',away:'Stade de Reims U20',stage:'J8',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j9',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-10-31',time:'15:00',home:'Bar-le-Duc FC U20',away:'CS Sedan Ardennes U20',stage:'J9',venue:'EXTERIEUR',pitch:'Stade Municipal (Bar-le-Duc)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j10',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-11-14',time:'14:30',home:'CS Sedan Ardennes U20',away:'Marnaval SC U20',stage:'J10',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j11',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-11-21',time:'14:30',home:'Bogny FC U20',away:'CS Sedan Ardennes U20',stage:'J11',venue:'EXTERIEUR',pitch:'Stade de l’Étang (Bogny)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j12',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2026-12-05',time:'14:30',home:'Chaumont FC U20',away:'CS Sedan Ardennes U20',stage:'J12',venue:'EXTERIEUR',pitch:'Stade Georges-Dodin',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j13',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-01-23',time:'14:30',home:'Cormontreuil FC U20',away:'CS Sedan Ardennes U20',stage:'J13',venue:'EXTERIEUR',pitch:'Stade Bâtillat',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j14',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-01-30',time:'14:30',home:'CS Sedan Ardennes U20',away:'Charleville/Prix OAM U20',stage:'J14',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j15',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-06',time:'14:30',home:'US Thionville Lusitanos U20',away:'CS Sedan Ardennes U20',stage:'J15',venue:'EXTERIEUR',pitch:'Stade de Guentrange',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j16',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-20',time:'14:30',home:'CS Sedan Ardennes U20',away:'RC Épernay U20',stage:'J16',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j17',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-02-27',time:'14:30',home:'Reims Sainte-Anne U20',away:'CS Sedan Ardennes U20',stage:'J17',venue:'EXTERIEUR',pitch:'Stade Robert-Pires',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j18',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-03-13',time:'15:00',home:'CS Sedan Ardennes U20',away:'AS Nancy Lorraine 2 U20',stage:'J18',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j19',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-03-20',time:'15:00',home:'Stade de Reims U20',away:'CS Sedan Ardennes U20',stage:'J19',venue:'EXTERIEUR',pitch:'Centre de Vie Kopa',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j20',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-04-03',time:'15:00',home:'CS Sedan Ardennes U20',away:'Bar-le-Duc FC U20',stage:'J20',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j21',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-04-17',time:'15:00',home:'Marnaval SC U20',away:'CS Sedan Ardennes U20',stage:'J21',venue:'EXTERIEUR',pitch:'Stade des Aciéries',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'},
  {id:'u20-j22',teamId:'U20_R1',competition:'U20 RÉGIONAL 1',date:'2027-05-01',time:'15:00',home:'CS Sedan Ardennes U20',away:'CSO Amnéville U20',stage:'J22',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'LGEF · U20 R1',sourceUrl:'https://cs-sedan.fr/groupe-de-developpement'}
]

export const YOUTH_OBSERVED_MATCHES: Fixture[] = [
  {id:'obs-u16-ocpam',teamId:'U16_R1',competition:'U16 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'CS Sedan Ardennes',away:'OCPAM',score:'1–1',stage:'J4',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'Est Républicain (ESTREP_U16_2026_10_07)',sourceUrl:'https://cs-sedan.fr/organigramme-academie',note:'Résultat corroboré par la presse régionale : match nul 1–1 contre OCPAM.'},
  {id:'obs-u15-mifa',teamId:'U15_R1',competition:'U15 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'Académie ULP MIFA',away:'CS Sedan Ardennes',score:'2–1',stage:'J4',venue:'EXTERIEUR',pitch:'Complexe Sportif MIFA',truth:'SECONDARY_CORROBORATED',source:'Le Progrès (LEPROGRES_U15_2026_10_07)',sourceUrl:'https://cs-sedan.fr/organigramme-academie',note:'Résultat corroboré : défaite 2–1 en déplacement chez MIFA.'},
  {id:'obs-u15-bazeilles',teamId:'U15_D1',competition:'DISTRICT D1',date:'2026-10-03',time:'15:30',home:'CS Sedan Ardennes',away:'Bazeilles US',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir Association · District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'obs-u17-academy',teamId:'U17_R1',competition:'U17 RÉGIONAL 1',date:'2026-10-03',time:'15:00',home:'Academy FC',away:'CS Sedan Ardennes',stage:'J4',venue:'EXTERIEUR',pitch:'Stade Municipal',truth:'SECONDARY_CORROBORATED',source:'CSSA Miroir Association · LGEF',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'obs-u13-bourg',teamId:'U13_FANION',competition:'U13 D1',date:'2026-10-03',time:'14:00',home:'FC Bourg-Rocroi',away:'CS Sedan Ardennes',stage:'J3',venue:'EXTERIEUR',pitch:'Stade de Rocroi',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'obs-u12-rethel',teamId:'U13_U12_ESPOIR',competition:'U13 D2',date:'2026-10-03',time:'14:00',home:'CS Sedan Ardennes',away:'Rethel SF Espoir',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'},
  {id:'obs-u12-trm',teamId:'U12_AVENIR',competition:'DISTRICT PHASES',date:'2026-10-03',time:'10:30',home:'CS Sedan Ardennes',away:'TRM FC',stage:'J3',venue:'DOMICILE',pitch:'Complexe Montvillers (Bazeilles)',truth:'SECONDARY_CORROBORATED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/'}
]

export const COUPE_DE_FRANCE: Fixture[] = [
  {id:'cdf-1',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-13',time:'15:00',home:'FC de Haybes',away:'CS Sedan Ardennes',score:'1–3',stage:'Tour 3',venue:'EXTERIEUR',pitch:'Stade Municipal de Haybes',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-2',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-09-26',time:'18:00',home:'CS Sedan Ardennes',away:'Reims Christo FC',score:'5–0',stage:'Tour 4',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'SECONDARY_CORROBORATED',source:'SportCorico',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027'},
  {id:'cdf-3',teamId:'SENIORS_R1',competition:'COUPE DE FRANCE',date:'2026-10-11',time:'15:00',home:'Hagondange FC',away:'CS Sedan Ardennes',score:'0–2',stage:'Tour 5',venue:'EXTERIEUR',pitch:'Stade Paul-Férot (Hagondange)',truth:'SECONDARY_CORROBORATED',source:'SportCorico · DVCR',sourceUrl:'https://www.sportcorico.com/clubs/cs-sedan-ardennes/cs-sedan-ardennes-2?season=2026-2027',note:'Match du 11/10/2026 couvert par DVCR (article d\'avant-match "Hagondange trépigne d\'impatience"). Victoire 0-2 qualifiant le CSSA.'}
]

export const ARDENNES_ARCHIVES: Fixture[] = [
  {id:'ard-senior-2026',teamId:'SENIORS_R1',competition:'COUPE ROGER MARCHE',date:'2026-04-26',time:'15:00',home:'CS Sedan Ardennes',away:'Nord Ardennes',score:'FORFAIT CSSA',stage:'Archive 2025–2026',venue:'DOMICILE',pitch:'Stade Louis-Dugauguez (Sedan)',truth:'PUBLIC_CONFIRMED',source:'District des Ardennes',sourceUrl:'https://district-foot08.fff.fr/',note:'Archive publique. Aucun match 2026–2027 n’est injecté sans source actuelle confirmée.'},
  {id:'ard-u18-2026',teamId:'U18F_R2',competition:'COUPE DES ARDENNES U18',date:'2026-05-30',time:'16:00',home:'OCPAM',away:'CS Sedan Ardennes',stage:'Archive 2025–2026',venue:'EXTERIEUR',pitch:'Terrain de Prix-lès-Mézières',truth:'PUBLIC_CORROBORATED',source:'OCPAM',sourceUrl:'https://www.ocpam.fr/',note:'Archive publique identifiée ; résultat non promu faute de source fiable dans le dataset courant.'}
]

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
      pitch: home ? 'Terrain synthétique Montvillers' : undefined,
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
  const [filter, setFilter] = useState<'all' | 'league' | 'cdf' | 'ardennes' | 'finished' | 'upcoming' | 'weekend_cur' | 'weekend_prev' | 'home' | 'away' | 'conflict'>('all')
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'dossier' | 'preparation' | 'media' | 'sources'>('dossier')
  const [showSimulated, setShowSimulated] = useState(false)

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

  const isGlobal = teamId === 'CALENDRIER_GLOBAL'
  const team = TEAMS.find(t => t.id === teamId) || TEAMS[0]

  // All club fixtures consolidated
  const allClubFixtures = useMemo<Fixture[]>(() => {
    return [
      ...R1_MATCHES,
      ...COUPE_DE_FRANCE,
      ...R2_MATCHES,
      ...U20_MATCHES,
      ...YOUTH_OBSERVED_MATCHES,
      ...ARDENNES_ARCHIVES
    ]
  }, [])

  // Fixtures construction for current selected view
  const allFixtures = useMemo<Fixture[]>(() => {
    if (isGlobal) {
      return allClubFixtures
    }
    if (team.id === 'SENIORS_R1') {
      return [...R1_MATCHES, ...COUPE_DE_FRANCE, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'SENIORS_R1')]
    }
    if (team.id === 'SENIORS_R2') {
      return [...R2_MATCHES, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'SENIORS_R2')]
    }
    if (team.id === 'U20_R1') {
      return [...U20_MATCHES, ...ARDENNES_ARCHIVES.filter(x => x.teamId === 'U20_R1')]
    }
    // Youth teams: observed matches plus simulated if enabled
    const observed = YOUTH_OBSERVED_MATCHES.filter(x => x.teamId === team.id)
    if (observed.length > 0 && !showSimulated) {
      return observed
    }
    if (showSimulated) {
      return [...observed, ...simulatedCalendar(team), ...ARDENNES_ARCHIVES.filter(x => x.teamId === team.id)]
    }
    return observed
  }, [isGlobal, team, allClubFixtures, showSimulated])

  // Pitch collision detection
  const pitchConflicts = useMemo(() => {
    return detectPitchConflicts(allClubFixtures)
  }, [allClubFixtures])

  const now = new Date('2026-10-13T12:00:00')

  const visible = useMemo(() => {
    return allFixtures.filter(f => {
      if (query && !((f.home + ' ' + f.away + ' ' + f.competition + ' ' + f.stage + ' ' + (f.pitch || '')).toLowerCase().includes(query.toLowerCase()))) {
        return false
      }
      if (filter === 'league' && !f.competition.includes('RÉGIONAL') && !f.competition.includes('REGIONAL') && !f.competition.includes('R2_') && !f.competition.includes('U')) return false
      if (filter === 'cdf' && !f.competition.includes('FRANCE')) return false
      if (filter === 'ardennes' && !f.competition.includes('ARDENNES') && !f.competition.includes('ROGER MARCHE')) return false
      if (filter === 'weekend_cur' && f.date !== '2026-10-17' && f.date !== '2026-10-18') return false
      if (filter === 'weekend_prev' && f.date !== '2026-10-03' && f.date !== '2026-10-04') return false
      if (filter === 'home' && f.venue !== 'DOMICILE') return false
      if (filter === 'away' && f.venue !== 'EXTERIEUR') return false
      if (filter === 'conflict') {
        const hasConflict = pitchConflicts.some(c => c.matches.some(m => m.id === f.id)) || f.truth === 'PUBLIC_CONFLICT_REVIEW'
        if (!hasConflict) return false
      }
      const d = new Date(f.date + 'T23:59:59')
      if (filter === 'finished' && !(f.score || d < now)) return false
      if (filter === 'upcoming' && (f.score || d < now)) return false
      return true
    }).sort((a, b) => a.date.localeCompare(b.date))
  }, [allFixtures, query, filter, now, pitchConflicts])

  // Select match
  useEffect(() => {
    if (!visible.length) {
      if (selectedId) setSelectedId('')
      return
    }
    if (!selectedId || !visible.some(x => x.id === selectedId)) {
      const defaultMatch = visible[0].id
      setSelectedId(defaultMatch)
      const currentRouteTeam = isGlobal ? 'CALENDRIER_GLOBAL' : team.id
      const url = `#cssa/sportif/${encodeURIComponent(currentRouteTeam)}/${encodeURIComponent(defaultMatch)}`
      if (location.hash !== url) location.hash = url
    }
  }, [visible, selectedId, team.id, isGlobal])

  const selected = useMemo(() => {
    return allFixtures.find(f => f.id === selectedId) || null
  }, [allFixtures, selectedId])

  // KPIs
  const finishedCount = useMemo(() => allFixtures.filter(f => f.score).length, [allFixtures])
  const upcomingCount = useMemo(() => allFixtures.filter(f => !f.score).length, [allFixtures])
  const homeCount = useMemo(() => allFixtures.filter(f => f.venue === 'DOMICILE').length, [allFixtures])
  const awayCount = useMemo(() => allFixtures.filter(f => f.venue === 'EXTERIEUR').length, [allFixtures])
  const nextMatch = useMemo(() => {
    return allFixtures
      .filter(f => !f.score && new Date(f.date + 'T23:59:59') >= now)
      .sort((a, b) => a.date.localeCompare(b.date))[0]
  }, [allFixtures, now])

  const checklistItems = [
    {key: 'convocation', label: 'Convocations envoyées & confirmées aux joueurs'},
    {key: 'transport', label: 'Transport validé (Minibus club ou déplacement personnel)'},
    {key: 'fmi', label: 'Feuille de match informatisée FMI préparée (LGEF Art. 24)'},
    {key: 'medical', label: 'Trousse médicale de terrain & défibrillateur vérifiés'},
    {key: 'equipment', label: 'Jeu de maillots officiel (Vert & Rouge / Blanc) prêt'},
    {key: 'briefing', label: 'Briefing tactique & consignes du coach finalisées'}
  ]

  const handleSelectTeam = (id: string) => {
    navigateTo(id, '')
  }

  const handleSelectMatch = (id: string) => {
    const currentRouteTeam = isGlobal ? 'CALENDRIER_GLOBAL' : team.id
    navigateTo(currentRouteTeam, id)
  }

  const handleToggleCheck = (matchId: string, key: string) => {
    const currentMatchChecks = checks[matchId] || {}
    const nextVal = !currentMatchChecks[key]
    const nextChecks = {
      ...checks,
      [matchId]: {
        ...currentMatchChecks,
        [key]: nextVal
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

  const handleAddTask = (matchId: string, customText?: string) => {
    const textToAdd = customText || newTaskText
    if (!textToAdd.trim()) return
    const newTask: MatchTask = {
      id: 'task-' + Date.now(),
      label: textToAdd.trim(),
      done: false,
      createdAt: new Date().toISOString()
    }
    const currentList = tasks[matchId] || []
    const nextTasks = {...tasks, [matchId]: [...currentList, newTask]}
    setTasks(nextTasks)
    if (!customText) setNewTaskText('')
    persistState({tasks: nextTasks})
  }

  const handleToggleTask = (matchId: string, taskId: string) => {
    const currentList = tasks[matchId] || []
    const nextTasks = {
      ...tasks,
      [matchId]: currentList.map(t => t.id === taskId ? {...t, done: !t.done} : t)
    }
    setTasks(nextTasks)
    persistState({tasks: nextTasks})
  }

  const handleDeleteTask = (matchId: string, taskId: string) => {
    const currentList = tasks[matchId] || []
    const nextTasks = {
      ...tasks,
      [matchId]: currentList.filter(t => t.id !== taskId)
    }
    setTasks(nextTasks)
    persistState({tasks: nextTasks})
  }

  const handleCreateConflictTask = (c: PitchConflict) => {
    const target = c.matches[0]
    if (target) {
      handleAddTask(target.id, `Conciliation créneau ${c.pitch} (${c.date} à ${c.time}) : accord club adverse / Footclubs`)
    }
  }

  return (
    <div className="spx">
      {/* Colonne 1 : Sélecteur d'équipes et Calendrier Global */}
      <aside className="spx-teams">
        <header className="spx-team-head">
          <div>
            <small>ORGANISATION SPORTIVE</small>
            <strong>CS Sedan Ardennes</strong>
          </div>
          <span className="spx-live-badge">R1 · R2 · U20 PRO</span>
        </header>

        {/* Bouton d'accès au Calendrier Global */}
        <div
          className={`spx-global-card ${isGlobal ? 'active' : ''}`}
          onClick={() => handleSelectTeam('CALENDRIER_GLOBAL')}
        >
          <div>
            <strong>📅 CALENDRIER GLOBAL CLUB</strong>
            <span>Consolidé multi-équipes · Terrains</span>
          </div>
          <span className="spx-team-pill count">{allClubFixtures.length}</span>
        </div>

        <nav className="spx-team-list">
          {TEAMS.map(t => (
            <button
              key={t.id}
              className={(!isGlobal && team.id === t.id) ? 'active' : ''}
              onClick={() => handleSelectTeam(t.id)}
            >
              <div>
                <strong>{t.label}</strong>
                <span>{t.tier.replace(/_/g, ' ')}</span>
              </div>
              <span className={'spx-team-pill ' + (t.isReal ? 'real' : 'sim')}>
                {t.isReal ? 'Corroboré' : 'Non raccordé'}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Colonne 2 & 3 : Calendrier & Dossier Opérationnel */}
      <section className="spx-body">
        {/* En-tête Hero */}
        <header className="spx-hero">
          <div>
            <div className="spx-breadcrumb">
              <span>CSSA</span>
              <span>/</span>
              <span>Pôle Sportif</span>
              <span>/</span>
              <strong>{isGlobal ? 'Calendrier Global du Club' : team.label}</strong>
            </div>
            <h2>{isGlobal ? 'Calendrier Global Consolidé — Toutes Équipes' : team.label}</h2>
            <p>
              {isGlobal
                ? 'Vue opérationnelle transversale des rencontres, créneaux de terrains et déplacements du CSSA.'
                : `${team.competition} · Saison 2026–2027 · Club Sportif Sedan Ardennes`}
            </p>
          </div>
          <div className="spx-kpis">
            <span>
              <b>{isGlobal ? allClubFixtures.length : team.fixtureCount}</b>
              <small>{isGlobal ? 'rencontres club' : 'matchs saison'}</small>
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

        {/* Toolbar & Filtres */}
        <div className="spx-controls">
          <div className="spx-filters">
            {isGlobal ? (
              [
                ['all', 'Tout le calendrier'],
                ['weekend_cur', 'Ce week-end (17–18 oct.)'],
                ['weekend_prev', 'Week-end passé (03–04 oct.)'],
                ['home', 'À Domicile'],
                ['away', 'À l’Extérieur'],
                ['conflict', `Conflits (${pitchConflicts.length})`]
              ].map(([id, label]) => (
                <button
                  key={id}
                  className={filter === id ? 'active' : ''}
                  onClick={() => setFilter(id as typeof filter)}
                >
                  {label}
                </button>
              ))
            ) : (
              [
                ['all', 'Tout'],
                ['league', 'Championnat'],
                ['cdf', 'Coupes'],
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
              placeholder="Adversaire, lieu, tour, terrain…"
            />
            <span className={'spx-sync-indicator ' + saveStatus}>
              {saveStatus === 'saved' ? '✓ Disque .obsidia-live' : saveStatus === 'saving' ? '⟳ Sauvegarde...' : '⚠ Local (offline)'}
            </span>
          </div>
        </div>

        {/* Barre logistique de vue globale */}
        {isGlobal && (
          <div className="spx-logistics-bar">
            <strong>LOGISTIQUE CLUB SUR CETTE SÉLECTION :</strong>
            <span>
              <b>🏟 {homeCount} à domicile</b> (Dugauguez / Montvillers · FMI obligatoire)
              <b>🚌 {awayCount} à l’extérieur</b> (Minibus & transport requis)
              <b>⚠️ {pitchConflicts.length} conflit(s) terrain</b>
            </span>
          </div>
        )}

        {/* Détection et alerte des conflits d'occupation de terrain */}
        {pitchConflicts.length > 0 && (
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
                  ➕ Créer tâche de conciliation de terrain
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Banderole de catégorie sans données réelles raccordées */}
        {!isGlobal && !team.isReal && (
          <div className="spx-unconnected-banner">
            <div>
              <strong>DONNÉES RÉELLES NON RACCORDÉES — {team.label}</strong>
              <p>Aucun flux officiel FFF / District des Ardennes n’est raccordé dans le dataset courant pour cette catégorie.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowSimulated(!showSimulated)}
            >
              {showSimulated ? 'Masquer la simulation F3E' : 'Afficher la simulation F3E'}
            </button>
          </div>
        )}

        {/* Grille principale : Calendrier (Col 2) + Dossier Match (Col 3) */}
        <div className="spx-grid">
          {/* Colonne 2 : Calendrier / Matchs */}
          <section className="spx-calendar">
            <header>
              <div>
                <small>{isGlobal ? 'PROGRAMME DU CLUB CONSOLIDÉ' : 'CALENDRIER OFFICIEL & CORROBORÉ'}</small>
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
                        {isGlobal && (
                          <span className={`spx-team-tag ${m.teamId.toLowerCase().replace('_', '')}`}>
                            {teamTag}
                          </span>
                        )}
                        <span className="spx-comp-badge">{m.competition} · {m.stage}</span>
                        <span className={'spx-venue-badge ' + m.venue?.toLowerCase()}>{m.venue}</span>
                        <span className={'spx-truth ' + (m.simulated ? 'sim' : m.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'warn' : '')}>
                          {m.truth}
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
                      <span className="spx-source-cite">Source : {m.source}</span>
                      {m.pitch && <span className="spx-pitch-tag">🏟 {m.pitch}</span>}
                      {reviewsCount(m.id, reviewed) && (
                        <span className="spx-reviewed-badge">✓ Revu staff</span>
                      )}
                    </div>
                  </article>
                )
              })}

              {!visible.length && (
                <div className="spx-empty">
                  {team.isReal || isGlobal
                    ? 'Aucun match ne correspond aux filtres appliqués.'
                    : 'Aucune donnée officielle connectée pour cette catégorie. Activez la simulation F3E pour tester les interfaces.'}
                </div>
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
                      <span className="spx-comp-badge">{selected.competition} · {selected.stage}</span>
                      <span className={'spx-venue-badge ' + selected.venue?.toLowerCase()}>{selected.venue}</span>
                      <span className={'spx-truth ' + (selected.simulated ? 'sim' : selected.truth === 'PUBLIC_CONFLICT_REVIEW' ? 'warn' : '')}>
                        {selected.truth}
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

                {/* Alerte Conflit de sources (ex: Bogny J7 ou Rethel J6) */}
                {selected.truth === 'PUBLIC_CONFLICT_REVIEW' && (
                  <div className="spx-alert warning">
                    <strong>⚠️ CONFLIT D'OBSERVATION OU DISCORDANCE ENTRE SOURCES</strong>
                    <p>{selected.note || 'Des discordances d’horaires ou de dates subsistent entre sources corroborées. Vérification requise auprès de la ligue ou du club adverse.'}</p>
                  </div>
                )}

                {/* Encadré d'identité et de logistique */}
                <div className="spx-facts">
                  <div>
                    <label>COMPÉTITION</label>
                    <span>{selected.competition}</span>
                  </div>
                  <div>
                    <label>CADRE & LOGISTIQUE</label>
                    <span>{selected.venue === 'DOMICILE' ? 'FMI requise (LGEF Art. 24)' : 'Déplacement (Transport requis)'}</span>
                  </div>
                  <div>
                    <label>TERRAIN RÉEL</label>
                    <span>{selected.pitch || 'Non précisé / à confirmer'}</span>
                  </div>
                  <div>
                    <label>ARBITRES & JOUEURS</label>
                    <span>Accès Footclubs FFF requis</span>
                  </div>
                </div>

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
                    <section className="spx-prep-section">
                      <header>
                        <h4>Checklist Opérationnelle</h4>
                        <small>Persistée sur disque (.obsidia-live)</small>
                      </header>
                      <div className="spx-checklist">
                        {checklistItems.map(item => {
                          const isChecked = Boolean(checks[selected.id]?.[item.key])
                          return (
                            <label key={item.key} className={'spx-check-item ' + (isChecked ? 'checked' : '')}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleCheck(selected.id, item.key)}
                              />
                              <span>{item.label}</span>
                            </label>
                          )
                        })}
                      </div>
                    </section>

                    {/* Tâches opérationnelles liées au match */}
                    <section className="spx-tasks-section">
                      <header>
                        <h4>Tâches Liées à la Rencontre ({(tasks[selected.id] || []).length})</h4>
                      </header>
                      <div className="spx-task-add">
                        <input
                          value={newTaskText}
                          onChange={e => setNewTaskText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleAddTask(selected.id)
                          }}
                          placeholder="Ex: Réserver minibus 9 places, contacter délégué..."
                        />
                        <button onClick={() => handleAddTask(selected.id)}>Ajouter</button>
                      </div>

                      <div className="spx-task-list">
                        {(tasks[selected.id] || []).map(task => (
                          <div key={task.id} className={'spx-task-row ' + (task.done ? 'done' : '')}>
                            <input
                              type="checkbox"
                              checked={task.done}
                              onChange={() => handleToggleTask(selected.id, task.id)}
                            />
                            <span>{task.label}</span>
                            <button
                              className="spx-task-del"
                              onClick={() => handleDeleteTask(selected.id, task.id)}
                              title="Supprimer la tâche"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        {!(tasks[selected.id] || []).length && (
                          <small className="spx-task-empty">Aucune tâche rattachée à cette rencontre.</small>
                        )}
                      </div>
                    </section>

                    {/* Notes libres du staff */}
                    <section className="spx-notes-section">
                      <header>
                        <h4>Notes & Consignes Staff</h4>
                        <small>Sauvegarde automatique</small>
                      </header>
                      <textarea
                        value={notes[selected.id] || ''}
                        onChange={e => handleNoteChange(selected.id, e.target.value)}
                        onBlur={() => handleSaveNote(selected.id)}
                        placeholder="Consignes tactiques, logistique vestiaires, consignes de sécurité, météo, etc."
                        rows={4}
                      />
                      <div className="spx-notes-foot">
                        <button onClick={() => handleSaveNote(selected.id)}>Enregistrer la note</button>
                        <label className="spx-reviewed-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(reviewed[selected.id])}
                            onChange={() => handleToggleReview(selected.id)}
                          />
                          <span>Dossier revu par le staff</span>
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
                          Suivi médiatique complet du CS Sedan Ardennes : diffusions vidéo commentées des matchs à Dugauguez et à l'extérieur, débriefs d'après-match et podcasts de supporters.
                        </p>

                        <div className="spx-media-links">
                          <a href="https://www.dvcr.fr/jour-de-match" target="_blank" rel="noreferrer" className="spx-btn-primary">
                            Accéder au direct vidéo DVCR ↗
                          </a>
                          <a href="https://www.dvcr.fr/blog" target="_blank" rel="noreferrer" className="spx-btn-secondary">
                            Lire les articles & avant-matchs ↗
                          </a>
                          <a href="https://www.dvcr.fr/podcast" target="_blank" rel="noreferrer" className="spx-btn-secondary">
                            Écouter le podcast ↗
                          </a>
                        </div>
                      </article>

                      {/* Couverture spécifique du match si applicable */}
                      <div className="spx-match-coverage">
                        <h5>Couverture médiatique identifiée pour cette rencontre :</h5>
                        {selected.competition.includes('FRANCE') && (
                          <div className="spx-article-item">
                            <span>Coupe de France</span>
                            <strong>Article DVCR : "Hagondange trépigne d'impatience"</strong>
                            <p>Avant-match complet sur le 5e tour de Coupe de France du CSSA.</p>
                          </div>
                        )}
                        {selected.truth === 'PUBLIC_CONFLICT_REVIEW' && (
                          <div className="spx-article-item warn">
                            <span>Vigilance horaire</span>
                            <strong>Chroniques Sedanaises · Suivi horaire du match</strong>
                            <p>Point de vigilance sur le coup d’envoi de la rencontre.</p>
                          </div>
                        )}
                        <div className="spx-article-item">
                          <span>Saison 2026–2027</span>
                          <strong>Débriefs & analyses vidéos DVCR</strong>
                          <p>Résumé vidéo et réactions disponibles après le coup de sifflet final.</p>
                        </div>
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
                          <strong>Ligue du Grand Est de Football (LGEF)</strong>
                          <span className="spx-badge-ok">OFFICIEL</span>
                        </header>
                        <p>Règlements R1/R2/U20 (Art. 20-7 décalages créneaux, Art. 24 FMI).</p>
                        <a href="https://lgef.fff.fr/" target="_blank" rel="noreferrer">
                          Accéder à lgef.fff.fr ↗
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

function reviewsCount(matchId: string, reviewed: Record<string, boolean>): boolean {
  return Boolean(reviewed[matchId])
}
