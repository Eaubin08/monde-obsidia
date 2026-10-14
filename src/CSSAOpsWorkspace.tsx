import {useEffect, useState, useMemo, useCallback} from 'react'
import './CSSAOps.css'

export type TaskStatus = 'A_FAIRE' | 'EN_COURS' | 'EN_ATTENTE' | 'BLOQUE' | 'TERMINE'
export type TaskPriority = 'CRITIQUE' | 'HAUTE' | 'NORMALE' | 'BASSE'
export type TaskOrigin = 'SPORTIF' | 'MATCHDAY' | 'ADMINISTRATION' | 'INTENDANCE' | 'COMMERCIAL' | 'AUTRE'

export type OpsTask = {
  id: string
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  dueAt: string
  origin: TaskOrigin
  structure: string
  team: string | null
  matchRef: string | null
  responsible: string
  responsiblePersonId?: string | null
  source: string
  truthClass: string
  checklist: Record<string, boolean>
  notes: string
  history: Array<{at: string; action: string; note?: string}>
  relations: Array<{type: string; targetId: string; label: string}>
  caseRef: string | null
}

export type CrmCase = {
  id: string
  subject: string
  category: string
  relatedOrg: string
  relatedOrgId?: string | null
  contactIds?: string[]
  responsible: string
  status: string
  priority: TaskPriority
  truthClass: string
  isTestFixture: boolean
  dates: {occurredAt: string; dueAt: string}
  provenance: string
  workflow?: {
    type: 'DECALAGE_MATCH' | 'FMI' | 'TERRAIN_CRENEAU' | 'STANDARD'
    matchRef?: string
    delayDays?: number
    otherClub?: string
    otherClubAgreement?: 'EN_ATTENTE' | 'ACCORD_OBTENU' | 'REFUS'
    requestSubmitted?: boolean
    channelUsed?: string
    lgefValidation?: string
    authorityNote?: string
    proofReceipt?: string
    fmiPrepControl?: string
    fmiTechnicalIncident?: boolean
    paperFallbackDocumented?: boolean
    transmissionDeadline?: string
    transmissionStatus?: string
    footclubsNotice?: string
    pitchConflictDetected?: boolean
    pitchConflictStatus?: string
    pitchResolutionIssue?: string
  }
  interactions: Array<{id: string; date: string; type: string; summary: string; channel: string; receipt?: string}>
  linkedTaskIds: string[]
  followup?: {id: string; taskRef?: string; dueAt?: string} | null
  history: Array<{at: string; action: string; note?: string}>
}

export type IntendanceItem = {
  id: string
  category: string
  title: string
  matchRef: string
  venue: string
  status: 'CONFIRMÉ' | 'À PRÉPARER' | 'EN ATTENTE' | 'UNKNOWN'
  notes: string
  truthClass: string
  linkedTaskId: string | null
  responsiblePersonId?: string | null
}

type OrgPerson = {id:string;displayName:string;status:string}
type OrgState = {people:OrgPerson[]}
type ExternalOrganization={id:string;name:string;kind:'COLLECTIVITE'|'CLUB'|'FOURNISSEUR'|'SPONSOR'|'PARTENAIRE'|'FEDERATION_LIGUE'|'ENTREPRISE'|'ASSOCIATION'|'AUTRE';status:'ACTIF'|'INACTIF'|'INCONNU';legalId:string;website:string;email:string;phone:string;address:string;source:string;note:string}
type ExternalContact={id:string;organizationId:string;displayName:string;role:string;email:string;phone:string;status:'ACTIF'|'INACTIF'|'INCONNU';source:string}
type ExternalInteraction={id:string;organizationId:string;contactId:string|null;caseId:string|null;dossierId:string|null;type:'EMAIL'|'APPEL'|'REUNION'|'QUESTION'|'REPONSE'|'RELANCE'|'DOCUMENT_RECU'|'NOTE';direction:'ENTRANT'|'SORTANT'|'INTERNE';channel:string;occurredAt:string;summary:string;proof:string;internalPersonId:string|null;followupTaskId:string|null;source:string}
type CrmDirectoryState={organizations:ExternalOrganization[];contacts:ExternalContact[];interactions:ExternalInteraction[]}

export type OpsState = {
  version: string
  updatedAt: string
  tasks: OpsTask[]
  cases: CrmCase[]
  intendanceItems: IntendanceItem[]
}

type Props = {
  activeModule: 'admin' | 'administration' | 'matchday' | 'intendance' | 'crm' | 'tasks'
  selectedId: string
  onSelect: (moduleId: string, id: string) => void
}

export default function CSSAOpsWorkspace({activeModule, selectedId, onSelect}: Props) {
  const [state, setState] = useState<OpsState | null>(null)
  const [orgState, setOrgState] = useState<OrgState | null>(null)
  const [directory, setDirectory] = useState<CrmDirectoryState | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Filtres
  const [statusFilter, setStatusFilter] = useState<string>('TOUT')
  const [originFilter, setOriginFilter] = useState<string>('TOUS')
  const [priorityFilter, setPriorityFilter] = useState<string>('TOUTES')
  const [crmTypeFilter, setCrmTypeFilter] = useState<string>('TOUT')
  const [crmMode,setCrmMode]=useState<'cases'|'directory'>('cases')
  const [directorySelectedId,setDirectorySelectedId]=useState('')
  const [showExternalCreate,setShowExternalCreate]=useState(false)
  const [externalForm,setExternalForm]=useState<Record<string,string>>({kind:'AUTRE'})
  const [intendanceCatFilter, setIntendanceCatFilter] = useState<string>('TOUT')

  // Formulaire création tâche
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newOrigin, setNewOrigin] = useState<TaskOrigin>('ADMINISTRATION')
  const [newPriority, setNewPriority] = useState<TaskPriority>('NORMALE')
  const [newMatchRef, setNewMatchRef] = useState('')
  const [newDueAt, setNewDueAt] = useState('2026-10-20')
  const [newResponsiblePersonId, setNewResponsiblePersonId] = useState('')

  // Draft note
  const [draftNote, setDraftNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Fetch state on mount
  const fetchOpsState = useCallback(async () => {
    try {
      const [res, orgRes, directoryRes] = await Promise.all([
        fetch('/obsidia-local/cssa-ops-state', {cache: 'no-store'}),
        fetch('/obsidia-local/cssa-organisation-state', {cache: 'no-store'}),
        fetch('/obsidia-local/cssa-crm-directory', {cache: 'no-store'})
      ])
      if (res.ok) {
        const data: OpsState = await res.json()
        setState(data)
      }
      if (orgRes.ok) setOrgState(await orgRes.json())
      if (directoryRes.ok) setDirectory(await directoryRes.json())
    } catch {}
    finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchOpsState()
  }, [fetchOpsState])

  // Sync draft note with selection
  useEffect(() => {
    if (!state) return
    if (activeModule === 'admin' || activeModule === 'administration' || activeModule === 'tasks') {
      const t = state.tasks.find(x => x.id === selectedId) || state.tasks[0]
      setDraftNote(t?.notes || '')
    } else if (activeModule === 'matchday' || activeModule === 'intendance') {
      const item = state.intendanceItems.find(x => x.id === selectedId) || state.intendanceItems[0]
      setDraftNote(item?.notes || '')
    }
  }, [activeModule, selectedId, state])

  // Post update
  const postPatch = async (patch: Record<string, unknown>) => {
    try {
      const res = await fetch('/obsidia-local/cssa-ops-state', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(patch)
      })
      if (res.ok) {
        const updated: OpsState = await res.json()
        setState(updated)
        window.dispatchEvent(new CustomEvent('cssa-ops-updated',{detail:updated}))
      }
    } catch {}
  }

  const postDirectory = async (patch:Record<string,unknown>) => {
    try{
      const res=await fetch('/obsidia-local/cssa-crm-directory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(patch)})
      if(res.ok)setDirectory(await res.json())
    }catch{}
  }

  const externalName=(id?:string|null)=>id?(directory?.organizations.find(x=>x.id===id)?.name||'ORGANISME INCONNU'):'NON RACCORDE'
  const extUid=(prefix:string)=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6)

  const createExternalOrganization=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!externalForm.orgName?.trim())return
    const id=extUid('org')
    await postDirectory({organizationPatch:{id,name:externalForm.orgName.trim(),kind:externalForm.kind||'AUTRE',status:'ACTIF',legalId:externalForm.legalId?.trim()||'',website:externalForm.website?.trim()||'',email:externalForm.email?.trim()||'',phone:externalForm.phone?.trim()||'',address:externalForm.address?.trim()||'',source:externalForm.source?.trim()||'SAISIE_INTERNE_A_VERIFIER',note:''}})
    setDirectorySelectedId(id);setShowExternalCreate(false);setExternalForm({kind:'AUTRE'})
  }

  const createExternalInteraction=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!selectedExternal||!externalForm.interactionSummary?.trim())return
    const id=extUid('interaction')
    let followupTaskId:string|null=null
    if(externalForm.followupDueAt){
      followupTaskId=extUid('task-crm')
      const task:OpsTask={
        id:followupTaskId,
        title:externalForm.followupTitle?.trim()||('Relance '+selectedExternal.name),
        description:'Suivi créé depuis une interaction CRM',
        status:'A_FAIRE',
        priority:'NORMALE',
        dueAt:externalForm.followupDueAt,
        origin:'COMMERCIAL',
        structure:'cssa',
        team:null,
        matchRef:null,
        responsible:externalForm.interactionPersonId?personName(externalForm.interactionPersonId):'UNKNOWN / NON ASSIGNÉ',
        responsiblePersonId:externalForm.interactionPersonId||null,
        source:'Journal relationnel CRM',
        truthClass:'PUBLIC_CONFIRMED',
        checklist:{},
        notes:'',
        history:[{at:new Date().toISOString(),action:'CREATION',note:'Créée depuis interaction CRM '+id}],
        relations:[{type:'CRM_ORGANIZATION',targetId:selectedExternal.id,label:selectedExternal.name},{type:'CRM_INTERACTION',targetId:id,label:'Interaction CRM'}],
        caseRef:null
      }
      await postPatch({taskPatch:task})
    }
    await postDirectory({interactionPatch:{
      id,
      organizationId:selectedExternal.id,
      contactId:externalForm.interactionContactId||null,
      caseId:externalForm.interactionCaseId||null,
      dossierId:externalForm.interactionDossierId||null,
      type:externalForm.interactionType||'NOTE',
      direction:externalForm.interactionDirection||'INTERNE',
      channel:externalForm.interactionChannel||'AUTRE',
      occurredAt:externalForm.interactionOccurredAt||new Date().toISOString(),
      summary:externalForm.interactionSummary.trim(),
      proof:externalForm.interactionProof?.trim()||'NON_RACCORDEE',
      internalPersonId:externalForm.interactionPersonId||null,
      followupTaskId,
      source:externalForm.interactionSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'
    }})
    setExternalForm({...externalForm,interactionSummary:'',interactionProof:'',interactionSource:'',followupDueAt:'',followupTitle:''})
  }

  const createExternalContact=async(e:React.FormEvent)=>{
    e.preventDefault()
    if(!directorySelectedId||!externalForm.contactName?.trim())return
    await postDirectory({contactPatch:{id:extUid('contact'),organizationId:directorySelectedId,displayName:externalForm.contactName.trim(),role:externalForm.contactRole?.trim()||'INCONNU',email:externalForm.contactEmail?.trim()||'',phone:externalForm.contactPhone?.trim()||'',status:'ACTIF',source:externalForm.contactSource?.trim()||'SAISIE_INTERNE_A_VERIFIER'}})
    setExternalForm({...externalForm,contactName:'',contactRole:'',contactEmail:'',contactPhone:'',contactSource:''})
  }

  const personName = (personId?: string | null) => {
    if (!personId) return 'NON ASSIGNÉ'
    return orgState?.people.find(p => p.id === personId)?.displayName || 'PERSONNE INCONNUE'
  }

  const handleTaskResponsible = (taskId: string, personId: string) => {
    if (!state) return
    const target = state.tasks.find(t => t.id === taskId)
    if (!target) return
    const updated = {...target, responsiblePersonId: personId || null, responsible: personId ? personName(personId) : 'UNKNOWN / NON ASSIGNÉ'}
    setState(prev => prev ? {...prev, tasks: prev.tasks.map(t => t.id === taskId ? updated : t)} : null)
    void postPatch({taskPatch: updated})
  }

  const handleIntendanceResponsible = (itemId: string, personId: string) => {
    if (!state) return
    const target = state.intendanceItems.find(i => i.id === itemId)
    if (!target) return
    const updated = {...target, responsiblePersonId: personId || null}
    setState(prev => prev ? {...prev, intendanceItems: prev.intendanceItems.map(i => i.id === itemId ? updated : i)} : null)
    void postPatch({intendancePatch: updated})
  }

  // Tâche : changement de statut
  const handleTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    if (!state) return
    const target = state.tasks.find(t => t.id === taskId)
    if (!target) return
    const updated = {
      ...target,
      status: nextStatus,
      history: [
        ...(target.history || []),
        {at: new Date().toISOString(), action: 'STATUT', note: `Statut changé à ${nextStatus}`}
      ]
    }
    setState(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
    } : null)
    void postPatch({taskPatch: updated})
  }

  // Tâche : changement de priorité
  const handleTaskPriority = (taskId: string, nextPriority: TaskPriority) => {
    if (!state) return
    const target = state.tasks.find(t => t.id === taskId)
    if (!target) return
    const updated = {...target, priority: nextPriority}
    setState(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
    } : null)
    void postPatch({taskPatch: updated})
  }

  // Tâche : checklist toggle
  const handleToggleChecklist = (taskId: string, key: string) => {
    if (!state) return
    const target = state.tasks.find(t => t.id === taskId)
    if (!target) return
    const updatedChecks = {...target.checklist, [key]: !target.checklist[key]}
    const updated = {...target, checklist: updatedChecks}
    setState(prev => prev ? {
      ...prev,
      tasks: prev.tasks.map(t => t.id === taskId ? updated : t)
    } : null)
    void postPatch({taskPatch: updated})
  }

  // Tâche : sauvegarde note
  const handleSaveTaskNote = async (taskId: string) => {
    if (!state) return
    setSavingNote(true)
    const target = state.tasks.find(t => t.id === taskId)
    if (!target) return
    const updated = {...target, notes: draftNote}
    await postPatch({taskPatch: updated})
    setSavingNote(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  // Tâche : suppression
  const handleTaskDelete = (taskId: string) => {
    if (!state) return
    setState(prev => prev ? {
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId)
    } : null)
    void postPatch({taskDeleteId: taskId})
  }

  // Intendance : changement de statut
  const handleIntendanceStatus = (itemId: string, nextStatus: 'CONFIRMÉ' | 'À PRÉPARER' | 'EN ATTENTE' | 'UNKNOWN') => {
    if (!state) return
    const target = state.intendanceItems.find(i => i.id === itemId)
    if (!target) return
    const updated = {...target, status: nextStatus}
    setState(prev => prev ? {
      ...prev,
      intendanceItems: prev.intendanceItems.map(i => i.id === itemId ? updated : i)
    } : null)
    void postPatch({intendancePatch: updated})
  }

  // Intendance : sauvegarde note
  const handleSaveIntendanceNote = async (itemId: string) => {
    if (!state) return
    setSavingNote(true)
    const target = state.intendanceItems.find(i => i.id === itemId)
    if (!target) return
    const updated = {...target, notes: draftNote}
    await postPatch({intendancePatch: updated})
    setSavingNote(false)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }

  // Création d'une nouvelle tâche
  const handleCreateTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !state) return
    const newTask: OpsTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Création manuelle boîte de travail',
      status: 'A_FAIRE',
      priority: newPriority,
      dueAt: newDueAt,
      origin: newOrigin,
      structure: 'cssa',
      team: newMatchRef ? (newMatchRef.startsWith('r1-') ? 'SENIORS_R1' : newMatchRef.startsWith('r2-') ? 'SENIORS_R2' : 'U20_R1') : null,
      matchRef: newMatchRef.trim() || null,
      responsible: newResponsiblePersonId ? personName(newResponsiblePersonId) : 'UNKNOWN / NON ASSIGNÉ',
      responsiblePersonId: newResponsiblePersonId || null,
      source: 'Boîte de travail Administration CSSA',
      truthClass: 'PUBLIC_CONFIRMED',
      checklist: {},
      notes: '',
      history: [{at: new Date().toISOString(), action: 'CREATION', note: 'Création manuelle'}],
      relations: newMatchRef.trim() ? [{type: 'MATCH', targetId: newMatchRef.trim(), label: `Match ${newMatchRef.trim()}`}] : [],
      caseRef: null
    }

    setState(prev => prev ? {
      ...prev,
      tasks: [newTask, ...prev.tasks]
    } : null)
    void postPatch({taskPatch: newTask})

    setNewTitle('')
    setNewDesc('')
    setNewMatchRef('')
    setNewResponsiblePersonId('')
    setShowCreateModal(false)
    onSelect(activeModule, newTask.id)
  }

  // Filtres applicables aux tâches
  const filteredTasks = useMemo(() => {
    if (!state) return []
    return state.tasks.filter(t => {
      if (statusFilter !== 'TOUT' && t.status !== statusFilter) return false
      if (originFilter !== 'TOUS' && t.origin !== originFilter) return false
      if (priorityFilter !== 'TOUTES' && t.priority !== priorityFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.matchRef && t.matchRef.toLowerCase().includes(q))
      }
      return true
    })
  }, [state, statusFilter, originFilter, priorityFilter, searchQuery])

  // Filtres applicables aux dossiers CRM
  const filteredCases = useMemo(() => {
    if (!state) return []
    return state.cases.filter(c => {
      if (crmTypeFilter === 'TEST_ONLY' && !c.isTestFixture) return false
      if (crmTypeFilter === 'REAL_ONLY' && c.isTestFixture) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return c.subject.toLowerCase().includes(q) || c.relatedOrg.toLowerCase().includes(q)
      }
      return true
    })
  }, [state, crmTypeFilter, searchQuery])

  // Filtres applicables à l'intendance
  const filteredIntendance = useMemo(() => {
    if (!state) return []
    return state.intendanceItems.filter(i => {
      if (intendanceCatFilter !== 'TOUT' && i.category !== intendanceCatFilter) return false
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        return i.title.toLowerCase().includes(q) || i.venue.toLowerCase().includes(q) || i.matchRef.toLowerCase().includes(q)
      }
      return true
    })
  }, [state, intendanceCatFilter, searchQuery])

  // Sélection courante
  const selectedTask = useMemo(() => {
    if (!state || !state.tasks.length) return null
    return state.tasks.find(t => t.id === selectedId) || state.tasks[0]
  }, [state, selectedId])

  const selectedCase = useMemo(() => {
    if (!state || !state.cases.length) return null
    return state.cases.find(c => c.id === selectedId) || state.cases[0]
  }, [state, selectedId])
  const selectedExternal=useMemo(()=>{
    if(!directory?.organizations.length)return null
    return directory.organizations.find(x=>x.id===directorySelectedId)||directory.organizations[0]
  },[directory,directorySelectedId])

  const selectedIntendance = useMemo(() => {
    if (!state || !state.intendanceItems.length) return null
    return state.intendanceItems.find(i => i.id === selectedId) || state.intendanceItems[0]
  }, [state, selectedId])

  if (loading) {
    return (
      <div className="ops-workbox" style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <p style={{fontSize: '12px', color: '#88a3be'}}>Chargement de la boîte de travail CSSA…</p>
      </div>
    )
  }

  const isTaskOrAdminView = activeModule === 'admin' || activeModule === 'administration' || activeModule === 'tasks'
  const isCrmView = activeModule === 'crm'
  const isIntendanceView = activeModule === 'matchday' || activeModule === 'intendance'

  return (
    <div className="ops-wrapper">
      <div className="ops-workbox">
      {/* ========================================================
          COLONNE 1 : Catégories & Filtres (Boîte de travail)
          ======================================================== */}
      <aside className="ops-col-filters">
        <header className="ops-col-head">
          <h3>Filtres & Navigation</h3>
          <span>
            {isTaskOrAdminView && `${filteredTasks.length} tâches`}
            {isCrmView && `${filteredCases.length} dossiers`}
            {isIntendanceView && `${filteredIntendance.length} items`}
          </span>
        </header>

        {/* Bouton création de tâche */}
        {isTaskOrAdminView && (
          <button className="ops-btn-new-task" onClick={() => setShowCreateModal(true)}>
            <span>+</span> Nouvelle tâche
          </button>
        )}

        {/* Filtre par État (pour Tâches & Admin) */}
        {isTaskOrAdminView && (
          <div className="ops-filter-section">
            <small>Par État</small>
            {[
              {id: 'TOUT', label: 'Tous les états'},
              {id: 'A_FAIRE', label: 'À faire'},
              {id: 'EN_COURS', label: 'En cours'},
              {id: 'EN_ATTENTE', label: 'En attente'},
              {id: 'BLOQUE', label: 'Bloqué'},
              {id: 'TERMINE', label: 'Terminé'}
            ].map(f => (
              <button
                key={f.id}
                className={`ops-filter-link ${statusFilter === f.id ? 'active' : ''}`}
                onClick={() => setStatusFilter(f.id)}
              >
                <span>{f.label}</span>
                <b>{f.id === 'TOUT' ? state?.tasks.length : state?.tasks.filter(t => t.status === f.id).length}</b>
              </button>
            ))}
          </div>
        )}

            {/* Filtre par Origine */}
        {isTaskOrAdminView && (
          <div className="ops-filter-section">
            <small>Par Domaine / Origine</small>
            {[
              {id: 'TOUS', label: 'Tous les domaines'},
              {id: 'SPORTIF', label: 'Sportif'},
              {id: 'MATCHDAY', label: 'Matchday'},
              {id: 'ADMINISTRATION', label: 'Administration'},
              {id: 'INTENDANCE', label: 'Intendance'},
              {id: 'COMMERCIAL', label: 'Commercial'}
            ].map(f => (
              <button
                key={f.id}
                className={`ops-filter-link ${originFilter === f.id ? 'active' : ''}`}
                onClick={() => setOriginFilter(f.id)}
              >
                <span>{f.label}</span>
                <b>{f.id === 'TOUS' ? state?.tasks.length : state?.tasks.filter(t => t.origin === f.id).length}</b>
              </button>
            ))}
          </div>
        )}

        {/* Filtre par Priorité */}
        {isTaskOrAdminView && (
          <div className="ops-filter-section">
            <small>Priorité</small>
            {[
              {id: 'TOUTES', label: 'Toutes priorités'},
              {id: 'CRITIQUE', label: 'Critique'},
              {id: 'HAUTE', label: 'Haute'},
              {id: 'NORMALE', label: 'Normale'},
              {id: 'BASSE', label: 'Basse'}
            ].map(f => (
              <button
                key={f.id}
                className={`ops-filter-link ${priorityFilter === f.id ? 'active' : ''}`}
                onClick={() => setPriorityFilter(f.id)}
              >
                <span>{f.label}</span>
                <b>{f.id === 'TOUTES' ? state?.tasks.length : state?.tasks.filter(t => t.priority === f.id).length}</b>
              </button>
            ))}
          </div>
        )}

        {/* Filtre CRM */}
        {isCrmView && (
          <>
          <div className="ops-filter-section">
            <small>Vue CRM</small>
            <button className={`ops-filter-link ${crmMode==='cases'?'active':''}`} onClick={()=>setCrmMode('cases')}><span>Dossiers / relations</span><b>{state?.cases.length||0}</b></button>
            <button className={`ops-filter-link ${crmMode==='directory'?'active':''}`} onClick={()=>setCrmMode('directory')}><span>Répertoire externe</span><b>{directory?.organizations.length||0}</b></button>
          </div>
          {crmMode==='cases'&&<div className="ops-filter-section">
            <small>Vérité & Dossiers</small>
            {[
              {id: 'TOUT', label: 'Tous les dossiers'},
              {id: 'REAL_ONLY', label: 'Dossiers réels sourcés'},
              {id: 'TEST_ONLY', label: 'Fixtures test F3H-D'}
            ].map(f => (
              <button
                key={f.id}
                className={`ops-filter-link ${crmTypeFilter === f.id ? 'active' : ''}`}
                onClick={() => setCrmTypeFilter(f.id)}
              >
                <span>{f.label}</span>
                <b>
                  {f.id === 'TOUT'
                    ? state?.cases.length
                    : f.id === 'REAL_ONLY'
                    ? state?.cases.filter(c => !c.isTestFixture).length
                    : state?.cases.filter(c => c.isTestFixture).length}
                </b>
              </button>
            ))}
          </div>}
          </>
        )}

        {/* Filtre Intendance */}
        {isIntendanceView && (
          <div className="ops-filter-section">
            <small>Catégories Intendance</small>
            {['TOUT', 'TRANSPORT', 'MATERIEL', 'TERRAIN', 'VESTIAIRES', 'BENEVOLES', 'MATCHDAY'].map(cat => (
              <button
                key={cat}
                className={`ops-filter-link ${intendanceCatFilter === cat ? 'active' : ''}`}
                onClick={() => setIntendanceCatFilter(cat)}
              >
                <span>{cat === 'TOUT' ? 'Toutes' : cat}</span>
                <b>
                  {cat === 'TOUT'
                    ? state?.intendanceItems.length
                    : state?.intendanceItems.filter(i => i.category === cat).length}
                </b>
              </button>
            ))}
          </div>
        )}
      </aside>

      {/* ========================================================
          COLONNE 2 : Liste de tâches / dossiers
          ======================================================== */}
      <section className="ops-col-list">
        <header className="ops-col-head">
          <h3>
            {isTaskOrAdminView && (activeModule === 'tasks' ? 'Tâches du Club' : 'Administration & Suivi')}
            {isCrmView && (crmMode==='cases'?'Dossiers CRM & Relations':'Répertoire des acteurs externes')}
            {isIntendanceView && 'Besoins Logistiques & Intendance'}
          </h3>
          <span>
            {isTaskOrAdminView && `${filteredTasks.length} résultats`}
            {isCrmView && (crmMode==='cases'?`${filteredCases.length} résultats`:`${directory?.organizations.length||0} organismes`)}
            {isIntendanceView && `${filteredIntendance.length} résultats`}
          </span>
        </header>

        {/* Recherche rapide */}
        <div className="ops-search-bar">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Rechercher par titre, mot-clé, match lié..."
          />
        </div>
        {isCrmView&&crmMode==='directory'&&<button className="ops-btn-new-task" onClick={()=>setShowExternalCreate(v=>!v)}>+ Nouvel organisme</button>}
        {isCrmView&&crmMode==='directory'&&showExternalCreate&&<form className="ops-create-modal" onSubmit={createExternalOrganization}>
          <h4>Nouvel acteur externe</h4>
          <input required placeholder="Nom organisme / club / fournisseur" value={externalForm.orgName||''} onChange={e=>setExternalForm({...externalForm,orgName:e.target.value})}/>
          <select value={externalForm.kind||'AUTRE'} onChange={e=>setExternalForm({...externalForm,kind:e.target.value})}><option>COLLECTIVITE</option><option>CLUB</option><option>FOURNISSEUR</option><option>SPONSOR</option><option>PARTENAIRE</option><option>FEDERATION_LIGUE</option><option>ENTREPRISE</option><option>ASSOCIATION</option><option>AUTRE</option></select>
          <input placeholder="Identifiant légal (optionnel)" value={externalForm.legalId||''} onChange={e=>setExternalForm({...externalForm,legalId:e.target.value})}/>
          <input placeholder="Email" value={externalForm.email||''} onChange={e=>setExternalForm({...externalForm,email:e.target.value})}/>
          <input placeholder="Source / preuve" value={externalForm.source||''} onChange={e=>setExternalForm({...externalForm,source:e.target.value})}/>
          <div className="ops-create-modal-actions"><button type="button" className="ops-state-btn" onClick={()=>setShowExternalCreate(false)}>Annuler</button><button className="ops-btn-save">Créer</button></div>
        </form>}

        {/* Modale inline création tâche */}
        {showCreateModal && (
          <form className="ops-create-modal" onSubmit={handleCreateTaskSubmit}>
            <h4>Nouvelle tâche opérationnelle</h4>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Titre de la tâche (ex: Confirmer arbitre officiel)..."
              required
            />
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description ou objet..."
              rows={2}
            />
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
              <select value={newOrigin} onChange={e => setNewOrigin(e.target.value as any)}>
                <option value="ADMINISTRATION">Administration</option>
                <option value="SPORTIF">Sportif</option>
                <option value="INTENDANCE">Intendance</option>
                <option value="MATCHDAY">Matchday</option>
                <option value="COMMERCIAL">Commercial</option>
              </select>
              <select value={newPriority} onChange={e => setNewPriority(e.target.value as any)}>
                <option value="CRITIQUE">Critique</option>
                <option value="HAUTE">Haute</option>
                <option value="NORMALE">Normale</option>
                <option value="BASSE">Basse</option>
              </select>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px'}}>
              <input
                type="text"
                value={newMatchRef}
                onChange={e => setNewMatchRef(e.target.value)}
                placeholder="Match lié (ex: r1-j7)"
              />
              <input
                type="date"
                value={newDueAt}
                onChange={e => setNewDueAt(e.target.value)}
              />
            </div>
            <select value={newResponsiblePersonId} onChange={e => setNewResponsiblePersonId(e.target.value)}>
              <option value="">Responsable : non assigné</option>
              {(orgState?.people || []).filter(p => p.status === 'ACTIF').map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
            </select>
            <div className="ops-create-modal-actions">
              <button type="button" className="ops-state-btn" onClick={() => setShowCreateModal(false)}>
                Annuler
              </button>
              <button type="submit" className="ops-btn-save">
                Créer la tâche
              </button>
            </div>
          </form>
        )}

        {/* Scroll list */}
        <div className="ops-items-scroll">
          {/* VUE TÂCHES / ADMIN */}
          {isTaskOrAdminView &&
            filteredTasks.map(t => (
              <div
                key={t.id}
                className={`ops-row-card ${selectedTask?.id === t.id ? 'active' : ''}`}
                onClick={() => onSelect(activeModule, t.id)}
              >
                <div className="ops-row-top">
                  <span className="ops-row-title">{t.title}</span>
                  <span className={`badge-status ${t.status.toLowerCase()}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="ops-row-sub">{t.description}</div>
                <div className="ops-row-tags">
                  <span className={`badge-priority ${t.priority.toLowerCase()}`}>{t.priority}</span>
                  <span className="badge-origin">{t.origin}</span>
                  {t.matchRef && <span className="badge-origin">Match: {t.matchRef}</span>}
                  <span className="badge-truth" style={{fontSize: '7px'}}>
                    👤 {t.responsiblePersonId ? personName(t.responsiblePersonId) : t.responsible}
                  </span>
                  <span style={{fontSize: '8px', color: '#688099', marginLeft: 'auto'}}>📅 {t.dueAt}</span>
                </div>
              </div>
            ))}

          {/* VUE CRM */}
          {isCrmView && crmMode==='cases' &&
            filteredCases.map(c => (
              <div
                key={c.id}
                className={`ops-row-card ${selectedCase?.id === c.id ? 'active' : ''}`}
                onClick={() => onSelect('crm', c.id)}
              >
                <div className="ops-row-top">
                  <span className="ops-row-title">{c.subject}</span>
                  <span className="badge-status">{c.status}</span>
                </div>
                <div className="ops-row-sub">{c.relatedOrg}</div>
                <div className="ops-row-tags">
                  <span className={`badge-truth ${c.truthClass.toLowerCase()}`}>
                    {c.isTestFixture ? 'TEST_FIXTURE · SIMULATED' : c.truthClass}
                  </span>
                  <span className="badge-origin">{c.category}</span>
                </div>
              </div>
            ))}
          {isCrmView&&crmMode==='directory'&&(directory?.organizations||[]).filter(o=>!searchQuery.trim()||o.name.toLowerCase().includes(searchQuery.toLowerCase())).map(o=><div key={o.id} className={`ops-row-card ${selectedExternal?.id===o.id?'active':''}`} onClick={()=>setDirectorySelectedId(o.id)}>
            <div className="ops-row-top"><span className="ops-row-title">{o.name}</span><span className="badge-status">{o.status}</span></div>
            <div className="ops-row-sub">{o.kind}{o.legalId?' · '+o.legalId:''}</div>
            <div className="ops-row-tags"><span className="badge-origin">{(directory?.contacts||[]).filter(c=>c.organizationId===o.id).length} contact(s)</span><span className="badge-truth">{o.source||'Source inconnue'}</span></div>
          </div>)}

          {/* VUE INTENDANCE */}
          {isIntendanceView &&
            filteredIntendance.map(item => (
              <div
                key={item.id}
                className={`ops-row-card ${selectedIntendance?.id === item.id ? 'active' : ''}`}
                onClick={() => onSelect(activeModule, item.id)}
              >
                <div className="ops-row-top">
                  <span className="ops-row-title">{item.title}</span>
                  <span
                    className="badge-status"
                    style={{
                      borderColor:
                        item.status === 'CONFIRMÉ'
                          ? '#167657'
                          : item.status === 'À PRÉPARER'
                          ? '#754b17'
                          : '#45596e'
                    }}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="ops-row-sub">Lieu : {item.venue} · Match : {item.matchRef}</div>
                <div className="ops-row-tags">
                  <span className="badge-origin">{item.category}</span>
                  <span className="badge-truth">{item.truthClass}</span>
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* ========================================================
          COLONNE 3 : Détail opérationnel + Actions
          ======================================================== */}
      <main className="ops-col-detail">
        {/* DÉTAIL TÂCHE (Admin & Tasks) */}
        {isTaskOrAdminView && selectedTask && (
          <>
            <header className="ops-detail-header">
              <div className="ops-detail-top-row">
                <h2>{selectedTask.title}</h2>
                <div style={{display: 'flex', gap: '6px', alignItems: 'center'}}>
                  <span className={`badge-status ${selectedTask.status.toLowerCase()}`}>
                    {selectedTask.status.replace('_', ' ')}
                  </span>
                  <button
                    className="ops-state-btn"
                    style={{color: '#d66767'}}
                    onClick={() => handleTaskDelete(selectedTask.id)}
                    title="Supprimer la tâche"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="ops-detail-meta-band">
                <span className={`badge-priority ${selectedTask.priority.toLowerCase()}`}>
                  Priorité : {selectedTask.priority}
                </span>
                <span className="badge-origin">Origine : {selectedTask.origin}</span>
                <span className="badge-truth">Vérité : {selectedTask.truthClass}</span>
                <span className="badge-origin">Échéance : {selectedTask.dueAt}</span>
                {selectedTask.matchRef && (
                  <button
                    className="ops-link-pill"
                    onClick={() => {
                      location.hash = `#cssa/sportif/SENIORS_R1/${selectedTask.matchRef}`
                    }}
                  >
                    Match lié : {selectedTask.matchRef} ↗
                  </button>
                )}
                {selectedTask.caseRef && (
                  <button
                    className="ops-link-pill"
                    onClick={() => onSelect('crm', selectedTask.caseRef!)}
                  >
                    Dossier CRM : {selectedTask.caseRef} ↗
                  </button>
                )}
              </div>

              <p className="ops-detail-desc">{selectedTask.description}</p>
            </header>

            <div className="ops-detail-sections">
              {/* Actions rapides sur l'état */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Changer l’état opérationnel</h4>
                </div>
                <div className="ops-actions-strip">
                  {(['A_FAIRE', 'EN_COURS', 'EN_ATTENTE', 'BLOQUE', 'TERMINE'] as TaskStatus[]).map(st => (
                    <button
                      key={st}
                      className={`ops-state-btn ${selectedTask.status === st ? 'active' : ''}`}
                      onClick={() => handleTaskStatus(selectedTask.id, st)}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions sur la priorité */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Changer la priorité</h4>
                </div>
                <div className="ops-actions-strip">
                  {(['CRITIQUE', 'HAUTE', 'NORMALE', 'BASSE'] as TaskPriority[]).map(pr => (
                    <button
                      key={pr}
                      className={`ops-state-btn ${selectedTask.priority === pr ? 'active' : ''}`}
                      onClick={() => handleTaskPriority(selectedTask.id, pr)}
                    >
                      {pr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsable canonique Organisation */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Responsable assigné</h4>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap'}}>
                  <select className="ops-person-select" value={selectedTask.responsiblePersonId || ''} onChange={e => handleTaskResponsible(selectedTask.id, e.target.value)}>
                    <option value="">NON ASSIGNÉ</option>
                    {(orgState?.people || []).filter(p => p.status === 'ACTIF').map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                  </select>
                  <small style={{fontSize: '8.5px', color: '#7a8fA6'}}>
                    Référence vers Organisation. Aucun nom n’est inventé ou recopié comme seconde source de vérité.
                  </small>
                </div>
              </div>

              {/* Checklist opérationnelle */}
              {Object.keys(selectedTask.checklist).length > 0 && (
                <div className="ops-panel-box">
                  <div className="ops-panel-box-head">
                    <h4>Points de contrôle</h4>
                    <span>
                      {Object.values(selectedTask.checklist).filter(Boolean).length} /{' '}
                      {Object.keys(selectedTask.checklist).length} validés
                    </span>
                  </div>
                  {(() => {
                    const total = Object.keys(selectedTask.checklist).length
                    const done = Object.values(selectedTask.checklist).filter(Boolean).length
                    const pct = total > 0 ? Math.round((done / total) * 100) : 0
                    return (
                      <div className="ops-progress-track" title={`${done}/${total} (${pct}%)`}>
                        <div className="ops-progress-fill" style={{width: `${pct}%`}} />
                      </div>
                    )
                  })()}
                  <div className="ops-checklist">
                    {Object.entries(selectedTask.checklist).map(([key, val]) => (
                      <label key={key} className={`ops-check-row ${val ? 'done' : ''}`}>
                        <input
                          type="checkbox"
                          checked={val}
                          onChange={() => handleToggleChecklist(selectedTask.id, key)}
                        />
                        <span>{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes persistantes */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Notes & Consignes d’exécution</h4>
                  {saveSuccess && <span className="ops-save-indicator">✓ Enregistré sur disque</span>}
                </div>
                <textarea
                  className="ops-notes-textarea"
                  value={draftNote}
                  onChange={e => setDraftNote(e.target.value)}
                  placeholder="Ajouter une consigne opérationnelle, un numéro de contact ou un point de blocage..."
                />
                <div className="ops-notes-footer">
                  <button
                    className="ops-btn-save"
                    disabled={savingNote}
                    onClick={() => handleSaveTaskNote(selectedTask.id)}
                  >
                    {savingNote ? 'Sauvegarde…' : 'Sauvegarder la note'}
                  </button>
                </div>
              </div>

              {/* Relations & Liens transversaux */}
              {((selectedTask.relations && selectedTask.relations.length > 0) || selectedTask.matchRef || selectedTask.caseRef) && (
                <div className="ops-panel-box">
                  <div className="ops-panel-box-head">
                    <h4>Liaisons Métier & Relations</h4>
                    <span>{(selectedTask.relations?.length || 0) + (selectedTask.matchRef ? 1 : 0) + (selectedTask.caseRef ? 1 : 0)} liens</span>
                  </div>
                  <div className="ops-relations-list">
                    {selectedTask.matchRef && (
                      <button
                        type="button"
                        className="ops-relation-callout"
                        onClick={() => {
                          const teamKey = selectedTask.team || 'SENIORS_R1'
                          location.hash = `#cssa/sportif/${teamKey}/${selectedTask.matchRef}`
                        }}
                      >
                        <span className="ops-rel-type">SPORTIF</span>
                        <strong>Dossier de match {selectedTask.matchRef}</strong>
                        <em>Ouvrir la fiche de match ↗</em>
                      </button>
                    )}
                    {selectedTask.caseRef && (
                      <button
                        type="button"
                        className="ops-relation-callout"
                        onClick={() => onSelect('crm', selectedTask.caseRef!)}
                      >
                        <span className="ops-rel-type">CRM / LITIGE</span>
                        <strong>Dossier de réclamation {selectedTask.caseRef}</strong>
                        <em>Inspecter le dossier CRM ↗</em>
                      </button>
                    )}
                    {(selectedTask.relations || []).map((rel, idx) => (
                      <div key={idx} className="ops-relation-callout generic">
                        <span className="ops-rel-type">{rel.type}</span>
                        <strong>{rel.label}</strong>
                        <em>Cible : {rel.targetId}</em>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique horodaté */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Historique des événements</h4>
                  <span>{(selectedTask.history || []).length} traces</span>
                </div>
                <div className="ops-checklist">
                  {(selectedTask.history || []).map((h, i) => (
                    <div key={i} className="ops-check-row" style={{cursor: 'default'}}>
                      <span className="badge-origin" style={{fontSize: '7px'}}>
                        {h.at.slice(0, 10)}
                      </span>
                      <strong style={{fontSize: '9.5px', color: '#c5d8ec'}}>{h.action}</strong>
                      <span style={{fontSize: '9px', color: '#8299af', marginLeft: 'auto'}}>{h.note}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* DÉTAIL CASE (CRM & Relations) */}
        {isCrmView && crmMode==='cases' && selectedCase && (
          <>
            <header className="ops-detail-header">
              <div className="ops-detail-top-row">
                <div>
                  <small style={{font: '8px ui-monospace, monospace', color: '#7b95ae'}}>
                    {selectedCase.category} · {selectedCase.relatedOrgId?externalName(selectedCase.relatedOrgId):selectedCase.relatedOrg}
                  </small>
                  <h2>{selectedCase.subject}</h2>
                </div>
                <span className="badge-status">{selectedCase.status}</span>
              </div>

              <div className="ops-detail-meta-band">
                <span className={`badge-truth ${selectedCase.truthClass.toLowerCase()}`}>
                  {selectedCase.isTestFixture ? 'SIMULATED_NOT_OBSERVED (Fixture F3H-D)' : selectedCase.truthClass}
                </span>
                <span className={`badge-priority ${selectedCase.priority.toLowerCase()}`}>
                  Priorité : {selectedCase.priority}
                </span>
                <span className="badge-origin">Échéance : {selectedCase.dates.dueAt}</span>
                <span className="badge-origin">Responsable : {selectedCase.responsible}</span>
                <select className="ops-person-select" aria-label="Organisme CRM" value={selectedCase.relatedOrgId||''} onChange={e=>postPatch({casePatch:{...selectedCase,relatedOrgId:e.target.value||null,relatedOrg:e.target.value?externalName(e.target.value):selectedCase.relatedOrg}})}>
                  <option value="">Organisme non raccordé</option>
                  {(directory?.organizations||[]).map(o=><option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              <p className="ops-detail-desc">Provenance : {selectedCase.provenance}</p>
            </header>

            <div className="ops-detail-sections">
              {/* WORKFLOW SOURCÉ LGEF / ART. 20.7 / ART. 24 */}
              {selectedCase.workflow && (
                <div className="ops-panel-box">
                  <div className="ops-panel-box-head">
                    <h4>Flux réglementaire documenté</h4>
                    <span className="badge-origin">{selectedCase.workflow.type}</span>
                  </div>

                  {selectedCase.workflow.type === 'DECALAGE_MATCH' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      <div className="ops-workflow-grid">
                        <div className="ops-workflow-item">
                          <small>Match concerné</small>
                          <strong>{selectedCase.workflow.matchRef}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Délai avant rencontre</small>
                          <strong>{selectedCase.workflow.delayDays} jours (Late Window &lt; 10 j)</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Autre club</small>
                          <strong>{selectedCase.workflow.otherClub}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Accord autre club</small>
                          <strong>{selectedCase.workflow.otherClubAgreement}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Canal réglementaire</small>
                          <strong>{selectedCase.workflow.channelUsed}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Validation LGEF</small>
                          <strong>{selectedCase.workflow.lgefValidation}</strong>
                        </div>
                      </div>
                      <div className="ops-authority-alert">
                        ⚠️ <strong>Règle d’autorité LGEF Art. 20.7 :</strong>{' '}
                        {selectedCase.workflow.authorityNote}
                      </div>
                    </div>
                  )}

                  {selectedCase.workflow.type === 'FMI' && (
                    <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                      <div className="ops-workflow-grid">
                        <div className="ops-workflow-item">
                          <small>Contrôle préparation FMI</small>
                          <strong>{selectedCase.workflow.fmiPrepControl}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Incident technique sur site</small>
                          <strong>{selectedCase.workflow.fmiTechnicalIncident ? 'OUI' : 'AUCUN'}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Kit secours papier documenté</small>
                          <strong>{selectedCase.workflow.paperFallbackDocumented ? 'OUI (Feuille carbone en sacoche)' : 'NON'}</strong>
                        </div>
                        <div className="ops-workflow-item">
                          <small>Délai de transmission</small>
                          <strong>{selectedCase.workflow.transmissionDeadline}</strong>
                        </div>
                      </div>
                      <div className="ops-authority-alert">
                        ℹ️ <strong>Canal Footclubs :</strong> {selectedCase.workflow.footclubsNotice}
                      </div>
                    </div>
                  )}

                  {selectedCase.workflow.type === 'TERRAIN_CRENEAU' && (
                    <div className="ops-workflow-grid">
                      <div className="ops-workflow-item">
                        <small>Conflit de créneau détecté</small>
                        <strong>{selectedCase.workflow.pitchConflictDetected ? 'CONFLIT DÉTECTÉ' : 'AUCUN CONFLIT'}</strong>
                      </div>
                      <div className="ops-workflow-item">
                        <small>Statut réservation</small>
                        <strong>{selectedCase.workflow.pitchConflictStatus}</strong>
                      </div>
                      <div className="ops-workflow-item" style={{gridColumn: '1 / -1'}}>
                        <small>Issue & décision</small>
                        <strong>{selectedCase.workflow.pitchResolutionIssue}</strong>
                      </div>
                    </div>
                  )}

                  {selectedCase.workflow.authorityNote && selectedCase.workflow.type === 'STANDARD' && (
                    <p style={{fontSize: '9.5px', color: '#9bb1c8', margin: 0}}>
                      {selectedCase.workflow.authorityNote}
                    </p>
                  )}
                </div>
              )}

              {/* Interactions associées */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Interactions & Échanges</h4>
                  <span>{selectedCase.interactions.length} interactions</span>
                </div>
                <div className="ops-checklist">
                  {selectedCase.interactions.map(it => (
                    <div key={it.id} className="ops-check-row" style={{cursor: 'default'}}>
                      <span className="badge-origin">{it.date}</span>
                      <span className="badge-priority normale">{it.type}</span>
                      <span style={{fontSize: '9.5px', flex: 1}}>{it.summary}</span>
                      {it.receipt && <span className="badge-truth">{it.receipt}</span>}
                    </div>
                  ))}
                  {!selectedCase.interactions.length && (
                    <p style={{fontSize: '9px', color: '#6d849a', margin: 0}}>Aucune interaction enregistrée.</p>
                  )}
                </div>
              </div>

              {/* Tâches liées */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Tâches rattachées à ce dossier</h4>
                </div>
                <div className="ops-checklist">
                  {state?.tasks
                    .filter(t => t.caseRef === selectedCase.id || selectedCase.linkedTaskIds.includes(t.id))
                    .map(t => (
                      <div
                        key={t.id}
                        className="ops-check-row"
                        onClick={() => onSelect('tasks', t.id)}
                      >
                        <span className={`badge-status ${t.status.toLowerCase()}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                        <span style={{fontSize: '9.5px', flex: 1}}>{t.title}</span>
                        <span style={{fontSize: '8px', color: '#7a92a7'}}>Ouvrir la tâche →</span>
                      </div>
                    ))}
                  {!state?.tasks.filter(t => t.caseRef === selectedCase.id || selectedCase.linkedTaskIds.includes(t.id)).length && (
                    <p style={{fontSize: '9px', color: '#6d849a', margin: 0}}>Aucune tâche liée.</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {isCrmView&&crmMode==='directory'&&selectedExternal&&<>
          <header className="ops-detail-header">
            <div className="ops-detail-top-row"><div><small style={{font:'8px ui-monospace, monospace',color:'#7b95ae'}}>{selectedExternal.kind}</small><h2>{selectedExternal.name}</h2></div><span className="badge-status">{selectedExternal.status}</span></div>
            <div className="ops-detail-meta-band"><span className="badge-origin">{selectedExternal.legalId||'Identifiant légal inconnu'}</span><span className="badge-truth">{selectedExternal.source||'Source inconnue'}</span></div>
            <p className="ops-detail-desc">{selectedExternal.email||'Email inconnu'}{selectedExternal.phone?' · '+selectedExternal.phone:''}{selectedExternal.address?' · '+selectedExternal.address:''}</p>
          </header>
          <div className="ops-detail-sections">
            <div className="ops-panel-box">
              <div className="ops-panel-box-head"><h4>Contacts canoniques</h4><span>{(directory?.contacts||[]).filter(c=>c.organizationId===selectedExternal.id).length}</span></div>
              <form className="ops-create-modal" onSubmit={createExternalContact}>
                <input required placeholder="Nom du contact" value={externalForm.contactName||''} onChange={e=>setExternalForm({...externalForm,contactName:e.target.value})}/>
                <input placeholder="Fonction / rôle" value={externalForm.contactRole||''} onChange={e=>setExternalForm({...externalForm,contactRole:e.target.value})}/>
                <input placeholder="Email" value={externalForm.contactEmail||''} onChange={e=>setExternalForm({...externalForm,contactEmail:e.target.value})}/>
                <input placeholder="Téléphone" value={externalForm.contactPhone||''} onChange={e=>setExternalForm({...externalForm,contactPhone:e.target.value})}/>
                <input placeholder="Source / preuve" value={externalForm.contactSource||''} onChange={e=>setExternalForm({...externalForm,contactSource:e.target.value})}/>
                <div className="ops-create-modal-actions"><button className="ops-btn-save">Ajouter contact</button></div>
              </form>
              <div className="ops-checklist">{(directory?.contacts||[]).filter(c=>c.organizationId===selectedExternal.id).map(c=><div className="ops-check-row" key={c.id}><span className="badge-origin">{c.role}</span><strong style={{fontSize:'9.5px'}}>{c.displayName}</strong><span style={{fontSize:'8px',marginLeft:'auto',color:'#8299af'}}>{c.email||c.phone||'Coordonnée inconnue'}</span></div>)}</div>
            </div>
            <div className="ops-panel-box">
              <div className="ops-panel-box-head"><h4>Journal relationnel</h4><span>{(directory?.interactions||[]).filter(i=>i.organizationId===selectedExternal.id).length}</span></div>
              <form className="ops-create-modal" onSubmit={createExternalInteraction}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                  <select value={externalForm.interactionType||'NOTE'} onChange={e=>setExternalForm({...externalForm,interactionType:e.target.value})}><option>EMAIL</option><option>APPEL</option><option>REUNION</option><option>QUESTION</option><option>REPONSE</option><option>RELANCE</option><option>DOCUMENT_RECU</option><option>NOTE</option></select>
                  <select value={externalForm.interactionDirection||'INTERNE'} onChange={e=>setExternalForm({...externalForm,interactionDirection:e.target.value})}><option>ENTRANT</option><option>SORTANT</option><option>INTERNE</option></select>
                </div>
                <select value={externalForm.interactionContactId||''} onChange={e=>setExternalForm({...externalForm,interactionContactId:e.target.value})}><option value="">Contact : non précisé</option>{(directory?.contacts||[]).filter(x=>x.organizationId===selectedExternal.id).map(x=><option key={x.id} value={x.id}>{x.displayName}</option>)}</select>
                <select value={externalForm.interactionPersonId||''} onChange={e=>setExternalForm({...externalForm,interactionPersonId:e.target.value})}><option value="">Personne interne : non assignée</option>{(orgState?.people||[]).filter(p=>p.status==='ACTIF').map(p=><option key={p.id} value={p.id}>{p.displayName}</option>)}</select>
                <input type="datetime-local" value={externalForm.interactionOccurredAt||''} onChange={e=>setExternalForm({...externalForm,interactionOccurredAt:e.target.value})}/>
                <textarea required rows={3} placeholder="Résumé factuel de l’échange" value={externalForm.interactionSummary||''} onChange={e=>setExternalForm({...externalForm,interactionSummary:e.target.value})}/>
                <input placeholder="Preuve / receipt / document / URL" value={externalForm.interactionProof||''} onChange={e=>setExternalForm({...externalForm,interactionProof:e.target.value})}/>
                <input placeholder="Source" value={externalForm.interactionSource||''} onChange={e=>setExternalForm({...externalForm,interactionSource:e.target.value})}/>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
                  <input type="date" aria-label="Échéance relance" value={externalForm.followupDueAt||''} onChange={e=>setExternalForm({...externalForm,followupDueAt:e.target.value})}/>
                  <input placeholder="Titre relance (optionnel)" value={externalForm.followupTitle||''} onChange={e=>setExternalForm({...externalForm,followupTitle:e.target.value})}/>
                </div>
                <div className="ops-create-modal-actions"><button className="ops-btn-save">Enregistrer l’interaction</button></div>
              </form>
              <div className="ops-crm-timeline">{(directory?.interactions||[]).filter(i=>i.organizationId===selectedExternal.id).sort((a,b)=>String(b.occurredAt).localeCompare(String(a.occurredAt))).map(i=><article key={i.id}>
                <div><span className="badge-origin">{i.type}</span><span className="badge-priority normale">{i.direction}</span><time>{i.occurredAt?String(i.occurredAt).slice(0,16).replace('T',' '):'Date inconnue'}</time></div>
                <strong>{i.summary}</strong>
                <small>{i.contactId?((directory?.contacts||[]).find(c=>c.id===i.contactId)?.displayName||'Contact inconnu'):'Contact non précisé'} · {i.internalPersonId?personName(i.internalPersonId):'Interne non assigné'} · {i.channel}</small>
                <small>Preuve : {i.proof||'NON_RACCORDEE'}{i.followupTaskId?' · relance '+i.followupTaskId:''}</small>
              </article>)}{!(directory?.interactions||[]).some(i=>i.organizationId===selectedExternal.id)&&<p className="ops-detail-desc">Aucune interaction canonique enregistrée.</p>}</div>
            </div>
            <div className="ops-panel-box"><div className="ops-panel-box-head"><h4>Principe CRM</h4></div><p className="ops-detail-desc">Cet organisme est l’identité externe canonique. Le journal conserve appels, mails, réunions, réponses, relances et pièces reçues avec preuve et suivi sans les dupliquer dans chaque dossier.</p></div>
          </div>
        </>}

        {/* DÉTAIL INTENDANCE */}
        {isIntendanceView && selectedIntendance && (
          <>
            <header className="ops-detail-header">
              <div className="ops-detail-top-row">
                <div>
                  <small style={{font: '8px ui-monospace, monospace', color: '#7b95ae'}}>
                    {selectedIntendance.category} · Match : {selectedIntendance.matchRef}
                  </small>
                  <h2>{selectedIntendance.title}</h2>
                </div>
                <span
                  className="badge-status"
                  style={{
                    borderColor:
                      selectedIntendance.status === 'CONFIRMÉ'
                        ? '#167657'
                        : selectedIntendance.status === 'À PRÉPARER'
                        ? '#754b17'
                        : '#45596e'
                  }}
                >
                  {selectedIntendance.status}
                </span>
              </div>

              <div className="ops-detail-meta-band">
                <span className="badge-truth">{selectedIntendance.truthClass}</span>
                <span className="badge-origin">Lieu : {selectedIntendance.venue}</span>
                <button
                  className="ops-link-pill"
                  onClick={() => {
                    location.hash = `#cssa/sportif/SENIORS_R1/${selectedIntendance.matchRef}`
                  }}
                >
                  Fiche de match : {selectedIntendance.matchRef} ↗
                </button>
              </div>

              <div className="ops-authority-alert" style={{background: '#091e2b', borderColor: '#194967', color: '#78bdf1'}}>
                ℹ️ <strong>Règle de rigueur logistique :</strong> un besoin "À préparer" n’est pas la preuve qu’un véhicule ou un prestataire est déjà réservé.
              </div>
            </header>

            <div className="ops-detail-sections">
              {/* Statut logistique */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Changer l’état de confirmation</h4>
                </div>
                <div className="ops-actions-strip">
                  {(['CONFIRMÉ', 'À PRÉPARER', 'EN ATTENTE', 'UNKNOWN'] as const).map(st => (
                    <button
                      key={st}
                      className={`ops-state-btn ${selectedIntendance.status === st ? 'active' : ''}`}
                      onClick={() => handleIntendanceStatus(selectedIntendance.id, st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ops-panel-box">
                <div className="ops-panel-box-head"><h4>Responsable matchday</h4></div>
                <select className="ops-person-select" value={selectedIntendance.responsiblePersonId || ''} onChange={e => handleIntendanceResponsible(selectedIntendance.id, e.target.value)}>
                  <option value="">NON ASSIGNÉ</option>
                  {(orgState?.people || []).filter(p => p.status === 'ACTIF').map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
                </select>
                <small style={{display:'block',marginTop:'7px',fontSize:'8.5px',color:'#7a8fA6'}}>Personne canonique issue de Organisation.</small>
              </div>

              {/* Notes logistiques */}
              <div className="ops-panel-box">
                <div className="ops-panel-box-head">
                  <h4>Consignes logistiques</h4>
                  {saveSuccess && <span className="ops-save-indicator">✓ Enregistré sur disque</span>}
                </div>
                <textarea
                  className="ops-notes-textarea"
                  value={draftNote}
                  onChange={e => setDraftNote(e.target.value)}
                  placeholder="Détails matériel, clés des vestiaires, horaire point de rendez-vous..."
                />
                <div className="ops-notes-footer">
                  <button
                    className="ops-btn-save"
                    disabled={savingNote}
                    onClick={() => handleSaveIntendanceNote(selectedIntendance.id)}
                  >
                    {savingNote ? 'Sauvegarde…' : 'Sauvegarder la note'}
                  </button>
                </div>
              </div>

              {/* Tâche liée si existante */}
              {selectedIntendance.linkedTaskId && (
                <div className="ops-panel-box">
                  <div className="ops-panel-box-head">
                    <h4>Tâche associée dans TASKS</h4>
                  </div>
                  <button
                    className="ops-link-pill"
                    onClick={() => onSelect('tasks', selectedIntendance.linkedTaskId!)}
                  >
                    Ouvrir la tâche {selectedIntendance.linkedTaskId} →
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  </div>
  )
}
