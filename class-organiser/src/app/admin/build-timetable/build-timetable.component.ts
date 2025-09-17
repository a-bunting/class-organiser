import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
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
export class BuildTimetableComponent implements OnInit, OnDestroy {

  loadedTimetable: Timetable = null!; // this is what they see

  constructor(
    private timetableService: TimetableService,
    private router: Router
  ) {
  }

  subscriptions: Subscription[] = [];

  ngOnDestroy(): void {
    this.subscriptions.forEach((a: Subscription) => a.unsubscribe() );
  }

  ngOnInit(): void {
    // subscribe to chnages in the loaded timetable.
    const ttSub: Subscription = this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => {
        this.loadedTimetable = tt;

        // switch(this.loadedTimetable.sortMethod) {
        //   case 0: this.router.navigate(['dashboard', 'timetables', 'classes']); break;
        //   case 1: this.router.navigate(['dashboard', 'timetables', 'groups']); break;
        // }
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })

    this.subscriptions.push(ttSub);
  }

}

