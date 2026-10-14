import {useEffect,useState} from 'react'
import {cssaSourceAvailable} from './cssaLinkedReference'
export type LinkedDossier={id:string;reference:string;title:string;status:string}
export default function useCssaLinkedDossiers(){
 const [state,setState]=useState<{available:boolean;rows:LinkedDossier[]}>({available:false,rows:[]})
 useEffect(()=>{
  let active=true;let generation=0
  const read=async()=>{
   const request=++generation;let next={available:false,rows:[] as LinkedDossier[]}
   try{
    const response=await fetch('/obsidia-local/cssa-business-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
    if(!response.ok)throw new Error('unavailable')
    const data=await response.json()
    if(!cssaSourceAvailable(data)||!Array.isArray(data.dossiers))throw new Error('unavailable')
    next={available:true,rows:data.dossiers}
   }catch{/* Unavailable data cannot resolve a dossier. */}
   if(active&&request===generation)setState(next)
  }
  void read();const timer=window.setInterval(read,15000);window.addEventListener('cssa-business-updated',read)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-business-updated',read)}
 },[])
 return state
}
