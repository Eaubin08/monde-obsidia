import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createCssaWorldSnapshotController} from '../src/cssaWorldSnapshotController.ts'
const snap=(statuses)=>({sourceStatus:{business:statuses[0],tasks:statuses[1],crm:statuses[2]},model:{objects:[]},graph:{edges:[]},company:{},manifest:{}})
test('refresh coalesces concurrent calls, notifies listeners, and increments revision',async()=>{
 let calls=0
 const controller=createCssaWorldSnapshotController(async()=>{calls++;return snap(['AVAILABLE','AVAILABLE','AVAILABLE'])})
 const phases=[]
 const unsubscribe=controller.subscribe(state=>phases.push(state.phase))
 const [a,b]=await Promise.all([controller.refresh(),controller.refresh()])
 assert.equal(calls,1)
 assert.equal(a.phase,'READY')
 assert.equal(b.phase,'READY')
 assert.equal(controller.read().revision,1)
 assert.deepEqual(phases,['IDLE','LOADING','READY'])
 unsubscribe()
})
test('partial canonical availability remains DEGRADED rather than ready',async()=>{
 const controller=createCssaWorldSnapshotController(async()=>snap(['AVAILABLE','UNKNOWN','UNKNOWN']))
 assert.equal((await controller.refresh()).phase,'DEGRADED')
 assert.equal(controller.read().snapshot.sourceStatus.tasks,'UNKNOWN')
})
test('reader failure discards last good snapshot rather than showing stale truth',async()=>{
 let calls=0
 const controller=createCssaWorldSnapshotController(async()=>{if(++calls===1)return snap(['AVAILABLE','AVAILABLE','AVAILABLE']);throw Error('offline')})
 await controller.refresh()
 const failed=await controller.refresh()
 assert.equal(failed.phase,'UNAVAILABLE')
 assert.equal(failed.snapshot,null)
 assert.equal(failed.error,'offline')
})
test('invalidation rejects a late response from a previous generation',async()=>{
 let resolve
 const controller=createCssaWorldSnapshotController(()=>new Promise(r=>{resolve=r}))
 const pending=controller.refresh()
 await Promise.resolve()
 controller.invalidate()
 resolve(snap(['AVAILABLE','AVAILABLE','AVAILABLE']))
 await pending
 assert.equal(controller.read().phase,'IDLE')
 assert.equal(controller.read().snapshot,null)
})
test('all sources unavailable is not promoted to ready',async()=>{
 const controller=createCssaWorldSnapshotController(async()=>snap(['UNKNOWN','UNKNOWN','UNKNOWN']))
 const result=await controller.refresh()
 assert.equal(result.phase,'UNAVAILABLE')
 assert.equal(result.snapshot.sourceStatus.business,'UNKNOWN')
})
