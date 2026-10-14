type Row={id:string;[key:string]:unknown}
type State=Record<string,unknown>
type Result={ok:boolean;message:string;taskId:string|null;taskConfirmed:boolean;opsState?:State;businessState?:State}
const businessRoute='/obsidia-local/cssa-business-state'
const opsRoute='/obsidia-local/cssa-ops-state'
const one=(rows:Row[],id:string)=>{const matches=rows.filter(row=>row.id===id);if(matches.length!==1)throw new Error('UNKNOWN · référence absente ou ambiguë');return matches[0]}
const belongs=(task:Row,requirement:Row)=>Array.isArray(task.relations)&&task.relations.some(rel=>rel.type==='REQUIREMENT'&&rel.targetId===requirement.id)&&task.relations.some(rel=>rel.type==='DOSSIER'&&rel.targetId===requirement.dossierId)

// Uses the two existing stores. Partial writes remain explicit; no rollback or authorization.
export async function createCssaRequirementTask(requirement:{id:string;dossierId:string},draft:Row,request:typeof fetch=fetch):Promise<Result>{
 let taskId:string|null=null;let taskConfirmed=false;let opsState:State|undefined
 const read=async(route:string,list:string,allowMissing=false)=>{
  const response=await request(route,{cache:'no-store',signal:AbortSignal.timeout(4000)})
  if(!response.ok)throw new Error('UNKNOWN · source indisponible')
  const state=await response.json()
  if(!state||!Array.isArray(state[list])||!(state._source?.status==='AVAILABLE'||allowMissing&&state._source?.status==='MISSING'))throw new Error('UNKNOWN · source locale non disponible')
  return state as State
 }
 const write=async(route:string,patch:State)=>{
  const response=await request(route,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch),signal:AbortSignal.timeout(4000)})
  if(!response.ok)throw new Error('Écriture non confirmée')
  const state=await response.json()
  if(state?._source?.status!=='AVAILABLE')throw new Error('Écriture non confirmée')
  return state as State
 }
 try{
  const business=await read(businessRoute,'requirements')
  if(!Array.isArray(business.dossiers))throw new Error('UNKNOWN · registre dossiers indisponible')
  one(business.dossiers as Row[],requirement.dossierId)
  const current=one(business.requirements as Row[],requirement.id)
  if(current.dossierId!==requirement.dossierId)throw new Error('UNKNOWN · dossier de l’exigence incohérent')
  opsState=await read(opsRoute,'tasks',true)
  const tasks=(opsState._source as {status:string}).status==='AVAILABLE'?opsState.tasks as Row[]:[]
  if(current.taskRefId){
   taskId=String(current.taskRefId)
   const existing=one(tasks,taskId)
   if(!belongs(existing,current))throw new Error('UNKNOWN · relation tâche / exigence incohérente')
   taskConfirmed=true
   return {ok:true,message:'Tâche déjà liée ; aucune écriture.',taskId,taskConfirmed,opsState,businessState:business}
  }
  const related=tasks.filter(task=>belongs(task,current))
  if(related.length>1)throw new Error('UNKNOWN · plusieurs tâches liées à cette exigence')
  if(related.length===1){taskId=related[0].id;taskConfirmed=true}
  else{
   taskId=`task-dossier-${requirement.id}`
   if(tasks.some(task=>task.id===taskId))throw new Error('UNKNOWN · identifiant tâche déjà occupé')
   const task={...draft,id:taskId,title:current.label??draft.title,source:current.source??'UNKNOWN',responsiblePersonId:current.ownerPersonId??null,responsible:current.owner??'UNKNOWN / NON ASSIGNÉ',dueAt:current.dueAt??draft.dueAt}
   if(!belongs(task,current))throw new Error('UNKNOWN · relations proposées incohérentes')
   opsState=await write(opsRoute,{taskPatch:task})
   if(!Array.isArray(opsState.tasks)||!belongs(one(opsState.tasks as Row[],taskId),current))throw new Error('Création de tâche non confirmée')
   taskConfirmed=true
  }
  // Re-read before linking and patch only the reference, preserving current requirement fields.
  const latest=await read(businessRoute,'requirements')
  if(!Array.isArray(latest.dossiers))throw new Error('UNKNOWN · registre dossiers indisponible')
  one(latest.dossiers as Row[],requirement.dossierId)
  const latestRequirement=one(latest.requirements as Row[],requirement.id)
  if(latestRequirement.dossierId!==requirement.dossierId||latestRequirement.taskRefId&&latestRequirement.taskRefId!==taskId)throw new Error('UNKNOWN · exigence modifiée pendant le raccord')
  const updated=await write(businessRoute,{requirementPatch:{id:requirement.id,taskRefId:taskId}})
  if(!Array.isArray(updated.requirements)||one(updated.requirements as Row[],requirement.id).taskRefId!==taskId)throw new Error('Lien non confirmé')
  return {ok:true,message:'Tâche et lien enregistrés. La validation de l’exigence reste distincte.',taskId,taskConfirmed,opsState,businessState:updated}
 }catch(error){
  const detail=error instanceof Error?error.message:'Résultat inconnu'
  return {ok:false,message:taskConfirmed?`Tâche conservée (${taskId}), lien non confirmé : ${detail}. Un nouvel essai réutilisera la tâche.`:`Création non confirmée : ${detail}. Vérifier le registre avant toute autre action.`,taskId,taskConfirmed,opsState}
 }
}
