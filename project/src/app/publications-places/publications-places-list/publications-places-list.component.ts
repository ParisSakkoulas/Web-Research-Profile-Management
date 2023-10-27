import { Component, OnInit } from '@angular/core';
import { PublicationPlaceService } from '../publication-place.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogAddRefManualComponent } from 'src/app/publications/dialog-add-ref-manual/dialog-add-ref-manual.component';
import { DialogAddPublicationPlaceComponent } from 'src/app/publications/dialog-add-publication-place/dialog-add-publication-place.component';
import { DialogEditPublicationPlaceComponent } from '../dialog-edit-publication-place/dialog-edit-publication-place.component';

@Component({
  selector: 'app-publications-places-list',
  templateUrl: './publications-places-list.component.html',
  styleUrls: ['./publications-places-list.component.css']
})
export class PublicationsPlacesListComponent implements OnInit {




  public totalPublicationPlaces = 0; // Total number of categopries
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [3, 5, 10, 15, 20]
  displayedPublicationPlaces: { publication_place_id: any, name: string, type: string, selected: boolean }[] = [];

  filterValue!: string;

  private publicationPlacesSubscription !: Subscription;


  publicationPlacesCheck!: { publication_place_id: any, name: string, type: string, selected: boolean }[];


  constructor(public dialog: MatDialog, public publicationPlaceService: PublicationPlaceService) { }

  ngOnInit(): void {

    //Καλούμε το service για να πάρουμε όλα τα publicationPlaces
    this.publicationPlaceService.getAllPublicationPlaces();

    this.publicationPlacesSubscription = this.publicationPlaceService.getPublicationPlacesUpdateListener().subscribe({

      next: (places) => {

        this.publicationPlacesCheck = places.map(p => {

          console.log(p)
          return {
            publication_place_id: p.publication_place_id,
            name: p.name,
            type: p.type,
            selected: false
          }

        })
        this.totalPublicationPlaces = places.length;
        this.updateDisplayedPublicationPlaces();

        console.log(places)
      }
    })

  }


  updateDisplayedPublicationPlaces() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    if (this.publicationPlacesCheck) {
      this.displayedPublicationPlaces = this.publicationPlacesCheck.slice(startIndex, endIndex);

    }
  }

  onPageChange(event: PageEvent) {
    console.log(event.pageSize)
    this.pageSize = event.pageSize;
    this.currentPage = event.pageIndex;

    this.updateDisplayedPublicationPlaces();
  }

  ngOnDestroy(): void {

    //Κάνουμε unsubscribe στα subscription
    this.publicationPlacesSubscription.unsubscribe()

  }

  applyFilter() {
    if (this.filterValue) {
      this.displayedPublicationPlaces = this.publicationPlacesCheck.filter(place => {
        // Customize the condition based on your filtering requirements
        if (place.name.toLowerCase().includes(this.filterValue.toLowerCase())) {
          return place.name.toLowerCase().includes(this.filterValue.toLowerCase());
        }
        else {
          return place.type.toLowerCase().includes(this.filterValue.toLowerCase());
        }
      });
    } else {
      this.displayedPublicationPlaces = this.publicationPlacesCheck;
    }
  }

  openAddPublicationPlace() {
    //Ρυθμίσεις dialog
    const dialogAuthorConfig = new MatDialogConfig();
    dialogAuthorConfig.disableClose = true;
    dialogAuthorConfig.autoFocus = true;
    dialogAuthorConfig.width = '800px';
    const dialogRef = this.dialog.open(DialogAddPublicationPlaceComponent, dialogAuthorConfig);


  }

  openEditPublicationPlace(id: string) {
    //Ρυθμίσεις dialog
    const dialogAuthorConfig = new MatDialogConfig();
    dialogAuthorConfig.disableClose = true;
    dialogAuthorConfig.autoFocus = true;
    dialogAuthorConfig.width = '800px';

    dialogAuthorConfig.data = {
      id: id
    }

    const dialogRef = this.dialog.open(DialogEditPublicationPlaceComponent, dialogAuthorConfig);


  }

  deleteSinglePlace(id: string) {

    this.publicationPlaceService.deleteSinglePublicationPlace(id);

  }

}
