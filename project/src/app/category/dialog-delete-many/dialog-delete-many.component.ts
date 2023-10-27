import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { DialogDeleteComponent } from '../dialog-delete/dialog-delete.component';

@Component({
  selector: 'app-dialog-delete-many',
  templateUrl: './dialog-delete-many.component.html',
  styleUrls: ['./dialog-delete-many.component.css']
})
export class DialogDeleteManyComponent implements OnInit {


  categoriesNames !: String[];
  categories !: { category_id: any, name: string, description: string, selected: boolean }[]

  categoriesIds !: number[];


  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService,) {



    this.categories = data.categories
    this.categoriesNames = data.categoriesNames;
    this.categoriesIds = data.categoriesIds;




    console.log(data);
    console.log(this.categoriesIds)



  }

  ngOnInit(): void {
  }


  delete() {
    this.categoryService.deleteManyCategories(this.categoriesIds)
    this.dialogRef.close();
  }

}
