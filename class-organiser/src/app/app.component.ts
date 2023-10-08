import { Component , OnInit } from '@angular/core';
import { Timetable, TimetableService } from './services/timetable.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})

export class AppComponent implements OnInit {
  title = 'class-organiser';

  timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!;

  constructor(
    private timetableService: TimetableService
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
}
