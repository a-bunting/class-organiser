import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, User } from '../services/authentication.service';
import { DatabaseService } from '../services/database.service';
import { Timetable, TimetableService } from '../services/timetable.service';

@Component({
  selector: 'app-timetables',
  templateUrl: './timetables.component.html',
  styleUrls: ['./timetables.component.scss']
})
export class TimetablesComponent {
  timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!;
  user: User = null!;
  userMenuOpened: boolean = false;

  constructor(
    private router: Router,
    public authService: AuthenticationService,
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {
    this.boundRemoveUserMenu = this.removeUserMenu.bind(this);
  }

  ngOnInit(): void {
    // subscribe to users and check if the user is logged in
    this.authService.user.subscribe({
      next: (user: User) => {
        if(user) { this.user = user; return }
        // not logged in
        this.router.navigate(['start']);
      },
      error: (e: any) => { console.log(`Error with your login: ${e}`)}
    })

    // subscribe to chnages in the all timetable.
    this.timetableService.timetables.subscribe({
      next: (tt: Timetable[]) => {
        this.timetables = tt;

        if(!this.loadedTimetable && this.timetables.length > 0) {
          this.timetableService.loadTimetable(this.timetables[0].id);
        }
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })
    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => {
        this.loadedTimetable = tt;
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })
  }

  loadTimetable(input: any): void {
    console.log(`loading ${+input.target.value}`);
    this.timetableService.loadTimetable(+input.target.value);
  }

  createNewTimetable(): void {
    this.timetableService.createBlank();
  }

  createDuplicateTimetable(): void {
    this.timetableService.createDuplicate();
  }

  deleteTimetable(): void {
    this.timetableService.deleteTimetable();
  }

  private boundRemoveUserMenu: (event: Event) => void;

  toggleUserMenu(event: Event): void {
    if(!this.userMenuOpened) {
      this.userMenuOpened = true;
      window.addEventListener('click', this.boundRemoveUserMenu);
      event.stopPropagation();
    } else {
      this.removeUserMenu();
    }
  }

  removeUserMenu(): void {
    window.removeEventListener('click', this.boundRemoveUserMenu);

    let usermenuElement: HTMLElement = document.getElementById('usermenu')!;
    usermenuElement.classList.add('usermenu__unload');

    setTimeout(() => {
      this.userMenuOpened = false;
    }, 500);
  }

  logout(): void {
    this.authService.logOut();
  }
}
