// Review-only bridge: never automatically submits a build job.
import {selectSyntheticTemplate} from './synthetic-template-registry.mjs'
export function proposeSyntheticBuildFromNeed(need,mapping){
 const valid=need&&need.decision==='HOLD'&&need.evidenceStatus==='INSUFFICIENT'&&typeof need.domain==='string'&&typeof need.capabilityId==='string'
 const match=valid&&Array.isArray(mapping)?mapping.filter(x=>x.domain===need.domain&&x.capabilityId===need.capabilityId):[]
 const selected=match.length===1?selectSyntheticTemplate(match[0].kind,match[0].requiredCapabilities??[]):null
 return {schema:'OBSIDIA_SYNTHETIC_BUILD_PROPOSAL_V0',needId:typeof need?.id==='string'?need.id:null,
  templateId:selected?.id??null,status:selected?'REVIEW_ONLY':'HOLD',request:null,
  blockers:selected?['EXPLICIT_LAB_REQUEST_REQUIRED','BUILDER_AUTHORIZATION_NOT_GRANTED']:['UNKNOWN_NEED_OR_TEMPLATE'],
  buildApproved:false,deploymentApproved:false,executionAllowed:false,
  governance:{authority:'NONE',decisionAuthority:'KX108_ONLY'}}
}
