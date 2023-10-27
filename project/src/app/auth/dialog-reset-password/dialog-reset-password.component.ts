import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from '../auth.service';
import { SuccessComponent } from 'src/app/success/success.component';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';

@Component({
  selector: 'app-dialog-reset-password',
  templateUrl: './dialog-reset-password.component.html',
  styleUrls: ['./dialog-reset-password.component.css']
})
export class DialogResetPasswordComponent implements OnInit {


  resetPasswordForm !: FormGroup;


  constructor(public dialogRef: MatDialogRef<DialogCreateComponent>, private fb: FormBuilder, public authService: AuthService, public dialog: MatDialog, private store: Store) { }

  ngOnInit(): void {


    this.resetPasswordForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ],
      ]
    })
  }


  onReset() {


    if (this.resetPasswordForm.invalid) {
      return;
    }

    this.authService.resetPassword(this.resetPasswordForm.value.email).subscribe({
      next: (response) => {

        this.dialogRef.close();
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    })

  }


  closeMatDialog() {
    this.dialogRef.close();

  }

}
