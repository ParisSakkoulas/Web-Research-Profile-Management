import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { PageEvent } from '@angular/material/paginator';
import { MatRadioChange } from '@angular/material/radio';
import { Store } from '@ngrx/store';
import { Observable, Subject, debounceTime, distinctUntilChanged, of, tap } from 'rxjs';
import { setLoadingAction } from 'src/app/core/state/spinner/spinner.action';
import { PublicationsService } from 'src/app/publications/publication.service';

@Component({
  selector: 'app-search-publications-portal',
  templateUrl: './search-publications-portal.component.html',
  styleUrls: ['./search-publications-portal.component.css']
})
export class SearchPublicationsPortalComponent implements OnInit {



  searchTypes: string[] = ['Simple', 'Sophisticated'];
  searchTypeSelection = 'Simple';

  searchAllOrMine: string[] = ['All Publications', 'My Publications'];
  searchAllOrMy = 'All Publications';


  simpleSearchForm !: FormGroup;
  formIsTouched = false;
  options: string[] = ['Delhi', 'Mumbai', 'Banglore'];

  years!: number[];
  startYear!: number;
  endYear!: number | null;
  abstract !: string;
  title !: string;
  author !: string;
  workshopJournal !: string
  disableYearFilter = false;


  searchOwnPublications !: string;
  searchSpecialSelection !: string;

  //Simple search autocomplete variables
  livePublicationsFromDb: string[] = []
  private searchInternalPublications = new Subject<string>();

  internalPublicationsSearchLoading: boolean = false;

  filteredTitleBasedInternalSimpleOptions!: Observable<{ title: string, publication_id: any, section: string, year: string, abstract: string }[]>;
  filteredAbstractBasedInternalSimpleOptions!: Observable<{ title: string, publication_id: any, section: string, year: string, abstract: string }[]>;
  filteredYearBasedInternalSimpleOptions!: Observable<{ title: string, publication_id: any, section: string, year: string, abstract: string }[]>;


  filteredSophisticatedResults!: Observable<{ title: string, publication_id: any, section: string, year: string, abstract: string }[]>;
  @ViewChild('resultCard', { static: false }) resultCardElement!: ElementRef;

  totalSophisticatedPublications: number = 0;
  public pageSize = 5;
  public currentPage = 0;
  public pageSizeOptions = [5, 10, 15, 20];

  public pageSizeSimple = 5;
  public currentPageSimple = 0;
  displayedResultsSimpleTitle: any = []
  public pageSizeOptionsSimple = [5, 10, 15, 20]
  displayedResults: any[] = [];
  totalPublications!: number;
  currentPageDataTitleBased!: any[];
  currentPageDataAbstractBased!: any[];
  currentPageDataYearBased !: any[];

  selectedValue !: string; //my or all

  constructor(private store: Store, private fb: FormBuilder, public publicationService: PublicationsService) { }

  ngOnInit(): void {

    //αρχικοποίηση φόρμας για αναζήτηση δημοσιευσης
    this.simpleSearchForm = this.fb.group({
      searchTerm: new FormControl(''),
    })

    this.years = this.generateYearArray(1900, new Date().getFullYear());
    this.startYear = 2000;
    this.endYear = 2023;
    this.abstract = '';
    this.title = '';
    this.author = '';
    this.workshopJournal = '';




    console.log(this.disableYearFilter)



    //Αναμένουμε κάποια δευτερόλεπτα και μετά στέλνουμε τον input του χρήστη για αναζήτηση δημοσιεύσεων με βάση τον τίτλο από τη βάση
    this.searchInternalPublications.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => {

        this.formIsTouched = true;
        this.internalPublicationsSearchLoading = true;
      }),
    ).subscribe((query: string) => {


      let type;
      if (this.searchAllOrMy === 'All Publications') {
        type = 'All'
      }
      else {
        type = 'My'
      }
      this.totalPublications = 0;
      this.publicationService.simpleSearchInternalPublications(query.trim(), type).subscribe(result => {

        this.filteredTitleBasedInternalSimpleOptions = of(result.publicationsTitleBased.map(p => ({ title: p.title, publication_id: p.publication_id, section: p.section, year: p.year, abstract: p.abstract })));
        this.filteredAbstractBasedInternalSimpleOptions = of(result.publicationsAbstractBased.map(p => ({ title: p.title, publication_id: p.publication_id, section: p.section, year: p.year, abstract: p.abstract })));
        this.filteredYearBasedInternalSimpleOptions = of(result.publiactionYearBased.map(p => ({ title: p.title, publication_id: p.publication_id, section: p.section, year: p.year, abstract: p.abstract })));

        this.totalPublications += result.publicationsTitleBased.length ? result.publicationsTitleBased.length : this.totalPublications
        this.totalPublications += result.publicationsAbstractBased.length ? result.publicationsAbstractBased.length : this.totalPublications
        this.totalPublications += result.publiactionYearBased.length ? result.publiactionYearBased.length : this.totalPublications


        this.updateDisplayedPublicationsSimple()


        this.internalPublicationsSearchLoading = false;

        console.log(this.totalPublications)

      })




    });

  }


  onYearDisableChange(event: MatCheckboxChange) {
    this.disableYearFilter = !this.disableYearFilter;
    console.log(this.disableYearFilter)
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




  //for paginator shophisticated
  onPageChange(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updateDisplayedPublications();
  }

  //for paginator shophisticated
  updateDisplayedPublications() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredSophisticatedResults.subscribe(results => {
      this.displayedResults = results.slice(startIndex, endIndex);
    });
  }

  //for paginator simple
  onPageChangeSimple(event: PageEvent) {

    this.currentPageSimple = event.pageIndex;
    this.pageSizeSimple = event.pageSize;

    console.log("Current page ", this.currentPageSimple)
    console.log(this.pageSizeSimple)

    this.updateDisplayedPublicationsSimple();
  }

  //for paginator simple
  updateDisplayedPublicationsSimple() {
    const startIndex = this.currentPageSimple * this.pageSizeSimple;
    const endIndex = startIndex + this.pageSizeSimple;

    //title update
    this.filteredTitleBasedInternalSimpleOptions.subscribe(results => {
      this.currentPageDataTitleBased = results.slice(startIndex, endIndex);
      console.log(this.currentPageDataTitleBased)
      console.log(results)

    });

    this.filteredAbstractBasedInternalSimpleOptions.subscribe(results => {
      this.currentPageDataAbstractBased = results.slice(startIndex, endIndex);
      console.log(results.slice(startIndex, endIndex))
    });

    this.filteredYearBasedInternalSimpleOptions.subscribe(results => {
      this.currentPageDataYearBased = results.slice(startIndex, endIndex);
      console.log(results.slice(startIndex, endIndex))
    });
  }



  onShopisticatedSearch() {

    let type;
    if (this.searchAllOrMy === 'All Publications') {
      type = 'All'
    }
    else {
      type = 'My'
    }




    let searchObject = {
      title: this.title,
      abstract: this.abstract,
      author: this.author,
      workshop: this.workshopJournal,
      startYear: this.startYear,
      endYear: this.endYear,
      type: type,
      disableYearFilter: this.disableYearFilter
    }

    console.log(searchObject)

    this.store.dispatch(setLoadingAction({ status: true }));
    this.publicationService.shopisticatedSearchInternalPublications(searchObject).subscribe({
      next: (result) => {

        console.log(result.publicationShopisticatedResults.length)

        this.totalPublications = result.publicationShopisticatedResults.length
        this.filteredSophisticatedResults = of(result.publicationShopisticatedResults);
        this.store.dispatch(setLoadingAction({ status: false }));
        this.resultCardElement.nativeElement.scrollIntoView({ behavior: 'smooth' });
        this.updateDisplayedPublications()
      }
    });
  }


  clearSophisticatedForm() {


    this.years = this.generateYearArray(1900, new Date().getFullYear());
    this.startYear = 1900;
    this.endYear = 2023;
    this.abstract = '';
    this.title = '';
    this.author = '';
    this.workshopJournal = '';
  }


  onSimpleSearch() {

  }


  onMyAllPubsChange(event: MatRadioChange) {
    const selectedValue = event.value;
    console.log('Selected value:', selectedValue);
    const query = this.simpleSearchForm.get('searchTerm')?.value;

    if (query.length === 0) {

      this.livePublicationsFromDb = [];
      return;
    }
    this.searchInternalPublications.next(query);


  }

  sendDataSimpleSearch(event: any) {

    let query: string = event.target.value.trim();

    if (query.length === 0) {

      this.livePublicationsFromDb = [];
      return;
    }
    this.searchInternalPublications.next(query);


  }

  clearSimpleForm() {
    console.log("clear called")
    this.simpleSearchForm.reset()
  }

}
