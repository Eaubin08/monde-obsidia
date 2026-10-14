import {useEffect,useState} from 'react'
import {cssaSourceAvailable} from './cssaLinkedReference'
export type CssaLinkedTask={id:string;title:string;status:string;responsible?:string;responsiblePersonId?:string|null;source?:string}
export default function useCssaLinkedTasks(){
 const [tasks,setTasks]=useState<{available:boolean;rows:CssaLinkedTask[]}>({available:false,rows:[]})
 useEffect(()=>{
  let active=true;let generation=0
  const read=async()=>{
   const request=++generation
   let next={available:false,rows:[] as CssaLinkedTask[]}
   try{
    const response=await fetch('/obsidia-local/cssa-ops-state',{cache:'no-store',signal:AbortSignal.timeout(4000)})
    if(!response.ok)throw new Error('unavailable')
    const data=await response.json()
    if(!cssaSourceAvailable(data)||!Array.isArray(data.tasks))throw new Error('unavailable')
    next={available:true,rows:data.tasks}
   }catch{/* An initial template is not a live task source. */}
   if(active&&request===generation)setTasks(next)
  }
  void read();const timer=window.setInterval(read,15000)
  window.addEventListener('cssa-ops-updated',read)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-ops-updated',read)}
 },[])
 return tasks
}
