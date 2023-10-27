import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { AddNewOrganizationComponent } from '../add-new-organization/add-new-organization.component';
import { DialogDeleteAccountComponent } from '../dialog-delete-account/dialog-delete-account.component';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { SuccessComponent } from 'src/app/success/success.component';

@Component({
  selector: 'app-profile-settings',
  templateUrl: './profile-settings.component.html',
  styleUrls: ['./profile-settings.component.css']
})
export class ProfileSettingsComponent implements OnInit {

  selectedDiv = 'info';
  passwordMatch !: FormGroup;
  public passwordChecking = false;
  public showPassword: boolean = false;


  changePasswordForm !: FormGroup;


  changeEmailForm !: FormGroup;



  public userDataC !: null | { user_id: any, userRole: string | null, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };


  constructor(private store: Store, private fb: FormBuilder, private router: Router, private dialog: MatDialog, public authService: AuthService) { }

  ngOnInit(): void {



    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης
    this.changePasswordForm = this.fb.group({
      oldPassword: [
        '',
        [
          Validators.required
        ]
      ],

      newPassword: [
        '',
        [
          Validators.required,
          Validators.pattern('^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8,}$')
        ]
      ],

      validateNewPassword: [
        '',
        [
          Validators.required
        ]
      ]
    }, {
      validators: [this.passwordMatchValidator('newPassword', 'validateNewPassword')]
    })

    this.passwordMatch = this.fb.group({
      searchTerm: [
        '',
        [
          Validators.required
        ],
        this.validatePassword.bind(this)
      ]
    })


    this.changeEmailForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ],
        this.validateEmail.bind(this)
      ]

    })

    this.userDataC = this.authService.getUserDataC();
    this.authService.getUserDataListener().subscribe({
      next: (response) => {
        this.userDataC = response
      }
    })


    console.log(this.userDataC)
  }



  //Password validation
  private validatePassword(control: AbstractControl): Promise<ValidationErrors | null> {
    const password = control.value;

    this.passwordChecking = true;

    console.log(password);
    control.setErrors({ passwordNotSame: true });
    return new Promise((resolve) => {
      this.authService.checkUserPassword(password).subscribe(
        (response) => {
          if (response.message === 'Dif') {
            console.log("password different");
            this.passwordChecking = false;
            control.setErrors({ passwordNotSame: true });
            setTimeout(() => {
              resolve({ passwordNotSame: true });
            }, 4000); // Delay for 1 second (1000 milliseconds)
          } else {
            console.log("password same");
            control.setErrors(null);
            resolve(null);
            this.passwordChecking = false;

          }
        },
        (error) => {
          resolve({ serverError: true }); // Handle server error

          this.passwordChecking = false;

        }
      );
    });
  }


  /*
   Δημιουργία συνάρτησης για την εφαρμογή δικού μας validator στα controls password και confirmPassword.
   Στην ουσία ελέγχουμε αν οι τιμές των δυο inputs είναι ίδιες. Αρχικά παίρνουμε την τιμή του password έπειτα την
   τιμή του confirmPassword. Μετά κάνουμε κάποιους ελέγχους, ο πρώτος ελέγχει αν υπάρχει κάποιο λάθος στο κοντρολ
   και ο δεύτερος έλεγχος αφορά το ταίριασμα των κωδικών. Δηλαδή αν το value του  passwordControl ισούται με το
   value του confirmPassword

 */
  passwordMatchValidator(password: any, confirmPassword: any) {

    return (formGroup: FormGroup) => {

      const passwordControl = formGroup.controls[password];

      const confirmPasswordControl = formGroup.controls[confirmPassword];

      if (confirmPasswordControl.errors && !confirmPasswordControl.errors['passwordMatch']) {
        return;
      }

      if (passwordControl.value !== confirmPasswordControl.value) {

        confirmPasswordControl.setErrors({ MustMatch: true })

      }
      else {
        confirmPasswordControl.setErrors(null)
      }

    }

  }

  private validateEmail(control: AbstractControl): Promise<ValidationErrors | null> {
    const email = control.value;

    return new Promise((resolve) => {
      this.authService.simpleSearchInternalEmail(email).subscribe(
        (response) => {


          if (response.user) {
            console.log("email taken");
            control.setErrors({ emailTaken: true })
            resolve({ emailTaken: true });
          }
          else {
            console.log("userName free")
            control.setErrors(null)
            resolve(null);
          }


        },
        (error) => {
          resolve({ serverError: true }); // Handle server error
        }
      );
    });



  }



  getButtonColor(div: string): string {
    return this.selectedDiv === div ? 'accent' : 'primary';
  }

  showDiv(div: string) {

    this.selectedDiv = div;

  }


  openDialogForDeleteAccount() {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';


    dialogCreateConfig.data = {
      userData: this.userDataC
    }



    this.dialog.open(DialogDeleteAccountComponent, dialogCreateConfig)



  }


  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  onChangePassword() {

    if (this.changePasswordForm.invalid) {
      return;
    }

    this.store.dispatch(setLoadingAction({ status: true }));




    const passwordObj = {
      oldPassword: this.changePasswordForm.value.oldPassword,
      newPassword: this.changePasswordForm.value.newPassword,
    }


    this.authService.changePassword(passwordObj).subscribe({
      next: (response) => {

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        this.changePasswordForm.reset();
        dialogMessageConfig.panelClass = 'success_class';



        this.store.dispatch(setLoadingAction({ status: false }));
        this.dialog.open(SuccessComponent, dialogMessageConfig);
        this.authService.logOut();
      }
    })


  }


  onChangeEmail() {


    if (this.changeEmailForm.invalid) {
      return;
    }
    this.store.dispatch(setLoadingAction({ status: true }));

    const email = this.changeEmailForm.value.email;


    this.authService.changeEmail(email).subscribe({
      next: (response) => {

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        this.changePasswordForm.reset();
        dialogMessageConfig.panelClass = 'success_class';
        this.changeEmailForm.reset();
        this.changeEmailForm.markAsUntouched();
        this.store.dispatch(setLoadingAction({ status: false }));
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    })

  }

}
