import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthGuard implements CanActivate {


  private user!: { user_id: any; userRole: string | null; firstName: string | null; lastName: string | null; userName: string | null; email: string | null; } | null;

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> | Promise<boolean> {

    const isAuthenticated = this.authService.getIsAuth();

    this.user = this.authService.getUserDataC();


    // If not authenticated or not an admin, redirect to a different route (e.g., login)
    if (this.user?.userRole !== 'Admin') {
      this.router.navigate(['**']);
      return false;
    }



    return true; // Allow access for authenticated users with the admin role
  }

}
