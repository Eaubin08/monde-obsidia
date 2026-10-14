import {test} from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const page=readFileSync(new URL('../src/CSSAPage.tsx',import.meta.url),'utf8')
const ops=readFileSync(new URL('../src/CSSAOpsWorkspace.tsx',import.meta.url),'utf8')
const pageCss=readFileSync(new URL('../src/CSSAPage.css',import.meta.url),'utf8')
const sportCss=readFileSync(new URL('../src/CSSASport.css',import.meta.url),'utf8')
const home=readFileSync(new URL('../src/CSSAHomePage.tsx',import.meta.url),'utf8')
const org=readFileSync(new URL('../src/CSSAOrganisationPage.tsx',import.meta.url),'utf8')
const business=readFileSync(new URL('../src/CSSABusinessPage.tsx',import.meta.url),'utf8')

test('UX2 · CSSA navigation keeps Mail and uses an action-first Accueil',()=>{
  assert.match(page,/label:'Accueil'/)
  assert.match(page,/moduleIds: \['dossiers', 'admin', 'documents', 'tasks'\]/)
  assert.match(page,/moduleIds: \['crm', 'mail'\]/)
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


test('UX3 · CSSA exposes transverse Dossiers and the club economy without duplicating core modules',()=>{
  assert.match(page,/label:'Dossiers'/)
  assert.match(page,/label:'Documents'/)
  assert.match(page,/label:'Commerce'/)
  assert.match(page,/CSSABusinessPage mode="dossiers"/)
  assert.match(page,/CSSABusinessPage mode="commerce"/)
  assert.match(page,/CSSABusinessPage mode="finance"/)
  assert.match(business,/APPEL_OFFRES/)
  assert.match(business,/SUBVENTION/)
  assert.match(business,/PARTENARIAT/)
  assert.match(business,/Complétude ≠ validation/)
  assert.match(business,/BILLETTERIE/)
  assert.match(business,/BUVETTE/)
  assert.match(business,/BOUTIQUE/)
  assert.match(business,/SPONSORING/)
  assert.match(business,/Stocks \/ achats/)
  assert.match(business,/Contrats \/ fournisseurs/)
  assert.match(business,/Factures \/ paiements/)
  assert.match(business,/Trésorerie/)
  assert.match(business,/Patrimoine/)
  assert.match(business,/Ajouter fournisseur/)
})


test('UX4 · dossiers are gated by readiness and economy surfaces derived attention',()=>{
  assert.match(business,/dossierReady/)
  assert.match(business,/PRET_A_DEPOSER/)
  assert.match(business,/DEPOSE/)
  assert.match(business,/Le statut Prêt à déposer \/ Déposé reste bloqué/)
  assert.match(business,/overdueInvoices/)
  assert.match(business,/lowStock/)
  assert.match(business,/expiringContracts/)
  assert.match(business,/maintenanceDue/)
  assert.match(business,/Ce qui demande une action/)
})


test('UX5 · Organisation is the canonical people, availability and authority surface',()=>{
  assert.match(org,/Personnes, rôles et responsabilités/)
  assert.match(org,/Personnes & engagements/)
  assert.match(org,/Disponibilités/)
  assert.match(org,/Habilitations/)
  assert.match(org,/Une personne existe une seule fois/)
  assert.match(org,/Aucun occupant n’est déduit automatiquement/)
  assert.match(org,/roleAssignments/)
  assert.match(org,/authorizations/)
})


test('UX6 · canonical Organisation people are referenced by Tasks, Matchday, Dossiers and Finance',()=>{
  assert.match(ops,/responsiblePersonId/)
  assert.match(ops,/cssa-organisation-state/)
  assert.match(ops,/Responsable matchday/)
  assert.match(business,/ownerPersonId/)
  assert.match(business,/recordedByPersonId/)
  assert.match(business,/Responsable du dossier/)
  assert.match(business,/Décideur/)
  assert.match(business,/Habilitation AO/)
})
