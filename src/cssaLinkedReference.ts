export type ReferenceStatus='UNLINKED'|'SOURCE_UNKNOWN'|'BROKEN'|'AMBIGUOUS'|'RESOLVED'
export function resolveCssaReference<T extends {id:string}>(id:string|null|undefined,rows:T[],available:boolean):{status:ReferenceStatus;item:T|null}{
 if(!id)return {status:'UNLINKED',item:null}
 if(!available)return {status:'SOURCE_UNKNOWN',item:null}
 const matches=rows.filter(row=>row.id===id)
 if(matches.length!==1)return {status:matches.length?'AMBIGUOUS':'BROKEN',item:null}
 return {status:'RESOLVED',item:matches[0]}
}
export function cssaSourceAvailable(state:unknown):boolean {
 return Boolean(state&&typeof state==='object'&&'_source' in state&&(state._source as {status?:string})?.status==='AVAILABLE')
}
export const referenceLabels:Record<ReferenceStatus,string>={UNLINKED:'Aucun lien renseigné',SOURCE_UNKNOWN:'UNKNOWN · source indisponible',BROKEN:'UNKNOWN · référence introuvable',AMBIGUOUS:'UNKNOWN · référence ambiguë',RESOLVED:'Lié'}
