import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { SingleBlock, SingleCourse, Timetable } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-timetable-settings',
  templateUrl: './timetable-settings.component.html',
  styleUrls: ['./timetable-settings.component.scss']
})
export class TimetableSettingsComponent implements OnChanges {

  @Input() timetables: Timetable[] = [];
  @Output() selectedTimetable: EventEmitter<number> = new EventEmitter<number>;
  @Output() currentTimetableChange: EventEmitter<Timetable> = new EventEmitter<Timetable>;
  @Output() triggerSave: EventEmitter<boolean> = new EventEmitter<boolean>;
  @Output() triggerRun: EventEmitter<boolean> = new EventEmitter<boolean>;


  loadedTimetable: Timetable = null!;

  constructor(
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
      if(changes['timetables'].currentValue.length > 0) {
        this.loadedTimetable = this.timetables[0];
      }

  }

  selectTimetable(input: any): void {
    let value: number = +input.target.value;
    this.loadedTimetable = this.timetables[value];
    this.selectedTimetable.emit(value);
  }


  addCourse(): void {
    let newCourse: SingleCourse = { id: this.loadedTimetable.courses[this.loadedTimetable.courses.length - 1].id + 1, name: '', requirement: { required: true, times: 1 }};
    this.loadedTimetable.courses.push(newCourse);
    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  editCourse(bypass: boolean, input?: any): void {
    if(bypass) {
      this.currentTimetableChange.emit(this.loadedTimetable);
      return;
    }

    if(input.keyCode === 13) {
      this.currentTimetableChange.emit(this.loadedTimetable);
    }
  }

  deleteCourse(courseId: number): void {
    this.loadedTimetable.courses = this.loadedTimetable.courses.filter((a: SingleCourse) => a.id !== courseId);

    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      this.loadedTimetable.schedule.blocks[i].blocks = this.loadedTimetable.schedule.blocks[i].blocks.map((a: SingleBlock) => { return { ...a, courses: a.courses.filter((a: number) => +a !== +courseId )}});
    }

    this.saveTimetable();
  }

  calculateBlocksRequired(): number {
    let total: number = 0;

    for(let i = 0 ; i < this.loadedTimetable.courses.length ; i++) {
      let course: SingleCourse = this.loadedTimetable.courses[i];
      total += (course.requirement.times ? +course.requirement.times : +0);
    }

    return total;
  }

  saveTimetable(): void {
    console.log(this.loadedTimetable);
    this.currentTimetableChange.emit(this.loadedTimetable);
    this.triggerSave.emit(true);
  }

  runTimetable(): void {
    this.triggerRun.emit(true);
  }
}
