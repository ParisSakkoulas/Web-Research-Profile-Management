import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';

@Component({
  selector: 'app-dialog-export-many-publications',
  templateUrl: './dialog-export-many-publications.component.html',
  styleUrls: ['./dialog-export-many-publications.component.css']
})
export class DialogExportManyPublicationsComponent implements OnInit {


  publicationNames!: string[];
  publicationIds!: any[];
  exportingFileType: string[] = ['.bib (Bib Text)', '.rdf (Zotero)'];
  typeSelection = '.bib (Bib Text)';

  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService) {

    this.publicationNames = data.publicationNames,
      this.publicationIds = data.publicationIds

    console.log(data)
  }

  ngOnInit(): void {
  }

  export() {

    let type;

    if (this.typeSelection === '.bib (Bib Text)') {
      type = '.bib'
    }
    else {
      type = '.rdf'
    }
    this.publicationService.exportManyPublications(type, this.publicationIds);



  }

}
