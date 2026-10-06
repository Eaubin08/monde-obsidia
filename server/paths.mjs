import {fileURLToPath} from 'node:url'
import {resolve} from 'node:path'
import {existsSync} from 'node:fs'
export const projectRoot=fileURLToPath(new URL('../',import.meta.url))
export const repository=()=>resolve(projectRoot,process.env.OBSIDIA_SOURCE_REPO||'../sources/obsidia-x108-proofs')
export const observer=resolve(projectRoot,'scripts/observe_agent.py')
export const pythonFor=root=>process.env.OBSIDIA_PYTHON||[
 resolve(root,'.venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'),
 resolve(root,'venv',process.platform==='win32'?'Scripts/python.exe':'bin/python'),
].find(existsSync)||(process.platform==='win32'?'python':'python3')
