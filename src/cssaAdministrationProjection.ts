import {cssaSourceAvailable} from './cssaLinkedReference.ts'
type Document={id:string;title:string;type:string;status:string;validUntil:string;source:string;dossierId:string|null}
type Dossier={id:string;reference:string;title:string;status:string;deadline:string}
type Task=import('./CSSAOpsWorkspace').OpsTask
type Engagement={id:string;status:string}
type Authorization={id:string;status:string}
type Sources={business:{documentRefs:Document[];dossiers:Dossier[]}|null;organisation:{engagements?:Engagement[];authorizations?:Authorization[]}|null;ops:{tasks:Task[]}|null}
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value
// Each document enters the review list once, while independent status declarations remain unchanged.
export function projectCssaAdministration(sources:Sources,today:string){
 const available={business:cssaSourceAvailable(sources.business),organisation:cssaSourceAvailable(sources.organisation),ops:cssaSourceAvailable(sources.ops)}
 const docs=available.business?sources.business?.documentRefs||[]:[]
 const dossiers=available.business?sources.business?.dossiers||[]:[]
 const tasks=(available.ops?sources.ops?.tasks||[]:[]).filter(task=>task.origin==='ADMINISTRATION'&&task.status!=='TERMINE')
 const horizon=new Date(Date.parse(today)+60*86400000).toISOString().slice(0,10)
 const expired=docs.filter(doc=>doc.status==='EXPIRE'||validDate(doc.validUntil)&&doc.validUntil<today)
 const expiring=docs.filter(doc=>validDate(doc.validUntil)&&doc.validUntil>=today&&doc.validUntil<=horizon&&doc.status!=='EXPIRE')
 const unknown=docs.filter(doc=>['A_VERIFIER','INCONNU'].includes(doc.status)||Boolean(doc.validUntil)&&!validDate(doc.validUntil))
 const review=docs.filter(doc=>expired.includes(doc)||expiring.includes(doc)||unknown.includes(doc))
 const engagements=(available.organisation?sources.organisation?.engagements||[]:[]).filter(row=>!['TERMINE','ANNULE'].includes(row.status))
 const auth=(available.organisation?sources.organisation?.authorizations||[]:[]).filter(row=>row.status!=='REVOQUEE')
 const points=available.business&&available.ops?new Set(review.map(doc=>doc.id)).size+new Set(tasks.map(task=>task.id)).size:null
 return {available,docs,dossiers,tasks,expired,expiring,unknown,review,engagements,auth,points}
}
