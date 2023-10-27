import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { setLoadingAction } from 'src/app/core/state/spinner';

@Component({
  selector: 'app-add-new-organization',
  templateUrl: './add-new-organization.component.html',
  styleUrls: ['./add-new-organization.component.css']
})
export class AddNewOrganizationComponent implements OnInit {

  setOrganization !: FormGroup;


  organization !: { organization_id: any, name: string, description: string };
  mode !: string;
  buttonText = 'Add';


  constructor(public authService: AuthService, private store: Store, private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogCreateComponent>) {

    this.mode = data.mode

    console.log(data)

    if (this.mode === 'edit') {

      this.organization = data.organization;
      this.buttonText = 'Save'

    }

  }

  ngOnInit(): void {


    this.setOrganization = this.fb.group({
      Name: new FormControl('', Validators.required),
      Description: new FormControl('')
    });

    if (this.mode === 'edit') {

      this.setOrganization.patchValue({
        Name: this.organization.name,
        Description: this.organization.description
      })

    }


  }

  onSetOrganization() {

    this.store.dispatch(setLoadingAction({ status: true }));


    if (this.mode === 'edit') {
      const organization = {
        name: this.setOrganization.value.Name,
        description: this.setOrganization.value.Description
      }

      console.log("Edit")

      this.authService.updateOrganization(this.organization.organization_id, organization);
      this.dialogRef.close();


    }

    else if (this.mode === 'create') {

      const organization = {
        name: this.setOrganization.value.Name,
        description: this.setOrganization.value.Description
      }


      this.authService.addOrganizationData(organization);
      this.dialogRef.close();

    }
  }

  closeMatDialog() {
    this.dialogRef.close()
  }

}
