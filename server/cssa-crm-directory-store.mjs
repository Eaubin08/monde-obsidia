import {existsSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {resolve,dirname} from 'node:path'
import {liveDirectory} from './live-events.mjs'

export const defaultCrmDirectoryFile=resolve(liveDirectory,'cssa_crm_directory_state.json')

function now(){return new Date().toISOString()}
function emptyState(){
 return {
  version:'CSSA_CRM_DIRECTORY_V1',
  updatedAt:now(),
  organizations:[],
  contacts:[],
  interactions:[]
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

export function readCssaCrmDirectory(file=defaultCrmDirectoryFile){return load(file)}

export function writeCssaCrmDirectory(patch={},file=defaultCrmDirectoryFile){
 let state=load(file)
 if(patch.organizationPatch?.id)state={...state,organizations:upsert(state.organizations||[],patch.organizationPatch)}
 if(patch.contactPatch?.id)state={...state,contacts:upsert(state.contacts||[],patch.contactPatch)}
 if(patch.interactionPatch?.id)state={...state,interactions:upsert(state.interactions||[],patch.interactionPatch)}
 if(patch.organizationDeleteId)state={...state,organizations:remove(state.organizations||[],patch.organizationDeleteId),contacts:(state.contacts||[]).filter(x=>x.organizationId!==patch.organizationDeleteId),interactions:(state.interactions||[]).filter(x=>x.organizationId!==patch.organizationDeleteId)}
 if(patch.contactDeleteId)state={...state,contacts:remove(state.contacts||[],patch.contactDeleteId),interactions:(state.interactions||[]).map(x=>x.contactId===patch.contactDeleteId?{...x,contactId:null}:x)}
 if(patch.interactionDeleteId)state={...state,interactions:remove(state.interactions||[],patch.interactionDeleteId)}
 return save(state,file)
}
