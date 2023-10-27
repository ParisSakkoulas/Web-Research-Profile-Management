import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { DialogDeleteComponent } from '../dialog-delete/dialog-delete.component';
import { PublicationsService } from 'src/app/publications/publication.service';

@Component({
  selector: 'app-dialog-export-publications-category',
  templateUrl: './dialog-export-publications-category.component.html',
  styleUrls: ['./dialog-export-publications-category.component.css']
})
export class DialogExportPublicationsCategoryComponent implements OnInit {

  categodyId: any;
  categoryName !: string;

  exportingFileType: string[] = ['.bib (Bib Text)', '.rdf (Zotero)'];
  typeSelection = '.bib (Bib Text)';

  constructor(public publicationService: PublicationsService, private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {
    this.categodyId = data.categodyId;
    this.categoryName = data.categoryName

    console.log(this.categoryName)

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


    console.log(this.categodyId)
    this.publicationService.exportPublicationsCategory(type, this.categodyId);

  }

}
