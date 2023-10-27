import { Component, OnInit } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {


  public publications: { publication_id: string, title: string, year: string, section: string, abstract: string, doi: string, isbn: string, accessibility: string, userId: string, user: { user_id: string, firstName: string, lastName: string, email: string } }[] = [];
  displayedPublications: any[] = [];
  public totalPublications = 0;
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [1, 3, 5, 10, 15, 20];

  filterValue!: string;

  selectedSection !: string;
  sections: String[] = ["All", "Article", "Book", "Proceedings", "Thesis", "Book Chapter", "Tech Report", "Other"];

  selectedAccess!: string;
  access: String[] = ["All", "Public", "Private"];

  filterYearValue !: string;


  constructor(public authService: AuthService) { }

  ngOnInit(): void {

    this.authService.getPublicationsFromFollowings().subscribe({
      next: (response) => {


        const publicationsArray = response.publications[0];

        this.publications = publicationsArray.map(p => ({
          publication_id: p.publication_id,
          title: p.title,
          section: p.section,
          abstract: p.abstract,
          year: p.year,
          accessibility: p.accessibility,
          doi: p.doi,
          isbn: p.isbn,
          userId: p.userId,
          user: p.user
          // Add other properties as needed
        }));
        this.totalPublications = this.publications.length
        this.updateDisplayedPublications()
      },
      error: (error) => {
        console.error('Error fetching publications:', error);
      }
    })
  }


  updateDisplayedPublications() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.publications) {
      this.displayedPublications = this.publications.slice(startIndex, endIndex);
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedPublications();
  }


  applyFilterNew() {
    this.displayedPublications = this.publications.filter(publication => {
      const lowerCaseTitle = publication.title.toLowerCase().replace(/\s+/g, ''); // Remove spaces from publication title
      const filterValueWithoutSpaces = this.filterValue ? this.filterValue.toLowerCase().replace(/\s+/g, '') : '';

      // Filter by section
      if (this.selectedSection && this.selectedSection !== 'All' && publication.section !== this.selectedSection) {
        return false; // Exclude publications that don't match the selected section
      }

      // Filter by title
      if (this.filterValue && !lowerCaseTitle.includes(filterValueWithoutSpaces)) {
        return false; // Exclude publications that don't match the entered title
      }

      const publicationYear = Number(publication.year);
      console.log(publicationYear === Number(this.filterYearValue))
      if (this.filterYearValue && !(publicationYear === Number(this.filterYearValue))) {
        return false;
      }

      // Include publication if it passes all filters
      return true;
    });
  }

}
