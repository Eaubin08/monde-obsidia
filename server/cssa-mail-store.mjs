import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {liveDirectory} from './live-events.mjs'
import {readCssaCrmDirectory,writeCssaCrmDirectory,defaultCrmDirectoryFile} from './cssa-crm-directory-store.mjs'

export const defaultMailFile=resolve(liveDirectory,'cssa_mail_state.json')

function now(){return new Date().toISOString()}
function emptyState(){
 return {
  version:'CSSA_MAIL_STATE_V1',
  updatedAt:now(),
  messages:[],
  drafts:[]
 }
}
function load(file){
 if(!existsSync(file))return emptyState()
 try{return {...emptyState(),...JSON.parse(readFileSync(file,'utf8'))}}catch{return emptyState()}
}
function save(state,file){
 mkdirSync(dirname(file),{recursive:true})
 const next={...state,updatedAt:now()}
 writeFileSync(file,JSON.stringify(next,null,2),'utf8')
 return next
}
function upsert(list,item){
 const i=list.findIndex(x=>x.id===item.id)
 if(i<0)return [item,...list]
 const next=[...list];next[i]={...next[i],...item};return next
}
function normalizeEmail(v=''){return String(v).trim().toLowerCase()}

export function readCssaMailState(file=defaultMailFile){return load(file)}

export function writeCssaMailState(patch={},file=defaultMailFile){
 let state=load(file)
 if(patch.messagePatch?.id)state={...state,messages:upsert(state.messages||[],patch.messagePatch)}
 if(patch.draftPatch?.id)state={...state,drafts:upsert(state.drafts||[],patch.draftPatch)}
 if(patch.messageDeleteId)state={...state,messages:(state.messages||[]).filter(x=>x.id!==patch.messageDeleteId)}
 if(patch.draftDeleteId)state={...state,drafts:(state.drafts||[]).filter(x=>x.id!==patch.draftDeleteId)}
 return save(state,file)
}

export function ingestCssaMail(message={},mailFile=defaultMailFile,crmFile=defaultCrmDirectoryFile){
 const id=message.id||('mail-'+Date.now())
 const sender=normalizeEmail(message.from)
 const recipients=[...(Array.isArray(message.to)?message.to:[message.to]),...(Array.isArray(message.cc)?message.cc:[message.cc])].filter(Boolean).map(normalizeEmail)
 const directory=readCssaCrmDirectory(crmFile)
 const contact=(directory.contacts||[]).find(c=>normalizeEmail(c.email)===sender)||(directory.contacts||[]).find(c=>recipients.includes(normalizeEmail(c.email)))
 const organization=contact?(directory.organizations||[]).find(o=>o.id===contact.organizationId):((directory.organizations||[]).find(o=>normalizeEmail(o.email)===sender)||(directory.organizations||[]).find(o=>recipients.includes(normalizeEmail(o.email))))
 const direction=message.direction||'ENTRANT'
 const canonical={
  id,
  threadId:message.threadId||null,
  from:message.from||'INCONNU',
  to:Array.isArray(message.to)?message.to:(message.to?[message.to]:[]),
  cc:Array.isArray(message.cc)?message.cc:(message.cc?[message.cc]:[]),
  subject:message.subject||'(sans objet)',
  receivedAt:message.receivedAt||now(),
  bodyPreview:message.bodyPreview||'',
  source:message.source||'IMPORT_MAIL_A_VERIFIER',
  direction,
  organizationId:organization?.id||null,
  contactId:contact?.id||null,
  dossierId:message.dossierId||null,
  caseId:message.caseId||null,
  crmInteractionId:null,
  status:organization?'RACCORDE_CRM':'A_RAPPROCHER',
  proof:message.proof||message.messageId||id,
  externalMessageId:message.messageId||null
 }
 let interactionId=null
 if(organization){
  interactionId='interaction-mail-'+id
  writeCssaCrmDirectory({interactionPatch:{
   id:interactionId,
   organizationId:organization.id,
   contactId:contact?.id||null,
   caseId:message.caseId||null,
   dossierId:message.dossierId||null,
   type:'EMAIL',
   direction,
   channel:'EMAIL',
   occurredAt:message.receivedAt||now(),
   summary:[message.subject,message.bodyPreview].filter(Boolean).join(' — ').slice(0,1200),
   proof:message.proof||message.messageId||id,
   internalPersonId:message.internalPersonId||null,
   followupTaskId:null,
   source:message.source||'IMPORT_MAIL_A_VERIFIER'
  }},crmFile)
 }
 canonical.crmInteractionId=interactionId
 const state=writeCssaMailState({messagePatch:canonical},mailFile)
 return {state,message:canonical,matchedOrganization:organization||null,matchedContact:contact||null,crmInteractionId:interactionId}
}
