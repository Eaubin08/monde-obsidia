import {readFileSync} from 'node:fs'
import {basename} from 'node:path'

// Read metadata only. Does not initialize, repair or write a source file.
export function observeCssaSource(state,file,lists,{fallback='EMPTY',maps=[]}={}) {
 let status='AVAILABLE'
 let parsed
 try {
  parsed=JSON.parse(readFileSync(file,'utf8'))
  if(!parsed||typeof parsed!=='object'||Array.isArray(parsed)||lists.some(key=>key in parsed&&(!Array.isArray(parsed[key])||parsed[key].some(row=>!row||typeof row!=='object'||Array.isArray(row))))||maps.some(key=>key in parsed&&(!parsed[key]||typeof parsed[key]!=='object'||Array.isArray(parsed[key]))))status='INVALID'
 } catch(error) {
  status=error.code==='ENOENT'?'MISSING':error instanceof SyntaxError?'INVALID':'UNREADABLE'
 }
 const next={...state}
 for(const key of lists) {
  if(status==='INVALID'||status==='UNREADABLE')next[key]=[]
  else if(!Array.isArray(next[key]))next[key]=[]
 }
 for(const key of maps){if(status==='INVALID'||status==='UNREADABLE'||!next[key]||typeof next[key]!=='object'||Array.isArray(next[key]))next[key]={}}
 return {...next,_source:{status,file:basename(file),observedAt:new Date().toISOString(),updatedAt:status==='AVAILABLE'&&typeof parsed.updatedAt==='string'?parsed.updatedAt:null,fallback:status==='AVAILABLE'?'NONE':status==='MISSING'?fallback:'EMPTY'}}
}
export const organisationLists=['people','roleAssignments','availabilities','engagements','authorizations']
export const businessLists=['dossiers','requirements','documentRefs','validations','submissionProofs','dossierOutcomes','revenues','expenses','stockItems','suppliers','contracts','invoices','payments','treasuryEntries','assets']
export const opsLists=['tasks','cases','intendanceItems']
