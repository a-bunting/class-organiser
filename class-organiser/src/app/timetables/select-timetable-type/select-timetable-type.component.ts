import { Component, EventEmitter, Output } from '@angular/core';
import { TimetableService } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-select-timetable-type',
  templateUrl: './select-timetable-type.component.html',
  styleUrls: ['./select-timetable-type.component.scss']
})
export class SelectTimetableTypeComponent {

  @Output() killMenu: EventEmitter<boolean> = new EventEmitter<boolean>(false);

  constructor(
    private timetableService: TimetableService
  ) {}

  createTimetable(sortType: number): void {
    this.timetableService.createBlank(sortType);
    this.killMenu.emit(false);
  }

}
