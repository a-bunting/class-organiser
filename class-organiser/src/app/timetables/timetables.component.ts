import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, User } from '../services/authentication.service';
import { DatabaseReturn, DatabaseService } from '../services/database.service';
import { Timetable, TimetableList, TimetableService } from '../services/timetable.service';

@Component({
  selector: 'app-timetables',
  templateUrl: './timetables.component.html',
  styleUrls: ['./timetables.component.scss']
})
export class TimetablesComponent {

  timetables: TimetableList[] = [];
  loadedTimetable: Timetable = null!;
  user: User = null!;
  userMenuOpened: boolean = false;
  loading: boolean = false;
  createNew: boolean = false;

  constructor(
    private router: Router,
    public authService: AuthenticationService,
    private timetableService: TimetableService,
  ) {
    this.boundRemoveUserMenu = this.removeUserMenu.bind(this);
    this.preloadImages();
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

    this.timetableService.timetableList.subscribe({
      next: (result: TimetableList[]) => {
        this.timetables = result;
      },
      error: (e: any) => { console.log(`Error getting timetables list: ${e}`)}
    })

    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => {
        if(tt) {
          this.loadedTimetable = tt;
          this.router.navigate(['timetables']);
        } else {
          this.loadedTimetable = null!;
        }
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })

    this.timetableService.loading.subscribe({
      next: (value: boolean) => { this.loading = value; }
    })

    this.timetableService.getTimetableList();
  }

  loadTimetable(input: any): void {
    this.timetableService.loadTimetableById(+input.target.value);
  }

  saveTimetable(): void {
    this.timetableService.fullSave(this.loadedTimetable);
  }

  createNewTimetable(): void {
    // this.timetableService.createBlank();
    this.createNew = true;
  }

  newTimetableCreated(value: boolean): void {
    this.createNew = value;
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


  preloadImages(): void {
    const preload = (src: string) => {
      let img: HTMLImageElement = new Image();
      img.src = `../../assets/icons/${src}.png`;
    }

    const fileNames: string[] = [
      'bin2', 'circle-down','link','circle-up','cogs','copy','download','file-empty','floppy-disk','hammer','list-numbered','lock','paste','printer','unlocked','user','users'
    ]

    for(let i = 0 ; i < fileNames.length ; i++) preload(fileNames[i]);
  }
}
