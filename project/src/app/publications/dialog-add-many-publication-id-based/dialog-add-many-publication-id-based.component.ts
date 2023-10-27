import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import { PublicationsService } from '../publication.service';
import { SelectionModel } from '@angular/cdk/collections';
import { ExternalReference } from '@angular/compiler';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { Publication } from 'src/app/models/publication.model';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-dialog-add-many-publication-id-based',
  templateUrl: './dialog-add-many-publication-id-based.component.html',
  styleUrls: ['./dialog-add-many-publication-id-based.component.css']
})
export class DialogAddManyPublicationIdBasedComponent implements OnInit {


  publications:
    {
      title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, notes: string,
      article?: { jurnal: string, number: string, volume: string, pages: string, month: string },
      book?: { publisher: string, volume: string, series: string, pages: string, month: string, address: string, version: string },
      proceeding?: { editor: string, series: string, pages: string, month: string, organization: string, address: string, publisher: string },
      theses?: { school: string, type: string, month: string, address: string },
      chapterBk?: { chapter: string, publisher: string, pages: string, volume: string, series: string, type: string, month: string, address: string, version: string },
      techReport?: { address: string, month: string, number: string, type: string, tech_report_year: string, institution: string },
      other?: { subType: string, grantNumber: string, pages: string, month: string }
    }[] = [];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = ['select', 'title', 'type', 'year',];
  dataSource = new MatTableDataSource<{
    title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, notes: string,
    article?: { jurnal: string, number: string, volume: string, pages: string, month: string },
    book?: { publisher: string, volume: string, series: string, pages: string, month: string, address: string, version: string },
    proceeding?: { editor: string, series: string, pages: string, month: string, organization: string, address: string, publisher: string },
    theses?: { school: string, type: string, month: string, address: string },
    chapterBk?: { chapter: string, publisher: string, pages: string, volume: string, series: string, type: string, month: string, address: string, version: string },
    techReport?: { address: string, month: string, number: string, type: string, tech_report_year: string, institution: string },
    other?: { subType: string, grantNumber: string, pages: string, month: string }
  }>();
  selection = new SelectionModel<{
    title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, notes: string,
    article?: { jurnal: string, number: string, volume: string, pages: string, month: string },
    book?: { publisher: string, volume: string, series: string, pages: string, month: string, address: string, version: string },
    proceeding?: { editor: string, series: string, pages: string, month: string, organization: string, address: string, publisher: string },
    theses?: { school: string, type: string, month: string, address: string },
    chapterBk?: { chapter: string, publisher: string, pages: string, volume: string, series: string, type: string, month: string, address: string, version: string },
    techReport?: { address: string, month: string, number: string, type: string, tech_report_year: string, institution: string },
    other?: { subType: string, grantNumber: string, pages: string, month: string }
  }>(true, []);
  form!: FormGroup;


  selectedItems: any[] = [];
  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public dialog: MatDialog, public publicationService: PublicationsService, private store: Store) {


    this.publications = data.publications;



    this.dataSource = new MatTableDataSource(data.newPublications);
    this.dataSource.paginator = this.paginator;
    console.log(data.newPublications);
    this.form = this.fb.group({});


  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

  }

  ngOnInit(): void {
  }



  onCheckboxChange(row: any) {
    if (row.selected) {
      this.selectedItems.push(row);
    } else {
      const index = this.selectedItems.findIndex(item => item === row);
      if (index !== -1) {
        this.selectedItems.splice(index, 1);
      }
    }

  }



  addSelectedValues() {

    this.publicationService.addManyPublicationsTitleBased(this.selectedItems);
    this.dialogRef.close()

  }

  close() {
    this.dialogRef.close()
  }










}


