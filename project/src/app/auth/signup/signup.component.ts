import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, map } from 'rxjs';
import { AuthData } from '../auth.data';
import { AuthService } from '../auth.service';
import { SuccessComponent } from 'src/app/success/success.component';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';



@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit, OnDestroy {

  signUpForm !: FormGroup;
  isLoading = false;
  public showPassword: boolean = false;
  private authStatusSub!: Subscription;


  private messageSub!: Subscription;
  public message !: string;
  public messageSent = false;


  public liveUserNameFromDb: string[] = []
  private searchInternalUserNames = new Subject<string>();
  public userNameExists = false;

  constructor(private fb: FormBuilder, public authService: AuthService, public dialog: MatDialog, private store: Store) { }






  ngOnInit() {



    //κάνουμε subscribe στο subject που μας επιστρέφει η  getAuthStatusListener έτσι ώστε να βλέπουμε την κατάσταση τησ σύνδεσης του χρήστη.
    // Αποθηκεύουμε το subscription στην authStatusSub για να κάνουμε unsubscribe μετά
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(authStatus => {
      this.isLoading = false
      this.store.dispatch(setLoadingAction({ status: false }));
    });


    // Κάνουμε subscribe στο subject που μας επιστρέφει η  getmessageSuccessListener έτσι ώστε να βλέπουμε το αποτέλεσμα της εγγραφής του χρήστη.
    // Σε περίπτωση επιτυχίας παίρνουμε το μήνυμα και το ανοίγουμε στον dialog με το Success Component
    this.messageSub = this.authService.getmessageSuccessListener().subscribe({

      next: (result) => {
        this.message = result.message;
        this.messageSent = result.sent;
        this.isLoading = false
        const dialogSuccessConfig = new MatDialogConfig();
        dialogSuccessConfig.data = {
          message: result.message
        }
        dialogSuccessConfig.width = '590px';
        dialogSuccessConfig.height = '250px'
        dialogSuccessConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogSuccessConfig)
        this.store.dispatch(setLoadingAction({ status: false }));
      }
    })


    this.signUpForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ],
        this.validateEmail.bind(this)
      ],
      userName: [
        '',
        [
          Validators.required,
          Validators.pattern('^_[A-Za-z0-9]{2,}$')
        ],
        this.validateUsername.bind(this)
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern('^(?=.*[A-Z].*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*[0-9])(?=.*[a-z].*[a-z].*[a-z]).{8,}$')
        ]
      ],
      confirmPassword: [
        '',
        [
          Validators.required,
          Validators.minLength(8)
        ]
      ]
    }, {
      validators: [this.passwordMatchValidator('password', 'confirmPassword')]
    });





  }



  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }


  onSignUp() {

    if (this.signUpForm.invalid) {
      return;
    }
    this.isLoading = true;
    this.store.dispatch(setLoadingAction({ status: true }));
    const newUser: AuthData = {
      firstName: this.signUpForm.value.firstName,
      lastName: this.signUpForm.value.lastName,
      email: this.signUpForm.value.email,
      userName: this.signUpForm.value.userName,
      password: this.signUpForm.value.password,
    }

    this.signUpForm.reset();
    this.authService.createNewUser(newUser);

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



  private validateUsername(control: AbstractControl): Promise<ValidationErrors | null> {
    const username = control.value;

    return new Promise((resolve) => {
      this.authService.simpleSearchInternaUserName(username).subscribe(
        (response) => {
          console.log(response);

          if (response.user) {
            console.log("userName taken");
            control.setErrors({ usernameTaken: true }); // Set the custom error
            resolve({ usernameTaken: true }); // Validation error, username taken
          } else {
            console.log("userName free");
            control.setErrors(null); // Clear the custom error
            resolve(null); // No validation error, username available
          }
        },
        (error) => {
          resolve({ serverError: true }); // Handle server error
        }
      );
    });
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


  sendDataToCheckUserName(event: any) {

    let query: string = event.target.value.trim();




    if (query.length === 0) {

      this.liveUserNameFromDb = [];
      return;
    }

    if (this.signUpForm.controls['userName'].invalid) {
      return;
    }

    console.log(query);

    //this.store.dispatch(setLoadingAction({ status: true }));
    this.searchInternalUserNames.next(query);



  }



  ngOnDestroy() {

    this.authStatusSub.unsubscribe();
    this.messageSub.unsubscribe()
  }







}
