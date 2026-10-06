import {execFileSync} from 'node:child_process';
import {existsSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const repository=process.env.OBSIDIA_SOURCE_REPO || resolve('../sources/obsidia-x108-proofs');
const output={repository,available:false,commit:null,branch:null,observedAt:new Date().toISOString(),agentFiles:[],registry:null,error:null};
const git=(...args)=>execFileSync('git',['-C',repository,'--no-pager',...args],{encoding:'utf8',maxBuffer:8*1024*1024,windowsHide:true}).trim();
if(existsSync(repository)){
 try{output.commit=git('rev-parse','HEAD');output.branch=git('branch','--show-current');output.agentFiles=git('ls-tree','-r','--name-only','HEAD','--','periphery/agents').split('\n').filter(Boolean);const registry='docs/agents/AGENT_LAYER_REGISTRY_V0.md';if(git('ls-tree','--name-only','HEAD','--',registry))output.registry={path:registry,content:git('show',`HEAD:${registry}`)};output.available=true}catch(e){output.error=String(e.message).slice(0,300)}
}else output.error='Copie source non trouvée à cet emplacement';
mkdirSync('public/data',{recursive:true});writeFileSync('public/data/local-inventory.json',JSON.stringify(output,null,2));
console.log(output.available?`Obsidia : ${output.agentFiles.length} fichiers agents lus, HEAD ${output.commit.slice(0,12)}. Aucun runtime exécuté.`:'Obsidia : sources locales non accessibles ; affichage documentaire conservé.');
