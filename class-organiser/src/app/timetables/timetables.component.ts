import { Component, ComponentRef, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService, User } from '../services/authentication.service';
import { DatabaseReturn, DatabaseService } from '../services/database.service';
import { Timetable, TimetableList, TimetableService } from '../services/timetable.service';
import { NotificationReturnData, NotificationService } from '../services/notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-timetables',
  templateUrl: './timetables.component.html',
  styleUrls: ['./timetables.component.scss']
})
export class TimetablesComponent implements OnInit ,OnDestroy {

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
    private databaseService: DatabaseService,
    private notificationService: NotificationService,
    private viewContainerRef: ViewContainerRef
  ) {
    notificationService.setViewContainerRef = viewContainerRef;
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
          // this.router.navigate(['dashboard', 'timetables']);
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

  ngOnDestroy(): void {
    this.notificationSubscriptions?.unsubscribe();
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

  createDuplicateNotification(): void {
    this.notificationSubscriptions = this.notificationService.createNewNotification(
      `Create a duplicte of ${this.loadedTimetable.name}`,
      {
        type: 'checkbox',
        text: 'This will create a duplicate of the currently loaded timetable. Which data would you also like to transfer?',
        values: [
          { text: 'Scheduling Data', selected: true },
          { text: 'Student Data', selected: true },
        ]
      },
      [
        { text: 'Duplicate timetable', returnValue: true },
        { text: 'Cancel', returnValue: null },
      ]
     ).subscribe({
      next: (data: NotificationReturnData) => {
        if(data[0] === true && Array.isArray(data[1])) {
          this.timetableService.createDuplicate(data[1][0], data[1][1]);
        }
      }
     })
  }

  deleteNotification(): void {
    this.notificationSubscriptions = this.notificationService.createNewNotification(
      `Delete Timetable: ${this.loadedTimetable.name}`,
      {
        type: 'checkbox',
        text: 'Are you sure you want to delete this timetable? This will delete all data, including student data and scheduling data.',
        values: [
          { text: 'Yes, I understand this will delete all data.', selected: false },
        ]
      },
      [
        { text: 'Delete timetable', returnValue: true, conditions: [true] },
        { text: 'Cancel Deletion', returnValue: null },
      ]
     ).subscribe({
      next: (data: NotificationReturnData) => {
        if(data[0] === true && Array.isArray(data[1]) && data[1][0] === true) {
          this.timetableService.deleteTimetable();
        }
      }
     })
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

    const usermenuElement: HTMLElement = document.getElementById('usermenu')!;
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
      const img: HTMLImageElement = new Image();
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

  notificationSubscriptions: Subscription | null = null;

  testNotification2(): void {
   this.notificationSubscriptions = this.notificationService.createNewNotification(
    'test notififcation',
    {
      type: 'checkbox',
      text: 'This is to test out whether checkboxes work in the notification: ',
      values: [
        { text: 'do lists work?', selected: true },
        { text: 'if not, why not?', selected: true }
      ]
    },
    [
      { text: 'I understand', returnValue: 1, conditions: [true, true] },
      { text: 'I do NOT understand', returnValue: 0 },
    ]
   ).subscribe({
    next: (data: NotificationReturnData) => {
      console.log(data);
      if(data[0] === 0) {
        this.notificationService.destroyNotification();
      }
    }
   })
  }

}
