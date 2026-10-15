import type {CssaPeopleState} from './cssaPeopleProjection'
import {cssaSourceAvailable} from './cssaLinkedReference'
import useCssaOrganisationRead from './useCssaOrganisationRead'

export default function useCssaPeople(){
 const {state}=useCssaOrganisationRead<CssaPeopleState>()
 return cssaSourceAvailable(state)?state:null
}
