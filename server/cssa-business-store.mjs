import {existsSync, readFileSync, writeFileSync, mkdirSync} from 'node:fs'
import {resolve, dirname} from 'node:path'
import {liveDirectory} from './live-events.mjs'

export const defaultBusinessFile = resolve(liveDirectory, 'cssa_business_state.json')

function now(){return new Date().toISOString()}
function emptyState(){
  return {
    version:'CSSA_BUSINESS_STATE_V1',
    updatedAt:now(),
    dossiers:[],
    requirements:[],
    documentRefs:[],
    validations:[],
    submissionProofs:[],
    dossierOutcomes:[],
    revenues:[],
    expenses:[],
    stockItems:[],
    suppliers:[],
    contracts:[],
    invoices:[],
    payments:[],
    treasuryEntries:[],
    assets:[]
  }
}
function load(file){
  if(!existsSync(file)) return emptyState()
  try{
    const parsed=JSON.parse(readFileSync(file,'utf8'))
    return {...emptyState(),...parsed}
  }catch{return emptyState()}
}
function save(state,file){
  mkdirSync(dirname(file),{recursive:true})
  const next={...state,updatedAt:now()}
  writeFileSync(file,JSON.stringify(next,null,2),'utf8')
  return next
}
function upsert(list,item){
  const idx=list.findIndex(x=>x.id===item.id)
  if(idx<0)return [item,...list]
  const next=[...list]
  next[idx]={...next[idx],...item}
  return next
}
function remove(list,id){return list.filter(x=>x.id!==id)}

export function readCssaBusinessState(file=defaultBusinessFile){
  return load(file)
}

export function writeCssaBusinessState(patch={},file=defaultBusinessFile){
  let state=load(file)
  const mappings=[
    ['dossierPatch','dossiers'],
    ['requirementPatch','requirements'],
    ['documentRefPatch','documentRefs'],
    ['validationPatch','validations'],
    ['submissionProofPatch','submissionProofs'],
    ['dossierOutcomePatch','dossierOutcomes'],
    ['revenuePatch','revenues'],
    ['expensePatch','expenses'],
    ['stockPatch','stockItems'],
    ['supplierPatch','suppliers'],
    ['contractPatch','contracts'],
    ['invoicePatch','invoices'],
    ['paymentPatch','payments'],
    ['treasuryPatch','treasuryEntries'],
    ['assetPatch','assets']
  ]
  for(const [key,listKey] of mappings){
    if(patch[key]?.id)state={...state,[listKey]:upsert(state[listKey]||[],patch[key])}
  }
  const deletions=[
    ['dossierDeleteId','dossiers'],
    ['requirementDeleteId','requirements'],
    ['documentRefDeleteId','documentRefs'],
    ['validationDeleteId','validations'],
    ['submissionProofDeleteId','submissionProofs'],
    ['dossierOutcomeDeleteId','dossierOutcomes'],
    ['revenueDeleteId','revenues'],
    ['expenseDeleteId','expenses'],
    ['stockDeleteId','stockItems'],
    ['supplierDeleteId','suppliers'],
    ['contractDeleteId','contracts'],
    ['invoiceDeleteId','invoices'],
    ['paymentDeleteId','payments'],
    ['treasuryDeleteId','treasuryEntries'],
    ['assetDeleteId','assets']
  ]
  for(const [key,listKey] of deletions){
    if(patch[key])state={...state,[listKey]:remove(state[listKey]||[],patch[key])}
  }
  return save(state,file)
}
