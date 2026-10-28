import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {readCssaMail,writeCssaMail,ingestCssaLocalMail,promoteCssaMailDocument} from '../src/cssaMailLocal.ts'
import {readCssaMediaCache,publicMediaUrl} from '../src/cssaMediaLocal.ts'
import {readCssaMailState,writeCssaMailState,ingestCssaMail,matchMailDirectory} from '../server/cssa-mail-store.mjs'
import {readCssaCrmDirectory,writeCssaCrmDirectory} from '../server/cssa-crm-directory-store.mjs'
import {readCssaBusinessState,writeCssaBusinessState} from '../server/cssa-business-store.mjs'
import {observeCssaSource,businessLists} from '../server/cssa-source-observation.mjs'
import {readCssaSportWatchCache} from '../server/cssa-sport-watch.mjs'
const reply=x=>({ok:true,json:async()=>structuredClone(x)})
const message={id:'mail-1',from:'agent@test.invalid',to:['club@test.invalid'],cc:[],subject:'Pièce',bodyPreview:'Déclaration reçue',receivedAt:'2026-10-28T09:00:00Z',direction:'ENTRANT',source:'TEST'}
const draft={id:'draft-1',to:['agent@test.invalid'],subject:'Brouillon',body:'Texte conservé',status:'BROUILLON',approvedByPersonId:null,source:'BROUILLON_LOCAL_NON_ENVOYE'}
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cssa-mail-live-')),mail=join(root,'mail.json'),crm=join(root,'crm.json'),business=join(root,'business.json')
 let lose=false,posts=0
 return {mail,crm,business,close:()=>rmSync(root,{recursive:true,force:true}),loseNext:()=>{lose=true},get posts(){return posts},fetch:async(url,options)=>{
  let result
  if(url.endsWith('cssa-mail-ingest')){const out=ingestCssaMail(JSON.parse(options.body),mail,crm);result={...out,state:observeCssaSource(out.state,mail,['messages','drafts'])}}
  else if(url.endsWith('cssa-mail-state'))result=observeCssaSource(options?.method==='POST'?writeCssaMailState(JSON.parse(options.body),mail):readCssaMailState(mail),mail,['messages','drafts'])
  else if(url.endsWith('cssa-crm-directory'))result=observeCssaSource(readCssaCrmDirectory(crm),crm,['organizations','contacts','interactions'])
  else if(url.endsWith('cssa-business-state'))result=observeCssaSource(options?.method==='POST'?writeCssaBusinessState(JSON.parse(options.body),business):readCssaBusinessState(business),business,businessLists)
  else throw Error('Unexpected URL '+url)
  if(options?.method==='POST'){posts++;if(lose){lose=false;throw Error('response lost')}}
  return reply(result)
 }}
}
function prepareBusiness(io){writeCssaBusinessState({dossierPatch:{id:'d',title:'Dossier',reference:'D',status:'EN_PREPARATION'},requirementPatch:{id:'r',dossierId:'d',label:'Exigence',state:'SATISFAIT',documentRefId:null,source:'DÉCLARÉ'}},io.business)}
const document=()=>({id:'doc',title:'Pièce reçue',type:'MAIL',status:'A_VERIFIER',source:'MAIL:mail-1',originMailId:'mail-1',originType:'MAIL',proof:'',dossierId:'d',requirementIds:['r'],usedIn:['d']})
test('Mail source absence differs from available empty; invalid source never repairs or overwrites a file',async()=>{
 const io=fixture();try{
  assert.equal((await readCssaMail(io.fetch))._source.status,'MISSING')
  writeFileSync(io.mail,'broken');await assert.rejects(writeCssaMail({draftPatch:draft},io.fetch))
  assert.equal(readFileSync(io.mail,'utf8'),'broken');assert.throws(()=>ingestCssaMail(message,io.mail,io.crm));assert.equal(io.posts,0)
 }finally{io.close()}
})
test('draft confirmation and lost response reuse one local object; changed draft identity never overwrites progress',async()=>{
 const io=fixture();try{
  io.loseNext();await assert.rejects(writeCssaMail({draftPatch:draft},io.fetch))
  const result=await writeCssaMail({draftPatch:draft},io.fetch);assert.equal(result.drafts.length,1);assert.equal(io.posts,1)
  writeCssaMailState({draftPatch:{id:draft.id,status:'HOLD'}},io.mail)
  await assert.rejects(writeCssaMail({draftPatch:draft},io.fetch));assert.equal(readCssaMailState(io.mail).drafts[0].status,'HOLD')
  await assert.rejects(writeCssaMail({draftPatch:{...draft,status:'VALIDE'}},io.fetch))
 }finally{io.close()}
})
test('Mail import creates no fake proof, no actor on missing CRM, and retry keeps one message',async()=>{
 const io=fixture();try{
  io.loseNext();await assert.rejects(ingestCssaLocalMail(message,io.fetch))
  const out=await ingestCssaLocalMail(message,io.fetch)
  assert.equal(out.message.proof,'');assert.equal(out.message.reconciliationStatus,'SOURCE_UNKNOWN');assert.equal(out.message.organizationId,null)
  assert.equal(readCssaMailState(io.mail).messages.length,1);assert.equal(existsSync(io.crm),false)
  await assert.rejects(ingestCssaLocalMail({...message,subject:'Autre objet'},io.fetch))
 }finally{io.close()}
})
test('CRM email resolution keeps ambiguity, broken and duplicate ids; outgoing recipients must resolve uniquely',()=>{
 const organizations=[{id:'o',email:'office@test.invalid'},{id:'other',email:'other@test.invalid'}]
 const contacts=[{id:'c',email:message.from,organizationId:'o'}]
 const directory={organizations,contacts,interactions:[]}
 assert.equal(matchMailDirectory(message,directory).organization.id,'o')
 assert.equal(matchMailDirectory(message,{...directory,contacts:[...contacts,{...contacts[0],id:'second'}]}).status,'AMBIGUOUS')
 assert.equal(matchMailDirectory(message,{...directory,organizations:[]}).status,'BROKEN')
 assert.equal(matchMailDirectory(message,{...directory,organizations:[...organizations,{id:'o'}]}).status,'AMBIGUOUS')
 assert.equal(matchMailDirectory({direction:'SORTANT',to:['office@test.invalid','other@test.invalid']},directory).status,'AMBIGUOUS')
 assert.equal(matchMailDirectory(message,directory,false).status,'SOURCE_UNKNOWN')
})
test('exact unique CRM import confirms interaction and never rewrites it when retrying',async()=>{
 const io=fixture();try{
  writeCssaCrmDirectory({organizationPatch:{id:'o',name:'Org',email:message.from,status:'ACTIF'}},io.crm)
  const first=await ingestCssaLocalMail(message,io.fetch);assert.equal(first.message.organizationId,'o')
  const before=readFileSync(io.crm,'utf8');await ingestCssaLocalMail(message,io.fetch);assert.equal(readFileSync(io.crm,'utf8'),before)
  assert.equal(readCssaCrmDirectory(io.crm).interactions.length,1)
 }finally{io.close()}
})
test('document promotion confirms all links without changing requirement progress or validating its piece',async()=>{
 const io=fixture();try{
  await ingestCssaLocalMail(message,io.fetch);prepareBusiness(io)
  const result=await promoteCssaMailDocument('mail-1',document(),'r',io.fetch)
  assert.equal(result.documentRefs[0].status,'A_VERIFIER');assert.equal(result.documentRefs[0].originMailId,'mail-1')
  assert.equal(result.requirements[0].state,'SATISFAIT');assert.equal(result.requirements[0].source,'DÉCLARÉ');assert.equal(result.requirements[0].documentRefId,'doc')
  assert.equal(readCssaMailState(io.mail).messages[0].dossierId,'d')
  const posts=io.posts;await promoteCssaMailDocument('mail-1',document(),'r',io.fetch);assert.equal(io.posts,posts)
 }finally{io.close()}
})
test('partial document save resumes with the same id and reports incomplete links',async()=>{
 const io=fixture();try{
  await ingestCssaLocalMail(message,io.fetch);prepareBusiness(io)
  let failed=false
  const fetcher=async(url,options)=>{if(options?.body&&JSON.parse(options.body).requirementPatch&&!failed){failed=true;throw Error('lost link response')}return io.fetch(url,options)}
  await assert.rejects(promoteCssaMailDocument('mail-1',document(),'r',fetcher),/Document enregistré/)
  assert.equal(readCssaBusinessState(io.business).documentRefs.length,1)
  await promoteCssaMailDocument('mail-1',document(),'r',io.fetch);assert.equal(readCssaBusinessState(io.business).documentRefs.length,1)
 }finally{io.close()}
})
test('promotion refuses another requirement dossier, replaced link and fabricated provenance before creating a document',async()=>{
 const io=fixture();try{
  await ingestCssaLocalMail(message,io.fetch);prepareBusiness(io)
  for(const changed of [{...document(),dossierId:null},{...document(),proof:'invented'}])await assert.rejects(promoteCssaMailDocument('mail-1',changed,'r',io.fetch))
  writeCssaBusinessState({requirementPatch:{id:'r',documentRefId:'other'}},io.business)
  await assert.rejects(promoteCssaMailDocument('mail-1',document(),'r',io.fetch))
  assert.equal(readCssaBusinessState(io.business).documentRefs.length,0)
 }finally{io.close()}
})
test('unconfirmed or different draft response cannot claim persistence',async()=>{
 const io=fixture();try{
  await assert.rejects(writeCssaMail({draftPatch:draft},async(url,opts)=>opts?.method==='POST'?reply({messages:[],drafts:[],_source:{status:'AVAILABLE'}}):io.fetch(url,opts)))
  await assert.rejects(readCssaMail(async()=>reply({messages:[{id:'m',subject:'s',from:'f',to:[],cc:[],bodyPreview:{bad:true}}],drafts:[]})))
 }finally{io.close()}
})
test('cache-only media reads existing disk observations without refreshing any remote site or file',async()=>{
 const io=fixture();const file=join(io.mail,'..','watch.json');try{
  assert.equal(readCssaSportWatchCache(file)._source.status,'MISSING');assert.equal(existsSync(file),false)
  const capture={observedAt:'2026-10-14T10:00:00Z',sources:[{id:'DVCR_HOME',label:'DVCR',url:'https://www.dvcr.fr/',status:'HTTP_ERROR',observedAt:'2026-10-14T10:00:00Z'}],dvcrMedia:{articles:[]}}
  writeFileSync(file,JSON.stringify({cachedValue:capture,cachedAt:1}));const before=readFileSync(file,'utf8')
  const result=await readCssaMediaCache(async(url,options)=>{assert.match(url,/cacheOnly=1/);assert.equal(options.cache,'no-store');return reply(readCssaSportWatchCache(file))})
  assert.equal(result.sources[0].status,'HTTP_ERROR');assert.equal(result.observedAt,capture.observedAt);assert.equal(readFileSync(file,'utf8'),before)
  writeFileSync(file,'bad');assert.equal(readCssaSportWatchCache(file)._source.status,'INVALID')
  assert.equal(publicMediaUrl('javascript:alert(1)'), '');assert.equal(publicMediaUrl('https://www.dvcr.fr/'),'https://www.dvcr.fr/')
 }finally{io.close()}
})

test('a CRM interaction saved before Mail can be resumed without duplicate or rewritten history',async()=>{
 const io=fixture();try{
  writeCssaCrmDirectory({organizationPatch:{id:'o',name:'Org',email:message.from,status:'ACTIF'}},io.crm)
  await ingestCssaLocalMail(message,io.fetch)
  const before=readFileSync(io.crm,'utf8');unlinkSync(io.mail)
  await ingestCssaLocalMail(message,io.fetch)
  assert.equal(readFileSync(io.crm,'utf8'),before)
  assert.equal(readCssaMailState(io.mail).messages.length,1)
 }finally{io.close()}
})
test('an already saved message with a missing CRM source remains saved but its reconciliation is not reconfirmed',async()=>{
 const io=fixture();try{
  writeCssaCrmDirectory({organizationPatch:{id:'o',name:'Org',email:message.from,status:'ACTIF'}},io.crm)
  await ingestCssaLocalMail(message,io.fetch);unlinkSync(io.crm)
  await assert.rejects(ingestCssaLocalMail(message,io.fetch),/Message enregistré.*CRM non confirmé/)
  assert.equal(readCssaMailState(io.mail).messages.length,1);assert.equal(existsSync(io.crm),false)
 }finally{io.close()}
})
