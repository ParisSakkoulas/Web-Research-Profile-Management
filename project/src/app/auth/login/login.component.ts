import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth.service';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogDeleteAccountComponent } from 'src/app/profile/dialog-delete-account/dialog-delete-account.component';
import { DialogResetPasswordComponent } from '../dialog-reset-password/dialog-reset-password.component';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  isLoading = false;
  public showPassword: boolean = false;

  private authStatusSub !: Subscription;

  constructor(private dialog: MatDialog, public authService: AuthService, private store: Store) { }

  ngOnInit(): void {
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(authStatus => {
      this.isLoading = false;
      this.store.dispatch(setLoadingAction({ status: false }));
    })
  }


  onLogin(form: NgForm) {

    if (form.invalid) {
      return;
    }
    this.isLoading = true;
    this.store.dispatch(setLoadingAction({ status: true }));
    this.authService.loginUser(form.value.userName, form.value.password)

  }


  ngOnDestroy(): void {
    this.authStatusSub.unsubscribe();
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  openDialogForResetPassword() {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';



    this.dialog.open(DialogResetPasswordComponent, dialogCreateConfig)



  }

}
