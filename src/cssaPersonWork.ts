import {resolveCssaReference} from './cssaLinkedReference.ts'
type Person={id:string;displayName?:string;status:string;source?:string;contact?:string;note?:string}
type Task={id:string;title:string;status:string;responsiblePersonId?:string|null;source?:string;dueAt?:string;isTestFixture?:boolean}
type Dossier={id:string;reference:string;title:string;status:string;ownerPersonId?:string|null;source?:string}
type Requirement={id:string;dossierId:string;label:string;state:string;ownerPersonId?:string|null;source?:string;dueAt?:string}
const closedDossier=(d:Dossier)=>['ATTRIBUE','NON_RETENU','ANNULE'].includes(d.status)
export function projectCssaPersonWork(personId:string,people:Person[],tasks:Task[],dossiers:Dossier[],requirements:Requirement[],available:{organisation:boolean;ops:boolean;business:boolean}){
 const person=resolveCssaReference(personId,people,available.organisation)
 if(!person.item)return {status:person.status,person:null,tasks:[] as Task[],dossiers:[] as Dossier[],requirements:[] as Requirement[]}
 return {
  status:person.status,person:person.item,
  tasks:available.ops?tasks.filter(task=>task.responsiblePersonId===personId&&task.status!=='TERMINE'&&!task.isTestFixture):[],
  dossiers:available.business?dossiers.filter(dossier=>dossier.ownerPersonId===personId&&!closedDossier(dossier)):[],
  requirements:available.business?requirements.filter(req=>req.ownerPersonId===personId&&req.state!=='SATISFAIT'&&!dossiers.some(dossier=>dossier.id===req.dossierId&&closedDossier(dossier))):[]
 }
}
