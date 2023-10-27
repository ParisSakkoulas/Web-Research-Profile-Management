import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { AuthService } from 'src/app/auth/auth.service';
import { DialogDeleteComponent } from 'src/app/category/dialog-delete/dialog-delete.component';
import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import { PublicationsService } from 'src/app/publications/publication.service';
import { Subscription } from 'rxjs';
import { DocumentCreator } from './cv-generator';
import { Packer } from 'docx';

@Component({
  selector: 'app-dialog-cv-options',
  templateUrl: './dialog-cv-options.component.html',
  styleUrls: ['./dialog-cv-options.component.css']
})
export class DialogCvOptionsComponent implements OnInit {


  public userData: any;
  private profielId: any;

  //Photo upload
  uploadedImageSrc: string | null = null;;

  photoOption !: any;

  jobs: { job_id: any, title: string, company: string, startYear: string, endYear: string }[] = [];
  organizations: { organization_id: any, name: string, description: string }[] = [];
  studies: { study_id: any, title: string, school: string, endYear: string }[] = [];
  publications: { publication_id: any, title: string, year: string, section: string }[] = [];

  interests2: { researchInterest_id: any, keyword: string }[] = [];
  abilities2: { ability_id: any, keyword: string }[] = [];

  private myPublicationSubscription !: Subscription;


  interests: string[] = [];
  abilities: string[] = [];

  constructor(private dialog: MatDialog, public publicationService: PublicationsService, public authService: AuthService, private store: Store, private dialogRef: MatDialogRef<DialogDeleteComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {

    this.userData = data.user;
    this.profielId = data.profielId;


    console.log(this.profielId)
  }


  ngOnInit(): void {


    this.authService.getPhotoProfileCV();
    this.authService.getPhotoProfileUpdateListenerCV().subscribe({
      next: (response) => {
        this.uploadedImageSrc = response;
      }
    })



    this.authService.getUserDataProfile().subscribe({
      next: (response) => {
        console.log(response)

        //Παίρνουμε όλους του οργανισμούς
        this.authService.getAllOrganizations();
        this.authService.getOrganizationUpdateListener().subscribe({
          next: (response) => {
            console.log(response)
            this.organizations = response;
          }
        });


        //Παίρνουμε όλες τις δουλειές
        this.authService.getAllJobs();
        this.authService.getJobsUpdateListener().subscribe({
          next: (response) => {
            console.log(response)
            this.jobs = response

          }
        })


        //Παίρνουμε όλες τις δουλειές
        this.authService.getAllStudies();
        this.authService.getStudiesUpdateListener().subscribe({
          next: (response) => {
            console.log(response)
            this.studies = response
          }
        })



        //Παίρνουμε όλες τις ικανότητες
        this.authService.getAllAbilities();
        this.authService.getAbilitiesUpdateListener().subscribe({
          next: (response) => {
            console.log(response)

            this.abilities = response.map(ab => {
              return ab.keyword
            })

            this.abilities2 = response;


          }
        })


        //Παίρνουμε όλα τα ενδιαφέροντα
        this.authService.getAllInterests();
        this.authService.getInterestsUpdateListener().subscribe({
          next: (response) => {
            console.log(response)

            this.interests = response.map(inter => {
              return inter.keyword
            })

            this.interests2 = response;



          }
        })

      }
    });

    //Παίρνουμε όλα τα ενδιαφέροντα
    this.authService.getAllInterests();
    this.authService.getInterestsUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.interests = response.map(inter => {
          return inter.keyword
        })
      }
    })


    //Παίρνουμε όλες τις ικανότητες
    this.authService.getAllAbilities();
    this.authService.getAbilitiesUpdateListener().subscribe({
      next: (response) => {
        console.log(response)

        this.abilities = response.map(ab => {
          return ab.keyword
        })
      }
    })


    this.publicationService.getAllMyPublications();
    this.myPublicationSubscription = this.publicationService.getMyPublicationsUpdateListener().subscribe({
      next: (response) => {
        response.map(p => {

          const pub = {
            publication_id: p.publication_id,
            title: p.title,
            year: p.year,
            section: p.section
          }

          this.publications.push(pub)
        })

      }
    })

  }



  exportDocTypeCv() {

    let experiences1 = [
      {
        title: 'Software Deveveloper',
        company: 'IEEE',
        startYear: '2000',
        endYear: '2003',
      }
    ]


    let schools = [
      {
        title: 'Information and Communication System Engineer',
        school: 'University of The Aegean ICSD',
        endYear: '2023',
      }
    ]

    let abilities = [
      { keyword: 'word1' }
    ]

    let interests = [
      { keyword: 'inte1' }
    ]


    let publications = [
      { title: 'title1', year: '2002' }
    ]


    const documentCreator = new DocumentCreator();
    const doc = documentCreator.create(this.userData, this.studies, this.jobs, this.publications, this.organizations, this.abilities2, this.interests2);

    Packer.toBlob(doc).then(blob => {
      saveAs(blob, "example.docx");
      console.log("Document created successfully");
    })


  }




  exportPdfTypeCv() {
    const doc = new jsPDF();
    let yPos = 20;


    // Function to check if there's enough space on the current page for the next content
    const hasEnoughSpace = (contentHeight: number) => {
      let pageHeight = doc.internal.pageSize.height;

      if (contentHeight + 10 >= pageHeight) {
        doc.addPage();
        yPos = 20;
      }


    };



    // Set font styles and sizes for header and subheadings
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0); // Blue color for the header

    // Add the name as the header
    doc.text(`${this.userData.firstName} ${this.userData.lastName}`, 10, 15);
    // Add a horizontal line below the header
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 102, 204);
    doc.line(0, 0, 0, 0);

    // Reset font styles and sizes for the content
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(13);
    doc.setTextColor(0);
    doc.text(`Email: ${this.userData.email}`, 10, 25);

    hasEnoughSpace(yPos);



    // Add email below the header
    //addContent(`Email: ${this.userData.email}`, 10);

    // Add the photo to the PDF if the checkbox is checked and an image is available
    if (this.uploadedImageSrc && this.photoOption) {
      const imageWidth = 50; // You can adjust the image width as needed
      const imageHeight = 70; // You can adjust the image height as needed
      const imageX = 20; // X-coordinate where the image will be placed
      doc.text('', imageHeight + 10, imageWidth + 10); // Update yPos to leave space below the image
      doc.addImage(this.uploadedImageSrc, imageX, 37, imageWidth, imageHeight);
    }
    else {
      yPos += 10;
    }

    // Add jobs section
    if (this.jobs.length > 0) {

      yPos += 20;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Experience', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('Years', doc.internal.pageSize.getWidth() - 35, yPos);
      let xPos = 20;
      yPos += 3,
        doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      for (let job of this.jobs) {
        hasEnoughSpace(yPos);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(13);

        // Place job title on the left side

        const jobTitleWidth = doc.getTextWidth(job.title);
        const dateRangeWidth = doc.getTextWidth('(' + job.startYear + ' - ' + job.endYear + ')');
        const dateRangeX = doc.internal.pageSize.getWidth() - doc.getTextWidth('(' + job.startYear + ' - ' + job.endYear + ')') - 25;
        const maxJobTitleWidth = dateRangeX - xPos;

        if (jobTitleWidth <= maxJobTitleWidth) {
          yPos += 10;
          doc.text(job.title, xPos, yPos);
          doc.setFontSize(10);
          yPos += 5;
          doc.setFont('Helvetica', 'italic');
          doc.text(job.company, xPos, yPos);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(13);
          doc.text('(' + job.startYear + ' - ' + job.endYear + ')', dateRangeX, yPos - 5);


        }

        else {
          // Job title is too long to fit, truncate it and display the truncated part below
          const maxTitleLength = Math.floor((maxJobTitleWidth / jobTitleWidth) * job.title.length);
          const truncatedTitle = job.title.substring(0, maxTitleLength) + '...';

          const words = job.title.split(' ');

          console.log(words);
          const lines = [];
          yPos += 12;
          for (let i = 0; i < words.length; i += 2) {
            const word1 = words[i];
            const word2 = words[i + 1];

            let line = word1;
            if (word2) {
              line += ' ' + word2
            }
            lines.push(line);
          }
          doc.text('(' + job.startYear + ' - ' + job.endYear + ')', dateRangeX, yPos);
          for (let line of lines) {
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(13);
            doc.text(line, xPos, yPos);
            yPos += 8;
          }
          doc.setFontSize(10);
          doc.setFont('Helvetica', 'italic');
          doc.text(job.company, xPos, yPos);
          doc.setFontSize(13);



        }

      }



      yPos += 10;
      console.log("Jobs Legth", yPos)
    }




    if (this.studies.length > 0) {

      yPos += 10;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Education', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('Year', doc.internal.pageSize.getWidth() - 35, yPos);
      yPos += 3;
      doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      yPos += 8;
      let xPos = 20;

      for (let study of this.studies) {
        hasEnoughSpace(yPos);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(13);

        const studyTitleWidth = doc.getTextWidth(study.title);
        const dateRangeWidth = doc.getTextWidth('(' + study.endYear + ')');
        const dateRangeXX = doc.internal.pageSize.getWidth() - doc.getTextWidth('(' + study.endYear + ')') - 25;
        const maxStudyTitleWidth = dateRangeXX - xPos;

        if (studyTitleWidth <= maxStudyTitleWidth) {

          // Place job title on the left side
          doc.text(study.title, 20, yPos);
          yPos += 5
          doc.setFontSize(10);
          doc.text(study.school, 20, yPos);

          // Calculate the x-coordinate for the date range to ensure it appears on the right side
          const dateRangeX = doc.internal.pageSize.getWidth() - doc.getTextWidth('(' + study.endYear + ')') - 25;

          // Place date range on the right side
          doc.setFontSize(13);
          doc.text('(' + study.endYear + ')', dateRangeX, yPos);

          // Increment yPos if needed
          yPos += 20; // You can adjust the vertical spacing as needed

        }
        else {

          const studies = study.title.split(" ");

          const lines = [];
          for (let i = 0; i < studies.length; i += 2) {
            const word1 = studies[i];
            const word2 = studies[i + 1] ? studies[i + 1] : "";
            const word3 = studies[i + 2] ? studies[i + 2] : "";
            const word4 = studies[i + 3] ? studies[i + 3] : "";
            const word5 = studies[i + 4] ? studies[i + 4] : "";



            let line = word1;
            if (word2) {
              line += ' ' + word2 + ' ' + word3 + " " + word4 + " " + word5
            }
            lines.push(line);
          }
          doc.text('(' + study.endYear + ')', dateRangeXX, yPos);
          for (let line of lines) {
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(13);
            doc.text(line, xPos, yPos);
            yPos += 8;
          }
          doc.setFontSize(10);
          doc.setFont('Helvetica', 'italic');
          doc.text(study.school, xPos, yPos);
          doc.setFontSize(13);

        }


      }

    }


    if (this.publications.length > 0) {
      yPos += 12;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('Publications', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      doc.text('Year', doc.internal.pageSize.getWidth() - 35, yPos);
      yPos += 3;
      doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      yPos += 8;



      for (let publication of this.publications) {

        hasEnoughSpace(yPos);
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(13);
        const publicationTitleWidth = doc.getTextWidth(publication.title);
        const dateRangeWidth = doc.getTextWidth(' (' + publication.year + ') ');
        const pageWidth = doc.internal.pageSize.getWidth();
        const dateRangeX = pageWidth - dateRangeWidth - 20;
        const maxpublicationTitleWidth = dateRangeX - 20;
        let xPos = 20;

        console.log(publication.title, `${publicationTitleWidth < maxpublicationTitleWidth}`, publicationTitleWidth, maxpublicationTitleWidth);

        if (publicationTitleWidth <= maxpublicationTitleWidth) {

          doc.text(publication.title, 20, yPos);
          doc.text("(" + publication.year + ")", doc.internal.pageSize.getWidth() - 35, yPos);
          yPos += 5;

          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(10);
          doc.text(publication.section, 20, yPos);

          yPos += 15;
        }

        else {

          //doc.text("(" + publication.year + ")", doc.internal.pageSize.getWidth() - 35, yPos);
          //yPos += 5;
          //yPos += 15;\
          hasEnoughSpace(yPos);

          const fullTitle = publication.title;
          const titles = fullTitle.split(" ");

          console.log(titles);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(13);

          const lines = [];
          for (let i = 0; i < titles.length; i += 2) {
            const word1 = titles[i];
            const word2 = titles[i + 1];
            const word3 = titles[i + 2] ? titles[i + 2] : "";
            const word4 = titles[i + 3] ? titles[i + 3] : "";
            const word5 = titles[i + 4] ? titles[i + 4] : "";
            const word6 = titles[i + 5] ? titles[i + 5] : "";





            let line = word1;
            if (word2) {
              line += ' ' + word2 + ' ' + word3 + ' ' + word4 + ' ' + word5 + ' ' + word6
            }
            lines.push(line);

          }


          hasEnoughSpace(yPos);
          doc.text("(" + publication.year + ")", doc.internal.pageSize.getWidth() - 35, yPos);
          for (let line of lines) {
            hasEnoughSpace(yPos);
            doc.setFont('Helvetica', 'normal');
            doc.setFontSize(13);
            doc.text(line, xPos, yPos);
            yPos += 5;
          }

          doc.setFontSize(10);
          doc.setFont('Helvetica', 'italic');
          hasEnoughSpace(yPos);
          doc.text(publication.section, xPos, yPos);
          doc.setFontSize(13);
          yPos += 10




          /*
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(13);
          doc.text(publication.title, 20, yPos);
          doc.text("(" + publication.year + ")", doc.internal.pageSize.getWidth() - 35, yPos);
          yPos += 5;

          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(10);
          doc.text(publication.section, 20, yPos);

          yPos += 15;*/

        }



      }

    }



    if (this.organizations.length > 0) {
      yPos += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      hasEnoughSpace(yPos);
      doc.text('Organizations', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      yPos += 3;
      hasEnoughSpace(yPos);
      doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      yPos += 5;;
      let xPos = 20;


      hasEnoughSpace(yPos);
      for (let organization of this.organizations) {
        const organizationWidth = doc.getTextWidth(organization.name);
        const dateRangeX = doc.internal.pageSize.getWidth() - 20;
        const maxOrganizationWidth = dateRangeX - xPos;
        if (organizationWidth < maxOrganizationWidth) {
          doc.text(organization.name + ',', xPos, yPos);
          xPos += doc.getStringUnitWidth(organization.name) * 2 + 16;
        }
        else {
          yPos += 8;
          xPos = 20
          doc.text(organization.name + ', ', xPos, yPos);
          xPos += doc.getStringUnitWidth(organization.name) * 2 + 16;
        }
      }

    }

    if (this.abilities.length > 0) {

      yPos += 10;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      hasEnoughSpace(yPos);
      doc.text('Abilities', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      yPos += 3;
      hasEnoughSpace(yPos);
      doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      yPos += 5;;

      let xPos = 20;
      hasEnoughSpace(yPos);
      for (let ability of this.abilities) {

        const abilityWidth = doc.getTextWidth(ability);
        const dateRangeX = doc.internal.pageSize.getWidth() - 20;
        const maxAbilityWidth = dateRangeX - xPos;

        if (abilityWidth < maxAbilityWidth) {
          doc.text(ability + ',', xPos, yPos);
          xPos += doc.getStringUnitWidth(ability) * 2 + 16;
        }
        else {
          yPos += 8;
          xPos = 20
          doc.text(ability + ', ', xPos, yPos);
          xPos += doc.getStringUnitWidth(ability) * 2 + 16;
        }

      }
    }

    if (this.interests.length > 0) {
      yPos += 15;

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      hasEnoughSpace(yPos);
      doc.text('Interests', 20, yPos);
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(13);
      yPos += 3;
      hasEnoughSpace(yPos);

      // Draw a separator line
      doc.setLineWidth(0.2); // Set line width for the separator
      doc.setDrawColor(0, 0, 0); // Black color for the separator line
      doc.line(20, yPos, doc.internal.pageSize.getWidth() - 20, yPos); // Draw separator line
      yPos += 5;

      let xPos = 20;
      let line = '';

      for (let interest of this.interests) {
        const interestWidth = doc.getTextWidth(interest);

        if (xPos + interestWidth + 22 <= doc.internal.pageSize.getWidth()) {
          // Interest can fit on the current line
          line += interest + ', ';
          xPos += interestWidth + doc.getStringUnitWidth(', ') * 2 + 22;
        } else {
          // Start a new line for the interest
          hasEnoughSpace(yPos);
          doc.text(line, 20, yPos);
          yPos += 8;
          line = interest + ', ';
          xPos = 20 + interestWidth + doc.getStringUnitWidth(', ') * 2 + 22;
        }
      }

      // Add the remaining interests on the last line
      if (line) {
        hasEnoughSpace(yPos);
        doc.text(line, 20, yPos);
      }
    }




    doc.save(`${this.userData.firstName} ${this.userData.lastName}CV.pdf`);
    this.dialogRef.close();
  }



  toggleOption(event: MatCheckboxChange) {

    console.log(event);
    this.photoOption = event.checked

  }

  closeDialog() {
    this.dialogRef.close()
  }




}
