import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
const execute=promisify(execFile)
export const quote=s=>"'"+String(s).replaceAll("'","''")+"'"
export const encoded=s=>Buffer.from(s,'utf16le').toString('base64')
async function powershell(command){return execute('powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',encoded(command)],{timeout:10000,windowsHide:true,encoding:'utf8'})}
export function terminalCommand(root,title,python,args){return `$host.UI.RawUI.WindowTitle = ${quote(title)}; $env:PYTHONUTF8 = '1'; $env:PYTHONUNBUFFERED = '1'; $env:PYTHONIOENCODING = 'utf-8'; Set-Location -LiteralPath ${quote(root)}; try { & ${quote(python)} `+args.map(quote).join(' ')+`; Write-Host ('Processus termine : ' + $LASTEXITCODE) } catch { Write-Host $_ -ForegroundColor Red }; Write-Host 'Ce terminal reste ouvert.'`}
export function launchCommand(command){return `$ErrorActionPreference = 'Stop'; $obsidiaWindow = Start-Process -FilePath "$PSHOME\\powershell.exe" -ArgumentList @('-NoProfile','-NoExit','-EncodedCommand',${quote(encoded(command))}) -WindowStyle Normal -PassThru; Write-Output $obsidiaWindow.Id`}
export async function launchTerminal(command){const {stdout}=await powershell(launchCommand(command));const pid=Number(stdout.trim());if(!Number.isSafeInteger(pid)||pid<=0)throw Error('Windows n’a pas confirmé le lancement du terminal');return pid}
export async function focusTerminal(title,pid){await powershell(`$ErrorActionPreference = 'Stop'; $obsidiaFocus = New-Object -ComObject WScript.Shell; if (-not $obsidiaFocus.AppActivate(${quote(title)})) { if (-not $obsidiaFocus.AppActivate(${Number(pid)})) { throw 'Terminal introuvable ou premier plan refuse par Windows' } }`)}
export async function stopTerminal(pid){await execute('taskkill.exe',['/PID',String(pid),'/T','/F'],{timeout:10000,windowsHide:true})}
export async function terminalAlive(pid){try{await powershell(`$ErrorActionPreference = 'Stop'; $null = Get-Process -Id ${Number(pid)} -ErrorAction Stop`);return true}catch{return false}}
