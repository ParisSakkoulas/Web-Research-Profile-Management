import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from '../category.service';
import { MatListOption, MatSelectionList } from '@angular/material/list';
import { PublicationsService } from 'src/app/publications/publication.service';

@Component({
  selector: 'app-dialog-add-pub',
  templateUrl: './dialog-add-pub.component.html',
  styleUrls: ['./dialog-add-pub.component.css']
})
export class DialogAddPubComponent implements OnInit {


  publicationName = "NO NAME"
  categoryId: any;
  publicationId: any;
  categories !: { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[]
  currentCategories !: { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[]

  displayMessage = false;
  @ViewChild('list') list!: MatSelectionList;


  constructor(public publicationService: PublicationsService, private dialogRef: MatDialogRef<DialogAddPubComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public categoryService: CategoryService) {


    this.publicationName = data.publicationName;
    this.publicationId = data.publicationId;

  }

  ngOnInit(): void {



    //παίρνουμε τα categories του συγκεκριμένου publication
    this.publicationService.getPublicationsCategories(this.publicationId);
    this.publicationService.getMyPublicationsCategoriesUpdatedUpdateListener().subscribe({
      next: (data) => {

        this.currentCategories = data;
        console.log(this.categories)
      }
    });

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

  add() {


    const categoryTo = this.getSelectedValue();
    const publication_id = this.publicationId;
    const toCategoryId = categoryTo?.category_id;

    if (toCategoryId && publication_id) {
      console.log("To category ", toCategoryId)
      console.log("publication_id ", publication_id)

      this.categoryService.addPublicationToCategory(toCategoryId, publication_id);
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
