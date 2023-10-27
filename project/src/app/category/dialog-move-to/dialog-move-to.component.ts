import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { MatListOption, MatSelectionList } from '@angular/material/list';

@Component({
  selector: 'app-dialog-move-to',
  templateUrl: './dialog-move-to.component.html',
  styleUrls: ['./dialog-move-to.component.css']
})
export class DialogMoveToComponent implements OnInit {

  publicationName = "NO NAME"
  categoryId: any;
  publicationId: any;

  displayMessage = false;

  @ViewChild('list') list!: MatSelectionList;


  categories !: { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[]

  constructor(private dialogRef: MatDialogRef<DialogMoveToComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {


    this.publicationName = data.publicationName;
    this.publicationId = data.publicationId,
      this.categoryId = Number(data.fromCategoryId)

    console.log(data)

  }

  ngOnInit(): void {

    this.categoryService.getAllMyCategories();
    this.categoryService.getCategoriesUpdateListener().subscribe({
      next: (response) => {

        this.categories = response.filter(c => {
          return c.name !== 'All'
        })



      }
    })

  }


  getSelectedValue(): { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] } | null {
    const selectedOptions: MatListOption[] = this.list.selectedOptions.selected;
    if (selectedOptions.length > 0) {
      return selectedOptions[0].value;
    }
    return null;
  }


  move() {


    const categoryTo = this.getSelectedValue();
    const fromCategoryId = this.categoryId;
    const publication_id = this.publicationId;
    const toCategoryId = categoryTo?.category_id;

    if (toCategoryId && fromCategoryId && publication_id) {
      console.log("To category ", toCategoryId)
      console.log("From category ", fromCategoryId)
      console.log("publication_id ", publication_id)

      this.categoryService.movePublicationToCategory(fromCategoryId, toCategoryId, publication_id);
      this.dialogRef.close()

    }

    else {
      this.displayMessage = true
    }

  }


  toogleMessage() {
    this.displayMessage = false;
  }

}
