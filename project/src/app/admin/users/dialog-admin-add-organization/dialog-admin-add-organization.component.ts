import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-dialog-admin-add-organization',
  templateUrl: './dialog-admin-add-organization.component.html',
  styleUrls: ['./dialog-admin-add-organization.component.css']
})
export class DialogAdminAddOrganizationComponent implements OnInit {

  setOrganization !: FormGroup;

  organization !: { organization_id: any, name: string, description: string };
  mode !: string;
  buttonText = 'Add';

  userId !: string;
  message !: string;

  constructor(public adminService: AdminService, private store: Store, private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogCreateComponent>) {

    this.mode = data.mode;
    this.userId = data.user.user_id

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



    if (this.mode === 'edit') {
      const organization = {
        name: this.setOrganization.value.Name,
        description: this.setOrganization.value.Description
      }

      console.log("Edit")

      //update org
      const organizationObj = {
        organization_id: this.organization.organization_id,
        name: this.setOrganization.value.Name,
        description: this.setOrganization.value.Description
      }
      this.adminService.updateSpecificOrganization(organizationObj).subscribe({
        next: (response) => {
          this.message = response.message;
          this.dialogRef.close({ organization: organizationObj, message: this.message });
        }
      });


    }

    else if (this.mode === 'create') {

      const organization = {
        name: this.setOrganization.value.Name,
        description: this.setOrganization.value.Description
      }


      //add org
      this.adminService.addNewOrganizationForUsere(this.userId, organization).subscribe({
        next: (response) => {
          this.message = response.message;
          this.dialogRef.close({ organization: response.organization, message: this.message });
        }
      });


    }
  }

  closeMatDialog() {
    this.dialogRef.close()
  }

}
