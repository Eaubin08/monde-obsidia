"""Observe a standalone process without editing the Obsidia repository."""
import argparse,builtins,json,os,runpy,sys,threading,time,uuid,hashlib
from pathlib import Path
from datetime import datetime,timezone

def main():
 p=argparse.ArgumentParser();p.add_argument('--repo',required=True);p.add_argument('--output',required=True);p.add_argument('--agent',choices=['obsidure','brody','cli'],required=True);p.add_argument('--session',default=None);p.add_argument('--audit',action='store_true');p.add_argument('--audit-cycles',type=int,default=1);p.add_argument('--audit-interval',type=float,default=0);a=p.parse_args()
 if not 1<=a.audit_cycles<=20:p.error('Nombre de cycles : 1 à 20')
 if not 0<=a.audit_interval<=10:p.error('Intervalle : 0 à 10 secondes')
 
 if a.audit and a.agent!='obsidure':raise SystemExit('Audit disponible uniquement pour Obsidure')
 root=Path(a.repo).resolve();scripts={'obsidure':'scripts/obsidure_cli.py','brody':'scripts/brody_terminal_chat.py','cli':'scripts/obsidia_cli.py'};target=root/scripts[a.agent]
 if not target.is_file():raise SystemExit('Point d’entrée absent : '+str(target))
 out=Path(a.output).resolve();out.mkdir(parents=True,exist_ok=True);sid=a.session or str(uuid.uuid4());log=out/(sid+'.jsonl');lock=threading.RLock();stop=threading.Event();state={'status':'thinking','phase':'STARTING','message':'Démarrage du processus','objective':None};names={'obsidure':'Obsidure','brody':'Brody','cli':'CLI Obsidia'}
 def emit(kind,**fields):
  try:
   with lock:
    e={'schema':'OBSIDIA_VISUAL_EVENT_V1','sessionId':sid,'agentId':a.agent,'name':names[a.agent],'pid':os.getpid(),'repository':str(root),'timestamp':datetime.now(timezone.utc).isoformat(),'kind':kind,**state,**fields}
    with log.open('a',encoding='utf-8') as f:f.write(json.dumps(e,ensure_ascii=False)+'\n')
  except OSError:pass # Observation failure never changes the agent's result.
 old_stdout,old_stderr=sys.stdout,sys.stderr
 class ConsoleMirror:
  def __init__(self,original):self.original=original
  def write(self,value):
   result=self.original.write(value)
   try:
    with lock:
     with (out/(sid+'.console.txt')).open('a',encoding='utf-8') as file:file.write(value)
   except OSError:pass
   return result
  def flush(self):self.original.flush()
  def __getattr__(self,name):return getattr(self.original,name)
 sys.stdout=ConsoleMirror(old_stdout);sys.stderr=ConsoleMirror(old_stderr)
 def change(status,phase,message,objective=None):
  with lock:
   state.update(status=status,phase=phase,message=message)
   if objective is not None:state['objective']=objective[:1000]
   emit('activity')
 def beat():
  while not stop.wait(1):emit('heartbeat')
 old_input=builtins.input;brody_configured=False
 def observed_input(prompt=''):
  nonlocal brody_configured
  if a.agent=='brody' and not brody_configured:
   brody_configured=True;change('planning','SESSION_CONFIG','Mode non compact demandé via la commande Brody /compact off');return '/compact off'
  change('waiting','WAITING_INPUT','Attente de demande')
  text=old_input(prompt);change('thinking','INPUT_RECEIVED','Saisie reçue',objective=text if not text.startswith('/') else None);return text
 phases={'phase_a_audit':('reading','A_AUDIT','Audit en cours'),'phase_v_validation':('validating','V_VALIDATION','Validation en cours'),'phase_d_disruption':('generating','D_DISRUPTION','Construction en sandbox'),'phase_r_reintegration':('reviewing','R_REINTEGRATION','Émission du proposal')}
 def profile(frame,event,arg):
  if a.agent=='brody' and Path(frame.f_code.co_filename).name=='brody_terminal_chat.py':
   key=frame.f_code.co_name
   if event=='call' and key=='call_brody_api':change('thinking','BRODY_REQUEST','Demande envoyée à l’API Brody')
   elif event=='return' and key=='call_brody_api':
    if isinstance(arg,dict):
     summary={k:arg.get(k) for k in ['final_answer','response','final_answer_source','voice_source','topic','decision_authority','emits_act','memory_write','kernel_mutation'] if k in arg}
     for k in ['final_answer','response']:
      if isinstance(summary.get(k),str):summary[k]=summary[k][:8000]
     change('reviewing','BRODY_RESPONSE','Réponse reçue de l’API Brody');emit('response',result=summary)
    else:change('error','BRODY_REQUEST_FAILED','Appel Brody sans réponse exploitable — voir le terminal')
   return
  if a.agent!='obsidure':return
  if Path(frame.f_code.co_filename).name!='agent_obsidure.py':return
  key=frame.f_code.co_name
  if event=='return' and key=='phase_a_audit':
   result={k:getattr(arg,k,None) for k in ['intent','source','risk_flags']}
   emit('audit_result',result=result)
   return
  if event!='call':return
  if key in phases:change(*phases[key],objective=frame.f_locals.get('objective'))
  elif key=='run_lake_build':change('testing','LEAN_BUILD','Vérification Lean en cours')
  elif key=='run_cycle':change('planning','CYCLE_START','Cycle Obsidure commencé',objective=frame.f_locals.get('objective'))
 emit('session_start');threading.Thread(target=beat,daemon=True).start();builtins.input=observed_input;sys.setprofile(profile);sys.path.insert(0,str(root));sys.argv=[str(target)];
 if a.audit:sys.argv.extend(['--dry-run','--objective','Auditer les points d’entrée CLI, Brody et Obsidure sans modification','--max-cycles','1'])
 os.chdir(root)
 code=0
 try:
  for cycle in range(a.audit_cycles if a.audit else 1):
   if cycle and a.audit_interval:
    change('waiting','AUDIT_INTERVAL',f'Pause de {a.audit_interval:g} s avant audit {cycle+1}/{a.audit_cycles}')
    time.sleep(a.audit_interval)
   if a.audit:change('planning','AUDIT_ROUND',f'Audit réel {cycle+1}/{a.audit_cycles}')
   try:runpy.run_path(str(target),run_name='__main__')
   except SystemExit as e:
    round_code=e.code if isinstance(e.code,int) else (0 if e.code is None else 1)
    if round_code:raise
 except SystemExit as e:
  code=e.code if isinstance(e.code,int) else (0 if e.code is None else 1)
 except KeyboardInterrupt:code=130
 except BaseException as error:
  import traceback
  code=1;emit('runtime_error',message=str(error));traceback.print_exc();raise
 finally:
  sys.setprofile(None);builtins.input=old_input;stop.set();sys.stdout=old_stdout;sys.stderr=old_stderr;
  if a.audit:
   report={'schema':'OBSIDIA_LOCAL_ENTRYPOINT_AUDIT_V1','sessionId':sid,'agentExecution':'Obsidure phase A dry-run','processExitCode':code,'requestedCycles':a.audit_cycles,'intervalSeconds':a.audit_interval,'fileInventoryProducer':'Observateur local déterministe — séparé du raisonnement Obsidure','entries':[]}
   for rel in ['scripts/obsidia_cli.py','scripts/brody_terminal_chat.py','scripts/obsidure_cli.py','scripts/run_agent_obsidure.ps1','periphery/agents/agent_obsidure.py']:
    path=root/rel;entry={'path':rel,'exists':path.is_file()}
    if path.is_file() and path.resolve().is_relative_to(root):entry.update(sha256=hashlib.sha256(path.read_bytes()).hexdigest(),bytes=path.stat().st_size)
    report['entries'].append(entry)
   try:
    (out/(sid+'.report.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');emit('report',reportFile=sid+'.report.json')
   except OSError:pass
  emit('session_end',exitCode=code,status='success' if code==0 else 'error',phase='PROCESS_EXIT',message='Processus arrêté — code '+str(code))
 return code
if __name__=='__main__':sys.exit(main())
