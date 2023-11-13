import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Timetable, TimetableService } from 'src/app/services/timetable.service';

export interface SelectionData {
  code: string;
  statistics: OptionStatistics[];
}

export interface OptionStatistics {
  index: number, stats: TimetableStatistics
}

export interface TimetableStatistics {
  score: number, unplaced: number, nonOneOrTwo: number[], notAllRequired: number[], priorityOneOrTwo: number, prioritySatisfied: number[]
}

@Component({
  selector: 'app-build-timetable',
  templateUrl: './build-timetable.component.html',
  styleUrls: ['./build-timetable.component.scss']
})
export class BuildTimetableComponent implements OnInit {

  loadedTimetable: Timetable = null!; // this is what they see

  constructor(
    private timetableService: TimetableService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => {
        this.loadedTimetable = tt;

        console.log(tt);

        switch(this.loadedTimetable.sortMethod) {
          case 0: this.router.navigate(['dashboard', 'timetables', 'classes']); break;
          case 1: this.router.navigate(['dashboard', 'timetables', 'groups']); break;
        }
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })
  }

}

