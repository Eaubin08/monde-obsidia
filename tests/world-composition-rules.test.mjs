import {test} from 'node:test'
import assert from 'node:assert/strict'
import {selectWorldPresentation} from '../src/worldCompositionRules.ts'
import {composeWorldRenderPlan} from '../src/worldUiComposer.ts'
import {projectWorldObject,worldObjectKey} from '../src/worldObjectContract.ts'
import {buildWorldReadModel,buildWorldGraph} from '../src/worldReadModel.ts'
import {projectCompanyModel} from '../src/companyModel.ts'
import {composeWorldManifest} from '../src/worldManifest.ts'
import {buildCapabilityRegistry} from '../src/worldCapabilityRegistry.ts'
const item={objectKey:'A:OPS:TASK:1',label:'Task',pattern:'TASK_VIEW',href:'#task',truth:'DECLARED',unknowns:[]}
test('composition rules distinguish normal and focused display without granting rights',()=>{
 const overview=selectWorldPresentation(item,[],{mode:'OVERVIEW'})
 const focus=selectWorldPresentation(item,[],{mode:'DETAIL',focusedObjectKey:item.objectKey})
 assert.equal(overview.pattern,'TASK_VIEW')
 assert.equal(focus.emphasis,'FOCUS')
 assert.equal(overview.emphasis,'NORMAL')
 assert.equal(focus.governance.authority,'NONE')
})
test('unknown pattern cannot inherit an arbitrary navigation route',()=>{
 const value=selectWorldPresentation({...item,pattern:'UNRECOGNIZED'},[],{mode:'DETAIL',focusedObjectKey:item.objectKey})
 assert.equal(value.pattern,'INSPECTION_VIEW')
 assert.equal(value.href,null)
 assert.equal(value.reason,'PATTERN_UNRECOGNIZED')
})
test('render plan forwards focus emphasis without rebuilding UI components',()=>{
 const o=projectWorldObject({organizationId:'FACTORY',domain:'PRODUCTION',kind:'RESOURCE',id:'machine',label:'Machine',sourceId:'SENSOR',available:true,truth:'OBSERVED',pattern:'MAINTENANCE_WORKSPACE',capabilities:['INSPECT']})
 const model=buildWorldReadModel('FACTORY',[o]),graph=buildWorldGraph(model)
 const snapshot={model,graph,company:projectCompanyModel('FACTORY','Factory',model,graph),manifest:composeWorldManifest('FACTORY','Factory',model.objects),capabilityRegistry:buildCapabilityRegistry(model)}
 const plan=composeWorldRenderPlan({phase:'READY',revision:1,snapshot,error:null},{mode:'DETAIL',focusedObjectKey:worldObjectKey(o)})
 assert.equal(plan.territories[0].blocks[0].emphasis,'FOCUS')
 assert.equal(plan.territories[0].blocks[0].interaction,'READ_ONLY')
})
