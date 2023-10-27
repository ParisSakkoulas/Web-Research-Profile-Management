import { Component, OnInit } from '@angular/core';
import { AdminService } from '../../admin.service';
import { AuthService } from 'src/app/auth/auth.service';
import { Store } from '@ngrx/store';
import { setLoadingAction } from 'src/app/core/state/spinner';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { SuccessComponent } from 'src/app/success/success.component';
import { PageEvent } from '@angular/material/paginator';

@Component({
  selector: 'app-user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {


  public userDataC !: null | { user_id: any, userRole: string | null, firstName: string | null, lastName: string | null, userName: string | null, email: string | null };


  public users: { user_id: any, firstName: string, email: string, lastName: string, password: string, userName: string, userRole: string, userStatus: string }[] = []

  public totalUsers = 0; // Total number of categopries
  public pageSizeUsers = 5;
  public currentPageUsers = 0;
  pageSizeOptionsUsers = [1, 3, 5, 10, 15, 20];
  displayedUsers: any[] = [];


  //για το filtering
  filterValue!: string;
  public selectedStatusOptions: string[] = [];

  constructor(private store: Store, private dialog: MatDialog, private adminService: AdminService, private authService: AuthService) { }

  ngOnInit(): void {


    this.userDataC = this.authService.getUserDataC();

    console.log("Current user ", this.userDataC)



    this.adminService.getAllUsers().subscribe({

      next: (response) => {


        this.users = response.users;
        this.updateDisplayedUsers();
        this.totalUsers = this.users.length


      }
    })



  }


  verifyUser(id: any) {

    this.store.dispatch(setLoadingAction({ status: true }));

    this.adminService.verifySingleUser(id).subscribe({
      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));


        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


        this.users.map(user => {

          if (Number(user.user_id) === Number(id)) {

            user.userStatus = 'Active';

          }

        })

      }
    })

  }

  inactivateUser(id: any) {


    this.store.dispatch(setLoadingAction({ status: true }));

    this.adminService.inactivateUser(id).subscribe({
      next: (response) => {

        this.store.dispatch(setLoadingAction({ status: false }));


        ///Άνοιγμα του dialog για το μήνυμα επιτυχίας
        const dialogMessageConfig = new MatDialogConfig();
        dialogMessageConfig.data = {
          message: response.message
        }
        dialogMessageConfig.panelClass = 'success_class';

        this.dialog.open(SuccessComponent, dialogMessageConfig);


        this.users.map(user => {

          if (Number(user.user_id) === Number(id)) {

            user.userStatus = 'Inactive';

          }

        })

      }
    })


  }


  updateDisplayedUsers() {
    const startIndex = this.currentPageUsers * this.pageSizeUsers;
    const endIndex = startIndex + this.pageSizeUsers;
    console.log("Start index", startIndex);
    console.log("End index", endIndex);

    if (this.users) {
      this.displayedUsers = this.users.slice(startIndex, endIndex);
    }
  }

  onPageChange(event: PageEvent) {
    console.log(event)
    this.currentPageUsers = event.pageIndex;
    this.pageSizeUsers = event.pageSize;
    this.updateDisplayedUsers();
  }

  applyFilterNew() {



    let normalizedFilterText: string;
    if (this.filterValue) {
      normalizedFilterText = this.filterValue.replace(/\s+/g, ' ').trim().toLowerCase();

    }



    this.displayedUsers = this.users.filter(user => {
      const normalizedFullName = `${user.firstName} ${user.lastName}`.replace(/\s+/g, ' ').toLowerCase();
      return (
        (this.selectedStatusOptions.length === 0 || this.selectedStatusOptions.includes(user.userStatus)) &&
        (
          user.userName.includes(this.filterValue) ||
          user.email.includes(this.filterValue) ||
          normalizedFullName.includes(normalizedFilterText)
        )
      );
    });

  }


}
