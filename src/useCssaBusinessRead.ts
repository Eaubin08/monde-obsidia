import {useEffect,useState} from 'react'
import {readCssaBusiness} from './cssaBusinessRead'
export default function useCssaBusinessRead<T>(){
 const [state,setState]=useState<T|null>(null)
 const [error,setError]=useState(false)
 useEffect(()=>{
  let active=true;let generation=0
  const read=async()=>{
   const request=++generation
   try{
    const next=await readCssaBusiness<T>()
    if(active&&request===generation){setState(next);setError(false)}
   }catch{if(active&&request===generation){setState(null);setError(true)}}
  }
  void read();const timer=window.setInterval(read,15000)
  window.addEventListener('cssa-business-updated',read)
  return()=>{active=false;window.clearInterval(timer);window.removeEventListener('cssa-business-updated',read)}
 },[])
 return {state,error}
}
