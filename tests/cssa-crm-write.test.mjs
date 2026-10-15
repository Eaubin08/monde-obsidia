import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readCssaCrm,writeCssaCrm,recordCssaCrmInteraction} from '../src/cssaCrmWrite.ts'
import {readCssaCrmDirectory,writeCssaCrmDirectory} from '../server/cssa-crm-directory-store.mjs'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
import {observeCssaSource} from '../server/cssa-source-observation.mjs'
const org={id:'org',name:'Collectivité',kind:'COLLECTIVITE',status:'ACTIF',source:'UNKNOWN'}
const interaction={id:'interaction',organizationId:'org',contactId:null,caseId:null,dossierId:null,type:'NOTE',direction:'INTERNE',channel:'AUTRE',occurredAt:'2026-10-15',summary:'Pièces demandées',proof:'NON_RACCORDEE',internalPersonId:null,followupTaskId:'task-crm-interaction',source:'UNKNOWN'}
const task={id:interaction.followupTaskId,title:'Relance collectivité',description:'Suivi CRM',status:'A_FAIRE',priority:'NORMALE',dueAt:'2026-10-20',origin:'COMMERCIAL',structure:'cssa',team:null,matchRef:null,responsible:'UNKNOWN / NON ASSIGNÉ',responsiblePersonId:null,source:'Journal relationnel CRM',truthClass:'UNKNOWN',checklist:{},notes:'',history:[],relations:[{type:'CRM_ORGANIZATION',targetId:'org',label:'Collectivité'},{type:'CRM_INTERACTION',targetId:interaction.id,label:'Échange'}],caseRef:null}
const reply=data=>({ok:true,json:async()=>structuredClone(data)})
function fixture(){
 const root=mkdtempSync(join(tmpdir(),'cssa-crm-confirm-'));const crm=join(root,'crm.json'),ops=join(root,'ops.json')
 let failCrm=false,loseCrm=false,failTask=false;let crmPosts=0,opsPosts=0
 return {crm,ops,close:()=>rmSync(root,{recursive:true,force:true}),failCrm:()=>{failCrm=true},loseCrm:()=>{loseCrm=true},failTask:()=>{failTask=true},get crmPosts(){return crmPosts},get opsPosts(){return opsPosts},fetch:async(url,options)=>{
  if(url.endsWith('cssa-crm-directory')){
   if(options?.method==='POST'){
    crmPosts++;if(failCrm){failCrm=false;return {ok:false}}
    const state=writeCssaCrmDirectory(JSON.parse(options.body),crm)
    if(loseCrm){loseCrm=false;throw Error('CRM response lost after save')}
    return reply(observeCssaSource(state,crm,['organizations','contacts','interactions']))
   }
   return reply(observeCssaSource(readCssaCrmDirectory(crm),crm,['organizations','contacts','interactions']))
  }
  if(url.endsWith('cssa-ops-state')){
   if(options?.method==='POST'){
    opsPosts++;if(failTask){failTask=false;return {ok:false}}
    const state=writeCssaOpsState(JSON.parse(options.body),ops)
    return reply(observeCssaSource(state,ops,['tasks','cases','intendanceItems']))
   }
   return reply(observeCssaSource(readCssaOpsState(ops),ops,['tasks','cases','intendanceItems']))
  }
  throw Error('Unexpected endpoint '+url)
 }}
}
test('CRM read distinguishes missing and invalid local files without writing or inventing a live source',async()=>{
 const io=fixture()
 try{
  let state=await readCssaCrm(io.fetch);assert.equal(state._source.status,'MISSING');assert.deepEqual(state.organizations,[])
  writeFileSync(io.crm,'invalid-json')
  state=await readCssaCrm(io.fetch);assert.equal(state._source.status,'INVALID');assert.deepEqual(state.organizations,[])
  assert.equal(readFileSync(io.crm,'utf8'),'invalid-json');assert.equal(io.crmPosts,0)
  await assert.rejects(writeCssaCrm({organizationPatch:org},io.fetch));assert.equal(io.crmPosts,0)
 }finally{io.close()}
})
test('organization and contact initialize and confirm in the existing store, without persisting source metadata',async()=>{
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch)
  const contact={id:'contact',organizationId:org.id,displayName:'Agent',status:'ACTIF',source:'déclaration'}
  const result=await writeCssaCrm({contactPatch:contact},io.fetch)
  assert.deepEqual(result.contacts,[contact]);assert.deepEqual(result.organizations,[org]);assert.equal(result._source.status,'AVAILABLE')
  assert.equal('_source' in JSON.parse(readFileSync(io.crm,'utf8')),false)
 }finally{io.close()}
})
test('failed task creation never records an interaction link',async()=>{
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch);io.failTask()
  await assert.rejects(recordCssaCrmInteraction(interaction,task,io.fetch))
  assert.equal(io.crmPosts,1);assert.deepEqual(readCssaCrmDirectory(io.crm).interactions,[])
 }finally{io.close()}
})
test('task succeeds, interaction fails, retry preserves task progress and records exactly one exchange',async()=>{
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch);io.failCrm()
  await assert.rejects(recordCssaCrmInteraction(interaction,task,io.fetch),/relance confirmée/)
  writeCssaOpsState({taskPatch:{id:task.id,status:'EN_COURS',priority:'HAUTE',notes:'relance en cours'}},io.ops)
  const before=readCssaOpsState(io.ops).tasks.find(row=>row.id===task.id)
  const result=await recordCssaCrmInteraction(interaction,task,io.fetch)
  assert.deepEqual(result.interactions,[interaction]);assert.equal(io.opsPosts,1)
  assert.deepEqual(readCssaOpsState(io.ops).tasks.find(row=>row.id===task.id),before)
 }finally{io.close()}
})
test('lost CRM response after save reuses both existing records without a second write',async()=>{
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch);io.loseCrm()
  await assert.rejects(recordCssaCrmInteraction(interaction,task,io.fetch))
  const result=await recordCssaCrmInteraction(interaction,task,io.fetch)
  assert.deepEqual(result.interactions,[interaction]);assert.equal(io.crmPosts,2);assert.equal(io.opsPosts,1)
 }finally{io.close()}
})
test('removed or ambiguous organization and foreign contact block before any task or CRM write',async()=>{
 for(const organizations of [[],[org,org]]){
  let posts=0
  await assert.rejects(recordCssaCrmInteraction(interaction,task,async(_url,options)=>{if(options?.method==='POST')posts++;return reply({organizations,contacts:[],interactions:[],_source:{status:'AVAILABLE'}})}));assert.equal(posts,0)
 }
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch)
  writeCssaCrmDirectory({contactPatch:{id:'c',organizationId:'other'}},io.crm)
  await assert.rejects(recordCssaCrmInteraction({...interaction,contactId:'c'},task,io.fetch),/autre organisme/)
  assert.equal(io.opsPosts,0)
 }finally{io.close()}
})
test('unconfirmed HTTP, missing, duplicate or changed object responses cannot confirm a CRM creation',async()=>{
 const empty={organizations:[],contacts:[],interactions:[],_source:{status:'AVAILABLE'}}
 for(const output of [{ok:false},reply(empty),reply({...empty,organizations:[org,org]}),reply({...empty,organizations:[{...org,source:'changed'}]}),reply({...empty,organizations:[org],_source:{status:'MISSING'}})])await assert.rejects(writeCssaCrm({organizationPatch:org},async(_url,options)=>options?.method==='POST'?output:reply(empty)))
})
test('existing task with unrelated relations cannot be attached as the exchange followup',async()=>{
 const io=fixture()
 try{
  await writeCssaCrm({organizationPatch:org},io.fetch)
  writeCssaOpsState({tasks:[{...task,relations:[]}]},io.ops)
  await assert.rejects(writeCssaCrm({interactionPatch:interaction},io.fetch),/Relations/)
  assert.deepEqual(readCssaCrmDirectory(io.crm).interactions,[])
 }finally{io.close()}
})
