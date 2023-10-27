import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CsrfService {


  private csrfToken: string | null = null;


  constructor(private http: HttpClient) { }

  getCsrfToken(): Observable<any> {
    return this.http.get<{ csrfToken: string }>('https://localhost:3000/csrfToken');
  }




}
