// Server-enforced single-organization C5 readonly feed.
// Intentionally NOT a user-authenticated multi-tenant API.
import {readFileSync,statSync} from 'node:fs'
import {projectUniversalC5Readonly} from '../src/universalC5Readonly.mjs'
const invalid = (s)=>typeof s!=='string'||!s||s.length>256||/[\u0000-\u001f]/.test(s)
export function readUniversalC5Local({organizationId,recordsPath}={}) {
  if (invalid(organizationId) || invalid(recordsPath)) return {
    schema:'OBSIDIA_C5_UNIVERSAL_READ_MODEL_V0',readonly:true,canonicalTruth:false,
    decisionAuthority:'KX108_ONLY',status:'NOT_CONFIGURED',organizationFilter:null,
    organizations:[],records:[],recordCount:0,executionAllowed:false
  }
  try {
    if(statSync(recordsPath).size>1024*1024)throw Error('C5_INPUT_TOO_LARGE')
    const input=JSON.parse(readFileSync(recordsPath,'utf8'))
    if(!Array.isArray(input))throw Error('C5_INPUT_NOT_ARRAY')
    // Validate *all* supplied records before filtering: reject malformed / mixed provenance.
    const result=projectUniversalC5Readonly(input,{organizationId})
    return {...result,status:'SCOPED_LOCAL_FIXTURE_READONLY'}
  } catch {
    return {
      schema:'OBSIDIA_C5_UNIVERSAL_READ_MODEL_V0',readonly:true,canonicalTruth:false,
      decisionAuthority:'KX108_ONLY',status:'SOURCE_INVALID_OR_UNAVAILABLE',
      organizationFilter:organizationId,organizations:[],records:[],
      recordCount:0,executionAllowed:false
    }
  }
}
