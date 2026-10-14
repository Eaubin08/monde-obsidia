import {useEffect,useState} from 'react'
import type {CssaPeopleState} from './cssaPeopleProjection'

export default function useCssaPeople(){
 const [organisation,setOrganisation]=useState<CssaPeopleState|null>(null)
 useEffect(()=>{
  let active=true
  let generation=0
  const read=async()=>{
   const request=++generation
   let next:CssaPeopleState|null=null
   try{
    const response=await fetch('/obsidia-local/cssa-organisation-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
    if(!response.ok)throw new Error('unavailable')
    const data=await response.json()
    if(!data||!Array.isArray(data.people)||data._source?.status!=='AVAILABLE')throw new Error('unavailable')
    next=data
   }catch{/* A missing source cannot resolve a canonical person. */}
   if(active&&request===generation)setOrganisation(next)
  }
  void read();const timer=window.setInterval(read,15000)
  window.addEventListener('cssa-organisation-updated',read)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-organisation-updated',read)}
 },[])
 return organisation
}
