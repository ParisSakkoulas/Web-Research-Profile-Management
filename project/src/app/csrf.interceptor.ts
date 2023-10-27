import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, ReplaySubject, catchError, switchMap, throwError } from 'rxjs';
import { CsrfService } from './auth/csrf.service';

@Injectable()
export class CSRFInterceptor implements HttpInterceptor {


  csrfToken!: string;

  constructor(public csrfService: CsrfService) { }



  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    console.log(this.csrfToken)

    if (!this.csrfToken) {
      // Fetch the CSRF token if it's not available
      return this.csrfService.getCsrfToken().pipe(
        switchMap((data: any) => {
          this.csrfToken = data.csrfToken;
          console.log(data)
          // Clone the request and add the CSRF token as a header
          const clonedRequest = request.clone({
            setHeaders: {
              'X-CSRF-TOKEN': this.csrfToken,
            },
          });
          return next.handle(clonedRequest);
        })
      );
    } else {
      // If the CSRF token is already available, add it as a header directly
      const clonedRequest = request.clone({
        setHeaders: {
          'X-CSRF-TOKEN': this.csrfToken,
        },
      });
      return next.handle(clonedRequest);
    }
  }

}






