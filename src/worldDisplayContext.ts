import type {WorldViewContext} from './worldCompositionRules.ts'

// User context is an explicit display preference only. Never authorization, identity proof or ACL.
export type WorldDisplayProfile={roleLabel?:string|null;preferredDomains?:readonly string[];focusedObjectKey?:string|null}
export function deriveWorldViewContext(profile:WorldDisplayProfile,mode:'OVERVIEW'|'DETAIL'='OVERVIEW'):WorldViewContext{
 return {mode,focusedObjectKey:mode==='DETAIL'?profile.focusedObjectKey??null:null}
}
export function rankWorldTerritories<T extends {domain:string}>(territories:readonly T[],profile:WorldDisplayProfile):T[]{
 const priorities=[...new Set(profile.preferredDomains||[])]
 return [...territories].sort((a,b)=>{
  const ia=priorities.indexOf(a.domain),ib=priorities.indexOf(b.domain)
  const pa=ia<0?Number.MAX_SAFE_INTEGER:ia,pb=ib<0?Number.MAX_SAFE_INTEGER:ib
  return pa-pb||a.domain.localeCompare(b.domain)
 })
}
