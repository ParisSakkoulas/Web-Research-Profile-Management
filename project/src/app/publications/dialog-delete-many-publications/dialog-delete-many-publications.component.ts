import { Component, Inject, OnInit } from '@angular/core';
import { PublicationsService } from '../publication.service';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';

@Component({
  selector: 'app-dialog-delete-many-publications',
  templateUrl: './dialog-delete-many-publications.component.html',
  styleUrls: ['./dialog-delete-many-publications.component.css']
})
export class DialogDeleteManyPublicationsComponent implements OnInit {

  publicationIds !: number[];
  publicationNames !: String[];



  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService, private store: Store) {


    this.publicationIds = data.publicationIds;
    this.publicationNames = data.publicationNames
    console.log(data);
    console.log(this.publicationIds)

  }

  ngOnInit(): void {
  }


  delete() {

    this.publicationService.deleteManyPublications(this.publicationIds);
    this.store.dispatch(setLoadingAction({ status: true }));
    this.dialogRef.close();
  }

}
