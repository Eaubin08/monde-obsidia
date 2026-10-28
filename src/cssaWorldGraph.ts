import {projectWorldCase} from './cssaWorldObjects.ts'
import {projectWorldObject,type WorldObject,type WorldRelation} from './worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph,type WorldReadModel,type WorldGraph} from './worldReadModel.ts'

// Read-only domain adapter. All edges require explicit IDs; names never establish relations.
type Dossier={id:string;title:string;source:string;status:string;organizationId:string|null}
type Requirement={id:string;dossierId:string;label:string;documentRefId:string|null;taskRefId:string|null}
type Document={id:string;title:string;dossierId:string|null;usedIn?:string[]}
type Task={id:string;title:string;status:string}
type Actor={id:string;name:string;status:string}
export type CssaWorldSources={
 business:{dossiers:Dossier[];requirements:Requirement[];documentRefs:Document[]}|null
 tasks:{tasks:Task[]}|null
 crm:{organizations:Actor[]}|null
}
function edge(kind:string,domain:string,objectKind:string,id:string,sourceId:string):WorldRelation{
 return {kind,target:{domain,kind:objectKind,id},sourceId,status:'RESOLVED',evidenceRefs:[]}
}
export function buildCssaWorldGraph(sources:CssaWorldSources):{model:WorldReadModel;graph:WorldGraph}{
 const objects:WorldObject[]=[]
 const business=sources.business
 const tasks=sources.tasks
 const crm=sources.crm
 if(business){
  for(const dossier of business.dossiers){
   const base=projectWorldCase(dossier,true)
   const relations:WorldRelation[]=[]
   if(dossier.organizationId)relations.push(edge('ORGANIZATION','CRM','ACTOR',dossier.organizationId,'CSSA_CRM'))
   for(const req of business.requirements.filter(r=>r.dossierId===dossier.id))relations.push(edge('REQUIREMENT','BUSINESS','REQUIREMENT',req.id,'CSSA_BUSINESS'))
   for(const doc of business.documentRefs.filter(d=>d.dossierId===dossier.id||d.usedIn?.includes(dossier.id)))relations.push(edge('DOCUMENT','BUSINESS','DOCUMENT',doc.id,'CSSA_BUSINESS'))
   objects.push({...base,relations})
  }
  for(const req of business.requirements){
   const links=[edge('DOSSIER','BUSINESS','CASE',req.dossierId,'CSSA_BUSINESS')]
   if(req.documentRefId)links.push(edge('DOCUMENT','BUSINESS','DOCUMENT',req.documentRefId,'CSSA_BUSINESS'))
   if(req.taskRefId)links.push(edge('TASK','OPS','TASK',req.taskRefId,'CSSA_OPS'))
   objects.push(projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'REQUIREMENT',id:req.id,label:req.label,sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',pattern:'REQUIREMENT_VIEW',relations:links}))
  }
  for(const doc of business.documentRefs){
   const ids=[...new Set([doc.dossierId,...(doc.usedIn||[])].filter((id):id is string=>Boolean(id)))]
   objects.push(projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'DOCUMENT',id:doc.id,label:doc.title,sourceId:'CSSA_BUSINESS',available:true,truth:'DECLARED',pattern:'DOCUMENT_VIEW',relations:ids.map(id=>edge('DOSSIER','BUSINESS','CASE',id,'CSSA_BUSINESS'))}))
  }
 }
 if(tasks)for(const task of tasks.tasks)objects.push(projectWorldObject({organizationId:'CSSA',domain:'OPS',kind:'TASK',id:task.id,label:task.title,sourceId:'CSSA_OPS',available:true,truth:'DECLARED',pattern:'TASK_VIEW'}))
 if(crm)for(const actor of crm.organizations)objects.push(projectWorldObject({organizationId:'CSSA',domain:'CRM',kind:'ACTOR',id:actor.id,label:actor.name,sourceId:'CSSA_CRM',available:true,truth:'DECLARED',pattern:'RELATIONSHIP_WORKSPACE'}))
 // Unavailable registries produce no entities. Their missing references are SOURCE_UNKNOWN.
 const model=buildWorldReadModel('CSSA',objects)
 return {model,graph:buildWorldGraph(model)}
}
