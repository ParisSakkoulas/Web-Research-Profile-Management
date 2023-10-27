import { Component, Inject, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators, FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { PublicationPlaceService } from '../publication-place.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { Book } from 'src/app/models/book.model';
import { T } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-dialog-edit-publication-place',
  templateUrl: './dialog-edit-publication-place.component.html',
  styleUrls: ['./dialog-edit-publication-place.component.css']
})
export class DialogEditPublicationPlaceComponent implements OnInit {

  createPublicationPlace !: FormGroup;
  createJournalForm !: FormGroup;
  createConferenceForm !: FormGroup;
  createBookForm !: FormGroup;
  addingPublicationPlace: boolean = false;
  types: String[] = ["Journal", "Book", "Conference"];
  months: String[] = ["January", "February", "March", "April", "May", "June", "Jule", "August", "September", "October", "November", "December"];
  public publicationPlace !: { publication_place_id?: any, name: string, type: string, journal?: { journal_id: any, abbreviation: string, publisher: string }, conference?: { abbreviation: string }, book?: Book }


  publicationPlaceId !: string;

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public route: ActivatedRoute, public publicationPlaceService: PublicationPlaceService, private fb: FormBuilder, public dialogRef: MatDialogRef<DialogCreateComponent>,) {

    this.publicationPlaceId = data.id;

  }

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


    console.log(this.publicationPlaceId)

    this.publicationPlaceService.getSinglePublicationPlace(this.publicationPlaceId).subscribe({
      next: (result) => {

        console.log(result.singlePublicationPlaceFound)

        this.publicationPlace = result.singlePublicationPlaceFound;
        this.createPublicationPlace.patchValue({
          name: this.publicationPlace.name,
          type: this.publicationPlace.type
        });

        switch (this.publicationPlace.type) {
          case 'Journal':
            this.createJournalForm.patchValue({
              abbreviation: this.publicationPlace.journal?.abbreviation,
              publisher: this.publicationPlace.journal?.publisher,
            })
            break;

          case 'Conference':
            this.createConferenceForm.patchValue({
              abbreviation: this.publicationPlace.conference?.abbreviation,
            })
            break;

          case 'Book':
            this.createBookForm.patchValue({
              publisher: this.publicationPlace.book?.publisher,
              volume: this.publicationPlace.book?.volume,
              series: this.publicationPlace.book?.series,
              pages: this.publicationPlace.book?.pages,
              month: this.publicationPlace.book?.month,
              address: this.publicationPlace.book?.address,
              version: this.publicationPlace.book?.version,

            })
            break;
        }

      }
    })






  }




  onUpdatePublicationPlace() {

    console.log(this.createPublicationPlace.controls['type'].value)
    console.log(this.createJournalForm.controls['abbreviation'].value)
    console.log(this.createJournalForm.controls['publisher'].value)


    switch (this.createPublicationPlace.controls['type'].value) {

      case 'Journal':
        const journal = {
          name: this.createPublicationPlace.controls['name'].value,
          type: this.createPublicationPlace.controls['type'].value,
          abbreviation: this.createJournalForm.controls['abbreviation'].value,
          publisher: this.createJournalForm.controls['publisher'].value,
        }

        this.publicationPlaceService.editPublicationPlace(this.publicationPlaceId, journal);
        this.dialogRef.close()
        break;

      case 'Conference':
        const conference = {
          name: this.createPublicationPlace.controls['name'].value,
          type: this.createPublicationPlace.controls['type'].value,
          abbreviation: this.createConferenceForm.controls['abbreviation'].value,
        }


        this.publicationPlaceService.editPublicationPlace(this.publicationPlaceId, conference);
        this.dialogRef.close()

        break;

      case 'Book':
        const book = {
          name: this.createPublicationPlace.controls['name'].value,
          type: this.createPublicationPlace.controls['type'].value,
          publisher: this.createBookForm.controls['publisher'].value,
          volume: this.createBookForm.controls['volume'].value,
          series: this.createBookForm.controls['series'].value,
          pages: this.createBookForm.controls['pages'].value,
          month: this.createBookForm.controls['month'].value,
          address: this.createBookForm.controls['address'].value,
          version: this.createBookForm.controls['version'].value,
        }
        console.log(book)

        this.publicationPlaceService.editPublicationPlace(this.publicationPlaceId, book);


        this.dialogRef.close()

        break;

    }
  }

  closeMatDialog() {

    this.dialogRef.close()
  }

}
