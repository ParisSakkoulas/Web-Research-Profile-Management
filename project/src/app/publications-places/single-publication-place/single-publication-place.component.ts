import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { PublicationPlaceService } from '../publication-place.service';
import { Book } from 'src/app/models/book.model';

@Component({
  selector: 'app-single-publication-place',
  templateUrl: './single-publication-place.component.html',
  styleUrls: ['./single-publication-place.component.css']
})
export class SinglePublicationPlaceComponent implements OnInit {

  private publicationPlaceId: any;
  public publicationPlace !: { publication_place_id?: any, name: string, type: string, journal?: { journal_id: any, abbreviation: string, publisher: string }, conference?: { abbreviation: string }, book?: Book }

  constructor(public publicationPlaceService: PublicationPlaceService, public route: ActivatedRoute) { }

  ngOnInit(): void {


    //Κάνουμε subscribe sto paramMap και η παρακάτω μέθοδος εκτελείται κάθε φορά που αλλάζει το url
    this.route.paramMap.subscribe((paramMap: ParamMap) => {

      //Απθηκεύουμε το id του τόπου σε μια μεταβλητή
      this.publicationPlaceId = paramMap.get('id');

      //Καλούμε την get single place απο το service
      this.publicationPlaceService.getSinglePublicationPlace(this.publicationPlaceId).subscribe({
        next: (response) => {

          this.publicationPlace = response.singlePublicationPlaceFound;
          console.log(this.publicationPlace);
        }
      })


      //κάνουμε sub σε περίπτωση που έχουμε ανανέωση του single object μας
      this.publicationPlaceService.getPublicationPlaceUpdateListener().subscribe({
        next: (response) => {
          this.publicationPlace = response
        }
      })



    })





  }




}
