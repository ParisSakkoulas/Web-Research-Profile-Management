import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { PublicationsService } from '../publication.service';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';

@Component({
  selector: 'app-dialog-add-ref-manual',
  templateUrl: './dialog-add-ref-manual.component.html',
  styleUrls: ['./dialog-add-ref-manual.component.css']
})
export class DialogAddRefManualComponent implements OnInit {

  createExternalRefForm !: FormGroup;
  addingExternalRefAuthor: boolean = false;

  constructor(public publicationService: PublicationsService, private fb: FormBuilder, public dialogRef: MatDialogRef<DialogCreateComponent>,) { }

  ngOnInit(): void {

    this.createExternalRefForm = this.fb.group({
      title: new FormControl('', Validators.required),
      year: new FormControl(null, Validators.pattern(/(?:(?:15|16|17|18|19|20|21)[0-9]{2})/)),
      link: new FormControl('')
    })
  }


  onAddExternalRef() {

    this.addingExternalRefAuthor = true;


    this.publicationService.addExternalRef(this.createExternalRefForm.value.title, this.createExternalRefForm.value.year, this.createExternalRefForm.value.link).subscribe({

      next: (response) => {

        console.log(response)

        this.dialogRef.close(response.externlRefCreated.title)

      }
    })

  }


  closeMatDialog() {
    this.dialogRef.close()
  }

}
