import type {Observations, StoreId} from './cssaLiveProfile'

type Row = Record<string, unknown>
type Count = {value:number|null;label:string;route:string}
const definitions:Record<string,{store:StoreId;list:string;label:string;route:string}> = {
 organisation:{store:'organisation',list:'people',label:'personnes actives',route:'cssa-organisation-state'},
 dossiers:{store:'business',list:'dossiers',label:'dossiers actifs',route:'cssa-business-state'},
 tasks:{store:'ops',list:'tasks',label:'tâches ouvertes',route:'cssa-ops-state'},
 documents:{store:'business',list:'documentRefs',label:'documents enregistrés',route:'cssa-business-state'}
}
function rows(value:unknown):Row[]|null {
 return Array.isArray(value)&&value.every(row=>row&&typeof row==='object'&&!Array.isArray(row))?value:null
}
// Counts describe the page's initial scope, never evidence, authorization or inferred work.
export function cssaNavigationCount(id:string,observations:Observations):Count|null {
 const definition=definitions[id]
 if(!definition)return null
 const {store,list,label,route}=definition
 const unknown={value:null,label,route}
 const observation=observations[store]
 const state=observation?.state
 if(!observation?.available||!state||(state._source as {status?:string}|undefined)?.status!=='AVAILABLE')return unknown
 const items=rows(state[list])
 if(!items)return unknown
 if(id==='organisation')return {value:items.filter(row=>row.status==='ACTIF').length,label,route}
 if(id==='tasks'){
  if(items.some(row=>typeof row.status!=='string'||!row.status.trim()))return unknown
  return {value:items.filter(row=>!['TERMINE','FERME','CLOSED'].includes(String(row.status))).length,label,route}
 }
 if(id==='dossiers'){
  if(items.some(row=>typeof row.id!=='string'||typeof row.status!=='string'))return unknown
  const outcomes=rows(state.dossierOutcomes)
  if(!outcomes||outcomes.some(row=>typeof row.dossierId!=='string'))return unknown
  return {value:items.filter(row=>!['ATTRIBUE','NON_RETENU','ANNULE'].includes(String(row.status))&&!outcomes.some(outcome=>outcome.dossierId===row.id)).length,label,route}
 }
 return {value:items.length,label,route}
}
