import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { PublicationsService } from '../publication.service';
import { PublicationPlaceService } from 'src/app/publications-places/publication-place.service';
import { PublicationPlace } from 'src/app/models/publication.place.model';

@Component({
  selector: 'app-dialog-add-publication-place',
  templateUrl: './dialog-add-publication-place.component.html',
  styleUrls: ['./dialog-add-publication-place.component.css']
})
export class DialogAddPublicationPlaceComponent implements OnInit {

  createPublicationPlace !: FormGroup;
  createJournalForm !: FormGroup;
  createConferenceForm !: FormGroup;
  createBookForm !: FormGroup;
  addingPublicationPlace: boolean = false;
  types: String[] = ["Journal", "Book", "Conference"];
  months: String[] = ["January", "February", "March", "April", "May", "June", "Jule", "August", "September", "October", "November", "December"];


  constructor(public publicationPlaceService: PublicationPlaceService, private fb: FormBuilder, public dialogRef: MatDialogRef<DialogCreateComponent>,) { }

  ngOnInit(): void {

    this.createPublicationPlace = this.fb.group({
      name: new FormControl('', Validators.required),
      type: new FormControl(null, Validators.required)
    })

    this.createJournalForm = this.fb.group({
      abbreviation: new FormControl('', Validators.required),
      publisher: new FormControl('', Validators.required),
    })

    this.createConferenceForm = this.fb.group({
      abbreviation: new FormControl('', Validators.required)
    })

    this.createBookForm = this.fb.group({
      publisher: new FormControl('', Validators.required),
      volume: new FormControl(null,),
      series: new FormControl(null),
      pages: new FormControl(null),
      month: new FormControl(null),
      address: new FormControl(null),
      version: new FormControl(null)
    })

  }


  onAddPublicationPlace() {

    this.addingPublicationPlace = true;

    const publicationPlace = {
      name: this.createPublicationPlace.value.name,
      type: this.createPublicationPlace.value.type
    }



    switch (this.createPublicationPlace.value.type) {

      case 'Journal':
        const journal = {
          publication_place_id: '1',
          name: this.createPublicationPlace.value.name,
          type: this.createPublicationPlace.value.type,
          abbreviation: this.createJournalForm.value.abbreviation,
          publisher: this.createJournalForm.value.publisher,
        }

        this.publicationPlaceService.addNewPublicationPlace(journal);
        break;

      case 'Conference':
        const conference = {
          publication_place_id: '1',
          name: this.createPublicationPlace.value.name,
          type: this.createPublicationPlace.value.type,
          abbreviation: this.createConferenceForm.value.abbreviation
        }


        this.publicationPlaceService.addNewPublicationPlace(conference)

        break;

      case 'Book':
        const book = {
          publication_place_id: '1',
          name: this.createPublicationPlace.value.name,
          type: this.createPublicationPlace.value.type,
          publisher: this.createBookForm.value.publisher,
          volume: this.createBookForm.value.volume,
          series: this.createBookForm.value.series,
          pages: this.createBookForm.value.pages,
          month: this.createBookForm.value.month,
          address: this.createBookForm.value.address,
          version: this.createBookForm.value.version,
        }
        console.log(book)

        this.publicationPlaceService.addNewPublicationPlace(book)




        break;

    }
    this.addingPublicationPlace = false;
    this.dialogRef.close()








  }


  closeMatDialog() {
    this.dialogRef.close()
  }

}
