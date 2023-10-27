import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ReferenceDialogComponent } from '../references/reference-dialog/reference-dialog.component';
import { PublicationsService } from '../publications/publication.service';
import { SuccessComponent } from '../success/success.component';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Observable } from 'rxjs';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-select-authors-dialog',
  templateUrl: './select-authors-dialog.component.html',
  styleUrls: ['./select-authors-dialog.component.css']
})
export class SelectAuthorsDialogComponent implements OnInit {

  displayedColumns: string[] = ['Author', 'Current Job', 'title', 'year', 'link'];



  dataSource = new MatTableDataSource<{ author: string, author_id: string, current_job: string, interests: string[], pubications: { title: string, link: string, year: string }[] }>()

  authorsPerPage = 5;
  observ !: Observable<any>;

  public authors!: { author: string, author_id: string, current_job: string, interests: string[], pubications: { title: string, link: string, year: string }[] }[]
  public paginatedAuthors!: { author: string, author_id: string, current_job: string, interests: string[], pubications: { title: string, link: string, year: string }[] }[]
  public pageSize = 5; // Number of publications to display per page
  public currentPage = 0; // Current page index
  public totalAuthors = 0; // Total number of publications
  displayedAuthors: any[] = [];

  @ViewChild(MatPaginator, { static: true }) paginatorAuthors!: MatPaginator;

  addingPapers = false;

  expand_publications_mode = 'expand_more';
  expand_interest_mode = 'expand_more'



  constructor(private dialogRef: MatDialogRef<ReferenceDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, public publicationService: PublicationsService, public dialog: MatDialog) {

    this.authors = data.authors;
    this.totalAuthors = this.authors.length;
    console.log(data.authors)
  }

  ngOnInit(): void {
    this.totalAuthors = this.authors.length;
    this.updateDisplayedAuthors();

  }


  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.updateDisplayedAuthors();
  }

  updateDisplayedAuthors() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedAuthors = this.authors.slice(startIndex, endIndex);
  }



  toggleExpandPublicationMode() {

    if (this.expand_publications_mode === 'expand_less') {
      this.expand_publications_mode = 'expand_more'
    }

    else {
      this.expand_publications_mode = 'expand_less'
    }


  }

  toggleExpandInterestMode() {
    if (this.expand_interest_mode === 'expand_less') {
      this.expand_interest_mode = 'expand_more'
    }

    else {
      this.expand_interest_mode = 'expand_less'
    }
  }

  addAuthorsPaper(author_id: string, author_name: string) {
    this.addingPapers = true;
    console.log(author_id);
    this.publicationService.addPublicationsBasedonAuthor(author_id, author_name).subscribe({
      next: (result) => {


        this.addingPapers = false;

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: result.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogMessageConfig);
        console.log(result)

        this.dialogRef.close()

      }, error: (error) => {
        console.log(error)
      }
    })

  }

}
