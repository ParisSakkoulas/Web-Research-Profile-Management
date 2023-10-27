import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { setLoadingAction } from '../core/state/spinner';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  constructor(private store: Store, private http: HttpClient, private router: Router, public dialog: MatDialog) { }


  getAllUsers() {

    return this.http.get<{ users: { user_id: any, email: string, firstName: string, lastName: string, password: string, userName: string, userRole: string, userStatus: string }[] }>("https://localhost:3000/users/allUsers")

  }


  verifySingleUser(id: string) {

    const userObj = {
      id: id
    }

    return this.http.put<{ message: string }>('https://localhost:3000/users/verifyUser/' + id, userObj)

  }


  inactivateUser(id: string) {

    const userObj = {
      id: id
    }

    return this.http.put<{ message: string }>('https://localhost:3000/users/inactivateUser/' + id, userObj)

  }


  changeUserInfo(id: string, userInfo: { firstName: string, lastName: string, userName: string }) {

    return this.http.put<{ message: string }>('https://localhost:3000/users/changeUserInfo/' + id, userInfo)

  }


  addNewOrganizationForUsere(id: string, organization: { name: string, description: string }) {


    return this.http.post<{ message: string, organization: { organization_id: any, name: string, description: string } }>('https://localhost:3000/users/adminAddOrganization/' + id, organization)

  }


  deleteOrganization(id: string) {
    return this.http.delete<{ message: string }>('https://localhost:3000/users/deleteOrganization/' + id);

  }

  updateSpecificOrganization(organization: { organization_id: any, name: string, description: string }) {

    const organizationObj = {
      name: organization.name,
      descritpion: organization.description
    }

    return this.http.put<{ message: string }>('https://localhost:3000/users/updateOrganization/' + organization.organization_id, organizationObj);

  }


  addNewJob(id: string, job: { title: string, company: string, startYear: string, endYear: string }) {


    return this.http.post<{ message: string, job: { job_id: any, title: string, company: string, startYear: string, endYear: string } }>('https://localhost:3000/users/addNewJob/' + id, job)

  }

  deleteJob(id: string) {
    return this.http.delete<{ message: string }>('https://localhost:3000/users/deleteJob/' + id);

  }

  updateJob(job: { job_id: any, title: string, company: string, startYear: string, endYear: string }) {

    const jobObj = {
      title: job.title,
      company: job.company,
      startYear: job.startYear,
      endYear: job.endYear,
    }

    return this.http.put<{ message: string, job: { job_id: any, title: string, company: string, startYear: string, endYear: string } }>('https://localhost:3000/users/updateJob/' + job.job_id, jobObj);

  }


  addNewStudy(id: string, study: { title: string, school: string, endYear: string }) {


    return this.http.post<{ message: string, study: { study_id: any, title: string, school: string, endYear: string } }>('https://localhost:3000/users/addNewStudy/' + id, study)

  }

  deleteStudy(id: string) {
    return this.http.delete<{ message: string }>('https://localhost:3000/users/deleteStudy/' + id);

  }

  updateStudy(study: { study_id: any, title: string, school: string, endYear: string }) {

    const studyObj = {
      title: study.title,
      school: study.school,
      endYear: study.endYear,
    }

    return this.http.put<{ message: string, study: { study_id: any, title: string, school: string, endYear: string } }>('https://localhost:3000/users/updateStudy/' + study.study_id, studyObj);

  }


  public addInterests(id: string, interests: { keyword: string }[]) {
    const obj = {
      interests: interests
    }
    return this.http.post<{ message: string, interests: { researchInterest_id: any, keyword: string }[] }>("https://localhost:3000/users/addInterests/" + id, obj);

  }


  public addAbilities(id: string, abilities: { keyword: string }[]) {
    const obj = {
      abilities: abilities
    }

    console.log(obj)
    return this.http.post<{ message: string, abilities: { ability_id: any, keyword: string }[] }>("https://localhost:3000/users/addAbilities/" + id, obj)

  }


  changeEmail(id: string, email: string) {

    const emailObj = {
      email: email
    }

    return this.http.post<{ message: string }>("https://localhost:3000/users/changeEmail/" + id, emailObj);

  }


  getAllRequests() {

    return this.http.get<{
      requests: {
        request_file_id: any,
        file_type: string,
        state: string,
        description: string,
        createdAt: Date,
        contentFile?: { access: string, filename: string, type: string },
        presentantionFile?: { access: string, filename: string, type: string },

        user: { firstName: string, lastName: string, userName: string }

      }[]
    }>("https://localhost:3000/users/allRequests");

  }


  getAllNotifications() {

    return this.http.get<{
      notifications: {
        notification_id?: any,
        userToNotify?: any,
        creator: { email: string, firstName: string, lastName: string, userName: string },
        user: { email: string, firstName: string, lastName: string, userName: string }
        type: string,
        title: string,
        content: string,
        status: string,
        createdAt: Date
      }[]
    }>("https://localhost:3000/users/allNotifications");

  }

}
