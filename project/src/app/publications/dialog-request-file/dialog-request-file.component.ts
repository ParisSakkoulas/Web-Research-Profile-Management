import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { RequestService } from 'src/app/requests/request.service';

@Component({
  selector: 'app-dialog-request-file',
  templateUrl: './dialog-request-file.component.html',
  styleUrls: ['./dialog-request-file.component.css']
})
export class DialogRequestFileComponent implements OnInit {


  public fileId: any;
  public filename !: string;
  public file_type!: string;
  public userToNotify !: string;
  public setRequestDescription !: FormGroup;


  constructor(private store: Store, private fb: FormBuilder, private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public requestService: RequestService) {


    this.fileId = data.fileId;
    this.filename = data.filename;
    this.file_type = data.file_type;
    this.userToNotify = data.userToNotify

  }

  ngOnInit(): void {


    this.setRequestDescription = this.fb.group({
      description: new FormControl(''),
    })

  }


  onSendRequest() {
    this.store.dispatch(setLoadingAction({ status: true }));

    const requestObj = {
      fileId: this.fileId,
      fileName: this.filename,
      fileType: this.file_type,
      description: this.setRequestDescription.value.description,
      dismissed: false,
      userToNotify: this.userToNotify
    }


    console.log(requestObj)

    this.requestService.requestFile(requestObj);
    this.dialogRef.close();



  }


  closeMatDialog() {
    this.dialogRef.close();

  }

}
