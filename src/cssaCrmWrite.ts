import {readCssaOrganisation} from './cssaOrganisationRead.ts'
import {readCssaBusiness} from './cssaBusinessRead.ts'
import {readCssaTasks} from './cssaTasksRead.ts'
import {createCssaManualTask} from './cssaTaskLifecycle.ts'
import type {OpsTask} from './CSSAOpsWorkspace'
type Row=Record<string,unknown>&{id:string}
export type CrmState={organizations:Row[];contacts:Row[];interactions:Row[];_source?:{status:string}}
const lists={organizationPatch:'organizations',contactPatch:'contacts',interactionPatch:'interactions'} as const
function validate(value:unknown):asserts value is CrmState{
 const state=value as CrmState
 if(!state||typeof state!=='object'||Array.isArray(state)||Object.values(lists).some(list=>!Array.isArray(state[list])||state[list].some(row=>!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string')))throw new Error('Répertoire CRM invalide.')
}
export async function readCssaCrm<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const response=await fetcher('/obsidia-local/cssa-crm-directory',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Source CRM indisponible.')
 const state=await response.json();validate(state);return state as T
}
function available(state:{_source?:{status:string}}){return state._source?.status==='AVAILABLE'}
function unique(id:unknown,rows:Row[],label:string){
 const matches=rows.filter(row=>row.id===id)
 if(matches.length!==1)throw new Error(`${label} introuvable ou ambigu.`)
 return matches[0]
}
async function prepare(patch:Record<string,unknown>,fetcher:typeof fetch,checkFollowup=true){
 const entries=Object.entries(patch)
 if(entries.length!==1||!Object.hasOwn(lists,entries[0][0]))throw new Error('Modification CRM invalide.')
 const [key,value]=entries[0];const row=value as Row
 if(!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string'||!row.id)throw new Error('Objet CRM invalide.')
 const state=await readCssaCrm<CrmState>(fetcher)
 if(!available(state)&&state._source?.status!=='MISSING')throw new Error('Source CRM invalide ou illisible : enregistrement bloqué.')
 const list=lists[key as keyof typeof lists]
 if(state[list].filter(item=>item.id===row.id).length>1)throw new Error('Identifiant CRM ambigu.')
 if(key!=='organizationPatch'){
  if(!available(state))throw new Error('Source CRM indisponible pour relier un organisme.')
  unique(row.organizationId,state.organizations,'Organisme')
 }
 if(row.contactId){const contact=unique(row.contactId,state.contacts,'Contact');if(contact.organizationId!==row.organizationId)throw new Error('Le contact appartient à un autre organisme.')}
 if(row.internalPersonId){
  const organisation=await readCssaOrganisation<{people:Row[];_source?:{status:string}}>(fetcher)
  if(!available(organisation))throw new Error('Source Organisation indisponible.')
  unique(row.internalPersonId,organisation.people,'Personne')
 }
 if(row.caseId||checkFollowup&&row.followupTaskId){
  const ops=await readCssaTasks(fetcher)
  if(!available(ops as {_source?:{status:string}}))throw new Error('Source Ops indisponible.')
  if(row.caseId){if(!Array.isArray(ops.cases))throw new Error('Dossiers CRM illisibles.');unique(row.caseId,ops.cases as Row[],'Dossier CRM')}
  if(checkFollowup&&row.followupTaskId){
   const task=unique(row.followupTaskId,ops.tasks as unknown as Row[],'Tâche de relance')
   const relations=task.relations as {type:string;targetId:string}[]|undefined
   if(!Array.isArray(relations)||!relations.some(rel=>rel.type==='CRM_INTERACTION'&&rel.targetId===row.id)||!relations.some(rel=>rel.type==='CRM_ORGANIZATION'&&rel.targetId===row.organizationId))throw new Error('Relations de la tâche de relance non confirmées.')
  }
 }
 if(row.dossierId){
  const business=await readCssaBusiness<{dossiers:Row[];_source?:{status:string}}>(fetcher)
  if(!available(business))throw new Error('Source Dossiers indisponible.')
  unique(row.dossierId,business.dossiers,'Dossier métier')
 }
 return {row,list,state}
}
export async function writeCssaCrm<T>(patch:Record<string,unknown>,fetcher:typeof fetch=fetch):Promise<T>{
 const {row,list,state}=await prepare(patch,fetcher)
 const confirmed=(data:CrmState)=>{
  const matches=data[list].filter(item=>item.id===row.id)
  return matches.length===1&&Object.entries(row).every(([key,value])=>matches[0][key]===value)
 }
 if(available(state)&&confirmed(state))return state as T
 const response=await fetcher('/obsidia-local/cssa-crm-directory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Enregistrement CRM non confirmé.')
 const result=await response.json();validate(result)
 if(!available(result)||!confirmed(result))throw new Error('Objet CRM absent, ambigu ou différent de la saisie.')
 return result as T
}
export async function recordCssaCrmInteraction<T>(row:Row,task:OpsTask|null,fetcher:typeof fetch=fetch):Promise<T>{
 await prepare({interactionPatch:row},fetcher,false)
 if(task){
  if(row.followupTaskId!==task.id||!task.relations.some(rel=>rel.type==='CRM_INTERACTION'&&rel.targetId===row.id)||!task.relations.some(rel=>rel.type==='CRM_ORGANIZATION'&&rel.targetId===row.organizationId))throw new Error('Lien de relance invalide.')
  await createCssaManualTask(task,fetcher)
 }
 try{return await writeCssaCrm<T>({interactionPatch:row},fetcher)}
 catch(cause){throw new Error(`${task?'Tâche de relance confirmée ; échange non confirmé. ':''}${cause instanceof Error?cause.message:'Erreur CRM.'}`)}
}
