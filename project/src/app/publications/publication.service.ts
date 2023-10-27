import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, Subject, tap } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Tag } from '../models/tag.model';
import { Publication, PublicationType } from '../models/publication.model';
import { Article } from '../models/article.model';
import { Book } from '../models/book.model';
import { Proceedings } from '../models/proceedings.model';
import { Thesis } from '../models/thesis.model';
import { BookChapter } from '../models/bookChapter.model';
import { TechReport } from '../models/techReport.model';
import { ExternalReference } from '../models/externalReference.model';
import { ErrorComponent } from '../error/error.component';
import { SuccessComponent } from '../success/success.component';
import { Store } from '@ngrx/store';
import { setLoadingAction } from '../core/state/spinner';
import { P } from '@angular/cdk/keycodes';
import { Other } from '../models/other.model';
import { AuthService } from '../auth/auth.service';
import { PublicationPlace } from '../models/publication.place.model';
import { ReferenceDialogComponent } from '../references/reference-dialog/reference-dialog.component';



@Injectable({
  providedIn: 'root'
})
export class PublicationsService {

  private publications: any[] = [];
  private publicationsUpdated = new Subject<any[]>();

  private myPublications: any[] = [];
  private myPublicationsUpdated = new Subject<any[]>();


  private searchedPublications: any[] = [];
  private searchedPublicationsUpdated = new Subject<any[]>();

  private filesPublications: {}[] = []

  //Μεταβλητέ για τα αρχεία
  private contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[] = [];
  private contentFilesUpdated = new Subject<{ content_file_id: any, filename: string, path: string, type: string, access: string }[]>();

  private presentantionFiles: { presentantion_file_id: any, filename: string, path: string, type: string, access: string }[] = [];
  private presentantionFilesUpdated = new Subject<{ presentantion_file_id: any, filename: string, path: string, type: string, access: string }[]>();



  private messageSuccessListener = new Subject<{ sent: boolean, message: string }>();

  private tags: Tag[] = [];
  private tagsUpdated = new Subject<Tag[]>();

  private categories!: { category_id: any, name: string, description: string }[];
  private categoriesUpdated = new Subject<{ category_id: any, name: string, description: string }[]>();


  //Μεταβλητή τύπου Subject για να περάσουμε τις τιμές των εξωτερικών Δημοσιεύσεων
  // σε περίπτωση που βρεθούνε πολλαπλές απο τις πηγές. Έτσι ώστε να δώσουμε την δυνατότητα
  // στον χρήστη να επιλέξει ποιές θέλει ώς αναφορές
  private externalRefsUpdated = new Subject<string[]>();




  constructor(public authService: AuthService, private http: HttpClient, private dialog: MatDialog, private router: Router, private store: Store) { }


  addNewPublication(publicationToAdd: PublicationType, contentFile: File, presentantionFile: File) {
    let sectionObj;


    switch (publicationToAdd.section) {
      case 'Article':
        sectionObj = publicationToAdd as Article;
        break;

      case 'Book':
        sectionObj = publicationToAdd as Book;
        break;

      case 'Proceedings':
        sectionObj = publicationToAdd as Proceedings;
        break;

      case 'Thesis':
        sectionObj = publicationToAdd as Thesis;
        break;

      case 'Book_Chapter':
        sectionObj = publicationToAdd as BookChapter;
        break;

      case 'Tech_Report':
        sectionObj = publicationToAdd as TechReport;
        break;

      case 'Other':
        sectionObj = publicationToAdd as Other;
        break;
    }

    console.log(publicationToAdd)
    const formData = new FormData();
    if (contentFile) {
      console.log(contentFile)
      formData.append('contentFile', contentFile);
    }

    if (presentantionFile) {
      formData.append('presentantionFile', presentantionFile);
    }

    // Append other data to the FormData object

    formData.append('publication', JSON.stringify(sectionObj));







    this.http.post<{ message: string, references: { title: string, link: string, year: string }[], publication: PublicationType, publicationType: PublicationType }>
      ("https://localhost:3000/publications/addPublication", formData).subscribe({
        next: (response) => {
          const id = response.publication.publication_id;
          publicationToAdd.publication_id = id;
          console.log(response)
          const existingPublication = this.myPublications.find(pub => pub.publication_id === publicationToAdd.publication_id);
          const existingPublicationForAll = this.publications.find(pub => pub.publication_id === publicationToAdd.publication_id);

          //Προσθήκη δημοσίευσης στον πίνακα myPublications
          if (!existingPublication) {
            this.myPublications.push(publicationToAdd);
            this.myPublicationsUpdated.next([...this.myPublications]);
          }

          //Προσθήκη δημοσίευσης στον πίνακα publications
          if (!existingPublicationForAll) {
            this.publications.push(publicationToAdd);
            this.publicationsUpdated.next([...this.publications]);
          }



          //Αν επιστραφεί πίνακας references τότε σημαίνει ότι βρέθηκαν πολλές δημοσιεύσεις για αναφορές
          if (response.references) {
            console.log(response.references);


            const dialogReConfig = new MatDialogConfig();

            dialogReConfig.data = { references: response.references, publicationId: response.publication.publication_id }

            dialogReConfig.panelClass = 'refss_class_dialog'

            this.store.dispatch(setLoadingAction({ status: false }));
            this.dialog.open(ReferenceDialogComponent, dialogReConfig);



          }

          this.store.dispatch(setLoadingAction({ status: false }));
          ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';
          this.dialog.open(SuccessComponent, dialogMessageConfig);
        }
      })

  }



  getPublications() {
    return this.http.get<{ message: string, publications: PublicationType[] }>("https://localhost:3000/publications/allPublications");
  }

  getAllPublications() {
    this.http.get<{ message: string, publications: PublicationType[] }>("https://localhost:3000/publications/allPublications").pipe(map((allPublicationData) => {


      console.log(allPublicationData)

      return allPublicationData.publications.map(publication => {
        return {
          publication_id: publication.publication_id,
          userId: publication.userId,
          title: publication.title,
          section: publication.section,
          abstract: publication.abstract,
          isbn: publication.isbn,
          doi: publication.doi,
          year: publication.year,
          accessibility: publication.accessibility,
          notes: publication.notes
        }


      })

    })).subscribe(transformedAllPublications => {

      this.publications = transformedAllPublications;
      this.publicationsUpdated.next([...this.publications])

    })
  }


  getAllMyPublications() {

    console.log("GET ALL CALLED")
    this.http.get<{ message: string, publications: PublicationType[] }>("https://localhost:3000/publications/allMyPublications")
      .pipe(map((publicationData) => {

        console.log(publicationData)
        return publicationData.publications.map(publication => {
          return {
            publication_id: publication.publication_id,
            userId: publication.userId,
            title: publication.title,
            section: publication.section,
            abstract: publication.abstract,
            isbn: publication.isbn,
            doi: publication.doi,
            year: publication.year,
            accessibility: publication.accessibility,
            notes: publication.notes
          }

        })
      }))

      .subscribe(transformedPublications => {
        this.myPublications = transformedPublications;
        this.myPublicationsUpdated.next([...this.myPublications])
        console.log(this.myPublications)
      })
  }


  getAllPublicationsUpdateListener() {
    return this.publicationsUpdated.asObservable();
  }


  getPublicationUpdateListener() {

    console.log(this.publicationsUpdated.subscribe(value => {
      console.log(value)
    }))
    return this.publicationsUpdated.asObservable();

  }

  getMyPublicationsUpdateListener() {
    return this.myPublicationsUpdated.asObservable();
  }

  getPublication(id: any): Observable<any> {
    console.log(id);
    return this.http.get<{
      publication: Publication,
      place: { publication_place_id: any, name: string, type: string },
      presentantionFile: { content_file_id: any, filename: string, path: string, access: string, type: string },
      contentFile: { content_file_id: any, filename: string, path: string, access: string, type: string },
      externalreferences: { externalPublication_id: any, title: string, year: string, link: string }[],
      externalAuthors: { userId: any, firstName: string, lastName: string }[],
      internalAuthors: { user_id: any, firstName: string, lastName: string }[],
      publicationStat: { citations: number, references: number, num_of_exported_content_file: number, num_of_exported_presentation_file: number, reqs_of_exported_content_file: number, reqs_of_exported_presentation_file: number }
    }>("https://localhost:3000/publications/singlePublication/" + id);

  }


  //Μέθοδος που επιστρέφει την μεταβλητή ώς Observable για να ενημερώνονται οι observers που έχουν κάνει subscribe
  getExternalRefUpdateListener() {
    return this.externalRefsUpdated.asObservable();
  }

  getTags() {

    this.http.get<{ message: string, tags: Tag[] }>("https://localhost:3000/tags/allTags").subscribe(tagsFound => {

      console.log(tagsFound)
      this.tags = tagsFound.tags;
      this.tagsUpdated.next([...this.tags]);

    })
  }

  getTagUpdateListener() {
    return this.tagsUpdated.asObservable();
  }

  getmessageSuccessListener() {
    return this.messageSuccessListener;
  }

  getSearchedPublicationsUpdateListener() {
    return this.searchedPublicationsUpdated.asObservable();
  }

  addPublication(publication: PublicationType) {
    return this.http.post<{ message: string, sectionId: number, publication_id: number, publication: PublicationType, references: ExternalReference[], queySearches: string[] }>("https://localhost:3000/publications/addPublication", publication);
  }


  searchExternalReferences(word: string) {

    const querySearch = {
      query: word
    }

    return this.http.post<{ ref: { title: string }[] }>("https://localhost:3000/publications/getLiveExternalPublications", querySearch);

  }

  searchInternalReferences(word: string) {

    const querySearch = { query: word }

    console.log(querySearch)

    return this.http.post<{ ref: { title: string }[] }>("https://localhost:3000/publications/getLiveInternalPublications", querySearch);

  }



  updatePublication(publication_id: string | null, publication: PublicationType, article?: Article, book?: Book, proceeding?: Proceedings, thesis?: Thesis, book_chapter?: BookChapter, tech_report?: TechReport, other?: Other) {


    // Παίρνουμε τις τιμές με τα keyword από τα tags και τα τοποθετούμε στον tags
    let tags: string[] = [];
    publication.tags.map(tag => {

      tags.push(tag.keyword)

    })

    //Δημιουργία αντικειμένο tag
    const newPublicaiton = {
      publication_id: publication.publication_id,
      title: publication.title,
      section: publication.section,
      abstract: publication.abstract,
      isbn: publication.isbn,
      doi: publication.doi,
      year: publication.year,
      accessibility: publication.accessibility,
      notes: publication.notes,
      tags: tags
    }




    let sectionObj: Article | Book | Proceedings | Thesis | BookChapter | TechReport | Other | undefined;
    switch (publication.section) {

      case 'Article':
        sectionObj = article
        console.log(sectionObj)
        break;

      case 'Book':
        sectionObj = book
        break;

      case 'Proceedings':
        sectionObj = proceeding
        break;

      case 'Thesis':
        sectionObj = thesis
        break;

      case 'Book Chapter':
        console.log(sectionObj)

        sectionObj = book_chapter
        break;

      case 'Tech Report':
        sectionObj = tech_report
        break;

      case 'Other':
        sectionObj = other
        break;

    }

    const objectToUpdate = {
      newPublicaiton: newPublicaiton,
      sectionObj: sectionObj
    }



    console.log(sectionObj)



    this.http.put<{ scholarResults: { title: string, link: string, year: string }[], sectionId: number, message: string, publication: any }>("https://localhost:3000/publications/" + publication_id, sectionObj).subscribe({


      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));

        console.log(response)
        const id = Number(response.publication.publication_id);
        console.log(id)



        //Αλλαγή των δημοσιεύεων του τρέχων χρήστη
        const updatedPublications = this.myPublications.map(p => {
          if (Number(p.publication_id) === Number(id)) {
            console.log(p);
            return sectionObj;
          }
          return p;
        });
        this.myPublications = updatedPublications;
        this.myPublicationsUpdated.next([...this.myPublications]);


        //Αλλαγή όλων των δημοσιεύσεων
        const updatedAllPublications = this.publications.map(p => {
          if (Number(p.publication_id) === Number(id)) {
            console.log(p);
            return sectionObj;
          }
          return p;
        });
        this.publications = updatedAllPublications;
        this.publicationsUpdated.next([...this.publications]);


        //Αν ο χρήστης εισάγει ένα πιο γενικό τίτλο για αναφορά τότε ο server επιστρέφει τις 10 πρώτες δημοσιεύσεις προς επιλογή για τον χρήστη
        if (response.scholarResults.length >= 1) {

          const dialogReConfig = new MatDialogConfig();

          dialogReConfig.data = { references: response.scholarResults, publicationId: publication_id }

          dialogReConfig.panelClass = 'refss_class_dialog'

          this.store.dispatch(setLoadingAction({ status: false }));
          this.dialog.open(ReferenceDialogComponent, dialogReConfig);


        }



        //Εμφάνιση μηνύματος
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);



      }

    })

  }


  deletePublication(publication_id: string) {

    console.log(typeof (publication_id))


    this.http.delete<{ message: string }>("https://localhost:3000/publications/singlePublication/" + publication_id).subscribe((responseData) => {


      //---Ανανέωση όλων των δημοσιεύσεων
      //Αποθηκέυουμε το αποτέλεσματ της filter μεθόδου, που αφαιρεί στην ουσία τις δημοσιεύσεις που έχουμε id ίδιο με εκείνο της δημοσίευσης που μόλις διαγράψαμε.
      const updatePublications = this.publications.filter(publication => publication.publication_id !== publication_id);
      //Αποθηκεύουμε το αποτέλεμσα στον πίνακα
      this.publications = updatePublications;
      //Περνάμε copy του νέου πίνακα στο publicationsUpdated subject, για να ενημερωθούν όλοι οι observers για την νέα αλλαγή
      this.publicationsUpdated.next([...this.publications]);

      //Ανανέωση του πίνακα με τις Δημοσιεύσεις του τρέχοντος χρήστη
      const myUpdatedPublications = this.myPublications.filter(publication => publication.publication_id !== publication_id);
      this.myPublications = myUpdatedPublications;
      this.myPublicationsUpdated.next([...this.myPublications])

      //αλλαγή κατάστασης spinner
      this.store.dispatch(setLoadingAction({ status: false }));

      ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
      const dialogMessageConfig = new MatDialogConfig();
      dialogMessageConfig.data = {
        message: responseData.message
      }
      dialogMessageConfig.panelClass = 'success_class';

      this.dialog.open(SuccessComponent, dialogMessageConfig);



    })

  }



  deleteManyPublications(publicationIds: any[]) {

    const obj = {
      publicationIds: publicationIds
    }

    this.http.delete<{ message: string }>("https://localhost:3000/publications/deleteManyPublications", { body: obj }).subscribe({

      next: (response) => {


        //Αλλαγή ιδίων δημοσιεύσεων
        const updatedPublications = this.myPublications.filter(p => !publicationIds.includes(p.publication_id))
        this.myPublications = updatedPublications;
        this.myPublicationsUpdated.next([...this.myPublications]);

        //Αλλαγή όλων
        const updatedAllPublications = this.publications.filter(p => !publicationIds.includes(p.publication_id))
        this.publications = updatedAllPublications;
        this.publicationsUpdated.next([...this.publications]);


        this.store.dispatch(setLoadingAction({ status: false }));

        //Μήνυμα
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }

    })

  }


  addReferencePublication(externalReferences: ExternalReference[], publication_id: any) {


    this.http.post<{ message: string }>("https://localhost:3000/references/addMultipleExternalReferences/" + publication_id, externalReferences).subscribe({

      next: (succes) => {

        const dialogSuccessConfig = new MatDialogConfig();
        dialogSuccessConfig.data = {
          message: succes.message
        }
        dialogSuccessConfig.width = '560px';
        dialogSuccessConfig.height = '110px'
        dialogSuccessConfig.panelClass = 'success_class';
        this.dialog.open(SuccessComponent, dialogSuccessConfig);

      },

      error: (err) => {

        //Δημιουργία αντικειμένου dialog για το άνοιγμα του dialog για τα refs
        const dialogErrorConfig = new MatDialogConfig();
        //Αποστολή στο dialog ref, των refs που βρέθηκαν στην βάση

        dialogErrorConfig.panelClass = 'success_class'

        dialogErrorConfig.data = {
          message: err.error.message
        }
        //Ανοίγουμε το dialog των refs
        this.dialog.open(ErrorComponent, dialogErrorConfig);
      }

    })

  }


  searchSinglePublication(identifier: string, query: string) {



    const querySearch = {
      inputSearch: query,
      identifier: identifier
    }

    console.log(querySearch)

    if (identifier === 'DOI') {
      console.log(querySearch)
      return this.http.post<{ message: string, publications: any[] }>("https://localhost:3000/publications/searchSinglePublication", querySearch);
    }

    else if (identifier === 'aRxiv') {
      console.log(identifier)
      console.log(querySearch)
      return this.http.post<{ message: string, publications: any[] }>('https://localhost:3000/publications/searchSinglePublication', querySearch);
    }

    else if (identifier === 'ISBN') {
      console.log(identifier)
      console.log(querySearch)
      return this.http.post<{ message: string, publications: any[], sectionObject: any[] }>('https://localhost:3000/publications/searchSinglePublication', querySearch);
    }

    else {
      console.log(identifier)
      console.log(querySearch)
      return this.http.post<{ message: string, publications: any[] }>('https://localhost:3000/publications/searchSinglePublication', querySearch);
    }


  }



  addMultiplePublicationsBasedOnISBN(publications: any[]) {
    return this.http.post<{ message: string, publications: any[] }>("https://localhost:3000/publications/addMultiplePublicationBasedOnISBN", publications);
  }


  searchAuthor(authorName: string) {

    const author = {
      author: authorName
    }

    return this.http.post<{ message: string, Authors: any[] }>("https://localhost:3000/publications/searchPublicationsBasedOnAuthor", author)

  }

  addPublicationsBasedonAuthor(author_id: string, author_name: string) {

    const author = {
      author_id: author_id,
      author_name: author_name
    }

    console.log(author)
    return this.http.post<{ message: string, publications: any[] }>("https://localhost:3000/publications/addPublicationsBasedOnAuthorId", author);


  }


  addDesctriptionFile(file: File) {

    console.log(file)

    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      this.http.post<{ message: string }>('https://localhost:3000/publications/uploadDescriptionFile', formData).subscribe({
        next: (response) => {
          //αλλαγή κατάστασης spinner
          this.store.dispatch(setLoadingAction({ status: false }));
          ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
          const dialogMessageConfig = new MatDialogConfig();
          dialogMessageConfig.data = {
            message: response.message
          }
          dialogMessageConfig.panelClass = 'success_class';

          this.dialog.open(SuccessComponent, dialogMessageConfig);
        }
      })

    }

  }


  exportSinglePublication(fileType: string, publicationId: any) {

    console.log(fileType, publicationId)

    const publicationData = {
      fileType: fileType,
      publicationId: publicationId
    }


    this.http.post("https://localhost:3000/publications/exportSinglePublicaiton", publicationData, { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {


        const blob = new Blob([data], { type: 'text/x-bibtex;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        let dateTime = new Date();
        let day = dateTime.getDate();
        let month = dateTime.getMonth() + 1;
        let year = dateTime.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        let userId = this.authService.getUserId();

        link.download = `P${publicationId}U${userId}D(${currentDate}).${fileType}`;
        link.click();

      }
    })

  }


  exportManyPublications(fileType: string, publicationIds: any[]) {


    const publicationData = {
      fileType: fileType,
      publicationIds: publicationIds
    }

    this.http.post("https://localhost:3000/publications/exportMultiplePublications", publicationData, { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {

        console.log(data)
        const file_type = fileType; // or 'rdf' depending on your file type

        const blob = new Blob([data], { type: 'text/x-bibtex;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        let dateTime = new Date();
        let day = dateTime.getDate();
        let month = dateTime.getMonth() + 1;
        let year = dateTime.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        let userId = this.authService.getUserId();

        link.download = `U${userId}D(${currentDate}).${fileType}`;
        link.click();

      }
    })

  }

  exportPublicationsCategory(fileType: string, categoryId: any) {

    const objData = {
      fileType: fileType,
      categoryId: categoryId
    }


    this.http.post("https://localhost:3000/publications/exportsPublicationsCategory", objData, { responseType: 'blob' }).subscribe({
      next: (data: Blob) => {

        console.log(data)
        const file_type = fileType; // or 'rdf' depending on your file type

        const blob = new Blob([data], { type: 'text/x-bibtex;charset=utf-8' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        let dateTime = new Date();
        let day = dateTime.getDate();
        let month = dateTime.getMonth() + 1;
        let year = dateTime.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        let userId = this.authService.getUserId();

        link.download = `U${userId}D(${currentDate}).${fileType}`;
        link.click();


      }
    })

  }


  simpleSearchInternalPublications(word: string, type: string) {

    const querySearch = {
      query: word,
      type: type
    }

    console.log(querySearch)

    return this.http.post<{ publiactionYearBased: { title: string, publication_id: any, section: string, year: string, abstract: string }[], publicationsTitleBased: { title: string, publication_id: any, section: string, year: string, abstract: string }[], publicationsAbstractBased: { title: string, publication_id: any, section: string, year: string, abstract: string }[] }>("https://localhost:3000/publications/liveSimpleSearchPublications", querySearch);


  }


  shopisticatedSearchInternalPublications(objectSearch: { title: string, abstract: string, author: string, workshop: string, startYear: number, endYear: number | null, disableYearFilter: boolean }) {

    console.log(objectSearch)

    return this.http.post<{ publicationShopisticatedResults: { title: string, publication_id: any, section: string, year: string, abstract: string }[] }>("https://localhost:3000/publications/shopisticatedSearch", objectSearch);


  }



  isSeparator = (value: string): boolean => value === '/' || value === '\\' || value === ':'
  getExtension = (path: string): string => {
    for (let i = path.length - 1; i > -1; --i) {
      const value = path[i];
      if (value === '.') {
        if (i > 1) {
          if (this.isSeparator(path[i - 1])) {
            return '';
          }
          return path.substring(i + 1);
        }
        return '';
      }
      if (this.isSeparator(value)) {
        return '';
      }
    }
    return '';
  };

  uploadFilesForPublication(publicationId: string, contentFile: File, accessForContentFile: string, presentantionFile: File, accessForpresentantionFile: string) {


    console.log(presentantionFile)

    const formData = new FormData();
    let userId = this.authService.getUserId();

    let contentFileObj: { content_file_id: any; filename: string; path: string; type: string; access: string; }
    if (contentFile) {
      formData.append('contentFile', contentFile);
      formData.append('contentFileAccess', accessForContentFile);
      console.log(contentFile)

      const targetDirectory = `./uploads/${userId}/${publicationId}/${accessForContentFile}`;
      const targetPath = `${targetDirectory}/${contentFile.name}`;

      contentFileObj = {
        content_file_id: 1,
        filename: contentFile.name,
        path: targetPath,
        type: this.getExtension(targetPath),
        access: accessForContentFile,
      }

      this.contentFiles.push(contentFileObj)
      this.contentFilesUpdated.next([...this.contentFiles])


    }

    let presentantionFileObj: { presentantion_file_id: any; filename: string; path: string; type: string; access: string; };
    if (presentantionFile) {
      formData.append('presentantionFile', presentantionFile);
      formData.append('presentantionFileAccess', accessForpresentantionFile);

      const targetDirectory = `./uploads/${userId}/${publicationId}/${accessForContentFile}`;
      const targetPath = `${targetDirectory}/${presentantionFile.name}`;

      presentantionFileObj = {
        presentantion_file_id: 1,
        filename: presentantionFile.name,
        path: targetPath,
        type: this.getExtension(targetPath),
        access: accessForContentFile,
      }

      this.presentantionFiles.push(presentantionFileObj)
      this.presentantionFilesUpdated.next([...this.presentantionFiles])

    }


    console.log(formData.get('contentFile'))
    console.log(formData.get('presentantionFile'))


    this.http.post<{ message: string, presentantionFileId: any, contentFileId: any }>("https://localhost:3000/publications/uploadPublicationFile/" + publicationId, formData).subscribe({
      next: (response) => {



        //Ανανέωση του πίνακα με τα presentantionFiles
        if (presentantionFile) {
          const presentantion_fileId = response.presentantionFileId;
          presentantionFileObj.presentantion_file_id = presentantion_fileId;
          const existingpresentantionFile = this.presentantionFiles.find(pub => pub.presentantion_file_id === response.presentantionFileId)
          if (!existingpresentantionFile) {
            this.presentantionFiles.push(presentantionFileObj);
            this.presentantionFilesUpdated.next([...this.presentantionFiles])
          }
        }

        //Ανανέωση του πίνακα με τα contentFiles
        if (contentFile) {
          const content_fileId = response.contentFileId;
          contentFileObj.content_file_id = content_fileId;
          const existingpresentantionFile = this.contentFiles.find(cF => cF.content_file_id === response.contentFileId)
          if (!existingpresentantionFile) {
            this.contentFiles.push(contentFileObj);
            this.contentFilesUpdated.next([...this.contentFiles])
          }

        }

        console.log(response)
        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }
    })

  }




  getPublicationsFiles(publicationId: string) {

    this.http.get<{ contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[], presentantionFiles: { presentantion_file_id: any, filename: string, path: string, type: string, access: string }[] }>("https://localhost:3000/publications/publicationFiles/" + publicationId).subscribe({
      next: (response) => {
        console.log(response.contentFiles)
        console.log(response.presentantionFiles)

        this.contentFiles = response.contentFiles;
        this.contentFilesUpdated.next([...this.contentFiles])

        this.presentantionFiles = response.presentantionFiles;
        this.presentantionFilesUpdated.next([...this.presentantionFiles])


      }
    })


  }


  getMyPublicationsContentFilesUpdatedUpdateListener() {
    return this.contentFilesUpdated.asObservable();
  }

  getMyPublicationsPresentantionFilesUpdatedListener() {
    return this.presentantionFilesUpdated.asObservable();
  }


  removeSingleContentFile(content_file_id: string) {

    console.log(content_file_id)


    this.http.delete<{ message: string }>("https://localhost:3000/contentFiles/singleContentFile/" + content_file_id).subscribe({
      next: (response) => {



        //Ανανέωση πίνακα και subject
        this.contentFiles = this.contentFiles.filter(contentFile => contentFile.content_file_id !== Number(content_file_id));
        this.contentFilesUpdated.next([...this.contentFiles])
        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }
    })

  }

  removeSinglePresentantionFile(presentantion_file_id: string) {

    console.log(presentantion_file_id)
    this.http.delete<{ message: string }>("https://localhost:3000/presentantionFiles/singlePresentantionFile/" + presentantion_file_id).subscribe({
      next: (response) => {



        //Ανανέωση πίνακα και subject
        this.presentantionFiles = this.presentantionFiles.filter(pF => pF.presentantion_file_id !== Number(presentantion_file_id));
        this.presentantionFilesUpdated.next([...this.presentantionFiles])
        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }
    })


  }

  replaceContentFile(old_content_file_id: string, content_file: File, access: string) {

    const formData = new FormData();
    formData.append('contentFile', content_file);
    formData.append('contentFileAccess', access);

    console.log(content_file)


    this.http.post<{ message: string, newPath: string, newType: string }>("https://localhost:3000/contentFiles/replaceConentFile/" + old_content_file_id, formData).subscribe({

      next: (response) => {


        //Ανανέωση πίνακα και subject
        const targetIndex = this.contentFiles.findIndex(file => file.content_file_id === old_content_file_id);
        if (targetIndex !== -1) {
          const updatedContent = {
            content_file_id: old_content_file_id,
            filename: content_file.name,
            path: response.newPath,
            type: response.newType,
            access: access
          };
          this.contentFiles[targetIndex] = updatedContent;
        }
        this.contentFilesUpdated.next([...this.contentFiles]);

        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }

    })

  }

  replacePresentantionFile(old_presentantion_file_id: string, presentantion_file: File, access: string) {

    const formData = new FormData();
    formData.append('presentantionFile', presentantion_file);
    formData.append('presentantionFileAccess', access);

    this.http.post<{ message: string, newPath: string, newType: string }>("https://localhost:3000/presentantionFiles/replacePresentantionFile/" + old_presentantion_file_id, formData).subscribe({

      next: (response) => {


        //Ανανέωση πίνακα και subject
        const targetIndex = this.presentantionFiles.findIndex(file => file.presentantion_file_id === old_presentantion_file_id);
        if (targetIndex !== -1) {
          const updatedContent = {
            presentantion_file_id: old_presentantion_file_id,
            filename: presentantion_file.name,
            path: response.newPath,
            type: response.newType,
            access: access
          };
          this.presentantionFiles[targetIndex] = updatedContent;
        }
        this.presentantionFilesUpdated.next([...this.presentantionFiles]);


        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


      }
    })


  }


  downloadContentFile(content_file_id: string, filename: string) {

    const data = {
      content_file_id: content_file_id,
      filename: filename
    }

    console.log(data)

    this.http.post("https://localhost:3000/contentFiles/downloadContentFile", data, { responseType: 'blob' }).subscribe({

      next: (data: Blob) => {

        console.log(data)

        const blob = new Blob([data], { type: 'application/pdf' }); // Set MIME type to 'application/pdf'
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        let dateTime = new Date();
        let day = dateTime.getDate();
        let month = dateTime.getMonth() + 1;
        let year = dateTime.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        let userId = this.authService.getUserId();

        link.download = `C${content_file_id}U${userId}D(${currentDate}).pdf`; // Specify the file extension as '.pdf'
        link.click();

      }


    })


  }


  downloadPresentantionFile(presentantion_file_id: string, filename: string) {


    const data = {
      presentantion_file_id: presentantion_file_id,
      filename: filename
    }


    console.log(data)

    this.http.post("https://localhost:3000/presentantionFiles/downloadPresentantionFile", data, { responseType: 'blob' }).subscribe({

      next: (data: Blob) => {

        const fileType = data.type;
        const fileExtension = fileType.substring(fileType.lastIndexOf('/') + 1);


        console.log(data)

        const blob = new Blob([data], { type: fileExtension });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;

        let dateTime = new Date();
        let day = dateTime.getDate();
        let month = dateTime.getMonth() + 1;
        let year = dateTime.getFullYear();
        let currentDate = `${day}-${month}-${year}`;
        let userId = this.authService.getUserId();

        link.download = `P${presentantion_file_id}U${userId}D(${currentDate}).${fileType}`;
        link.click();

      }


    })


  }

  getPublicationsCategories(publication_id: string) {

    this.http.get<{ message: string, categories: { category_id: any, name: string, description: string }[] }>("https://localhost:3000/publications/publicationsCategories/" + publication_id).subscribe({
      next: (response) => {
        console.log(response.categories)

        this.categories = response.categories;
        this.categoriesUpdated.next([...this.categories])
      }
    })

  }


  getMyPublicationsCategoriesUpdatedUpdateListener() {
    return this.categoriesUpdated.asObservable();
  }


  simpleSearchAuthors(word: string) {

    const querySearch = {
      query: word
    }

    console.log(querySearch)

    return this.http.post<{
      resultForFirstNameBased: { firstName: string, lastName: string, userName: string, user_id: any }[],
      resultForLastNameBased: { firstName: string, lastName: string, userName: string, user_id: any }[],
      resultForUserNameBased: { firstName: string, lastName: string, userName: string, user_id: any }[],
      resultForFirstNameExternalBased: { firstName: string, lastName: string, externalAuthor_id: any }[],
      resultForLastNameExternalBased: { firstName: string, lastName: string, externalAuthor_id: any }[],

    }>("https://localhost:3000/users/getLiveUsers", querySearch);


  }


  addExternalAuthor(firstName: string, lastName: string) {

    const obj = {
      firstName: firstName,
      lastName: lastName
    }

    return this.http.post<{ message: string, externalAuthor: { externalAuthor_id: any, firstName: string, lastName: string } }>("https://localhost:3000/users/addExternalAuthor", obj);

  }


  addExternalRef(title: string, year: string, link: string) {


    const obj = {
      title: title,
      year: year,
      link: link
    }

    return this.http.post<{ message: string, externlRefCreated: { externalPublication_id: any, title: string, year: string, link: string } }>("https://localhost:3000/references/addExternalReference", obj);

  }



  simpleSearchPublicationPlaces(word: string) {

    const querySearch = {
      query: word
    }

    console.log(querySearch)

    return this.http.post<{
      resultForNameBased: { publication_place_id: any, name: string, type: string }[],
      resultForTypeBased: { publication_place_id: any, name: string, type: string }[],
    }>("https://localhost:3000/publicationPlaces/getLivePublicationPlaces", querySearch);


  }


  requestFile(requestObj: { fileId: any, fileName: string, fileType: string }) {



    this.http.post<{ message: string }>("https://localhost:3000/publications/requestFile", requestObj).subscribe({

      next: (response) => {
        console.log(response)




        this.store.dispatch(setLoadingAction({ status: false }));


        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);



      }

    });


  }


  addManyPublicationsTitleBased(objectsToAdd: {
    title: string, section: string, abstract: string, isbn: string, doi: string, year: string, accessibility: string, notes: string,
    article?: { jurnal: string, number: string, volume: string, pages: string, month: string },
    book?: { publisher: string, volume: string, series: string, pages: string, month: string, address: string, version: string },
    proceeding?: { editor: string, series: string, pages: string, month: string, organization: string, address: string, publisher: string },
    theses?: { school: string, type: string, month: string, address: string },
    chapterBk?: { chapter: string, publisher: string, pages: string, volume: string, series: string, type: string, month: string, address: string, version: string },
    techReport?: { address: string, month: string, number: string, type: string, tech_report_year: string, institution: string },
    other?: { subType: string, grantNumber: string, pages: string, month: string }
  }[]) {

    this.http.post<{ message: string }>("https://localhost:3000/publications/addManyPublicationsTitleBased", objectsToAdd).subscribe({

      next: (response) => {
        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);
      }


    })
  }


}
