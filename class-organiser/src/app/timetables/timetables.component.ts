import { Component } from '@angular/core';
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

  constructor(
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {
  }

  ngOnInit(): void {
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
}
