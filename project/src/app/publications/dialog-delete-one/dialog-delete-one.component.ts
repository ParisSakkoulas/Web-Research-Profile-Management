import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';

@Component({
  selector: 'app-dialog-delete-one',
  templateUrl: './dialog-delete-one.component.html',
  styleUrls: ['./dialog-delete-one.component.css']
})
export class DialogDeleteOneComponent implements OnInit {

  publicationName = 'Pub 1';
  publicationId: any

  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService, private store: Store) {


    this.publicationName = data.publicationName,
      this.publicationId = data.publicationId


  }

  ngOnInit(): void {
  }


  delete() {

    this.publicationService.deletePublication(this.publicationId);
    this.store.dispatch(setLoadingAction({ status: true }));
    this.dialogRef.close();

  }

}
