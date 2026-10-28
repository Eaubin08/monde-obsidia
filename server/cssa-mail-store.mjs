import {observeCssaSource} from './cssa-source-observation.mjs'
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

export function readCssaMailState(file=defaultMailFile){return load(file)}

export function writeCssaMailState(patch={},file=defaultMailFile){
 let state=load(file)
 const observed=observeCssaSource(state,file,['messages','drafts'])
 if(!['AVAILABLE','MISSING'].includes(observed._source.status))throw new Error('Source Mail invalide ou illisible ; écriture bloquée.')
 if(patch.messagePatch?.id)state={...state,messages:upsert(state.messages||[],patch.messagePatch)}
 if(patch.draftPatch?.id)state={...state,drafts:upsert(state.drafts||[],patch.draftPatch)}
 if(patch.messageDeleteId)state={...state,messages:(state.messages||[]).filter(x=>x.id!==patch.messageDeleteId)}
 if(patch.draftDeleteId)state={...state,drafts:(state.drafts||[]).filter(x=>x.id!==patch.draftDeleteId)}
 return save(state,file)
}

export function matchMailDirectory(message,directory,available=true){
 if(!available||[...directory.organizations,...directory.contacts,...directory.interactions].some(row=>typeof row.id!=='string'||!row.id))return {contact:null,organization:null,status:'SOURCE_UNKNOWN'}
 const normalize=v=>String(v||'').trim().toLowerCase()
 const addresses=message.direction==='SORTANT'?[...(message.to||[]),...(message.cc||[])]:[message.from]
 const emails=new Set(addresses.map(normalize).filter(Boolean))
 const contacts=directory.contacts.filter(c=>emails.has(normalize(c.email)))
 if(contacts.length>1)return {contact:null,organization:null,status:'AMBIGUOUS'}
 const contact=contacts[0]||null
 const organizations=contact?directory.organizations.filter(o=>o.id===contact.organizationId):directory.organizations.filter(o=>emails.has(normalize(o.email)))
 if(organizations.length>1||organizations[0]&&directory.organizations.filter(o=>o.id===organizations[0].id).length!==1||contact&&directory.contacts.filter(c=>c.id===contact.id).length!==1)return {contact:null,organization:null,status:'AMBIGUOUS'}
 if(organizations.length!==1)return {contact:null,organization:null,status:contact?'BROKEN':'UNLINKED'}
 return {contact,organization:organizations[0],status:'RESOLVED'}
}
export function ingestCssaMail(message={},mailFile=defaultMailFile,crmFile=defaultCrmDirectoryFile){
 const id=message.id||('mail-'+Date.now())
 const observed=observeCssaSource(load(mailFile),mailFile,['messages','drafts'])
 if(!['AVAILABLE','MISSING'].includes(observed._source.status))throw new Error('Source Mail invalide ou illisible.')
 const previous=observed.messages.filter(row=>row.id===id)
 if(previous.length>1)throw new Error('Identifiant Mail ambigu.')
 if(previous.length){
  const fields=['from','to','cc','subject','receivedAt','bodyPreview','direction','source','proof']
  if(fields.some(key=>message[key]!==undefined&&JSON.stringify(message[key])!==JSON.stringify(previous[0][key])))throw new Error('Identifiant Mail déjà utilisé avec une autre saisie.')
  return {state:load(mailFile),message:previous[0],crmInteractionId:previous[0].crmInteractionId}
 }
 const rawDirectory=readCssaCrmDirectory(crmFile)
 const directory=observeCssaSource(rawDirectory,crmFile,['organizations','contacts','interactions'])
 const {contact,organization,status:reconciliationStatus}=matchMailDirectory(message,directory,directory._source.status==='AVAILABLE')
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
  reconciliationStatus,
  status:organization?'RACCORDE_CRM':'A_RAPPROCHER',
  proof:message.proof||message.messageId||'',
  externalMessageId:message.messageId||null
 }
 let interactionId=null
 if(organization){
  interactionId='interaction-mail-'+id
  const interaction={
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
   proof:message.proof||message.messageId||'',
   internalPersonId:message.internalPersonId||null,
   followupTaskId:null,
   source:message.source||'IMPORT_MAIL_A_VERIFIER'
  }
  const old=directory.interactions.filter(row=>row.id===interactionId)
  if(old.length>1||old.length===1&&Object.entries(interaction).some(([key,value])=>JSON.stringify(old[0][key])!==JSON.stringify(value)))throw new Error('Interaction CRM existante différente ou ambiguë ; aucun écrasement.')
  if(!old.length)writeCssaCrmDirectory({interactionPatch:interaction},crmFile)
 }
 canonical.crmInteractionId=interactionId
 const state=writeCssaMailState({messagePatch:canonical},mailFile)
 return {state,message:canonical,matchedOrganization:organization||null,matchedContact:contact||null,crmInteractionId:interactionId}
}
