import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, Subscription, distinctUntilChanged } from 'rxjs';
import { AuthService } from 'src/app/auth/auth.service';

import { Publication } from 'src/app/models/publication.model';
import { PublicationsService } from '../publication.service';
import { Store, select } from '@ngrx/store';
import { PublicationState, deletePublication, loadPublications } from 'src/app/core/state/publications';
import { state } from '@angular/animations';

import { selectAllPublications, selectCurrentStatus } from 'src/app/core/state/publications/publications.selector';
import { AppState } from 'src/app/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ErrorComponent } from 'src/app/error/error.component';
import { SuccessComponent } from 'src/app/success/success.component';
import { ActivatedRoute } from '@angular/router';


import { PublicationEffects } from '../../core/state/publications/publications.effects';
import { ExternalReference } from 'src/app/models/externalReference.model';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { DialogAddPubComponent } from 'src/app/category/dialog-add-pub/dialog-add-pub.component';
import { InfoDialogComponent } from '../info-dialog/info-dialog.component';
import { Tag } from 'src/app/models/tag.model';
import { PageEvent } from '@angular/material/paginator';
import { DialogDeleteOneComponent } from '../dialog-delete-one/dialog-delete-one.component';
import { DialogDeleteManyComponent } from 'src/app/category/dialog-delete-many/dialog-delete-many.component';
import { DialogDeleteManyPublicationsComponent } from '../dialog-delete-many-publications/dialog-delete-many-publications.component';
import { DialogMoveManyPublicationsComponent } from 'src/app/category/dialog-move-many-publications/dialog-move-many-publications.component';
import { DialogExportSinglePublicationComponent } from '../dialog-export-single-publication/dialog-export-single-publication.component';
import { DialogExportManyPublicationsComponent } from '../dialog-export-many-publications/dialog-export-many-publications.component';
import { DialogUploadFilesComponent } from '../dialog-upload-files/dialog-upload-files.component';

@Component({
  selector: 'app-publication-list',
  templateUrl: './publication-list.component.html',
  styleUrls: ['./publication-list.component.css']
})
export class PublicationListComponent implements OnInit, OnDestroy {

  publications!: any[];
  myPublicationsSubscription !: Subscription;

  displayedPublications: any[] = [];
  myPublicationsCheck!: { publication_id: any, userId: number, title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, tags: Tag[], notes: string, references: string[], selected: boolean }[];
  numOfSelections = 0;
  public publicationsFound = false;

  selectionEnabled = false;
  selectAll = false;


  public totalPublications = 0; // Total number of categopries
  public pageSize = 5;
  public currentPage = 0;
  pageSizeOptions = [3, 5, 10, 15, 20]


  allMyPublications !: any[]

  sections: String[] = ["All", "Article", "Book", "Proceedings", "Thesis", "Book Chapter", "Tech Report", "Other"];
  selectedSection = '';

  access: String[] = ["All", "Public", "Private"];
  selectedAccess = ''

  filterYearValue !: string;

  lowerValue!: number;
  upperValue!: number;
  value!: number;

  message!: any;
  messageSubscription !: Subscription;


  userId!: any;

  allPubliations$ !: Observable<Publication[]>;
  status$!: Observable<string>;
  statusSubscription!: Subscription;


  currentRefs$!: Observable<ExternalReference[]>;
  serchingForReferences !: Subject<'pending' | 'loading' | 'error' | 'success'>;

  //για το filtering
  filterValue!: string;


  //για το auth status
  private authStatusSub !: Subscription;// Αποθηκεύουμε το Subscription που κάνουμε στην getAuthStatusListener για να δούμε αν ο χρήστης είναι συνδεδεμένος
  public isAuthenticated = false; // μεταβλητή για την αποθήκευση της κατάστασης σύνδεσης του χρήστη. Θα χρησιμοποιηθεί μέσα στο html template.

  constructor(public publicationService: PublicationsService, private authService: AuthService, private store: Store, private dialog: MatDialog) {



  }


  ngOnInit(): void {





    //παίρνουμε το userid απο το auth service για να το χρησιμοποιήσουμε στον html template για καλύτερο ui(απόκρυψη κουμπιών διαγραφής, edit)
    this.userId = parseInt(this.authService.getUserId());

    if (this.userId) {
      this.publicationService.getAllMyPublications();
      this.myPublicationsSubscription = this.publicationService.getMyPublicationsUpdateListener().subscribe({
        next: (response) => {


          this.myPublicationsCheck = response.map(p => {

            return {
              publication_id: p.publication_id,
              userId: p.userId,
              title: p.title,
              section: p.section,
              abstract: p.abstract,
              isbn: p.isbn,
              doi: p.doi,
              year: p.year,
              accessibility: p.accessibility,
              tags: p.tags,
              notes: p.notes,
              references: p.references,
              selected: false
            }
          })
          this.totalPublications = response.length;
          console.log(this.myPublicationsCheck)
          this.updateDisplayedCategories()
        }
      })
    }

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

  //Μέθοδος για την επιλογή όλων των κατηγοριών
  selectAllPublications() {
    this.selectionEnabled = true
    this.myPublicationsCheck.forEach(c => {


      c.selected = this.selectAll;

    })
    this.numOfSelections = this.myPublicationsCheck.length

    console.log(this.myPublicationsCheck)
  }




  openDialogInfoPublication(id: any) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      id: id
    };
    dialogConfig.panelClass = 'info_pub_class'
    this.dialog.open(InfoDialogComponent, dialogConfig)

  }


  openDialogForDeleteOne(publicationId: any, publicationName: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      publicationId: publicationId,
      publicationName: publicationName,

    }

    this.dialog.open(DialogDeleteOneComponent, dialogCreateConfig)


  }


  openDialogForUploadFilesForPublication(publicationId: any, publicationName: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      publicationId: publicationId,
      publicationName: publicationName
    }

    this.dialog.open(DialogUploadFilesComponent, dialogCreateConfig)


  }


  deleteSelectedPublicationOpenDialog() {


    if (this.numOfSelections > 0) {

      const dialogCreateConfig = new MatDialogConfig();

      dialogCreateConfig.disableClose = true;
      dialogCreateConfig.autoFocus = true;
      dialogCreateConfig.width = '800px';

      let publicationIds: any[] = [];
      let publicationNames: any[] = [];

      this.myPublicationsCheck.forEach(p => {
        if (p.selected) {
          publicationIds.push(p.publication_id)
          publicationNames.push(p.title)
        }
      })

      dialogCreateConfig.data = {
        publicationIds: publicationIds,
        publicationNames: publicationNames

      }

      this.dialog.open(DialogDeleteManyPublicationsComponent, dialogCreateConfig)


    }

    else
      return



  }


  selectPublication(id: any) {

    this.selectionEnabled = true
    const publication = this.myPublicationsCheck.find(p => p.publication_id === id);
    if (publication) {
      publication.selected = !publication.selected;
      if (publication.selected === true) {
        this.numOfSelections += 1;
      }
      else {
        this.numOfSelections -= 1;
      }

      console.log(this.numOfSelections)
    }
    console.log('Selected select:', this.myPublicationsCheck);

  }

  movePublicationDialog(id: any, publicationName: string,) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      publicationName: publicationName,
      publicationId: id,
    };

    this.dialog.open(DialogAddPubComponent, dialogConfig)


  }


  updateDisplayedCategories() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.myPublicationsCheck) {
      this.displayedPublications = this.myPublicationsCheck.slice(startIndex, endIndex);
      console.log(this.displayedPublications)
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedCategories();
  }


  openMoveManyPublicationsToCategoryDialog() {
    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    let publicationIds: any[] = [];
    let publicationNames: any[] = [];

    this.myPublicationsCheck.forEach(p => {
      if (p.selected) {
        publicationIds.push(p.publication_id)
        publicationNames.push(p.title)
      }
    })

    dialogCreateConfig.data = {
      publicationIds: publicationIds,
      publicationNames: publicationNames

    }

    this.dialog.open(DialogMoveManyPublicationsComponent, dialogCreateConfig)

  }


  openDialogForExportSinglePublication(id: any, publicationName: string) {
    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      publicationId: id,
      publicationName: publicationName
    }

    this.dialog.open(DialogExportSinglePublicationComponent, dialogCreateConfig)
  }


  openDialogForExportSelectedPublications() {
    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    let publicationIds: any[] = [];
    let publicationNames: any[] = [];

    this.myPublicationsCheck.forEach(p => {
      if (p.selected) {
        publicationIds.push(p.publication_id)
        publicationNames.push(p.title)
      }
    })

    dialogCreateConfig.data = {
      publicationIds: publicationIds,
      publicationNames: publicationNames

    }

    this.dialog.open(DialogExportManyPublicationsComponent, dialogCreateConfig)
  }

  applyFilter() {
    if (this.filterValue) {
      this.displayedPublications = this.myPublicationsCheck.filter(publication => {
        console.log(publication)
        // Customize the condition based on your filtering requirements
        if (publication.title.toLowerCase().includes(this.filterValue.toLowerCase())) {
          return publication.title.toLowerCase().includes(this.filterValue.toLowerCase());
        }
        else {
          return publication.title.toLowerCase().includes(this.filterValue.toLowerCase());

        }
      });
    } else {
      this.displayedPublications = this.myPublicationsCheck;
    }
  }


  applyFilterNew() {
    this.displayedPublications = this.myPublicationsCheck.filter(publication => {
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
    this.myPublicationsSubscription.unsubscribe();

  }

}
