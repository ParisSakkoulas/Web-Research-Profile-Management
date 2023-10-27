import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatChipInputEvent } from '@angular/material/chips';
import { Observable, Subject, Subscription, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Publication } from 'src/app/models/publication.model';
import { PublicationsService } from '../publication.service';
import { Tag } from 'src/app/models/tag.model';
import { Article } from 'src/app/models/article.model';
import { SuccessComponent } from 'src/app/success/success.component';
import { Store } from '@ngrx/store';
import { addPublication, selectCurrentStatus } from 'src/app/core/state/publications';
import { AuthService } from 'src/app/auth/auth.service';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { ReferenceDialogComponent } from 'src/app/references/reference-dialog/reference-dialog.component';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { SelectionModel } from '@angular/cdk/collections';
import { Other } from 'src/app/models/other.model';
import { Book } from 'src/app/models/book.model';
import { Proceedings } from 'src/app/models/proceedings.model';
import { BookChapter } from 'src/app/models/bookChapter.model';
import { TechReport } from 'src/app/models/techReport.model';
import { Thesis } from 'src/app/models/thesis.model';
import { DialogAddAuthorManuallyComponent } from '../dialog-add-author-manually/dialog-add-author-manually.component';
import { DialogAddPublicationPlaceComponent } from '../dialog-add-publication-place/dialog-add-publication-place.component';
import { PublicationPlace } from 'src/app/models/publication.place.model';
import { DialogAddRefManualComponent } from '../dialog-add-ref-manual/dialog-add-ref-manual.component';
import { DialogReplaceContentFileComponent } from '../dialog-replace-content-file/dialog-replace-content-file.component';
import { DialogReplacePresentantionFileComponent } from '../dialog-replace-presentantion-file/dialog-replace-presentantion-file.component';
import { DialogAddManyPublicationIdBasedComponent } from '../dialog-add-many-publication-id-based/dialog-add-many-publication-id-based.component';



export interface Reference {
  title: string;
}




@Component({
  selector: 'app-publication-create',
  templateUrl: './publication-create.component.html',
  styleUrls: ['./publication-create.component.css']
})
export class PublicationCreateComponent implements OnInit, OnDestroy {


  addOption = 'Manually'
  identifiers = ['DOI', 'aRxiv', 'Title'];
  selectedOption: string = 'DOI';
  searchPublicationForm !: FormGroup;


  searchPublicationDoiForm !: FormGroup;
  searchPublicationArxivForm !: FormGroup;
  searchPublicationISBNForm !: FormGroup;
  searchPublicationTitleForm !: FormGroup;



  selectedAccess = 'Public';
  sections: String[] = ["Article", "Book", "Proceedings", "Thesis", "Book Chapter", "Tech Report", "Other"];
  months: String[] = ["January", "February", "March", "April", "May", "June", "Jule", "August", "September", "October", "November", "December"];

  thesisType: String[] = ["Master", "PhD"];
  access: String[] = ["Public", "Private"];

  addPublicationForm !: FormGroup;
  addArticleForm !: FormGroup;
  bookForm !: FormGroup;
  proceedingsForm !: FormGroup;
  thesisForm !: FormGroup;
  bockChapterForm !: FormGroup;
  techicalReportForm !: FormGroup;
  otherForm !: FormGroup;

  separatorKeysCodes: number[] = [ENTER, COMMA];
  tagCtrl = new FormControl('');
  tags: Tag[] = [];
  allTags: string[] = ['AI', 'Programming', '5G', 'Systematic Review', 'Cyber Attacks'];
  tagSubscription !: Subscription;
  tagsBack: Tag[] = [];

  //για τα αρχεία
  public contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[] = [];
  public presentantionFiles: { presentantion_file_id: any, filename: string, path: string, type: string, access: string }[] = [];


  @ViewChild('tagInput') tagInput!: ElementRef<HTMLInputElement>;


  //Publication places
  publicationPlaceCrtl = new FormControl('');
  livepublicationPlacesFromDb: string[] = [];
  private searchPublicationPlaces = new Subject<string>();
  public publicationPlace !: PublicationPlace;



  //Authors
  authorsCtrl = new FormControl('');
  liveAuthorsFromDb: string[] = []
  private searchAuthors = new Subject<string>();
  authorsSearchLoading: boolean = false;
  authorsSearchResultNotFound!: string;

  public authorsNew: { id: any, firstName: string, lastName: string, type: string }[] = []


  filteredFirstNameBasedOptions!: Observable<{ id: any, firstName: string, lastName: string, type: string }[]>;
  filteredLastNameBasedOptions!: Observable<{ id: any, firstName: string, lastName: string, type: string }[]>;
  filteredUserNameBasedOptions!: Observable<{ id: any, firstName: string, lastName: string, type: string }[]>;

  filteredPublicationPlacesOptions!: Observable<{ publication_place_id: any, name: string, type: string }[]>;


  filteredExternalUserFirstNameBasedOptions!: Observable<{ id: any, firstName: string, lastName: string, type: string }[]>;
  filteredExternalUserLastNameBasedOptions!: Observable<{ id: any, firstName: string, lastName: string, type: string }[]>;


  authorsSelected: { user_id: any, userName: string, firstName: string, lastName: string }[] = [];
  authorsSelectedNew: { id: any, firstName: string, lastName: string, type: string }[] = [];
  authorManuallyCreate !: Subject<{ externalAuthor_id: any, firstName: string, lastName: string }>;

  //Refs
  references: string[] = [];
  reference!: string;


  //πίνακας που θα αποθηκεύουμε τα αποτελέσματα τις αναζήτησης με βάση το ISBN, αν και εφόσονς είναι περισσότερα το 1 και έρθουν απο το backend
  publicationsFoundBasedOnISBNFromCrossRef: { title: string, year: string, link: string, type: string, section: {} }[] = [];
  //συσχέτιση μεταβλητής crossRefPublications με πίνακα
  crossRefPublications!: MatTableDataSource<{ title: string, year: string, link: string, type: string, section: {} }>;
  displayedColumnsFromCrossRefPub: string[] = ['select', 'position', 'title', 'type', 'year', 'link'];
  @ViewChild(MatPaginator, { static: true }) crossRefPaginator!: MatPaginator;
  @ViewChild(MatSort, { static: true }) crossRefTableSort = new MatSort();
  selectionCrossRef = new SelectionModel<{ title: string, year: string, link: string, type: string }>(true, [])


  //Publication
  public mode = 'create';
  private publicationId: any;
  publication !: Publication;


  private messageSub!: Subscription;
  public message !: string;
  public messageSent = false;

  userId!: any;

  status$!: Observable<string>;



  //για το filter και το auto complete για την αναζήτητησ Αναφορών
  private searchExternalPublications = new Subject<string>();
  referencesCtrl = new FormControl('');
  liveReferencesFromWeb: string[] = [];
  filteredOptions!: Observable<string[]>;
  referencesLoading: boolean = false;


  //για το filter και το auto complete για την αναζήτητησ δημοσιεύσεων με βάση το DOI
  private searchDoiPublications = new Subject<string>();
  publicationDoiCtrl = new FormControl('');
  livePublicationsDoiFromWeb: string[] = [];
  publicationsDoiFilteredOptions!: Observable<string[]>;
  publicationsDoiLoading: boolean = false;


  //για το filter και το auto complete για την αναζήτητησ δημοσιεύσεων απο τη βάση
  private searchInternalPublications = new Subject<string>();
  publicationsInternalCtrl = new FormControl('');
  livePublicationsFromBd: string[] = [];
  filtereInternaldOptions!: Observable<string[]>;
  internalPublicationsSearchLoading: boolean = false;


  refsStatus$!: Observable<string>;


  //Files
  selectedFile!: File;
  fileName = '';
  fileSected = false;
  typeFiles = false;


  selectedPresentantionFile!: File;
  fileNamePresentantion = '';
  fileSectedPresentantion = false;
  typeFilesPresentantion = false;



  public currentUserData !: { id: any, firstName: string, lastName: string, type: string };


  constructor(private fb: FormBuilder, public authService: AuthService, public publicationService: PublicationsService, private router: Router, public route: ActivatedRoute, public dialog: MatDialog, private store: Store) {

  }


  ngOnInit(): void {



    //Αναμένουμε κάποια δευτερόλεπτα και μετά στέλνουμε τον input του χρήστη για αναζήτηση δημοσιεύσεων με βάση τον τίτλο απο τις πηγές
    this.searchExternalPublications.pipe(
      debounceTime(700),
      distinctUntilChanged(),
      tap(() => { this.referencesLoading = true; }),
    ).subscribe((query: string) => {

      this.publicationService.searchExternalReferences(query.trim()).subscribe(result => {
        console.log(result.ref)
        this.filteredOptions = of(result.ref.map(reference => reference.title));
        this.referencesLoading = false;
      })
    });


    //Αναμένουμε κάποια δευτερόλεπτα και μετά στέλνουμε τον input του χρήστη για αναζήτηση δημοσιεύσεων με βάση τον τίτλο από τη βάση
    this.searchInternalPublications.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => { this.internalPublicationsSearchLoading = true; }),
    ).subscribe((query: string) => {

      this.publicationService.searchInternalReferences(query.trim()).subscribe(result => {
        console.log(result.ref)
        this.filtereInternaldOptions = of(result.ref.map(reference => reference.title));
        this.internalPublicationsSearchLoading = false;
      })
    });



    //Αναμένουμε κάποια δευτερόλεπτα και μετά στέλνουμε τον input του χρήστη για αναζήτηση Συγγραφέων
    this.searchAuthors.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.authorsSearchLoading = true;
      }),
    ).subscribe((query: string) => {

      this.publicationService.simpleSearchAuthors(query.trim()).subscribe({

        next: (result) => {

          console.log(result)

          if (result.resultForFirstNameBased && result.resultForUserNameBased && result.resultForLastNameBased && result.resultForFirstNameExternalBased && result.resultForLastNameExternalBased) {
            this.filteredFirstNameBasedOptions = of(result.resultForFirstNameBased.map(a => ({ id: a.user_id, firstName: a.firstName, lastName: a.lastName, type: 'Internal' })));

            this.filteredUserNameBasedOptions = of(result.resultForUserNameBased.map(a => ({ id: a.user_id, firstName: a.firstName, lastName: a.lastName, type: 'Internal' })));

            this.filteredLastNameBasedOptions = of(result.resultForLastNameBased.map(a => ({ id: a.user_id, firstName: a.firstName, lastName: a.lastName, type: 'Internal' })));

            this.filteredExternalUserFirstNameBasedOptions = of(result.resultForFirstNameExternalBased.map(ex => ({ id: ex.externalAuthor_id, firstName: ex.firstName, lastName: ex.lastName, type: 'External' })))

            this.filteredExternalUserLastNameBasedOptions = of(result.resultForLastNameExternalBased.map(ex => ({ id: ex.externalAuthor_id, firstName: ex.firstName, lastName: ex.lastName, type: 'External' })))


            this.authorsSearchLoading = false;
            console.log(this.filteredFirstNameBasedOptions)
            console.log(this.filteredUserNameBasedOptions)
            console.log(this.filteredLastNameBasedOptions)
          }

        },
        complete: () => {

          this.authorsSearchLoading = false;

        }




      })


    })



    //Αναμένουμ κάποια δευτερόλεπτα και έπειτα στέλνουμε το input του χρήστη στο bakcend για αναζήτηση Τόπων Δημοσίευσης

    this.searchPublicationPlaces.pipe(debounceTime(300),
      distinctUntilChanged(),
      tap(() => {
        this.authorsSearchLoading = true;
      })).subscribe((query: string) => {


        this.publicationService.simpleSearchPublicationPlaces(query.trim()).subscribe({


          next: (response) => {
            console.log(response)

            this.filteredPublicationPlacesOptions = of(response.resultForNameBased.map(p => ({ publication_place_id: p.publication_place_id, name: p.name, type: p.type })));


          }


        })


      })












    this.filteredOptions = this.referencesCtrl.valueChanges.pipe(startWith(''), map(value => this._filter(value ?? '')));

    this.filtereInternaldOptions = this.publicationsInternalCtrl.valueChanges.pipe(startWith(''), map(value => this._filter(value ?? '')));

    this.publicationsDoiFilteredOptions = this.publicationDoiCtrl.valueChanges.pipe(startWith(''), map(value => this._filter(value ?? '')));






    //παίρνουμε το userid απο το auth service για να το χρησιμοποιήσουμε στον html template για καλύτερο ui(απόκρυψη κουμπιών διαγραφής, edit)
    this.userId = parseInt(this.authService.getUserId());

    console.log(this.userId);

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης
    this.searchPublicationForm = this.fb.group({
      identifier: new FormControl('', Validators.required)
    })

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το DOI
    this.searchPublicationDoiForm = this.fb.group({
      doiSearch: new FormControl('', [Validators.required, Validators.pattern(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/)]),
    })

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το aRxiv
    this.searchPublicationArxivForm = this.fb.group({
      aRxivSearch: new FormControl('', Validators.required)
    })

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το isbn
    this.searchPublicationISBNForm = this.fb.group({
      isbnSearch: new FormControl(null, [Validators.required, Validators.pattern(/^\d{10}$|^\d{13}$/)])
    })

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης με βάση το isbn
    this.searchPublicationTitleForm = this.fb.group({
      titleSearch: new FormControl(null, Validators.required)
    })



    //Αρχικοποίηση της φόρμας για τα πεδία μιας Δημοσίευσης
    this.addPublicationForm = this.fb.group({
      title: new FormControl('', Validators.required),
      section: new FormControl(null),
      abstract: new FormControl(null),
      isbn: new FormControl(null, Validators.pattern(/^\d{10}$|^\d{13}$/)),
      doi: new FormControl(null, Validators.pattern(/\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\S)+)\b/)),
      year: new FormControl(null, Validators.pattern(/(?:(?:15|16|17|18|19|20|21)[0-9]{2})/)),
      accessibility: new FormControl(),
      notes: new FormControl(null)
    })

    //Αρχικοποίηση της φόρμας για τα πεδία ενός Άρθρου
    this.addArticleForm = this.fb.group({
      jurnal: new FormControl('', [Validators.required]),
      number: new FormControl(null,),
      volume: new FormControl(null,),
      pages: new FormControl(null,),
      month: new FormControl(null,)
    })

    //Αρχικοποίηση της φόρμας για τα πεδία ενός Βιβλίου
    this.bookForm = this.fb.group({
      publisher: new FormControl('', Validators.required),
      volume: new FormControl(null,),
      series: new FormControl(null),
      pages: new FormControl(null),
      month: new FormControl(null),
      address: new FormControl(null),
      version: new FormControl(null)
    })

    //Αρχικοποίηση της φόρμας για τα πεδία ενός Πρακτικού
    this.proceedingsForm = this.fb.group({
      editor: new FormControl(null, Validators.required),
      series: new FormControl(null,),
      pages: new FormControl(null),
      month: new FormControl(null),
      organization: new FormControl(null),
      address: new FormControl(null),
      publisher: new FormControl(null)
    })

    //Αρχικοποίηση της φόρμας για τα πεδία μιας Διατριβής
    this.thesisForm = this.fb.group({
      school: new FormControl(null, Validators.required),
      type: new FormControl(null,),
      month: new FormControl(null),
      address: new FormControl(null)
    })

    //Αρχικοποίηση της φόρμας για τα πεδία Κεφάλαιο Βιβλίου
    this.bockChapterForm = this.fb.group({
      chapter: new FormControl(null, Validators.required),
      publisher: new FormControl(null,),
      pages: new FormControl(null),
      volume: new FormControl(null),
      series: new FormControl(null,),
      type: new FormControl(null,),
      month: new FormControl(null),
      address: new FormControl(null),
      version: new FormControl(null),
    })

    //Αρχικοποίηση της φόρμας για τα πεδία μιας Τεχνικής Αναφοράς
    this.techicalReportForm = this.fb.group({
      address: new FormControl(null),
      month: new FormControl(null),
      number: new FormControl(null),
      type: new FormControl(null),
      year: new FormControl(null, Validators.pattern(/(?:(?:15|16|17|18|19|20|21)[0-9]{2})/)),
      institution: new FormControl(null)
    })

    this.otherForm = this.fb.group({
      subType: new FormControl(null),
      grantNumber: new FormControl(null),
      pages: new FormControl(null),
      month: new FormControl(null),
    })


    //Παίρνουμε τα Data του τρέχον χρήστη και αποθηκεύουμε το first και last name στην μεταβλητή current data
    this.authService.getUserData().subscribe({
      next: (response) => {

        console.log(response)
        this.currentUserData = {
          id: this.authService.getUserId(),
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          type: 'Internal'
        }

      }
    });




    //Κάνουμε subscribe sto paramMap και η παρακάτω μέθοδος εκτελείται κάθε φορά που αλλάζει το url
    this.route.paramMap.subscribe((paramMap: ParamMap) => {

      //Αρχικά με την βοήθεια του paramMap βλέπουμε αν υπάρχει στο url το publicationId. Αν υπάρχει τότε ορίζουμε το mode σε edit που είναι για την τροποποίηση υπάρχουσας δημοσίευσης
      if (paramMap.has('publicationId')) {

        this.mode = 'edit';

        //παίρνουμε το id της δημοσίευσης για τροποποίηση και το μετατρέπουμε σε number
        this.publicationId = paramMap.get('publicationId');

        //έπειτα με την βοήθεια του service  καλούμαι την getPublication που μας επιστρέφει την δημοσίευση που ψάχνουμε
        this.publicationService.getPublication(this.publicationId).subscribe(publicationData => {

          this.publication = publicationData.publication;

          //Για να πάρουμε τους authors
          let internalAuthors = []
          internalAuthors = publicationData.publication.internalAuthors;

          let externalAuthors = []
          externalAuthors = publicationData.publication.externalAuthors;
          let authorsToSet: { firstName: any; lastName: any; }[] = [];


          internalAuthors.map((internalAuthor: { firstName: any; lastName: any; }) => {
            authorsToSet.push({
              firstName: internalAuthor.firstName,
              lastName: internalAuthor.lastName,
            })
          })

          externalAuthors.map((externalAuthor: { firstName: any; lastName: any; }) => {
            authorsToSet.push({
              firstName: externalAuthor.firstName,
              lastName: externalAuthor.lastName,
            })
          })

          for (let author of authorsToSet) {
            this.authorsCtrl.setValue(author.firstName + " " + author.lastName);
          }













          //Έλεγχος αν υπάρχει τόπος στην δημοσίευση
          if (publicationData.publication.place) {
            console.log(publicationData.publication.place)
            this.publicationPlace = publicationData.publication.place
          }

          //έπειτα κάνουμε set τις τιμές της addPublicationForm με τις γενικές τιμές μιας Δημοσίευσης
          this.addPublicationForm.patchValue(this.publication);

          //προσθέτουμε στον πίνακα tags τα tags της δημοσίευσης που λάβαμε απο την δημοσίευση απο το backend
          this.tags = this.publication.tags;

          //Αν υπάρχουν εξωτερικού τύπου αναφορές
          if (publicationData.publication.exreferences) {
            //Προσθήκη αυτών στον πίνακα των refs
            publicationData.publication.exreferences.map((exRef: { externalPublication_id: any, title: string, year: string, link: string }) => {
              this.references.push(exRef.title);
            })
          }

          //Αν υπάρχουν εσωτερικού τύπου αναφορές
          if (publicationData.publication.references) {
            //Προσθήκη αυτών στον πίνακα των refs
            publicationData.publication.references.map((ref: { publication_id: any, title: string, year: string }) => {
              this.references.push(ref.title);
            })
          }

          //Αν υπάρχουν αρχεία παρουσίασης
          if (publicationData.publication.presentantionFile) {
            console.log(publicationData.publication.presentantionFile)
          }

          //Αν υπάρχουν αρχεία περιεχομένου
          if (publicationData.publication.contentFile) {
            console.log(publicationData.publication.contentFile)

          }


          ///Προσθήκη συγγραφέων
          //Έλεγχος αν υπάρχουν οι εξωτερικοί συγγραφείς και προσθήκη αυτών στον πίνακα authorsNew
          if (publicationData.publication.externalAuthors) {
            publicationData.publication.externalAuthors.map((ex: { externalAuthor_id: any; firstName: string; lastName: string; }) => {
              const extrnalObj = {
                id: ex.externalAuthor_id,
                firstName: ex.firstName,
                lastName: ex.lastName,
                type: 'External'
              }
              this.authorsSelectedNew.push(extrnalObj)
            })
          }


          //Έλεγχος αν υπάρχουν οι εσωτερικοί συγγραφείς και προσθήκη αυτών στον πίνακα authorsNew
          if (publicationData.publication.internalAuthors) {
            publicationData.publication.internalAuthors.map((ex: { user_id: any; firstName: string; lastName: string; }) => {
              const extrnalObj = {
                id: ex.user_id,
                firstName: ex.firstName,
                lastName: ex.lastName,
                type: 'Internal'
              }
              this.authorsSelectedNew.push(extrnalObj)
            })
          }

          for (let author of this.authorsNew) {
            console.log("aUTHORS", author)
            this.authorsCtrl.setValue(author.firstName + " " + author.lastName);
          }

          console.log(this.authorsNew)

          //this.references = publicationData.externalreferences;
          //console.log(this.references)

          //Καλούμε το service του Publication για να πάρουμε ότι αρχείo έχει η συγκεκριμένη δημοσίευση
          this.publicationService.getPublicationsFiles(this.publicationId);
          //Αποθήκευση τιμών αρχείων περιεχομένου
          this.publicationService.getMyPublicationsContentFilesUpdatedUpdateListener().subscribe({
            next: (response) => {
              this.contentFiles = response;
              console.log(this.contentFiles)

            }
          });
          //Αποθήκευση τιμών αρχείων παρουσίασης
          this.publicationService.getMyPublicationsPresentantionFilesUpdatedListener().subscribe({
            next: (response) => {
              this.presentantionFiles = response;
              console.log(this.presentantionFiles)
            }
          });




          //Έπειτα χρησιμοποιούμε switch για να κάνουμε set την αντίστοιχη φόρμα ανάλογα με το section που έχει η παρούσα δημοσίευση
          switch (this.publication.section) {


            /* Σε περιπτώσεις που το section είναι τύπου Article. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου article
                και κάνουμε set την φορμα με τις αντίστοιχες τιμές του article αντικειμένου που λάβαμε
            */
            case 'Article': {
              const article = publicationData.publication.article
              console.log(article)
              this.addArticleForm.patchValue({
                jurnal: article.jurnal,
                number: article.number,
                volume: article.volume,
                pages: article.pages,
                month: article.month
              })
            }
              break;



            /* Σε περιπτώσεις που το section είναι τύπου Book. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου Book
              και κάνουμε set την φορμα με τις αντίστοιχες τιμές του book αντικειμένου που λάβαμε
            */
            case 'Book': {
              const book = publicationData.publication.book

              this.bookForm.patchValue({
                publisher: book.publisher,
                volume: book.volume,
                series: book.series,
                pages: book.pages,
                month: book.month,
                address: book.address,
                version: book.version,
              })
            } break;



            /* Σε περιπτώσεις που το section είναι τύπου Book_Chapter. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου Book_Chapter
                και κάνουμε set την φορμα με τις αντίστοιχες τιμές του chapterBk αντικειμένου που λάβαμε
            */
            case 'Book_Chapter': {
              const chapterBk = publicationData.publication.chapterBk

              this.addPublicationForm.patchValue({
                title: this.publication.title,
                section: 'Book Chapter',
                abstract: this.publication.abstract,
                isbn: this.publication.isbn,
                doi: this.publication.doi,
                year: this.publication.year,
                accessibility: this.publication.accessibility,
                notes: this.publication.notes

              })

              this.bockChapterForm.patchValue({
                chapter: chapterBk.chapter,
                publisher: chapterBk.publisher,
                pages: chapterBk.pages,
                volume: chapterBk.volume,
                series: chapterBk.series,
                type: chapterBk.type,
                month: chapterBk.month,
                address: chapterBk.address,
                version: chapterBk.version,
              })
            } break;



            /* Σε περιπτώσεις που το section είναι τύπου Proceedings. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου Proceedings
                και κάνουμε set την φορμα με τις αντίστοιχες τιμές του proceedings αντικειμένου που λάβαμε
            */
            case 'Proceedings': {
              const proceedings = publicationData.publication.proceeding;
              console.log(proceedings)

              this.addPublicationForm.patchValue({
                title: this.publication.title,
                section: 'Proceedings',
                abstract: this.publication.abstract,
                isbn: this.publication.isbn,
                doi: this.publication.doi,
                year: this.publication.year,
                accessibility: this.publication.accessibility,
                notes: this.publication.notes

              })


              this.proceedingsForm.patchValue({
                editor: proceedings.editor,
                series: proceedings.series,
                pages: proceedings.pages,
                month: proceedings.month,
                organization: proceedings.organization,
                address: proceedings.address,
                publisher: proceedings.publisher
              })
            } break;



            /* Σε περιπτώσεις που το section είναι τύπου Tech_Report. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου Tech_Report
                και κάνουμε set την φορμα με τις αντίστοιχες τιμές του techReport αντικειμένου που λάβαμε
            */

            case 'Tech_Report': {
              const techReport = publicationData.publication.techReport

              this.addPublicationForm.patchValue({
                title: this.publication.title,
                section: 'Tech Report',
                abstract: this.publication.abstract,
                isbn: this.publication.isbn,
                doi: this.publication.doi,
                year: this.publication.year,
                accessibility: this.publication.accessibility,
                notes: this.publication.notes

              })


              this.techicalReportForm.patchValue({
                address: techReport.address,
                month: techReport.month,
                number: techReport.number,
                type: techReport.type,
                year: techReport.tech_report_year,
                institution: techReport.institution
              })
            } break;



            /* Σε περιπτώσεις που το section είναι τύπου Thesis. Παίρνουμε την Δημοσίευση ως αντικείμενο τύπου Thesis
                και κάνουμε set την φορμα με τις αντίστοιχες τιμές του thesis αντικειμένου που λάβαμε
            */
            case 'Thesis': {
              const thesis = publicationData.publication.thesis
              this.thesisForm.patchValue({
                school: thesis.school,
                type: thesis.type,
                month: thesis.month,
                address: thesis.address
              })
            } break;


            case 'Other': {
              const other = publicationData.publication.other
              console.log(other)
              this.otherForm.patchValue({
                subType: other.subType,
                grantNumber: other.grantNumber,
                pages: other.pages,
                month: other.month
              })
            } break;


          }



        })



      }

      else {

        if (this.mode === 'create') {
          //Παίρνουμε τα Data του τρέχον χρήστη και αποθηκεύουμε το first και last name στην μεταβλητή current data
          this.authService.getUserData().subscribe({
            next: (response) => {


              this.currentUserData = {
                id: this.authService.getUserId(),
                firstName: response.user.firstName,
                lastName: response.user.lastName,
                type: 'Internal'
              }

              this.authorsSelectedNew.push(this.currentUserData)

              this.authorsCtrl.setValue(this.currentUserData.firstName + " " + this.currentUserData.lastName);


              console.log(this.currentUserData)

            }
          });
        }
      }


    });






    //παίρνουμε τα tag απο το backend
    this.publicationService.getTags();
    this.publicationService.getTagUpdateListener().subscribe((tags: Tag[]) => {
      this.tagsBack = tags;
    })






  }

  @ViewChild(MatPaginator, { static: false }) set paginator(value: MatPaginator) {
    if (this.crossRefPublications) {
      this.crossRefPublications.paginator = value;
    }
  }


  // ----- Μέθοδοι για το checkbox του πίνακα
  //Μέθοδος που καλείται όποτε γίνεται toogle πάνω σε μια δημοσίευση
  onPublicationToggled(publication: { title: string, year: string, link: string, type: string }) {

    //Μας παρέχει έναν πίνακα με όλα τα επιλεγμένα αντικείμενα απο τον πίνακα
    this.selectionCrossRef.toggle(publication)

    console.log(this.selectionCrossRef.selected)

  }
  //μέθοδος για να ελέγχουμε αν έχουν επιλεχθεί όλες οι δημοσιεύσεςι απο τον crossRef πίνκα
  isAllSelected() {
    return this.selectionCrossRef.selected.length == this.crossRefPublications.filteredData.length;
  }
  //Μέθοδος που καλείται όταν πατηθεί το check στο header του πίνακα για την επιλογή όλων ή τον καθαρισμό των επιλογών
  toogleAll() {

    if (this.isAllSelected()) {

      console.log("All selected")
      this.selectionCrossRef.clear()

    }
    else {

      this.selectionCrossRef.select(...this.crossRefPublications.data)
    }


  }

  //Μέθοδος για την προσθήκη των επιλεγμένων δημοσιεύσεων
  addSelectedCrossRefPublications() {
    this.store.dispatch(setLoadingAction({ status: true }));

    console.log(this.selectionCrossRef.selected)


    this.publicationService.addMultiplePublicationsBasedOnISBN(this.selectionCrossRef.selected).subscribe({
      next: (response) => {
        console.log(response)
        this.store.dispatch(setLoadingAction({ status: false }));

        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';
        this.crossRefPublications.data.length = 0;
        this.selectionCrossRef.clear();
        this.searchPublicationDoiForm.reset();
        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }
    })

    // console.log(this.selectionCrossRef.selected);

  }

  //μέθοδος για τον καθαρισμός των checked
  cancelCrossRefButton() {
    this.selectionCrossRef.clear()
    this.crossRefPublications.filteredData.slice(0, this.crossRefPublications.filteredData.length)
  }





  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    const results = this.liveReferencesFromWeb.filter(option => option.toLowerCase().includes(filterValue));
    return results.length ? results : ['Searching. . . '];
  }








  //Μέθοδος για την προσθήκη reference στην λιστα των references
  addReference(reference: string) {

    if (!reference) {
      return;
    }

    this.references.push(reference);
    this.reference = ' ';
  }


  //Μέθοδος για την αφαίρεση reference στην λιστα των references
  removeReference(index: number) {
    this.references.splice(index, 1);

  }

  clearRefTable() {
    this.references = []

  }

  sendDatat(event: any) {
    console.log("Send data called")
    let query: string = event.target.value.trim();

    if (query.length === 0) {
      console.log("00")
      this.liveReferencesFromWeb = [];
      return;
    }
    this.searchExternalPublications.next(query);
    this.searchInternalPublications.next(query);
  }

  sendDoiData(event: any) {
    console.log("Send data  doi called");
    let doiQuery: string = event.target.value.trim();

    if (doiQuery.length === 0) {
      this.livePublicationsDoiFromWeb = [];
      return;
    }

    let doiRegex = new RegExp('\\b(10[.][0-9]{4,}(?:[.][0-9]+)*\/(?:(?!["&\'<>])\\S)+)\\b');

    console.log(doiRegex.test(doiQuery));

    if (doiRegex.test(doiQuery)) {
      this.searchDoiPublications.next(doiQuery);
      console.log(doiQuery);
    }

  }


  //Μέθοδος για που παίρνει τα δεδομένα απο την φόρμα και καλεί τη μέθοδο για αποθήκευση Δημοσίευσης στην βάση δεδομένων
  onSavePublication() {


    if (this.mode === 'create') {


      //Κάνει return σε περίπτωση που η βασική φόρμα για την Δημοσίευση είναι μη έγκυρη
      if (this.addPublicationForm.invalid) {
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Article είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Article' && this.addArticleForm.invalid) {
        console.log("Invalid")
        this.addArticleForm.markAllAsTouched();
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Book είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Book' && this.bookForm.invalid) {
        this.bookForm.markAllAsTouched();
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Proceedings είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Proceedings' && this.proceedingsForm.invalid) {
        this.proceedingsForm.markAllAsTouched();
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Thesis είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Thesis' && this.thesisForm.invalid) {
        this.thesisForm.markAllAsTouched();
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Book Chapter είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Book Chapter' && this.bockChapterForm.invalid) {
        this.bockChapterForm.markAllAsTouched();
        return;
      }

      //Κάνει return σε περίπτωση που η φόρμα για το Tech Report είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Tech Report' && this.techicalReportForm.invalid) {
        this.techicalReportForm.markAllAsTouched();
        return;
      }


      //Κάνει return σε περίπτωση που η φόρμα για το Tech Report είναι μη έγκυρη, εφόσον αυτή έχει αρχικά επιλεγεί
      if (this.addPublicationForm.value.section === 'Other' && this.otherForm.invalid) {
        this.otherForm.markAllAsTouched();
        return;
      }







      //Δημιουργία αντικειμένου publication με τιμές απο τα πεδία της φόρμας
      const publication = {
        publication_id: null,
        title: this.addPublicationForm.value.title,
        section: this.addPublicationForm.value.section,
        abstract: this.addPublicationForm.value.abstract,
        isbn: this.addPublicationForm.value.isbn,
        doi: this.addPublicationForm.value.doi,
        year: this.addPublicationForm.value.year,
        accessibility: this.addPublicationForm.value.accessibility,
        notes: this.addPublicationForm.value.notes,
        tags: this.tags,
        references: this.references,
        userId: this.userId
      }




      //Φιλτράρουμε τον πίνακα authorsSelectedNew για να μήν έχουμε διπλότυπα
      this.authorsSelectedNew = this.authorsSelectedNew.filter((author, index, self) =>
        index === self.findIndex((a) =>
          Number(a.id) === Number(author.id) && a.firstName === author.firstName && a.lastName === author.lastName && a.type === author.type
        )
      );



      console.log(this.authorsSelectedNew)


      //Δημιουσία αντικειμένου article σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      if (this.addPublicationForm.value.section === 'Article') {

        const article = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: this.addPublicationForm.value.section,
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          publicationPlace: this.publicationPlace,

          references: this.references,
          userId: this.userId,
          article_id: 1,
          jurnal: this.addArticleForm.value.jurnal,
          number: this.addArticleForm.value.number,
          volume: this.addArticleForm.value.volume,
          pages: this.addArticleForm.value.pages,
          month: this.addArticleForm.value.month,
        }

        console.log(article)


        this.store.dispatch(setLoadingAction({ status: true }));
        this.publicationService.addNewPublication(article, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);

        /*
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(setLoadingAction({ status: true }));
        this.store.dispatch(addPublication({ publication: article }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */




      }



      //Δημιουσία αντικειμένου book σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Book') {

        const book = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: this.addPublicationForm.value.section,
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          publicationPlace: this.publicationPlace,

          references: this.references,
          userId: this.userId,

          book_id: 1,
          publisher: this.bookForm.value.publisher,
          volume: this.bookForm.value.volume,
          series: this.bookForm.value.series,
          pages: this.bookForm.value.pages,
          month: this.bookForm.value.month,
          address: this.bookForm.value.address,
          version: this.bookForm.value.version,
        }


        this.store.dispatch(setLoadingAction({ status: true }));
        this.publicationService.addNewPublication(book, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);


        /*
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(setLoadingAction({ status: true }));
        this.store.dispatch(addPublication({ publication: book }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */

      }



      //Δημιουσία αντικειμένου proceeding σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Proceedings') {

        const proceeding = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: this.addPublicationForm.value.section,
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          publicationPlace: this.publicationPlace,

          references: this.references,

          userId: this.userId,
          proceeding_id: 1,
          editor: this.proceedingsForm.value.editor,
          series: this.proceedingsForm.value.series,
          pages: this.proceedingsForm.value.pages,
          month: this.proceedingsForm.value.month,
          organization: this.proceedingsForm.value.organization,
          address: this.proceedingsForm.value.address,
          publisher: this.proceedingsForm.value.publisher,
        }


        this.store.dispatch(setLoadingAction({ status: true }));

        this.publicationService.addNewPublication(proceeding, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);


        /*
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(setLoadingAction({ status: true }));
        this.store.dispatch(addPublication({ publication: proceeding }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */



      }

      //Δημιουσία αντικειμένου thesis σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Thesis') {

        const thesis = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: this.addPublicationForm.value.section,
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          publicationPlace: this.publicationPlace,
          references: this.references,
          userId: this.userId,

          thesis_id: 1,
          school: this.thesisForm.value.school,
          type: this.thesisForm.value.type,
          month: this.thesisForm.value.month,
          address: this.thesisForm.value.address,
        }

        this.store.dispatch(setLoadingAction({ status: true }));

        this.publicationService.addNewPublication(thesis, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);



        /*
        this.store.dispatch(setLoadingAction({ status: true }));
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(addPublication({ publication: thesis }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */
      }


      //Δημιουσία αντικειμένου book_chapter σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Book Chapter') {

        const book_chapter = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: 'Book_Chapter',
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          references: this.references,
          publicationPlace: this.publicationPlace,

          userId: this.userId,

          book_chapter_id: 1,
          chapter: this.bockChapterForm.value.chapter,
          publisher: this.bockChapterForm.value.publisher,
          pages: this.bockChapterForm.value.pages,
          volume: this.bockChapterForm.value.volume,
          series: this.bockChapterForm.value.series,
          type: this.bockChapterForm.value.type,
          month: this.bockChapterForm.value.month,
          address: this.bockChapterForm.value.address,
          version: this.bockChapterForm.value.version,
        }

        this.store.dispatch(setLoadingAction({ status: true }));
        this.publicationService.addNewPublication(book_chapter, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);

        /*
        this.store.dispatch(setLoadingAction({ status: true }));
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(addPublication({ publication: book_chapter }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */
      }

      //Δημιουσία αντικειμένου tech_report σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Tech Report') {

        const tech_report = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: 'Tech_Report',
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          publicationPlace: this.publicationPlace,

          tags: this.tags,
          authors: this.authorsSelectedNew,
          references: this.references,

          userId: this.userId,
          tech_report_id: 1,
          address: this.techicalReportForm.value.address,
          month: this.techicalReportForm.value.month,
          number: this.techicalReportForm.value.number,
          type: this.techicalReportForm.value.type,
          tech_report_year: this.techicalReportForm.value.year,
          institution: this.techicalReportForm.value.institution
        }

        this.store.dispatch(setLoadingAction({ status: true }));

        this.publicationService.addNewPublication(tech_report, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);

        /*
        this.store.dispatch(setLoadingAction({ status: true }));
        //Καλούμε μέσω του store την addPublication action
        this.store.dispatch(addPublication({ publication: tech_report }));
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);
        */
      }


      //Δημιουσία αντικειμένου other σε περίπτωση που επιλεγεί στο section. Με τιμές απο τα πεδία της φόρμας
      else if (this.addPublicationForm.value.section === 'Other') {

        const other = {
          publication_id: null,
          title: this.addPublicationForm.value.title,
          section: this.addPublicationForm.value.section,
          abstract: this.addPublicationForm.value.abstract,
          isbn: this.addPublicationForm.value.isbn,
          doi: this.addPublicationForm.value.doi,
          year: this.addPublicationForm.value.year,
          accessibility: this.addPublicationForm.value.accessibility,
          notes: this.addPublicationForm.value.notes,
          tags: this.tags,
          authors: this.authorsSelectedNew,
          references: this.references,
          publicationPlace: this.publicationPlace,


          userId: this.userId,
          other_id: 1,
          subType: this.otherForm.value.subType,
          grantNumber: this.otherForm.value.grantNumber,
          pages: this.otherForm.value.pages,
          month: this.otherForm.value.month,
        }

        this.store.dispatch(setLoadingAction({ status: true }));

        this.publicationService.addNewPublication(other, this.selectedFile, this.selectedPresentantionFile);
        this.addPublicationForm.reset();
        this.addArticleForm.reset();
        this.router.navigate(['publications']);

      }






    }


    //Σε διαφορετική περίπτωση σημαίνει ότι έιμαστε στ edit mode οπότε
    else {


      this.store.dispatch(setLoadingAction({ status: true }));

      //Δημιουργία αντικειμένου publication με τιμές απο τα πεδία της φόρμας
      const publication = {
        publication_id: this.publicationId,
        title: this.addPublicationForm.value.title,
        section: this.addPublicationForm.value.section,
        abstract: this.addPublicationForm.value.abstract,
        isbn: this.addPublicationForm.value.isbn,
        doi: this.addPublicationForm.value.doi,
        year: this.addPublicationForm.value.year,
        accessibility: this.addPublicationForm.value.accessibility,
        notes: this.addPublicationForm.value.notes,
        tags: this.tags,
        references: this.references,
        userId: this.userId,
      }




      switch (this.addPublicationForm.value.section) {

        case 'Article':
          {
            const article: Article = {
              publication_id: this.publicationId,
              title: this.addPublicationForm.value.title,
              section: this.addPublicationForm.value.section,
              abstract: this.addPublicationForm.value.abstract,
              isbn: this.addPublicationForm.value.isbn,
              doi: this.addPublicationForm.value.doi,
              year: this.addPublicationForm.value.year,
              accessibility: this.addPublicationForm.value.accessibility,
              notes: this.addPublicationForm.value.notes,
              tags: this.tags,
              references: this.references,
              authors: this.authorsSelectedNew,
              publicationPlace: this.publicationPlace,
              userId: this.userId,
              article_id: 1,
              jurnal: this.addArticleForm.value.jurnal,
              number: this.addArticleForm.value.number,
              volume: this.addArticleForm.value.volume,
              pages: this.addArticleForm.value.pages,
              month: this.addArticleForm.value.month,
            }
            console.log(article)
            this.publicationService.updatePublication(this.publicationId, publication, article)
            this.router.navigate(['publications']);
          }
          break;


        case 'Book': {

          const book: Book = {
            publication_id: this.publicationId,
            title: this.addPublicationForm.value.title,
            section: this.addPublicationForm.value.section,
            abstract: this.addPublicationForm.value.abstract,
            isbn: this.addPublicationForm.value.isbn,
            doi: this.addPublicationForm.value.doi,
            year: this.addPublicationForm.value.year,
            accessibility: this.addPublicationForm.value.accessibility,
            notes: this.addPublicationForm.value.notes,
            tags: this.tags,
            references: this.references,
            userId: this.userId,
            authors: this.authorsSelectedNew,
            publicationPlace: this.publicationPlace,
            book_id: 1,
            publisher: this.bookForm.value.publisher,
            volume: this.bookForm.value.volume,
            series: this.bookForm.value.series,
            pages: this.bookForm.value.pages,
            month: this.bookForm.value.month,
            address: this.bookForm.value.address,
            version: this.bookForm.value.version,
          }
          console.log(book);
          this.publicationService.updatePublication(this.publicationId, publication, undefined, book)
          this.router.navigate(['publications']);


        }
          break;


        case 'Proceedings': {

          const proceeding: Proceedings = {
            publication_id: this.publicationId,
            title: this.addPublicationForm.value.title,
            section: this.addPublicationForm.value.section,
            abstract: this.addPublicationForm.value.abstract,
            isbn: this.addPublicationForm.value.isbn,
            doi: this.addPublicationForm.value.doi,
            year: this.addPublicationForm.value.year,
            accessibility: this.addPublicationForm.value.accessibility,
            notes: this.addPublicationForm.value.notes,
            tags: this.tags,
            references: this.references,
            userId: this.userId,
            authors: this.authorsSelectedNew,
            publicationPlace: this.publicationPlace,
            proceeding_id: 1,
            editor: this.proceedingsForm.value.editor,
            series: this.proceedingsForm.value.series,
            pages: this.proceedingsForm.value.pages,
            month: this.proceedingsForm.value.month,
            organization: this.proceedingsForm.value.organization,
            address: this.proceedingsForm.value.address,
            publisher: this.proceedingsForm.value.publisher,

          }

          console.log(proceeding)
          this.publicationService.updatePublication(this.publicationId, publication, undefined, undefined, proceeding)

          this.router.navigate(['publications']);
        }
          break;


        case 'Book Chapter': {

          const book_chapter: BookChapter = {
            publication_id: this.publicationId,
            title: this.addPublicationForm.value.title,
            section: 'Book_Chapter',
            abstract: this.addPublicationForm.value.abstract,
            isbn: this.addPublicationForm.value.isbn,
            doi: this.addPublicationForm.value.doi,
            year: this.addPublicationForm.value.year,
            accessibility: this.addPublicationForm.value.accessibility,
            notes: this.addPublicationForm.value.notes,
            tags: this.tags,
            references: this.references,
            userId: this.userId,
            book_chapter_id: 1,
            authors: this.authorsSelectedNew,
            publicationPlace: this.publicationPlace,
            chapter: this.bockChapterForm.value.chapter,
            publisher: this.bockChapterForm.value.publisher,
            pages: this.bockChapterForm.value.pages,
            volume: this.bockChapterForm.value.volume,
            series: this.bockChapterForm.value.series,
            type: this.bockChapterForm.value.type,
            month: this.bockChapterForm.value.month,
            address: this.bockChapterForm.value.address,
            version: this.bockChapterForm.value.version,

          }

          console.log(book_chapter);
          this.publicationService.updatePublication(this.publicationId, publication, undefined, undefined, undefined, undefined, book_chapter)

          this.router.navigate(['publications']);
        }
          break;



        case 'Tech Report': {

          const tech_report: TechReport = {
            publication_id: this.publicationId,
            title: this.addPublicationForm.value.title,
            section: 'Tech_Report',
            abstract: this.addPublicationForm.value.abstract,
            isbn: this.addPublicationForm.value.isbn,
            doi: this.addPublicationForm.value.doi,
            year: this.addPublicationForm.value.year,
            accessibility: this.addPublicationForm.value.accessibility,
            notes: this.addPublicationForm.value.notes,
            tags: this.tags,
            references: this.references,
            userId: this.userId,
            tech_report_id: 1,
            authors: this.authorsSelectedNew,
            publicationPlace: this.publicationPlace,
            address: this.techicalReportForm.value.address,
            month: this.techicalReportForm.value.month,
            number: this.techicalReportForm.value.number,
            type: this.techicalReportForm.value.type,
            tech_report_year: this.techicalReportForm.value.year,
            institution: this.techicalReportForm.value.institution

          }

          console.log(tech_report)

          this.publicationService.updatePublication(this.publicationId, publication, undefined, undefined, undefined, undefined, undefined, tech_report)

          this.router.navigate(['publications']);
        }
          break;



        case 'Thesis': {

          const thesis: Thesis = {
            publication_id: this.publicationId,
            title: this.addPublicationForm.value.title,
            section: this.addPublicationForm.value.section,
            abstract: this.addPublicationForm.value.abstract,
            isbn: this.addPublicationForm.value.isbn,
            doi: this.addPublicationForm.value.doi,
            year: this.addPublicationForm.value.year,
            accessibility: this.addPublicationForm.value.accessibility,
            notes: this.addPublicationForm.value.notes,
            tags: this.tags,
            references: this.references,
            authors: this.authorsSelectedNew,
            publicationPlace: this.publicationPlace,
            userId: this.userId,

            thesis_id: 1,
            school: this.thesisForm.value.school,
            type: this.thesisForm.value.type,
            month: this.thesisForm.value.month,
            address: this.thesisForm.value.address,
          }

          console.log(thesis)



          this.publicationService.updatePublication(this.publicationId, publication, undefined, undefined, undefined, thesis, undefined, undefined)

          this.router.navigate(['publications']);
        }
          break;


        case 'Other':
          {
            const other: Other = {
              publication_id: this.publicationId,
              title: this.addPublicationForm.value.title,
              section: this.addPublicationForm.value.section,
              abstract: this.addPublicationForm.value.abstract,
              isbn: this.addPublicationForm.value.isbn,
              doi: this.addPublicationForm.value.doi,
              year: this.addPublicationForm.value.year,
              accessibility: this.addPublicationForm.value.accessibility,
              notes: this.addPublicationForm.value.notes,
              tags: this.tags,
              references: this.references,
              userId: this.userId,
              authors: this.authorsSelectedNew,
              publicationPlace: this.publicationPlace,
              other_id: 1,
              subType: this.otherForm.value.subType,
              grantNumber: this.otherForm.value.grantNumber,
              pages: this.otherForm.value.pages,
              month: this.otherForm.value.month,
            }
            console.log(other)
            this.publicationService.updatePublication(this.publicationId, publication, undefined, undefined, undefined, undefined, undefined, undefined, other)
            this.router.navigate(['publications']);
          }
          break;


      }



    }









  }


  //Μέθοδος για την αναζήτηση Δημοσίευσεις μέσω identifier
  onSearchPublication() {



    console.log(this.searchPublicationForm.value.identifier)
    if (this.searchPublicationForm.value.identifier === 'DOI' && this.searchPublicationDoiForm.invalid) {

      return;
    }

    if (this.searchPublicationForm.value.identifier === 'aRxiv' && this.searchPublicationArxivForm.invalid) {
      return;
    }

    if (this.searchPublicationForm.value.identifier === 'ISBN' && this.searchPublicationISBNForm.invalid) {
      return;
    }

    if (this.searchPublicationForm.value.identifier === 'Title' && this.searchPublicationTitleForm.invalid) {
      return;
    }

    this.store.dispatch(setLoadingAction({ status: true }));
    if (this.searchPublicationForm.value.identifier === 'DOI') {
      this.publicationService.searchSinglePublication(this.searchPublicationForm.value.identifier, this.searchPublicationDoiForm.value.doiSearch).subscribe({
        next: (result) => {

          this.store.dispatch(setLoadingAction({ status: false }));

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: result.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.searchPublicationDoiForm.reset();
          this.dialog.open(SuccessComponent, dialogMessageConfig);
        },
        error: (error) => {
          console.log(error)
          this.store.dispatch(setLoadingAction({ status: false }));
        }
      });
      this.searchPublicationForm.reset();
    }


    else if (this.searchPublicationForm.value.identifier === 'aRxiv') {

      const aRxiv = this.searchPublicationArxivForm.value.aRxivSearch;
      console.log(aRxiv)
      this.publicationService.searchSinglePublication(this.searchPublicationForm.value.identifier, aRxiv).subscribe({
        next: (result) => {

          this.store.dispatch(setLoadingAction({ status: false }));

          console.log(result)

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: result.message
          }
          dialogMessageConfig.panelClass = 'success_class';
          this.searchPublicationArxivForm.reset();
          this.dialog.open(SuccessComponent, dialogMessageConfig);
        },
        error: (error) => {
          console.log(error)
          this.store.dispatch(setLoadingAction({ status: false }));
        }
      });
      this.searchPublicationForm.reset();
    }

    else if (this.searchPublicationForm.value.identifier === 'ISBN') {

      const isbn = this.searchPublicationISBNForm.value.isbnSearch;
      this.publicationService.searchSinglePublication(this.searchPublicationForm.value.identifier, isbn).subscribe({
        next: (result) => {

          console.log(result)
          this.store.dispatch(setLoadingAction({ status: false }));

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: result.message
          }
          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);


          this.publicationsFoundBasedOnISBNFromCrossRef = result.publications
          console.log(result.publications.length)

          if (result.publications.length > 1) {
            //συσχέτιση μεταβλητής crossRefPublications με τον πίνακα publicationsFoundBasedOnISBNFromCrossRef που θα αποθηκεύεται η απάντηση των publications απο το back
            this.crossRefPublications = new MatTableDataSource(this.publicationsFoundBasedOnISBNFromCrossRef);

            const dialogManyPublicationIdBasedConfig = new MatDialogConfig();

            dialogManyPublicationIdBasedConfig.data = {
              newPublications: result.publications,
              publications: this.crossRefPublications
            }

            dialogManyPublicationIdBasedConfig.panelClass = 'refss_class_dialog'
            this.dialog.open(DialogAddManyPublicationIdBasedComponent, dialogManyPublicationIdBasedConfig);
            this.searchPublicationISBNForm.reset();
          }


        },
        error: (error) => {
          console.log(error)
          this.store.dispatch(setLoadingAction({ status: false }));
        }
      });
      this.searchPublicationForm.reset();
    }

    else if (this.searchPublicationForm.value.identifier === 'Title') {

      const title = this.searchPublicationTitleForm.value.titleSearch;
      this.publicationService.searchSinglePublication(this.searchPublicationForm.value.identifier, title).subscribe({
        next: (result) => {

          this.store.dispatch(setLoadingAction({ status: false }));

          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: result.message
          }
          this.searchPublicationTitleForm.reset();

          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);
          this.publicationsFoundBasedOnISBNFromCrossRef = result.publications;

          this.crossRefPublications = new MatTableDataSource(this.publicationsFoundBasedOnISBNFromCrossRef);
          this.searchPublicationISBNForm.reset();
          if (result.publications.length > 1) {
            //συσχέτιση μεταβλητής crossRefPublications με τον πίνακα publicationsFoundBasedOnISBNFromCrossRef που θα αποθηκεύεται η απάντηση των publications απο το back
            this.crossRefPublications = new MatTableDataSource(this.publicationsFoundBasedOnISBNFromCrossRef);

            const dialogManyPublicationIdBasedConfig = new MatDialogConfig();

            dialogManyPublicationIdBasedConfig.data = {
              newPublications: result.publications,
              publications: this.crossRefPublications
            }

            dialogManyPublicationIdBasedConfig.panelClass = 'refss_class_dialog'
            this.dialog.open(DialogAddManyPublicationIdBasedComponent, dialogManyPublicationIdBasedConfig);
            this.searchPublicationISBNForm.reset();
          }

        },
        error: (error) => {
          console.log(error)
          this.store.dispatch(setLoadingAction({ status: false }));
        }
      });

      console.log(title);
      this.searchPublicationForm.reset();
    }

    else {
      return;
    }



  }


  toPublicationFromCrossRefLink(link: string) {
    window.open(link, "_blank");
  }

  //Μέθοδος για την προσθήκη tag χειρονακτικά
  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();


    if (value) {
      const tag = {
        keyword: value
      }

      this.tags.push(tag)

    }
    event.chipInput!.clear();
    this.tagCtrl.setValue(null);



  }


  //αφαίρεση tag απο το input
  remove(keyword: string): void {

    const index = this.tags.findIndex(tag => tag.keyword === keyword);
    console.log(index);
    if (index >= 0) {
      this.tags.splice(index, 1);
    }

  }




  //Μέθοδος για την προσθήκη ενός tag στο input, όταν επιλέγεται απο το autocomplete
  selected(event: MatAutocompleteSelectedEvent): void {
    this.tags.push(event.option.value)
  }

  onFileSelected(event: any): void {

    const file: File = event.target.files[0];

    if (file) {

      console.log(file)
      this.fileSected = true
      this.fileName = file.name;
      this.selectedFile = file;
    }

    else {

      this.typeFiles = true

    }

  }

  onFilePresentantionSelected(event: any): void {

    const file: File = event.target.files[0];



    if (file) {

      //console.log(file)
      console.log(file.name)
      this.fileSectedPresentantion = true
      this.fileNamePresentantion = file.name;
      this.selectedPresentantionFile = file;

    }

    else {

      this.typeFilesPresentantion = true

    }
  }


  sendDataSimpleSearch(event: any) {

    let query: string = event.target.value.trim();

    if (query.length === 0) {

      this.liveAuthorsFromDb = [];
      return;
    }
    this.searchAuthors.next(query);


  }

  addAuthor(event: MatAutocompleteSelectedEvent) {
    console.log("ADD", event.option.value)

    if (event.option.value) {
      //this.authorsSelected.push(event.option.value);
      this.authorsCtrl.setValue(null);

      this.authorsSelectedNew.push(event.option.value)

      this.authorsCtrl.setValue(event.option.value);


    }
  }

  addPlace(event: MatAutocompleteSelectedEvent) {


    if (event.option.value) {

      console.log(event.option.value)

      this.publicationPlace = {
        publication_place_id: event.option.value.publication_place_id,
        name: event.option.value.name,
        type: event.option.value.type,
      }


      this.publicationPlaceCrtl.setValue(event.option.value.name);



    }



  }



  removeAuthor(author: { id: any; firstName: string; lastName: string; type: string }): void {

    //const index = this.authorsSelected.indexOf(author);
    const index = this.authorsSelectedNew.indexOf(author);


    if (index >= 0) {
      this.authorsSelectedNew.splice(index, 1);
    }
  }

  openAuthorAddManually() {
    console.log("ADD MANUALLY");



    const dialogAuthorConfig = new MatDialogConfig();

    dialogAuthorConfig.disableClose = true;
    dialogAuthorConfig.autoFocus = true;
    dialogAuthorConfig.width = '800px';

    const dialogRef = this.dialog.open(DialogAddAuthorManuallyComponent, dialogAuthorConfig);

    dialogRef.afterClosed().subscribe({
      next: (result) => {



        if (result) {
          console.log(result.author.firstName + " " + result.author.lastName)

          this.authorsSelectedNew.push({
            id: result.author.externalAuthor_id,
            firstName: result.author.firstName,
            lastName: result.author.lastName,
            type: 'External'

          })

          this.authorsCtrl.setValue(result.author.firstName + " " + result.author.lastName);

          console.log(this.authorsSelectedNew)
        }


      }
    })

  }



  sendDataPublicationPlaceSearch(event: any) {

    let query: string = event.target.value.trim();

    if (query.length === 0) {

      this.livepublicationPlacesFromDb = [];
      return;
    }
    this.searchPublicationPlaces.next(query);

  }


  //Μέθοδος για άνοιγμα του dialog για χειρωκίνητη εισαγωγή τόπου
  openPublicationPlaceAddManually() {


    //Ρυθμίσεις dialog
    const dialogAuthorConfig = new MatDialogConfig();
    dialogAuthorConfig.disableClose = true;
    dialogAuthorConfig.autoFocus = true;
    dialogAuthorConfig.width = '800px';
    const dialogRef = this.dialog.open(DialogAddPublicationPlaceComponent, dialogAuthorConfig);


    //Αφού κλείσουμε το dialog παίρνουμε την τιμή που στέλνει που στην ουσία είανι το response το backenc για την δημιουργία του τόπου
    dialogRef.afterClosed().subscribe({
      next: (result) => {

        if (result) {

          //Αν υπάρχει αποτέλεσμα αποθηκεύουμε το αποτέλεσμα σε ένα αντικείμενο
          this.publicationPlace = {
            publication_place_id: result.publication_place_created.publication_place_id,
            name: result.publication_place_created.name,
            type: result.publication_place_created.type,
          }

        }


      }
    })


  }


  openAddManulaRef() {

    //Ρυθμίσεις dialog
    const dialogAuthorConfig = new MatDialogConfig();
    dialogAuthorConfig.disableClose = true;
    dialogAuthorConfig.autoFocus = true;
    dialogAuthorConfig.width = '800px';
    const dialogRef = this.dialog.open(DialogAddRefManualComponent, dialogAuthorConfig);


    //Αφού κλείσουμε το dialog παίρνουμε την τιμή που στέλνει που στην ουσία είανι το response το backenc για την δημιουργία του τόπου
    dialogRef.afterClosed().subscribe({
      next: (result) => {

        console.log(result)

        this.addReference(result)



      }
    })

  }


  removeContentFile(content_file_id: string) {
    this.publicationService.removeSingleContentFile(content_file_id);
  }

  dialogForReplaceContentFile(content_file_id: string, content_file_name: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      content_file_id: content_file_id,
      content_file_name: content_file_name,
      publicationName: this.publication.title
    }

    this.dialog.open(DialogReplaceContentFileComponent, dialogCreateConfig);


  }

  downloadContentFile(content_file_id: string, filename: string) {
    this.publicationService.downloadContentFile(content_file_id, filename);
  }

  removePresentantionFile(presentantion_file_id: string) {
    console.log(presentantion_file_id)
    this.publicationService.removeSinglePresentantionFile(presentantion_file_id);
  }

  dialogForReplacePresentantionFile(presentantion_file_id: string, presentantion_file_name: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      presentantion_file_id: presentantion_file_id,
      presentantion_file_name: presentantion_file_name,
      publicationName: this.publication.title
    }

    this.dialog.open(DialogReplacePresentantionFileComponent, dialogCreateConfig);


  }

  downloadPresentantionFile(presentantion_file_id: string, filename: string) {

    console.log("Presentantio file")
    this.publicationService.downloadPresentantionFile(presentantion_file_id, filename);
  }




  ngOnDestroy() {

  }



}



