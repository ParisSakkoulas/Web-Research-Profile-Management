import { Component, OnInit } from '@angular/core';
import { RequestService } from '../request.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-request-received',
  templateUrl: './request-received.component.html',
  styleUrls: ['./request-received.component.css']
})
export class RequestReceivedComponent implements OnInit {



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

  public totalRequestsReceived = 0; // Total number of categopries
  public pageSizeRequestsReceived = 5;
  public currentPageRequestsReceived = 0;
  public pageSizeOptions = [0, 2, 5, 10, 15, 20]
  displayedRequestsReceived: any[] = [];


  constructor(private requestService: RequestService) { }

  ngOnInit(): void {

    this.requestService.getMyRequestAsReceiver();
    this.requestService.getMyRequestReceivedListener().subscribe({
      next: (response) => {

        console.log(response)
        this.requestsReceived = response;

        this.totalRequestsReceived = this.requestsReceived.length;
        this.updateDisplayedRequestsReceived();

      }
    })
  }



  onPageChange(event: PageEvent) {
    this.currentPageRequestsReceived = event.pageIndex;
    this.pageSizeRequestsReceived = event.pageSize;

    this.updateDisplayedRequestsReceived();
  }


  updateDisplayedRequestsReceived() {
    const startIndex = this.currentPageRequestsReceived * this.pageSizeRequestsReceived;
    const endIndex = startIndex + this.pageSizeRequestsReceived;
    this.displayedRequestsReceived = this.requestsReceived.slice(startIndex, endIndex);
  }


  removeRequest(id: any) {

    this.requestService.removeRequestReceived(id);

  }

  declineRequest(id: any) {
    console.log(id)
    this.requestService.declineRequest(id);
  }


  acceptRequest(id: any) {
    console.log(id)
    this.requestService.acceptRequestReceived(id);
  }

}
