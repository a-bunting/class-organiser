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
    private databaseService: DatabaseService
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
        this.router.navigate(['']);
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
          this.router.navigate(['dashboard', 'timetables']);
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

    this.databaseService.logout().subscribe({
      next: (result: DatabaseReturn) => {
        if(!result.error) this.authService.logOut();
      },
      error: (e: any) => { console.log(e); }
    })


  }


  preloadImages(): void {
    const preload = (folder: string, src: string) => {
      let img: HTMLImageElement = new Image();
      img.src = `../../assets/${folder}/${src}`;
    }

    const fileNames: { folder: string, names: string[] }[] = [{
      folder: 'icons',
      names: [
        'bin2.png', 'checkmark.png', 'circle-down.png','circle-up.png','cogs.png','copy.png','cross.png','download.png','file-empty.png','floppy-disk.png','hammer.png','link.png','list-numbered.png','lock.png','paste.png','printer.png','shuffle.png','unlocked.png','user.png','users.png'
      ]
    },
    {
      folder: 'help/tsv',
      names: [
        'tsv_basic.jpg','howToCsv2-2.jpg'
      ]
    }
  ]

    for(let i = 0 ; i < fileNames.length ; i++) {
      for(let o = 0 ; o < fileNames[i].names.length ; o++) preload(fileNames[i].folder, fileNames[i].names[o]);
    }
  }
}
