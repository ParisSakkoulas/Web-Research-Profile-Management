import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { PublicationsService } from '../publication.service';
import { Store } from '@ngrx/store';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ReferenceDialogComponent } from 'src/app/references/reference-dialog/reference-dialog.component';
import { SelectAuthorsDialogComponent } from 'src/app/select-authors-dialog/select-authors-dialog.component';
import { AuthService } from 'src/app/auth/auth.service';

@Component({
  selector: 'app-search-multiple-publications',
  templateUrl: './search-multiple-publications.component.html',
  styleUrls: ['./search-multiple-publications.component.css']
})
export class SearchMultiplePublicationsComponent implements OnInit {

  searchPublicationsForm !: FormGroup;

  selectedFile!: File;
  fileName = '';
  fileSected = false;
  typeFiles = false;


  userData !: { firstName: string, lastName: string, userName: string, email: string }

  constructor(private fb: FormBuilder, public publicationService: PublicationsService, private store: Store, public dialogRef: MatDialog, private userService: AuthService,) { }

  ngOnInit(): void {



    this.searchPublicationsForm = this.fb.group({
      authorName: new FormControl(null, [Validators.required])
    })

    this.userService.getUserData().subscribe({
      next: (response) => {

        this.userData = response.user;

        if (this.userData.firstName && this.userData.lastName) {
          //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το isbn
          this.searchPublicationsForm = this.fb.group({
            authorName: new FormControl(this.userData.firstName + " " + this.userData.lastName, [Validators.required])
          })
        }

        else {
          //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το isbn
          this.searchPublicationsForm = this.fb.group({
            authorName: new FormControl(null, [Validators.required])
          })
        }



      }
    })



  }


  searchPublicationBasedOnAuthor() {

    if (this.searchPublicationsForm.invalid) {
      return
    }

    //console.log(this.searchPublicationsForm.value.authorName)

    this.store.dispatch(setLoadingAction({ status: true }));
    console.log(this.searchPublicationsForm.value.authorName)
    this.publicationService.searchAuthor(this.searchPublicationsForm.value.authorName).subscribe({
      next: (result) => {
        console.log(result)
        this.searchPublicationsForm.reset();

        if (result.Authors) {
          const selectDialogConfig = new MatDialogConfig();

          selectDialogConfig.data = { authors: result.Authors }
          selectDialogConfig.panelClass = 'author_class_dialog'
          this.dialogRef.open(SelectAuthorsDialogComponent, selectDialogConfig);



        }

        this.store.dispatch(setLoadingAction({ status: false }));
      },
      error: (error) => {
        console.log(error)
        this.store.dispatch(setLoadingAction({ status: false }));
      }
    })



  }


  onSubmit(): void {
    if (this.selectedFile) {
      const formData = new FormData();
      formData.append('file', this.selectedFile);

    }
  }


  onFileSelected(event: any): void {

    const file: File = event.target.files[0];

    if (file) {

      if (file.name.includes('.bib')) {
        this.fileSected = true
        this.fileName = file.name;
        console.log(this.fileName)
        this.selectedFile = file;

        const formData = new FormData();
        formData.append("descriptionFile", file);
        console.log(file)

      }

      if (file.name.includes('.rdf')) {
        console.log("RDF");

        this.fileSected = true
        this.fileName = file.name;
        this.selectedFile = file;
        const formData = new FormData();
        formData.append("descriptionFile", file);
        console.log(file)
      }
    }

    else {

      this.typeFiles = true

    }

  }


  uploadFile() {

    console.log(this.selectedFile)
    const file = this.selectedFile;
    if (file) {
      this.store.dispatch(setLoadingAction({ status: true }));
      this.publicationService.addDesctriptionFile(this.selectedFile)
    }

  }

}
