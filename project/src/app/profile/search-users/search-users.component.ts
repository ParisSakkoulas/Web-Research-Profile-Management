import { query } from '@angular/animations';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { PageEvent } from '@angular/material/paginator';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, tap } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';
import { User } from 'src/app/auth/user.model';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { BehaviorSubject } from 'rxjs';


// Make 'following' property optional in both places
type UserDataType = {
  user_id: any;
  email: string;
  userName: string;
  firstName: string;
  lastName: string;
  following?: boolean;
};


@Component({
  selector: 'app-search-users',
  templateUrl: './search-users.component.html',
  styleUrls: ['./search-users.component.css']
})
export class SearchUsersComponent implements OnInit {


  simpleUserSearchForm !: FormGroup;
  searchTypes: string[] = ['Simple', 'Sophisticated'];
  searchTypeSelection = 'Simple';
  //Simple search autocomplete variables
  liveUsersFromDb: string[] = []
  private searchInternalUsers = new Subject<string>();
  internalUsersSearchLoading: boolean = false;

  userName !: string;
  firstName !: string;
  lastName !: string;
  organization !: string;
  interests: string[] = [];
  studies: string[] = [];

  formIsTouched!: boolean;
  public usersFirstNlastNameBased: { user_id: any, email: string, userName: string, firstName: string, lastName: string }[] = []
  public usersUserNameBased: { user_id: any, email: string, userName: string, firstName: string, lastName: string }[] = []


  //filtereFirstNlastNameBasedSimpleOptions!: BehaviorSubject<{ user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>;
  filtereFirstNlastNameBasedSimpleOptions: BehaviorSubject<{ user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]> = new BehaviorSubject<{ user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>([]);
  filtereusersUserNameBasedSimpleOptions: BehaviorSubject<{ user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]> = new BehaviorSubject<{ user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>([]);
  filtereusersResearchInterestsBasedSimpleOptions: BehaviorSubject<{ interests: { researchInterest_id: any, keyword: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]> = new BehaviorSubject<{ interests: { researchInterest_id: any, keyword: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>([]);
  filtereusersStudiesBasedSimpleOptions: BehaviorSubject<{ studies: { study_id: any, title: string, endYear: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]> = new BehaviorSubject<{ studies: { study_id: any, title: string, endYear: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>([]);
  filtereusersOrganizationsBasedSimpleOption: BehaviorSubject<{ organizations: { organization_id: any, name: string, description: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]> = new BehaviorSubject<{ organizations: { organization_id: any, name: string, description: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>([]);

  filteredShophisticatedResult!: Observable<{
    user_id: any, email: string, userName: string, firstName: string, lastName: string,
    interests?: { researchInterest_id: any, keyword: string }[],
    studies?: { study_id: any, title: string, school: string, endYear: string, }[],

  }[]>;
  totalSophisticatedPublications: number = 0;
  public pageSize = 5;
  public currentPage = 0;
  public pageSizeOptionsShophisticated = [5, 10, 15, 20];

  private followers: any[] = [];
  private followings: any[] = [];


  @ViewChild('resultCard', { static: false }) resultCardElement!: ElementRef;

  public totalUsers = 0;
  public pageSizeSimple = 5;
  public currentPageSimple = 0;
  displayedResultsSimpleTitle: any = []
  public pageSizeOptions = [1, 5, 10, 15, 20]
  displayedResults: any[] = [];
  totalPublications!: number;
  currentPageDataUserFirstAndLastNameBased!: any[];
  currentPageDataUserNameBased!: any[];
  currentPageDataResearcInterestBased!: any[];
  currentPageDataStudiesBased!: any[];
  currentPageDataOrganizationsBased!: any[];




  public userIsAuthenticated = false;
  public currentUser!: { user_id: any, firstName: string | null, lastName: string | null, userName: string | null, email: string | null, userRole: string | null };
  public userId: any;

  constructor(private router: Router, private store: Store, private fb: FormBuilder, public authService: AuthService) { }

  ngOnInit(): void {

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης
    this.simpleUserSearchForm = this.fb.group({
      searchTerm: new FormControl(''),
    })


    this.userIsAuthenticated = this.authService.getIsAuth();

    if (this.userIsAuthenticated) {

      this.currentUser = this.authService.getUser();
      console.log(this.currentUser);
      this.userId = Number(this.currentUser.user_id);



      console.log("Current userrr", this.currentUser)

      this.authService.getUserFollowers(String(this.currentUser.user_id))
      this.authService.getUserFollowersUpdateListener().subscribe({
        next: (response) => {
          this.followers = response;
          console.log(this.followers)

        }
      })


      this.authService.getUserFollowings(String(this.currentUser.user_id))
      this.authService.getUserFollowingsUpdateListener().subscribe({
        next: (response) => {
          console.log('Inside subscription:', response);

          this.followings = response;
          response.map(following => {

            const userToUpdate = {
              email: following.email,
              firstName: following.firstName,
              lastName: following.lastName,
              userName: following.userName,
              user_id: following.user_id,
              following: true,
            }

            this.updateValue(userToUpdate.user_id, userToUpdate);
            console.log("FOLLOWING", userToUpdate)
          })





        }, error: (error) => {
          console.error('Subscription error:', error);
        }
      })



    }


    //Αναμένουμε κάποια δευτερόλεπτα και μετά στέλνουμε τον input του χρήστη για αναζήτηση δημοσιεύσεων με βάση τον τίτλο από τη βάση
    this.searchInternalUsers.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {

        this.formIsTouched = true;
        this.internalUsersSearchLoading = true;
        this.totalUsers = 0;
      }),
    ).subscribe((query: string) => {
      this.authService.simpleSearchLiveUsers(query.trim()).subscribe({
        next: (response) => {


          const initialData1 = response.usersFirstNlastNameBased.map(u => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            userName: u.userName,
            user_id: u.user_id,
            following: !!this.followings.find(user => user.user_id === u.user_id)
          }));
          this.filtereFirstNlastNameBasedSimpleOptions = new BehaviorSubject<UserDataType[]>(initialData1);
          this.totalUsers += response.usersFirstNlastNameBased.length

          const initialData2 = response.usersUserNameBased.map(u => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            userName: u.userName,
            user_id: u.user_id,
            following: !!this.followings.find(user => user.user_id === u.user_id)
          }));
          this.filtereusersUserNameBasedSimpleOptions = new BehaviorSubject<UserDataType[]>(initialData2);


          const initialData3 = response.userResearchInterestBased.map(u => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            userName: u.userName,
            user_id: u.user_id,
            interests: u.interests,
            following: !!this.followings.find(user => Number(user.user_id) === Number(u.user_id))
          }));
          this.filtereusersResearchInterestsBasedSimpleOptions = new BehaviorSubject<{ interests: { researchInterest_id: any, keyword: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>(initialData3);



          const initialData4 = response.userStudiesBased.map(u => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            userName: u.userName,
            user_id: u.user_id,
            studies: u.studies,
            following: !!this.followings.find(user => Number(user.user_id) === Number(u.user_id))
          }));
          this.filtereusersStudiesBasedSimpleOptions = new BehaviorSubject<{ studies: { study_id: any, title: string, endYear: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>(initialData4);


          const initialData5 = response.userOrganizationBased.map(u => ({
            firstName: u.firstName,
            lastName: u.lastName,
            email: u.email,
            userName: u.userName,
            user_id: u.user_id,
            organizations: u.organizations,
            following: !!this.followings.find(user => Number(user.user_id) === Number(u.user_id))
          }));
          this.filtereusersOrganizationsBasedSimpleOption = new BehaviorSubject<{ organizations: { organization_id: any, name: string, description: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string, following?: boolean }[]>(initialData5);

          this.totalUsers += response.userOrganizationBased.length;
          this.totalUsers += response.userStudiesBased.length;
          this.totalUsers += response.userResearchInterestBased.length;
          this.totalUsers += response.usersUserNameBased.length;

          this.internalUsersSearchLoading = false;

          this.updateDisplayedUsersSimple();
        }
      })

    })


  }

  onUserSimpleSearch() {

  }


  updateValue(userIdToUpdate: any, newValue: Partial<UserDataType>) {


    const currentData1 = this.filtereFirstNlastNameBasedSimpleOptions.value;
    const currentData2 = this.filtereusersUserNameBasedSimpleOptions.value;
    const currentData3 = this.filtereusersResearchInterestsBasedSimpleOptions.value;
    const currentData4 = this.filtereusersStudiesBasedSimpleOptions.value;
    const currentData5 = this.filtereusersOrganizationsBasedSimpleOption.value;




    const indexToUpdate1 = currentData1.findIndex(item => item.user_id === userIdToUpdate);
    const indexToUpdate2 = currentData2.findIndex(item => item.user_id === userIdToUpdate);
    const indexToUpdate3 = currentData3.findIndex(item => item.user_id === userIdToUpdate);
    const indexToUpdate4 = currentData4.findIndex(item => item.user_id === userIdToUpdate);
    const indexToUpdate5 = currentData5.findIndex(item => item.user_id === userIdToUpdate);





    if (indexToUpdate1 !== -1) {
      const updatedValue = { ...currentData1[indexToUpdate1], ...newValue };
      const updatedData = [...currentData1];
      updatedData[indexToUpdate1] = updatedValue;

      // Update the BehaviorSubject with the modified array
      this.filtereFirstNlastNameBasedSimpleOptions.next(updatedData);
    }

    if (indexToUpdate2 !== -1) {
      const updatedValue = { ...currentData2[indexToUpdate2], ...newValue };
      const updatedData = [...currentData2];
      updatedData[indexToUpdate2] = updatedValue;

      // Update the BehaviorSubject with the modified array
      this.filtereusersUserNameBasedSimpleOptions.next(updatedData);
    }

    if (indexToUpdate3 !== -1) {
      const updatedValue = { ...currentData3[indexToUpdate2], ...newValue };
      const updatedData = [...currentData3];
      updatedData[indexToUpdate3] = updatedValue;

      // Update the BehaviorSubject with the modified array
      this.filtereusersResearchInterestsBasedSimpleOptions.next(updatedData);
    }

    if (indexToUpdate4 !== -1) {
      const updatedValue = { ...currentData4[indexToUpdate2], ...newValue };
      const updatedData = [...currentData4];
      updatedData[indexToUpdate4] = updatedValue;

      // Update the BehaviorSubject with the modified array
      this.filtereusersStudiesBasedSimpleOptions.next(updatedData);
    }

    if (indexToUpdate5 !== -1) {
      const updatedValue = { ...currentData5[indexToUpdate2], ...newValue };
      const updatedData = [...currentData5];
      updatedData[indexToUpdate5] = updatedValue;

      // Update the BehaviorSubject with the modified array
      this.filtereusersOrganizationsBasedSimpleOption.next(updatedData);
    }

  }


  onShopisticatedSearch() {


    let searchObject = {
      userName: this.userName,
      firstName: this.firstName,
      lastName: this.lastName,
      studies: this.studies,
      interests: this.interests,
      organization: this.organization
    }
    console.log(searchObject)


    this.store.dispatch(setLoadingAction({ status: true }));
    this.authService.shopisticatedSearchInternalUsers(searchObject).subscribe({
      next: (result) => {

        console.log(result)

        const uniqueUsers = result.userFound.filter((user, index, self) =>
          index === self.findIndex((u) => u.user_id === user.user_id)
        );
        this.filteredShophisticatedResult = of(uniqueUsers);
        this.store.dispatch(setLoadingAction({ status: false }));
        this.resultCardElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
        this.updateDisplayedUsers()

      }
    });

  }

  //for paginator shophisticated
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedUsers();
  }

  //for paginator shophisticated
  updateDisplayedUsers() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredShophisticatedResult.subscribe(results => {
      this.displayedResults = results.slice(startIndex, endIndex);
    });
  }

  sendDataSimpleSearch(event: any) {

    let query: string = event.target.value.trim();

    if (query.length === 0) {

      this.liveUsersFromDb = [];
      return;
    }
    this.searchInternalUsers.next(query);


  }


  viewProfile(id: any) {

    console.log(id)
    this.router.navigate(['profile/user-profile/' + id])

  }


  //for paginator simple
  onPageChangeSimple(event: PageEvent) {

    this.currentPageSimple = event.pageIndex;
    this.pageSizeSimple = event.pageSize;

    this.updateDisplayedUsersSimple();
  }

  //for paginator simple
  updateDisplayedUsersSimple() {
    const startIndex = this.currentPageSimple * this.pageSizeSimple;
    const endIndex = startIndex + this.pageSizeSimple;

    //title update
    this.filtereFirstNlastNameBasedSimpleOptions.subscribe(results => {
      console.log(results)
      this.currentPageDataUserFirstAndLastNameBased = results.slice(startIndex, endIndex);
    });

    this.filtereusersUserNameBasedSimpleOptions.subscribe(results => {
      this.currentPageDataUserNameBased = results.slice(startIndex, endIndex);
    })

    this.filtereusersResearchInterestsBasedSimpleOptions.subscribe(results => {
      this.currentPageDataResearcInterestBased = results.slice(startIndex, endIndex);
    })

    this.filtereusersStudiesBasedSimpleOptions.subscribe(results => {
      this.currentPageDataStudiesBased = results.slice(startIndex, endIndex);
    })

    this.filtereusersOrganizationsBasedSimpleOption.subscribe(results => {
      this.currentPageDataOrganizationsBased = results.slice(startIndex, endIndex);
    })

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

  removeStudy(keyword: string) {
    const index = this.studies.indexOf(keyword);
    if (index >= 0) {
      this.studies.splice(index, 1);
    }
  }

  addStudy(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.studies.push(value);
    }

    // Clear the input value
    event.chipInput!.clear();
  }


  followUser(id: any) {




    if (this.followings.find(user => Number(user.user_id) === Number(id))) {
      console.log("YOU ARE FOLLOWING HIM");

      //unfollow

      this.authService.unfollowUser(id);


      const userWithId = this.followings.find(user => Number(user.user_id) === Number(id));


      const userToUpdate = {
        email: userWithId.email,
        firstName: userWithId.firstName,
        lastName: userWithId.lastName,
        userName: userWithId.userName,
        user_id: userWithId.user_id,
        following: false,
      }


      this.updateValue(userToUpdate.user_id, userToUpdate);

    }

    else {

      console.log("YOU ARE not FOLLOWING HIM");

      //follow
      this.authService.followUser(id);
    }

  }



  updateValueOfFollowers(userIdToUpdate: any, newValue: Partial<UserDataType>) {
    const currentData = this.filtereFirstNlastNameBasedSimpleOptions.value;
    const indexToUpdate = currentData.findIndex(item => item.user_id === userIdToUpdate);

    if (indexToUpdate !== -1) {
      const updatedValue = { ...currentData[indexToUpdate], ...newValue };
      const updatedData = [...currentData];
      updatedData[indexToUpdate] = updatedValue;

      this.filtereFirstNlastNameBasedSimpleOptions.next(updatedData);
    }
  }




}



