import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {writeCssaBusinessPatch} from '../src/cssaBusinessWrite.ts'
import {readCssaBusinessState,writeCssaBusinessState} from '../server/cssa-business-store.mjs'
const base=()=>({dossiers:[{id:'d',title:'Mission',reference:'AO',status:'EN_PREPARATION',source:'UNKNOWN'}],requirements:[],documentRefs:[],validations:[],submissionProofs:[],dossierOutcomes:[],_source:{status:'AVAILABLE'}})
const reply=state=>({ok:true,json:async()=>structuredClone(state)})
function realStore(){
 const root=mkdtempSync(join(tmpdir(),'cssa-business-confirm-'));const file=join(root,'business.json')
 let loseResponse=false;let posts=0
 return {file,close:()=>rmSync(root,{recursive:true,force:true}),loseNext:()=>{loseResponse=true},get posts(){return posts},fetch:async(_url,options)=>{
  if(options?.method==='POST'){
   posts++;const state=writeCssaBusinessState(JSON.parse(options.body),file)
   if(loseResponse){loseResponse=false;throw Error('response lost after save')}
   return reply({...state,_source:{status:'AVAILABLE'}})
  }
  return reply({...readCssaBusinessState(file),_source:{status:existsSync(file)?'AVAILABLE':'MISSING'}})
 }}
}
test('real Business store confirms dossier, requirement, document and validation while preserving independent states',async()=>{
 const io=realStore()
 try{
  await writeCssaBusinessPatch({dossierPatch:base().dossiers[0]},io.fetch)
  await writeCssaBusinessPatch({requirementPatch:{id:'r',dossierId:'d',label:'Assurance',state:'MANQUANT',source:'UNKNOWN'}},io.fetch)
  await writeCssaBusinessPatch({documentRefPatch:{id:'doc',dossierId:'d',title:'Pièce',type:'ASSURANCE',status:'A_VERIFIER',usedIn:['d']}},io.fetch)
  const result=await writeCssaBusinessPatch({validationPatch:{id:'v',dossierId:'d',type:'REVUE_FINALE',status:'HOLD',decidedBy:null}},io.fetch)
  assert.equal(result.requirements[0].state,'MANQUANT');assert.equal(result.documentRefs[0].status,'A_VERIFIER');assert.equal(result.validations[0].status,'HOLD');assert.equal(result.dossiers[0].status,'EN_PREPARATION')
 }finally{io.close()}
})
test('combined dossier and submission/outcome objects must all be confirmed',async()=>{
 const io=realStore()
 try{
  await writeCssaBusinessPatch({dossierPatch:base().dossiers[0]},io.fetch)
  const proof={id:'p',dossierId:'d',proofRef:'reference-only',source:'UNKNOWN',status:'A_VERIFIER'}
  let result=await writeCssaBusinessPatch({submissionProofPatch:proof,dossierPatch:{id:'d',status:'DEPOSE'}},io.fetch)
  assert.deepEqual(result.submissionProofs,[proof]);assert.equal(result.dossiers[0].source,'UNKNOWN')
  const outcome={id:'o',dossierId:'d',result:'NON_RETENU',proofRef:'notification',amount:null}
  result=await writeCssaBusinessPatch({dossierOutcomePatch:outcome,dossierPatch:{id:'d',status:'NON_RETENU'}},io.fetch)
  assert.deepEqual(result.dossierOutcomes,[outcome]);assert.deepEqual(result.submissionProofs,[proof])
 }finally{io.close()}
})
test('lost response retry with the same document id does not duplicate and library document has no inferred dossier',async()=>{
 const io=realStore()
 try{
  const doc={id:'doc-stable',title:'Bibliothèque',type:'AUTRE',dossierId:null,usedIn:[],status:'A_VERIFIER'}
  io.loseNext();await assert.rejects(writeCssaBusinessPatch({documentRefPatch:doc},io.fetch))
  const result=await writeCssaBusinessPatch({documentRefPatch:doc},io.fetch)
  assert.deepEqual(result.documentRefs,[doc]);assert.equal(io.posts,2);assert.equal(result.dossiers.length,0)
 }finally{io.close()}
})
test('partial updates preserve current unrelated requirement fields and explicit task link',async()=>{
 const io=realStore()
 try{
  await writeCssaBusinessPatch({dossierPatch:base().dossiers[0]},io.fetch)
  await writeCssaBusinessPatch({requirementPatch:{id:'r',dossierId:'d',label:'Assurance',state:'MANQUANT',taskRefId:'t',source:'clause 3'}},io.fetch)
  const result=await writeCssaBusinessPatch({requirementPatch:{id:'r',state:'EN_COURS'}},io.fetch)
  assert.equal(result.requirements[0].taskRefId,'t');assert.equal(result.requirements[0].source,'clause 3')
 }finally{io.close()}
})
test('invalid source, removed partial target, duplicate target and broken dossier refuse before POST',async()=>{
 for(const state of [{...base(),_source:{status:'INVALID'}},{...base(),_source:{status:'UNREADABLE'}},base(),{...base(),requirements:[{id:'r'},{id:'r'}]},{...base(),requirements:[{id:'r',dossierId:'gone'}]}]){
  let posts=0
  await assert.rejects(writeCssaBusinessPatch({requirementPatch:{id:'r',state:'EN_COURS'}},async(_url,options)=>{if(options?.method==='POST')posts++;return reply(state)}))
  assert.equal(posts,0)
 }
})
test('HTTP errors or partial, changed, duplicate or unqualified responses never confirm a combined write',async()=>{
 const patch={submissionProofPatch:{id:'p',dossierId:'d',proofRef:'receipt'},dossierPatch:{id:'d',status:'DEPOSE'}}
 for(const output of [{ok:false},reply(base()),reply({...base(),submissionProofs:[patch.submissionProofPatch]}),reply({...base(),dossiers:[{...base().dossiers[0],status:'DEPOSE'}],submissionProofs:[{...patch.submissionProofPatch,proofRef:'different'}]}),reply({...base(),dossiers:[patch.dossierPatch,patch.dossierPatch],submissionProofs:[patch.submissionProofPatch]}),reply({...base(),_source:{status:'MISSING'}})]){
  await assert.rejects(writeCssaBusinessPatch(patch,async(_url,options)=>options?.method==='POST'?output:reply(base())))
 }
})
test('empty, unsupported and malformed patches are rejected without reading or writing',async()=>{
 for(const patch of [{},{unknownPatch:{id:'x'}},{dossierPatch:null},{documentRefPatch:{id:''}}]){
  await assert.rejects(writeCssaBusinessPatch(patch,async()=>{throw Error('must not call')}))
 }
})
