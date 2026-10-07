import {existsSync,readdirSync,readFileSync,statSync} from 'node:fs'
import {resolve} from 'node:path'
import {projectRoot} from './paths.mjs'
export const liveDirectory=resolve(projectRoot,process.env.OBSIDIA_LIVE_DIRECTORY||'.obsidia-live')
export function liveSnapshot(directory=liveDirectory,now=Date.now()){
 const sessions=[];if(!existsSync(directory))return {sessions,observedAt:new Date(now).toISOString()}
 for(const file of readdirSync(directory).filter(f=>/^[a-zA-Z0-9-]+\.jsonl$/.test(f)).slice(-200)){
  try{const path=resolve(directory,file);if(statSync(path).size>8*1024*1024)continue;const lines=readFileSync(path,'utf8').trim().split('\n');let last=null,events=[];for(const line of lines){try{const e=JSON.parse(line);if(e.schema!=='OBSIDIA_VISUAL_EVENT_V1'||!['obsidure','brody','cli','jarjar'].includes(e.agentId))continue;last=e;if(e.kind!=='heartbeat')events.push(e)}catch{}}
   const e=last;if(!e)continue;const ended=e.kind==='session_end';const age=now-Date.parse(e.timestamp);const fresh=Number.isFinite(age)&&age>=-5000&&age<5000;const presence=ended?'ended':fresh?'live':'unknown';sessions.push({...e,presence,status:presence==='unknown'?'paused':e.status,events:events.slice(-200)})
  }catch{}
 }
 return {sessions,observedAt:new Date(now).toISOString()}
}
