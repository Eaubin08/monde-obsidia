// Explicit diagnostic. Never launches generated code or authorizes deployment.
import {probeV58Isolation} from './v58-docker-isolation-probe.mjs'
const probe=await probeV58Isolation()
console.log(JSON.stringify(probe,null,2))
if(probe.status!=='PROBED_ISOLATION')process.exitCode=1
