import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';

@Component({
  selector: 'app-dialog-replace-presentantion-file',
  templateUrl: './dialog-replace-presentantion-file.component.html',
  styleUrls: ['./dialog-replace-presentantion-file.component.css']
})
export class DialogReplacePresentantionFileComponent implements OnInit {


  //Presentantion File
  selectedFile!: File;
  fileName = '';
  fileSected = false;
  typeFiles = false;
  selectedFileAccess = 'Public';
  selectedAccessContentFile = 'Public';

  contentId: any;
  publicationName !: string;
  content_file_name !: string;
  public contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[] = [];



  constructor(private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService) {
    this.contentId = data.presentantion_file_id;
    this.publicationName = data.publicationName;
    this.content_file_name = data.presentantion_file_name

  }



  ngOnInit(): void {
  }


  onFilePresentantionSelected(event: any): void {

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


  replace() {


    this.publicationService.replacePresentantionFile(this.contentId, this.selectedFile, this.selectedAccessContentFile)

    this.dialogRef.close();
  }

}
