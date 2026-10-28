import {projectWorldObject,type WorldObject} from './worldObjectContract'
import type {ClubCalendarEvent} from './cssaSportCalendar'
import type {EconomyState} from './cssaEconomy'

export function projectWorldMatch(event:ClubCalendarEvent,available=true):WorldObject{
 return projectWorldObject({organizationId:'CSSA',domain:'SPORT',kind:'OPERATION',id:event.id,label:event.title,sourceId:event.source||'UNKNOWN',available,truth:event.truth.includes('CONFLICT')?'CONTRADICTION':event.truth==='UNKNOWN'?'UNKNOWN':'DECLARED',pattern:'EVENT_OPERATIONS_WORKSPACE',href:event.href,unknowns:[...(!event.time?['TIME_UNKNOWN']:[]),...(!event.venue?['VENUE_UNKNOWN']:[])],contradictions:event.truth.includes('CONFLICT')?['CONFLICTING_SPORT_SOURCES']:[],evidenceRefs:[],capabilities:['CALENDAR']})
}
export function projectWorldCase(dossier:{id:string;title:string;source:string;status:string;organizationId:string|null},available:boolean):WorldObject{
 return projectWorldObject({organizationId:'CSSA',domain:'BUSINESS',kind:'CASE',id:dossier.id,label:dossier.title,sourceId:dossier.source||'CSSA_BUSINESS',available,truth:'DECLARED',pattern:'CASE_WORKSPACE',href:'#cssa/dossiers/'+encodeURIComponent(dossier.id),unknowns:!dossier.organizationId?['ORGANIZATION_NOT_LINKED']:[],capabilities:['DOSSIERS']})
}
export function projectWorldActor(actor:{id:string;name:string;status:string},available:boolean):WorldObject{
 return projectWorldObject({organizationId:'CSSA',domain:'CRM',kind:'ACTOR',id:actor.id,label:actor.name,sourceId:'CSSA_CRM',available,truth:'DECLARED',pattern:'RELATIONSHIP_WORKSPACE',href:'#cssa/crm/'+encodeURIComponent(actor.id),capabilities:['CRM']})
}
export function worldEconomicRelations(actorId:string,economy:EconomyState|null):string[]{
 if(!economy||economy._source?.status!=='AVAILABLE')return []
 return [...economy.contracts.filter(c=>c.partyOrganizationId===actorId).map(c=>'CONTRACT:'+c.id),...economy.invoices.filter(i=>i.partyOrganizationId===actorId).map(i=>'INVOICE:'+i.id)]
}
