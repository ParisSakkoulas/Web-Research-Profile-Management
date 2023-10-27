
import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { ExternalReference } from 'src/app/models/externalReference.model';
import { PublicationsService } from 'src/app/publications/publication.service';

@Component({
  selector: 'app-reference-dialog',
  templateUrl: './reference-dialog.component.html',
  styleUrls: ['./reference-dialog.component.css']
})
export class ReferenceDialogComponent implements AfterViewInit {


  public refs: ExternalReference[] = [];
  private publicationId: any;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  displayedColumns: string[] = ['select', 'position', 'title', 'year', 'link'];
  dataSource = new MatTableDataSource<ExternalReference>();
  selection = new SelectionModel<ExternalReference>(true, []);

  constructor(private fb: FormBuilder, private dialogRef: MatDialogRef<ReferenceDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public publicationService: PublicationsService) {

    this.refs = data.references;
    this.publicationId = data.publicationId;
    this.dataSource = new MatTableDataSource(this.refs);
  }



  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;

  }

  referencesForm = this.fb.group({
    title: false,
    year: false,
    link: false,
  });


  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }

    this.selection.select(...this.dataSource.data);
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: ExternalReference): string {
    if (!row) {
      return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }


  viewReferenceLink(link: string) {

    window.open(link, '_blank');

  }

  onAddReferences() {

    console.log(this.publicationId)

    this.publicationService.addReferencePublication(this.selection.selected, this.publicationId)
    this.dialogRef.close()
  }

  close() {
    this.dialogRef.close()
  }



}
