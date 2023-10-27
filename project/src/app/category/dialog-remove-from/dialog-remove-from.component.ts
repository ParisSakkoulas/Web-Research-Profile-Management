import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '../category.service';

@Component({
  selector: 'app-dialog-remove-from',
  templateUrl: './dialog-remove-from.component.html',
  styleUrls: ['./dialog-remove-from.component.css']
})
export class DialogRemoveFromComponent implements OnInit {


  publicationName = "Publication 1"
  categoryId: any;
  publicationId: any;

  constructor(private dialogRef: MatDialogRef<DialogRemoveFromComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {

    console.log(data)

    this.publicationName = data.publicationName;
    this.publicationId = data.id,
      this.categoryId = data.categoryId


  }

  ngOnInit(): void {
  }

  remove() {

    this.categoryService.removePublicationFromCategory(this.publicationId, this.categoryId);
    this.dialogRef.close()

  }

}
