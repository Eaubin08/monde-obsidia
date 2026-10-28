import {cssaSourceAvailable,resolveCssaReference,referenceLabels} from './cssaLinkedReference.ts'
import {readCssaBusiness} from './cssaBusinessRead.ts'
import {writeCssaBusinessPatch} from './cssaBusinessWrite.ts'
import {readCssaCrm} from './cssaCrmWrite.ts'
type Row=Record<string,unknown>&{id:string}
type MailState={messages:Row[];drafts:Row[];_source?:{status:string}}
function validate(value:unknown):asserts value is MailState{
 const state=value as MailState
 if(!state||typeof state!=='object'||Array.isArray(state))throw new Error('Registre Mail invalide.')
 for(const list of ['messages','drafts'] as const){
  if(!Array.isArray(state[list]))throw new Error('Collection Mail invalide.')
  for(const row of state[list]){
   if(!row||typeof row!=='object'||Array.isArray(row)||['id','subject',list==='messages'?'from':'body'].some(key=>typeof row[key]!=='string')||!Array.isArray(row.to)||row.to.some(v=>typeof v!=='string'))throw new Error('Objet Mail invalide.')
   for(const field of ['organizationId','contactId','dossierId','caseId','crmInteractionId','approvedByPersonId','receivedAt','bodyPreview','source','status','proof','direction'])if(row[field]!=null&&typeof row[field]!=='string')throw new Error('Champ Mail invalide : '+field)
   if(list==='messages'&&(!Array.isArray(row.cc)||row.cc.some(v=>typeof v!=='string')||typeof row.bodyPreview!=='string'))throw new Error('Destinataires ou contenu Mail invalide.')
  }
 }
}
export async function readCssaMail<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher('/obsidia-local/cssa-mail-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source Mail indisponible.')
 const state=await response.json();validate(state);return state as T
}
function unique(rows:Row[],id:unknown,label:string){const matches=rows.filter(x=>x.id===id);if(matches.length!==1)throw new Error(label+' introuvable ou ambigu.');return matches[0]}
function same(row:Row,patch:Record<string,unknown>){return Object.entries(patch).every(([key,value])=>value===undefined||JSON.stringify(row[key])===JSON.stringify(value))}
export function mailReference(id:string|null|undefined,rows:Row[],available:boolean,field:string){
 const result=resolveCssaReference(id,rows,available)
 return result.item?String(result.item[field]||'UNKNOWN')+' · '+id:referenceLabels[result.status]+(id?' · '+id:'')
}
export async function writeCssaMail<T>(patch:Record<string,unknown>,fetcher:typeof fetch=fetch):Promise<T>{
 const entries=Object.entries(patch)
 if(entries.length!==1||!['messagePatch','draftPatch'].includes(entries[0][0]))throw new Error('Modification Mail invalide.')
 const [key,value]=entries[0],row=value as Row
 if(!row||typeof row.id!=='string'||!row.id)throw new Error('Identifiant Mail absent.')
 const current=await readCssaMail<MailState>(fetcher)
 if(!cssaSourceAvailable(current)&&current._source?.status!=='MISSING')throw new Error('Source Mail invalide ou illisible.')
 const list=key==='messagePatch'?'messages':'drafts'
 const existing=current[list].filter(x=>x.id===row.id)
 if(existing.length>1)throw new Error('Objet Mail ambigu.')
 if(key==='messagePatch'&&(!cssaSourceAvailable(current)||existing.length!==1||Object.keys(row).some(k=>!['id','dossierId'].includes(k))))throw new Error('Lien Mail invalide.')
 if(key==='draftPatch'&&(row.status!=='BROUILLON'||row.approvedByPersonId!=null||row.organizationId!=null||row.contactId!=null||typeof row.body!=='string'||typeof row.subject!=='string'||!Array.isArray(row.to)||!row.to.length||row.to.some(v=>typeof v!=='string')))throw new Error('Brouillon local invalide ; aucune autorisation déduite.')
 if(row.dossierId){const business=await readCssaBusiness<{dossiers:Row[]}>(fetcher);if(!cssaSourceAvailable(business))throw new Error('Source Dossiers indisponible.');unique(business.dossiers,row.dossierId,'Dossier')}
 if(existing.length&&same(existing[0],row))return current as T
 if(key==='draftPatch'&&existing.length)throw new Error('Identifiant de brouillon déjà utilisé pour un contenu différent.')
 const response=await fetcher('/obsidia-local/cssa-mail-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement Mail non confirmé.')
 const result=await response.json();validate(result)
 if(!cssaSourceAvailable(result)||!same(unique(result[list],row.id,'Objet enregistré'),row))throw new Error('Enregistrement Mail absent ou différent de la saisie.')
 return result as T
}
export async function ingestCssaLocalMail<T>(message:Row,fetcher:typeof fetch=fetch):Promise<{state:T;message:Row}>{
 const current=await readCssaMail<MailState>(fetcher)
 if(!cssaSourceAvailable(current)&&current._source?.status!=='MISSING')throw new Error('Source Mail invalide ou illisible.')
 const response=await fetcher('/obsidia-local/cssa-mail-ingest',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(message),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Import Mail non confirmé ; vérifier la reprise avec le même identifiant.')
 const result=await response.json();validate(result.state)
 if(!cssaSourceAvailable(result.state))throw new Error('Source Mail importée non confirmée.')
 const saved=unique(result.state.messages,message.id,'Message importé')
 if(!same(saved,message)||result.message?.id!==message.id)throw new Error('Message importé différent de la saisie.')
 if(saved.crmInteractionId){
  try{
   const crm=await readCssaCrm<{interactions:Row[];organizations:Row[];contacts:Row[]}>(fetcher)
   if(!cssaSourceAvailable(crm))throw new Error('CRM indisponible.')
   unique(crm.organizations,saved.organizationId,'Organisme')
   if(saved.contactId){const contact=unique(crm.contacts,saved.contactId,'Contact');if(contact.organizationId!==saved.organizationId)throw new Error('Contact incohérent.')}
   const interaction=unique(crm.interactions,saved.crmInteractionId,'Interaction CRM')
   if(interaction.organizationId!==saved.organizationId||interaction.contactId!==saved.contactId||interaction.type!=='EMAIL'||interaction.proof!==saved.proof)throw new Error('Interaction différente.')
  }catch{throw new Error('Message enregistré ; rapprochement CRM non confirmé. Saisie conservée pour reprise.')}
 }
 return {state:result.state as T,message:saved}
}
export async function promoteCssaMailDocument<T>(messageId:string,document:Row,requirementId:string|null,fetcher:typeof fetch=fetch):Promise<T>{
 const mail=await readCssaMail<MailState>(fetcher)
 if(!cssaSourceAvailable(mail))throw new Error('Source Mail indisponible.')
 const message=unique(mail.messages,messageId,'Message source')
 if(document.originMailId!==messageId||document.status!=='A_VERIFIER'||document.source!=='MAIL:'+messageId||document.proof!==message.proof)throw new Error('Provenance documentaire non confirmée.')
 let business=await readCssaBusiness<{documentRefs:Row[];requirements:Row[];dossiers:Row[]}>(fetcher)
 if(!cssaSourceAvailable(business))throw new Error('Source Business indisponible.')
 if(document.dossierId)unique(business.dossiers,document.dossierId,'Dossier')
 const requirement=requirementId?unique(business.requirements,requirementId,'Exigence'):null
 if(requirementId&&(!Array.isArray(document.requirementIds)||!document.requirementIds.includes(requirementId)))throw new Error('Exigence absente des références déclarées du document.')
 if(requirement&&(requirement.dossierId!==document.dossierId||requirement.documentRefId&&requirement.documentRefId!==document.id))throw new Error('Exigence d’un autre dossier ou déjà reliée à une autre pièce.')
 const old=business.documentRefs.filter(row=>row.id===document.id||row.originMailId===messageId)
 if(old.length>1||old.length===1&&!same(old[0],document))throw new Error('Document lié existant différent ou ambigu ; aucun écrasement.')
 if(!old.length)business=await writeCssaBusinessPatch({documentRefPatch:document},fetcher)
 try{
  if(requirement){
   const fresh=await readCssaBusiness<{requirements:Row[]}>(fetcher)
   if(!cssaSourceAvailable(fresh))throw new Error('Source exigences indisponible.')
   const current=unique(fresh.requirements,requirementId,'Exigence')
   if(current.dossierId!==document.dossierId||current.documentRefId&&current.documentRefId!==document.id)throw new Error('Lien d’exigence modifié.')
   // Link the received piece; never change the requirement's declared progress or validation.
   if(current.documentRefId!==document.id)business=await writeCssaBusinessPatch({requirementPatch:{id:current.id,documentRefId:document.id}},fetcher)
  }
  await writeCssaMail({messagePatch:{id:messageId,dossierId:document.dossierId??null}},fetcher)
 }catch(cause){throw new Error('Document enregistré ; liens non entièrement confirmés. '+(cause instanceof Error?cause.message:''))}
 return business as T
}
