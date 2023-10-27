import { ViewportScroller } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, ParamMap } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/auth/user.model';
import { CitationsPerYear } from 'src/app/models/citationsPerYear';
import { PublicationsPerYear } from 'src/app/models/publicationsPerYear';
import { PublicationsService } from 'src/app/publications/publication.service';
import { DialogCreateEndorsementComponent } from '../dialog-create-endorsement/dialog-create-endorsement.component';


type UserDataType = {
  user_id: any;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  following?: boolean;
};

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit, OnDestroy {

  private userId: any;
  selectedDiv = 'info';

  public userIsAuthenticated = false;
  public currentUser!: { user_id: any, firstName: string | null, lastName: string | null, userName: string | null, email: string | null, userRole: string | null };


  //Photo of user
  uploadedImageSrc: string | ArrayBuffer | null = null;
  selectedDivStat = 'publicationsPerYearStats';
  //Optical stats Publications
  public profileStats !: {
    followers: any,
    following: any,
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



  public avgRating = 0;
  public myRating = 0;
  public rating3 = 0;





  public publications!: { publication_id: any, title: string, section: string, abstract: string, accessibility: string, doi: string, isbn: string, notes: string, year: string }[];
  //Για paginator και filtering
  public myTotalPublications = 0;
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [1, 3, 5, 10, 15, 20];
  displayedPublications: any[] = [];
  filterValue!: string;
  public userData !: { user_id: any, userName: string, email: string, firstName: string, lastName: string }

  public studies: { study_id: any, title: string, school: string, endYear: any }[] = [];
  public totalStudies = 0; // Total number of categopries
  public pageSizeStudy = 3;
  public currentPageStudy = 0;
  pageSizeOptionsStudy = [1, 3, 5, 10, 15, 20];
  displayedStudies: any[] = [];

  public organizations: { organization_id: any, name: string, description: string }[] = [];
  public totalOrganizations = 0; // Total number of categopries
  public pageSizeOrg = 5;
  public currentPageOrg = 0;
  pageSizeOptionsOrg = [1, 3, 5, 10, 15, 20];
  displayedOrganizations: any[] = [];

  public jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string }[] = []
  public totalJobs = 0; // Total number of categopries
  public pageSizeJob = 3;
  public currentPageJob = 0;
  pageSizeOptionsJob = [1, 3, 5, 10, 15, 20];
  displayedJobs: any[] = [];


  selectedDivNetwork = 'Cooperations'
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


  public abilities: { ability_id: any, keyword: string }[] = [];
  public interests: { interest_id: any, keyword: string }[] = [];


  public currentUserFollowers: any[] = [];
  public currentUserFollowings: any[] = [];


  public profileFollowers: any[] = [];
  public profileFollowings: any[] = [];
  private profileFollowingsSubscription !: Subscription;
  private currentUserFollowingsSubscription !: Subscription;

  public userDataC !: null | { user_id: any, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };


  public profileFollowing !: boolean;

  private paramMapSubscription!: Subscription;
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

  selectedValueEndorsement = 'Received';




  constructor(private el: ElementRef, private dialog: MatDialog, public authService: AuthService, public route: ActivatedRoute, public publicationService: PublicationsService, private router: Router) { }

  ngOnInit(): void {


    this.paramMapSubscription = this.route.paramMap.subscribe((paramMap: ParamMap) => {

      this.userId = paramMap.get('userId');


      this.authService.getSingleRating(this.userId).subscribe({
        next: (value) => {

          this.avgRating = value.rate
        }
      })



      this.userIsAuthenticated = this.authService.getIsAuth();




      this.scrollToView();

      if (this.userIsAuthenticated) {
        this.currentUser = this.authService.getUser();


        if (Number(this.currentUser.user_id) === Number(this.userId)) {

          this.router.navigate(['profile/myProfile'])
        }
        else {




          /*
          this.authService.getUserFollowers(String(this.currentUser.user_id));
          this.authService.getUserFollowersUpdateListener().subscribe({
            next: (response) => {

              const followers = response.map(follower => ({
                email: follower.email,
                firstName: follower.firstName,
                lastName: follower.lastName,
                userName: follower.userName,
                user_id: follower.user_id,
              }));
              this.currentUserFollowers = followers;

            }
          })
          this.authService.getUserFollowings(String(this.currentUser.user_id));
          this.currentUserFollowingsSubscription = this.authService.getUserFollowingsUpdateListener().subscribe({
            next: (response) => {

              console.log("user with id ", this.currentUser.user_id, " following ", response)
              const followings = response.map(following => ({
                email: following.email,
                firstName: following.firstName,
                lastName: following.lastName,
                userName: following.userName,
                user_id: following.user_id,
              }));
              this.currentUserFollowings = followings;

            }
          })*/





          this.authService.getSingleRatingOfCurrentUserCreator(this.userId).subscribe({
            next: (value) => {

              this.myRating = value.rate;
              this.rating3 = value.rate

            }
          })

          //GET FOLLOWERS AND FOLLOWINGS OF THE current user
          this.authService.getUserFollowerForProfile(String(this.currentUser.user_id)).subscribe({

            next: (response) => {

              const followers = response.followers.map(follower => ({
                email: follower.email,
                firstName: follower.firstName,
                lastName: follower.lastName,
                userName: follower.userName,
                user_id: follower.user_id,
              }));
              this.currentUserFollowers = followers;



            }

          })
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
              console.log("AT FIRST current user following", this.currentUserFollowings);

              // const profileFollowing = this.currentUserFollowings.some(u => Number(u.user_id) === Number(this.currentUser.user_id));
              this.profileFollowing = this.currentUserFollowings.find(u => Number(u.user_id) === Number(this.userId));


            }
          })

          //GET FOLLOWERS AND FOLLOWINGS OF THE PROFILE
          this.authService.getUserFollowerForProfile(this.userId).subscribe({
            next: (response) => {

              const followers = response.followers.map(follower => ({
                email: follower.email,
                firstName: follower.firstName,
                lastName: follower.lastName,
                userName: follower.userName,
                user_id: follower.user_id,
                following: !!this.currentUserFollowings.find(user => user.user_id === follower.user_id)
              }));
              this.profileFollowers = followers;
              this.totalFollowers = followers.length;

              this.updateDisplayedFollowers();


            }
          })
          this.authService.getUserFollowingsForProfile(this.userId).subscribe({
            next: (response) => {
              const followings = response.following.map(following => ({
                email: following.email,
                firstName: following.firstName,
                lastName: following.lastName,
                userName: following.userName,
                user_id: following.user_id,
                following: !!this.currentUserFollowings.find(user => user.user_id === following.user_id)
              }));
              this.profileFollowings = followings;
              this.updateDisplayedFollowings();
              this.totalFollowings = followings.length;

              console.log("AT FIRST profileFollowing", this.profileFollowings);

            }
          })




          this.authService.getEndorsements(this.userId).subscribe({

            next: (value) => {

              console.log(value)

              this.endorsements = value.endorsements;
              this.totalEndorsements = this.endorsements.length;
              this.updateDisplayedEndorsements();

              this.endorsementsCreated = value.endorsementsCreated;
              this.totalEndorsementsCreated = this.endorsementsCreated.length;
              this.updateDisplayedEndorsementsCreated()

            }
          })



          this.authService.getUserNetwork(this.userId).subscribe({
            next: (response) => {

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

          this.authService.getUserProfile(this.userId).subscribe({
            next: (response) => {



              this.jobs = response.profile.jobs;
              this.totalJobs = response.profile.jobs.length;
              this.updateDisplayedJobs();

              this.studies = response.profile.studies;
              this.totalStudies = response.profile.studies.length;
              this.updateDisplayedStudies();


              this.organizations = response.profile.organizations;
              this.totalOrganizations = response.profile.organizations.length;
              this.updateDisplayedOrganizations();

              this.abilities = response.profile.profileabilities.map(ab => {
                return ab
              })

              this.interests = response.profile.profileinterests.map(ab => {
                return ab
              })


              this.userData = response.user;

              this.profileStats = response.profile.profileStat;

              this.profileStats = response.profile.profileStat;


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


            }, error: (err) => {
              console.log(err);
            }
          });

          this.authService.getUserPublications(this.userId).subscribe({
            next: (response) => {
              this.publications = response.publications;
              this.updateDisplayedPublications()

            }
          })





          this.authService.getUserPhoto(this.userId);
          this.authService.getPhotoSingleUserProfileUpdateListener().subscribe({
            next: (response) => {
              this.uploadedImageSrc = response;

            }
          })

        }


      }




      else {



        //GET FOLLOWERS AND FOLLOWINGS OF THE PROFILE
        this.authService.getUserFollowerForProfile(this.userId).subscribe({
          next: (response) => {

            console.log("user with id ", this.userId, " followed by ", response)
            const followers = response.followers.map(follower => ({
              email: follower.email,
              firstName: follower.firstName,
              lastName: follower.lastName,
              userName: follower.userName,
              user_id: follower.user_id,
            }));
            this.profileFollowers = followers;

          }
        })
        this.authService.getUserFollowingsForProfile(this.userId).subscribe({
          next: (response) => {

            const followings = response.following.map(following => ({
              email: following.email,
              firstName: following.firstName,
              lastName: following.lastName,
              userName: following.userName,
              user_id: following.user_id,
              following: !!this.currentUserFollowings.find(user => user.user_id === following.user_id)
            }));
            this.profileFollowings = followings;

            console.log(this.profileFollowings)
          }
        })


        this.authService.getUserNetwork(this.userId).subscribe({
          next: (response) => {

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


        this.authService.getUserProfile(this.userId).subscribe({
          next: (response) => {



            this.jobs = response.profile.jobs;
            this.totalJobs = response.profile.jobs.length;
            this.updateDisplayedJobs();

            this.studies = response.profile.studies;
            this.totalStudies = response.profile.studies.length;
            this.updateDisplayedStudies();


            this.organizations = response.profile.organizations;
            this.totalOrganizations = response.profile.organizations.length;
            this.updateDisplayedOrganizations();

            this.abilities = response.profile.profileabilities.map(ab => {
              return ab
            })

            this.interests = response.profile.profileinterests.map(ab => {
              return ab
            })


            this.userData = response.user;

            this.profileStats = response.profile.profileStat;

            this.profileStats = response.profile.profileStat;


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


          }, error: (err) => {
            console.log(err);
          }
        });

        this.authService.getUserPublications(this.userId).subscribe({
          next: (response) => {
            this.publications = response.publications;
            this.updateDisplayedPublications()

          }
        })




        this.authService.getEndorsements(this.userId).subscribe({

          next: (value) => {

            console.log(value)

            this.endorsements = value.endorsements;
            this.totalEndorsements = this.endorsements.length;
            this.updateDisplayedEndorsements();

            this.endorsementsCreated = value.endorsementsCreated;
            this.totalEndorsementsCreated = this.endorsementsCreated.length;
            this.updateDisplayedEndorsementsCreated()

          }
        })


        this.authService.getUserPhoto(this.userId);
        this.authService.getPhotoSingleUserProfileUpdateListener().subscribe({
          next: (response) => {


            this.uploadedImageSrc = response;

          }
        })

      }





    })

  }



  showDiv(div: string) {

    this.selectedDiv = div;

  }





  getButtonColor(div: string): string {
    return this.selectedDiv === div ? 'accent' : 'primary';
  }


  showDivStat(div: string) {
    this.selectedDivStat = div;
  }

  getButtonColorStat(div: string): string {
    return this.selectedDivStat === div ? 'accent' : 'primary';
  }


  getButtonColorNetwork(div: string) {
    return this.selectedDivNetwork === div ? 'accent' : 'primary';
  }


  showDivNetwork(div: string) {
    this.selectedDivNetwork = div;
  }


  updateDisplayedPublications() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;

    if (this.publications) {
      this.displayedPublications = this.publications.slice(startIndex, endIndex);
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedPublications();
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


  applyFilterNew() {

    this.displayedPublications = this.publications.filter(publication => {
      // Filter by title

      const lowerCaseTitle = publication.title.toLowerCase();
      if (this.filterValue && !lowerCaseTitle.includes(this.filterValue.toLowerCase())) {
        return false; // Exclude publications that don't match the entered title
      }
      return true;
    })

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

  navigateToUser(userId: any) {


    this.router.navigate(['profile/user-profile', userId]);

  }


  viewUserProfie(userId: any) {


    this.router.navigateByUrl('profile/user-profile/' + userId);

  }



  followUser() {

    //following
    console.log("FOLLOWIN THE USER", this.currentUserFollowings);
    if (this.currentUserFollowings.find(user => Number(user.user_id) === Number(this.userId))) {
      console.log("Current user is following the specified user.");
      this.currentUserFollowings = this.currentUserFollowings.filter(user => Number(user.user_id) !== Number(this.userId));
      this.authService.unfollowUser(this.userId);
      this.profileFollowing = false;
      this.profileStats.followers -= 1;

    }

    //not following
    else {

      const newUserToADD = {
        user_id: this.userId,
        userName: this.userData.userName,
        firstName: this.userData.firstName,
        lastName: this.userData.lastName,
        email: this.userData.email,
        following: true,

      }
      this.profileFollowing = true;

      this.currentUserFollowings.push(newUserToADD);
      console.log("FOLLOWIN THE USER", this.currentUserFollowings);

      this.authService.followUser(this.userId);
      this.profileStats.followers += 1;


    }

  }


  followSpecificUser(user: { user_id: any, userName: string, firstName: string, lastName: string, email: string }) {


    console.log("FOLLOWER", user)
    if (this.currentUserFollowings.find(followingUser => Number(followingUser.user_id) === Number(user.user_id))) {


      //Change array of current user followings
      this.currentUserFollowings = this.currentUserFollowings.filter(followingUser => Number(followingUser.user_id) !== Number(user.user_id));
      this.authService.unfollowUser(user.user_id);
      const userToUpdate = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        following: !!this.currentUserFollowings.find(userS => userS.user_id === user.user_id)
      }

      console.log("BEFORE UNFOLLOOW profileFollowings", this.profileFollowings);

      const indexToUpdate = this.profileFollowings.findIndex(item => item.user_id === user.user_id);
      if (indexToUpdate !== -1) {
        const updatedValue = { ...this.profileFollowings[indexToUpdate], ...userToUpdate };
        const updatedData = [...this.profileFollowings]; // Create a copy of the array

        updatedData[indexToUpdate] = updatedValue; // Update the specific object

        this.profileFollowings = updatedData;
      }

      const indexToUpdate1 = this.profileFollowers.findIndex(item => item.user_id === user.user_id);
      if (indexToUpdate1 !== -1) {
        const updatedValue = { ...this.profileFollowers[indexToUpdate1], ...userToUpdate };
        const updatedData = [...this.profileFollowers]; // Create a copy of the array

        updatedData[indexToUpdate1] = updatedValue; // Update the specific object

        this.profileFollowers = updatedData;
      }
      this.updateDisplayedFollowings();
      this.updateDisplayedFollowers();

      console.log("AFTER UNFOLLOOW profileFollowings", this.profileFollowers);

    }

    else {

      const newUserToADD = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }


      this.currentUserFollowings.push(newUserToADD);
      this.authService.followUser(user.user_id);


      const userToProfileAdd = {
        user_id: user.user_id,
        userName: user.userName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        following: !!this.currentUserFollowings.find(userS => userS.user_id === user.user_id)
      }

      const indexToUpdate = this.profileFollowings.findIndex(item => item.user_id === user.user_id);
      if (indexToUpdate !== -1) {
        const updatedValue = { ...this.profileFollowings[indexToUpdate], ...userToProfileAdd };
        const updatedData = [...this.profileFollowings]; // Create a copy of the array

        updatedData[indexToUpdate] = updatedValue; // Update the specific object

        this.profileFollowings = updatedData;
      }

      const indexToUpdate1 = this.profileFollowers.findIndex(item => item.user_id === user.user_id);
      if (indexToUpdate1 !== -1) {
        const updatedValue = { ...this.profileFollowers[indexToUpdate1], ...userToProfileAdd };
        const updatedData = [...this.profileFollowers]; // Create a copy of the array

        updatedData[indexToUpdate1] = updatedValue; // Update the specific object

        this.profileFollowers = updatedData;
      }
      this.updateDisplayedFollowings();
      this.updateDisplayedFollowers();

    }

  }


  updateValueOfFollowers(userIdToUpdate: any, newValue: Partial<UserDataType>) {
    const currentData = this.currentUserFollowings;
    const indexToUpdate = currentData.findIndex(item => item.user_id === userIdToUpdate);

    if (indexToUpdate !== -1) {
      const updatedValue = { ...currentData[indexToUpdate], ...newValue };
      const updatedData = [...currentData];
      updatedData[indexToUpdate] = updatedValue;

    }
  }


  onPageChangeFollowings(event: PageEvent) {
    this.currentPageFollowings = event.pageIndex;
    this.pageSizeFollowings = event.pageSize;

    this.updateDisplayedFollowings();
  }

  updateDisplayedFollowings() {
    const startIndex = this.currentPageFollowings * this.pageSizeFollowings;
    const endIndex = startIndex + this.pageSizeFollowings;
    this.displayedFollowings = this.profileFollowings.slice(startIndex, endIndex);
  }


  onPageChangeFollowers(event: PageEvent) {
    this.currentPageFollowers = event.pageIndex;
    this.pageSizeFollowers = event.pageSize;

    this.updateDisplayedFollowers();
  }

  updateDisplayedFollowers() {
    const startIndex = this.currentPageFollowers * this.pageSizeFollowers;
    const endIndex = startIndex + this.pageSizeFollowers;
    this.displayedFollowers = this.profileFollowers.slice(startIndex, endIndex);
  }



  endorseUser() {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      userId: this.userId
    }

    this.dialog.open(DialogCreateEndorsementComponent, dialogCreateConfig).afterClosed().subscribe({
      next: (edorsementToSent) => {
        if (edorsementToSent) {
          console.log('Received endorsement data:', edorsementToSent);

          this.endorsements.push(edorsementToSent);
          this.updateDisplayedEndorsements()


        } else {
          console.log('Dialog closed without sending data.');
        }

      }
    })

  }



  onPageChangeEndorsements(event: PageEvent) {
    this.currentPageEndorsements = event.pageIndex;
    this.pageSizeEndorsements = event.pageSize;

    this.updateDisplayedEndorsements();
    this.updateDisplayedEndorsementsCreated();

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




  onRatingChange() {

    const rateObj = {
      rate: this.rating3
    }


    console.log(this.rating3)


    this.authService.rateSingleUser(this.userId, rateObj).subscribe({
      next: (response) => {
        console.log(response)
      }
    })


  }



  ngOnDestroy() {





  }

}
