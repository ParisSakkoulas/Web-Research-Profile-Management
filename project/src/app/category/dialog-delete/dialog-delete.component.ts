import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { SuccessComponent } from 'src/app/success/success.component';

@Component({
  selector: 'app-dialog-delete',
  templateUrl: './dialog-delete.component.html',
  styleUrls: ['./dialog-delete.component.css']
})
export class DialogDeleteComponent implements OnInit {

  categoryName = 'Category 1';
  category_id: any

  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService, private store: Store) {

    this.categoryName = data.name;
    this.category_id = data.category_id;

    console.log(this.categoryName)
    console.log(this.category_id)



  }

  ngOnInit(): void {
  }


  close() {

    this.dialogRef.close();

  }

  delete() {

    this.categoryService.deleteSingleCategory(this.category_id)
    this.dialogRef.close();

  }

}


