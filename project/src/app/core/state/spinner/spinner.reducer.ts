import { Action, createReducer, on } from "@ngrx/store";
import { initialState } from "../spinner/spinner.state";

import * as SpinnerActions from "./spinner.action";
import { SpinnerState } from "./spinner.state";

const spinnerReducer = createReducer(
  initialState,


  //Εφαρμοργή όταν καλεστεί η loadPublicationsSuccess action
  on(SpinnerActions.setLoadingAction, (state, { status }) => ({
    ...state,
    showLoading: status
  })),

)


export function reducer(state: SpinnerState | undefined, action: Action) {
  return spinnerReducer(state, action);
}
