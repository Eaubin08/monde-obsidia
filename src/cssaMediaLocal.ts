import {cssaSourceAvailable} from './cssaLinkedReference.ts'
export type MediaCache={observedAt?:string;cacheOnly?:boolean;_source?:{status:string};sources:{id:string;label:string;url:string;status:string;observedAt:string}[];dvcrMedia?:{articles:{title:string;url:string;category:string}[];broadcastStatus?:string}}
export function publicMediaUrl(value:unknown){
 if(typeof value!=='string')return ''
 try{const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:''}catch{return ''}
}
export async function readCssaMediaCache(fetcher:typeof fetch=fetch):Promise<MediaCache>{
 const response=await fetcher('/obsidia-local/cssa-sport-watch?cacheOnly=1',{cache:'no-store',signal:AbortSignal.timeout(4000)})
 if(!response.ok)throw new Error('Cache média indisponible.')
 const value=await response.json()
 if(!value||typeof value!=='object'||Array.isArray(value)||value.cacheOnly!==true)throw new Error('Cache média invalide.')
 if(!cssaSourceAvailable(value))return {...value,sources:[],dvcrMedia:undefined}
 if(!Array.isArray(value.sources)||value.sources.some((row:Record<string,unknown>)=>!row||['id','label','url','status','observedAt'].some(k=>typeof row[k]!=='string'))||!value.observedAt||!Number.isFinite(Date.parse(value.observedAt)))throw new Error('Observations média invalides.')
 if(value.dvcrMedia&&(!Array.isArray(value.dvcrMedia.articles)||value.dvcrMedia.articles.some((row:Record<string,unknown>)=>!row||['title','url','category'].some(k=>typeof row[k]!=='string'))))throw new Error('Articles en cache invalides.')
 return value
}
