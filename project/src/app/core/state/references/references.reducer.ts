import { Action, createReducer, on } from "@ngrx/store";
import { ReferenceState, initialState } from "./refereces.state";
import * as RefActions from "./references.actions";



const referenceReducer = createReducer(
  initialState,

  //Σε περίπτωση που γίνει dispatch η addPublication action
  on(RefActions.addExternalReference, (state, { externalReference }) => ({
    ...state,
    status: 'loading'
  })),

  //Σε περίπτωση που επιτύχει η addPublication
  on(RefActions.addExternalReferenceSuccess, (state, { externalReference }) => ({
    ...state,
    status: 'success'
  })),

  on(RefActions.addExternalReferenceFailed, (state, { error }) => ({ ...state, error: error, status: 'error' })),


)



export function reducer(state: ReferenceState | undefined, action: Action) {
  return referenceReducer(state, action);
}
