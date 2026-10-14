import {resolveCssaReference,referenceLabels} from './cssaLinkedReference.ts'
type Dossier={id:string;reference:string;title:string;status:string;owner?:string;ownerPersonId?:string|null}
type Requirement={id:string;dossierId:string;label?:string;criticality:string;state:string;source?:string;documentRefId?:string|null;taskRefId?:string|null;owner?:string;ownerPersonId?:string|null}
type Document={id:string;title?:string;status:string;validUntil?:string}
type Person={id:string;displayName?:string;status:string}
type Task={id:string;title?:string;status:string}
type Inputs={dossiers:Dossier[];requirements:Requirement[];documents:Document[];tasks:Task[];people:Person[];businessAvailable:boolean;opsAvailable:boolean;organisationAvailable:boolean;today:string}
export type DossierLinkAttention={id:string;level:'ACTION';domain:'DOSSIER';title:string;detail:string;moduleId:'dossiers';targetId:string;reasons:string[]}
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value
// Attention is derived from recorded states; it does not validate, repair or authorize.
export function deriveCssaDossierAttention(input:Inputs):DossierLinkAttention[]{
 if(!input.businessAvailable)return []
 return input.dossiers.filter(d=>!['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status)).flatMap(d=>{
  const reasons:string[]=[]
  const person=(id:string|null|undefined,declared:string|undefined,context:string)=>{
   if(!id){reasons.push(`${context} : ${declared||'UNKNOWN'} · sans lien personne`);return}
   const result=resolveCssaReference(id,input.people,input.organisationAvailable)
   if(!result.item)reasons.push(`${context} : ${referenceLabels[result.status]} · ${id}`)
   else if(result.item.status!=='ACTIF')reasons.push(`${context} : ${result.item.displayName||id} · ${result.item.status||'UNKNOWN'}`)
  }
  person(d.ownerPersonId,d.owner,'Pilote')
  for(const req of input.requirements.filter(req=>req.dossierId===d.id)){
   const label=req.label||req.id
   const context=`${label} · source ${req.source||'UNKNOWN'}`
   if(req.criticality==='OBLIGATOIRE'&&req.state!=='SATISFAIT')reasons.push(`${context} : exigence obligatoire ${req.state||'UNKNOWN'}`)
   if(req.documentRefId){
    const doc=resolveCssaReference(req.documentRefId,input.documents,true)
    if(!doc.item)reasons.push(`${context} : document ${referenceLabels[doc.status]} · ${req.documentRefId}`)
    else{
     const date=(doc.item.validUntil||'').slice(0,10)
     if(doc.item.status==='EXPIRE'||date&&validDate(date)&&date<input.today)reasons.push(`${context} : pièce liée expirée · ${doc.item.title||doc.item.id} (exigence ${req.state})`)
     else if(date&&!validDate(date))reasons.push(`${context} : date de validité document UNKNOWN · ${doc.item.id}`)
     else if(['A_VERIFIER','INCONNU'].includes(doc.item.status))reasons.push(`${context} : document ${doc.item.status} · ${doc.item.id}`)
    }
   }
   if(req.taskRefId){
    const task=resolveCssaReference(req.taskRefId,input.tasks,input.opsAvailable)
    if(!task.item)reasons.push(`${context} : tâche ${referenceLabels[task.status]} · ${req.taskRefId}`)
   }
   if(req.criticality==='OBLIGATOIRE'&&req.state!=='SATISFAIT')person(req.ownerPersonId,req.owner,`Responsable ${label}`)
  }
  const unique=[...new Set(reasons)]
  if(!unique.length)return []
  return [{id:`dossier-links:${d.id}`,level:'ACTION',domain:'DOSSIER',title:`${d.reference} · ${d.title}`,detail:unique.slice(0,4).join(' ; ')+(unique.length>4?` ; +${unique.length-4} point(s)`:''),moduleId:'dossiers',targetId:d.id,reasons:unique}]
 })
}
