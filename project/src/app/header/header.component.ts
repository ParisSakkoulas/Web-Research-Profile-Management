import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';
import { NotificationService } from '../notifications/notification.service';
import { RequestService } from '../requests/request.service';
import { P } from '@angular/cdk/keycodes';


@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {



  message = 'Hello world';
  newNotificationsNumber = 0;

  selectedDiv = 'All'


  selectedOption = 'All'
  sections: String[] = ["All", "Article", "Book", "Proceedings", "Thesis", "Book Chapter", "Tech Report", "Other"];

  opened = false;

  private authListenerSubscription !: Subscription;
  userIsAuthenticated = false;

  public userDataC !: null | { user_id: any, userRole: string | null, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };


  profile_id: any;
  userData !: { userName: string, firstName: string, lastName: string, email: string };
  //Photo upload
  uploadedImageSrc: string | ArrayBuffer | null = null;;




  public requests: { request_file_id: any, file_type: string, dismissed: boolean, state: string, description: string, createdAt: Date, fileId: any, userId: any }[] = [];
  public requestSubscritption !: Subscription;



  public notifications: { notification_id?: any, userToNotify?: any, type: string, title: string, content: string, status: string, createdAt: Date }[] = [];
  public displayedNotifications: any = []
  private notificationSubscription !: Subscription;

  constructor(private notificationService: NotificationService, private requestService: RequestService, private authService: AuthService, private router: Router) { }




  ngOnInit(): void {



    this.userDataC = this.authService.getUserDataC();
    console.log("USER DATA", this.userDataC)
    this.authService.getUserDataListener().subscribe({
      next: (response) => {

        this.userDataC = response;

        console.log("USER DATA ROLE", this.userDataC?.userRole);
        console.log("auth", this.userIsAuthenticated)

        if (this.userIsAuthenticated) {
          this.updateDisplayedNotifications('All')
          console.log(this.displayedNotifications)

          if (this.userDataC?.userRole !== 'Admin') {
            //NOTIFICATIONS SET
            this.notificationService.getNotifications();
            this.notificationSubscription = this.notificationService.getNotificationsUpdateListener().subscribe({
              next: (notifications) => {

                console.log("NOTIFICATIONS : ", notifications)
                this.notifications = notifications.filter(notification =>
                  Number(notification.userToNotify) === Number(this.userDataC?.user_id)
                );

                this.updateDisplayedNotifications('All');

                console.log(this.displayedNotifications)

                this.newNotificationsNumber = this.notifications.filter(notification => notification.status === 'Unread').length;
              }
            });


            ///PHOTO PROFILE SIDENAV SET
            this.authService.getPhotoProfile();
            this.authService.getPhotoProfileUpdateListener().subscribe({
              next: (response) => {
                this.uploadedImageSrc = response;
              }
            });

          }







        }



      }
    })



    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubscription = this.authService.getAuthStatusListener().subscribe(isAuthenticated => {
      this.userIsAuthenticated = isAuthenticated;
    });



    if (this.userIsAuthenticated) {


      if (this.userDataC?.userRole !== 'Admin') {

        this.authService.getPhotoProfile();
        this.authService.getPhotoProfileUpdateListener().subscribe({
          next: (response) => {
            this.uploadedImageSrc = response;
          }
        });


        this.notificationService.getNotifications();
        this.notificationSubscription = this.notificationService.getNotificationsUpdateListener().subscribe({
          next: (notifications) => {

            console.log("NOTIFICATIONS : ", notifications)
            this.notifications = notifications.filter(notification =>
              Number(notification.userToNotify) === Number(this.userDataC?.user_id)
            );

            this.updateDisplayedNotifications('All')

            console.log(this.userDataC?.user_id)


            this.newNotificationsNumber = this.notifications.filter(notification => notification.status === 'Unread').length;
          }
        })





        this.authService.getUserDataProfile().subscribe({
          next: (response) => {

            this.profile_id = response.profile.profile_id;

            this.userData = {
              userName: response.user.userName,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              email: response.user.email
            }

          }
        })

      }

    }
  }


  onClick() {
    console.log("menu clicked")
  }


  viewProfile() {
    this.router.navigateByUrl('profile/myProfile');
  }




  getButtonOptionColor(div: string): string {

    return this.selectedDiv === div ? 'accent' : 'primary';


  }


  updateDisplayedNotifications(div: string, $event?: any) {

    if ($event)
      $event.stopPropagation();

    if (this.notifications) {

      if (div === 'All') {
        this.selectedDiv = 'All'
        this.displayedNotifications = this.notifications;
      }
      else if (div === 'Unread') {
        this.selectedDiv = 'Unread';
        this.displayedNotifications = this.notifications.filter(notification => {
          if (notification.status === 'Unread') {
            console.log(notification);
            return true;
          } else {
            return false;
          }
        });

      }



    }
  }


  viewNotification(notificationId: string) {
    this.router.navigateByUrl('notifications/' + notificationId);

  }


  setNotificationAsRead(notificationId: string, $event: any) {
    if ($event)
      $event.stopPropagation();
    this.notificationService.setNotificationAsRead(notificationId);
  }


  removeNotification(notificationId: string, $event: any) {
    if ($event)
      $event.stopPropagation();
    this.notificationService.removeNotification(notificationId);
  }


  onLogOut() {
    this.authService.logOut();
  }

  ngOnDestroy(): void {
    this.authListenerSubscription.unsubscribe();
    this.notificationSubscription.unsubscribe();
    this.userDataC = null;
  }

}
