import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';


interface Notification {
  type: string,
  message: string,
}


@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private notification = new Subject<Notification>();


  private notificationsUpdated = new Subject<{ notification_id?: any, userToNotify?: any, type: string, title: string, content: string, status: string, createdAt: Date }[]>();
  notifications: { notification_id?: any, userToNotify?: any, type: string, title: string, content: string, status: string, createdAt: Date }[] = [];


  constructor(private http: HttpClient) { }


  getNotifications() {


    this.http.get<{ notifications: { notification_id?: any, userToNotify?: any, type: string, title: string, content: string, status: string, createdAt: Date }[] }>("https://localhost:3000/notifications/allNotifications").pipe(map((notificationData) => {
      return notificationData.notifications.map(notification => {
        return {
          notification_id: notification.notification_id,
          type: notification.type,
          title: notification.title,
          content: notification.content,
          status: notification.status,
          userToNotify: notification.userToNotify,
          createdAt: notification.createdAt
        };
      });
    }))
      .subscribe(transformetNotifications => {
        console.log(transformetNotifications)
        this.notifications = transformetNotifications;
        this.notificationsUpdated.next([...this.notifications]);
      });


  }


  addNewNotification(title: string, type: string, status: string, userToNotify: string, request_id: any) {

    const notificationToAdd = {
      notification_id: 'null',
      title: title,
      type: type,
      content: '',
      status: status,
      userToNotify: userToNotify,
      createdAt: new Date(),
      request_id: request_id

    }


    this.http.post<{ notificationCreated: { notification_id?: any, type: string, title: string, content: string, status: string, createdAt: Date } }>('https://localhost:3000/notifications/createNewNotification', notificationToAdd).subscribe({
      next: (response) => {

        console.log(response)
        notificationToAdd.notification_id = response.notificationCreated.notification_id;

        this.notifications.push(notificationToAdd)

        this.notificationsUpdated.next([...this.notifications])

      }
    })



  }


  getNotificationsUpdateListener() {
    return this.notificationsUpdated.asObservable();
  }


  getSingleNotification(id: string) {

    return this.http.get<{
      message: string,
      notification: {
        notification_id: any,
        title: string,
        type: string,
        content: string,
        status: string,
        createdAt: Date,
        creator: { user_id: any, userName: string, firstName: string, lastName: string, email: string }

        requestFile: { request_file_id: any, file_type: string, state: string, description: string, createdAr: string, contentFileId?: any, presentantionFileId: any }
      },

      user: { user_id: any, userName: string, firstName: string, lastName: string, email: string },
      requestFiel?: { request_file_id: any, file_type: string, state: string, description: string, createdAr: string, contentFileId?: any, presentantionFileId: any }

    }>('https://localhost:3000/notifications/singleNotfication/' + id);

  }


  setNotificationAsRead(id: string) {

    const obj = {
      id: id
    }
    this.http.put('https://localhost:3000/notifications/setSingleNotificationAsRead/' + id, obj).subscribe({
      next: (response) => {

        const updateNotifications = this.notifications.map(notification => {
          if (Number(notification.notification_id) === Number(id)) {
            notification.status = 'Read';
            return notification; // Include the modified notification
          }
          return notification; // Keep other notifications unchanged
        });

        this.notifications = updateNotifications;
        this.notificationsUpdated.next([...this.notifications]);


      }
    })

  }


  removeNotification(id: string) {

    this.http.delete('https://localhost:3000/notifications/' + id).subscribe({
      next: (response) => {




        const updateNotifications = this.notifications.filter(notification => {

          if (Number(notification.notification_id) != Number(id)) {

            return notification
          }

          return null
        })

        this.notifications = updateNotifications;
        this.notificationsUpdated.next([...this.notifications]);





      }
    })

  }


  get notification$(): Observable<Notification> {
    return this.notification.asObservable()
  }


  setNewNotification(notification: Notification) {
    if (!notification) {
      return
    }

    this.notification.next(notification)
  }
}
