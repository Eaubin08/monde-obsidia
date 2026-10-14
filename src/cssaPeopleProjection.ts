export type CssaPerson={id:string;displayName?:string;status?:string;source?:string}
export type CssaPeopleState={people:CssaPerson[];_source?:{status?:string}}

// Only an explicit canonical id can resolve a person; never match names or roles.
export function resolveCssaPerson(personId:string|null|undefined,declared:string|undefined,organisation:CssaPeopleState|null):string {
 if(!personId)return declared?.trim()?`${declared} · déclaré, sans lien personne`:'UNKNOWN · personne non renseignée'
 if(organisation?._source?.status!=='AVAILABLE')return `UNKNOWN · Organisation indisponible · personne ${personId}`
 const matches=organisation.people.filter(person=>person.id===personId)
 if(matches.length!==1)return `UNKNOWN · référence personne ${matches.length?'ambiguë':'introuvable'} · ${personId}`
 const person=matches[0]
 return `${person.displayName?.trim()||'UNKNOWN'} · ${person.status||'UNKNOWN'} · ${personId}`
}
