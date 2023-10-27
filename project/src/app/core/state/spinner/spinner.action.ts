import { createAction, props } from "@ngrx/store";



export const setLoadingAction = createAction(
  "[App] Set Loading Spinner",
  props<{ status: boolean }>()
);
