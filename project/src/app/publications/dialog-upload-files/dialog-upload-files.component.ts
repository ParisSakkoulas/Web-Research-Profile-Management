import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';

@Component({
  selector: 'app-dialog-upload-files',
  templateUrl: './dialog-upload-files.component.html',
  styleUrls: ['./dialog-upload-files.component.css']
})
export class DialogUploadFilesComponent implements OnInit {

  public publicationId: string
  publicationName = 'Pub 1';

  //Presentantion File
  selectedPresentantionFile!: File;
  fileNamePresentantion = '';
  fileSectedPresentantion = false;
  typeFilesPresentantion = false;
  selectedPresentantionFileAccess = 'Public';
  selectedAccessPresentantionFile = 'Public'



  //Content File
  selectedFile!: File;
  fileName = '';
  fileSected = false;
  typeFiles = false;
  selectedFileAccess = 'Public';
  selectedAccessContentFile = 'Public';

  //για τα αρχεία
  public contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[] = [];
  public presentantionFiles: { presentantion_file_id: any, filename: string, path: string, type: string, access: string }[] = [];


  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService,) {

    this.publicationId = data.publicationId;
    this.publicationName = data.publicationName
  }

  ngOnInit(): void {

    //Καλούμε το service του Publication για να πάρουμε ότι αρχείo έχει η συγκεκριμένη δημοσίευση
    this.publicationService.getPublicationsFiles(this.publicationId);
    //Αποθήκευση τιμών αρχείων περιεχομένου
    this.publicationService.getMyPublicationsContentFilesUpdatedUpdateListener().subscribe({
      next: (response) => {
        this.contentFiles = response;
        console.log(this.contentFiles)

      }
    })
    //Αποθήκευση τιμών αρχείων παρουσίασης
    this.publicationService.getMyPublicationsPresentantionFilesUpdatedListener().subscribe({
      next: (response) => {
        this.presentantionFiles = response;
        console.log(this.presentantionFiles)
      }
    })
  }


  onFilePresentantionSelected(event: any): void {

    const file: File = event.target.files[0];



    if (file) {

      //console.log(file)
      console.log(file.name)
      this.fileSectedPresentantion = true
      this.fileNamePresentantion = file.name;
      this.selectedPresentantionFile = file;

    }

    else {

      this.typeFilesPresentantion = true

    }
  }

  onFileContentSelected(event: any): void {

    const file: File = event.target.files[0];

    if (file) {

      console.log(file)
      this.fileSected = true
      this.fileName = file.name;
      this.selectedFile = file;
    }

    else {

      this.typeFiles = true

    }

  }

  upload() {

    console.log(this.selectedFile)
    console.log(this.selectedPresentantionFile)

    if (this.selectedFile || this.selectedPresentantionFile) {
      this.publicationService.uploadFilesForPublication(this.publicationId, this.selectedFile, this.selectedAccessContentFile, this.selectedPresentantionFile, this.selectedAccessPresentantionFile)
      this.dialogRef.close()


    }


  }

}
