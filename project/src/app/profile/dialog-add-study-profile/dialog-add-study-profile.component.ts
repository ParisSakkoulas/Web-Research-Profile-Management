import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogCreateComponent } from 'src/app/category/dialog-create/dialog-create.component';
import { setLoadingAction } from 'src/app/core/state/spinner';

@Component({
  selector: 'app-dialog-add-study-profile',
  templateUrl: './dialog-add-study-profile.component.html',
  styleUrls: ['./dialog-add-study-profile.component.css']
})
export class DialogAddStudyProfileComponent implements OnInit {


  setStudy !: FormGroup;
  mode !: string;
  study !: { study_id: any, title: string, school: string, endYear: string }
  buttonText = 'Add';
  years!: number[];


  constructor(public authService: AuthService, private store: Store, private fb: FormBuilder, @Inject(MAT_DIALOG_DATA) public data: any, public dialogRef: MatDialogRef<DialogCreateComponent>) {


    this.mode = data.mode;

    console.log(data)
    if (this.mode === 'edit') {

      this.study = data.study;



      this.buttonText = 'Save'
    }
  }

  ngOnInit(): void {


    this.setStudy = this.fb.group({
      title: new FormControl('', Validators.required),
      school: new FormControl('', Validators.required),
      endYear: new FormControl('', Validators.required),

    })

    this.years = this.generateYearArray(1900, new Date().getFullYear());

    this.setStudy.patchValue({
      endYear: 2023
    })

    if (this.mode === 'edit') {
      this.setStudy.patchValue({
        title: this.study.title,
        school: this.study.school,
        endYear: Number(this.study.endYear),

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


  onSetStudy() {

    this.store.dispatch(setLoadingAction({ status: true }));


    if (this.mode === 'create') {

      const studyObj = {
        title: this.setStudy.value.title,
        school: this.setStudy.value.school,
        endYear: this.setStudy.value.endYear,

      }

      this.authService.addNewStudy(studyObj);
      this.dialogRef.close();


    }

    if (this.mode === 'edit') {

      const studyObj = {
        title: this.setStudy.value.title,
        school: this.setStudy.value.school,
        endYear: this.setStudy.value.endYear,

      }

      this.authService.updateStudy(this.study.study_id, studyObj)
      this.dialogRef.close();


    }



  }

  closeMatDialog() {
    this.dialogRef.close();
  }

}
