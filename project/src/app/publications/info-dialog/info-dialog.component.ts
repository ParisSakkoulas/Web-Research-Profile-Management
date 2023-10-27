import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PublicationsService } from '../publication.service';
import { P } from '@angular/cdk/keycodes';

@Component({
  selector: 'app-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.css']
})
export class InfoDialogComponent implements OnInit {

  publicationId: any;

  publicationObj !: { publication_id: any, title: string, abstract: string, section: string, year: string }


  tags !: { keyword: string, tagId: any }[]

  constructor(@Inject(MAT_DIALOG_DATA) public data: any, public publicationService: PublicationsService, public dialogRef: MatDialogRef<InfoDialogComponent>, public dialog: MatDialog) {

    this.publicationId = this.data.id;


  }

  ngOnInit(): void {

    this.publicationService.getPublication(this.publicationId).subscribe(p => {

      console.log(p)

      if (p.publication) {

        this.publicationObj = {
          title: p.publication.title,
          publication_id: p.publication.publication_id,
          abstract: p.publication.abstract,
          section: p.publication.section,
          year: p.publication.year,
        }

        this.tags = p.publication.tags;
        console.log(this.tags)

      }



    });



  }

}
