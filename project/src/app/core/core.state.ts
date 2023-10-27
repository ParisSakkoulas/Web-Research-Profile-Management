import { PublicationState } from "./state/publications";
import { SpinnerState } from "./state/spinner";


export interface AppState {
  publications: PublicationState,
  spinner: SpinnerState
}
