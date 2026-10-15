import type {Fixture,PlateauItem} from './CSSASportPage'

export type ClubCalendarEvent = {
 id:string;kind:'MATCH'|'PLATEAU';date:string;time:string|null;title:string;competition:string
 venue:string|null;source:string;sourceUrl?:string;truth:string;detail:string;href:string
 fixture?:Fixture;plateau?:PlateauItem
}
const formation=new Set(['U17_R1','U16_R1','U15_R1','U15_D1','U13_FANION','U13_U12_ESPOIR','U12_AVENIR'])
export function sportCalendarHref(view:string,id:string){
 return '#cssa/sportif/'+encodeURIComponent(view)+'/'+encodeURIComponent(id)
}
// Keep each source row, including conflicting rows. A projection never confirms an event.
export function buildClubCalendar(fixtures:Fixture[],plateaux:PlateauItem[]):ClubCalendarEvent[]{
 return [
  ...fixtures.filter(f=>!f.simulated).map<ClubCalendarEvent>(f=>({
   id:f.id,kind:'MATCH',date:f.date,time:f.time,title:f.home+' — '+f.away,
   competition:f.competition,venue:f.venue??null,source:f.source,sourceUrl:f.sourceUrl,truth:f.truth,
   detail:[f.stage,f.note].filter(Boolean).join(' · '),fixture:f,
   href:sportCalendarHref(formation.has(f.teamId)?'FORMATION':['SENIORS_F','U18F_R2'].includes(f.teamId)?'FEMININES':f.teamId,f.id)
  })),
  ...plateaux.map<ClubCalendarEvent>(p=>({
   id:p.id,kind:'PLATEAU',date:p.date,time:p.time||null,title:p.teamLabel+' · '+p.opponents,
   competition:p.format,venue:p.venue||null,source:p.source,truth:p.truth,detail:p.status,plateau:p,
   href:sportCalendarHref('ECOLE_FOOT',p.id)
  }))
 ].sort(compareCalendarEvents)
}
export function compareCalendarEvents(a:ClubCalendarEvent,b:ClubCalendarEvent){
 // Unknown times remain unknown and appear after timed events on the same date.
 return a.date.localeCompare(b.date)||(a.time||'99:99').localeCompare(b.time||'99:99')
}
export function clubCalendarWindow(events:ClubCalendarEvent[],from:string,through?:string){
 return events.filter(e=>e.date>=from&&(!through||e.date<=through)).slice().sort(compareCalendarEvents)
}

export function calendarLinkedRows<T extends {matchRef?:string|null}>(rows:T[],event:ClubCalendarEvent|null){
 return event?rows.filter(row=>row.matchRef===event.id):[]
}
