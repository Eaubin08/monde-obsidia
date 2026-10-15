import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,existsSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {emptyEconomy,projectCssaEconomy,economicParty,readCssaEconomy,readCssaEconomyCrm} from '../src/cssaEconomy.ts'
import {writeCssaEconomy} from '../src/cssaEconomyWrite.ts'
import {readCssaBusinessState,writeCssaBusinessState} from '../server/cssa-business-store.mjs'
import {observeCssaSource,businessLists} from '../server/cssa-source-observation.mjs'
const full=()=>({...emptyEconomy,dossiers:[],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[],updatedAt:'2026-10-15T12:00:00Z',_source:{status:'AVAILABLE'}})
const reply=value=>({ok:true,json:async()=>structuredClone(value)})
const revenue={id:'rev',label:'Buvette',category:'BUVETTE',amount:100,date:'2026-10-15',status:'A_VERIFIER',source:'Déclaration locale'}
const invoice={id:'inv',label:'Partenaire',number:'F1',direction:'EMISE',amount:300,status:'A_ENCAISSER',dueAt:'2026-10-14'}
function io(){
 const root=mkdtempSync(join(tmpdir(),'cssa-economy-')),file=join(root,'business.json')
 let lost=false,posts=0
 return {file,close:()=>rmSync(root,{recursive:true,force:true}),loseNext:()=>{lost=true},get posts(){return posts},fetch:async(url,options)=>{
  assert.equal(url,'/obsidia-local/cssa-business-state')
  const state=options?.method==='POST'?writeCssaBusinessState(JSON.parse(options.body),file):readCssaBusinessState(file)
  if(options?.method==='POST'){posts++;if(lost){lost=false;throw Error('response lost')}}
  return reply(observeCssaSource(state,file,businessLists))
 }}
}
test('economy distinguishes zero AVAILABLE from UNKNOWN missing/template/invalid and missing metadata',()=>{
 const current=full();assert.equal(projectCssaEconomy(current,'2026-10-15').result,0)
 for(const status of ['MISSING','INVALID','UNREADABLE','TEMPLATE']){
  current._source={status};current.revenues=[revenue]
  assert.equal(projectCssaEconomy(current,'2026-10-15').revenueTotal,null)
 }
 assert.equal(projectCssaEconomy(emptyEconomy,'2026-10-15').cash,null)
})
test('economic projections retain declared statuses and do not net payments against invoices or infer treasury',()=>{
 const state=full();state.revenues=[revenue];state.expenses=[{...revenue,id:'expense',amount:20}]
 state.invoices=[invoice];state.payments=[{id:'p',direction:'ENTREE',amount:50,status:'A_VERIFIER'}]
 const before=structuredClone(state);const view=projectCssaEconomy(state,'2026-10-15')
 assert.equal(view.result,80);assert.equal(view.receivable,300);assert.equal(view.paymentIn,50);assert.equal(view.cash,0)
 assert.equal(view.overdue[0].status,'A_ENCAISSER');assert.deepEqual(state,before)
})
test('ambiguous identities, unknown amounts and directions never turn into fabricated totals',()=>{
 const state=full();state.revenues=[revenue,{...revenue,amount:200}]
 assert.equal(projectCssaEconomy(state,'2026-10-15').revenueTotal,null)
 state.revenues=[{...revenue,amount:null}];assert.equal(projectCssaEconomy(state,'2026-10-15').result,null)
 state.payments=[{id:'p',amount:10,direction:'UNKNOWN'}];assert.equal(projectCssaEconomy(state,'2026-10-15').paymentIn,null)
 state.treasuryEntries=[{id:'t',amount:10,direction:'UNKNOWN'}];assert.equal(projectCssaEconomy(state,'2026-10-15').cash,null)
 state.treasuryEntries=[{id:'t',amount:10,direction:'ENTREE'},{id:'t',amount:10,direction:'SORTIE'}];assert.equal(projectCssaEconomy(state,'2026-10-15').cash,null)
 state.invoices=[{...invoice,status:'UNKNOWN'}];assert.equal(projectCssaEconomy(state,'2026-10-15').receivable,null)
})
test('invalid invoice dates remain review points rather than overdue dates; cancelled records remain unchanged',()=>{
 const state=full();state.invoices=[{...invoice,dueAt:'2026-02-30'},{...invoice,id:'cancel',status:'ANNULEE'}]
 const view=projectCssaEconomy(state,'2026-10-15')
 assert.equal(view.invalidDates.length,1);assert.equal(view.overdue.length,0);assert.equal(view.receivable,300)
 assert.equal(state.invoices[1].status,'ANNULEE')
})
test('canonical CRM party resolution never falls back to a declared name when an explicit link is broken',()=>{
 const crm={organizations:[{id:'o',name:'Nom actuel',status:'ACTIF'}],_source:{status:'AVAILABLE'}}
 assert.match(economicParty('o','Ancien nom',crm),/Nom actuel/)
 assert.match(economicParty('other','Ancien nom',crm),/UNKNOWN.*introuvable/)
 crm.organizations.push({...crm.organizations[0]});assert.match(economicParty('o','Ancien nom',crm),/ambiguë/)
 crm._source.status='MISSING';assert.match(economicParty('o','Ancien nom',crm),/indisponible/)
 assert.match(economicParty(null,'Déclaré',null),/déclaré, sans lien CRM/)
})
test('economic readers use the existing endpoint with timeout and reject malformed collections or display fields',async()=>{
 let options
 assert.deepEqual(await readCssaEconomy(async(url,config)=>{assert.equal(url,'/obsidia-local/cssa-business-state');options=config;return reply(full())}),full())
 assert.equal(options.cache,'no-store');assert.ok(options.signal)
 for(const change of [{payments:{}},{stockItems:[null]},{invoices:[{id:'i',party:{name:'bad'}}]}])await assert.rejects(readCssaEconomy(async()=>reply({...full(),...change})))
 await assert.rejects(readCssaEconomyCrm(async()=>reply({organizations:[{id:'o',name:4}],contacts:[],interactions:[]})))
})
test('real economic store confirms all nine creation types without changing the other registries',async()=>{
 const store=io()
 try{
  const patches=[['revenuePatch',revenue],['expensePatch',{...revenue,id:'exp'}],['stockPatch',{id:'stock',label:'Gobelets',quantity:0,threshold:10}],['supplierPatch',{id:'supplier',name:'Fournisseur déclaré'}],['contractPatch',{id:'contract',label:'Accord',amount:null}],['invoicePatch',invoice],['paymentPatch',{id:'payment',account:'Caisse',invoiceId:'inv',direction:'ENTREE',amount:50,status:'A_VERIFIER'}],['treasuryPatch',{id:'treasury',label:'Mouvement déclaré',paymentId:'payment',amount:50,direction:'ENTREE'}],['assetPatch',{id:'asset',label:'Équipement',value:null}]]
  for(const [key,row] of patches){const state=await writeCssaEconomy({[key]:row},store.fetch);assert.equal(state._source.status,'AVAILABLE')}
  const state=readCssaBusinessState(store.file)
  assert.equal(store.posts,9);assert.equal(state.invoices[0].status,'A_ENCAISSER');assert.equal(state.payments[0].status,'A_VERIFIER');assert.equal(state.dossiers.length,0);assert.equal(state.revenues[0].source,revenue.source)
 }finally{store.close()}
})
test('lost economic response retries without duplicate POST, while a changed existing creation cannot be overwritten',async()=>{
 const store=io()
 try{
  store.loseNext();await assert.rejects(writeCssaEconomy({revenuePatch:revenue},store.fetch))
  assert.ok(existsSync(store.file));await writeCssaEconomy({revenuePatch:revenue},store.fetch);assert.equal(store.posts,1)
  writeCssaBusinessState({revenuePatch:{id:'rev',status:'REVU_EXTERNEMENT'}},store.file)
  await assert.rejects(writeCssaEconomy({revenuePatch:revenue},store.fetch),/déjà utilisé/)
  assert.equal(readCssaBusinessState(store.file).revenues[0].status,'REVU_EXTERNEMENT')
  await writeCssaEconomy({revenuePatch:{id:'rev',status:'DECLARATION_CORRIGEE'}},store.fetch)
  assert.equal(readCssaBusinessState(store.file).revenues[0].amount,100)
 }finally{store.close()}
})
test('invalid source, ambiguous target, incomplete creation and non-finite number block before any economic POST',async()=>{
 const store=io()
 try{
  writeFileSync(store.file,'bad json');await assert.rejects(writeCssaEconomy({revenuePatch:revenue},store.fetch));assert.equal(store.posts,0)
  writeFileSync(store.file,JSON.stringify({...full(),revenues:[revenue,revenue]}));await assert.rejects(writeCssaEconomy({revenuePatch:{id:'rev',amount:1}},store.fetch));assert.equal(store.posts,0)
  writeFileSync(store.file,JSON.stringify(full()))
  await assert.rejects(writeCssaEconomy({revenuePatch:{id:'missing',amount:1}},store.fetch))
  await assert.rejects(writeCssaEconomy({revenuePatch:{...revenue,amount:NaN}},store.fetch));assert.equal(store.posts,0)
 }finally{store.close()}
})
test('economic links require available unique canonical targets; payment direction must agree with invoice direction',async()=>{
 const state=full();state.invoices=[invoice];let posts=0
 const crm={organizations:[{id:'o',name:'Org'}],contacts:[],interactions:[],_source:{status:'AVAILABLE'}}
 const org={people:[{id:'p',displayName:'Personne',status:'ACTIF'}],roleAssignments:[],availabilities:[],authorizations:[],engagements:[],_source:{status:'AVAILABLE'}}
 const fetcher=async(url,options)=>{
  if(options?.method==='POST'){posts++;const row=JSON.parse(options.body).invoicePatch;return reply({...state,invoices:[invoice,row]})}
  return reply(url.includes('crm')?crm:url.includes('organisation')?org:state)
 }
 await writeCssaEconomy({invoicePatch:{...invoice,id:'new',partyOrganizationId:'o',responsiblePersonId:'p'}},fetcher)
 assert.equal(posts,1)
 crm._source.status='MISSING';await assert.rejects(writeCssaEconomy({invoicePatch:{...invoice,id:'another',partyOrganizationId:'o'}},fetcher));assert.equal(posts,1)
 await assert.rejects(writeCssaEconomy({paymentPatch:{id:'pmt',account:'caisse',invoiceId:'inv',direction:'SORTIE',amount:5}},fetcher),/Sens du paiement/)
 await assert.rejects(writeCssaEconomy({paymentPatch:{id:'pmt',account:'caisse',invoiceId:'absent',direction:'ENTREE',amount:5}},fetcher))
})
test('economic response must confirm the unique exact object and its real source',async()=>{
 for(const result of [{...emptyEconomy,revenues:[revenue],_source:{status:'AVAILABLE'}},{...full(),revenues:[]},{...full(),revenues:[{...revenue,amount:99}]},{...full(),revenues:[revenue,revenue]},{...full(),revenues:[revenue],_source:{status:'MISSING'}}]){
  await assert.rejects(writeCssaEconomy({revenuePatch:revenue},async(_url,options)=>reply(options?.method==='POST'?result:full())))
 }
 await assert.rejects(writeCssaEconomy({revenuePatch:revenue},async(_url,options)=>options?.method==='POST'?{ok:false}:reply(full())))
})
