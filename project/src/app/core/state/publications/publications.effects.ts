import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";

import { PublicationsService } from "src/app/publications/publication.service";

import { Injectable, OnInit } from "@angular/core";
import { of, from, mergeMap, concatMap, Subject } from "rxjs";

import * as PublicationsActions from "./publications.action";
import { catchError, switchMap, tap, map, exhaustMap } from "rxjs";

import { Router } from "@angular/router";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { Publication, PublicationType } from "src/app/models/publication.model";
import { Article } from "src/app/models/article.model";
import { HttpBackend, HttpResponse, HttpStatusCode } from "@angular/common/http";
import { SuccessComponent } from "src/app/success/success.component";
import { ReferenceDialogComponent } from "src/app/references/reference-dialog/reference-dialog.component";
import { setLoadingAction } from "../spinner";



@Injectable()
export class PublicationEffects {





  constructor(private actions$: Actions, private store: Store, private publicationService: PublicationsService, private router: Router, public dialogRef: MatDialog) { }







  loadPublications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PublicationsActions.appLoaded, PublicationsActions.loadPublications),
      exhaustMap(() =>
        this.publicationService.getPublications().pipe(
          tap((publications) => {

            console.log(publications)
            console.log('API call is being made', publications)

          }),
          map((response) =>
            PublicationsActions.loadPublicationsSuccess({ publications: response.publications })),
          catchError((error) => of(PublicationsActions.loadPublicationsFailed({ error })))
        )
      )
    )
  );


  addPublication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PublicationsActions.addPublication),
      concatMap((newPublication) =>
        this.publicationService.addPublication(newPublication.publication).pipe(tap(() => {

        }),
          map((response) => {
            //considering for check status response
            console.log(response.publication)


            if (response.references) {


              console.log(response.references)

              const dialogReConfig = new MatDialogConfig();

              dialogReConfig.data = { references: response.references, publicationId: response.publication_id }

              dialogReConfig.panelClass = 'refss_class_dialog'

              this.store.dispatch(setLoadingAction({ status: false }));
              this.dialogRef.open(ReferenceDialogComponent, dialogReConfig);


            }

            else {
              const dialogMessageConfig = new MatDialogConfig();
              dialogMessageConfig.data = {
                message: response.message
              }
              //ορισμός κλάσης refss_class_dialog
              dialogMessageConfig.panelClass = 'success_class';
              this.store.dispatch(setLoadingAction({ status: false }));

              this.dialogRef.open(SuccessComponent, dialogMessageConfig);
              this.router.navigate(['allPublications']);


            }


            return PublicationsActions.addPublicationSuccess({ publication: response.publication, references: response.references })


          }),
          catchError((error) => of(PublicationsActions.addPublicationFailed({ error })))
        )
      )
    )
  );









}


