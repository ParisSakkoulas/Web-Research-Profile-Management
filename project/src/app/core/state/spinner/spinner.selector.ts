import { createFeatureSelector, createSelector } from "@ngrx/store";
import { SpinnerState } from "./spinner.state";



export const selectSpinnerStatus = createFeatureSelector<SpinnerState>("spinner");


export const selectSpinner = createSelector(
  selectSpinnerStatus,
  (state: SpinnerState) => state.showLoading
)
