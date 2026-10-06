import {existsSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
const root=fileURLToPath(new URL('../',import.meta.url))
const modules=['vite','@vitejs/plugin-react','react','react-dom','typescript','rolldown']
const results=await Promise.allSettled(modules.map(name=>import(name)))
const failures=results.flatMap((result,i)=>result.status==='rejected'?[modules[i]+': '+result.reason.message]:[])
for(const path of ['node_modules/vite/bin/vite.js',...['vite','tsc'].map(name=>'node_modules/.bin/'+name+(process.platform==='win32'?'.cmd':''))]){
 if(!existsSync(resolve(root,path)))failures.push('Fichier manquant : '+path)
}
if(failures.length){
 if(!process.argv.includes('--quiet'))console.error('Installation incomplete :\n'+failures.join('\n'))
 process.exitCode=1
}
