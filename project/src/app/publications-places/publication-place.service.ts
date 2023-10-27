import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { PublicationPlaceType } from '../models/publication.place.model';
import { Journal } from '../models/journal.model';
import { Conference } from '../models/conference.model';
import { Book } from '../models/book.model';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { P } from '@angular/cdk/keycodes';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SuccessComponent } from '../success/success.component';
import { ErrorComponent } from '../error/error.component';

@Injectable({
  providedIn: 'root'
})
export class PublicationPlaceService {


  private publicationPlaces: { publication_place_id?: any, name: string, type: string, journal?: { journal_id: any, abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book }[] = [];
  private publicationPlacesUpdated = new Subject<{ publication_place_id?: any, name: string, type: string, journal?: { journal_id: any, abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book }[]>();

  private publicationPlaceUpdated = new Subject<{ publication_place_id?: any, name: string, type: string, journal?: { journal_id: any, abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book }>();


  constructor(private http: HttpClient, public dialog: MatDialog) { }



  addNewPublicationPlace(publicationPlaceToAdd: PublicationPlaceType) {

    let sectionObj;
    switch (publicationPlaceToAdd.type) {

      case 'Journal':
        sectionObj = publicationPlaceToAdd as Journal;
        break;

      case 'Conference':
        sectionObj = publicationPlaceToAdd as Conference;
        break;

      default:
        sectionObj = publicationPlaceToAdd as Book;
        break;
    }



    this.http.post<{ message: string, publication_place_created: { publication_place_id?: any, name: string, type: string } }>("https://localhost:3000/publicationPlaces/addPublicationPlace", sectionObj).subscribe({

      next: (response) => {

        console.log(response);

        const pPlaceToAdd = response.publication_place_created;
        this.publicationPlaces.push(pPlaceToAdd)

        console.log(this.publicationPlaces)
        this.publicationPlacesUpdated.next([...this.publicationPlaces]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    });



  }

  getPublicationPlacesUpdateListener() {
    return this.publicationPlacesUpdated.asObservable();
  }




  getAllPublicationPlaces() {

    this.http.get<{ message: string, publication_places: { publication_place_id: any, name: string, type: string }[] }>("https://localhost:3000/publicationPlaces/allPublicationPlaces")
      .pipe(map((placeData) => {

        console.log(placeData)
        return placeData.publication_places.map(place => {
          return {
            publication_place_id: place.publication_place_id,
            name: place.name,
            type: place.type,
          }
        });


      })).subscribe(transformedPlaces => {
        this.publicationPlaces = transformedPlaces;
        this.publicationPlacesUpdated.next([...this.publicationPlaces]);
      })

  }

  getSinglePublicationPlace(id: string) {

    return this.http.get<{ message: string, singlePublicationPlaceFound: { id: any, name: string, type: string }, journal?: { journal_id: any, abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book }>("https://localhost:3000/publicationPlaces/singlePublicationPlace/" + id);

  }

  getPublicationPlaceUpdateListener() {
    return this.publicationPlaceUpdated.asObservable();
  }

  deleteSinglePublicationPlace(id: string) {
    this.http.delete<{ message: string, state: string }>("https://localhost:3000/publicationPlaces/deletePublicationPlace/" + id).subscribe({
      next: (response) => {

        if (response.state === 'YES') {

          const updatedpublicationPlaces = this.publicationPlaces.filter(p => p.publication_place_id !== id);


          this.publicationPlaces = updatedpublicationPlaces;
          this.publicationPlacesUpdated.next([...this.publicationPlaces]);

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.dialog.open(SuccessComponent, dialogMessageConfig);

        }
        else {

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.dialog.open(ErrorComponent, dialogMessageConfig);

        }

      }
    })
  }

  editPublicationPlace(id: string, publicationPlace: { name: string, type: string, journal?: { abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book }) {


    this.http.put<{ message: string, state: string, publicationPlace: { publication_place_id?: any, name: string, type: string, journal?: { journal_id?: any, abbreviation: string, publisher: string }, conferences?: { abbreviation: string }, book?: Book } }>("https://localhost:3000/publicationPlaces/" + id, publicationPlace).subscribe({
      next: (response) => {

        console.log(response);

        if (response.state === 'YES') {

          const updatedPublicationsPlaces = this.publicationPlaces.map(p => {
            if (Number(p.publication_place_id) === Number(id)) {
              console.log(p);
              return {
                publication_place_id: id,
                name: publicationPlace.name,
                type: publicationPlace.type
              };
            }
            return p;
          });

          this.publicationPlaces = updatedPublicationsPlaces;
          this.publicationPlacesUpdated.next([...this.publicationPlaces]);

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.dialog.open(SuccessComponent, dialogMessageConfig);

        }
        else {
          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.dialog.open(ErrorComponent, dialogMessageConfig);

        }
      }
    })

  }
}
