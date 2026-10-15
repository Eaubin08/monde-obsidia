import {readCssaTasks} from './cssaTasksRead.ts'
import {readCssaCrm,type CrmState} from './cssaCrmWrite.ts'
type CaseRow={id:string;relatedOrgId?:string|null;relatedOrg:string;[key:string]:unknown}
type CaseState={cases:CaseRow[];_source?:{status:string}}
export async function readCssaCases<T>(fetcher:typeof fetch=fetch):Promise<T>{
 const state=await readCssaTasks(fetcher)
 if(!Array.isArray(state.intendanceItems)||!Array.isArray(state.cases)||state.cases.some(row=>!row||typeof row!=='object'||Array.isArray(row)||['id','subject','category','status','priority','relatedOrg'].some(key=>typeof (row as Record<string,unknown>)[key]!=='string')))throw new Error('Registre des dossiers relationnels invalide.')
 return state as T
}
export async function updateCssaCaseOrganisation<T>(id:string,organizationId:string|null,fetcher:typeof fetch=fetch):Promise<T>{
 const current=await readCssaCases<CaseState>(fetcher)
 if(current._source?.status!=='AVAILABLE')throw new Error('UNKNOWN · source des dossiers relationnels indisponible.')
 const matches=current.cases.filter(row=>row.id===id)
 if(matches.length!==1)throw new Error('Dossier relationnel introuvable ou ambigu.')
 const patch:Record<string,unknown>={id,relatedOrgId:organizationId}
 if(organizationId){
  const directory=await readCssaCrm<CrmState>(fetcher)
  const organizations=directory.organizations.filter(row=>row.id===organizationId)
  if(directory._source?.status!=='AVAILABLE'||organizations.length!==1||typeof organizations[0].name!=='string'||!organizations[0].name)throw new Error('Organisme CRM introuvable ou ambigu.')
  patch.relatedOrg=organizations[0].name
 }
 const confirmed=(state:CaseState)=>{
  const rows=state.cases.filter(row=>row.id===id)
  return rows.length===1&&Object.entries(patch).every(([key,value])=>rows[0][key]===value)
 }
 if(confirmed(current))return current as T
 const response=await fetcher('/obsidia-local/cssa-ops-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({casePatch:patch}),signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Association CRM non confirmée.')
 const result=await readCssaCases<CaseState>(async()=>response)
 if(result._source?.status!=='AVAILABLE'||!confirmed(result))throw new Error('Association CRM absente, ambiguë ou différente de la demande.')
 return result as T
}
