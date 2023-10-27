import { Component, OnInit } from '@angular/core';
import { RequestService } from '../request.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-request-created',
  templateUrl: './request-created.component.html',
  styleUrls: ['./request-created.component.css']
})
export class RequestCreatedComponent implements OnInit {


  public requestsCreated: {
    request_file_id: any, file_type: string, state: string, description: string, createdAt: Date, userId: any,

    contentFile?: { content_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }
    presentantionFile?: { presentantion_file_id: any, filename: string, access: string, path: string, publicationId: any, type: string }

  }[] = [];




  public totalrequestsCreated = 0; // Total number of categopries
  public pageSizerequestsCreated = 5;
  public currentPagerequestsCreated = 0;
  public pageSizeOptions = [0, 2, 5, 10, 15, 20]
  displayedrequestsCreated: any[] = [];

  constructor(private requestService: RequestService) { }

  ngOnInit(): void {

    this.requestService.getMyRequestsAsCreator();
    this.requestService.getMyRequestCreatedListener().subscribe({
      next: (response) => {

        console.log("REQUEST CREATED", response)
        this.requestsCreated = response;

        this.totalrequestsCreated = this.requestsCreated.length;
        this.updateDisplayedRequestsReceived();

        console.log()

      }
    })


  }


  onPageChange(event: PageEvent) {
    this.currentPagerequestsCreated = event.pageIndex;
    this.pageSizerequestsCreated = event.pageSize;

    this.updateDisplayedRequestsReceived();
  }


  updateDisplayedRequestsReceived() {
    const startIndex = this.currentPagerequestsCreated * this.pageSizerequestsCreated;
    const endIndex = startIndex + this.pageSizerequestsCreated;
    this.displayedrequestsCreated = this.requestsCreated.slice(startIndex, endIndex);
  }


  deleteRequestCreated(request_id: any) {

    this.requestService.deleteRequestCreated(request_id);


  }

}
