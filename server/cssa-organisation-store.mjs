import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {liveDirectory} from './live-events.mjs'

export const defaultOrganisationFile=resolve(liveDirectory,'cssa_organisation_state.json')

function now(){return new Date().toISOString()}
function emptyState(){
 return {
  version:'CSSA_ORGANISATION_STATE_V1',
  updatedAt:now(),
  people:[],
  roleAssignments:[],
  availabilities:[],
  engagements:[],
  authorizations:[]
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
function remove(list,id){return list.filter(x=>x.id!==id)}

export function readCssaOrganisationState(file=defaultOrganisationFile){return load(file)}

export function writeCssaOrganisationState(patch={},file=defaultOrganisationFile){
 let state=load(file)
 const mappings=[
  ['personPatch','people'],
  ['roleAssignmentPatch','roleAssignments'],
  ['availabilityPatch','availabilities'],
  ['engagementPatch','engagements'],
  ['authorizationPatch','authorizations']
 ]
 for(const [key,listKey] of mappings){
  if(patch[key]?.id)state={...state,[listKey]:upsert(state[listKey]||[],patch[key])}
 }
 const deletions=[
  ['personDeleteId','people'],
  ['roleAssignmentDeleteId','roleAssignments'],
  ['availabilityDeleteId','availabilities'],
  ['engagementDeleteId','engagements'],
  ['authorizationDeleteId','authorizations']
 ]
 for(const [key,listKey] of deletions){
  if(patch[key])state={...state,[listKey]:remove(state[listKey]||[],patch[key])}
 }
 return save(state,file)
}
