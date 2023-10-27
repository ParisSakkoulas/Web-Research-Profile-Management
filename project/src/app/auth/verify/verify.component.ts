import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SuccessComponent } from 'src/app/success/success.component';
import { AuthService } from '../auth.service';
import { Subscription } from 'rxjs';
import { DialogResentVerificationCodeComponent } from '../dialog-resent-verification-code/dialog-resent-verification-code.component';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.css']
})
export class VerifyComponent implements OnInit {


  private verificationCode: any;
  public messageObj !: { message: string, type: string };
  public userIsAuthenticated = false;
  private authListenerSubscription !: Subscription;

  constructor(private route: ActivatedRoute, private http: HttpClient, private dialog: MatDialog, private authService: AuthService) { }

  ngOnInit(): void {

    console.log("VERIYF")

    this.route.paramMap.subscribe((paramMap: ParamMap) => {


      this.verificationCode = paramMap.get('token');
    })


    this.http.get<{ message: string, type: string }>("https://localhost:3000/users/verify/" + this.verificationCode).subscribe({
      next: (response) => {
        console.log(response);

        this.messageObj = response;
      }
    })

    this.userIsAuthenticated = this.authService.getIsAuth();
    this.authListenerSubscription = this.authService.getAuthStatusListener().subscribe(isAuthenticated => {
      this.userIsAuthenticated = isAuthenticated;
    });


  }



  resendVerificationCode() {
    const dialogCreateConfig = new MatDialogConfig();

    dialogCreateConfig.disableClose = true;
    dialogCreateConfig.autoFocus = true;
    dialogCreateConfig.width = '800px';



    this.dialog.open(DialogResentVerificationCodeComponent, dialogCreateConfig)


  }

}
