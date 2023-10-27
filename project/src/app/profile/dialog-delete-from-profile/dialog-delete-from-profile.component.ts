import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { setLoadingAction } from 'src/app/core/state/spinner';

@Component({
  selector: 'app-dialog-delete-from-profile',
  templateUrl: './dialog-delete-from-profile.component.html',
  styleUrls: ['./dialog-delete-from-profile.component.css']
})
export class DialogDeleteFromProfileComponent implements OnInit {

  itemToDelete !: string;
  name !: string;
  idToDelete !: any;

  object !: {};

  constructor(public authService: AuthService, private store: Store, private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any,) {


    console.log(data.object.title)

    this.itemToDelete = data.delete;

    if (this.itemToDelete === 'Organization') {

      this.name = data.object.name;
      this.idToDelete = data.object.organization_id;

    }

    if (this.itemToDelete === 'Job') {
      this.name = data.object.title;
      this.idToDelete = data.object.job_id;

    }

    if (this.itemToDelete === 'Study') {
      this.name = data.object.title;
      this.idToDelete = data.object.study_id;
    }

  }

  ngOnInit(): void {

  }


  delete() {


    if (this.itemToDelete === 'Organization') {
      this.store.dispatch(setLoadingAction({ status: true }));

      this.authService.delteOrganization(this.idToDelete);
      this.dialogRef.close();
    }

    else if (this.itemToDelete === 'Job') {

      this.store.dispatch(setLoadingAction({ status: true }));

      this.authService.deleteJob(this.idToDelete);
      this.dialogRef.close();


    }

    else if (this.itemToDelete === 'Study') {
      this.store.dispatch(setLoadingAction({ status: true }));

      this.authService.deleteStudy(this.idToDelete);
      this.dialogRef.close();
    }

  }

}
