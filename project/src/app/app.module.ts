import { NgModule, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule, HttpClientXsrfModule, HttpXsrfTokenExtractor } from '@angular/common/http';
import { MatTableModule } from '@angular/material/table'
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSliderModule } from '@angular/material/slider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HeaderComponent } from './header/header.component';
import { LoginComponent } from './auth/login/login.component';
import { SignupComponent } from './auth/signup/signup.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSortModule } from '@angular/material/sort';
import { MatGridListModule } from '@angular/material/grid-list';


//Header
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

//Sign up
import { MatProgressBarModule } from '@angular/material/progress-bar';

//Dialog messages
import { MatDialogModule } from '@angular/material/dialog';
import { PublicationListComponent } from './publications/publication-list/publication-list.component';
import { PublicationCreateComponent } from './publications/publication-create/publication-create.component';
import { PublicationSingleComponent } from './publications/publication-single/publication-single.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { TruncatePipe } from './truncate.pipe';
import { ErrorComponent } from './error/error.component';
import { AuthInterceptor } from './auth/auth-interceptor';
import { ErrorInterceptor } from './error-interceptor';
import { PublicationCreatePortalComponent } from './publications/publication-create-portal/publication-create-portal.component';
import { SuccessComponent } from './success/success.component';
import { FilterPipePipe } from './filter.pipe';

//single publication
import { MatTabsModule } from '@angular/material/tabs';

//State managment
import { StoreModule } from "@ngrx/store";
import { metaReducers, reducers } from './core/core.reducer';
import { EffectsModule } from "@ngrx/effects";
import { PublicationEffects } from "./core/state/publications";
import { ProfileComponent } from './profile/profile.component';
import { ReferenceDialogComponent } from './references/reference-dialog/reference-dialog.component';
import { LoadingSpinnerComponent } from './shared/loading-spinner/loading-spinner.component';
import { VerifyComponent } from './auth/verify/verify.component';
import { CapitalizeFirstLetterPipe } from './capitalize-first-letter.pipe';
import { SearchMultiplePublicationsComponent } from './publications/search-multiple-publications/search-multiple-publications.component';
import { SelectAuthorsDialogComponent } from './select-authors-dialog/select-authors-dialog.component';
import { CategorySingleComponent } from './category/category-single/category-single.component';
import { CategoryListComponent } from './category/category-list/category-list.component';
import { DialogDeleteComponent } from './category/dialog-delete/dialog-delete.component';
import { DialogCreateComponent } from './category/dialog-create/dialog-create.component';
import { InfoDialogComponent } from './publications/info-dialog/info-dialog.component';
import { DialogRemoveFromComponent } from './category/dialog-remove-from/dialog-remove-from.component';
import { DialogMoveToComponent } from './category/dialog-move-to/dialog-move-to.component';
import { DialogDeleteManyComponent } from './category/dialog-delete-many/dialog-delete-many.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DialogAddPubComponent } from './category/dialog-add-pub/dialog-add-pub.component';
import { PublicationAllComponent } from './publications/publication-all/publication-all.component';
import { DialogDeleteOneComponent } from './publications/dialog-delete-one/dialog-delete-one.component';
import { DialogDeleteManyPublicationsComponent } from './publications/dialog-delete-many-publications/dialog-delete-many-publications.component';
import { DialogMoveManyPublicationsComponent } from './category/dialog-move-many-publications/dialog-move-many-publications.component';
import { SearchPublicationsPortalComponent } from './search-publications/search-publications-portal/search-publications-portal.component';
import { DialogDeletePublicationsCategoryComponent } from './category/dialog-delete-publications-category/dialog-delete-publications-category.component';
import { DialogExportSinglePublicationComponent } from './publications/dialog-export-single-publication/dialog-export-single-publication.component';
import { DialogExportManyPublicationsComponent } from './publications/dialog-export-many-publications/dialog-export-many-publications.component';
import { DialogExportPublicationsCategoryComponent } from './category/dialog-export-publications-category/dialog-export-publications-category.component';


//profile


//statistics
import { NgChartsModule } from 'ng2-charts';
import { DialogUploadFilesComponent } from './publications/dialog-upload-files/dialog-upload-files.component';
import { DialogReplaceContentFileComponent } from './publications/dialog-replace-content-file/dialog-replace-content-file.component';
import { DialogReplacePresentantionFileComponent } from './publications/dialog-replace-presentantion-file/dialog-replace-presentantion-file.component';
import { DialogAddAuthorManuallyComponent } from './publications/dialog-add-author-manually/dialog-add-author-manually.component';
import { DialogAddPublicationPlaceComponent } from './publications/dialog-add-publication-place/dialog-add-publication-place.component';
import { PublicationsPlacesListComponent } from './publications-places/publications-places-list/publications-places-list.component';
import { SinglePublicationPlaceComponent } from './publications-places/single-publication-place/single-publication-place.component';
import { DialogAddRefManualComponent } from './publications/dialog-add-ref-manual/dialog-add-ref-manual.component';
import { DialogEditPublicationPlaceComponent } from './publications-places/dialog-edit-publication-place/dialog-edit-publication-place.component';
import { ProfileEditComponent } from './profile/profile-edit/profile-edit.component';
import { LandingPageComponent } from './landing-page/landing-page.component';
import { AddNewOrganizationComponent } from './profile/add-new-organization/add-new-organization.component';
import { DialogDeleteFromProfileComponent } from './profile/dialog-delete-from-profile/dialog-delete-from-profile.component';
import { DialogAddProfileJobComponent } from './profile/dialog-add-profile-job/dialog-add-profile-job.component';
import { DialogAddStudyProfileComponent } from './profile/dialog-add-study-profile/dialog-add-study-profile.component';
import { DialogPhotoDeleteComponent } from './profile/dialog-photo-delete/dialog-photo-delete.component';
import { MatBadgeModule } from '@angular/material/badge';


//star rating
import { NgxStarRatingModule } from 'ngx-star-rating';
import { UserProfileComponent } from './profile/user-profile/user-profile.component';
import { UserNotFoundComponent } from './profile/user-not-found/user-not-found.component';
import { PagenotfoundComponent } from './pagenotfound/pagenotfound.component';
import { SearchUsersComponent } from './profile/search-users/search-users.component';
import { DialogCvOptionsComponent } from './profile/dialog-cv-options/dialog-cv-options.component';
import { DialogRequestFileComponent } from './publications/dialog-request-file/dialog-request-file.component';
import { RequestListComponent } from './requests/request-list/request-list.component';
import { SingleNotificationComponent } from './notifications/single-notification/single-notification.component';
import { RequestCreatedComponent } from './requests/request-created/request-created.component';
import { RequestReceivedComponent } from './requests/request-received/request-received.component';
import { RequestSingleComponent } from './requests/request-single/request-single.component';
import { DialogCreateEndorsementComponent } from './profile/dialog-create-endorsement/dialog-create-endorsement.component';
import { UserListComponent } from './admin/users/user-list/user-list.component';
import { UserSingleProfileComponent } from './admin/users/user-single-profile/user-single-profile.component';
import { RequestsComponent } from './admin/requests/requests.component';
import { NotificationsComponent } from './admin/notifications/notifications.component';
import { AdminLogsComponent } from './admin/admin-logs/admin-logs.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { PublicationSingleAdminComponent } from './admin/publications/publication-single-admin/publication-single-admin.component';
import { ProfileSettingsComponent } from './profile/profile-settings/profile-settings.component';
import { DialogDeleteAccountComponent } from './profile/dialog-delete-account/dialog-delete-account.component';
import { DialogResetPasswordComponent } from './auth/dialog-reset-password/dialog-reset-password.component';
import { DialogResentVerificationCodeComponent } from './auth/dialog-resent-verification-code/dialog-resent-verification-code.component';
import { DialogAdminAddOrganizationComponent } from './admin/users/dialog-admin-add-organization/dialog-admin-add-organization.component';
import { DialogAdminAddJobComponent } from './admin/users/dialog-admin-add-job/dialog-admin-add-job.component';
import { DialogAdminAddStudyComponent } from './admin/users/dialog-admin-add-study/dialog-admin-add-study.component';
import { CSRFInterceptor } from './csrf.interceptor';
import { DialogAddManyPublicationIdBasedComponent } from './publications/dialog-add-many-publication-id-based/dialog-add-many-publication-id-based.component';



@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LoginComponent,
    SignupComponent,
    PublicationListComponent,
    PublicationCreateComponent,
    PublicationSingleComponent,
    TruncatePipe,
    ErrorComponent,
    PublicationCreatePortalComponent,
    SuccessComponent,
    FilterPipePipe,
    ProfileComponent,
    ReferenceDialogComponent,
    LoadingSpinnerComponent,
    VerifyComponent,
    CapitalizeFirstLetterPipe,
    SearchMultiplePublicationsComponent,
    SelectAuthorsDialogComponent,
    CategorySingleComponent,
    CategoryListComponent,
    DialogDeleteComponent,
    DialogCreateComponent,
    InfoDialogComponent,
    DialogRemoveFromComponent,
    DialogMoveToComponent,
    DialogDeleteManyComponent,
    DialogDeleteManyComponent,
    DashboardComponent,
    DialogAddPubComponent,
    PublicationAllComponent,
    DialogDeleteOneComponent,
    DialogDeleteManyPublicationsComponent,
    DialogMoveManyPublicationsComponent,
    SearchPublicationsPortalComponent,
    DialogDeletePublicationsCategoryComponent,
    DialogExportSinglePublicationComponent,
    DialogExportManyPublicationsComponent,
    DialogExportPublicationsCategoryComponent,
    DialogUploadFilesComponent,
    DialogReplaceContentFileComponent,
    DialogReplacePresentantionFileComponent,
    DialogAddAuthorManuallyComponent,
    DialogAddPublicationPlaceComponent,
    PublicationsPlacesListComponent,
    SinglePublicationPlaceComponent,
    DialogAddRefManualComponent,
    DialogEditPublicationPlaceComponent,
    ProfileEditComponent,
    LandingPageComponent,
    AddNewOrganizationComponent,
    DialogDeleteFromProfileComponent,
    DialogAddProfileJobComponent,
    DialogAddStudyProfileComponent,
    DialogPhotoDeleteComponent,
    UserProfileComponent,
    UserNotFoundComponent,
    PagenotfoundComponent,
    SearchUsersComponent,
    DialogCvOptionsComponent,
    DialogRequestFileComponent,
    RequestListComponent,
    SingleNotificationComponent,
    RequestCreatedComponent,
    RequestReceivedComponent,
    RequestSingleComponent,
    DialogCreateEndorsementComponent,
    UserListComponent,
    UserSingleProfileComponent,
    RequestsComponent,
    NotificationsComponent,
    AdminLogsComponent,
    AdminDashboardComponent,
    PublicationSingleAdminComponent,
    ProfileSettingsComponent,
    DialogDeleteAccountComponent,
    DialogResetPasswordComponent,
    DialogResentVerificationCodeComponent,
    DialogAdminAddOrganizationComponent,
    DialogAdminAddJobComponent,
    DialogAdminAddStudyComponent,
    DialogAddManyPublicationIdBasedComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatMenuModule,
    MatInputModule,
    MatButtonModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    HttpClientModule,
    MatDialogModule,
    MatCheckboxModule,
    MatTableModule,
    MatPaginatorModule,
    MatSliderModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatRadioModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatExpansionModule,
    MatTabsModule,
    MatTooltipModule,
    MatSortModule,
    NgChartsModule,
    MatGridListModule,
    NgxStarRatingModule,
    MatBadgeModule,
    StoreModule.forRoot(reducers, {
      metaReducers,
    }),

    EffectsModule.forRoot([PublicationEffects]),
    HttpClientXsrfModule.withOptions({
      cookieName: 'XSRF-TOKEN',
      headerName: 'X-CSRF-TOKEN'
    }),


  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    //{ provide: HTTP_INTERCEPTORS, useClass: CSRFInterceptor, multi: true },


  ],
  bootstrap: [AppComponent]
})
export class AppModule {

  constructor() { }


}
