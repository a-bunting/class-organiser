import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { SingleCourse, Timetable } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-timetable-settings',
  templateUrl: './timetable-settings.component.html',
  styleUrls: ['./timetable-settings.component.scss']
})
export class TimetableSettingsComponent implements OnChanges {

  @Input() timetables: Timetable[] = [];
  @Output() selectedTimetable: EventEmitter<number> = new EventEmitter<number>;
  @Output() currentTimetableChange: EventEmitter<Timetable> = new EventEmitter<Timetable>;
  @Output() triggerSave: EventEmitter<boolean> = new EventEmitter<boolean>

  loadedTimetable: Timetable = null!;

  selectTimetable(input: any): void {
    let value: number = +input.target.value;
    this.loadedTimetable = this.timetables[value];
    this.selectedTimetable.emit(value);
  }

  ngOnChanges(changes: SimpleChanges): void {
      if(changes['timetables'].currentValue.length > 0) {
        this.loadedTimetable = this.timetables[0];
      }
  }

  addCourse(): void {
    let newCourse: SingleCourse = { id: this.loadedTimetable.courses.length, name: '', requirement: { required: true, times: 1 }};
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

  saveTimetable(): void {
    console.log(this.loadedTimetable);
    this.currentTimetableChange.emit(this.loadedTimetable);
    this.triggerSave.emit(true);
  }
}
