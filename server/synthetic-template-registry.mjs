// V47 finite template registry: descriptive capabilities, never executable source code.
const registry=Object.freeze([
 Object.freeze({id:'agent-observer-v1',kind:'AGENT_CONFIG',capabilities:Object.freeze(['OBSERVE']),schema:'OBSIDIA_SYNTHETIC_COMPONENT_V0'}),
 Object.freeze({id:'tool-reader-v1',kind:'TOOL_CONFIG',capabilities:Object.freeze(['READ']),schema:'OBSIDIA_SYNTHETIC_COMPONENT_V0'}),
 Object.freeze({id:'workflow-sequence-v1',kind:'WORKFLOW_CONFIG',capabilities:Object.freeze(['SEQUENCE']),schema:'OBSIDIA_SYNTHETIC_COMPONENT_V0'})
])
export function listSyntheticTemplates(){return registry.map(t=>({...t,capabilities:[...t.capabilities]}))}
export function selectSyntheticTemplate(kind,requiredCapabilities=[]){
 if(!Array.isArray(requiredCapabilities)||requiredCapabilities.some(x=>typeof x!=='string'))return null
 const found=registry.filter(t=>t.kind===kind&&requiredCapabilities.every(c=>t.capabilities.includes(c)))
 return found.length===1?{...found[0],capabilities:[...found[0].capabilities]}:null
}
