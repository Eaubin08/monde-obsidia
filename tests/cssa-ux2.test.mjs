import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const page=readFileSync(new URL('../src/CSSAPage.tsx',import.meta.url),'utf8')
const ops=readFileSync(new URL('../src/CSSAOpsWorkspace.tsx',import.meta.url),'utf8')
const pageCss=readFileSync(new URL('../src/CSSAPage.css',import.meta.url),'utf8')
const sportCss=readFileSync(new URL('../src/CSSASport.css',import.meta.url),'utf8')
const home=readFileSync(new URL('../src/CSSAHomePage.tsx',import.meta.url),'utf8')
const org=readFileSync(new URL('../src/CSSAOrganisationPage.tsx',import.meta.url),'utf8')

test('UX2 · CSSA navigation keeps Mail and uses an action-first Accueil',()=>{
  assert.match(page,/label:'Accueil'/)
  assert.match(page,/moduleIds: \['tasks', 'admin', 'crm', 'mail'\]/)
  assert.match(page,/CSSAHomePage/)
  assert.match(home,/Ce qui demande votre attention/)
  assert.match(home,/onOpen\('mail'\)/)
})

test('UX2 · duplicate global Ops subnavigation is removed',()=>{
  assert.doesNotMatch(ops,/ops-subnav-bar/)
  assert.doesNotMatch(ops,/ops-subnav-tabs/)
  assert.doesNotMatch(ops,/ops-subnav-btn/)
})

test('UX2 · Organisation has human-readable poles and detail navigation',()=>{
  assert.match(page,/CSSAOrganisationPage/)
  assert.match(org,/Gouvernance & direction/)
  assert.match(org,/Administration & support/)
  assert.match(org,/Formation \/ Académie/)
  assert.match(org,/Frontière de vérité/)
  assert.match(org,/selectedId/)
})

test('UX2 · deep breadcrumbs are represented in CSSA shell',()=>{
  assert.match(page,/deepCrumbs/)
  assert.match(page,/u-breadcrumb-deep/)
  assert.match(page,/crumbLabel/)
})

test('UX2 · responsive gates explicitly cover 1366, 1024 and mobile widths',()=>{
  assert.match(pageCss,/@media\(max-width:1366px\)/)
  assert.match(pageCss,/@media\(max-width:1024px\)/)
  assert.match(pageCss,/@media\(max-width:760px\)/)
  assert.match(sportCss,/@media \(max-width: 1366px\)/)
  assert.match(sportCss,/@media \(max-width: 1024px\)/)
})
