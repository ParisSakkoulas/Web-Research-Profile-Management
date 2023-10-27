import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { AdminAuthGuard } from '../../admin-auth.guard';
import { AdminService } from '../../admin.service';

@Component({
  selector: 'app-dialog-admin-add-job',
  templateUrl: './dialog-admin-add-job.component.html',
  styleUrls: ['./dialog-admin-add-job.component.css']
})
export class DialogAdminAddJobComponent implements OnInit {


  setJob !: FormGroup;

  years!: number[];
  startYear!: number;
  endYear!: number | null;

  job !: { job_id: any, title: string, company: string, startYear: string, endYear: string }
  userId !: string;
  message !: string;


  mode !: string;
  buttonText = 'Add';

  constructor(public adminService: AdminService, private store: Store, private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogCreateComponent>) {

    this.mode = data.mode;
    this.userId = data.user.user_id
    console.log(data)
    if (this.mode === 'edit') {

      this.job = data.job;
      this.buttonText = 'Save'


    }

  }

  ngOnInit(): void {

    this.setJob = this.fb.group({
      title: new FormControl('', Validators.required),
      company: new FormControl('', Validators.required),
      startYear: new FormControl('', Validators.required),
      endYear: new FormControl('', Validators.required),

    })



    this.years = this.generateYearArray(1900, new Date().getFullYear());

    this.setJob.patchValue({
      startYear: 2000,
      endYear: 2023,

    })
    this.startYear = 2000;
    this.endYear = 2023;

    if (this.mode === 'edit') {
      this.setJob.patchValue({
        startYear: Number(this.job.startYear),
        endYear: Number(this.job.endYear),
        title: this.job.title,
        company: this.job.company,


      })
    }

  }


  generateYearArray(startYear: number, endYear: number): number[] {
    const years = [];
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    return years;
  }

  onStartingYearChange(): void {
    if (this.endYear && this.endYear < this.startYear) {
      this.endYear = null;
    }
  }

  onSetJob() {




    if (this.mode === 'create') {

      const jobObj = {
        title: this.setJob.value.title,
        company: this.setJob.value.company,
        startYear: this.setJob.value.startYear,
        endYear: this.setJob.value.endYear,

      }

      this.adminService.addNewJob(this.userId, jobObj).subscribe({
        next: (response) => {
          this.message = response.message;
          this.dialogRef.close({ job: response.job, message: this.message });
        }
      });


    }

    if (this.mode === 'edit') {

      const jobObj = {
        job_id: this.job.job_id,
        title: this.setJob.value.title,
        company: this.setJob.value.company,
        startYear: this.setJob.value.startYear,
        endYear: this.setJob.value.endYear,

      }


      this.adminService.updateJob(jobObj).subscribe({
        next: (response) => {
          this.message = response.message;
          this.dialogRef.close({ job: response.job, message: this.message });
        }
      });

    }

  }

  closeMatDialog() {
    this.dialogRef.close();
  }

}
