import { ActionReducerMap, MetaReducer } from "@ngrx/store";
import { AppState } from "./core.state";
import * as PublicationReducers from "./state/publications/publications.reducer";
import * as SpinnerReducers from "./state/spinner/spinner.reducer";


export const reducers: ActionReducerMap<AppState> = {
  publications: PublicationReducers.reducer,
  spinner: SpinnerReducers.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = [];
