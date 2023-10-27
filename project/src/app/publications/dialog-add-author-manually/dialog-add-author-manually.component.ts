import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { CategoryService } from 'src/app/category/category.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { PublicationsService } from '../publication.service';

@Component({
  selector: 'app-dialog-add-author-manually',
  templateUrl: './dialog-add-author-manually.component.html',
  styleUrls: ['./dialog-add-author-manually.component.css']
})
export class DialogAddAuthorManuallyComponent implements OnInit {

  constructor(public publicationService: PublicationsService, private fb: FormBuilder, public categoryService: CategoryService, public dialogRef: MatDialogRef<DialogCreateComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog) { }



  createExternalAuthorForm !: FormGroup;
  addingExternalAuthor: boolean = false;

  ngOnInit(): void {

    this.createExternalAuthorForm = this.fb.group({
      firstName: new FormControl('', Validators.required),
      lastName: new FormControl('')
    })

  }

  onAddExternalAuthor() {

    this.addingExternalAuthor = true;



    const externalAuthorCreated = {
      firstName: this.createExternalAuthorForm.value.firstName,
      lastName: this.createExternalAuthorForm.value.lastName
    }

    this.publicationService.addExternalAuthor(this.createExternalAuthorForm.value.firstName, this.createExternalAuthorForm.value.lastName).subscribe({

      next: (response) => {

        console.log(response)

        this.dialogRef.close(response)

      }
    })




  }


  closeMatDialog() {
    this.dialogRef.close()
  }

}
