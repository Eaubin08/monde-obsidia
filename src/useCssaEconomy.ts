import {useEffect,useState,useCallback,useRef} from 'react'
import {readCssaEconomy,readCssaEconomyCrm,type EconomyState} from './cssaEconomy'
import type {EconomyCrm} from './cssaEconomy'
export function useCssaEconomy(){
 const [state,setState]=useState<EconomyState|null>(null)
 const [crm,setCrm]=useState<EconomyCrm|null>(null)
 const [error,setError]=useState(false)
 const active=useRef(false),generation=useRef(0)
 const refresh=useCallback(async()=>{
  const request=++generation.current
  const [business,directory]=await Promise.allSettled([readCssaEconomy(),readCssaEconomyCrm()])
  if(!active.current||request!==generation.current)return
  setState(business.status==='fulfilled'?business.value:null)
  setError(business.status==='rejected')
  setCrm(directory.status==='fulfilled'?directory.value:null)
 },[])
 useEffect(()=>{
  active.current=true;void refresh();const timer=window.setInterval(refresh,15000)
  window.addEventListener('cssa-business-updated',refresh);window.addEventListener('cssa-crm-updated',refresh)
  return()=>{active.current=false;generation.current++;window.clearInterval(timer);window.removeEventListener('cssa-business-updated',refresh);window.removeEventListener('cssa-crm-updated',refresh)}
 },[refresh])
 return {state,crm,error,refresh}
}
