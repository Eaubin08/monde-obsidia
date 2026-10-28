import {readCssaBusiness} from './cssaBusinessRead.ts'
import {readCssaTasks} from './cssaTasksRead.ts'
import {readCssaCrm} from './cssaCrmWrite.ts'
import {cssaSourceAvailable} from './cssaLinkedReference.ts'
import {buildCssaWorldGraph,type CssaWorldSources} from './cssaWorldGraph.ts'
import {projectCompanyModel} from './companyModel.ts'
import {composeWorldManifest} from './worldManifest.ts'

// One bounded snapshot, built only from independent validated GET reads.
// Failed/unknown sources do not get replaced by stale UI state or synthetic records.
type Business=NonNullable<CssaWorldSources['business']>&{_source?:{status?:string}}
type Tasks=NonNullable<CssaWorldSources['tasks']>&{_source?:{status?:string}}
type Crm=NonNullable<CssaWorldSources['crm']>&{_source?:{status?:string}}
export type CssaWorldSnapshot={
 schema:'OBSIDIA_CSSA_WORLD_SNAPSHOT_V0'
 sourceStatus:{business:'AVAILABLE'|'UNKNOWN';tasks:'AVAILABLE'|'UNKNOWN';crm:'AVAILABLE'|'UNKNOWN'}
 model:ReturnType<typeof buildCssaWorldGraph>['model']
 graph:ReturnType<typeof buildCssaWorldGraph>['graph']
 company:ReturnType<typeof projectCompanyModel>
 manifest:ReturnType<typeof composeWorldManifest>
}
export async function readCssaWorldSnapshot(fetcher:typeof fetch=fetch):Promise<CssaWorldSnapshot>{
 const reads=await Promise.allSettled([
  readCssaBusiness<Business>(fetcher),
  readCssaTasks(fetcher),
  readCssaCrm<Crm>(fetcher)
 ])
 const business=reads[0].status==='fulfilled'&&cssaSourceAvailable(reads[0].value)?reads[0].value:null
 const tasks=reads[1].status==='fulfilled'&&cssaSourceAvailable(reads[1].value)?reads[1].value:null
 const crm=reads[2].status==='fulfilled'&&cssaSourceAvailable(reads[2].value)?reads[2].value:null
 const {model,graph}=buildCssaWorldGraph({business,tasks,crm})
 const company=projectCompanyModel('CSSA','CS Sedan Ardennes',model,graph)
 const manifest=composeWorldManifest('CSSA','CS Sedan Ardennes',model.objects)
 return {schema:'OBSIDIA_CSSA_WORLD_SNAPSHOT_V0',
  sourceStatus:{business:business?'AVAILABLE':'UNKNOWN',tasks:tasks?'AVAILABLE':'UNKNOWN',crm:crm?'AVAILABLE':'UNKNOWN'},
  model,graph,company,manifest}
}
