import {readCssaEconomy,readCssaEconomyCrm,projectCssaEconomy,economicParty,type EconomyState} from './cssaEconomy'
import {readCssaOrganisation} from './cssaOrganisationRead'
import {cssaSourceAvailable} from './cssaLinkedReference'
import {resolveCssaPerson} from './cssaPeopleProjection'
import CSSAStoreSourceNotice from './CSSAStoreSourceNotice'
import {writeCssaEconomy} from './cssaEconomyWrite'
import {writeCssaBusinessPatch} from './cssaBusinessWrite'
import {createCssaRequirementTask} from './cssaRequirementTask'
import {useEffect,useMemo,useState,useRef} from 'react'
import './CSSABusiness.css'

type DossierType='APPEL_OFFRES'|'CONSULTATION'|'SUBVENTION'|'PARTENARIAT'|'CONVENTION'|'DOSSIER_INSTITUTIONNEL'
type DossierStatus='BROUILLON'|'EN_PREPARATION'|'A_VALIDER'|'VALIDE'|'PRET_A_DEPOSER'|'DEPOSE'|'ATTRIBUE'|'NON_RETENU'|'ANNULE'
type Dossier={id:string;reference:string;type:DossierType;title:string;organization:string;organizationId?:string|null;deadline:string;status:DossierStatus;source:string;owner:string;ownerPersonId?:string|null;submissionChannel:string;createdAt:string}
type Requirement={id:string;dossierId:string;label:string;category:string;criticality:'OBLIGATOIRE'|'RECOMMANDE'|'OPTIONNEL'|'INCONNU';state:'SATISFAIT'|'MANQUANT'|'A_VERIFIER'|'EN_COURS'|'BLOQUE'|'INCONNU';source:string;documentRefId:string|null;taskRefId:string|null;owner:string;ownerPersonId?:string|null;dueAt:string;validationRequired:boolean}
type DocumentRef={id:string;dossierId:string|null;type:string;title:string;version:string;status:'VALIDE'|'EXPIRE'|'A_VERIFIER'|'INCONNU';issuedAt:string;validUntil:string;source:string;fileRef:string;usedIn:string[];originType?:string;originMailId?:string|null;requirementIds?:string[];receivedAt?:string;proof?:string}
type Validation={id:string;dossierId:string;type:string;status:'EN_ATTENTE'|'VALIDE'|'REFUSE'|'HOLD';requiredRole:string;decidedBy:string|null;decidedAt:string|null;comment:string}
type SubmissionProof={id:string;dossierId:string;channel:string;submittedAt:string;externalReference:string;proofRef:string;submittedByPersonId:string|null;status:'CONFIRME'|'A_VERIFIER';source:string}
type DossierOutcome={id:string;dossierId:string;result:'ATTRIBUE'|'NON_RETENU'|'ANNULE';decidedAt:string;externalReference:string;proofRef:string;amount:number|null;source:string;note:string}
type MoneyRow={id:string;category:string;label:string;amount:number;date:string;status:string;matchRef:string|null;source:string;note:string;recordedByPersonId?:string|null}
type StockItem={id:string;channel:'BUVETTE'|'BOUTIQUE'|'SPORT'|'AUTRE';label:string;sku:string;quantity:number;unitCost:number|null;salePrice:number|null;threshold:number|null;supplierId:string|null;status:string}
type Supplier={id:string;name:string;category:string;contact:string;status:string;source:string;organizationId?:string|null}
type Contract={id:string;kind:string;label:string;party:string;partyOrganizationId?:string|null;startAt:string;endAt:string;amount:number|null;status:string;source:string}
type Invoice={id:string;direction:'EMISE'|'RECUE';number:string;party:string;partyOrganizationId?:string|null;label:string;amount:number;issuedAt:string;dueAt:string;status:'A_PAYER'|'A_ENCAISSER'|'PAYEE'|'ENCAISSEE'|'EN_RETARD'|'ANNULEE';dossierId:string|null;source:string;responsiblePersonId?:string|null}
type Payment={id:string;invoiceId:string|null;direction:'ENTREE'|'SORTIE';amount:number;date:string;method:string;account:string;status:string;source:string;recordedByPersonId?:string|null}
type TreasuryEntry={id:string;account:string;date:string;direction:'ENTREE'|'SORTIE';label:string;amount:number;source:string;paymentId:string|null;recordedByPersonId?:string|null}
type Asset={id:string;kind:'VEHICULE'|'MATERIEL_SPORTIF'|'INFORMATIQUE'|'INFRASTRUCTURE'|'AUTRE';label:string;status:string;location:string;acquiredAt:string;maintenanceDueAt:string;value:number|null;source:string}
type BusinessState={version:string;updatedAt:string;dossiers:Dossier[];requirements:Requirement[];documentRefs:DocumentRef[];validations:Validation[];submissionProofs:SubmissionProof[];dossierOutcomes:DossierOutcome[];revenues:MoneyRow[];expenses:MoneyRow[];stockItems:StockItem[];suppliers:Supplier[];contracts:Contract[];invoices:Invoice[];payments:Payment[];treasuryEntries:TreasuryEntry[];assets:Asset[]}
type OrgPerson={id:string;displayName:string;status:string}
type OrgAuthorization={id:string;personId:string;scope:string;action:string;status:string}
type OrgState={people:OrgPerson[];authorizations:OrgAuthorization[]}
type ExternalOrganization={id:string;name:string;kind:string;status:string}
type ExternalInteraction={id:string;organizationId:string;contactId:string|null;caseId:string|null;dossierId:string|null;type:string;direction:string;channel:string;occurredAt:string;summary:string;proof:string;internalPersonId:string|null;followupTaskId:string|null;source:string}
type CrmDirectoryState={organizations:ExternalOrganization[];interactions:ExternalInteraction[]}

type Mode='dossiers'|'documents'|'commerce'|'finance'
type Props={mode:Mode;selectedId?:string;onOpen?:(moduleId:string,id?:string)=>void}

const revenueCategories=['BILLETTERIE','BUVETTE','BOUTIQUE','SPONSORING','PARTENARIAT','SUBVENTION','COTISATION_LICENCE','STAGE_CAMP','EVENEMENT','LOCATION','DON_MECENAT','MEDIA_AUTRE']
const expenseCategories=['SALAIRES_INDEMNITES','DEPLACEMENT','HEBERGEMENT','ARBITRAGE_OFFICIELS','EQUIPEMENT','MEDICAL','ASSURANCE','LICENCE_FEDERATION','SECURITE','ENTRETIEN_ENERGIE','TERRAIN_STADE','COMMUNICATION','INFORMATIQUE','FRAIS_BANCAIRES','PRESTATAIRE','RESTAURATION','ACHAT_BUVETTE','ACHAT_BOUTIQUE','AUTRE']
const dossierTypes:DossierType[]=['APPEL_OFFRES','CONSULTATION','SUBVENTION','PARTENARIAT','CONVENTION','DOSSIER_INSTITUTIONNEL']

function human(v:string){return String(v||'UNKNOWN').replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())}
function euro(v:number|null){return typeof v==='number'&&Number.isFinite(v)?new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v):'UNKNOWN'}
function uid(prefix:string){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

export default function CSSABusinessPage({mode,selectedId,onOpen}:Props){
 const [state,setState]=useState<BusinessState|null>(null)
 const [orgState,setOrgState]=useState<OrgState|null>(null)
 const [crmDirectory,setCrmDirectory]=useState<CrmDirectoryState|null>(null)
 const [error,setError]=useState(false)
 const [selected,setSelected]=useState(selectedId||'')
 const [tab,setTab]=useState('overview')
 const [showCreate,setShowCreate]=useState(false)
 const [form,setForm]=useState<Record<string,string>>({type:'APPEL_OFFRES',status:'BROUILLON'})
 const writing=useRef(false)
 const [writeBusy,setWriteBusy]=useState(false)
 const [writeMessage,setWriteMessage]=useState('')
 const [writeFailed,setWriteFailed]=useState(false)
 const pendingIds=useRef<Record<string,string>>({})
 const generation=useRef(0)
 const active=useRef(true)
 const operationId=(prefix:string)=>pendingIds.current[prefix]??(pendingIds.current[prefix]=uid(prefix))
 const creatingTask=useRef(false)
 const [taskBusy,setTaskBusy]=useState(false)
 const [taskMessage,setTaskMessage]=useState('')
 const [moneyKind,setMoneyKind]=useState<'revenue'|'expense'>('revenue')

 const economyMode=mode==='commerce'||mode==='finance'
 const refresh=async()=>{
  if(writing.current||creatingTask.current)return
  const request=++generation.current
  if(economyMode){
   const [business,organisation,crm]=await Promise.allSettled([readCssaEconomy(),readCssaOrganisation<OrgState>(),readCssaEconomyCrm()])
   if(!active.current||request!==generation.current)return
   setState(business.status==='fulfilled'?business.value as unknown as BusinessState:null)
   setError(business.status==='rejected')
   setOrgState(organisation.status==='fulfilled'&&cssaSourceAvailable(organisation.value)?organisation.value:null)
   setCrmDirectory(crm.status==='fulfilled'&&cssaSourceAvailable(crm.value)?crm.value as unknown as CrmDirectoryState:null)
   return
  }
  try{
   const [r,orgRes,crmRes]=await Promise.all([
    fetch('/obsidia-local/cssa-business-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-organisation-state',{cache:'no-store'}),
    fetch('/obsidia-local/cssa-crm-directory',{cache:'no-store'})
   ])
   if(!r.ok)throw new Error('business state unavailable')
   const data=await r.json()
   if(!active.current||request!==generation.current)return
   setState(data);setError(false)
   if(orgRes.ok)setOrgState(await orgRes.json())
   if(crmRes.ok)setCrmDirectory(await crmRes.json())
   if(mode==='dossiers'&&!selected&&data.dossiers?.length)setSelected(data.dossiers[0].id)
  }catch{if(active.current&&request===generation.current)setError(true)}
 }
 useEffect(()=>{
  active.current=true;void refresh()
  const events=economyMode?['cssa-business-updated','cssa-crm-updated','cssa-organisation-updated']:[]
  const timer=economyMode?window.setInterval(refresh,15000):null
  for(const event of events)window.addEventListener(event,refresh)
  return()=>{active.current=false;generation.current++;if(timer!==null)window.clearInterval(timer);for(const event of events)window.removeEventListener(event,refresh)}
 },[])
 useEffect(()=>{if(selectedId)setSelected(selectedId)},[selectedId])

 const post=async(patch:Record<string,unknown>)=>{
  if(writing.current||creatingTask.current)return false
  writing.current=true;generation.current++
  setWriteBusy(true);setWriteMessage('Enregistrement en cours…');setWriteFailed(false)
  try{
   let data:BusinessState
   if(mode==='dossiers'||mode==='documents')data=await writeCssaBusinessPatch<BusinessState>(patch)
   else data=await writeCssaEconomy<BusinessState>(patch)
   for(const [prefix,id] of Object.entries(pendingIds.current))if(Object.values(patch).some(value=>value&&typeof value==='object'&&(value as {id?:string}).id===id))delete pendingIds.current[prefix]
   if(active.current){setState(data);setError(false);setWriteMessage('Enregistrement confirmé dans le registre local.');setWriteFailed(false)}
   window.dispatchEvent(new CustomEvent('cssa-business-updated',{detail:data}))
   return active.current
  }catch(cause){
   if(active.current){setWriteMessage(`${cause instanceof Error?cause.message:'Enregistrement non confirmé.'} Saisie conservée ; réessayez sans recharger la page.`);setWriteFailed(true)}
   window.dispatchEvent(new Event('cssa-business-updated'))
   return false
  }finally{writing.current=false;if(active.current)setWriteBusy(false)}
 }
 const writeNotice=writeMessage?<p className="biz-proof-review" role={writeFailed?'alert':'status'}>{writeMessage}</p>:null

 const activePeople=orgState?.people.filter(p=>p.status==='ACTIF')||[]
 const personName=(id?:string|null)=>economyMode?resolveCssaPerson(id,undefined,orgState):id?(orgState?.people.find(p=>p.id===id)?.displayName||'PERSONNE INCONNUE'):'NON ASSIGNÉ'
 const externalName=(id?:string|null)=>economyMode?economicParty(id,undefined,crmDirectory):id?(crmDirectory?.organizations.find(o=>o.id===id)?.name||'ORGANISME INCONNU'):'NON RACCORDE'
 const canonicalExternalName=(id:string)=>{const rows=crmDirectory?.organizations.filter(row=>row.id===id)||[];return rows.length===1?rows[0].name:'UNKNOWN'}
 const hasExplicitAuthorization=(personId?:string|null,scope='DOSSIER')=>Boolean(personId&&orgState?.authorizations.some(a=>a.personId===personId&&a.status==='ACCORDEE'&&(a.scope.toUpperCase()===scope||a.scope.toUpperCase()==='TOUT')))

 const dossier=state?.dossiers.find(d=>d.id===selected)||null
 const reqs=useMemo(()=>state?.requirements.filter(r=>r.dossierId===selected)||[],[state,selected])
 const docs=useMemo(()=>state?.documentRefs.filter(d=>!d.dossierId||d.dossierId===selected||d.usedIn?.includes(selected))||[],[state,selected])
 const vals=useMemo(()=>state?.validations.filter(v=>v.dossierId===selected)||[],[state,selected])
 const required=reqs.filter(r=>r.criticality==='OBLIGATOIRE')
 const satisfied=required.filter(r=>r.state==='SATISFAIT').length
 const toValidate=vals.filter(v=>v.status==='EN_ATTENTE'||v.status==='HOLD').length
 const blockingRequired=required.filter(r=>r.state!=='SATISFAIT')
 const finalValidation=vals.find(v=>v.type==='REVUE_FINALE')
 const submissionProof=state?.submissionProofs.find(p=>p.dossierId===selected)||null
 const dossierOutcome=state?.dossierOutcomes.find(o=>o.dossierId===selected)||null
 const dossierReady=Boolean(dossier)&&required.length>0&&blockingRequired.length===0&&finalValidation?.status==='VALIDE'
 const dossierLate=Boolean(dossier?.deadline)&&new Date(dossier!.deadline).getTime()<Date.now()&&!['DEPOSE','ATTRIBUE','NON_RETENU','ANNULE'].includes(dossier!.status)
 const revenues=state?.revenues||[], expenses=state?.expenses||[]
 const invoiceOpen=(state?.invoices||[]).filter(x=>!['PAYEE','ENCAISSEE','ANNULEE'].includes(x.status)).length
 const today=new Date().toISOString().slice(0,10)
 const overdueInvoices=(state?.invoices||[]).filter(x=>x.dueAt&&x.dueAt<today&&!['PAYEE','ENCAISSEE','ANNULEE'].includes(x.status))
 const lowStock=(state?.stockItems||[]).filter(x=>x.threshold!=null&&x.quantity<=Number(x.threshold))
 const expiringContracts=(state?.contracts||[]).filter(x=>x.endAt&&x.endAt>=today&&x.endAt<=new Date(Date.now()+30*86400000).toISOString().slice(0,10))
 const maintenanceDue=(state?.assets||[]).filter(x=>x.maintenanceDueAt&&x.maintenanceDueAt<=new Date(Date.now()+30*86400000).toISOString().slice(0,10))
 const attentionCount=overdueInvoices.length+lowStock.length+expiringContracts.length+maintenanceDue.length

 const changeDossierStatus=async(next:DossierStatus)=>{
  if(!dossier)return
  if(next==='PRET_A_DEPOSER'&&!dossierReady)return
  if(next==='DEPOSE'&&(!dossierReady||!submissionProof))return
  if(['ATTRIBUE','NON_RETENU'].includes(next)&&!dossierOutcome)return
  await post({dossierPatch:{id:dossier.id,status:next}})
 }

 const recordSubmissionProof=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!dossier||!dossierReady||!form.submissionProofRef?.trim()||!form.submissionAt)return
  const proof:SubmissionProof={
   id:submissionProof?.id||operationId('submission:'+dossier.id),
   dossierId:dossier.id,
   channel:form.submissionChannel?.trim()||dossier.submissionChannel||'INCONNU',
   submittedAt:form.submissionAt,
   externalReference:form.submissionExternalRef?.trim()||'INCONNU',
   proofRef:form.submissionProofRef.trim(),
   submittedByPersonId:form.submittedByPersonId||null,
   status:'CONFIRME',
   source:form.submissionSource?.trim()||'SAISIE_INTERNE_AVEC_PREUVE'
  }
  if(!await post({submissionProofPatch:proof,dossierPatch:{id:dossier.id,status:'DEPOSE'}}))return
  setForm({...form,submissionAt:'',submissionExternalRef:'',submissionProofRef:'',submissionSource:''})
 }

 const recordOutcome=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!dossier||!submissionProof||!form.outcomeResult||!form.outcomeProofRef?.trim())return
  const result=form.outcomeResult as DossierOutcome['result']
  const outcome:DossierOutcome={
   id:dossierOutcome?.id||operationId('outcome:'+dossier.id),
   dossierId:dossier.id,
   result,
   decidedAt:form.outcomeDate||new Date().toISOString().slice(0,10),
   externalReference:form.outcomeExternalRef?.trim()||'INCONNU',
   proofRef:form.outcomeProofRef.trim(),
   amount:form.outcomeAmount?Number(form.outcomeAmount):null,
   source:form.outcomeSource?.trim()||'SAISIE_INTERNE_AVEC_PREUVE',
   note:form.outcomeNote?.trim()||''
  }
  if(!await post({dossierOutcomePatch:outcome,dossierPatch:{id:dossier.id,status:result}}))return
  setForm({...form,outcomeExternalRef:'',outcomeProofRef:'',outcomeAmount:'',outcomeSource:'',outcomeNote:''})
 }

 const createDossier=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.title?.trim())return
  const id=operationId('dossier')
  const d:Dossier={id,reference:form.reference?.trim()||id.toUpperCase(),type:(form.type||'APPEL_OFFRES') as DossierType,title:form.title.trim(),organization:form.organizationId?externalName(form.organizationId):(form.organization?.trim()||'INCONNU'),organizationId:form.organizationId||null,deadline:form.deadline||'',status:'BROUILLON',source:form.source?.trim()||'INCONNU',owner:form.ownerPersonId?personName(form.ownerPersonId):'UNKNOWN / NON ASSIGNÉ',ownerPersonId:form.ownerPersonId||null,submissionChannel:form.submissionChannel?.trim()||'INCONNU',createdAt:new Date().toISOString()}
  if(!await post({dossierPatch:d}))return;setSelected(id);setShowCreate(false);setForm({type:'APPEL_OFFRES',status:'BROUILLON'});setTab('overview')
 }
 const addRequirement=async(e:React.FormEvent)=>{
  e.preventDefault();if(!dossier||!form.reqLabel?.trim())return
  const r:Requirement={id:operationId('req:'+dossier.id),dossierId:dossier.id,label:form.reqLabel.trim(),category:form.reqCategory||'ADMINISTRATIF',criticality:(form.reqCriticality||'OBLIGATOIRE') as any,state:'A_VERIFIER',source:form.reqSource?.trim()||'INCONNU',documentRefId:null,taskRefId:null,owner:dossier.ownerPersonId?personName(dossier.ownerPersonId):'UNKNOWN / NON ASSIGNÉ',ownerPersonId:dossier.ownerPersonId||null,dueAt:form.reqDueAt||dossier.deadline,validationRequired:true}
  if(!await post({requirementPatch:r}))return;setForm({...form,reqLabel:'',reqSource:'',reqDueAt:''})
 }
 const createTaskForRequirement=async(r:Requirement)=>{
  if(creatingTask.current||writing.current)return
  creatingTask.current=true;setTaskBusy(true);setTaskMessage('Enregistrement de la tâche et du lien…')
  try{
  const task={id:'candidate',title:r.label,description:'Action liée au dossier '+(dossier?.reference||selected),status:'A_FAIRE',priority:r.criticality==='OBLIGATOIRE'?'HAUTE':'NORMALE',dueAt:r.dueAt||dossier?.deadline||'',origin:'ADMINISTRATION',structure:'cssa',team:null,matchRef:null,responsible:r.ownerPersonId?personName(r.ownerPersonId):'UNKNOWN / NON ASSIGNÉ',responsiblePersonId:r.ownerPersonId||null,source:r.source||'Dossier CSSA',truthClass:'UNKNOWN',checklist:{},notes:'',history:[{at:new Date().toISOString(),action:'CREATION',note:'Créée depuis une exigence dossier'}],relations:[{type:'DOSSIER',targetId:r.dossierId,label:dossier?.reference||selected},{type:'REQUIREMENT',targetId:r.id,label:r.label}],caseRef:null}
   const result=await createCssaRequirementTask(r,task)
   if(result.opsState)window.dispatchEvent(new CustomEvent('cssa-ops-updated',{detail:result.opsState}))
   if(result.businessState){const data=result.businessState as BusinessState;setState(data);window.dispatchEvent(new CustomEvent('cssa-business-updated',{detail:data}))}
   setTaskMessage(result.message)
  }finally{creatingTask.current=false;setTaskBusy(false)}
 }

 const addDocument=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.docTitle?.trim())return
  const doc:DocumentRef={id:operationId('doc'),dossierId:mode==='dossiers'?dossier?.id||null:null,type:form.docType||'AUTRE',title:form.docTitle.trim(),version:form.docVersion||'1',status:'A_VERIFIER',issuedAt:form.docIssuedAt||'',validUntil:form.docValidUntil||'',source:form.docSource?.trim()||'INCONNU',fileRef:form.docFileRef?.trim()||'NON_RACCORDE',usedIn:mode==='dossiers'&&dossier?[dossier.id]:[]}
  if(!await post({documentRefPatch:doc}))return;setForm({...form,docTitle:'',docSource:'',docFileRef:''})
 }
 const addMoney=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.moneyLabel?.trim()||!form.moneyAmount)return
  const row:MoneyRow={id:operationId(moneyKind==='revenue'?'rev':'exp'),category:form.moneyCategory||'AUTRE',label:form.moneyLabel.trim(),amount:Number(form.moneyAmount||0),date:form.moneyDate||new Date().toISOString().slice(0,10),status:'OBSERVE_SAISI',matchRef:form.moneyMatchRef?.trim()||null,source:form.moneySource?.trim()||'SAISIE_INTERNE_A_VERIFIER',note:form.moneyNote?.trim()||'',recordedByPersonId:form.moneyPersonId||null}
  if(!await post({[moneyKind==='revenue'?'revenuePatch':'expensePatch']:row}))return;setForm({...form,moneyLabel:'',moneyAmount:'',moneyMatchRef:'',moneySource:'',moneyNote:''})
 }
 const addStock=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.stockLabel?.trim()||!form.stockQty)return
  const item:StockItem={id:operationId('stock'),channel:(form.stockChannel||'BUVETTE') as any,label:form.stockLabel.trim(),sku:form.stockSku||'',quantity:Number(form.stockQty||0),unitCost:form.stockCost?Number(form.stockCost):null,salePrice:form.stockPrice?Number(form.stockPrice):null,threshold:form.stockThreshold?Number(form.stockThreshold):null,supplierId:null,status:'A_VERIFIER'}
  if(!await post({stockPatch:item}))return;setForm({...form,stockLabel:'',stockSku:'',stockQty:'',stockCost:'',stockPrice:'',stockThreshold:''})
 }
 const addContract=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.contractLabel?.trim())return
  const row:Contract={id:operationId('contract'),kind:form.contractKind||'FOURNISSEUR',label:form.contractLabel.trim(),party:form.contractOrganizationId?canonicalExternalName(form.contractOrganizationId):(form.contractParty?.trim()||'INCONNU'),partyOrganizationId:form.contractOrganizationId||null,startAt:form.contractStart||'',endAt:form.contractEnd||'',amount:form.contractAmount?Number(form.contractAmount):null,status:'A_VERIFIER',source:form.contractSource?.trim()||'INCONNU'}
  if(!await post({contractPatch:row}))return;setForm({...form,contractLabel:'',contractParty:'',contractAmount:'',contractSource:''})
 }
 const addSupplier=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.supplierOrganizationId&&!form.supplierName?.trim())return
  const row:Supplier={id:operationId('supplier'),name:form.supplierOrganizationId?canonicalExternalName(form.supplierOrganizationId):form.supplierName!.trim(),category:form.supplierCategory||'AUTRE',contact:form.supplierContact?.trim()||'INCONNU',status:'A_VERIFIER',source:form.supplierSource?.trim()||'INCONNU',organizationId:form.supplierOrganizationId||null}
  if(!await post({supplierPatch:row}))return;setForm({...form,supplierName:'',supplierContact:'',supplierSource:''})
 }
 const addInvoice=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.invoiceLabel?.trim()||!form.invoiceAmount)return
  const direction=(form.invoiceDirection||'RECUE') as 'EMISE'|'RECUE'
  const row:Invoice={id:operationId('invoice'),direction,number:form.invoiceNumber?.trim()||'SANS_REFERENCE',party:form.invoiceOrganizationId?canonicalExternalName(form.invoiceOrganizationId):(form.invoiceParty?.trim()||'INCONNU'),partyOrganizationId:form.invoiceOrganizationId||null,label:form.invoiceLabel.trim(),amount:Number(form.invoiceAmount||0),issuedAt:form.invoiceIssuedAt||new Date().toISOString().slice(0,10),dueAt:form.invoiceDueAt||'',status:(direction==='EMISE'?'A_ENCAISSER':'A_PAYER'),dossierId:form.invoiceDossier?.trim()||null,source:form.invoiceSource?.trim()||'SAISIE_INTERNE_A_VERIFIER',responsiblePersonId:form.invoicePersonId||null}
  if(!await post({invoicePatch:row}))return;setForm({...form,invoiceNumber:'',invoiceParty:'',invoiceLabel:'',invoiceAmount:'',invoiceDossier:'',invoiceSource:''})
 }
 const addPayment=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.paymentAmount)return
  const row:Payment={id:operationId('payment'),invoiceId:form.paymentInvoice?.trim()||null,direction:(form.paymentDirection||'SORTIE') as 'ENTREE'|'SORTIE',amount:Number(form.paymentAmount),date:form.paymentDate||new Date().toISOString().slice(0,10),method:form.paymentMethod||'INCONNU',account:form.paymentAccount?.trim()||'INCONNU',status:'A_VERIFIER',source:form.paymentSource?.trim()||'SAISIE_INTERNE_A_VERIFIER',recordedByPersonId:form.paymentPersonId||null}
  if(!await post({paymentPatch:row}))return;setForm({...form,paymentAmount:'',paymentInvoice:'',paymentSource:''})
 }
 const addTreasury=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.treasuryLabel?.trim()||!form.treasuryAmount)return
  const row:TreasuryEntry={id:operationId('treasury'),account:form.treasuryAccount?.trim()||'CAISSE_INCONNUE',date:form.treasuryDate||new Date().toISOString().slice(0,10),direction:(form.treasuryDirection||'ENTREE') as 'ENTREE'|'SORTIE',label:form.treasuryLabel.trim(),amount:Number(form.treasuryAmount||0),source:form.treasurySource?.trim()||'SAISIE_INTERNE_A_VERIFIER',paymentId:null,recordedByPersonId:form.treasuryPersonId||null}
  if(!await post({treasuryPatch:row}))return;setForm({...form,treasuryLabel:'',treasuryAmount:'',treasurySource:''})
 }
 const addAsset=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.assetLabel?.trim())return
  const row:Asset={id:operationId('asset'),kind:(form.assetKind||'AUTRE') as Asset['kind'],label:form.assetLabel.trim(),status:'A_VERIFIER',location:form.assetLocation?.trim()||'INCONNU',acquiredAt:form.assetAcquired||'',maintenanceDueAt:form.assetMaintenance||'',value:form.assetValue?Number(form.assetValue):null,source:form.assetSource?.trim()||'INCONNU'}
  if(!await post({assetPatch:row}))return;setForm({...form,assetLabel:'',assetLocation:'',assetValue:'',assetSource:''})
 }

 if(!state)return <section className="biz"><div className="biz-empty">{error?'État métier indisponible. Aucune donnée inventée.':'Chargement…'}</div></section>

 if(mode==='dossiers')return <section className="biz">{writeNotice}<fieldset disabled={writeBusy||taskBusy} style={{display:'contents'}}>

  <header className="biz-hero"><div><small>DOSSIERS TRANSVERSES</small><h2>Administratif, AO, subventions & conventions</h2><p>Un dossier orchestre les objets existants sans dupliquer CRM, tâches, documents, finance ou sources.</p></div><button onClick={()=>setShowCreate(v=>!v)}>+ Nouveau dossier</button></header>
  {showCreate&&<form className="biz-create" onSubmit={createDossier}><select value={form.type||'APPEL_OFFRES'} onChange={e=>setForm({...form,type:e.target.value})}>{dossierTypes.map(x=><option key={x}>{x}</option>)}</select><input placeholder="Référence officielle" value={form.reference||''} onChange={e=>setForm({...form,reference:e.target.value})}/><input required placeholder="Objet / titre" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/><select value={form.organizationId||''} onChange={e=>setForm({...form,organizationId:e.target.value})}><option value="">Organisme : non raccordé</option>{(crmDirectory?.organizations||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="datetime-local" value={form.deadline||''} onChange={e=>setForm({...form,deadline:e.target.value})}/><select value={form.ownerPersonId||''} onChange={e=>setForm({...form,ownerPersonId:e.target.value})}><option value="">Responsable : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><input placeholder="Source / URL / référence" value={form.source||''} onChange={e=>setForm({...form,source:e.target.value})}/><button>Créer</button></form>}
  <div className="biz-layout">
   <aside className="biz-list"><header><strong>Dossiers</strong><span>{state.dossiers.length}</span></header>{state.dossiers.length?state.dossiers.map(d=><button key={d.id} className={selected===d.id?'active':''} onClick={()=>{setSelected(d.id);setTab('overview')}}><small>{human(d.type)}</small><strong>{d.reference}</strong><span>{d.title}</span><em>{human(d.status)}</em></button>):<div className="biz-empty">Aucun dossier créé. Le système n’invente aucun AO.</div>}</aside>
   <main className="biz-main">{dossier?<><header className="biz-dossier-head"><div><small>{human(dossier.type)}</small><h2>{dossier.reference} · {dossier.title}</h2><p>{dossier.organizationId?externalName(dossier.organizationId):dossier.organization} · {dossier.deadline?new Date(dossier.deadline).toLocaleString('fr-FR'):'Deadline inconnue'} · Responsable : {personName(dossier.ownerPersonId)}</p></div><div className="biz-dossier-actions"><select aria-label="Responsable du dossier" value={dossier.ownerPersonId||''} onChange={e=>post({dossierPatch:{id:dossier.id,ownerPersonId:e.target.value||null,owner:e.target.value?personName(e.target.value):'UNKNOWN / NON ASSIGNÉ'}})}><option value="">Non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><span className={'biz-readiness '+(dossierReady?'ready':dossierLate?'late':'hold')}>{dossierReady?'Prêt à déposer':dossierLate?'Échéance dépassée':'Préparation / contrôle'}</span><select aria-label="Statut du dossier" value={dossier.status} onChange={e=>changeDossierStatus(e.target.value as DossierStatus)}>{['BROUILLON','EN_PREPARATION','A_VALIDER','VALIDE','PRET_A_DEPOSER','DEPOSE','ATTRIBUE','NON_RETENU','ANNULE'].map(x=><option key={x} value={x} disabled={['PRET_A_DEPOSER','DEPOSE'].includes(x)&&!dossierReady}>{human(x)}</option>)}</select></div></header>
    <div className="biz-kpis"><article><small>COMPLÉTUDE OBLIGATOIRE</small><strong>{satisfied}/{required.length}</strong><span>{blockingRequired.length} blocage(s)</span></article><article><small>VALIDATION FINALE</small><strong>{finalValidation?.status?human(finalValidation.status):'Non demandée'}</strong><span>{toValidate} validation(s) en attente</span></article><article><small>EXIGENCES</small><strong>{reqs.length}</strong><span>{reqs.filter(r=>r.state==='A_VERIFIER').length} à vérifier</span></article><article><small>DOCUMENTS LIÉS</small><strong>{docs.length}</strong><span>{docs.filter(d=>d.status==='EXPIRE').length} expiré(s)</span></article></div>
    <nav className="biz-tabs">{[['overview','Vue'],['requirements','Exigences'],['documents','Documents'],['tasks','Tâches'],['relations','Relations'],['validation','Validation'],['submission','Dépôt & résultat'],['sources','Sources']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
    {tab==='overview'&&<div className="biz-priority"><div className="biz-readiness-card"><strong>{dossierReady?'Dossier gouverné prêt':'Dossier non prêt'}</strong><span>{dossierReady?'Toutes les exigences obligatoires sont satisfaites et la revue finale est validée.':'Le statut Prêt à déposer / Déposé reste bloqué tant qu’une exigence obligatoire ou la validation finale manque.'}</span></div><h3>Priorités</h3>{reqs.filter(r=>['MANQUANT','BLOQUE','A_VERIFIER'].includes(r.state)).slice(0,5).map(r=><article key={r.id}><div><strong>{r.label}</strong><span>{human(r.criticality)} · {human(r.state)}</span></div><button onClick={()=>setTab('requirements')}>Ouvrir →</button></article>)}{!reqs.length&&<p>Ajoutez les exigences du dossier. Aucune exigence n’est déduite sans source.</p>}</div>}
    {tab==='requirements'&&<>{taskMessage&&<p role="status" className="biz-proof-review">{taskMessage}</p>}<form className="biz-create compact" onSubmit={addRequirement}><input required placeholder="Exigence" value={form.reqLabel||''} onChange={e=>setForm({...form,reqLabel:e.target.value})}/><select value={form.reqCriticality||'OBLIGATOIRE'} onChange={e=>setForm({...form,reqCriticality:e.target.value})}><option>OBLIGATOIRE</option><option>RECOMMANDE</option><option>OPTIONNEL</option><option>INCONNU</option></select><input placeholder="Source / clause / page" value={form.reqSource||''} onChange={e=>setForm({...form,reqSource:e.target.value})}/><input type="date" value={form.reqDueAt||''} onChange={e=>setForm({...form,reqDueAt:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{reqs.map(r=>{const linkedDoc=r.documentRefId?state.documentRefs.find(d=>d.id===r.documentRefId):null;const linkedDocValid=!linkedDoc||linkedDoc.status==='VALIDE';return <article key={r.id}><div><small>{human(r.criticality)} · {r.category}</small><strong>{r.label}</strong><span>{r.source||'Source inconnue'}</span>{linkedDoc&&<span className={linkedDoc.status==='VALIDE'?'biz-proof-ok':'biz-proof-review'}>Pièce liée : {linkedDoc.title} · {human(linkedDoc.status)}</span>}</div><div className="biz-row-actions"><select aria-label="Responsable exigence" value={r.ownerPersonId||''} onChange={e=>post({requirementPatch:{id:r.id,ownerPersonId:e.target.value||null,owner:e.target.value?personName(e.target.value):'UNKNOWN / NON ASSIGNÉ'}})}><option value="">Non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><select value={r.state} onChange={e=>post({requirementPatch:{id:r.id,state:e.target.value}})}><option disabled={!linkedDocValid}>SATISFAIT</option><option>MANQUANT</option><option>A_VERIFIER</option><option>EN_COURS</option><option>BLOQUE</option><option>INCONNU</option></select><button disabled={taskBusy||!!r.taskRefId} onClick={()=>createTaskForRequirement(r)}>{r.taskRefId?'Tâche liée':'Créer tâche'}</button></div></article>})}</div></>}
    {tab==='documents'&&<DocumentsPanel docs={docs} requirements={reqs} form={form} setForm={setForm} addDocument={addDocument} post={post}/>}
    {tab==='tasks'&&<section className="biz-info"><h3>Tâches uniques</h3><p>Les tâches créées depuis une exigence sont écrites dans le store Tasks avec le même identifiant. Elles ne sont pas dupliquées dans le dossier.</p><button onClick={()=>onOpen?.('tasks')}>Ouvrir Tasks →</button></section>}
    {tab==='relations'&&<section className="biz-info"><h3>Relation externe</h3>{dossier.organizationId?<><p><strong>Organisme canonique :</strong> {externalName(dossier.organizationId)}</p><div className="biz-relation-timeline">{(crmDirectory?.interactions||[]).filter(i=>i.organizationId===dossier.organizationId).sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt))).slice(0,12).map(i=><article key={i.id}><div><strong>{i.type} · {i.direction}</strong><span>{i.occurredAt?String(i.occurredAt).slice(0,16).replace('T',' '):'Date inconnue'}</span></div><p>{i.summary}</p><small>Preuve : {i.proof||'NON_RACCORDEE'}{i.followupTaskId?' · relance liée':''}</small></article>)}{!(crmDirectory?.interactions||[]).some(i=>i.organizationId===dossier.organizationId)&&<p>Aucun échange canonique enregistré pour cet organisme.</p>}</div><button onClick={()=>onOpen?.('crm')}>Ouvrir CRM →</button></>:<p>Ce dossier n’est pas encore relié à un organisme canonique du CRM.</p>}</section>}
    {tab==='validation'&&<section className="biz-info"><h3>Validation humaine</h3><p>Complétude ≠ validation ≠ prêt à déposer ≠ déposé. Une validation référence une personne canonique de Organisation.</p>{vals.map(v=><article key={v.id} className="biz-validation-row"><div><strong>{v.type}</strong><span>{v.decidedBy?personName(v.decidedBy):'Décideur non assigné'}</span></div><select aria-label="Décideur" value={v.decidedBy||''} onChange={e=>post({validationPatch:{id:v.id,decidedBy:e.target.value||null,status:e.target.value?v.status:'EN_ATTENTE'}})}><option value="">Non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><select aria-label="État validation" value={v.status} onChange={e=>{const next=e.target.value as Validation['status'];if(next==='VALIDE'&&!v.decidedBy)return;void post({validationPatch:{id:v.id,status:next,decidedAt:next==='VALIDE'?new Date().toISOString():v.decidedAt}})}}><option>EN_ATTENTE</option><option>HOLD</option><option>VALIDE</option><option>REFUSE</option></select><em>{v.decidedBy?(hasExplicitAuthorization(v.decidedBy,'AO')?'Habilitation AO explicite':'Habilitation AO non établie'):'Autorité inconnue'}</em></article>)}<button onClick={()=>post({validationPatch:{id:operationId('val:'+selected),dossierId:selected,type:'REVUE_FINALE',status:'EN_ATTENTE',requiredRole:'PERSONNE_HABILITEE',decidedBy:null,decidedAt:null,comment:''}})}>+ Demander validation</button></section>}
    {tab==='submission'&&<section className="biz-info biz-submission"><h3>Dépôt, accusé et résultat</h3><p>Un statut « Déposé » n’existe qu’avec une preuve de dépôt. Le résultat du dossier est lui aussi un objet sourcé distinct.</p>
     {!submissionProof?<form className="biz-create compact" onSubmit={recordSubmissionProof}>
      <input required type="datetime-local" aria-label="Date et heure du dépôt" value={form.submissionAt||''} onChange={e=>setForm({...form,submissionAt:e.target.value})}/>
      <input placeholder="Canal de dépôt" value={form.submissionChannel||dossier.submissionChannel||''} onChange={e=>setForm({...form,submissionChannel:e.target.value})}/>
      <input placeholder="Référence externe / accusé" value={form.submissionExternalRef||''} onChange={e=>setForm({...form,submissionExternalRef:e.target.value})}/>
      <input required placeholder="Preuve de dépôt / receipt / URL / fichier" value={form.submissionProofRef||''} onChange={e=>setForm({...form,submissionProofRef:e.target.value})}/>
      <select value={form.submittedByPersonId||''} onChange={e=>setForm({...form,submittedByPersonId:e.target.value})}><option value="">Déposé par : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
      <input placeholder="Source" value={form.submissionSource||''} onChange={e=>setForm({...form,submissionSource:e.target.value})}/>
      <button disabled={!dossierReady}>Enregistrer la preuve de dépôt</button>
     </form>:<div className="biz-proof-card"><div><small>DÉPÔT CONFIRMÉ</small><strong>{submissionProof.externalReference}</strong><span>{submissionProof.submittedAt} · {submissionProof.channel}</span><span>Déposé par {personName(submissionProof.submittedByPersonId)}</span></div><em>{submissionProof.proofRef}</em></div>}
     {!dossierReady&&!submissionProof&&<p className="biz-hold-note">HOLD : le dossier doit d’abord être complet et validé avant d’enregistrer un dépôt.</p>}
     {submissionProof&&<><h3>Résultat externe</h3>{dossierOutcome?<div className="biz-proof-card outcome"><div><small>{human(dossierOutcome.result)}</small><strong>{dossierOutcome.externalReference}</strong><span>{dossierOutcome.decidedAt}{dossierOutcome.amount!=null?' · '+euro(dossierOutcome.amount):''}</span></div><em>{dossierOutcome.proofRef}</em></div>:<form className="biz-create compact" onSubmit={recordOutcome}>
      <select required value={form.outcomeResult||''} onChange={e=>setForm({...form,outcomeResult:e.target.value})}><option value="">Résultat…</option><option>ATTRIBUE</option><option>NON_RETENU</option><option>ANNULE</option></select>
      <input type="date" value={form.outcomeDate||''} onChange={e=>setForm({...form,outcomeDate:e.target.value})}/>
      <input placeholder="Référence décision / notification" value={form.outcomeExternalRef||''} onChange={e=>setForm({...form,outcomeExternalRef:e.target.value})}/>
      <input required placeholder="Preuve résultat / notification" value={form.outcomeProofRef||''} onChange={e=>setForm({...form,outcomeProofRef:e.target.value})}/>
      <input type="number" step="0.01" placeholder="Montant attribué (optionnel)" value={form.outcomeAmount||''} onChange={e=>setForm({...form,outcomeAmount:e.target.value})}/>
      <button>Enregistrer le résultat</button>
     </form>}</>}
    </section>}
    {tab==='sources'&&<section className="biz-info"><h3>Sources & preuves</h3><p><strong>Source dossier :</strong> {dossier.source||'INCONNU'}</p><p>Chaque exigence conserve sa source. Les preuves de dépôt seront ajoutées comme objet distinct avant tout passage à DÉPOSÉ.</p></section>}
   </>:<div className="biz-empty big">Créez ou sélectionnez un dossier.</div>}</main>
  </div>
 </fieldset></section>

 if(mode==='documents')return <section className="biz">{writeNotice}<fieldset disabled={writeBusy||taskBusy} style={{display:'contents'}}>
<header className="biz-hero"><div><small>MÉMOIRE ADMINISTRATIVE</small><h2>Documents réutilisables</h2><p>Version, validité, expiration, provenance et dossiers d’utilisation. Les pièces issues d’un mail gardent leur origine et ne satisfont jamais une exigence sans revue.</p></div></header><DocumentsPanel docs={state.documentRefs} requirements={state.requirements} form={form} setForm={setForm} addDocument={addDocument} post={post}/></fieldset></section>

 const channel=mode==='commerce'?'Commerce & exploitation':'Finance du club'
 const economyProjection=projectCssaEconomy(state as unknown as EconomyState,today)
 return <section className="biz">{writeNotice}<CSSAStoreSourceNotice state={state}/><fieldset disabled={writeBusy} style={{display:'contents'}}>
  <header className="biz-hero"><div><small>{mode==='commerce'?'COMMERCE / EXPLOITATION':'FINANCE'}</small><h2>{channel}</h2><p>Recettes, dépenses, buvette, boutique, billetterie, stocks, fournisseurs, factures, paiements, trésorerie et patrimoine sont des déclarations du registre local, hors validation comptable et autorisation de paiement.</p></div></header>
  <div className="biz-kpis economy"><article><small>RECETTES SAISIES</small><strong>{euro(economyProjection.revenueTotal)}</strong><span>{economyProjection.available?revenues.length:'UNKNOWN'} flux</span></article><article><small>DÉPENSES SAISIES</small><strong>{euro(economyProjection.expenseTotal)}</strong><span>{economyProjection.available?expenses.length:'UNKNOWN'} flux</span></article><article><small>TRÉSORERIE SAISIE</small><strong>{euro(economyProjection.cash)}</strong><span>{economyProjection.available?invoiceOpen:'UNKNOWN'} facture(s) ouverte(s)</span></article><article className={attentionCount?'attention':''}><small>À TRAITER</small><strong>{economyProjection.available?attentionCount:'UNKNOWN'}</strong><span>finance, stocks, contrats, maintenance</span></article></div>
  <nav className="biz-tabs">{[['overview','Vue'],['revenues','Recettes'],['expenses','Dépenses'],['stock','Stocks / achats'],['contracts','Contrats / fournisseurs'],['invoices','Factures / paiements'],['treasury','Trésorerie'],['assets','Patrimoine']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>{setTab(k);if(k==='revenues')setMoneyKind('revenue');if(k==='expenses')setMoneyKind('expense')}}>{l}</button>)}</nav>
  {tab==='overview'&&<><div className="biz-attention"><header><div><small>PILOTAGE</small><h3>Ce qui demande une action</h3></div><strong>{economyProjection.available?attentionCount:'UNKNOWN'}</strong></header>{overdueInvoices.map(x=><button key={x.id} onClick={()=>setTab('invoices')}><span>Facture en retard</span><b>{x.number} · {x.party}</b><em>{euro(x.amount)}</em></button>)}{lowStock.map(x=><button key={x.id} onClick={()=>setTab('stock')}><span>Stock bas</span><b>{x.label}</b><em>{x.quantity} restant(s)</em></button>)}{expiringContracts.map(x=><button key={x.id} onClick={()=>setTab('contracts')}><span>Échéance contrat</span><b>{x.label}</b><em>{x.endAt}</em></button>)}{maintenanceDue.map(x=><button key={x.id} onClick={()=>setTab('assets')}><span>Maintenance</span><b>{x.label}</b><em>{x.maintenanceDueAt}</em></button>)}{!attentionCount&&<p>Aucune alerte dérivée des données saisies.</p>}</div><div className="biz-econ-grid"><section><h3>Canaux de recettes</h3>{revenueCategories.map(cat=><div key={cat}><span>{human(cat)}</span><strong>{euro(revenues.filter(x=>x.category===cat).reduce((s,x)=>s+x.amount,0))}</strong></div>)}</section><section><h3>Économie matchday</h3>{Array.from(new Set([...revenues,...expenses].map(x=>x.matchRef).filter(Boolean))).map(ref=>{const rev=revenues.filter(x=>x.matchRef===ref).reduce((s,x)=>s+x.amount,0);const exp=expenses.filter(x=>x.matchRef===ref).reduce((s,x)=>s+x.amount,0);return <div key={String(ref)}><span>{ref}</span><strong>{euro(rev-exp)}</strong></div>})}<p>Billetterie + buvette + boutique + dépenses liées peuvent être rattachées au même match.</p></section></div></>}
  {(tab==='revenues'||tab==='expenses')&&<><form className="biz-create compact" onSubmit={addMoney}><select value={form.moneyCategory||'AUTRE'} onChange={e=>setForm({...form,moneyCategory:e.target.value})}>{(tab==='revenues'?revenueCategories:expenseCategories).map(x=><option key={x}>{x}</option>)}</select><input required placeholder="Libellé" value={form.moneyLabel||''} onChange={e=>setForm({...form,moneyLabel:e.target.value})}/><input required type="number" step="0.01" placeholder="Montant €" value={form.moneyAmount||''} onChange={e=>setForm({...form,moneyAmount:e.target.value})}/><input placeholder="Match ref (optionnel)" value={form.moneyMatchRef||''} onChange={e=>setForm({...form,moneyMatchRef:e.target.value})}/><input placeholder="Source / justificatif" value={form.moneySource||''} onChange={e=>setForm({...form,moneySource:e.target.value})}/><select value={form.moneyPersonId||''} onChange={e=>setForm({...form,moneyPersonId:e.target.value})}><option value="">Saisi par : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><button>Ajouter</button></form><MoneyList rows={tab==='revenues'?revenues:expenses} personName={personName}/></>}
  {tab==='stock'&&<><form className="biz-create compact" onSubmit={addStock}><select value={form.stockChannel||'BUVETTE'} onChange={e=>setForm({...form,stockChannel:e.target.value})}><option>BUVETTE</option><option>BOUTIQUE</option><option>SPORT</option><option>AUTRE</option></select><input required placeholder="Article / produit" value={form.stockLabel||''} onChange={e=>setForm({...form,stockLabel:e.target.value})}/><input type="number" placeholder="Quantité" value={form.stockQty||''} onChange={e=>setForm({...form,stockQty:e.target.value})}/><input type="number" step="0.01" placeholder="Coût unité" value={form.stockCost||''} onChange={e=>setForm({...form,stockCost:e.target.value})}/><input type="number" step="0.01" placeholder="Prix vente" value={form.stockPrice||''} onChange={e=>setForm({...form,stockPrice:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{state.stockItems.map(x=><article key={x.id}><div><small>{x.channel}</small><strong>{x.label}</strong><span>Stock {x.quantity} · coût {x.unitCost==null?'?':euro(x.unitCost)} · vente {x.salePrice==null?'?':euro(x.salePrice)}</span></div><em>{x.status}</em></article>)}</div></>}
  {tab==='contracts'&&<><form className="biz-create compact" onSubmit={addContract}><select value={form.contractKind||'FOURNISSEUR'} onChange={e=>setForm({...form,contractKind:e.target.value})}><option>FOURNISSEUR</option><option>SPONSOR</option><option>ASSURANCE</option><option>CONVENTION</option><option>LOCATION</option><option>PRESTATAIRE</option></select><input required placeholder="Contrat / accord" value={form.contractLabel||''} onChange={e=>setForm({...form,contractLabel:e.target.value})}/><select value={form.contractOrganizationId||''} onChange={e=>setForm({...form,contractOrganizationId:e.target.value})}><option value="">Partie externe : non raccordée</option>{(crmDirectory?.organizations||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><input type="date" value={form.contractEnd||''} onChange={e=>setForm({...form,contractEnd:e.target.value})}/><input placeholder="Source / document" value={form.contractSource||''} onChange={e=>setForm({...form,contractSource:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{state.contracts.map(x=><article key={x.id}><div><small>{x.kind}</small><strong>{x.label}</strong><span>{x.partyOrganizationId?externalName(x.partyOrganizationId):x.party} · échéance {x.endAt||'inconnue'}</span></div><em>{x.status}</em></article>)}</div></>}
  {tab==='contracts'&&<><form className="biz-create compact" onSubmit={addSupplier}><select required value={form.supplierOrganizationId||''} onChange={e=>setForm({...form,supplierOrganizationId:e.target.value})}><option value="">Fournisseur CRM…</option>{(crmDirectory?.organizations||[]).filter(o=>['FOURNISSEUR','PARTENAIRE','ENTREPRISE','AUTRE'].includes(o.kind)).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><input placeholder="Catégorie" value={form.supplierCategory||''} onChange={e=>setForm({...form,supplierCategory:e.target.value})}/><input placeholder="Contact" value={form.supplierContact||''} onChange={e=>setForm({...form,supplierContact:e.target.value})}/><input placeholder="Source" value={form.supplierSource||''} onChange={e=>setForm({...form,supplierSource:e.target.value})}/><button>Ajouter fournisseur</button></form><div className="biz-table">{state.suppliers.map(x=><article key={x.id}><div><small>{x.category}</small><strong>{x.name}</strong><span>{x.organizationId?externalName(x.organizationId):x.name} · {x.contact} · {x.source}</span></div><em>{x.status}</em></article>)}</div></>}
  {tab==='invoices'&&<><form className="biz-create compact" onSubmit={addInvoice}><select value={form.invoiceDirection||'RECUE'} onChange={e=>setForm({...form,invoiceDirection:e.target.value})}><option>RECUE</option><option>EMISE</option></select><input placeholder="N° facture" value={form.invoiceNumber||''} onChange={e=>setForm({...form,invoiceNumber:e.target.value})}/><input required placeholder="Libellé" value={form.invoiceLabel||''} onChange={e=>setForm({...form,invoiceLabel:e.target.value})}/><select value={form.invoiceOrganizationId||''} onChange={e=>setForm({...form,invoiceOrganizationId:e.target.value})}><option value="">Tiers CRM : non raccordé</option>{(crmDirectory?.organizations||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select><input required type="number" step="0.01" placeholder="Montant €" value={form.invoiceAmount||''} onChange={e=>setForm({...form,invoiceAmount:e.target.value})}/><select value={form.invoicePersonId||''} onChange={e=>setForm({...form,invoicePersonId:e.target.value})}><option value="">Responsable : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><button>Ajouter facture</button></form><form className="biz-create compact" onSubmit={addPayment}><select value={form.paymentDirection||'SORTIE'} onChange={e=>setForm({...form,paymentDirection:e.target.value})}><option>SORTIE</option><option>ENTREE</option></select><input placeholder="Facture ID (optionnel)" value={form.paymentInvoice||''} onChange={e=>setForm({...form,paymentInvoice:e.target.value})}/><input required type="number" step="0.01" placeholder="Montant paiement €" value={form.paymentAmount||''} onChange={e=>setForm({...form,paymentAmount:e.target.value})}/><input placeholder="Compte / caisse" value={form.paymentAccount||''} onChange={e=>setForm({...form,paymentAccount:e.target.value})}/><input placeholder="Source / justificatif" value={form.paymentSource||''} onChange={e=>setForm({...form,paymentSource:e.target.value})}/><select value={form.paymentPersonId||''} onChange={e=>setForm({...form,paymentPersonId:e.target.value})}><option value="">Enregistré par : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><button>Ajouter paiement</button></form><div className="biz-table">{state.invoices.map(x=><article key={x.id}><div><small>{x.direction} · {x.number}</small><strong>{x.label}</strong><span>{x.partyOrganizationId?externalName(x.partyOrganizationId):x.party} · échéance {x.dueAt||'inconnue'} · responsable {personName(x.responsiblePersonId)}</span></div><b>{euro(x.amount)} · {human(x.status)}</b></article>)}{state.payments.map(x=><article key={x.id}><div><small>PAIEMENT · {x.direction}</small><strong>{x.account}</strong><span>{x.date} · {x.source} · enregistré par {personName(x.recordedByPersonId)}</span></div><b>{euro(x.amount)}</b></article>)}</div></>}
  {tab==='treasury'&&<><form className="biz-create compact" onSubmit={addTreasury}><select value={form.treasuryDirection||'ENTREE'} onChange={e=>setForm({...form,treasuryDirection:e.target.value})}><option>ENTREE</option><option>SORTIE</option></select><input required placeholder="Libellé" value={form.treasuryLabel||''} onChange={e=>setForm({...form,treasuryLabel:e.target.value})}/><input required type="number" step="0.01" placeholder="Montant €" value={form.treasuryAmount||''} onChange={e=>setForm({...form,treasuryAmount:e.target.value})}/><input placeholder="Compte / caisse" value={form.treasuryAccount||''} onChange={e=>setForm({...form,treasuryAccount:e.target.value})}/><input placeholder="Source / justificatif" value={form.treasurySource||''} onChange={e=>setForm({...form,treasurySource:e.target.value})}/><select value={form.treasuryPersonId||''} onChange={e=>setForm({...form,treasuryPersonId:e.target.value})}><option value="">Enregistré par : non assigné</option>{activePeople.map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select><button>Ajouter mouvement</button></form><div className="biz-table">{state.treasuryEntries.map(x=><article key={x.id}><div><small>{x.direction} · {x.account}</small><strong>{x.label}</strong><span>{x.date} · {x.source} · enregistré par {personName(x.recordedByPersonId)}</span></div><b>{x.direction==='ENTREE'?'+':'−'}{euro(x.amount)}</b></article>)}</div></>}
  {tab==='assets'&&<><form className="biz-create compact" onSubmit={addAsset}><select value={form.assetKind||'AUTRE'} onChange={e=>setForm({...form,assetKind:e.target.value})}><option>VEHICULE</option><option>MATERIEL_SPORTIF</option><option>INFORMATIQUE</option><option>INFRASTRUCTURE</option><option>AUTRE</option></select><input required placeholder="Équipement / actif" value={form.assetLabel||''} onChange={e=>setForm({...form,assetLabel:e.target.value})}/><input placeholder="Lieu" value={form.assetLocation||''} onChange={e=>setForm({...form,assetLocation:e.target.value})}/><input type="date" aria-label="Maintenance prévue" value={form.assetMaintenance||''} onChange={e=>setForm({...form,assetMaintenance:e.target.value})}/><input placeholder="Source / preuve" value={form.assetSource||''} onChange={e=>setForm({...form,assetSource:e.target.value})}/><button>Ajouter actif</button></form><div className="biz-table">{state.assets.map(x=><article key={x.id}><div><small>{human(x.kind)}</small><strong>{x.label}</strong><span>{x.location} · maintenance {x.maintenanceDueAt||'inconnue'}</span></div><em>{x.status}</em></article>)}</div></>}
 </fieldset></section>
}

function DocumentsPanel({docs,requirements,form,setForm,addDocument,post}:{docs:DocumentRef[];requirements:Requirement[];form:Record<string,string>;setForm:(x:Record<string,string>)=>void;addDocument:(e:React.FormEvent)=>void;post:(patch:Record<string,unknown>)=>Promise<boolean>}){
 const linkedRequirement=(d:DocumentRef)=>requirements.find(r=>r.documentRefId===d.id)||(d.requirementIds||[]).map(id=>requirements.find(r=>r.id===id)).find(Boolean)
 const setDocumentStatus=async(d:DocumentRef,status:DocumentRef['status'])=>{
  await post({documentRefPatch:{id:d.id,status}})
 }
 return <><form className="biz-create compact" onSubmit={addDocument}><input required placeholder="Document" value={form.docTitle||''} onChange={e=>setForm({...form,docTitle:e.target.value})}/><input placeholder="Type" value={form.docType||''} onChange={e=>setForm({...form,docType:e.target.value})}/><input placeholder="Version" value={form.docVersion||''} onChange={e=>setForm({...form,docVersion:e.target.value})}/><input type="date" aria-label="Valide jusqu'au" value={form.docValidUntil||''} onChange={e=>setForm({...form,docValidUntil:e.target.value})}/><input placeholder="Source" value={form.docSource||''} onChange={e=>setForm({...form,docSource:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{docs.length?docs.map(d=>{const req=linkedRequirement(d);return <article key={d.id} className="biz-document-row"><div><small>{d.type} · v{d.version}{d.originType==='MAIL'?' · Reçu par mail':''}</small><strong>{d.title}</strong><span>{d.validUntil?'Valide jusqu’au '+d.validUntil:'Validité inconnue'} · {d.source}</span>{d.originMailId&&<span>Mail source : {d.originMailId} · preuve {d.proof||d.fileRef||'NON_RACCORDEE'}</span>}{req&&<span>Exigence liée : {req.label} · {human(req.state)}</span>}</div><div className="biz-doc-actions"><select aria-label="État document" value={d.status} onChange={e=>setDocumentStatus(d,e.target.value as DocumentRef['status'])}><option>VALIDE</option><option>EXPIRE</option><option>A_VERIFIER</option><option>INCONNU</option></select><em>{human(d.status)}</em></div></article>}):<div className="biz-empty">Aucun document enregistré. Aucun document administratif n’est inventé.</div>}</div></>
}
function MoneyList({rows,personName}:{rows:MoneyRow[];personName:(id?:string|null)=>string}){
 return <div className="biz-table">{rows.length?rows.map(x=><article key={x.id}><div><small>{human(x.category)}{x.matchRef?' · '+x.matchRef:''}</small><strong>{x.label}</strong><span>{x.date} · {x.source} · saisi par {personName(x.recordedByPersonId)}</span></div><b>{euro(x.amount)}</b></article>):<div className="biz-empty">Aucun flux saisi. Les montants réels restent inconnus tant qu’ils ne sont pas raccordés.</div>}</div>
}
