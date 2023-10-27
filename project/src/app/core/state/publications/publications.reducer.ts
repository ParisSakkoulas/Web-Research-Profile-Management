import { Action, createReducer, on } from "@ngrx/store";
import { PublicationState, initialState } from "./publication.state";

import * as PublicationsActions from "./publications.action";
import { state } from "@angular/animations";



//Δημιουργία Refucer για τις Δημοσίευσης
const publicationReducer = createReducer(

  //Καθορισμός initila state
  initialState,

  //Εφαρμογή του reducer οταν καλείται η loadPublications action
  on(PublicationsActions.loadPublications, (state) => ({ ...state, status: "loading" as const })),

  //Εφαρμοργή όταν καλεστεί η loadPublicationsSuccess action
  on(PublicationsActions.loadPublicationsSuccess, (state, { publications }) => ({
    ...state,
    publications: publications,
    error: null,
    status: 'success' as const
  })),

  //Ενεργοποείται όταν καλείται η loadPublicationsFailed
  on(PublicationsActions.loadPublicationsFailed, (state, { error }) => ({ ...state, error: error, status: 'error' as const })),



  //Σε περίπτωση που γίνει dispatch η addPublication action
  on(PublicationsActions.addPublication, (state, { publication }) => ({
    ...state,
    publications: [...state.publications, publication],
    status: 'loading' as const
  })),


  //Σε περίπτωση που επιτύχει η addPublication
  on(PublicationsActions.addPublicationSuccess, (state, { publication, references }) => ({
    ...state,
    publications: state.publications.map((p) => p.publication_id === publication.publication_id ? publication : p),
    references: references,
    status: 'success' as const
  })),

  //Σε περίπτωση που αποτύχει η addPublication
  on(PublicationsActions.addPublicationFailed, (state, { error }) => ({ ...state, error: error, status: 'error' as const })),

  //Σε περίπτωση που γίνει dispatch η deletePublication action
  on(PublicationsActions.deletePublication, (state, { publicationId }) => ({
    ...state,
    publications: state.publications.filter((publication) => publication.publication_id !== publicationId),
  })),




);



export function reducer(state: PublicationState | undefined, action: Action) {
  return publicationReducer(state, action);
}
