export default function CSSAStoreSourceNotice({state}:{state:unknown}) {
 if(!state||typeof state!=='object'||!('_source' in state))return null
 const source=state._source as {status?:string;file?:string;fallback?:string}
 if(!source||source.status==='AVAILABLE')return null
 return <p className="cssa-source-warning" role="status">Source locale {source.file} · UNKNOWN ({source.status}). {source.fallback==='TEMPLATE'?'Données initiales de référence ; aucun état live confirmé.':'Le contenu du registre reste inconnu ; les compteurs vides ne prouvent pas une absence.'}</p>
}
