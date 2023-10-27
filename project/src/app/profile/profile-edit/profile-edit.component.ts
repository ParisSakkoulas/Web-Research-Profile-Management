import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { PublicationsService } from 'src/app/publications/publication.service';
import { AddNewOrganizationComponent } from '../add-new-organization/add-new-organization.component';
import { DialogDeleteFromProfileComponent } from '../dialog-delete-from-profile/dialog-delete-from-profile.component';
import { DialogAddProfileJobComponent } from '../dialog-add-profile-job/dialog-add-profile-job.component';
import { MatChipInputEvent } from '@angular/material/chips';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { SuccessComponent } from 'src/app/success/success.component';
import { PageEvent } from '@angular/material/paginator';
import { DialogAddStudyProfileComponent } from '../dialog-add-study-profile/dialog-add-study-profile.component';

@Component({
  selector: 'app-profile-edit',
  templateUrl: './profile-edit.component.html',
  styleUrls: ['./profile-edit.component.css']
})
export class ProfileEditComponent implements OnInit {


  changeUserNameForm !: FormGroup;
  setOrganization !: FormGroup;
  profile_id: any;

  selectedDiv = 'info';

  public totalOrganizations = 0; // Total number of categopries
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [3, 5, 10, 15, 20]
  displayedOrganizations: any[] = [];


  public totalJobs = 0; // Total number of categopries
  public pageSizeJob = 3;
  public currentPageJob = 0;
  pageSizeOptionsJob = [3, 5, 10, 15, 20]
  displayedJobs: any[] = [];
  jobs: { job_id: any, title: string, company: string, startYear: any, endYear: any }[] = [];


  public totalStudies = 0; // Total number of categopries
  public pageSizeStudy = 3;
  public currentPageStudy = 0;
  pageSizeOptionsStudy = [3, 5, 10, 15, 20]
  displayedStudies: any[] = [];
  studies: { study_id: any, title: string, school: string, endYear: any }[] = [];


  organizations: { organization_id: any, name: string, description: string }[] = []




  abilities: string[] = ['Doctor', 'AI Engineering', 'Software'];
  abilitiesFormControl = new FormControl(['']);


  interests: string[] = []
  interestFormControl = new FormControl([''])


  constructor(private store: Store, private dialog: MatDialog, private fb: FormBuilder, public authService: AuthService) { }

  ngOnInit(): void {

    this.changeUserNameForm = this.fb.group({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('', Validators.required),
      userName: new FormControl('', [Validators.required, Validators.pattern('^_[A-Za-z0-9]{2,}$')])
    });

    this.authService.getUserDataProfile().subscribe({
      next: (response) => {
        console.log(response)

        this.profile_id = response.profile.profile_id;

        this.changeUserNameForm.patchValue(
          {
            userName: response.user.userName,
            firstName: response.user.firstName,
            lastName: response.user.lastName,

          })
      }
    })


    //Παίρνουμε όλους του οργανισμούς
    this.authService.getAllOrganizations();
    this.authService.getOrganizationUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.organizations = response
        this.totalOrganizations = response.length;
        this.updateDisplayedOrganizations()
      }
    });


    //Παίρνουμε όλες τις δουλειές
    this.authService.getAllJobs();
    this.authService.getJobsUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.jobs = response
        this.totalJobs = response.length;
        this.updateDisplayedJobs()
      }
    })


    //Παίρνουμε όλες τις δουλειές
    this.authService.getAllStudies();
    this.authService.getStudiesUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.studies = response
        this.totalStudies = response.length;
        this.updateDisplayedStudies();
      }
    })



    //Παίρνουμε όλες τις ικανότητες
    this.authService.getAllAbilities();
    this.authService.getAbilitiesUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.abilities = response.map(ab => {
          return ab.keyword
        })

      }
    })


    //Παίρνουμε όλα τα ενδιαφέροντα
    this.authService.getAllInterests();
    this.authService.getInterestsUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.interests = response.map(inter => {
          return inter.keyword
        })
      }
    })


  }

  onChangeUserName() {

    const user = {
      userName: this.changeUserNameForm.controls['userName'].value,
      firstName: this.changeUserNameForm.controls['firstName'].value,
      lastName: this.changeUserNameForm.controls['lastName'].value
    }

    this.store.dispatch(setLoadingAction({ status: true }));

    this.authService.changeUserProfileData(user).subscribe({
      next: (response) => {
        console.log(response)


        this.changeUserNameForm.patchValue(
          {
            userName: response.user.userName,
            firstName: response.user.firstName,
            lastName: response.user.lastName,

          })

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);



        this.store.dispatch(setLoadingAction({ status: false }));
      }
    })



  }


  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;;

    this.updateDisplayedOrganizations();
  }

  updateDisplayedOrganizations() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedOrganizations = this.organizations.slice(startIndex, endIndex);
  }



  openDialogForAddingOrganization(mode: string, organization?: { organization_id: any, name: string, description: string }) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      mode: mode
    }

    if (mode === 'edit') {
      dialogCreateConfig.data = {
        mode: mode,
        organization: organization
      }
    }

    this.dialog.open(AddNewOrganizationComponent, dialogCreateConfig)


  }


  openDialogForDeleteOrganization(organization?: { organization_id: any, name: string, description: string }) {



    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      delete: 'Organization',
      object: organization
    }

    this.dialog.open(DialogDeleteFromProfileComponent, dialogCreateConfig);


  }


  openDialogForDeleteJob(job: { job_id: any, title: string, company: string, startYear: any, endYear: any }) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      delete: 'Job',
      object: job
    }

    this.dialog.open(DialogDeleteFromProfileComponent, dialogCreateConfig);

  }

  openDialogForAddingNewJob(mode: string, job?: { job_id: any, title: string, company: string, startYear: string, endYear: string }) {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      mode: mode
    }



    if (mode === 'edit') {
      dialogCreateConfig.data = {
        mode: mode,
        job: job
      }
    }



    this.dialog.open(DialogAddProfileJobComponent, dialogCreateConfig)


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

      this.authService.addAbilities(abilitiesToSend);
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

      this.authService.addInterests(interestsToSent);
    }

  }

  getButtonColor(div: string): string {
    return this.selectedDiv === div ? 'accent' : 'primary';
  }

  showDiv(div: string) {

    this.selectedDiv = div;

  }


  onPageChangeJob(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;;

    this.updateDisplayedJobs();
  }

  updateDisplayedJobs() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedJobs = this.jobs.slice(startIndex, endIndex);
  }



  onPageChangeStudy(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;;

    this.updateDisplayedStudies();
  }

  updateDisplayedStudies() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedStudies = this.studies.slice(startIndex, endIndex);
  }

  openDialogForAddingNewStudy(mode: string, study?: { study_id: any, title: string, school: string, endYear: string }) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      mode: mode
    }



    if (mode === 'edit') {
      dialogCreateConfig.data = {
        mode: mode,
        study: study
      }
    }



    this.dialog.open(DialogAddStudyProfileComponent, dialogCreateConfig)



  }

  openDialogForDeleteStudy(study: { study_id: any, title: string, school: string, endYear: string }) {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      delete: 'Study',
      object: study
    }

    this.dialog.open(DialogDeleteFromProfileComponent, dialogCreateConfig);


  }

}
