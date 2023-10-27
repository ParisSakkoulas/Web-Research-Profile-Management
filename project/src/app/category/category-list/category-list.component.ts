import { Component, OnDestroy, OnInit } from '@angular/core';
import { CategoryService } from '../category.service';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogDeleteComponent } from '../dialog-delete/dialog-delete.component';
import { Subject, Subscription } from 'rxjs';
import { DialogCreateComponent } from '../dialog-create/dialog-create.component';
import { DialogDeleteManyComponent } from '../dialog-delete-many/dialog-delete-many.component';

@Component({
  selector: 'app-category-list',
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
})
export class CategoryListComponent implements OnInit, OnDestroy {




  selectionEnabled = false;
  numOfSelections = 0;
  categoriesCheck!: { category_id: any, name: string, description: string, selected: boolean }[];

  selectAll = false;

  public totalCategories = 0; // Total number of categopries
  public pageSize = 5;
  public currentPage = 0;
  displayedCategories: any[] = [];


  categorySubscription !: Subscription;




  constructor(public categoryService: CategoryService, private dialog: MatDialog) { }

  ngOnInit(): void {




    this.categoryService.getAllMyCategories();
    this.categorySubscription = this.categoryService.getCategoriesUpdateListener().subscribe({
      next: (categories) => {

        console.log(categories)
        this.categoriesCheck = categories.map(c => {
          return {
            category_id: c.category_id,
            name: c.name,
            description: c.description,
            selected: false
          }
        });

        this.totalCategories = categories.length;
        this.updateDisplayedCategories()
      }
    })




  }


  //Μέθοδος για επιλογή μιας κατηγορίας από την λίστα
  selectCategory(category_id: any) {
    this.selectionEnabled = true
    const category = this.categoriesCheck.find(category => category.category_id === category_id);
    if (category) {
      category.selected = !category.selected;
      if (category.selected === true) {
        this.numOfSelections += 1;
      }
      else {
        this.numOfSelections -= 1;
      }

      console.log(this.numOfSelections)
    }
    console.log('Selected checkboxes:', this.categoriesCheck);

  }


  //Μέθοδος για την επιλογή όλων των κατηγοριών
  selectAllCategories() {
    this.selectionEnabled = true
    this.categoriesCheck.forEach(c => {


      c.selected = this.selectAll;

    })
    this.numOfSelections = this.categoriesCheck.length
  }


  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;

    this.updateDisplayedCategories();
  }

  updateDisplayedCategories() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedCategories = this.categoriesCheck.slice(startIndex, endIndex);
  }


  enableDialogForDeleteCatgory(id: any) {

    console.log(id)

    const dialogDeletionConfig = new MatDialogConfig();

    let categoryName = "";

    this.categoriesCheck.forEach(c => {

      if (c.category_id === id) {
        console.log(c.name)
        categoryName = c.name
      }


    })

    dialogDeletionConfig.disableClose = true;
    dialogDeletionConfig.autoFocus = true;
    dialogDeletionConfig.width = '800px'
    dialogDeletionConfig.data = {
      category_id: id,
      name: categoryName
    }

    this.dialog.open(DialogDeleteComponent, dialogDeletionConfig)



  }



  openDialogCreateCategory() {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      mode: 'Create'
    }

    this.dialog.open(DialogCreateComponent, dialogCreateConfig)


  }


  openDeleteManyDialog() {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';


    let categoriesToSend: { category_id: any, name: string, description: string, selected: boolean }[] = [];

    let categoriesNames: String[] = [];
    let categoriesIds: number[] = [];

    this.categoriesCheck.forEach(c => {

      if (c.selected && c.name != 'All' && c.name != 'Uncategorized') {
        categoriesToSend.push(c);
        categoriesNames.push(c.name);
        categoriesIds.push(c.category_id);

      }


    })

    dialogCreateConfig.data = {
      categories: categoriesToSend,
      categoriesNames: categoriesNames,
      categoriesIds: categoriesIds
    }

    this.dialog.open(DialogDeleteManyComponent, dialogCreateConfig)

  }


  openDialogEdit(category_id: any) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      mode: 'Edit',
      categoryId: category_id
    }

    this.dialog.open(DialogCreateComponent, dialogCreateConfig)


  }



  ngOnDestroy(): void {
    this.categorySubscription.unsubscribe()
  }


}
