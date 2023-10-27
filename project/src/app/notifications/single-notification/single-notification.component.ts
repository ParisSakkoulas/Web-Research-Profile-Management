import { Component, OnInit } from '@angular/core';
import { NotificationService } from '../notification.service';
import { ActivatedRoute } from '@angular/router';
import { RequestService } from 'src/app/requests/request.service';

@Component({
  selector: 'app-single-notification',
  templateUrl: './single-notification.component.html',
  styleUrls: ['./single-notification.component.css']
})
export class SingleNotificationComponent implements OnInit {

  notification_id: any;

  public notification !: {
    notification_id: any,
    type: string,
    title: string,
    content: string,
    status: string,
    createdAt: Date,

  }

  public creator!: { user_id: any, userName: string, firstName: string, lastName: string, email: string };

  public requestFile!: { request_file_id: any, file_type: string, state: string, description: string, createdAr: string, contentFileId?: any, presentantionFileId: any }
  constructor(private requestService: RequestService, private route: ActivatedRoute, private notificationService: NotificationService) { }

  ngOnInit(): void {

    this.route.paramMap.subscribe(params => {

      this.notification_id = params.get('notificationId');

      this.notificationService.setNotificationAsRead(this.notification_id);
      this.notificationService.getSingleNotification(this.notification_id).subscribe({
        next: (response) => {
          this.creator = response.notification.creator;
          this.notification = response.notification;

          this.requestFile = response.notification.requestFile;


        }
      })


    })

  }



  acceptRequest(id: any) {



    this.requestService.respondeToRequest(id, true);



  }


  declineRequest(id: any) {
    this.requestService.respondeToRequest(id, false);

  }

}
