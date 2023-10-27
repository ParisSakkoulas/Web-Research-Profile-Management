import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit {

  public notifications: {
    notification_id?: any,
    userToNotify?: any,
    creator: { email: string, firstName: string, lastName: string, userName: string },
    user: { email: string, firstName: string, lastName: string, userName: string }
    type: string,
    title: string,
    content: string,
    status: string,
    createdAt: Date
  }[] = [];


  public displayedNotifications: any = [];

  public totalNotification = 0; // Total number of categopries
  public pageSizeNotification = 5;
  public currentPageNotification = 0;
  pageSizeOptionsNotification = [1, 3, 5, 10, 15, 20]

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {


    this.adminService.getAllNotifications().subscribe({

      next: (response) => {
        this.notifications = response.notifications;
        this.updateDisplayedNotification();
        this.totalNotification = this.notifications.length
        console.log(response)

      }

    })


  }

  updateDisplayedNotification() {
    const startIndex = this.currentPageNotification * this.pageSizeNotification;
    const endIndex = startIndex + this.pageSizeNotification;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.notifications) {
      this.displayedNotifications = this.notifications.slice(startIndex, endIndex);
    }
  }

  onPageChangeNotification(event: PageEvent) {
    console.log(event)
    this.currentPageNotification = event.pageIndex;
    this.pageSizeNotification = event.pageSize;
    this.updateDisplayedNotification();
  }

}
