import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from '../category.service';
import { AuthService } from 'src/app/auth/auth.service';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { P } from '@angular/cdk/keycodes';
import { MatPaginator } from '@angular/material/paginator';
import { ExternalReference } from '@angular/compiler';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { InfoDialogComponent } from 'src/app/publications/info-dialog/info-dialog.component';
import { DialogRemoveFromComponent } from '../dialog-remove-from/dialog-remove-from.component';
import { ErrorComponent } from 'src/app/error/error.component';
import { DialogMoveToComponent } from '../dialog-move-to/dialog-move-to.component';
import { DialogDeletePublicationsCategoryComponent } from '../dialog-delete-publications-category/dialog-delete-publications-category.component';
import { DialogExportPublicationsCategoryComponent } from '../dialog-export-publications-category/dialog-export-publications-category.component';


export interface PublicationCategory {
  publication_id: any
  title: string;
  section: string;
}


@Component({
  selector: 'app-category-single',
  templateUrl: './category-single.component.html',
  styleUrls: ['./category-single.component.css']
})
export class CategorySingleComponent implements OnInit {

  category_id: any;
  category !: { category_id: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string, date?: string }[] }
  currentUser !: { firstName: string, userName: string, lastName: string };
  numberOfPublications = 0;

  displayedColumns: string[] = ['position', 'title', 'section', 'action'];
  dataSource = new MatTableDataSource<PublicationCategory>();

  @ViewChild(MatTable) table!: MatTable<PublicationCategory>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;


  categorySubscription !: Subscription;
  categoriesId: any[] = [];

  constructor(private dialog: MatDialog, private route: ActivatedRoute, public categoryService: CategoryService, public authService: AuthService) { }

  ngOnInit(): void {


    this.route.paramMap.subscribe(params => {
      this.category_id = params.get('categoryId')
      console.log("Change on params", this.category_id);

      this.categoriesId.length = 0;
      console.log(this.categoriesId)
      this.getCurrentCategory(this.category_id)
      this.getUserData();
      this.getCategoriesIds();





    })

    this.categorySubscription = this.categoryService.getSingleCategoryUpdateListener().subscribe({
      next: (category) => {
        this.getCurrentCategory(category.category_id)

        console.log(category)
      }
    })
  }



  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.setDataSourceAttributes();
  }

  setDataSourceAttributes() {
    this.dataSource.paginator = this.paginator;
  }


  getCurrentCategory(id: any) {

    this.categoryService.getSingleCategory(id).subscribe({
      next: (response) => {
        this.category = response.category
        this.numberOfPublications = response.category.publicationcategories.length
        this.dataSource = new MatTableDataSource(response.category.publicationcategories)
      }
    });


  }


  getUserData() {

    this.authService.getUserData().subscribe({
      next: (response) => {
        this.currentUser = {
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          userName: response.user.userName,
        }
      }
    })

  }


  getCategoriesIds() {
    this.categoryService.getAllMyCategories();
    this.categorySubscription = this.categoryService.getCategoriesUpdateListener().subscribe({
      next: (categories) => {


        categories.map(c => {
          if (c.category_id != this.category_id) {

            this.categoriesId.push(c.category_id)
          }

        });

        console.log(this.categoriesId)
      }
    })
  }


  openDialogInfoPublication(id: any) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      id: id
    };
    dialogConfig.panelClass = 'info_pub_class'
    this.dialog.open(InfoDialogComponent, dialogConfig)

  }



  openDialogForRemovePublicationFromCategory(id: any, publicationName: string) {

    const dialogConfig = new MatDialogConfig();
    if (this.category.name === 'Uncategorized') {
      dialogConfig.panelClass = 'success_class'
      dialogConfig.data = {
        message: 'You can only move Publications from this List'
      };
      this.dialog.open(ErrorComponent, dialogConfig)
    }

    else {
      dialogConfig.data = {
        id: id,
        categoryId: Number(this.category_id),
        publicationName: publicationName
      };

      this.dialog.open(DialogRemoveFromComponent, dialogConfig)
    }



  }


  openDialogForMovePublicationToAnotherCategory(id: any, publicationName: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      publicationName: publicationName,
      publicationId: id,
      fromCategoryId: this.category_id

    };

    this.dialog.open(DialogMoveToComponent, dialogConfig)

  }


  openDialogDeletePublicationsCategory() {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      category_id: this.category_id,
      categoryName: this.category.name
    };

    this.dialog.open(DialogDeletePublicationsCategoryComponent, dialogConfig)

  }


  openDialogExportManyPublicationsCategory() {
    const dialogConfig = new MatDialogConfig();

    dialogConfig.data = {
      categoryName: this.category.name,
      categodyId: this.category_id
    };

    this.dialog.open(DialogExportPublicationsCategoryComponent, dialogConfig)

  }


  ngOnDestroy(): void {
    this.categorySubscription.unsubscribe()
  }

}
