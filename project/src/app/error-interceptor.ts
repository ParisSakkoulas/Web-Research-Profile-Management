import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { catchError, throwError } from "rxjs";
import { ErrorComponent } from "./error/error.component";

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

  constructor(public dialog: MatDialog) { }

  intercept(req: HttpRequest<any>, next: HttpHandler) {


    return next.handle(req).pipe(

      catchError((err: HttpErrorResponse) => {


        let errorMessage = 'An unknown error occured'
        if (err.error.message) {

          errorMessage = err.error.message
        }
        const dialogErrorConfig = new MatDialogConfig();
        dialogErrorConfig.data = {
          message: errorMessage
        }
        dialogErrorConfig.width = '590px';
        dialogErrorConfig.height = '140px'
        dialogErrorConfig.panelClass = 'success_class';
        this.dialog.open(ErrorComponent, dialogErrorConfig)
        return throwError(err);
      })
    );

  }

}

