import {composeWorldManifest} from './worldManifest.ts'
import type {WorldReadModel,WorldGraph} from './worldReadModel.ts'

// Descriptive Company Model V0: no inferred roles, needs, approvals, or active capabilities.
export function projectCompanyModel(organizationId:string,label:string,model:WorldReadModel,graph:WorldGraph){
 if(organizationId!==model.organizationId)throw Error('Organization mismatch')
 const manifest=composeWorldManifest(organizationId,label,model.objects)
 const domains=manifest.territories.map(t=>({id:t.domain,objectCount:t.objectKeys.length,sourceState:t.status,capabilities:t.capabilities}))
 return {schema:'OBSIDIA_COMPANY_MODEL_V0' as const,identity:{id:organizationId,label},domains,
  objectCount:model.objects.length,relationCount:graph.edges.length,
  resolvedRelationCount:graph.edges.filter(e=>e.status==='RESOLVED').length,
  unknowns:[...new Set([...model.unknowns,...graph.unknowns])].sort(),
  capabilities:[...new Set(domains.flatMap(d=>d.capabilities))].sort(),
  epistemics:{inferredRoles:[] as string[],detectedNeeds:[] as string[],unverifiedClaims:[] as string[]},
  governance:{authority:'NONE' as const,decisionAuthority:'KX108_ONLY' as const}}
}
