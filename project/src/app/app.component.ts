import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { appLoaded } from './core/state/publications';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectSpinner } from './core/state/spinner/spinner.selector';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  constructor(private authService: AuthService, private store: Store) { }



  showLoading !: Observable<boolean>;


  ngOnInit() {

    this.authService.autoAuthUser();

    this.store.dispatch(appLoaded());

    this.showLoading = this.store.select(selectSpinner)



  }


}
