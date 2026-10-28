// CSSA hash routing is a projection only: identifiers are never resolved by guessing.
export type CssaRoute={moduleId:string;selectedId:string}
export function parseCssaHash(hash:string,allowed:readonly string[]):CssaRoute|null{
 if(hash!=='#cssa'&&!hash.startsWith('#cssa/'))return null
 if(hash.includes('?')||hash.includes('#',1))return null
 const parts=hash.slice(1).split('/')
 const moduleId=parts[1]||'dashboard'
 if(parts[1]===''&&parts.length>2)return null
 if(!allowed.includes(moduleId))return null
 let selectedId=''
 if(parts.length>2){
  try{selectedId=decodeURIComponent(parts.slice(2).join('/'))}catch{return null}
  if(!selectedId||selectedId.includes('\u0000'))return null
 }
 return {moduleId,selectedId}
}
export function formatCssaHash(route:CssaRoute):string{
 return '#cssa/'+route.moduleId+(route.selectedId?'/'+encodeURIComponent(route.selectedId):'')
}
