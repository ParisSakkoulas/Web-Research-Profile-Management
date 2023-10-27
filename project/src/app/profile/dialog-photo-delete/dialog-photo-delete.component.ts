import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';

@Component({
  selector: 'app-dialog-photo-delete',
  templateUrl: './dialog-photo-delete.component.html',
  styleUrls: ['./dialog-photo-delete.component.css']
})
export class DialogPhotoDeleteComponent implements OnInit {

  constructor(public authService: AuthService, public dialogRef: MatDialogRef<DialogCreateComponent>) { }

  ngOnInit(): void {
  }


  deletePhotoProfile() {

    this.authService.removePhotoProfile();
    this.dialogRef.close();

  }

  closeMatDialog() {
    this.dialogRef.close();
  }

}
