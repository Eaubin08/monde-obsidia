import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {updateCssaCaseOrganisation} from '../src/cssaCaseUpdate.ts'
import {readCssaOpsState,writeCssaOpsState} from '../server/cssa-ops-store.mjs'
const row={id:'c',subject:'Accord',category:'ADMIN',status:'EN_ATTENTE',priority:'HAUTE',relatedOrg:'Ancien libellé',relatedOrgId:null,provenance:'UNKNOWN',truthClass:'CONTRADICTORY',contactIds:['contact-to-review'],workflow:{type:'STANDARD',authorityNote:'HOLD'},linkedTaskIds:['t'],history:[]}
const state=()=>({tasks:[],cases:[row],intendanceItems:[],_source:{status:'AVAILABLE'}})
const directory=()=>({organizations:[{id:'org',name:'Nom actuel'}],contacts:[],interactions:[],_source:{status:'AVAILABLE'}})
const reply=data=>({ok:true,json:async()=>structuredClone(data)})
test('real store association sends only fields changed and preserves workflow, provenance, contacts, tasks and truth class',async()=>{
 const root=mkdtempSync(join(tmpdir(),'cssa-case-confirm-'));const file=join(root,'ops.json');writeCssaOpsState({cases:[row]},file)
 let sent
 try{
  const result=await updateCssaCaseOrganisation('c','org',async(url,options)=>{
   if(url.endsWith('cssa-crm-directory'))return reply(directory())
   if(options?.method==='POST'){sent=JSON.parse(options.body);return reply({...writeCssaOpsState(sent,file),_source:{status:'AVAILABLE'}})}
   return reply({...readCssaOpsState(file),_source:{status:'AVAILABLE'}})
  })
  assert.deepEqual(result.cases,[{...row,relatedOrgId:'org',relatedOrg:'Nom actuel'}]);assert.deepEqual(Object.keys(sent.casePatch).sort(),['id','relatedOrg','relatedOrgId'])
 }finally{rmSync(root,{recursive:true,force:true})}
})
test('unlink is explicit and keeps the historical declared label without inferring a new organism',async()=>{
 let sent
 const result=await updateCssaCaseOrganisation('c',null,async(url,options)=>{
  assert.ok(!url.endsWith('cssa-crm-directory'))
  if(options?.method==='POST'){sent=JSON.parse(options.body);return reply({...state(),cases:[{...row,...sent.casePatch}]})}
  return reply({...state(),cases:[{...row,relatedOrgId:'org'}]})
 })
 assert.equal(result.cases[0].relatedOrg,'Ancien libellé');assert.deepEqual(sent.casePatch,{id:'c',relatedOrgId:null})
})
test('lost response retries the already confirmed relation without another POST',async()=>{
 let current=state();let posts=0
 const fetcher=async(url,options)=>{
  if(url.endsWith('cssa-crm-directory'))return reply(directory())
  if(options?.method==='POST'){posts++;current={...current,cases:[{...row,...JSON.parse(options.body).casePatch}]};throw Error('response lost')}
  return reply(current)
 }
 await assert.rejects(updateCssaCaseOrganisation('c','org',fetcher));const result=await updateCssaCaseOrganisation('c','org',fetcher)
 assert.equal(posts,1);assert.equal(result.cases[0].relatedOrgId,'org')
})
test('unknown Ops source or removed/ambiguous case blocks before writing',async()=>{
 for(const data of [{...state(),_source:{status:'MISSING'}},{...state(),_source:{status:'INVALID'}},{...state(),cases:[]},{...state(),cases:[row,row]}]){
  let posts=0;await assert.rejects(updateCssaCaseOrganisation('c','org',async(_url,options)=>{if(options?.method==='POST')posts++;return reply(data)}));assert.equal(posts,0)
 }
})
test('unavailable, removed or ambiguous canonical organization cannot be assigned',async()=>{
 for(const data of [{...directory(),_source:{status:'MISSING'}},{...directory(),organizations:[]},{...directory(),organizations:[{id:'org',name:'A'},{id:'org',name:'B'}]}]){
  let posts=0;await assert.rejects(updateCssaCaseOrganisation('c','org',async(url,options)=>{if(options?.method==='POST')posts++;return reply(url.endsWith('cssa-crm-directory')?data:state())}));assert.equal(posts,0)
 }
})
test('HTTP, stale or duplicate response cannot confirm the association',async()=>{
 for(const output of [{ok:false},reply(state()),reply({...state(),cases:[{...row,relatedOrgId:'org',relatedOrg:'Nom actuel'},{...row,relatedOrgId:'org',relatedOrg:'Nom actuel'}]})])await assert.rejects(updateCssaCaseOrganisation('c','org',async(url,options)=>url.endsWith('cssa-crm-directory')?reply(directory()):options?.method==='POST'?output:reply(state())))
})
