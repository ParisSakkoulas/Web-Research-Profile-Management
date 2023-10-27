import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogAddPubComponent } from 'src/app/category/dialog-add-pub/dialog-add-pub.component';
import { loadPublications, selectAllPublications, selectCurrentStatus, deletePublication } from 'src/app/core/state/publications';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { PublicationsService } from '../publication.service';
import { ExternalReference } from '@angular/compiler';
import { Subscription, Observable, Subject } from 'rxjs';
import { Publication } from 'src/app/models/publication.model';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-publication-all',
  templateUrl: './publication-all.component.html',
  styleUrls: ['./publication-all.component.css']
})
export class PublicationAllComponent implements OnInit {

  //για όλες τις δημοσιεύσεις
  publications!: any[];
  private publicationsSubscription !: Subscription;

  //για pagination
  public totalPublications = 0;
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [3, 5, 10, 15, 20]
  displayedPublications: any[] = [];





  sections: String[] = ["All", "Article", "Book", "Proceedings", "Thesis", "Book Chapter", "Tech Report", "Other"];
  selectedSection = '';

  access: String[] = ["All", "Public", "Private"];

  selectedAccess = ''

  lowerValue!: number;
  upperValue!: number;
  value!: number;

  message!: any;
  messageSubscription !: Subscription;

  filterValue !: string;
  filterYearValue !: string;

  userId!: any;

  allPubliations$ !: Observable<Publication[]>;
  status$!: Observable<string>;
  statusSubscription!: Subscription;


  currentRefs$!: Observable<ExternalReference[]>;
  serchingForReferences !: Subject<'pending' | 'loading' | 'error' | 'success'>;

  //για το auth status
  private authStatusSub !: Subscription;// Αποθηκεύουμε το Subscription που κάνουμε στην getAuthStatusListener για να δούμε αν ο χρήστης είναι συνδεδεμένος
  public isAuthenticated = false; // μεταβλητή για την αποθήκευση της κατάστασης σύνδεσης του χρήστη. Θα χρησιμοποιηθεί μέσα στο html template.


  constructor(public publicationService: PublicationsService, private authService: AuthService, private store: Store, private dialog: MatDialog) {



  }

  ngOnInit(): void {





    ///Καλούμε την μέθοδο που μας παρέχει όλες τις δημοσιεύσεις καθώς επίσης κα ιτην μέθοδο για να ενημερωνόμαστε για τυχόν αλλαγές
    this.publicationService.getAllPublications();
    this.publicationsSubscription = this.publicationService.getAllPublicationsUpdateListener().subscribe({
      next: (result) => {
        this.publications = result;
        this.totalPublications = result.length;
        this.updateDisplayedPublications()
      }
    })



    //Κάνουμε dispatch το loadPublications Action
    this.store.dispatch(loadPublications());


    //Έπειτα αποηθκεύουμε τα Publications της βάσης στην μεταβλητή allPubliations$ μέσω του selector selectAllPublications
    this.allPubliations$ = this.store.select(selectAllPublications);



    this.status$ = this.store.select(selectCurrentStatus);

    this.statusSubscription = this.status$.subscribe(status => {
      console.log("App status ", status)
    })















    this.isAuthenticated = this.authService.getIsAuth();

    // Κάνουμε sub στο getAuthStatusListener για να λαμβάνουμε τυχόν νέες αλλαγές στην κατάσταση σύνδεσης του χρήστη και την αποθηκεύουμε στην μεταβλητή isAuthenticated
    this.authStatusSub = this.authService.getAuthStatusListener().subscribe(isAuthenticated => {

      this.isAuthenticated = isAuthenticated;
      this.userId = this.authService.getUserId;
      console.log(isAuthenticated)

    })




  }



  onDeletePublication(publication_id: any) {

    this.store.dispatch(deletePublication({ publicationId: publication_id }))
    this.publicationService.deletePublication(publication_id);

  }

  onUpdatePublication() {

  }

  openDialogInfoPublication(id: any) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      id: id
    };
    dialogConfig.panelClass = 'info_pub_class'
    this.dialog.open(InfoDialogComponent, dialogConfig)

  }

  selectPublication(id: any) {

  }


  movePublicationDialog(id: any, publicationName: string,) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      publicationName: publicationName,
      publicationId: id,
    };

    this.dialog.open(DialogAddPubComponent, dialogConfig)


  }


  updateDisplayedPublications() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.publications) {
      this.displayedPublications = this.publications.slice(startIndex, endIndex);
      console.log(this.displayedPublications)
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedPublications();
  }





  applyYearFilter() {

  }



  applyFilterNew() {
    this.displayedPublications = this.publications.filter(publication => {
      const lowerCaseTitle = publication.title.toLowerCase();

      // Filter by section
      if (this.selectedSection && this.selectedSection !== 'All' && publication.section !== this.selectedSection) {
        return false; // Exclude publications that don't match the selected section
      }

      // Filter by access
      if (this.selectedAccess && this.selectedAccess !== 'All' && publication.accessibility !== this.selectedAccess) {
        return false; // Exclude publications that don't match the selected access
      }

      // Filter by title
      if (this.filterValue && !lowerCaseTitle.includes(this.filterValue.toLowerCase())) {
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




  ngOnDestroy(): void {

    //Κάνουμε unsubscribe στα subscription
    this.authStatusSub.unsubscribe();
    this.statusSubscription.unsubscribe();
    this.publicationsSubscription.unsubscribe();

  }

}
