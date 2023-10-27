import { createAction, props } from "@ngrx/store";
import { ExternalReference } from "src/app/models/externalReference.model";



export const addExternalReference = createAction(
  "[Reference Dialog] Add Reference",
  props<{ externalReference: ExternalReference }>()
)


export const addExternalReferenceSuccess = createAction(
  "[Reference Dialog] Add Reference Success",
  props<{ externalReference: ExternalReference }>()
)


export const addExternalReferenceFailed = createAction(
  "[Reference Dialog] Add Reference Failed",
  props<{ error: any }>()
)
