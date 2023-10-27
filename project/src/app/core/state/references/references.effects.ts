import { Injectable } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Router } from "@angular/router";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { PublicationsService } from "src/app/publications/publication.service";
import * as RefActions from "./references.actions";

@Injectable()
export class ReferenceEffects {
  constructor(private actions$: Actions, private store: Store, private publicationService: PublicationsService, private router: Router, public dialogRef: MatDialog) { }




}
