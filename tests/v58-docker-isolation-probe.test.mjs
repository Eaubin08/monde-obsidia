import {test} from 'node:test'
import assert from 'node:assert/strict'
import {probeV58Isolation,v58IsolationDockerArguments,V58_CONTAINER_IMAGE} from '../server/v58-docker-isolation-probe.mjs'
test('V58 Docker invocation explicitly restricts network, filesystem, privileges and resources',()=>{
 const args=v58IsolationDockerArguments()
 for(const flag of ['--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','--memory','--memory-swap','--cpus','--user','--pull','never','--tmpfs'])assert.ok(args.includes(flag),flag)
 assert.equal(args.includes('-v'),false)
 assert.equal(args.includes('--privileged'),false)
 assert.equal(args.includes('--mount'),false)
 assert.equal(args.includes('-p'),false)
 assert.ok(args.includes(V58_CONTAINER_IMAGE))
})
test('V58 unavailable Docker results in HOLD, not fallback Node execution',async()=>{
 const probe=await probeV58Isolation({executor:async()=>{throw Error('no docker')}})
 assert.equal(probe.status,'HOLD')
 assert.equal(probe.executionAllowed,false)
 assert.equal(probe.osIsolated,false)
})
test('V58 contradictory or incomplete container probe remains HOLD',async()=>{
 const fake=async()=>({stdout:JSON.stringify({schema:'OBSIDIA_V58_CONTAINER_PROBE_V0',checks:{readOnlyRoot:true,writableTmp:true,networkDenied:false,nonRoot:true}}),stderr:''})
 const probe=await probeV58Isolation({executor:fake})
 assert.equal(probe.status,'HOLD')
 assert.equal(probe.reason,'PROBE_OUTPUT_INVALID')
})
test('V58 test-double success never claims resource ceilings measured or deploy authority',async()=>{
 const fake=async()=>({stdout:JSON.stringify({schema:'OBSIDIA_V58_CONTAINER_PROBE_V0',checks:{readOnlyRoot:true,writableTmp:true,networkDenied:true,nonRoot:true}}),stderr:''})
 const probe=await probeV58Isolation({executor:fake})
 assert.equal(probe.status,'PROBED_ISOLATION')
 assert.equal(probe.scope,'LOCAL_PROBE_ONLY')
 assert.equal(probe.resourceLimitsConfigured,true)
 assert.equal(probe.resourceLimitsApplied,false)
 assert.equal(probe.deploymentApproved,false)
 assert.equal(probe.executionAllowed,false)
})
test('V58 invalid timeout is rejected before invoking container runtime',async()=>{
 const probe=await probeV58Isolation({timeoutMs:0,executor:async()=>{throw Error('should never run')}})
 assert.equal(probe.status,'HOLD')
 assert.equal(probe.reason,'INVALID_TIMEOUT')
})
