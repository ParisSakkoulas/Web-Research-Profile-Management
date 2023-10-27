import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, map } from 'rxjs';
import { setLoadingAction } from '../core/state/spinner';
import { SuccessComponent } from '../success/success.component';
import { NotificationService } from '../notifications/notification.service';

@Injectable({
  providedIn: 'root'
})
export class RequestService {


  private myRequestsUpdated = new Subject<{ request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, userId: any }[]>();
  public myRequests: { request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, userId: any }[] = [];


  private requestsUpdated = new Subject<{ request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, userId: any }[]>();
  public requests: { request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, userId: any }[] = [];


  private requestsReceivedUpdate = new Subject<{ request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, fileName: string, user: { user_id: any, firstName: string, lastName: string, userName: string, email: string } }[]>();
  public requestsReceived: {
    request_file_id: any,
    file_type: string,
    state: string,
    description: string,
    createdAt: Date,
    fileId: any,
    fileName: string,
    user: { user_id: any, firstName: string, lastName: string, userName: string, email: string }
  }[] = [];



  private requestsCreatedUpdate = new Subject<{
    request_file_id: any,
    file_type: string,
    state: string,
    description: string,
    createdAt: Date,
    userId: any,
    contentFile?: { content_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }
    presentantionFile?: { presentantion_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }

  }[]>();

  public requestsCreated: {
    request_file_id: any,
    file_type: string,
    state: string,
    description: string,
    createdAt: Date,
    userId: any,
    contentFile?: { content_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }
    presentationFile?: { presentantion_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }

  }[] = [];


  constructor(private notificationService: NotificationService, private store: Store, private http: HttpClient, private router: Router, public dialog: MatDialog) { }




  addNewRequest() {

  }

  requestFile(requestObj: { fileId: any, fileName: string, fileType: string, userToNotify: string }) {

    const requestToAdd = requestObj;

    console.log(requestObj)
    this.http.post<{ message: string, request_id: any }>("https://localhost:3000/publications/requestFile", requestObj).subscribe({

      next: (response) => {
        console.log(response)





        this.notificationService.addNewNotification(`Request for File (${requestObj.fileName})`, 'Request File', 'Unread', requestObj.userToNotify, response.request_id)


        this.store.dispatch(setLoadingAction({ status: false }));


        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);



      }

    });


  }



  getAllMyRequests() {


    this.http.get<{ message: string, requests: { request_file_id: any, file_type: string, state: string, dismissed: boolean, description: string, createdAt: Date, fileId: any, userId: any }[] }>("https://localhost:3000/publications/requestFiles").pipe(map((requestData) => {
      console.log(requestData)
      return requestData.requests.map(request => {

        return {
          request_file_id: request.request_file_id,
          file_type: request.file_type,
          state: request.state,
          dismissed: request.dismissed,
          description: request.description,
          createdAt: request.createdAt,
          fileId: request.fileId,
          userId: request.userId,
        };
      });
    }))
      .subscribe(transformedRequestData => {
        console.log(transformedRequestData)
        this.myRequests = transformedRequestData;
        this.myRequestsUpdated.next([...this.myRequests]);
      });



  }

  getMyRequestsUpdateListener() {
    return this.myRequestsUpdated.asObservable();
  }


  getAllRequests() {

    this.http.get<{
      message: string,
      requests: { request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileId: any, userId: any }[]
    }>("https://localhost:3000/publications/allRequestFiles").pipe(map((requestData) => {
      console.log(requestData)
      return requestData.requests.map(request => {

        return {
          request_file_id: request.request_file_id,
          file_type: request.file_type,
          state: request.state,
          description: request.description,
          createdAt: request.createdAt,
          fileId: request.fileId,
          userId: request.userId,
        };
      });
    }))
      .subscribe(transformedRequestData => {
        console.log(transformedRequestData)
        this.requests = transformedRequestData;
        this.requestsUpdated.next([...this.requests]);
      });

  }


  respondeToRequest(id: string, response: boolean) {
    console.log(response);
  }


  getRequestsUpdateListener() {
    return this.requestsUpdated.asObservable();
  }


  getMyRequestsAsCreator() {

    this.http.get<{
      message: string,
      requests: {
        request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, contentFileId: any, presentantionFileId: any, userId: any,
        contentFile?: { content_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }
        presentantionFile?: { presentantion_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }

      }[]
    }>("https://localhost:3000/requests/myRequestsAsCreator")
      .pipe(map((requestData) => {
        console.log(requestData)
        return requestData.requests.map(request => {

          return {
            request_file_id: request.request_file_id,
            file_type: request.file_type,
            state: request.state,
            description: request.description,
            createdAt: request.createdAt,
            userId: request.userId,
            contentFile: request.contentFile,
            presentantionFile: request.presentantionFile,

          };
        });
      }))
      .subscribe(transformedRequestData => {
        console.log(transformedRequestData)

        this.requestsCreated = transformedRequestData;
        this.requestsCreatedUpdate.next([...this.requestsCreated]);

      });

  }

  getMyRequestCreatedListener() {
    return this.requestsCreatedUpdate.asObservable();
  }


  deleteRequestCreated(request_id: any) {


    this.http.delete<{ message: string }>('https://localhost:3000/requests/' + request_id).subscribe({
      next: (response) => {

        console.log(response);

        const updateRequests = this.requestsCreated.filter(request => request.request_file_id !== request_id);
        this.requestsCreated = updateRequests;
        this.requestsCreatedUpdate.next([...this.requestsCreated]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    })

  }


  getMyRequestAsReceiver() {

    this.http.get<{ message: string, requests: { request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, fileName: string, fileId: any, user: { user_id: any, firstName: string, lastName: string, userName: string, email: string } }[] }>("https://localhost:3000/requests/myRequestsAsReceiver").pipe(map((requestData) => {
      console.log(requestData)
      return requestData.requests.map(request => {

        return {
          request_file_id: request.request_file_id,
          file_type: request.file_type,
          state: request.state,
          description: request.description,
          createdAt: request.createdAt,
          fileId: request.fileId,
          fileName: request.fileName,
          user: request.user,
        };
      });
    }))
      .subscribe(transformedRequestDataReceived => {
        this.requestsReceived = transformedRequestDataReceived;
        this.requestsReceivedUpdate.next([...this.requestsReceived]);
      });

  }

  getMyRequestReceivedListener() {
    return this.requestsReceivedUpdate.asObservable();
  }



  declineRequest(id: string) {

    console.log(id);

    const obj = {
      id: id
    }

    this.http.put("https://localhost:3000/requests/decline/" + id, obj).subscribe({
      next: (response) => {

        console.log(response)


        const updateRequestsCreated = this.requestsCreated.filter(request => {
          if (request.request_file_id === id) {
            request.state = 'declined'

          }
        })


        this.requestsCreated = updateRequestsCreated;
        this.requestsCreatedUpdate.next([...this.requestsCreated]);


        const updateRequestsReceived = this.requestsReceived.filter(request => {
          if (Number(request.request_file_id) === Number(id)) {
            request.state = 'declined';
            return request;
          }
          return request;
        })


        console.log(updateRequestsReceived)


        this.requestsReceived = updateRequestsReceived;
        this.requestsReceivedUpdate.next([...this.requestsReceived]);


      }
    })



  }



  removeRequestReceived(id: string) {

    this.http.delete<{ message: string }>("https://localhost:3000/requests/" + id,).subscribe({


      next: (response) => {


        const updateRequestsReceived = this.requestsReceived.filter(request => request.request_file_id !== id);
        this.requestsReceived = updateRequestsReceived;
        this.requestsReceivedUpdate.next([...this.requestsReceived]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);



      }




    })



  }




  acceptRequestReceived(id: string) {


    const obj = {
      id: id
    }

    this.http.post<{ message: string }>("https://localhost:3000/requests/accept/" + id, obj).subscribe({

      next: (response) => {

        console.log(response)


        const updateRequestsReceived = this.requestsReceived.filter(request => {
          if (Number(request.request_file_id) === Number(id)) {
            request.state = 'accepted';
            return request;
          }
          return request;
        })


        console.log(updateRequestsReceived)


        this.requestsReceived = updateRequestsReceived;
        this.requestsReceivedUpdate.next([...this.requestsReceived]);


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
