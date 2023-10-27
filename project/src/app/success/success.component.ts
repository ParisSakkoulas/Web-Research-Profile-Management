import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-success',
  templateUrl: './success.component.html',
  styleUrls: ['./success.component.css']
})
export class SuccessComponent {

  message = '';

  constructor(private dialogRef: MatDialogRef<SuccessComponent>, @Inject(MAT_DIALOG_DATA) public data: { message: string }) { }


  close() {
    this.dialogRef.close();
  }


}
