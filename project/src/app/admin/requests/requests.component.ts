import { Component, OnInit } from '@angular/core';
import { AdminService } from '../admin.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.css']
})
export class RequestsComponent implements OnInit {

  public requests: {
    request_file_id: any,
    file_type: string,
    state: string,
    description: string,
    createdAt: Date,
    contentFile?: { access: string, filename: string, type: string },
    presentantionFile?: { access: string, filename: string, type: string },

    user: { firstName: string, lastName: string, userName: string }

  }[] = [];


  public displayedRequests: any = [];

  public totalRequests = 0; // Total number of categopries
  public pageSizeRequests = 5;
  public currentPageRequests = 0;
  pageSizeOptionsRequests = [1, 3, 5, 10, 15, 20]

  constructor(private adminService: AdminService) { }

  ngOnInit(): void {

    this.adminService.getAllRequests().subscribe({
      next: (response) => {
        this.requests = response.requests;
        this.updateDisplayedRequests();
      }
    })

  }


  updateDisplayedRequests() {
    const startIndex = this.currentPageRequests * this.pageSizeRequests;
    const endIndex = startIndex + this.pageSizeRequests;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.requests) {
      this.displayedRequests = this.requests.slice(startIndex, endIndex);
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPageRequests = event.pageIndex;
    this.pageSizeRequests = event.pageSize;
    this.updateDisplayedRequests();
  }

}
