import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { Injectable, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, map } from 'rxjs';
import { AuthData } from './auth.data';
import { User } from './user.model';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { setLoadingAction } from '../core/state/spinner';
import { Store } from '@ngrx/store';
import { SuccessComponent } from '../success/success.component';
import { P } from '@angular/cdk/keycodes';
import { PublicationsPerYear } from '../models/publicationsPerYear';
import { CitationsPerYear } from '../models/citationsPerYear';
import { CsrfService } from './csrf.service';







@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private token !: string | any;

  private tokenTimer !: NodeJS.Timer;

  private authStatusListener = new Subject<boolean>();

  private userData !: null | { user_id: any, userRole: string | null, firstName: string | null, lastName: string | null, userName: string | null, email: string | null }
  private userDataListener = new Subject<null | { user_id: any, firstName: string | null, userRole: string | null, lastName: string | null, userName: string | null, email: string | null }>();

  private messageSuccessListener = new Subject<{ sent: boolean, message: string }>();
  private messageErrorListener = new Subject<{ sent: boolean, message: string }>();

  private isAuthenticated = false;

  private userId !: string | any;
  //μπορούμε να δημιουργήσουμε ένα ξεχωριστό αντικείμενο user για να αποθηκεύσουμε τις τιμές του χρήστη που επιθυμούμε

  private user !: { user_id: any | null, userName: string | null, firstName: string | null, lastName: string | null, email: string | null, userRole: string | null };
  private email !: string;

  private userDataUpdated = new Subject<{ email: string, user_id: string, firstName: string, lastName: string, userName: string }>();


  organizations !: { organization_id: any, name: string, description: string }[];
  private organizationsUpdated = new Subject<{ organization_id: any, name: string, description: string }[]>();


  jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string, }[] = [];
  private jobsUpdated = new Subject<{ job_id: any, title: string, company: string, startYear: string, endYear: string }[]>();


  studies: { study_id: any, title: string, school: string, endYear: string, }[] = [];
  private studiesUpdated = new Subject<{ study_id: any, title: string, school: string, endYear: string }[]>();


  abilities: { ability_id: any, keyword: string, }[] = [];
  private abilitiesUpdated = new Subject<{ ability_id: any, keyword: string }[]>();


  interests: { researchInterest_id: any, keyword: string, }[] = [];
  private interestsUpdated = new Subject<{ researchInterest_id: any, keyword: string }[]>();

  //Photo upload
  uploadedImageSrc: string | ArrayBuffer | null = null;;
  private uploadedImageSrcUpdated = new Subject<string | ArrayBuffer | null>();


  //Image for cv
  uploadedImageSrcCV: string | null = null;
  uploadedImageSrcUpdatedCV = new Subject<string | null>();


  //Photo upload
  singleUserUploadedImageSrc: string | ArrayBuffer | null = null;;
  private singleUserUploadedImageSrcUpdated = new Subject<string | ArrayBuffer | null>();


  private userFollowers: { user_id: any, email: string, userName: string, firstName: string, lastName: string }[] = []
  private userFollowersUpdated = new Subject<{ user_id: any, userName: string, email: string, firstName: string, lastName: string }[]>();


  private userFollowings: { user_id: any, userName: string, email: string, firstName: string, lastName: string }[] = []
  private userFollowingsUpdated = new Subject<{ user_id: any, userName: string, email: string, firstName: string, lastName: string }[]>();

  private csrfToken!: string;

  private apiEndPoint = 'https://localhost:3000';


  constructor(private store: Store, private csrfService: CsrfService, private http: HttpClient, private router: Router, public dialog: MatDialog) { }




  createNewUser(newUser: AuthData) {

    this.http.post<{ message: string }>("https://localhost:3000/users/signup", newUser).subscribe({

      next: (success) => {


        this.messageSuccessListener.next({ sent: true, message: success.message });
      },

      error: (err) => {
        console.log(err);
        this.authStatusListener.next(false);


      }


    });

  }


  loginUser(loginCredentials: string, password: string) {

    const logInData = {
      loginCredentials: loginCredentials,
      password: password
    }







    console.log("LOG IN CALLED")


    this.http.post<{ token: string, expiresIn: number, userId: string, email: string, userRole: string, userName: string, firstName: string, lastName: string }>
      (this.apiEndPoint + '/users/login', logInData).subscribe({



        next: (userLogedIn) => {

          const token = userLogedIn.token;

          this.token = token;

          if (token) {
            const expiresIn = userLogedIn.expiresIn;

            console.log(userLogedIn)
            this.setAuthTimer(expiresIn)
            console.log(expiresIn)
            this.isAuthenticated = true;
            this.userId = userLogedIn.userId;
            this.user = {
              user_id: userLogedIn.userId,
              email: userLogedIn.email,
              userRole: userLogedIn.userRole,
              userName: userLogedIn.userName,
              firstName: userLogedIn.firstName,
              lastName: userLogedIn.lastName
            }
            this.authStatusListener.next(true);
            this.userDataListener.next({
              user_id: userLogedIn.userId,
              email: userLogedIn.email,
              userRole: userLogedIn.userRole,
              userName: userLogedIn.userName,
              firstName: userLogedIn.firstName,
              lastName: userLogedIn.lastName
            })

            this.userData = {
              user_id: userLogedIn.userId,
              email: userLogedIn.email,
              userRole: userLogedIn.userRole,
              userName: userLogedIn.userName,
              firstName: userLogedIn.firstName,
              lastName: userLogedIn.lastName
            }
            const now = new Date();
            const expirationDate = new Date(now.getTime() + expiresIn * 1000);
            this.saveAuthData(token, expirationDate, this.userId, userLogedIn.userRole, userLogedIn.email, userLogedIn.userName, userLogedIn.firstName, userLogedIn.lastName)
            this.router.navigate(['/']);
          }

        },

        error: (err) => {
          console.log(err)
          this.authStatusListener.next(false);
        }




      })











  }

  //Μέθοδος που καλούμε ένα get request στο backend και μας επιστρέφει true ή false
  // ανάλογα αν υπάρχει το συγκεκριμένο email στη βάση
  checkEmail(email: string) {

    return this.http.get(`https://localhost:3000/users/checkUsername/${email}`);

  }

  //Μέθοδος που καλούμε ένα get request στο backend και μας επιστρέφει true ή false
  // ανάλογα αν υπάρχει το συγκεκριμένο user name στη βάση
  checkUserName(userName: string) {

    return this.http.get(`https://localhost:3000/users/checkUsername/${userName}`);

  }


  getmessageSuccessListener() {
    return this.messageSuccessListener;
  }

  getToken() {
    return this.token;
  }

  getAuthStatusListener() {
    return this.authStatusListener;
  }

  getCurrentUserDataValue() {

    return this.user;

  }

  getCurrentUserDataUpdateListenerValue() {

    return this.userDataUpdated.asObservable();


  }

  getCurrentUserDataUpdateListener() {
    return this.userDataUpdated.asObservable();
  }

  getUserDataListener() {

    console.log("CUR", this.user)
    return this.userDataListener.asObservable();
  }


  getCurrentUserMetaData() {

    this.http.get("https://localhost:3000/users/getUserData").subscribe({
      next: (response) => {

        console.log(response);

      }
    })

  }

  getUserDataC() {
    return this.userData;

  }

  getIsAuth() {
    return this.isAuthenticated;
  }

  getUserId() {
    return this.userId;
  }

  getUser() {
    return this.user;
  }

  logOut() {
    this.token = null;
    this.userId = null;
    this.isAuthenticated = false;
    this.authStatusListener.next(false);

    this.userDataListener.next(null);
    clearTimeout(this.tokenTimer);
    this.clearAuthData();
    this.router.navigate(['/login']);



  }

  autoAuthUser() {

    const authInformation = this.getAuthData();

    if (!authInformation) {
      return;
    }
    const now = new Date();

    const expiresIn = authInformation!.expirationDate.getTime() - now.getTime();


    if (expiresIn > 0) {
      this.token = authInformation?.token;
      this.isAuthenticated = true;
      this.setAuthTimer(expiresIn / 1000)
      this.authStatusListener.next(true);
      this.userId = authInformation.userId;

      this.user = {
        user_id: this.userId,
        email: authInformation.email,
        userRole: authInformation.userRole,
        userName: authInformation.userName,
        firstName: authInformation.firstName,
        lastName: authInformation.lastName
      }

      this.userData = {
        user_id: authInformation.userId,
        email: authInformation.email,
        userRole: authInformation.userRole,

        userName: authInformation.userName,
        firstName: authInformation.firstName,
        lastName: authInformation.lastName
      }
      const user = {
        user_id: authInformation.userId,
        email: authInformation.email,
        userRole: authInformation.userRole,
        userName: authInformation.userName,
        firstName: authInformation.firstName,
        lastName: authInformation.lastName
      }

      console.log("USER", user);

      this.userDataListener.next(this.user);



      console.log(authInformation)
    }

  }

  private setAuthTimer(duration: number) {
    this.tokenTimer = setTimeout(() => {

      this.logOut();



    }, duration * 1000)
  }

  private saveAuthData(token: string, expirationDate: Date, userId: string, userRole: string, email: string, userName: string, firstName: string, lastName: string) {

    localStorage.setItem('token', token);
    localStorage.setItem('expiration', expirationDate.toISOString());
    localStorage.setItem('userId', userId);
    localStorage.setItem('email', email);
    localStorage.setItem('userName', userName);
    localStorage.setItem('firstName', firstName);
    localStorage.setItem('lastName', lastName);
    localStorage.setItem('userRole', userRole);



  }

  private clearAuthData() {
    localStorage.removeItem('token');
    localStorage.removeItem('expiration');
    localStorage.removeItem('userId');

    localStorage.removeItem('email');
    localStorage.removeItem('userName');
    localStorage.removeItem('firstName');
    localStorage.removeItem('lastName');


  }

  private getAuthData() {

    const token = localStorage.getItem('token');
    const expirationDate = localStorage.getItem("expiration");
    const userId = localStorage.getItem("userId");
    const email = localStorage.getItem("email");
    const userRole = localStorage.getItem("userRole");

    const userName = localStorage.getItem("userName");
    const firstName = localStorage.getItem("firstName");
    const lastName = localStorage.getItem("lastName");

    console.log(expirationDate)

    if (!token || !expirationDate) {

      return;

    }

    return {
      token: token,
      expirationDate: new Date(expirationDate),
      userId: userId,
      email: email,
      userName: userName,
      firstName: firstName,
      lastName: lastName,
      userRole: userRole

    }

  }


  public getUserDataProfile() {

    return this.http.get<{
      message: string,

      user: {
        email: string,
        firstName: string,
        lastName: string,
        userName: string,
        user_id: any
      }
      profile: {
        profile_id: any
        abilities: { ability_id: any, keyword: string },
        interests: { ability_id: any, keyword: string },
        profileStat: {
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
        },



      }
    }>("https://localhost:3000/users/userDataProfile")

  }


  public getUserData() {

    return this.http.get<{ message: string, user: { firstName: string, lastName: string, userName: string, email: string } }>("https://localhost:3000/users/getUserData");

  }


  public changeUserProfileData(profileData: { userName: string, firstName: string, lastName: string }) {
    return this.http.put<{ message: string, user: { firstName: String, lastName: string, userName: string } }>("https://localhost:3000/users/updateUserInfo", profileData);
  }




  //Methods for organizations
  public getAllOrganizations() {

    this.http.get<{ message: string, organizations: { organization_id: any, name: string, description: string }[] }>("https://localhost:3000/users/AllOrganizations").pipe(map((orgData) => {
      return orgData.organizations.map(organization => {
        return {
          name: organization.name,
          description: organization.description,
          organization_id: organization.organization_id,
        };
      });
    }))
      .subscribe(transformetOrganization => {
        this.organizations = transformetOrganization;
        this.organizationsUpdated.next([...this.organizations]);
      });
  }

  public getOrganizationUpdateListener() {
    return this.organizationsUpdated.asObservable();
  }

  public addOrganizationData(organization: { name: string, description: string }) {
    this.http.post<{ message: string, organization: { organization_id: any, name: string, description: string } }>("https://localhost:3000/users/addNewOrganization", organization).subscribe({
      next: (response) => {




        this.store.dispatch(setLoadingAction({ status: false }));

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
        this.organizations.push(response.organization);

        this.organizationsUpdated.next([...this.organizations])

      }
    });

  }

  public delteOrganization(id: string) {

    this.http.delete<{ message: string, id: any }>("https://localhost:3000/users/delteOrganization/" + id).subscribe({
      next: (response) => {

        const updatedOrganizations = this.organizations.filter(org => org.organization_id !== id);
        this.organizations = updatedOrganizations;
        this.organizationsUpdated.next([...this.organizations]);



        console.log(response)
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


  public updateOrganization(id: string, organization: { name: string, description: string }) {


    this.http.put<{ message: string, organization: { organization_id: any, name: string, description: string } }>("https://localhost:3000/users/updateOrganization/" + id, organization).subscribe({

      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));

        console.log(response)

        const id = Number(response.organization.organization_id);

        const updatedOrganizations = this.organizations.filter(org => {

          if (org.organization_id === id) {
            org.organization_id = id,
              org.description = response.organization.description,
              org.name = response.organization.name

            return org
          }
          return org
        })

        this.organizations = updatedOrganizations;
        this.organizationsUpdated.next([...this.organizations]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }


    })


  }

  //Methods for Jobs
  public getAllJobs() {

    this.http.get<{ message: string, jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string }[] }>("https://localhost:3000/users/allJobs").pipe(map((jobsData) => {
      return jobsData.jobs.map(job => {
        return {
          job_id: job.job_id,
          title: job.title,
          company: job.company,
          startYear: job.startYear,
          endYear: job.endYear,
        };
      });
    }))
      .subscribe(transformetJobs => {
        this.jobs = transformetJobs;
        this.jobsUpdated.next([...this.jobs]);
      });

  }

  public getJobsUpdateListener() {
    return this.jobsUpdated.asObservable();
  }

  public addNewJob(job: { title: string, company: string, startYear: string, endYear: string }) {



    this.http.post<{ message: string, job: { job_id: any, title: string, company: string, startYear: string, endYear: string } }>("https://localhost:3000/users/addNewJob", job).subscribe({
      next: (response) => {



        this.store.dispatch(setLoadingAction({ status: false }));


        const jobToSet = {
          job_id: response.job.job_id,
          title: response.job.title,
          company: response.job.company,
          startYear: response.job.startYear.toString(),
          endYear: response.job.endYear.toString(),
        }
        console.log(jobToSet)
        this.jobs.push(jobToSet);

        this.jobsUpdated.next([...this.jobs]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });

  }


  public deleteJob(id: string) {

    this.http.delete<{ message: string, id: any }>("https://localhost:3000/users/deleteJob/" + id).subscribe({
      next: (response) => {

        const updateJob = this.jobs.filter(job => job.job_id !== id);
        this.jobs = updateJob;
        this.jobsUpdated.next([...this.jobs]);

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

  public updateJob(id: string, job: { title: string, company: string, startYear: string, endYear: string }) {



    this.http.put<{ message: string, job: { job_id: any, title: string, company: string, startYear: string, endYear: string } }>("https://localhost:3000/users/updateJob/" + id, job).subscribe({

      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));

        console.log(response)

        const id = Number(response.job.job_id);

        const updatedJobs = this.jobs.filter(job => {

          if (job.job_id === id) {
            job.job_id = id;
            job.title = response.job.title;
            job.company = response.job.company;
            job.startYear = response.job.startYear;
            job.endYear = response.job.endYear;

            return job
          }
          return job
        })

        this.jobs = updatedJobs;
        this.jobsUpdated.next([...this.jobs]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }


    })
  }



  //Methods for studies
  public getAllStudies() {

    this.http.get<{ message: string, studies: { study_id: any, title: string, school: string, endYear: string }[] }>("https://localhost:3000/users/allStudies").pipe(map((studyData) => {
      return studyData.studies.map(study => {
        return {
          study_id: study.study_id,
          title: study.title,
          school: study.school,
          endYear: study.endYear,
        };
      });
    }))
      .subscribe(transformetStudies => {
        this.studies = transformetStudies;
        this.studiesUpdated.next([...this.studies]);
      });

  }

  public getStudiesUpdateListener() {
    return this.studiesUpdated.asObservable();
  }

  public addNewStudy(study: { title: string, school: string, endYear: string }) {

    this.http.post<{ message: string, study: { study_id: any, title: string, school: string, endYear: string } }>("https://localhost:3000/users/addNewStudy", study).subscribe({
      next: (response) => {


        this.store.dispatch(setLoadingAction({ status: false }));
        const studyToSet = {
          study_id: response.study.study_id,
          title: response.study.title,
          school: response.study.school,
          endYear: response.study.endYear.toString(),
        }
        this.studies.push(studyToSet);

        this.studiesUpdated.next([...this.studies]);
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });

  }


  public deleteStudy(id: any) {

    this.http.delete<{ message: string, id: any }>("https://localhost:3000/users/deleteStudy/" + id).subscribe({
      next: (response) => {

        const updateStudy = this.studies.filter(st => st.study_id !== id);
        this.studies = updateStudy;
        this.studiesUpdated.next([...this.studies]);

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

  public updateStudy(id: any, study: { title: string, school: string, endYear: string }) {


    this.http.put<{ message: string, study: { study_id: any, title: string, school: string, endYear: string } }>("https://localhost:3000/users/updateStudy/" + id, study).subscribe({

      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));

        console.log(response.study)

        const id = Number(response.study.study_id);

        const updatedStudies = this.studies.filter(st => {

          if (st.study_id === id) {

            st.study_id = id,
              st.title = response.study.title
            st.school = response.study.school,
              st.endYear = response.study.endYear

            console.log(st)
            return st;

          }
          return st;
        })

        this.studies = updatedStudies;
        this.studiesUpdated.next([...this.studies]);

        console.log(this.studies)
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }


    })

  }


  //ABILITIES
  public getAllAbilities() {

    this.http.get<{ message: string, abilities: { ability_id: any, keyword: string }[] }>("https://localhost:3000/users/allAbilities").pipe(map((abilityData) => {

      console.log(abilityData)
      return abilityData.abilities.map(a => {
        return {
          ability_id: a.ability_id,
          keyword: a.keyword
        };
      });
    }))
      .subscribe(transformedAbilities => {
        this.abilities = transformedAbilities;
        this.abilitiesUpdated.next([...this.abilities]);
      });

  }

  public getAbilitiesUpdateListener() {
    return this.abilitiesUpdated.asObservable();
  }


  public addAbilities(abilities: { keyword: string }[]) {


    const obj = {
      abilities: abilities
    }

    this.http.post<{ message: string, abilities: { ability_id: any, keyword: string }[] }>("https://localhost:3000/users/addAbilities", obj).subscribe({
      next: (response) => {


        this.store.dispatch(setLoadingAction({ status: false }));


        console.log(response)
        this.abilities = [...response.abilities]
        this.abilitiesUpdated.next([...this.abilities]);


        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });



  }




  //INTERESTS
  public getAllInterests() {
    this.http.get<{ message: string, interests: { researchInterest_id: any, keyword: string }[] }>("https://localhost:3000/users/allInteresst").pipe(map((interestData) => {

      console.log(interestData)
      return interestData.interests.map(inter => {
        return {
          researchInterest_id: inter.researchInterest_id,
          keyword: inter.keyword
        };
      });
    }))
      .subscribe(transformedInterests => {
        this.interests = transformedInterests;
        this.interestsUpdated.next([...this.interests]);
      });

  }

  public getInterestsUpdateListener() {
    return this.interestsUpdated.asObservable();
  }

  public addInterests(interests: { keyword: string }[]) {


    console.log(interests)
    const obj = {
      interests: interests
    }

    this.http.post<{ message: string, interests: { researchInterest_id: any, keyword: string }[] }>("https://localhost:3000/users/addInterests", obj).subscribe({
      next: (response) => {


        this.store.dispatch(setLoadingAction({ status: false }));

        this.interests = [...response.interests]
        this.interestsUpdated.next([...this.interests]);


        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    });



  }



  public getPhotoProfile() {


    this.http.get("https://localhost:3000/users/getPhotoProfile", { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {
        console.log(data)
        this.handleFile(data);
      }
    })

  }

  public getPhotoProfileUpdateListener() {

    return this.uploadedImageSrcUpdated.asObservable();

  }

  private handleFile(blobData: Blob) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      // Here, fileContent will be the content of the file as a data URL
      this.uploadedImageSrc = fileReader.result;
      this.uploadedImageSrcUpdated.next(this.uploadedImageSrc);


      this.uploadedImageSrcCV = fileReader.result as string;
      this.uploadedImageSrcUpdatedCV.next(this.uploadedImageSrcCV);

      console.log("HANGLE")


    };
    fileReader.readAsDataURL(blobData);
  }



  public getPhotoProfileCV() {


    this.http.get("https://localhost:3000/users/getPhotoProfile", { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {
        console.log(data)
        this.handleFile(data);
      }
    })

  }

  public getPhotoProfileUpdateListenerCV() {
    return this.uploadedImageSrcUpdatedCV.asObservable();
  }


  public uploadPhotoProfile(photoFile: File) {

    const formData = new FormData();
    formData.append('file', photoFile);


    this.http.post("https://localhost:3000/users/uploadPhotoProfile", formData, { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {
        console.log(data)
        this.handleFile(data);
      }
    })

  }






  public removePhotoProfile() {

    this.http.delete("https://localhost:3000/users/removePhotoProfile", { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {
        console.log(data)
        this.handleFile(data);
      }
    })

  }



  public getUserProfile(userId: string) {
    console.log("https://localhost:3000/users/user-profile/" + userId)


    return this.http.get<{
      message: string,
      user: { user_id: any, userName: string, email: string, firstName: string, lastName: string },

      profile: {
        profile_id: any,
        jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string }[],
        studies: { study_id: any, title: string, school: string, endYear: any }[],
        organizations: { organization_id: any, name: string, description: string }[],
        profileStat: {
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
        },
        profileabilities: { ability_id: any, keyword: string }[],
        profileinterests: { interest_id: any, keyword: string }[]

      },


    }>("https://localhost:3000/users/user-profile/" + userId);


  }





  private handleSingleFile(blobData: Blob) {
    const fileReader = new FileReader();
    fileReader.onload = () => {
      // Here, fileContent will be the content of the file as a data URL
      this.singleUserUploadedImageSrc = fileReader.result;
      this.singleUserUploadedImageSrcUpdated.next(this.singleUserUploadedImageSrc);

      console.log("HANGLE")


    };
    fileReader.readAsDataURL(blobData);
  }

  public getUserPhoto(userId: string) {

    this.http.get("https://localhost:3000/users/user-photo/" + userId, { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {

        this.handleSingleFile(data)
      }
    })
  }


  public getPhotoSingleUserProfileUpdateListener() {

    return this.singleUserUploadedImageSrcUpdated.asObservable();

  }

  public getUserPublications(userId: any) {
    return this.http.get<{ message: string, publications: { publication_id: any, title: string, section: string, abstract: string, accessibility: string, doi: string, isbn: string, notes: string, year: string }[] }>("https://localhost:3000/users/userPublications/" + userId);

  }


  simpleSearchLiveUsers(word: string) {

    const querySearch = {
      query: word
    }

    console.log(querySearch)

    return this.http.post<{

      userOrganizationBased: { organizations: { organization_id: any, name: string, description: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string }[]
      userStudiesBased: { studies: { study_id: any, title: string, school: string, endYear: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string }[]
      usersFirstNlastNameBased: { user_id: any, email: string, userName: string, firstName: string, lastName: string }[],
      usersUserNameBased: { user_id: any, email: string, userName: string, firstName: string, lastName: string }[],
      userResearchInterestBased: { interests: { researchInterest_id: any, keyword: string }[], user_id: any, email: string, userName: string, firstName: string, lastName: string }[]
    }>

      ("https://localhost:3000/users/getSimpleUsers", querySearch);


  }


  shopisticatedSearchInternalUsers(
    objectSearch: {
      userName: string,
      firstName: string,
      lastName: string,
      studies: string[],
      interests: string[],
      organization: string
    }) {


    return this.http.post<{
      userFound: {
        user_id: any, firstName: string, lastName: string, email: string, userName: string,
        interests?: { researchInterest_id: any, keyword: string }[],
        studies?: { study_id: any, title: string, school: string, endYear: string, }[],


      }[]
    }>("https://localhost:3000/users/getShopisticatedUsers", objectSearch);


  }


  getUserNetwork(id: string) {

    return this.http.get<{
      message: string,
      networkCooperations: { user_id: any, firstName: string, lastName: string, email: string }[],
      networkTopCooperations: { user_id: any, firstName: string, lastName: string, email: string }[],
      networkReferences: { user_id: any, firstName: string, lastName: string, email: string }[],
      networkTopReferences: { user_id: any, firstName: string, lastName: string, email: string }[]
    }>("https://localhost:3000/users/userNetwork/" + id);

  }





  //followers
  getUserFollowers(id: string) {

    this.http.get<{
      followers: { user_id: any, email: string, firstName: string, lastName: string, userName: string }[],
      userFollowings?: { createdAt: Date, followingId: any, followerId: any }[]

    }>("https://localhost:3000/users/followers/" + id).pipe(map((followersData) => {
      console.log(followersData)
      return followersData.followers.map(follower => {

        return {
          user_id: follower.user_id,
          email: follower.email,
          userName: follower.userName,
          firstName: follower.firstName,
          lastName: follower.lastName
        };
      });
    }))
      .subscribe(transformetFollowers => {
        console.log(transformetFollowers)
        this.userFollowers = transformetFollowers;
        this.userFollowersUpdated.next([...this.userFollowers]);
      });


  }

  getUserFollowersUpdateListener() {
    return this.userFollowersUpdated.asObservable();
  }


  getUserFollowerForProfile(id: string) {

    return this.http.get<{
      followers: { user_id: any, email: string, firstName: string, lastName: string, userName: string }[]

    }>("https://localhost:3000/users/followers/" + id)

  }

  followUser(id: string) {



    console.log('FOLLOW USER')
    this.http.post<{ message: string, user: { user_id: any, email: string, userName: string, firstName: string, lastName: string } }>("https://localhost:3000/users/followUser/" + id, { id: id }).subscribe({


      next: (response) => {



        this.userFollowings.push(response.user)
        this.userFollowingsUpdated.next([...this.userFollowings])

        console.log(this.userFollowings)

      }



    })

  }


  unfollowUser(id: string) {


    this.http.put<{ message: string }>("https://localhost:3000/users/unfollowUser/" + id, { id: id }).subscribe({


      next: (response) => {
        console.log(response)


        const updateUserFollowings = this.userFollowings.filter(user => {

          if (Number(user.user_id) != Number(id)) {

            return user
          }

          return null
        })

        this.userFollowings = updateUserFollowings;
        this.userFollowingsUpdated.next([...this.userFollowings]);

      }



    })
  }



  //followings
  getUserFollowings(id: string) {

    this.http.get<{
      following: { user_id: any, userName: string, email: string, firstName: string, lastName: string }[],
      userFollowings?: { createdAt: Date, followingId: any, followerId: any }[]

    }>("https://localhost:3000/users/following/" + id).pipe(map((followersData) => {
      console.log(id, "following", followersData)
      return followersData.following.map(following => {
        console.log("following", following)
        return {
          user_id: following.user_id,
          email: following.email,
          firstName: following.firstName,
          lastName: following.lastName,
          userName: following.userName
        };
      });
    }))
      .subscribe(transformetFollowings => {
        console.log(transformetFollowings)
        this.userFollowings = transformetFollowings;
        this.userFollowingsUpdated.next([...this.userFollowings]);
      });

  }

  getUserFollowingsUpdateListener() {
    console.log(this.userFollowings)
    return this.userFollowingsUpdated.asObservable();
  }

  getUserFollowingsForProfile(id: string) {

    return this.http.get<{
      following: { user_id: any, email: string, firstName: string, lastName: string, userName: string }[]

    }>("https://localhost:3000/users/following/" + id)

  }


  createNewEndorsement(evidence: string, endorsement: string, userToEndorseId: any) {
    const endorsementObj = {
      evidence: evidence,
      endorsement: endorsement
    }
    return this.http.post<{
      endorsementCreated: {
        endorse_id: any, evidence: string, endorsement: string, createdAt: Date,
        userCreator: { user_id: any, firstName: string, lastName: string, email: string, userName: string }
      }
    }>('https://localhost:3000/users/endorseUser/' + userToEndorseId, endorsementObj);
  }


  getEndorsements(id: string) {
    return this.http.get<{
      endorsements: {
        endorse_id: any, evidence: string, endorsement: string, createdAt: Date,
        userCreator: { user_id: any, firstName: string, lastName: string, email: string, userName: string }

      }[],
      endorsementsCreated: {
        endorse_id: any, evidence: string, endorsement: string, createdAt: Date,
        userCreator: { user_id: any, firstName: string, lastName: string, email: string, userName: string }

      }[]
    }>('https://localhost:3000/users/endorsements/' + id);
  }

  deleteSingleEndorsement(id: string) {
    return this.http.delete<{ message: string }>('https://localhost:3000/users/endorsement/' + id);


  }



  rateSingleUser(id: string, rateObj: any) {


    console.log(rateObj);

    return this.http.post<{ message: string, rating: { rating_id: any, rate: number } }>('https://localhost:3000/users/rateSingleUser/' + id, rateObj);

  }

  getSingleRating(id: string) {

    return this.http.get<{ message: string, rate: number }>('https://localhost:3000/users/singleRating/' + id);


  }


  getSingleRatingOfCurrentUserCreator(id: string) {

    return this.http.get<{ message: string, rate: number }>('https://localhost:3000/users/singleRatingOfCurrentUserCreator/' + id);


  }



  simpleSearchInternaUserName(word: string) {

    const querySearch = {
      query: word
    }


    console.log(querySearch)
    return this.http.post<{ user: { user_id: any, userName: string, firstName: string, lastName: string, email: string } }>("https://localhost:3000/users/getLiveUserNames", querySearch);


  }


  simpleSearchInternalEmail(word: string) {

    const querySearch = {
      query: word
    }


    console.log(querySearch)
    return this.http.post<{ user: { user_id: any, userName: string, firstName: string, lastName: string, email: string } }>("https://localhost:3000/users/getLiveEmails", querySearch);


  }



  deleteAccount(id: string) {


    console.log(id)


    this.http.delete<{ message: string }>('https://localhost:3000/users/deleteUser/' + id).subscribe({


      next: (response) => {

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

        this.logOut();

      }

    })



  }


  checkUserPassword(word: string) {

    const querySearch = {
      query: word
    }

    return this.http.post<{ message: string }>("https://localhost:3000/users/checkPassword", querySearch);


  }


  changePassword(passwordObj: { oldPassword: string, newPassword: string }) {

    console.log(passwordObj);

    return this.http.post<{ message: string }>("https://localhost:3000/users/changePassword", passwordObj);

  }


  changeEmail(email: string) {

    const emailObj = {
      email: email
    }

    return this.http.post<{ message: string }>("https://localhost:3000/users/changeEmail", emailObj);

  }


  resetPassword(email: string) {

    const emailObj = {
      email: email
    }

    return this.http.post<{ message: string }>("https://localhost:3000/users/resetPassword", emailObj);


  }


  resendToken(email: string) {

    const emailObj = {
      email: email
    }

    return this.http.post<{ message: string }>("https://localhost:3000/users/resendToken", emailObj);


  }



  getPublicationsFromFollowings() {
    return this.http.get<{
      message: string,
      publications: [{
        publication_id: string, title: string, year: string, section: string, abstract: string, doi: string, isbn: string, accessibility: string, userId: string,
        user: { user_id: string, firstName: string, lastName: string, email: string }
      }[]]
    }>("https://localhost:3000/users/publicationsFromFollowings");
  }



}
