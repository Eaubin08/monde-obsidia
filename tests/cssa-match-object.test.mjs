import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const match=readFileSync(new URL('../src/CSSAMatchObjectView.tsx',import.meta.url),'utf8')
const matchday=readFileSync(new URL('../src/CSSAMatchdayPage.tsx',import.meta.url),'utf8')
const sportif=readFileSync(new URL('../src/CSSASportPage.tsx',import.meta.url),'utf8')

test('match object requires unique calendar identity and never fabricates a substitute',()=>{
 assert.match(match,/matches\.length===1\?matches\[0\]:null/)
 assert.match(match,/identifiant de match ambigu/)
 assert.match(match,/événement introuvable/)
})
test('match relations only use explicit matchRef with available Ops',()=>{
 assert.match(match,/event&&opsAvailable\?tasks\.filter\(t=>t\.matchRef===event\.id\):\[\]/)
 assert.match(match,/event&&opsAvailable\?preparations\.filter\(p=>p\.matchRef===event\.id\):\[\]/)
 assert.match(match,/resolveCssaReference\(p\.linkedTaskId,eventTasks,opsAvailable\)/)
 assert.match(match,/registre Ops indisponible/)
})
test('match territory keeps provenance and KX108 separate from calendar and task status',()=>{
 assert.match(match,/event\.sourceUrl/)
 assert.match(match,/event\.truth\.includes\('CONFLICT'\)/)
 assert.match(match,/ne prouvent une autorisation KX108/)
 assert.match(match,/onSelect\('organisation','person:'\+t\.responsiblePersonId\)/)
})
test('Matchday exposes upcoming match exploration without invented event data',()=>{
 assert.match(matchday,/CSSA_REFERENCE_CALENDAR\.filter\(e=>showPastEvents\|\|e\.date>=/)
 assert.match(matchday,/onSelect\('matchday','event:'\+e\.id\)/)
 assert.match(matchday,/selectedId\.startsWith\('event:'\)/)
 assert.match(matchday,/e\.fixture\?\.teamId==='SENIORS_R1'/)
 assert.match(matchday,/setShowPastEvents/)
 assert.match(matchday,/<CSSAMatchObjectView events=\{CSSA_REFERENCE_CALENDAR\}/)
})

test('Sportif opens only unique observed match objects in Matchday',()=>{
 assert.match(sportif,/!selected\.simulated&&CSSA_REFERENCE_CALENDAR\.filter\(e=>e\.id===selected\.id&&e\.kind==='MATCH'\)\.length===1/)
 assert.match(sportif,/#cssa\/matchday\//)
 assert.match(sportif,/encodeURIComponent\('event:'\+selected\.id\)/)
})
