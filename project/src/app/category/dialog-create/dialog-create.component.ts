import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../category.service';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { SuccessComponent } from 'src/app/success/success.component';

@Component({
  selector: 'app-dialog-create',
  templateUrl: './dialog-create.component.html',
  styleUrls: ['./dialog-create.component.css']
})
export class DialogCreateComponent implements OnInit {


  createDialogForm !: FormGroup;
  categoryCreating = false;
  mode: any
  categoryId: any;
  buttonType = 'Add'

  category !: { category_id: any, name: string, description: string }

  constructor(private fb: FormBuilder, public categoryService: CategoryService, public dialogRef: MatDialogRef<DialogCreateComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog) {

    this.mode = data.mode;
    this.categoryId = data.categoryId;

    this.createDialogForm = this.fb.group({
      name: new FormControl('', Validators.required),
      description: new FormControl('')
    })
  }



  ngOnInit(): void {



    if (this.mode === 'Create') {
      this.buttonType = 'Add'
      //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης
      this.createDialogForm = this.fb.group({
        name: new FormControl('', Validators.required),
        description: new FormControl('')
      })
    }

    else {

      this.buttonType = 'Update'

      this.categoryService.getSingleCategory(this.categoryId).subscribe({
        next: (response) => {
          this.category = response.category;
          console.log(this.category)
          this.createDialogForm.patchValue({
            name: this.category.name,
            description: this.category.description
          })


        }
      })



      /*
      this.createDialogForm.patchValue({
        name: this.category.name,
        description: this.category.description
      })*/
    }

  }


  onAddNewCategory() {


    if (this.createDialogForm.invalid) {
      return
    }

    if (this.mode === 'Create') {

      this.categoryCreating = true;
      const categoryObj = {
        category_id: null,
        name: this.createDialogForm.value.name,
        description: this.createDialogForm.value.description
      }



      this.categoryService.addNewCategory(categoryObj);
      this.createDialogForm.reset();
      this.categoryCreating = false;
      this.dialogRef.close();

    }

    else {

      const categoryObj = {
        category_id: null,
        name: this.createDialogForm.value.name,
        description: this.createDialogForm.value.description
      }
      this.categoryService.updateCategory(this.categoryId, categoryObj);
      this.dialogRef.close();

    }



  }


  close() {

    this.dialogRef.close();

  }

}
