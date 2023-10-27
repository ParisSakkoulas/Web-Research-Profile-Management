import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-publication-create-portal',
  templateUrl: './publication-create-portal.component.html',
  styleUrls: ['./publication-create-portal.component.css']
})
export class PublicationCreatePortalComponent implements OnInit {


  constructor(private router: Router) { }


  navigateToMulipleAdd() {

    this.router.navigate(['/addMultiplePublications'])
  }


  navigateToSingleAdd() {
    this.router.navigate(['/addSinglePublication'])
  }



  ngOnInit() {


  }






}
