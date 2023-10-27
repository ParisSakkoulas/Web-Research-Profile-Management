import { createFeatureSelector, createSelector } from "@ngrx/store";
import { PublicationState } from "./publication.state";
import { AppState } from "../../core.state";
import { Publication } from "src/app/models/publication.model";
import { state } from "@angular/animations";


export const selectPublications = createFeatureSelector<PublicationState>("publications");

//Selector για την επιλογή της κατάστατης
export const selectAllPublications = createSelector(
  selectPublications,
  (state: PublicationState) => state.publications
);


//Selector για την επιλογή της κατάστατης
export const selectCurrentStatus = createSelector(
  selectPublications,
  (state: PublicationState) => state.status
);



