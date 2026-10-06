const modules=['vite','@vitejs/plugin-react','react','react-dom','typescript']
const results=await Promise.allSettled(modules.map(name=>import(name)))
const failures=results.flatMap((result,i)=>result.status==='rejected'?[modules[i]+': '+result.reason.message]:[])
if(failures.length){
 if(!process.argv.includes('--quiet'))console.error('Installation incomplete :\n'+failures.join('\n'))
 process.exitCode=1
}
