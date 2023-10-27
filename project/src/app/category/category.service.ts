import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Subject, map, tap } from 'rxjs';
import { SuccessComponent } from '../success/success.component';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {


  private categoriesUpdated = new Subject<{ category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[]>();
  categories: { category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }[] = [];

  private categoryUpdated = new Subject<{ category_id?: any, name: string, description: string, publicationcategories?: { publication_id: any, title: string, section: string }[] }>();


  constructor(private http: HttpClient, public dialog: MatDialog) { }

  addNewCategory(category: { category_id: null, name: string, description: string }) {
    const categoryToAdd = category;
    this.http.post<{ message: string, category: { state: string, category_id: any, name: string, description: string } }>("https://localhost:3000/categories/addCategory", category)
      .subscribe(response => {
        const id = response.category.category_id;
        categoryToAdd.category_id = id;
        console.log(categoryToAdd)
        this.categories.push(categoryToAdd)
        this.categoriesUpdated.next([...this.categories]);
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);

      })

  }


  getCategoriesUpdateListener() {
    return this.categoriesUpdated.asObservable();
  }

  getSingleCategoryUpdateListener() {
    return this.categoryUpdated.asObservable();
  }


  getAllMyCategories() {

    this.http.get<{ message: string, categories: { category_id: any, name: string, description: string, publicationcategories: { publication_id: any, title: string, section: string }[] }[] }>("https://localhost:3000/categories/allMyCategories").pipe(map((postData) => {
      return postData.categories.map(category => {
        return {
          name: category.name,
          description: category.description,
          category_id: category.category_id,
          publicationcategories: category.publicationcategories
        };
      });
    }))
      .subscribe(transformetCategories => {
        this.categories = transformetCategories;
        this.categoriesUpdated.next([...this.categories]);
      });



  }


  getSingleCategory(id: any) {
    return this.http.get<{ message: string, category: { category_id: any, name: string, description: string, publicationcategories: { publication_id: any, title: string, section: string }[] } }>("https://localhost:3000/categories/singleCategory/" + id);
  }


  updateCategory(id: any, newCategory: { name: string, description: string }) {


    this.http.put<{ message: string, category_id: any }>("https://localhost:3000/categories/" + id, newCategory).subscribe({

      next: (response) => {
        console.log(response)

        const id = Number(response.category_id);



        const updatedCategories = this.categories.filter(c => {

          if (c.category_id === id) {
            console.log(c)
            c.category_id = id,
              c.description = newCategory.description,
              c.name = newCategory.name

            return c
          }
          return c
        })

        console.log(updatedCategories)
        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    });
  }

  removePublicationFromCategory(id: any, cId: any) {

    console.log(id, cId)

    this.http.delete<{ message: string }>("https://localhost:3000/publications/removePublicationFromCategory", { body: { publicationId: id, categeryFromId: cId } }).subscribe({

      next: (result) => {



        const updatedCategories = this.categories.filter(c => {

          if (c.category_id === cId) {


            c.publicationcategories = c.publicationcategories?.filter(p => {

              console.log(p.publication_id !== id)
              p.publication_id !== id
              return p.publication_id !== id;
            })

            this.categoryUpdated.next(c)

          }
          return true;

        })

        console.log(updatedCategories)
        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);




        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: result.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }


    })


  }


  movePublicationToCategory(categeryFromId: any, categeryToId: any, publicationId: any) {

    const postInfo = {
      categeryFromId: categeryFromId,
      categeryToId: categeryToId,
      publicationId: publicationId

    }

    console.log(postInfo)


    this.http.post<{ message: string }>("https://localhost:3000/publications/movePublicationToCategory", postInfo).subscribe({
      next: (response) => {

        console.log(response)
        let publicationTo: { publication_id: any, title: string, section: string };
        const updatedCategories = this.categories.map(c => {


          if (c.category_id === categeryFromId) {
            console.log(c)

            c.publicationcategories?.map(p => {
              if (p.publication_id === publicationId)
                publicationTo = p
            })

            c.publicationcategories = c.publicationcategories?.filter(pc => pc.publication_id !== publicationId);
            this.categoryUpdated.next(c)
            return c;

          }

          if (c.category_id === categeryToId) {
            c.publicationcategories?.push(publicationTo);
            return c;
          }

          return c;


        })

        console.log(updatedCategories)
        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);





        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);





      }
    })


  }


  addPublicationToCategory(categoryId: any, publicationId: any) {

    const postInfo = {
      categoryId: categoryId,
      publicationId: publicationId
    }


    this.http.post<{ message: string }>("https://localhost:3000/publications/addPublicationToCategory", postInfo).subscribe({
      next: (response) => {

        console.log(response)

        let publicationTo: { publication_id: any, title: string, section: string };
        const updatedCategories = this.categories.map(c => {

          c.publicationcategories?.map(p => {
            if (p.publication_id === publicationId)
              publicationTo = p
          })



          if (c.category_id === categoryId) {
            c.publicationcategories?.push(publicationTo);
            return c;
          }

          return c;


        })

        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    })

  }

  addPublicationsToCategory(categoryId: any, publicationsId: any[]) {

    console.log(categoryId)
    console.log(publicationsId)
    const obj = {
      publicationsId: publicationsId,
      categoryId: categoryId
    }

    this.http.post<{ message: string }>("https://localhost:3000/publications/addManyPublicationsToCategory", obj).subscribe({
      next: (response) => {

        console.log(response)
        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);

      }
    })

  }

  deleteSingleCategory(id: any) {

    this.http.delete<{ message: string }>("https://localhost:3000/categories/deleteSingle/" + id).subscribe({

      next: (result) => {

        const updatedCategories = this.categories.filter(c => c.category_id !== id);
        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: result.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }


    })


  }

  deleteManyCategories(id: any[]) {

    const obj = {
      categories_id: id
    }


    this.http.delete<{ message: string }>("https://localhost:3000/categories/deleteMany", { body: obj }).subscribe({
      next: (response) => {


        const updatedCategories = this.categories.filter(c => !id.includes(c.category_id));
        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);
        console.log(response)

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }
    });
  }


  deletePublicationsCategory(id: any) {

    this.http.delete<{ message: string }>("https://localhost:3000/categories/deletePublicationsCategory/" + id).subscribe({

      next: (response) => {
        console.log(response)



        const updatedCategories = this.categories.filter(c => {

          if (Number(c.category_id) === Number(id)) {
            console.log(c)

            c.publicationcategories = []
            this.categoryUpdated.next(c)
            return c;

          }

          return true

        })

        this.categories = updatedCategories;
        this.categoriesUpdated.next([...this.categories]);




        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }


    })



  }




}
