
import { createAction, props } from "@ngrx/store";
import { Article } from "src/app/models/article.model";
import { ExternalReference } from "src/app/models/externalReference.model";
import { Publication, PublicationType } from "src/app/models/publication.model";

export const appLoaded = createAction("[App] App Loaded");

export const loadPublications = createAction("[Publication List] Load Publications");

export const loadPublicationsSuccess = createAction(
  "[Publication List] Fetch Publication Success",
  props<{ publications: PublicationType[] }>()
);

export const loadPublicationsFailed = createAction(
  "[Publication List] Fetch Publication Failed",
  props<{ error: any }>()
);



//Action για την προσθήκη μιας δημοσίευσης
export const addPublication = createAction(
  "[AddPublication Page] Add Publication",
  props<{ publication: PublicationType }>()
);

//Action αφού γίνει η προσθήκη δημοσίευσης επιτυχημένα
export const addPublicationSuccess = createAction(
  "[Publication List] Add Publication Success",
  props<{ publication: PublicationType, references: ExternalReference[] }>()
);

//Action σε περίπτωση που  η προσθήκη δημοσίευσης αποτύχει
export const addPublicationFailed = createAction(
  "[Publication List] Add Publication Failed",
  props<{ error: any }>()
);




//Action για την επεξεργασία μιας δημοσίευσης
export const editPublication = createAction(
  "[Edit Publication] Edit Publication",
  props<{ publication: Publication }>()
);

export const editPublicationSuccess = createAction(
  "[SinglePublication Page] Publication Menu Item Success",
  props<{ menuItem: Publication }>()
);

export const editPublicationFailed = createAction(
  "[SinglePublication Page] Edit Publication Item Failed",
  props<{ error: any }>()
);



//Action για την διαγραφή μιας δημοσίευσης
export const deletePublication = createAction(
  "[Publications List] Delete Publication",
  props<{ publicationId: any }>()
);

export const deletePublicationSuccess = createAction(
  "[Publication List] Delete Publication Success",
  props<{ publicationId: any }>()
);


export const deletePublicationFailed = createAction(
  "[Publication List] Delete Publication Failed",
  props<{ error: any }>()
);
