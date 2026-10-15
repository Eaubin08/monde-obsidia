import {readCssaCrm} from './cssaCrmWrite.ts'
import {readCssaBusiness,validateCssaBusinessState} from './cssaBusinessRead.ts'
import {cssaSourceAvailable,resolveCssaReference,referenceLabels} from './cssaLinkedReference.ts'
export type Money={id:string;category:string;label:string;amount:number|null;date:string;status:string;matchRef:string|null;source:string;recordedByPersonId?:string|null}
export type Stock={id:string;label:string;channel:string;quantity:number|null;threshold:number|null;status:string;source?:string}
export type Contract={id:string;kind:string;label:string;party:string;partyOrganizationId?:string|null;startAt:string;endAt:string;amount:number|null;status:string;source:string}
export type Invoice={id:string;direction:string;number:string;party:string;partyOrganizationId?:string|null;label:string;amount:number|null;issuedAt:string;dueAt:string;status:string;source?:string;responsiblePersonId?:string|null}
export type Payment={id:string;invoiceId:string|null;direction:string;amount:number|null;date:string;method:string;account:string;status:string;source?:string;recordedByPersonId?:string|null}
export type Treasury={id:string;account:string;date:string;direction:string;label:string;amount:number|null;source:string;paymentId?:string|null;recordedByPersonId?:string|null}
export type EconomyState={revenues:Money[];expenses:Money[];stockItems:Stock[];suppliers:{id:string;name:string;organizationId?:string|null}[];contracts:Contract[];invoices:Invoice[];payments:Payment[];treasuryEntries:Treasury[];assets:{id:string}[];updatedAt?:string;_source?:{status:string}}
export type EconomyCrm={organizations:{id:string;name:string;kind:string;status:string}[];_source?:{status:string}}
export const emptyEconomy:EconomyState={revenues:[],expenses:[],stockItems:[],suppliers:[],contracts:[],invoices:[],payments:[],treasuryEntries:[],assets:[]}
export const economyLists=['revenues','expenses','stockItems','suppliers','contracts','invoices','payments','treasuryEntries','assets'] as const
export function validateCssaEconomy(value:unknown):asserts value is EconomyState{
 validateCssaBusinessState(value)
 const state=value as EconomyState
 if(!state||typeof state!=='object'||Array.isArray(state)||economyLists.some(key=>!Array.isArray(state[key])||state[key].some(row=>!row||typeof row!=='object'||Array.isArray(row)||typeof row.id!=='string')))throw new Error('Registre économique invalide.')
 const textFields=['category','label','date','status','matchRef','source','channel','kind','party','partyOrganizationId','startAt','endAt','name','organizationId','direction','number','issuedAt','dueAt','invoiceId','method','account','paymentId','recordedByPersonId','responsiblePersonId','contact','sku','location','maintenanceDueAt','acquiredAt','note']
 for(const key of economyLists)for(const row of state[key])for(const field of textFields){
  const value=(row as unknown as Record<string,unknown>)[field]
  if(value!==undefined&&value!==null&&typeof value!=='string')throw new Error('Champ économique invalide : '+field)
 }
}
export async function readCssaEconomyCrm(fetcher:typeof fetch=fetch){
 const state=await readCssaCrm<EconomyCrm>(fetcher)
 if(state.organizations.some(row=>['name','kind','status'].some(field=>typeof (row as unknown as Record<string,unknown>)[field]!=='string')))throw new Error('Organismes CRM invalides.')
 return state
}
export async function readCssaEconomy(fetcher:typeof fetch=fetch){
 const state=await readCssaBusiness<unknown>(fetcher);validateCssaEconomy(state);return state
}
export const finite=(value:unknown):value is number=>typeof value==='number'&&Number.isFinite(value)
export function sumDeclared(rows:{amount:number|null}[]):number|null{
 if(rows.some(row=>!finite(row.amount)))return null
 const ids=rows.flatMap(row=>'id' in row&&typeof row.id==='string'?[row.id]:[])
 if(new Set(ids).size!==ids.length)return null
 const value=rows.reduce((sum,row)=>sum+row.amount!,0);return finite(value)?value:null
}
export function validDay(value:unknown):value is string{
 return typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value)&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value
}
const closed=new Set(['PAYEE','ENCAISSEE','ANNULEE'])
const open=new Set(['A_PAYER','A_ENCAISSER','EN_RETARD'])
export function projectCssaEconomy(state:EconomyState|null,today:string){
 const available=cssaSourceAvailable(state)
 const revenues=available?state!.revenues:[],expenses=available?state!.expenses:[],invoices=available?state!.invoices:[],payments=available?state!.payments:[],treasury=available?state!.treasuryEntries:[]
 const revenueTotal=available?sumDeclared(revenues):null,expenseTotal=available?sumDeclared(expenses):null
 const invoiceUnknown=new Set(invoices.map(x=>x.id)).size!==invoices.length||invoices.some(x=>!['EMISE','RECUE'].includes(x.direction)||!closed.has(x.status)&&!open.has(x.status)||x.direction==='EMISE'&&x.status==='PAYEE'||x.direction==='RECUE'&&x.status==='ENCAISSEE')
 const directed=(rows:{amount:number|null;direction:string}[],direction:string)=>!available||new Set(rows.map(x=>'id' in x?x.id:undefined)).size!==rows.length||rows.some(x=>!['ENTREE','SORTIE'].includes(x.direction))?null:sumDeclared(rows.filter(x=>x.direction===direction))
 const cashIn=directed(treasury,'ENTREE'),cashOut=directed(treasury,'SORTIE')
 const overdue=invoices.filter(x=>validDay(x.dueAt)&&x.dueAt<today&&!closed.has(x.status))
 const invalidDates=invoices.filter(x=>x.dueAt&&!validDay(x.dueAt))
 return {available,revenueTotal,expenseTotal,result:revenueTotal===null||expenseTotal===null||!finite(revenueTotal-expenseTotal)?null:revenueTotal-expenseTotal,
  receivable:!available||invoiceUnknown?null:sumDeclared(invoices.filter(x=>x.direction==='EMISE'&&!closed.has(x.status))),
  payable:!available||invoiceUnknown?null:sumDeclared(invoices.filter(x=>x.direction==='RECUE'&&!closed.has(x.status))),
  cash:cashIn===null||cashOut===null||!finite(cashIn-cashOut)?null:cashIn-cashOut,paymentIn:directed(payments,'ENTREE'),paymentOut:directed(payments,'SORTIE'),overdue,invalidDates,invoiceUnknown}
}
export function economicParty(id:string|null|undefined,declared:string|undefined,crm:EconomyCrm|null){
 if(!id)return (declared||'UNKNOWN')+' · déclaré, sans lien CRM'
 const ref=resolveCssaReference(id,crm?.organizations??[],cssaSourceAvailable(crm))
 return ref.item?`${ref.item.name||'UNKNOWN'} · ${ref.item.status||'UNKNOWN'} · ${id}`:`${referenceLabels[ref.status]} · ${id}`
}
