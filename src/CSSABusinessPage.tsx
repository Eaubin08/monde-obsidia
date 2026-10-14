import {useEffect,useMemo,useState} from 'react'
import './CSSABusiness.css'

type DossierType='APPEL_OFFRES'|'CONSULTATION'|'SUBVENTION'|'PARTENARIAT'|'CONVENTION'|'DOSSIER_INSTITUTIONNEL'
type DossierStatus='BROUILLON'|'EN_PREPARATION'|'A_VALIDER'|'VALIDE'|'PRET_A_DEPOSER'|'DEPOSE'|'ATTRIBUE'|'NON_RETENU'|'ANNULE'
type Dossier={id:string;reference:string;type:DossierType;title:string;organization:string;deadline:string;status:DossierStatus;source:string;owner:string;submissionChannel:string;createdAt:string}
type Requirement={id:string;dossierId:string;label:string;category:string;criticality:'OBLIGATOIRE'|'RECOMMANDE'|'OPTIONNEL'|'INCONNU';state:'SATISFAIT'|'MANQUANT'|'A_VERIFIER'|'EN_COURS'|'BLOQUE'|'INCONNU';source:string;documentRefId:string|null;taskRefId:string|null;owner:string;dueAt:string;validationRequired:boolean}
type DocumentRef={id:string;dossierId:string|null;type:string;title:string;version:string;status:'VALIDE'|'EXPIRE'|'A_VERIFIER'|'INCONNU';issuedAt:string;validUntil:string;source:string;fileRef:string;usedIn:string[]}
type Validation={id:string;dossierId:string;type:string;status:'EN_ATTENTE'|'VALIDE'|'REFUSE'|'HOLD';requiredRole:string;decidedBy:string|null;decidedAt:string|null;comment:string}
type MoneyRow={id:string;category:string;label:string;amount:number;date:string;status:string;matchRef:string|null;source:string;note:string}
type StockItem={id:string;channel:'BUVETTE'|'BOUTIQUE'|'SPORT'|'AUTRE';label:string;sku:string;quantity:number;unitCost:number|null;salePrice:number|null;threshold:number|null;supplierId:string|null;status:string}
type Supplier={id:string;name:string;category:string;contact:string;status:string;source:string}
type Contract={id:string;kind:string;label:string;party:string;startAt:string;endAt:string;amount:number|null;status:string;source:string}
type BusinessState={version:string;updatedAt:string;dossiers:Dossier[];requirements:Requirement[];documentRefs:DocumentRef[];validations:Validation[];revenues:MoneyRow[];expenses:MoneyRow[];stockItems:StockItem[];suppliers:Supplier[];contracts:Contract[]}

type Mode='dossiers'|'documents'|'commerce'|'finance'
type Props={mode:Mode;selectedId?:string;onOpen?:(moduleId:string,id?:string)=>void}

const revenueCategories=['BILLETTERIE','BUVETTE','BOUTIQUE','SPONSORING','PARTENARIAT','SUBVENTION','COTISATION_LICENCE','STAGE_CAMP','EVENEMENT','LOCATION','DON_MECENAT','MEDIA_AUTRE']
const expenseCategories=['SALAIRES_INDEMNITES','DEPLACEMENT','HEBERGEMENT','ARBITRAGE_OFFICIELS','EQUIPEMENT','MEDICAL','ASSURANCE','LICENCE_FEDERATION','SECURITE','ENTRETIEN_ENERGIE','TERRAIN_STADE','COMMUNICATION','INFORMATIQUE','FRAIS_BANCAIRES','PRESTATAIRE','RESTAURATION','ACHAT_BUVETTE','ACHAT_BOUTIQUE','AUTRE']
const dossierTypes:DossierType[]=['APPEL_OFFRES','CONSULTATION','SUBVENTION','PARTENARIAT','CONVENTION','DOSSIER_INSTITUTIONNEL']

function human(v:string){return v.replaceAll('_',' ').toLowerCase().replace(/(^|\s)\S/g,m=>m.toUpperCase())}
function euro(v:number){return new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)}
function uid(prefix:string){return prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)}

export default function CSSABusinessPage({mode,selectedId,onOpen}:Props){
 const [state,setState]=useState<BusinessState|null>(null)
 const [error,setError]=useState(false)
 const [selected,setSelected]=useState(selectedId||'')
 const [tab,setTab]=useState('overview')
 const [showCreate,setShowCreate]=useState(false)
 const [form,setForm]=useState<Record<string,string>>({type:'APPEL_OFFRES',status:'BROUILLON'})
 const [moneyKind,setMoneyKind]=useState<'revenue'|'expense'>('revenue')

 const refresh=async()=>{
  try{
   const r=await fetch('/obsidia-local/cssa-business-state',{cache:'no-store'})
   if(!r.ok)throw new Error('business state unavailable')
   const data=await r.json()
   setState(data);setError(false)
   if(!selected&&data.dossiers?.length)setSelected(data.dossiers[0].id)
  }catch{setError(true)}
 }
 useEffect(()=>{void refresh()},[])
 useEffect(()=>{if(selectedId)setSelected(selectedId)},[selectedId])

 const post=async(patch:Record<string,unknown>)=>{
  const r=await fetch('/obsidia-local/cssa-business-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})
  if(r.ok)setState(await r.json())
 }

 const dossier=state?.dossiers.find(d=>d.id===selected)||null
 const reqs=useMemo(()=>state?.requirements.filter(r=>r.dossierId===selected)||[],[state,selected])
 const docs=useMemo(()=>state?.documentRefs.filter(d=>!d.dossierId||d.dossierId===selected||d.usedIn?.includes(selected))||[],[state,selected])
 const vals=useMemo(()=>state?.validations.filter(v=>v.dossierId===selected)||[],[state,selected])
 const required=reqs.filter(r=>r.criticality==='OBLIGATOIRE')
 const satisfied=required.filter(r=>r.state==='SATISFAIT').length
 const missing=required.filter(r=>['MANQUANT','BLOQUE'].includes(r.state)).length
 const toValidate=vals.filter(v=>v.status==='EN_ATTENTE'||v.status==='HOLD').length
 const revenues=state?.revenues||[], expenses=state?.expenses||[]
 const revenueTotal=revenues.reduce((s,x)=>s+(Number(x.amount)||0),0)
 const expenseTotal=expenses.reduce((s,x)=>s+(Number(x.amount)||0),0)
 const result=revenueTotal-expenseTotal

 const createDossier=async(e:React.FormEvent)=>{
  e.preventDefault()
  if(!form.title?.trim())return
  const id=uid('dossier')
  const d:Dossier={id,reference:form.reference?.trim()||id.toUpperCase(),type:(form.type||'APPEL_OFFRES') as DossierType,title:form.title.trim(),organization:form.organization?.trim()||'INCONNU',deadline:form.deadline||'',status:'BROUILLON',source:form.source?.trim()||'INCONNU',owner:'UNKNOWN / NON ASSIGNÉ',submissionChannel:form.submissionChannel?.trim()||'INCONNU',createdAt:new Date().toISOString()}
  await post({dossierPatch:d});setSelected(id);setShowCreate(false);setForm({type:'APPEL_OFFRES',status:'BROUILLON'});setTab('overview')
 }
 const addRequirement=async(e:React.FormEvent)=>{
  e.preventDefault();if(!dossier||!form.reqLabel?.trim())return
  const r:Requirement={id:uid('req'),dossierId:dossier.id,label:form.reqLabel.trim(),category:form.reqCategory||'ADMINISTRATIF',criticality:(form.reqCriticality||'OBLIGATOIRE') as any,state:'A_VERIFIER',source:form.reqSource?.trim()||'INCONNU',documentRefId:null,taskRefId:null,owner:'UNKNOWN / NON ASSIGNÉ',dueAt:form.reqDueAt||dossier.deadline,validationRequired:true}
  await post({requirementPatch:r});setForm({...form,reqLabel:'',reqSource:'',reqDueAt:''})
 }
 const createTaskForRequirement=async(r:Requirement)=>{
  if(r.taskRefId)return
  const taskId=uid('task-dossier')
  const task={id:taskId,title:r.label,description:'Action liée au dossier '+(dossier?.reference||selected),status:'A_FAIRE',priority:r.criticality==='OBLIGATOIRE'?'HAUTE':'NORMALE',dueAt:r.dueAt||dossier?.deadline||'',origin:'ADMINISTRATION',structure:'cssa',team:null,matchRef:null,responsible:'UNKNOWN / NON ASSIGNÉ',source:r.source||'Dossier CSSA',truthClass:'UNKNOWN',checklist:{},notes:'',history:[{at:new Date().toISOString(),action:'CREATION',note:'Créée depuis une exigence dossier'}],relations:[{type:'DOSSIER',targetId:selected,label:dossier?.reference||selected},{type:'REQUIREMENT',targetId:r.id,label:r.label}],caseRef:null}
  await fetch('/obsidia-local/cssa-ops-state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({taskPatch:task})})
  await post({requirementPatch:{...r,taskRefId:taskId}})
 }
 const addDocument=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.docTitle?.trim())return
  const doc:DocumentRef={id:uid('doc'),dossierId:selected||null,type:form.docType||'AUTRE',title:form.docTitle.trim(),version:form.docVersion||'1',status:'A_VERIFIER',issuedAt:form.docIssuedAt||'',validUntil:form.docValidUntil||'',source:form.docSource?.trim()||'INCONNU',fileRef:form.docFileRef?.trim()||'NON_RACCORDE',usedIn:selected?[selected]:[]}
  await post({documentRefPatch:doc});setForm({...form,docTitle:'',docSource:'',docFileRef:''})
 }
 const addMoney=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.moneyLabel?.trim())return
  const row:MoneyRow={id:uid(moneyKind==='revenue'?'rev':'exp'),category:form.moneyCategory||'AUTRE',label:form.moneyLabel.trim(),amount:Number(form.moneyAmount||0),date:form.moneyDate||new Date().toISOString().slice(0,10),status:'OBSERVE_SAISI',matchRef:form.moneyMatchRef?.trim()||null,source:form.moneySource?.trim()||'SAISIE_INTERNE_A_VERIFIER',note:form.moneyNote?.trim()||''}
  await post({[moneyKind==='revenue'?'revenuePatch':'expensePatch']:row});setForm({...form,moneyLabel:'',moneyAmount:'',moneyMatchRef:'',moneySource:'',moneyNote:''})
 }
 const addStock=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.stockLabel?.trim())return
  const item:StockItem={id:uid('stock'),channel:(form.stockChannel||'BUVETTE') as any,label:form.stockLabel.trim(),sku:form.stockSku||'',quantity:Number(form.stockQty||0),unitCost:form.stockCost?Number(form.stockCost):null,salePrice:form.stockPrice?Number(form.stockPrice):null,threshold:form.stockThreshold?Number(form.stockThreshold):null,supplierId:null,status:'A_VERIFIER'}
  await post({stockPatch:item});setForm({...form,stockLabel:'',stockSku:'',stockQty:'',stockCost:'',stockPrice:'',stockThreshold:''})
 }
 const addContract=async(e:React.FormEvent)=>{
  e.preventDefault();if(!form.contractLabel?.trim())return
  const row:Contract={id:uid('contract'),kind:form.contractKind||'FOURNISSEUR',label:form.contractLabel.trim(),party:form.contractParty?.trim()||'INCONNU',startAt:form.contractStart||'',endAt:form.contractEnd||'',amount:form.contractAmount?Number(form.contractAmount):null,status:'A_VERIFIER',source:form.contractSource?.trim()||'INCONNU'}
  await post({contractPatch:row});setForm({...form,contractLabel:'',contractParty:'',contractAmount:'',contractSource:''})
 }

 if(!state)return <section className="biz"><div className="biz-empty">{error?'État métier indisponible. Aucune donnée inventée.':'Chargement…'}</div></section>

 if(mode==='dossiers')return <section className="biz">
  <header className="biz-hero"><div><small>DOSSIERS TRANSVERSES</small><h2>Administratif, AO, subventions & conventions</h2><p>Un dossier orchestre les objets existants sans dupliquer CRM, tâches, documents, finance ou sources.</p></div><button onClick={()=>setShowCreate(v=>!v)}>+ Nouveau dossier</button></header>
  {showCreate&&<form className="biz-create" onSubmit={createDossier}><select value={form.type||'APPEL_OFFRES'} onChange={e=>setForm({...form,type:e.target.value})}>{dossierTypes.map(x=><option key={x}>{x}</option>)}</select><input placeholder="Référence officielle" value={form.reference||''} onChange={e=>setForm({...form,reference:e.target.value})}/><input required placeholder="Objet / titre" value={form.title||''} onChange={e=>setForm({...form,title:e.target.value})}/><input placeholder="Organisme" value={form.organization||''} onChange={e=>setForm({...form,organization:e.target.value})}/><input type="datetime-local" value={form.deadline||''} onChange={e=>setForm({...form,deadline:e.target.value})}/><input placeholder="Source / URL / référence" value={form.source||''} onChange={e=>setForm({...form,source:e.target.value})}/><button>Créer</button></form>}
  <div className="biz-layout">
   <aside className="biz-list"><header><strong>Dossiers</strong><span>{state.dossiers.length}</span></header>{state.dossiers.length?state.dossiers.map(d=><button key={d.id} className={selected===d.id?'active':''} onClick={()=>{setSelected(d.id);setTab('overview')}}><small>{human(d.type)}</small><strong>{d.reference}</strong><span>{d.title}</span><em>{human(d.status)}</em></button>):<div className="biz-empty">Aucun dossier créé. Le système n’invente aucun AO.</div>}</aside>
   <main className="biz-main">{dossier?<><header className="biz-dossier-head"><div><small>{human(dossier.type)}</small><h2>{dossier.reference} · {dossier.title}</h2><p>{dossier.organization} · {dossier.deadline?new Date(dossier.deadline).toLocaleString('fr-FR'):'Deadline inconnue'}</p></div><span className="biz-state">{human(dossier.status)}</span></header>
    <div className="biz-kpis"><article><small>COMPLÉTUDE OBLIGATOIRE</small><strong>{satisfied}/{required.length}</strong><span>{missing} manquante(s)</span></article><article><small>À VALIDER</small><strong>{toValidate}</strong><span>validation(s) humaine(s)</span></article><article><small>EXIGENCES</small><strong>{reqs.length}</strong><span>{reqs.filter(r=>r.state==='A_VERIFIER').length} à vérifier</span></article><article><small>DOCUMENTS LIÉS</small><strong>{docs.length}</strong><span>{docs.filter(d=>d.status==='EXPIRE').length} expiré(s)</span></article></div>
    <nav className="biz-tabs">{[['overview','Vue'],['requirements','Exigences'],['documents','Documents'],['tasks','Tâches'],['validation','Validation'],['sources','Sources']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
    {tab==='overview'&&<div className="biz-priority"><h3>Priorités</h3>{reqs.filter(r=>['MANQUANT','BLOQUE','A_VERIFIER'].includes(r.state)).slice(0,5).map(r=><article key={r.id}><div><strong>{r.label}</strong><span>{human(r.criticality)} · {human(r.state)}</span></div><button onClick={()=>setTab('requirements')}>Ouvrir →</button></article>)}{!reqs.length&&<p>Ajoutez les exigences du dossier. Aucune exigence n’est déduite sans source.</p>}</div>}
    {tab==='requirements'&&<><form className="biz-create compact" onSubmit={addRequirement}><input required placeholder="Exigence" value={form.reqLabel||''} onChange={e=>setForm({...form,reqLabel:e.target.value})}/><select value={form.reqCriticality||'OBLIGATOIRE'} onChange={e=>setForm({...form,reqCriticality:e.target.value})}><option>OBLIGATOIRE</option><option>RECOMMANDE</option><option>OPTIONNEL</option><option>INCONNU</option></select><input placeholder="Source / clause / page" value={form.reqSource||''} onChange={e=>setForm({...form,reqSource:e.target.value})}/><input type="date" value={form.reqDueAt||''} onChange={e=>setForm({...form,reqDueAt:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{reqs.map(r=><article key={r.id}><div><small>{human(r.criticality)} · {r.category}</small><strong>{r.label}</strong><span>{r.source||'Source inconnue'}</span></div><div className="biz-row-actions"><select value={r.state} onChange={e=>post({requirementPatch:{...r,state:e.target.value}})}><option>SATISFAIT</option><option>MANQUANT</option><option>A_VERIFIER</option><option>EN_COURS</option><option>BLOQUE</option><option>INCONNU</option></select><button disabled={!!r.taskRefId} onClick={()=>createTaskForRequirement(r)}>{r.taskRefId?'Tâche liée':'Créer tâche'}</button></div></article>)}</div></>}
    {tab==='documents'&&<DocumentsPanel docs={docs} form={form} setForm={setForm} addDocument={addDocument}/>}
    {tab==='tasks'&&<section className="biz-info"><h3>Tâches uniques</h3><p>Les tâches créées depuis une exigence sont écrites dans le store Tasks avec le même identifiant. Elles ne sont pas dupliquées dans le dossier.</p><button onClick={()=>onOpen?.('tasks')}>Ouvrir Tasks →</button></section>}
    {tab==='validation'&&<section className="biz-info"><h3>Validation humaine</h3><p>Complétude ≠ validation ≠ prêt à déposer ≠ déposé. Les validations sont des objets séparés.</p>{vals.map(v=><article key={v.id}><strong>{v.type}</strong><span>{v.status}</span></article>)}<button onClick={()=>post({validationPatch:{id:uid('val'),dossierId:selected,type:'REVUE_FINALE',status:'EN_ATTENTE',requiredRole:'PERSONNE_HABILITEE',decidedBy:null,decidedAt:null,comment:''}})}>+ Demander validation</button></section>}
    {tab==='sources'&&<section className="biz-info"><h3>Sources & preuves</h3><p><strong>Source dossier :</strong> {dossier.source||'INCONNU'}</p><p>Chaque exigence conserve sa source. Les preuves de dépôt seront ajoutées comme objet distinct avant tout passage à DÉPOSÉ.</p></section>}
   </>:<div className="biz-empty big">Créez ou sélectionnez un dossier.</div>}</main>
  </div>
 </section>

 if(mode==='documents')return <section className="biz"><header className="biz-hero"><div><small>MÉMOIRE ADMINISTRATIVE</small><h2>Documents réutilisables</h2><p>Version, validité, expiration, provenance et dossiers d’utilisation.</p></div></header><DocumentsPanel docs={state.documentRefs} form={form} setForm={setForm} addDocument={addDocument}/></section>

 const channel=mode==='commerce'?'Commerce & exploitation':'Finance du club'
 return <section className="biz">
  <header className="biz-hero"><div><small>{mode==='commerce'?'COMMERCE / EXPLOITATION':'FINANCE'}</small><h2>{channel}</h2><p>Recettes, dépenses, buvette, boutique, billetterie, stocks, fournisseurs et contrats alimentent une seule vérité financière.</p></div></header>
  <div className="biz-kpis economy"><article><small>RECETTES SAISIES</small><strong>{euro(revenueTotal)}</strong><span>{revenues.length} flux</span></article><article><small>DÉPENSES SAISIES</small><strong>{euro(expenseTotal)}</strong><span>{expenses.length} flux</span></article><article><small>RÉSULTAT OBSERVÉ</small><strong>{euro(result)}</strong><span>sur flux saisis uniquement</span></article><article><small>STOCKS</small><strong>{state.stockItems.length}</strong><span>articles suivis</span></article></div>
  <nav className="biz-tabs">{[['overview','Vue'],['revenues','Recettes'],['expenses','Dépenses'],['stock','Stocks / achats'],['contracts','Contrats / fournisseurs']].map(([k,l])=><button key={k} className={tab===k?'active':''} onClick={()=>{setTab(k);if(k==='revenues')setMoneyKind('revenue');if(k==='expenses')setMoneyKind('expense')}}>{l}</button>)}</nav>
  {tab==='overview'&&<div className="biz-econ-grid"><section><h3>Canaux de recettes</h3>{revenueCategories.map(cat=><div key={cat}><span>{human(cat)}</span><strong>{euro(revenues.filter(x=>x.category===cat).reduce((s,x)=>s+x.amount,0))}</strong></div>)}</section><section><h3>Économie matchday</h3>{Array.from(new Set([...revenues,...expenses].map(x=>x.matchRef).filter(Boolean))).map(ref=>{const rev=revenues.filter(x=>x.matchRef===ref).reduce((s,x)=>s+x.amount,0);const exp=expenses.filter(x=>x.matchRef===ref).reduce((s,x)=>s+x.amount,0);return <div key={String(ref)}><span>{ref}</span><strong>{euro(rev-exp)}</strong></div>})}<p>Billetterie + buvette + boutique + dépenses liées peuvent être rattachées au même match.</p></section></div>}
  {(tab==='revenues'||tab==='expenses')&&<><form className="biz-create compact" onSubmit={addMoney}><select value={form.moneyCategory||'AUTRE'} onChange={e=>setForm({...form,moneyCategory:e.target.value})}>{(tab==='revenues'?revenueCategories:expenseCategories).map(x=><option key={x}>{x}</option>)}</select><input required placeholder="Libellé" value={form.moneyLabel||''} onChange={e=>setForm({...form,moneyLabel:e.target.value})}/><input type="number" step="0.01" placeholder="Montant €" value={form.moneyAmount||''} onChange={e=>setForm({...form,moneyAmount:e.target.value})}/><input placeholder="Match ref (optionnel)" value={form.moneyMatchRef||''} onChange={e=>setForm({...form,moneyMatchRef:e.target.value})}/><input placeholder="Source / justificatif" value={form.moneySource||''} onChange={e=>setForm({...form,moneySource:e.target.value})}/><button>Ajouter</button></form><MoneyList rows={tab==='revenues'?revenues:expenses}/></>}
  {tab==='stock'&&<><form className="biz-create compact" onSubmit={addStock}><select value={form.stockChannel||'BUVETTE'} onChange={e=>setForm({...form,stockChannel:e.target.value})}><option>BUVETTE</option><option>BOUTIQUE</option><option>SPORT</option><option>AUTRE</option></select><input required placeholder="Article / produit" value={form.stockLabel||''} onChange={e=>setForm({...form,stockLabel:e.target.value})}/><input type="number" placeholder="Quantité" value={form.stockQty||''} onChange={e=>setForm({...form,stockQty:e.target.value})}/><input type="number" step="0.01" placeholder="Coût unité" value={form.stockCost||''} onChange={e=>setForm({...form,stockCost:e.target.value})}/><input type="number" step="0.01" placeholder="Prix vente" value={form.stockPrice||''} onChange={e=>setForm({...form,stockPrice:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{state.stockItems.map(x=><article key={x.id}><div><small>{x.channel}</small><strong>{x.label}</strong><span>Stock {x.quantity} · coût {x.unitCost==null?'?':euro(x.unitCost)} · vente {x.salePrice==null?'?':euro(x.salePrice)}</span></div><em>{x.status}</em></article>)}</div></>}
  {tab==='contracts'&&<><form className="biz-create compact" onSubmit={addContract}><select value={form.contractKind||'FOURNISSEUR'} onChange={e=>setForm({...form,contractKind:e.target.value})}><option>FOURNISSEUR</option><option>SPONSOR</option><option>ASSURANCE</option><option>CONVENTION</option><option>LOCATION</option><option>PRESTATAIRE</option></select><input required placeholder="Contrat / accord" value={form.contractLabel||''} onChange={e=>setForm({...form,contractLabel:e.target.value})}/><input placeholder="Partie / fournisseur" value={form.contractParty||''} onChange={e=>setForm({...form,contractParty:e.target.value})}/><input type="date" value={form.contractEnd||''} onChange={e=>setForm({...form,contractEnd:e.target.value})}/><input placeholder="Source / document" value={form.contractSource||''} onChange={e=>setForm({...form,contractSource:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{state.contracts.map(x=><article key={x.id}><div><small>{x.kind}</small><strong>{x.label}</strong><span>{x.party} · échéance {x.endAt||'inconnue'}</span></div><em>{x.status}</em></article>)}</div></>}
 </section>
}

function DocumentsPanel({docs,form,setForm,addDocument}:{docs:DocumentRef[];form:Record<string,string>;setForm:(x:Record<string,string>)=>void;addDocument:(e:React.FormEvent)=>void}){
 return <><form className="biz-create compact" onSubmit={addDocument}><input required placeholder="Document" value={form.docTitle||''} onChange={e=>setForm({...form,docTitle:e.target.value})}/><input placeholder="Type" value={form.docType||''} onChange={e=>setForm({...form,docType:e.target.value})}/><input placeholder="Version" value={form.docVersion||''} onChange={e=>setForm({...form,docVersion:e.target.value})}/><input type="date" aria-label="Valide jusqu'au" value={form.docValidUntil||''} onChange={e=>setForm({...form,docValidUntil:e.target.value})}/><input placeholder="Source" value={form.docSource||''} onChange={e=>setForm({...form,docSource:e.target.value})}/><button>Ajouter</button></form><div className="biz-table">{docs.length?docs.map(d=><article key={d.id}><div><small>{d.type} · v{d.version}</small><strong>{d.title}</strong><span>{d.validUntil?'Valide jusqu’au '+d.validUntil:'Validité inconnue'} · {d.source}</span></div><em>{human(d.status)}</em></article>):<div className="biz-empty">Aucun document enregistré. Aucun document administratif n’est inventé.</div>}</div></>
}
function MoneyList({rows}:{rows:MoneyRow[]}){
 return <div className="biz-table">{rows.length?rows.map(x=><article key={x.id}><div><small>{human(x.category)}{x.matchRef?' · '+x.matchRef:''}</small><strong>{x.label}</strong><span>{x.date} · {x.source}</span></div><b>{euro(x.amount)}</b></article>):<div className="biz-empty">Aucun flux saisi. Les montants réels restent inconnus tant qu’ils ne sont pas raccordés.</div>}</div>
}
