import { Component, HostListener, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { Article } from 'src/app/models/article.model';
import { Book } from 'src/app/models/book.model';
import { BookChapter } from 'src/app/models/bookChapter.model';
import { Proceedings } from 'src/app/models/proceedings.model';
import { Publication } from 'src/app/models/publication.model';
import { TechReport } from 'src/app/models/techReport.model';
import { Thesis } from 'src/app/models/thesis.model';
import { PublicationsService } from '../publication.service';
import { Tag } from 'src/app/models/tag.model';
import { ExternalReference } from 'src/app/models/externalReference.model';
import { AuthService } from 'src/app/auth/auth.service';
import { Subscription } from 'rxjs';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { DialogAddPubComponent } from 'src/app/category/dialog-add-pub/dialog-add-pub.component';
import { DialogExportSinglePublicationComponent } from '../dialog-export-single-publication/dialog-export-single-publication.component';
import { DialogUploadFilesComponent } from '../dialog-upload-files/dialog-upload-files.component';
import { DialogDeleteOneComponent } from '../dialog-delete-one/dialog-delete-one.component';
import { DialogReplaceContentFileComponent } from '../dialog-replace-content-file/dialog-replace-content-file.component';
import { DialogReplacePresentantionFileComponent } from '../dialog-replace-presentantion-file/dialog-replace-presentantion-file.component';
import { DialogRequestFileComponent } from '../dialog-request-file/dialog-request-file.component';


@Component({
  selector: 'app-publication-single',
  templateUrl: './publication-single.component.html',
  styleUrls: ['./publication-single.component.css']
})
export class PublicationSingleComponent implements OnInit {

  private publicationId: any;
  public publication !: Publication;
  public publicationFound = false;

  public tags!: string[];
  public hideTags = true;
  public imageMoreTags = 'expand_more';

  public article !: Article;
  public book!: Book;
  public proceedings !: Proceedings;
  public thesis !: Thesis;
  public chapterBk !: BookChapter;
  public techReport !: TechReport;
  public other !: { subType: string, grantNumber: string, pages: string, month: string };


  public authors !: string[];

  public currentUser!: { user_id: any, firstName: string | null, lastName: string | null, userName: string | null, email: string | null, userRole: string | null };


  //Για το πως θα εμανίζονται τα στατιστικά
  UIoption: boolean = true;
  public similarResearches !: { publication_id: number, title: string, section: string, access: string, authors: string[], year: string, abstract: string }[];


  //handle refs
  public internalReferences !: { publication_id: number, title: string, section: string, authors: string[], abstract: string }[];
  public externalReferences !: ExternalReference[];
  public refSize = 0;

  //Αντικείμενο για την αποθήκευση των στατιστικών
  public publicationStat !: { publicationId: any, publication_stats_id: any, citations: number, references: number, num_of_exported_content_file: number, num_of_exported_presentation_file: number, reqs_of_exported_content_file: number, reqs_of_exported_presentation_file: number }


  //stats

  public barChartOptions: any = {
    scales: {
      y: {
        ticks: {
          stepSize: 1, // Set the step size between ticks
          beginAtZero: true // Start the axis from zero
        }
      }
    },
    responsive: true,
    maintainAspectRatio: false
  }

  public barChartLabels = ['Stats']
  public barChartType = 'barChartType';
  public barChartLegend = true;
  public barChartDataToSet: { data: number[], label: string }[] = [];

  //για το auth status
  private authStatusSub !: Subscription;// Αποθηκεύουμε το Subscription που κάνουμε στην getAuthStatusListener για να δούμε αν ο χρήστης είναι συνδεδεμένος
  public isAuthenticated = false; // μεταβλητή για την αποθήκευση της κατάστασης σύνδεσης του χρήστη. Θα χρησιμοποιηθεί μέσα στο html template.
  userId!: number;


  //για τα αρχεία
  public contentFiles: { content_file_id: any, filename: string, path: string, type: string, access: string }[] = [];
  public presentantionFiles: { presentantion_file_id: any, filename: string, path: string, type: string, access: string }[] = [];



  //για τις κατηγορίες του συγκεκριμένου publication
  public categories!: { category_id: any, name: string, description: string }[];

  public authorsNew: { id: any, firstName: string, lastName: string, type: string }[] = []

  public publicationPlace !: { id: any, name: string, type: string };

  public userIsAuthenticated = false;

  public statsOption = 'UI';

  constructor(private dialog: MatDialog, public authService: AuthService, public route: ActivatedRoute, public publicationService: PublicationsService, private router: Router,) { }

  ngOnInit(): void {

    this.currentUser = this.authService.getUser();

    this.authors = ['Paris', "Walt Asdert", "Yomen Kazins", "Yomen Kazins", "Franklin Bowell", "Yomen Kazins", "Yomen Kazins", "Yomen Kazins"];

    this.similarResearches = [
      {
        publication_id: 1,
        title: 'UAV Assisted SWIPT Enabled NOMA Based D2D Network for Disaster Management',
        section: 'Article',
        access: 'Public',
        authors: this.authors,
        year: "2009",
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'

      },
      {
        publication_id: 2,
        title: 'The geoepidemiology of systemic lupus erythematosus',
        section: 'Article',
        access: 'Public',
        authors: this.authors,
        year: "2009",
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'

      },
      {
        publication_id: 2,
        title: 'Novel paradigms in systemic lupus erythematosus',
        section: 'Article',
        access: 'Public',
        authors: this.authors,
        year: "2009",
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'

      },
      {
        publication_id: 2,
        title: 'What is AI?',
        section: 'Article',
        access: 'Public',
        authors: this.authors,
        year: "2009",
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'

      }
    ]


    this.internalReferences = [
      {
        publication_id: 1,
        title: 'UAV Assisted SWIPT Enabled NOMA Based D2D Network for Disaster Management',
        section: 'Article',
        authors: this.authors,
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'
      },
      {
        publication_id: 2,
        title: 'Exploring Sum Rate Maximization in UAV-based Multi-IRS Networks: IRS Association, UAV Altitude, and Phase Shift Design',
        section: 'Article',
        authors: this.authors,
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'
      },
      {
        publication_id: 1,
        title: 'Resource Allocation for UAV-Aided Energy Harvesting-Powered D2D Communications: A Reinforcement Learning-based Scheme',
        section: 'Article',
        authors: this.authors,
        abstract: 'Non-orthogonal multiple access (NOMA) is an emerging technique for improving wireless connectivity mostly for upcoming fifth generation (5G) networks. An unmanned aerial vehicle (UAV) assisted downlink NOMA network is considered for the first hop to serve the ground users in a non-functional area (NFA). An NFA indicates the region where the base station (BS) gets damaged due to some natural disasters in a two-hop communication. A device-to-device (D2D) communication is a favourable 5G technology, as it supports direct communication between users without traversing the BS. Furthermore, simultaneous wireless information and power transfer (SWIPT) enabled downlink NOMA assisted D2D network is proposed for the second hop to cover the non-functional or disaster area. In the first hop, we derive the outage probability for both the multiple access schemes, i.e., orthogonal multiple access scheme (OMA) and NOMA. OMA and NOMA to determine whether communication from the first ground node to the destination node is justified. Thereafter, we calculate the sum rate and total power consumption for the second hop to maximize the energy efficiency (EE) in our proposed SWIPT enabled NOMA-based D2D network. To tackle this problem, the Dinkelbach method (Zhao et al. in IEEE Trans Commun 67(5):3723–3735, 2019) is applied for optimizing the power allocation problem to maximize the EE in the network. In addition, a multiple interference cancellation scheme (MIC) is used to get the desired signal at the receiving end. Finally, analytical and simulation results are shown.'
      }
    ]






    this.userId = Number(this.authService.getUserId());
    console.log(this.userId)






    //Κάνουμε subscribe sto paramMap και η παρακάτω μέθοδος εκτελείται κάθε φορά που αλλάζει το url
    this.route.paramMap.subscribe((paramMap: ParamMap) => {


      this.publicationId = paramMap.get('publicationId');

      //παίρνουμε τα categories του συγκεκριμένου publication
      this.publicationService.getPublicationsCategories(this.publicationId);
      this.publicationService.getMyPublicationsCategoriesUpdatedUpdateListener().subscribe({
        next: (data) => {

          this.categories = data;
          console.log(this.categories)
        }
      });

      //έπειτα με την βοήθεια του service  καλούμαι την getPublication που μας επιστρέφει την δημοσίευση που ψάχνουμε
      this.publicationService.getPublication(this.publicationId).subscribe(publicationData => {



        this.publicationPlace = publicationData.publication.place;



        this.userIsAuthenticated = this.authService.getIsAuth();

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






        this.publicationStat = publicationData.publication.publicationStat;



        if (publicationData.publication.publicationStat) {
          this.barChartDataToSet.push({
            label: 'Citations',
            data: [this.publicationStat.citations]
          })

          this.barChartDataToSet.push({
            label: 'References',
            data: [this.publicationStat.references]
          })

          this.barChartDataToSet.push({
            label: 'Exported Content File',
            data: [this.publicationStat.num_of_exported_content_file]
          })

          this.barChartDataToSet.push({
            label: 'Exported Presentation File',
            data: [this.publicationStat.num_of_exported_presentation_file]
          })

          this.barChartDataToSet.push({
            label: 'Requests for Presentation Content File',
            data: [this.publicationStat.reqs_of_exported_presentation_file]
          })

          this.barChartDataToSet.push({
            label: 'Requests for Exported Content File',
            data: [this.publicationStat.reqs_of_exported_content_file]
          })
        }



        //Έλεγχος αν υπάρχουν εσωτερικές αναφορές
        if (publicationData.publication.references) {
          this.internalReferences = publicationData.publication.references;
          this.refSize = this.internalReferences.length
        }

        //Έλεγχος αν υπάρχουν εξωτερικές αναφορές
        if (publicationData.publication.exreferences) {
          this.externalReferences = publicationData.publication.exreferences;
          this.refSize += this.externalReferences.length;
        }







        //με βάση το επιστρεφόμενο αντικείμενο απο το backend ελέγχουμε τί τύπου δημοσίευση έχουμε
        switch (publicationData.publication.section) {

          case 'Article':

            this.article = publicationData.publication.article;
            console.log(this.article)
            break;

          case 'Book':
            this.book = publicationData.publication.book;
            console.log(this.book)
            break;

          case 'Proceedings':
            this.proceedings = publicationData.publication.proceeding;
            console.log(this.proceedings)
            break;

          case 'Thesis':
            this.thesis = publicationData.publication.thesis;
            console.log(this.thesis)
            break;

          case 'Book_Chapter':
            this.chapterBk = publicationData.publication.chapterBk;
            console.log(this.chapterBk)
            break;

          case 'Tech_Report':
            this.techReport = publicationData.publication.techReport;
            console.log(this.techReport)
            break;

          case 'Other':
            this.other = publicationData.publication.other;
            break;


        }

        this.publication = publicationData.publication;
        this.tags = publicationData.publication.tags.map((tag: Tag) => {
          return tag.keyword
        });


        console.log(publicationData)




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
            this.authorsNew.push(extrnalObj)
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
            this.authorsNew.push(extrnalObj)
          })
        }
        console.log(this.authorsNew)




        this.publicationFound = true;

      })

    })

  }


  toggleUIoption() {

    this.UIoption = !this.UIoption
  }



  onDoiSearch() {
    window.location.href = "https://doi.org/" + this.publication.doi;
  }


  viewReferencePublication(publication_id: any) {

    this.router.navigate(['singlePublication/' + publication_id]);

  }


  viewExReferencePublication(link: string) {

    window.open(link, '_blank');

  }

  toogleTags() {

    this.hideTags = !this.hideTags;

    if (this.hideTags === true) {
      this.imageMoreTags = 'expand_more'
    }

    else {
      this.imageMoreTags = 'expand_less'
    }

  }



  //Μέθοδοι του menu διαχείρισης
  movePublicationDialog(id: any, publicationName: string,) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      publicationName: publicationName,
      publicationId: id,
    };

    this.dialog.open(DialogAddPubComponent, dialogConfig)


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

  openDialogForDeleteOne(publicationId: any, publicationName: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      publicationId: publicationId,
      publicationName: publicationName,

    }

    this.dialog.open(DialogDeleteOneComponent, dialogCreateConfig);



  }


  removeContentFile(content_file_id: string) {
    this.publicationService.removeSingleContentFile(content_file_id);
  }

  removePresentantionFile(presentantion_file_id: string) {
    console.log(presentantion_file_id)
    this.publicationService.removeSinglePresentantionFile(presentantion_file_id);
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


  downloadContentFile(content_file_id: string, filename: string) {

    this.publicationService.downloadContentFile(content_file_id, filename);


  }

  downloadPresentantionFile(presentantion_file_id: string, filename: string) {

    console.log("Presentantio file")
    this.publicationService.downloadPresentantionFile(presentantion_file_id, filename);
  }





  moveToAuthor(id: any, type: string) {

    console.log(type, "Moving", id)

  }




  openDialogForRequestFile(id: any, type: string, filename: string) {

    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';

    dialogCreateConfig.data = {
      fileId: id,
      file_type: type,
      filename: filename,
      userToNotify: this.publication.userId

    }

    this.dialog.open(DialogRequestFileComponent, dialogCreateConfig);



  }


}
