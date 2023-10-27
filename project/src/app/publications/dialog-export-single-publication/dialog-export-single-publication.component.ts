import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';

@Component({
  selector: 'app-dialog-export-single-publication',
  templateUrl: './dialog-export-single-publication.component.html',
  styleUrls: ['./dialog-export-single-publication.component.css']
})
export class DialogExportSinglePublicationComponent implements OnInit {

  publicationName = 'Pub 1';
  publicationId: any;
  exportingFileType: string[] = ['.bib (BIBTEXT)', '.rdf (Zotero)'];
  typeSelection = '.bib (BIB Text)';


  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService) {

    this.publicationName = data.publicationName,
      this.publicationId = data.publicationId

    console.log(data)
  }

  export() {

    let type;

    if (this.typeSelection === '.bib (BIBTEXT)') {
      type = '.bib'
    }
    else {
      type = '.rdf'
    }

    this.publicationService.exportSinglePublication(type, this.publicationId)

  }

  ngOnInit(): void {
  }

}
