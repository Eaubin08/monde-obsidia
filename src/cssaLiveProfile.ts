export const cssaProfileStores = {
 organisation: {route: 'cssa-organisation-state', version: 'CSSA_ORGANISATION_STATE_V1', lists: ['people', 'roleAssignments', 'availabilities', 'engagements', 'authorizations']},
 business: {route: 'cssa-business-state', version: 'CSSA_BUSINESS_STATE_V1', lists: ['dossiers', 'requirements', 'documentRefs', 'validations', 'submissionProofs', 'dossierOutcomes']},
 ops: {route: 'cssa-ops-state', version: 'CSSA_OPS_STATE_V1', lists: ['tasks', 'cases']}
} as const
export type StoreId = keyof typeof cssaProfileStores
export type StoreObservation = {available: boolean; state?: Record<string, unknown>}
export type Observations = Partial<Record<StoreId, StoreObservation>>
type Capability = {id:string;label:string;status:string;summary:string;details:string[]}
type SemanticProfile = {capabilities:Capability[];unknowns:string[];contradictions:string[];risks:string[];evidence:string[]}
const unique = (values:string[]) => [...new Set(values)]
const text = (value:unknown) => typeof value === 'string' ? value : JSON.stringify(value)

// Projection only: no authorization, mutation, inference of proof or resolution.
export function projectCssaProfile<T extends SemanticProfile>(fallback:T, observations:Observations):T {
 const unknowns = [...fallback.unknowns]
 const contradictions = fallback.contradictions.map(x=>`[Référence historique · à vérifier] ${x}`)
 const evidence = fallback.evidence.map(x=>`[Référence historique · non revérifiée] ${x}`)
 const capabilities = fallback.capabilities.map(x=>({...x,status:'UNKNOWN',summary:`Référence historique · ${x.summary}`,details:[...x.details,'État de capacité non revérifié par les stores locaux.']}))
 const risks = [...fallback.risks]
 for (const [id, definition] of Object.entries(cssaProfileStores)) {
  const observation = observations[id as StoreId]
  if (!observation?.available || !observation.state) {
   unknowns.push(`${definition.route} · UNKNOWN · source indisponible`)
   continue
  }
  const state = observation.state
  const source = `/obsidia-local/${definition.route}`
  for (const key of ['unknowns','contradictions','evidence','risks'] as const) {
   if (Array.isArray(state[key])) {
    const target = {unknowns,contradictions,evidence,risks}[key]
    target.push(...state[key].map(x=>`[${source}] ${text(x)}`))
   }
  }
  for (const list of definition.lists) {
   if (!Array.isArray(state[list])) {unknowns.push(`${source} · ${list} · UNKNOWN`);continue}
   for (const row of state[list] as Record<string,unknown>[]) {
    if (!row || typeof row !== 'object' || row.isTestFixture) continue
    const ref = `${source} · ${list}/${text(row.id ?? 'UNKNOWN')}`
    for (const [key,value] of Object.entries(row)) {
     if (typeof value === 'string' && /UNKNOWN|INCONNU|NON ASSIGNÉ/.test(value)) unknowns.push(`${ref} · ${key}=${value}`)
    }
    if (/CONFLICT|CONTRADICTION/.test(String(row.truthClass ?? ''))) contradictions.push(`${ref} · ${text(row.title ?? row.subject ?? row.id)} · source=${text(row.source ?? row.provenance ?? 'UNKNOWN')}`)
    if (list === 'submissionProofs') evidence.push(`${ref} · preuve de dépôt enregistrée (non vérifiée) · source=${text(row.source ?? 'UNKNOWN')} · référence=${text(row.externalReference ?? 'UNKNOWN')}`)
   }
  }
  if (id === 'organisation' || id === 'business') capabilities.push({id:`local-${id}`,label:`REGISTRE ${id.toUpperCase()}`,status:'OBSERVED',summary:`Source locale lue · ${source}`,details:definition.lists.map(key=>`${key}: ${Array.isArray(state[key]) ? state[key].length : 'UNKNOWN'}`).concat(`updatedAt: ${text(state.updatedAt ?? 'UNKNOWN')}`, 'Lecture observée ; aucune autorisation ni preuve de capacité déduite.')})
  if (id === 'ops') {
   for (const capability of capabilities.filter(x=>['tasks','crm'].includes(x.id))) {
    capability.status='OBSERVED'
    capability.summary=`Registre local lu · ${source}`
    capability.details.push(`updatedAt: ${text(state.updatedAt ?? 'UNKNOWN')}`, 'Lecture du registre uniquement ; capacité native historique non revérifiée.')
   }
  }
 }
 return {...fallback,capabilities,unknowns:unique(unknowns),contradictions:unique(contradictions),evidence:unique(evidence),risks:unique(risks)}
}
