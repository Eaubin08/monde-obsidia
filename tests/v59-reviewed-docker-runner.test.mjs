import {test} from 'node:test'
import assert from 'node:assert/strict'
import {planSoftwareComponent,generateSoftwareSource} from '../server/synthetic-software-generator.mjs'
import {testReviewedSourceInDocker,v59DockerArguments} from '../server/v59-reviewed-docker-runner.mjs'
const input=kind=>generateSoftwareSource(planSoftwareComponent({mode:'SYNTHETIC_SOURCE_ONLY',kind,componentId:'Demo1',organizationId:'LAB'}))
const probe=async()=>({status:'PROBED_ISOLATION',verified:true,osIsolated:true,networkIsolated:true,filesystemIsolated:true})
test('V59 Docker always uses restricted flags without host mounts or network',()=>{
 const args=v59DockerArguments('console.log("test")')
 for(const x of ['--network','none','--read-only','--cap-drop','ALL','--memory','128m','--memory-swap',
  '--cpus','--pids-limit','--user','--pull','never'])assert.ok(args.includes(x))
 for(const x of ['--privileged','--mount','-v','--publish','-p'])assert.equal(args.includes(x),false)
})
test('V59 all canonical templates produce expected Docker test records',async()=>{
 for(const kind of ['PURE_TOOL','PURE_WORKFLOW','PURE_AGENT_DESCRIPTOR']){
  const count=kind==='PURE_AGENT_DESCRIPTOR'?1:3
  const executor=async(cmd,args)=>{
   assert.equal(cmd,'docker')
   assert.ok(args.at(-1).includes('function'))
   return {stderr:'',stdout:JSON.stringify({schema:'OBSIDIA_V59_DOCKER_CASES_V0',
    tests:Array.from({length:count},(_,i)=>({name:'CASE_'+(i+1),pass:true}))})}
  }
  const result=await testReviewedSourceInDocker(input(kind),{executor,isolationProbe:probe})
  assert.equal(result.status,'CONTAINER_FUNCTIONAL_PASS')
  assert.equal(result.executionAllowed,false)
  assert.equal(result.resourceLimitsMeasured,false)
 }
})
test('V59 absent isolation cannot be bypassed',async()=>{
 let called=false
 const executor=async()=>{called=true;throw Error('MUST NOT RUN')}
 const result=await testReviewedSourceInDocker(input('PURE_TOOL'),{isolationProbe:async()=>({status:'HOLD'}),executor})
 assert.equal(result.status,'HOLD')
 assert.equal(result.reason,'ISOLATION_NOT_VERIFIED')
 assert.equal(called,false)
})
test('V59 edited source rejected before Docker is contacted',async()=>{
 let called=false
 const artifact=input('PURE_TOOL')
 const result=await testReviewedSourceInDocker({...artifact,source:artifact.source+'\nprocess.exit(1)'},{
  isolationProbe:async()=>{called=true;return probe()},executor:async()=>{called=true}})
 assert.equal(result.status,'HOLD')
 assert.equal(result.reason,'UNREVIEWED_SOURCE')
 assert.equal(called,false)
})
test('V59 rejects invalid Docker results or runtime failures',async()=>{
 const invalid=await testReviewedSourceInDocker(input('PURE_WORKFLOW'),{isolationProbe:probe,
  executor:async()=>({stdout:'{}',stderr:''})})
 assert.equal(invalid.status,'HOLD')
 const failed=await testReviewedSourceInDocker(input('PURE_WORKFLOW'),{isolationProbe:probe,
  executor:async()=>{throw Error('docker down')}})
 assert.equal(failed.status,'HOLD')
})
