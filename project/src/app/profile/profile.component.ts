import { Component, ElementRef, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { Store } from '@ngrx/store';
import { PublicationsService } from '../publications/publication.service';
import { Subscription } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { ChartConfiguration, ChartData, ChartDataset, ChartOptions, ChartType, Color } from 'chart.js';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogAddProfileJobComponent } from './dialog-add-profile-job/dialog-add-profile-job.component';
import { AddNewOrganizationComponent } from './add-new-organization/add-new-organization.component';
import { DialogAddStudyProfileComponent } from './dialog-add-study-profile/dialog-add-study-profile.component';
import { DialogDeleteFromProfileComponent } from './dialog-delete-from-profile/dialog-delete-from-profile.component';
import { DialogPhotoDeleteComponent } from './dialog-photo-delete/dialog-photo-delete.component';
import { PublicationsPerYear } from '../models/publicationsPerYear';
import { CitationsPerYear } from '../models/citationsPerYear';
import { DialogCvOptionsComponent } from './dialog-cv-options/dialog-cv-options.component';
import { Router } from '@angular/router';
import { SuccessComponent } from '../success/success.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {


  public profileLoading = true;


  imagePath !: string;
  public profileId: any;
  selectedDiv = 'info';



  selectedDivStat = 'publicationsPerYearStats';

  selectedDivNetwork = 'Cooperations'





  //user data
  profile_id: any;
  userData !: { userName: string, firstName: string, lastName: string, email: string };

  //organizations
  organizations: { organization_id: any, name: string, description: string }[] = []
  public totalOrganizations = 0; // Total number of categopries
  public pageSizeOrg = 5;
  public currentPageOrg = 0;
  pageSizeOptionsOrg = [3, 5, 10, 15, 20]
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






  //Publications
  public myPublications !: { publication_id: any, title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, notes: string }[];
  private myPublicationSubscription !: Subscription;

  //Για paginator και filtering
  public myTotalPublications = 0;
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [1, 3, 5, 10, 15, 20];
  displayedPublications: any[] = [];
  filterValue!: string;

  abilities: string[] = [];
  interests: string[] = []


  //Photo upload
  uploadedImageSrc: string | ArrayBuffer | null = null;;


  //stats
  public rating3 = 0;



  //Optical stats Publications
  public profileStats !: {
    followers: any,
    following: any,
    citation: any,
    hIndex: number,
    i_10index: number,
    num_of_citations: number,
    citationsPerYear: CitationsPerYear;
    num_of_profile_views: number,
    rating: number,
    total_publications: number,
    publicationsPerYear: PublicationsPerYear;
  }

  public barChartOptions: any = {
    scales: {
      y: {
        ticks: {
          stepSize: 1, // Set the step size between ticks
          beginAtZero: true // Start the axis from zero
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  }
  public barChartLabels: string[] = [];
  public barChartType = 'barChartType';
  public barChartLegend = true;
  public barChartDataToSet: { labels: string[], datasets: { data: number[], label: string }[] } = { labels: [], datasets: [] };



  public barChartOptionsCitation: any = {
    scales: {
      y: {
        ticks: {
          stepSize: 1, // Set the step size between ticks
          beginAtZero: true // Start the axis from zero
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  }
  public barChartLabelsCitation: string[] = [];
  public barChartTypeCitation = 'barChartType';
  public barChartLegendCitation = true;
  public barChartDataToSetCitation: { labels: string[], datasets: { data: number[], label: string }[] } = { labels: [], datasets: [] };




  //για το network


  //για το paginator το παραπάνω πινάκων
  public usersNetworkCooperations: { user_id: any, firstName: string, lastName: string, email: string }[] = [];
  public totalCooperations = 0; // Total number of categopries
  public pageSizeCooperations = 5;
  public currentPageCooperations = 0;
  pageSizeOptionsCooperations = [3, 5, 10, 15, 20]
  displayedCooperations: any[] = [];


  //για το paginator το παραπάνω πινάκων
  public usersNetworkReferences: { user_id: any, firstName: string, lastName: string, email: string }[] = [];
  public totalRef = 0; // Total number of categopries
  public pageSizeRef = 5;
  public currentPageRef = 0;
  pageSizeOptionsRef = [3, 5, 10, 15, 20]
  displayedRef: any[] = [];


  //για το paginator το παραπάνω πινάκων
  public usersNetworkTopCooperations: { user_id: any, firstName: string, lastName: string, email: string }[] = [];
  public totalTopCoop = 0; // Total number of categopries
  public pageSizeTopCoop = 5;
  public currentPageTopCoop = 0;
  pageSizeOptionsTopCoop = [3, 5, 10, 15, 20]
  displayedTopCoop: any[] = [];


  //για το paginator το παραπάνω πινάκων
  public usersnetworkTopReferences: { user_id: any, firstName: string, lastName: string, email: string }[] = [];
  public totalTopRef = 0; // Total number of categopries
  public pageSizeTopRef = 5;
  public currentPageTopRef = 0;
  pageSizeOptionsTopRef = [3, 5, 10, 15, 20]
  displayedTopRef: any[] = [];


  public currentUser!: { user_id: any, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };

  public currentUserFollowers: any[] = [];
  public currentUserFollowings: any[] = [];

  public totalFollowings = 0; // Total number of categopries
  public pageSizeFollowings = 5;
  public currentPageFollowings = 0;
  public pageSizeOptionsFollowings = [0, 2, 5, 10, 15]
  displayedFollowings: any[] = [];


  public totalFollowers = 0; // Total number of categopries
  public pageSizeFollowers = 5;
  public currentPageFollowers = 0;
  public pageSizeOptionsFollowers = [0, 2, 5, 10, 15]
  displayedFollowers: any[] = [];


  public endorsements: { endorse_id: any, endorsement: string, evidence: string, createdAt: Date, userCreator: { user_id: any, firstName: string, lastName: string, email: string, userName: string } }[] = []
  public totalEndorsements = 0;
  public pageSizeEndorsements = 5;
  public currentPageEndorsements = 0;
  public pageSizeOptionsEndorsements = [0, 2, 5, 10, 15]
  displayedEndorsements: any[] = [];

  public endorsementsCreated: { endorse_id: any, endorsement: string, evidence: string, createdAt: Date, userCreator: { user_id: any, firstName: string, lastName: string, email: string, userName: string } }[] = []
  public totalEndorsementsCreated = 0;
  public pageSizeEndorsementsCreated = 5;
  public currentPageEndorsementsCreated = 0;
  public pageSizeOptionsEndorsementsCreated = [0, 2, 5, 10, 15]
  displayedEndorsementsCreated: any[] = [];

  selectedOption: string = 'publicationsPerYearStats';

  public photoLoading = false;
  public infoLoading = false;


  selectedValueEndorsement = 'Received';



  constructor(private el: ElementRef, private router: Router, private dialog: MatDialog, public authService: AuthService, private store: Store, public publicationService: PublicationsService) { }

  ngOnInit(): void {




    this.scrollToView();






    this.authService.getPhotoProfile();
    this.photoLoading = true;
    this.authService.getPhotoProfileUpdateListener().subscribe({
      next: (response) => {

        this.photoLoading = false;
        console.log(response)

        this.uploadedImageSrc = response;
        this.profileLoading = false;

      }
    });
    this.currentUser = this.authService.getUser();





    //GET FOLLOWERS AND FOLLOWINGS OF THE current user
    this.infoLoading = true;
    this.authService.getUserFollowingsForProfile(String(this.currentUser.user_id)).subscribe({
      next: (response) => {
        const followings = response.following.map(following => ({
          email: following.email,
          firstName: following.firstName,
          lastName: following.lastName,
          userName: following.userName,
          user_id: following.user_id,
        }));
        this.currentUserFollowings = followings;
        this.totalFollowings = followings.length;
        this.infoLoading = false;

        this.updateDisplayedFollowings();

      }
    })


    this.infoLoading = true;
    this.authService.getEndorsements(this.currentUser.user_id).subscribe({

      next: (value) => {

        console.log(value)

        this.endorsements = value.endorsements;
        this.totalEndorsements = this.endorsements.length;
        this.updateDisplayedEndorsements();

        this.endorsementsCreated = value.endorsementsCreated;
        this.totalEndorsementsCreated = this.endorsementsCreated.length;
        this.updateDisplayedEndorsementsCreated();
        this.infoLoading = false;

      }
    })

    this.infoLoading = true;
    this.authService.getUserFollowerForProfile(String(this.currentUser.user_id)).subscribe({

      next: (response) => {

        const followers = response.followers.map(follower => ({
          email: follower.email,
          firstName: follower.firstName,
          lastName: follower.lastName,
          userName: follower.userName,
          user_id: follower.user_id,
          following: !!this.currentUserFollowings.find(user => user.user_id === follower.user_id)

        }));
        this.currentUserFollowers = followers;
        this.totalFollowers = followers.length;

        this.updateDisplayedFollowers()
        this.infoLoading = false;


      }

    })



    this.infoLoading = true;
    this.authService.getUserDataProfile().subscribe({
      next: (response) => {
        console.log("user data profiel+", response)

        this.profile_id = response.profile.profile_id;
        this.profileId = response.profile.profile_id;
        this.profileLoading = false;
        this.infoLoading = false;


        this.authService.getSingleRating(response.user.user_id).subscribe({
          next: (value) => {

            console.log(value)
            this.rating3 = value.rate
            this.infoLoading = false;


          }
        })


        this.authService.getUserNetwork(response.user.user_id).subscribe({
          next: (response) => {


            console.log(response)

            this.usersNetworkCooperations = response.networkCooperations;
            this.totalCooperations = response.networkCooperations.length;
            this.updateDisplayedUserCooperations();

            this.usersNetworkReferences = response.networkReferences;
            this.totalRef = response.networkReferences.length;
            this.updateDisplayedRef();

            this.usersNetworkTopCooperations = response.networkTopCooperations;
            this.totalTopCoop = response.networkTopCooperations.length;
            this.updateDisplayedTopCoop()

            this.usersnetworkTopReferences = response.networkTopReferences;
            this.totalTopRef = response.networkTopReferences.length;
            this.updateDisplayedTopRef();

          }
        });


        this.userData = {
          userName: response.user.userName,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          email: response.user.email
        }

        this.profileStats = response.profile.profileStat;
        console.log("Stats", this.profileStats)


        //publications per year stats
        console.log(this.profileStats.citationsPerYear)


        //Αρχικοποίηση πινάκων
        const publicationsData = [];
        const labels = [];

        for (const year in this.profileStats.publicationsPerYear) {
          if (this.profileStats.publicationsPerYear.hasOwnProperty(year)) {
            const publications = this.profileStats.publicationsPerYear[year];

            if (year === 'null') {
              labels.push('No Year');
            } else {
              labels.push(year);
            }

            publicationsData.push(publications);
          }
        }
        const datasets = [{
          data: publicationsData,
          label: 'Publications per Year',
        }];
        this.barChartDataToSet.labels = labels;
        this.barChartDataToSet.datasets = datasets;



        //Αρχικοποίηση πινάκων
        const citationData = [];
        const labelsCite = [];
        for (const year in this.profileStats.citationsPerYear) {
          if (this.profileStats.citationsPerYear.hasOwnProperty(year)) {
            const citations = this.profileStats.citationsPerYear[year];

            if (year === 'null') {
              labelsCite.push('No Year');
            } else {
              labelsCite.push(year);
            }

            citationData.push(citations);
          }
        }

        const datasetsCitation = [{
          data: citationData,
          label: 'Citation per Year',
        }];

        this.barChartDataToSetCitation.labels = labelsCite;
        this.barChartDataToSetCitation.datasets = datasetsCitation;
        this.profileLoading = false;


      }
    })


    //Παίρνουμε όλους του οργανισμούς
    this.authService.getAllOrganizations();
    this.authService.getOrganizationUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.organizations = response
        this.totalOrganizations = response.length;
        this.updateDisplayedOrganizations();
        this.profileLoading = false;

      }
    });


    //Παίρνουμε όλες τις δουλειές
    this.authService.getAllJobs();
    this.authService.getJobsUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.jobs = response
        this.totalJobs = response.length;
        this.updateDisplayedJobs();
        this.profileLoading = false;

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
        this.profileLoading = false;

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
        this.profileLoading = false;

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
        this.profileLoading = false;

      }
    })


    this.infoLoading = true;
    this.publicationService.getAllMyPublications();

    this.myPublicationSubscription = this.publicationService.getMyPublicationsUpdateListener().subscribe({


      next: (response) => {

        this.myPublications = response;
        console.log(this.myPublications)
        this.myTotalPublications = response.length;
        this.updateDisplayedPublications();
        this.profileLoading = false;
        this.infoLoading = false;
      }
    })







  }


  showDiv(div: string) {

    this.selectedDiv = div;

  }





  getButtonColor(div: string): string {
    return this.selectedDiv === div ? 'accent' : 'primary';
  }


  updateDisplayedPublications() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.myPublications) {
      this.displayedPublications = this.myPublications.slice(startIndex, endIndex);
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedPublications();
  }


  applyFilterNew() {

    this.displayedPublications = this.myPublications.filter(publication => {
      // Filter by title

      const lowerCaseTitle = publication.title.toLowerCase();
      if (this.filterValue && !lowerCaseTitle.includes(this.filterValue.toLowerCase())) {
        return false; // Exclude publications that don't match the entered title
      }
      return true;
    })

  }



  onPageChangeOrg(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;;

    this.updateDisplayedOrganizations();
  }

  updateDisplayedOrganizations() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedOrganizations = this.organizations.slice(startIndex, endIndex);
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


  onPhotoSelected(event: any): void {

    const file: File = event.target.files[0];

    if (file) {

      console.log(file)

      this.authService.uploadPhotoProfile(file);

    }

    else {


    }

  }
  deleteProfilePhoto() {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    this.dialog.open(DialogPhotoDeleteComponent, dialogCreateConfig);


  }




  showDivStat(div: string) {


    console.log(this.selectedDivStat)

    if (div === 'publicationsPerYearStats') {
      // Logic for "Publications Per Year"
      this.selectedDivStat = div;
      // Call your method or update your view accordingly
    } else if (div === 'citationsPerYear') {
      // Logic for "Option 2"
      this.selectedDivStat = div;
      // Call your method or update your view accordingly
    }

  }

  getButtonColorStat(div: string): string {
    return this.selectedDivStat === div ? 'accent' : 'primary';
  }



  exportCVdialog() {


    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      user: this.userData,
      profielId: this.profileId,
    }

    this.dialog.open(DialogCvOptionsComponent, dialogCreateConfig);


  }


  getButtonColorNetwork(div: string) {
    return this.selectedDivNetwork === div ? 'accent' : 'primary';
  }


  showDivNetwork(div: string) {
    this.selectedDivNetwork = div;
  }


  updateDisplayedUserCooperations() {
    const startIndex = this.currentPageCooperations * this.pageSizeCooperations;
    const endIndex = startIndex + this.pageSizeCooperations;
    this.displayedCooperations = this.usersNetworkCooperations.slice(startIndex, endIndex);
  }

  onPageChangeCooperations(event: PageEvent) {
    this.currentPageCooperations = event.pageIndex;
    this.pageSizeCooperations = event.pageSize;
    this.updateDisplayedUserCooperations();
  }



  updateDisplayedRef() {
    const startIndex = this.currentPageRef * this.pageSizeRef;
    const endIndex = startIndex + this.pageSizeRef;
    this.displayedRef = this.usersNetworkReferences.slice(startIndex, endIndex);
  }

  onPageChangeRef(event: PageEvent) {
    this.currentPageRef = event.pageIndex;
    this.pageSizeRef = event.pageSize;
    this.updateDisplayedRef();
  }






  updateDisplayedTopCoop() {
    const startIndex = this.currentPageTopCoop * this.pageSizeTopCoop;
    const endIndex = startIndex + this.pageSizeTopCoop;
    this.displayedTopCoop = this.usersNetworkTopCooperations.slice(startIndex, endIndex);
  }
  onPageChangeTopCoop(event: PageEvent) {
    this.currentPageTopCoop = event.pageIndex;
    this.pageSizeTopCoop = event.pageSize;
    this.updateDisplayedTopCoop();
  }


  updateDisplayedTopRef() {
    const startIndex = this.currentPageTopRef * this.pageSizeTopRef;
    const endIndex = startIndex + this.pageSizeTopRef;
    this.displayedTopRef = this.usersnetworkTopReferences.slice(startIndex, endIndex);
  }
  onPageChangeTopRef(event: PageEvent) {
    this.currentPageTopRef = event.pageIndex;
    this.pageSizeTopRef = event.pageSize;
    this.updateDisplayedTopRef();
  }



  navigateToUser(userId: any) {


    this.router.navigateByUrl('profile/user-profile/' + userId);

  }

  scrollToView() {


    const element = this.el.nativeElement.querySelector('#bodyUserProfileId');

    console.log("ELEMENT", element)


    if (element) {

      console.log("header id")

      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    }


  }


  viewUserProfie(userId: any) {


    this.router.navigateByUrl('profile/user-profile/' + userId);

  }


  unfollowUser(user: { user_id: any, userName: string, firstName: string, lastName: string, email: string }) {

    this.currentUserFollowings = this.currentUserFollowings.filter(followingUser => Number(followingUser.user_id) !== Number(user.user_id));
    this.authService.unfollowUser(user.user_id);
    this.updateDisplayedFollowings();

  }


  followSpecificUser(user: { user_id: any, userName: string, firstName: string, lastName: string, email: string }) {


    //να γινει unfollow

    if (this.currentUserFollowings.find(followingUser => Number(followingUser.user_id) === Number(user.user_id))) {
      console.log("BEFORE UNFOLLOW currentUserFollowers", this.currentUserFollowers)
      this.currentUserFollowings = this.currentUserFollowings.filter(followingUser => Number(followingUser.user_id) !== Number(user.user_id));
      this.authService.unfollowUser(user.user_id);

      const currentData = this.currentUserFollowers;
      const indexToUpdate = currentData.findIndex(item => item.user_id === user.user_id);

      const newValueUser = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        following: false

      }

      if (indexToUpdate !== -1) {
        const updatedValue = { ...currentData[indexToUpdate], ...newValueUser };
        const updatedData = [...currentData];
        updatedData[indexToUpdate] = updatedValue;

        this.currentUserFollowers = updatedData;

      }
      this.updateDisplayedFollowings();
      this.updateDisplayedFollowers();


      console.log("after UNFOLLOW currentUserFollowers", this.currentUserFollowers);


    }



    //να γινει follow
    else {

      console.log("before FOLLOW currentUserFollowers", this.currentUserFollowers)
      const newUserToADD = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
      this.currentUserFollowings.push(newUserToADD);
      this.authService.followUser(user.user_id);

      const currentData = this.currentUserFollowers;
      const indexToUpdate = currentData.findIndex(item => item.user_id === user.user_id);

      const newValueUser = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        following: true

      }

      if (indexToUpdate !== -1) {
        const updatedValue = { ...currentData[indexToUpdate], ...newValueUser };
        const updatedData = [...currentData];
        updatedData[indexToUpdate] = updatedValue;

        this.currentUserFollowers = updatedData;

      }
      this.updateDisplayedFollowings();
      this.updateDisplayedFollowers();

    }

  }



  onPageChangeFollowers(event: PageEvent) {
    this.currentPageFollowers = event.pageIndex;
    this.pageSizeFollowers = event.pageSize;

    this.updateDisplayedFollowers();
  }

  updateDisplayedFollowers() {
    const startIndex = this.currentPageFollowers * this.pageSizeFollowers;
    const endIndex = startIndex + this.pageSizeFollowers;
    this.displayedFollowers = this.currentUserFollowers.slice(startIndex, endIndex);
  }




  onPageChangeFollowings(event: PageEvent) {
    this.currentPageFollowings = event.pageIndex;
    this.pageSizeFollowings = event.pageSize;

    this.updateDisplayedFollowings();
  }

  updateDisplayedFollowings() {
    const startIndex = this.currentPageFollowings * this.pageSizeFollowings;
    const endIndex = startIndex + this.pageSizeFollowings;
    this.displayedFollowings = this.currentUserFollowings.slice(startIndex, endIndex);
  }


  onPageChangeEndorsements(event: PageEvent) {
    this.currentPageEndorsements = event.pageIndex;
    this.pageSizeEndorsements = event.pageSize;

    this.updateDisplayedEndorsements();
  }

  updateDisplayedEndorsements() {
    const startIndex = this.currentPageEndorsements * this.pageSizeEndorsements;
    const endIndex = startIndex + this.pageSizeEndorsements;
    this.displayedEndorsements = this.endorsements.slice(startIndex, endIndex);
  }


  onPageChangeEndorsementsCreated(event: PageEvent) {
    this.currentPageEndorsementsCreated = event.pageIndex;
    this.pageSizeEndorsementsCreated = event.pageSize;

    this.updateDisplayedEndorsementsCreated();
  }

  updateDisplayedEndorsementsCreated() {
    const startIndex = this.currentPageEndorsementsCreated * this.pageSizeEndorsementsCreated;
    const endIndex = startIndex + this.pageSizeEndorsementsCreated;
    this.displayedEndorsementsCreated = this.endorsementsCreated.slice(startIndex, endIndex);
  }


  deleteEndorsement(id: any) {

    this.authService.deleteSingleEndorsement(id).subscribe({
      next: (response) => {


        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);

        this.endorsements = this.endorsements.filter(e => Number(e.endorse_id) !== Number(id));

        this.updateDisplayedEndorsements();


      }
    })

  }



  ngOnDestroy() {

    this.myPublicationSubscription.unsubscribe()

  }

}


