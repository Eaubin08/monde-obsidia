import {test} from 'node:test'
import assert from 'node:assert/strict'
import {buildClubCalendar,clubCalendarWindow,calendarLinkedRows,sportCalendarHref} from '../src/cssaSportCalendar.ts'
const match=(patch={})=>({id:'r1-j7',teamId:'SENIORS_R1',competition:'R1',date:'2026-10-17',time:'18:00',home:'Sedan',away:'Autre',stage:'J7',truth:'PUBLIC_CONFLICT_REVIEW',source:'Référence A',sourceUrl:'https://example.invalid/a',note:'Horaire contradictoire',...patch})
const plateau=(patch={})=>({id:'u9-plateau',category:'U9',teamLabel:'École U9',date:'2026-10-17',time:'10:00',format:'FOOT_5',venue:'Lieu déclaré',opponents:'Plusieurs équipes',source:'Référence B',truth:'UNKNOWN',status:'TO_VERIFY',...patch})

test('shared calendar preserves identities, raw provenance and plateau format without fabricating a fixture',()=>{
 const f=match(),p=plateau();const rows=buildClubCalendar([f],[p])
 assert.deepEqual(rows.map(x=>x.id),[p.id,f.id])
 assert.equal(rows[0].plateau,p);assert.equal(rows[0].fixture,undefined)
 assert.equal(rows[0].competition,'FOOT_5');assert.equal(rows[0].venue,p.venue)
 assert.equal(rows[0].truth,'UNKNOWN');assert.equal(rows[0].detail,'TO_VERIFY')
 assert.equal(rows[1].fixture,f);assert.equal(rows[1].truth,f.truth)
 assert.equal(rows[1].sourceUrl,f.sourceUrl);assert.match(rows[1].detail,/contradictoire/)
 assert.equal(rows[0].href,'#cssa/sportif/ECOLE_FOOT/u9-plateau')
})
test('simulations are excluded while contradictory source rows remain separate and unchanged',()=>{
 const a=match(),b=match({time:'20:00',source:'Référence contradictoire'})
 const inputs=[a,b,match({id:'simulation',simulated:true})];const before=structuredClone(inputs)
 const rows=buildClubCalendar(inputs,[])
 assert.equal(rows.length,2);assert.deepEqual(rows.map(x=>x.time),['18:00','20:00'])
 assert.deepEqual(rows.map(x=>x.id),['r1-j7','r1-j7']);assert.deepEqual(inputs,before)
})
test('unknown time and venue remain unknown, after timed rows without invented kickoff',()=>{
 const rows=buildClubCalendar([match({time:null,venue:undefined})],[plateau({time:''})])
 assert.equal(rows[0].time,null);assert.equal(rows[0].venue,null)
 assert.equal(rows[1].time,null)
 const sorted=buildClubCalendar([match({time:null}),match({id:'known',time:'19:00'})],[])
 assert.equal(sorted[0].id,'known');assert.equal(sorted[1].time,null)
})
test('inclusive date window covers matches and school plateaux across year boundary without mutating source',()=>{
 const rows=buildClubCalendar([match({date:'2027-01-01'}),match({id:'past',date:'2026-12-30'})],[plateau({date:'2026-12-31'}),plateau({id:'later',date:'2027-01-08'})])
 const before=structuredClone(rows)
 assert.deepEqual(clubCalendarWindow(rows,'2026-12-31','2027-01-07').map(x=>x.id),['u9-plateau','r1-j7'])
 assert.equal(clubCalendarWindow(rows,'2028-01-01').length,0);assert.deepEqual(rows,before)
})
test('deep links keep exact encoded ids and grouped Formation/Féminines routes',()=>{
 const rows=buildClubCalendar([match({id:'formation/id ?',teamId:'U16_R1'}),match({id:'fem',teamId:'U18F_R2'})],[])
 assert.equal(rows[0].href,sportCalendarHref('FORMATION','formation/id ?'))
 assert.equal(rows[1].href,'#cssa/sportif/FEMININES/fem')
 assert.match(rows[0].href,/formation%2Fid%20%3F$/)
})
test('preparation links use exact matchRef for both event kinds; no next event never shows all tasks',()=>{
 const event=buildClubCalendar([],[plateau()])[0]
 const rows=[{id:'exact',matchRef:event.id,status:'UNKNOWN'},{id:'label-only',matchRef:'École U9'},{id:'other',matchRef:'r1-j7'},{id:'missing'}]
 assert.deepEqual(calendarLinkedRows(rows,event),[rows[0]])
 assert.deepEqual(calendarLinkedRows(rows,null),[])
 assert.equal(rows[0].status,'UNKNOWN')
})
