import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';

@Component({
  selector: 'app-dialog-create-endorsement',
  templateUrl: './dialog-create-endorsement.component.html',
  styleUrls: ['./dialog-create-endorsement.component.css']
})
export class DialogCreateEndorsementComponent implements OnInit {

  createEndorsement !: FormGroup;

  userIdToEndorse: any;
  edorsementToSent !: { endorse_id: any, evidence: string, endorsement: string, createdAt: Date };


  constructor(private authService: AuthService, private fb: FormBuilder, public dialogRef: MatDialogRef<DialogCreateComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {


    this.userIdToEndorse = data.userId;


  }

  ngOnInit(): void {


    this.createEndorsement = this.fb.group({
      evidence: new FormControl(''),
      endorsement: new FormControl('', Validators.required)
    })
  }



  onAddNewEndorsement() {


    const endorsement = {
      evidence: this.createEndorsement.value.evidence,
      endorsement: this.createEndorsement.value.endorsement
    }

    this.authService.createNewEndorsement(this.createEndorsement.value.evidence, this.createEndorsement.value.endorsement, this.userIdToEndorse).subscribe({

      next: (response) => {


        this.edorsementToSent = response.endorsementCreated;
        this.dialogRef.close(this.edorsementToSent);


      }

    })





  }

  closeMatDialog() {
    this.dialogRef.close()

  }

}
