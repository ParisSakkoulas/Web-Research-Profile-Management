import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { AuthService } from '../auth.service';
import { SuccessComponent } from 'src/app/success/success.component';

@Component({
  selector: 'app-dialog-resent-verification-code',
  templateUrl: './dialog-resent-verification-code.component.html',
  styleUrls: ['./dialog-resent-verification-code.component.css']
})
export class DialogResentVerificationCodeComponent implements OnInit {

  resentTokenForm !: FormGroup;


  constructor(public dialogRef: MatDialogRef<DialogCreateComponent>, private fb: FormBuilder, public authService: AuthService, public dialog: MatDialog, private store: Store) { }


  ngOnInit(): void {

    this.resentTokenForm = this.fb.group({
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


    if (this.resentTokenForm.invalid) {
      return;
    }

    this.authService.resendToken(this.resentTokenForm.value.email).subscribe({
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
