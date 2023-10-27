import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';

@Component({
  selector: 'app-dialog-delete-account',
  templateUrl: './dialog-delete-account.component.html',
  styleUrls: ['./dialog-delete-account.component.css']
})
export class DialogDeleteAccountComponent implements OnInit {


  public userDataC !: null | { user_id: any, userRole: string | null, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };


  constructor(private authService: AuthService, private fb: FormBuilder, public dialogRef: MatDialogRef<DialogCreateComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {


    this.userDataC = data.userData;

  }

  ngOnInit(): void {

    console.log(this.userDataC)
  }



  deleteAccount() {

    this.authService.deleteAccount(this.userDataC?.user_id);
    this.dialogRef.close();

  }

  closeMatDialog() {
    this.dialogRef.close()

  }

}
