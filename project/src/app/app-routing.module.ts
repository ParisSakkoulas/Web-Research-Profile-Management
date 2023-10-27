import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { AuthGuard } from './auth/auth.guard';
import { PublicationListComponent } from './publications/publication-list/publication-list.component';
import { PublicationCreateComponent } from './publications/publication-create/publication-create.component';
import { PublicationCreatePortalComponent } from './publications/publication-create-portal/publication-create-portal.component';
import { PublicationSingleComponent } from './publications/publication-single/publication-single.component';
import { ProfileComponent } from './profile/profile.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { SearchMultiplePublicationsComponent } from './publications/search-multiple-publications/search-multiple-publications.component';
import { CategorySingleComponent } from './category/category-single/category-single.component';
import { CategoryListComponent } from './category/category-list/category-list.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { PublicationAllComponent } from './publications/publication-all/publication-all.component';
import { SearchPublicationsPortalComponent } from './search-publications/search-publications-portal/search-publications-portal.component';
import { PublicationsPlacesListComponent } from './publications-places/publications-places-list/publications-places-list.component';
import { SinglePublicationPlaceComponent } from './publications-places/single-publication-place/single-publication-place.component';
import { ProfileEditComponent } from './profile/profile-edit/profile-edit.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { UserProfileComponent } from './profile/user-profile/user-profile.component';
import { UserNotFoundComponent } from './profile/user-not-found/user-not-found.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { SearchUsersComponent } from './profile/search-users/search-users.component';
import { SingleNotificationComponent } from './notifications/single-notification/single-notification.component';
import { RequestCreatedComponent } from './requests/request-created/request-created.component';
import { RequestReceivedComponent } from './requests/request-received/request-received.component';
import { RequestListComponent } from './requests/request-list/request-list.component';
import { AdminAuthGuard } from './admin/admin-auth.guard';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { AdminLogsComponent } from './admin/admin-logs/admin-logs.component';
import { NotificationsComponent } from './admin/notifications/notifications.component';
import { RequestsComponent } from './admin/requests/requests.component';
import { UserListComponent } from './admin/users/user-list/user-list.component';
import { PublicationsAdminComponent } from './admin/publications/publications-admin/publications-admin.component';
import { PublicationSingleAdminComponent } from './admin/publications/publication-single-admin/publication-single-admin.component';
import { ProfileSettingsComponent } from './profile/profile-settings/profile-settings.component';
import { UserSingleProfileComponent } from './admin/users/user-single-profile/user-single-profile.component';


const routes: Routes = [


  //loading spinner
  { path: 'loadingSpinner', component: LoadingSpinnerComponent },


  //dashboard
  { path: 'dashboard', component: DashboardComponent },


  //publications
  //Publication routes
  { path: '', component: LandingPageComponent },
  { path: 'publicationCreatePortal', component: PublicationCreatePortalComponent, canActivate: [AuthGuard] },
  { path: 'addSinglePublication', component: PublicationCreateComponent, canActivate: [AuthGuard] },
  { path: 'addMultiplePublications', component: SearchMultiplePublicationsComponent, canActivate: [AuthGuard] },
  { path: 'edit/:publicationId', component: PublicationCreateComponent, canActivate: [AuthGuard] },
  { path: 'publications', component: PublicationListComponent, canActivate: [AuthGuard] },
  { path: 'singlePublication/:publicationId', component: PublicationSingleComponent },
  { path: 'allPublications', component: PublicationAllComponent },

  //search publications
  { path: 'searchPublications', component: SearchPublicationsPortalComponent },

  //References Router


  //Categories
  { path: 'categories', component: CategoryListComponent, canActivate: [AuthGuard] },
  { path: 'singleCategory/:categoryId', component: CategorySingleComponent, canActivate: [AuthGuard] },



  //Publication Places
  { path: 'places', component: PublicationsPlacesListComponent, canActivate: [AuthGuard] },
  { path: 'singlePlace/:id', component: SinglePublicationPlaceComponent, canActivate: [AuthGuard] },




  //profile routes
  { path: 'profile/myProfile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'profile/edit/:id', component: ProfileEditComponent, canActivate: [AuthGuard] },
  { path: 'profile/user-profile/:userId', component: UserProfileComponent },
  { path: 'searchUsers', component: SearchUsersComponent },
  { path: 'settings', component: ProfileSettingsComponent, canActivate: [AuthGuard] },


  //notifications
  { path: 'notifications/:notificationId', component: SingleNotificationComponent, canActivate: [AuthGuard] },


  //requests
  { path: 'requests/received', component: RequestReceivedComponent, canActivate: [AuthGuard] },
  { path: 'requests/send', component: RequestCreatedComponent, canActivate: [AuthGuard] },
  { path: 'requests/list', component: RequestListComponent, canActivate: [AuthGuard] },




  //Auth routes
  { path: 'signup', component: SignupComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify/:token', component: VerifyComponent },



  //Admin Routes
  {
    path: 'admin',
    canActivate: [AdminAuthGuard], // Apply the AdminAuthGuard to this route
    children: [
      // Define child routes that require admin access
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'logs', component: AdminLogsComponent },
      { path: 'notifications', component: NotificationsComponent },
      { path: 'requests', component: RequestsComponent },
      { path: 'users', component: UserListComponent },
      { path: 'user/:userId', component: UserSingleProfileComponent },
      { path: 'publications', component: PublicationsAdminComponent },
      { path: 'singlePublication/:publicationId', component: PublicationSingleAdminComponent },



    ]
  },



  { path: '**', pathMatch: 'full', component: PagenotfoundComponent },

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [AuthGuard]
})
export class AppRoutingModule { }
