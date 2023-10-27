import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { AuthService } from 'src/app/auth/auth.service';
import { AdminService } from '../../admin.service';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { SuccessComponent } from 'src/app/success/success.component';
import { PageEvent } from '@angular/material/paginator';
import { DialogAdminAddOrganizationComponent } from '../dialog-admin-add-organization/dialog-admin-add-organization.component';
import { DialogAdminAddJobComponent } from '../dialog-admin-add-job/dialog-admin-add-job.component';
import { DialogAdminAddStudyComponent } from '../dialog-admin-add-study/dialog-admin-add-study.component';
import { MatChipInputEvent } from '@angular/material/chips';
import { DialogDeleteAccountComponent } from 'src/app/profile/dialog-delete-account/dialog-delete-account.component';

@Component({
  selector: 'app-user-single-profile',
  templateUrl: './user-single-profile.component.html',
  styleUrls: ['./user-single-profile.component.css']
})
export class UserSingleProfileComponent implements OnInit {

  selectedDiv = 'info';
  userId: any;
  user !: { user_id: any, firstName: string, lastName: string, userName: string, email: string };
  changeUserInfoForm !: FormGroup;


  organizations: { organization_id: any, name: string, description: string }[] = []
  public totalOrganizations = 0; // Total number of categopries
  public pageSizeOrg = 5;
  public currentPageOrg = 0;
  pageSizeOptionsOrg = [1, 3, 5, 10, 15, 20]
  displayedOrganizations: any[] = [];


  public jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string }[] = []
  public totalJobs = 0; // Total number of categopries
  public pageSizeJob = 3;
  public currentPageJob = 0;
  pageSizeOptionsJob = [1, 3, 5, 10, 15, 20];
  displayedJobs: any[] = [];


  public studies: { study_id: any, title: string, school: string, endYear: any }[] = [];
  public totalStudies = 0; // Total number of categopries
  public pageSizeStudy = 3;
  public currentPageStudy = 0;
  pageSizeOptionsStudy = [1, 3, 5, 10, 15, 20];
  displayedStudies: any[] = [];


  abilities: string[] = [];
  abilitiesFormControl = new FormControl(['']);


  interests: string[] = []
  interestFormControl = new FormControl(['']);


  changeEmailForm !: FormGroup;





  constructor(private dialog: MatDialog, private store: Store, private adminService: AdminService, private fb: FormBuilder, private authService: AuthService, public route: ActivatedRoute) { }

  ngOnInit(): void {


    this.route.paramMap.subscribe((paramMap: ParamMap) => {

      this.userId = paramMap.get('userId');


      this.changeUserInfoForm = this.fb.group({
        firstName: [
          '',
          [Validators.required]
        ],

        lastName: [
          '',
          [Validators.required]
        ],

        userName: [
          '',
          [
            Validators.required,
            Validators.pattern('^_[A-Za-z0-9]{2,}$')
          ],
          this.validateUsername.bind(this)
        ]
      });


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



      this.authService.getUserProfile(this.userId).subscribe({
        next: (response) => {
          console.log(response)

          this.user = response.user
          this.changeUserInfoForm.setValue({
            firstName: this.user.firstName,
            lastName: this.user.lastName,
            userName: this.user.userName
          });

          this.changeEmailForm.setValue({
            email: this.user.email
          })


          this.organizations = response.profile.organizations;
          this.totalOrganizations = response.profile.organizations.length;
          this.updateDisplayedOrganizations();


          this.jobs = response.profile.jobs;
          this.totalJobs = response.profile.jobs.length;
          this.updateDisplayedJobs();

          this.studies = response.profile.studies;
          this.totalStudies = response.profile.studies.length;
          this.updateDisplayedStudies();
          console.log(this.jobs);



          this.abilities = response.profile.profileabilities.map(ab => {
            return ab.keyword
          })

          this.interests = response.profile.profileinterests.map(ab => {
            return ab.keyword
          })

        }
      })


    })

  }

  private validateUsername(control: AbstractControl): Promise<ValidationErrors | null> {
    const username = control.value;

    return new Promise((resolve) => {
      this.authService.simpleSearchInternaUserName(username).subscribe(
        (response) => {
          console.log(response);

          if (response.user && (response.user.userName !== this.user.userName)) {
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


          if (response.user && (response.user.email !== this.user.email)) {
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


  onChangeUserInfo() {

    if (this.changeUserInfoForm.invalid) {
      return
    }
    this.store.dispatch(setLoadingAction({ status: true }));

    const userInfoToChange = {
      firstName: this.changeUserInfoForm.value.firstName,
      lastName: this.changeUserInfoForm.value.lastName,
      userName: this.changeUserInfoForm.value.userName
    }


    this.adminService.changeUserInfo(this.user.user_id, userInfoToChange).subscribe({

      next: (response) => {

        this.user.firstName = userInfoToChange.firstName;
        this.user.lastName = userInfoToChange.lastName;
        this.user.userName = userInfoToChange.userName;

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }

        dialogMessageConfig.panelClass = 'success_class';

        this.store.dispatch(setLoadingAction({ status: false }));
        this.dialog.open(SuccessComponent, dialogMessageConfig);



      }


    })


  }


  onPageChangeOrg(event: PageEvent) {
    this.currentPageOrg = event.pageIndex;
    this.pageSizeOrg = event.pageSize;;

    this.updateDisplayedOrganizations();
  }

  updateDisplayedOrganizations() {
    const startIndex = this.currentPageOrg * this.pageSizeOrg;
    const endIndex = startIndex + this.pageSizeOrg;
    this.displayedOrganizations = this.organizations.slice(startIndex, endIndex);
  }



  openDialogForAddingOrganization(mode: string, organization?: { organization_id: any, name: string, description: string }) {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    if (mode === 'create') {
      dialogCreateConfig.data = {
        user: this.user,
        mode: mode
      }
    } else {
      dialogCreateConfig.data = {
        user: this.user,
        organization: organization,
        mode: mode
      }
    }


    const dialogRef = this.dialog.open(DialogAdminAddOrganizationComponent, dialogCreateConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle the data from the dialog here

        console.log(result)

        if (mode === 'create') {
          this.organizations.push(result.organization);
        }
        else {
          const updatedArray = this.organizations.map(org => {
            if (Number(org.organization_id) === Number(organization?.organization_id)) {
              {
                const org = {
                  organization_id: result.organization.organization_id,
                  name: result.organization.name,
                  description: result.organization.description,
                }
                return org;
              }

            }
            return org;
          });

          this.organizations = [...updatedArray];
        }

        this.updateDisplayedOrganizations();

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: result.message
        }

        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });

  }


  deleteOrganization(id: any) {

    const newArray = this.organizations.filter(o => Number(o.organization_id) !== Number(id));

    this.organizations = [...newArray];
    this.updateDisplayedOrganizations();

    this.adminService.deleteOrganization(id).subscribe({
      next: (response) => {

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }

        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    })



  }


  onPageChangeJob(event: PageEvent) {
    this.currentPageJob = event.pageIndex;
    this.pageSizeJob = event.pageSize;;

    this.updateDisplayedJobs();
  }

  updateDisplayedJobs() {
    const startIndex = this.currentPageJob * this.pageSizeJob;
    const endIndex = startIndex + this.pageSizeJob;
    this.displayedJobs = this.jobs.slice(startIndex, endIndex);
  }



  onPageChangeStudy(event: PageEvent) {
    this.currentPageStudy = event.pageIndex;
    this.pageSizeStudy = event.pageSize;;

    this.updateDisplayedStudies();
  }

  updateDisplayedStudies() {
    const startIndex = this.currentPageStudy * this.pageSizeStudy;
    const endIndex = startIndex + this.pageSizeStudy;
    this.displayedStudies = this.studies.slice(startIndex, endIndex);
  }


  openDialogForAddingJob(mode: string, job?: { job_id: any, title: string, company: string, startYear: string, endYear: string }) {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    if (mode === 'create') {
      dialogCreateConfig.data = {
        mode: mode,
        user: this.user,
      }
    } else {
      dialogCreateConfig.data = {
        user: this.user,
        job: job,
        mode: mode
      }
    }

    const dialogRef = this.dialog.open(DialogAdminAddJobComponent, dialogCreateConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {



        if (mode === 'create') {
          this.jobs.push(result.job);
        }
        else {

          console.log(result.job)

          const updatedArray = this.jobs.map(jb => {
            if (Number(jb.job_id) === Number(job?.job_id)) {
              const updatedJob = {
                job_id: result.job.job_id,
                title: result.job.title,
                company: result.job.company,
                startYear: result.job.startYear,
                endYear: result.job.endYear,
              };
              console.log(updatedJob);
              return updatedJob;
            }
            return jb;
          });

          this.jobs = [...updatedArray]
          this.updateDisplayedJobs();

        }



        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: result.message
        }

        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });



  }


  deleteJob(id: string) {

    this.adminService.deleteJob(id).subscribe({
      next: (response) => {


        const newArray = this.jobs.filter(o => Number(o.job_id) !== Number(id));

        this.jobs = [...newArray];
        this.updateDisplayedJobs();

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }

        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    })

  }



  openDialogForAddingStudy(mode: string, study?: { study_id: any, title: string, school: string, endYear: string }) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    if (mode === 'create') {
      dialogCreateConfig.data = {
        mode: mode,
        user: this.user,
      }
    } else {
      dialogCreateConfig.data = {
        user: this.user,
        study: study,
        mode: mode
      }
    }

    const dialogRef = this.dialog.open(DialogAdminAddStudyComponent, dialogCreateConfig);


    dialogRef.afterClosed().subscribe({
      next: (response) => {

        if (response) {



          if (mode === 'create') {

            console.log(response.study)
            this.studies.push(response.study);
            this.updateDisplayedStudies();

          }
          else {


            const updatedArray = this.studies.map(st => {
              if (Number(st.study_id) === Number(study?.study_id)) {
                const updatedStudy = {
                  study_id: response.study.study_id,
                  title: response.study.title,
                  school: response.study.school,
                  endYear: response.study.endYear
                };

                return updatedStudy;
              }
              return st;
            });

            this.studies = [...updatedArray]
            this.updateDisplayedStudies();

          }



          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }

          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);

        }

      }
    })

  }


  deleteStudy(id: string) {

    this.adminService.deleteStudy(id).subscribe({
      next: (response) => {


        const newArray = this.studies.filter(s => Number(s.study_id) !== Number(id));

        this.studies = [...newArray];
        this.updateDisplayedStudies();

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }

        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    })

  }


  removeKeyword(keyword: string) {
    const index = this.abilities.indexOf(keyword);
    if (index >= 0) {
      this.abilities.splice(index, 1);
    }
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.abilities.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  saveAbilities() {



    if (this.abilities.length > 0) {
      this.store.dispatch(setLoadingAction({ status: true }));
      let abilitiesToSend = this.abilities.map(a => {
        return {
          keyword: a
        }
      })


      this.adminService.addAbilities(this.userId, abilitiesToSend).subscribe({
        next: (response) => {

          console.log(response)
          this.abilities = response.abilities.map(ab => {
            return ab.keyword
          });
          this.store.dispatch(setLoadingAction({ status: false }));

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }

          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);

        }
      })
    }


  }


  removeInterest(keyword: string) {
    const index = this.interests.indexOf(keyword);
    if (index >= 0) {
      this.interests.splice(index, 1);
    }
  }

  addInterest(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.interests.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  saveInterests() {

    console.log(this.interests.length)
    if (this.interests.length > 0) {
      this.store.dispatch(setLoadingAction({ status: true }));
      let interestsToSent = this.interests.map(a => {
        return {
          keyword: a
        }
      })
      console.log(interestsToSent)

      this.adminService.addInterests(this.userId, interestsToSent).subscribe({
        next: (response) => {


          this.interests = response.interests.map(ab => {
            return ab.keyword
          });
          this.store.dispatch(setLoadingAction({ status: false }));

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }

          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);

        }
      })
    }

  }


  onChangeEmail() {


    if (this.changeEmailForm.invalid) {
      return;
    }
    this.store.dispatch(setLoadingAction({ status: true }));

    const email = this.changeEmailForm.value.email;


    this.adminService.changeEmail(this.userId, email).subscribe({
      next: (response) => {

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.store.dispatch(setLoadingAction({ status: false }));
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    })

  }


  openDialogForDeleteAccount() {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';


    dialogCreateConfig.data = {
      userData: this.user
    }



    this.dialog.open(DialogDeleteAccountComponent, dialogCreateConfig)




  }
}
