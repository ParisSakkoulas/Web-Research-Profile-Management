import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { DialogMoveToComponent } from '../dialog-move-to/dialog-move-to.component';
import { MatListOption, MatSelectionList } from '@angular/material/list';

@Component({
  selector: 'app-dialog-move-many-publications',
  templateUrl: './dialog-move-many-publications.component.html',
  styleUrls: ['./dialog-move-many-publications.component.css']
})
export class DialogMoveManyPublicationsComponent implements OnInit {

  publicationsNames = []
  categoryId: any;
  publicationsIds = [];
  categories !: { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[]
  displayMessage = false;
  uncategorizedSelected = false;
  @ViewChild('list') list!: MatSelectionList;

  constructor(private dialogRef: MatDialogRef<DialogMoveToComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {

    this.publicationsNames = data.publicationNames,
      this.publicationsIds = data.publicationIds

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
    const publicationsIds = this.publicationsIds;
    const toCategoryId = categoryTo?.category_id;

    console.log(publicationsIds)

    if (toCategoryId && publicationsIds) {

      console.log(categoryTo.name)


      console.log(toCategoryId)
      console.log(publicationsIds)

      this.categoryService.addPublicationsToCategory(toCategoryId, publicationsIds);
      this.dialogRef.close();

    }

    else {
      this.displayMessage = true
    }

  }



  toogleMessage() {
    this.displayMessage = false;
  }

}
