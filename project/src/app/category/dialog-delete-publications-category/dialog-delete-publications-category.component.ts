import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { DialogDeleteComponent } from '../dialog-delete/dialog-delete.component';

@Component({
  selector: 'app-dialog-delete-publications-category',
  templateUrl: './dialog-delete-publications-category.component.html',
  styleUrls: ['./dialog-delete-publications-category.component.css']
})
export class DialogDeletePublicationsCategoryComponent implements OnInit {

  categodyId: any;
  categoryName !: string;

  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {

    this.categodyId = data.category_id;
    this.categoryName = data.categoryName


  }

  ngOnInit(): void {
  }

  delete() {

    this.categoryService.deletePublicationsCategory(this.categodyId);
    this.dialogRef.close();


  }

}
