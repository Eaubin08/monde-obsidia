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
const mail=readFileSync(new URL('../src/CSSAMailPage.tsx',import.meta.url),'utf8')

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


test('UX7 · CRM is the canonical directory for external actors reused by business flows',()=>{
  assert.match(ops,/Répertoire externe/)
  assert.match(ops,/cssa-crm-directory/)
  assert.match(ops,/Nouvel acteur externe/)
  assert.match(ops,/Contacts canoniques/)
  assert.match(ops,/relatedOrgId/)
  assert.match(business,/organizationId/)
  assert.match(business,/supplierOrganizationId/)
  assert.match(business,/contractOrganizationId/)
  assert.match(business,/invoiceOrganizationId/)
})


test('UX8 · CRM relationship journal captures real exchanges and follow-ups',()=>{
  assert.match(ops,/Journal relationnel/)
  assert.match(ops,/Enregistrer l’interaction/)
  assert.match(ops,/DOCUMENT_RECU/)
  assert.match(ops,/followupTaskId/)
  assert.match(ops,/Journal relationnel CRM/)
  assert.match(business,/Relation externe/)
  assert.match(business,/Preuve :/)
})


test('UX9 · Mail is governed and deterministically bridges messages into CRM',()=>{
  assert.match(page,/CSSAMailPage/)
  assert.match(mail,/Boîte gouvernée & journal CRM/)
  assert.match(mail,/ENVOI EXTERNE · HOLD/)
  assert.match(mail,/cssa-mail-ingest/)
  assert.match(mail,/Importer & rapprocher CRM/)
  assert.match(mail,/Rapprochement automatique uniquement par adresse email exacte/)
  assert.match(mail,/BROUILLON_LOCAL_NON_ENVOYE/)
})


test('UX10 · Mail documents keep provenance and cannot auto-satisfy dossier requirements',()=>{
  assert.match(mail,/Transformer une pièce reçue en document canonique/)
  assert.match(mail,/originMailId/)
  assert.match(mail,/requirementIds/)
  assert.match(mail,/l’exigence reste/)
  assert.match(mail,/À vérifier/)
  assert.match(business,/Mail source :/)
  assert.match(business,/Pièce liée :/)
  assert.match(business,/disabled={!linkedDocValid}/)
  assert.match(business,/originType==='MAIL'/)
})


test('UX11 · deposited and awarded states require first-class evidence objects',()=>{
  assert.match(business,/submissionProofs/)
  assert.match(business,/dossierOutcomes/)
  assert.match(business,/Dépôt & résultat/)
  assert.match(business,/Un statut « Déposé » n’existe qu’avec une preuve de dépôt/)
  assert.match(business,/submissionProofRef/)
  assert.match(business,/Enregistrer la preuve de dépôt/)
  assert.match(business,/Enregistrer le résultat/)
  assert.match(business,/next==='DEPOSE'&&\(!dossierReady\|\|!submissionProof\)/)
})


test('UX12 · Accueil surfaces dossier deadlines validation submission waits and outcomes',()=>{
  assert.match(home,/DOSSIERS À TRAITER/)
  assert.match(home,/Alertes dossiers/)
  assert.match(home,/Validation finale en attente/)
  assert.match(home,/Dossier prêt : preuve de dépôt manquante/)
  assert.match(home,/Déposé : résultat externe attendu/)
  assert.match(home,/Échéance dépassée sans preuve de dépôt/)
  assert.match(home,/Résultats dossiers/)
  assert.match(home,/submissionProofs/)
  assert.match(home,/dossierOutcomes/)
})
