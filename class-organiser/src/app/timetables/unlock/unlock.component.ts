import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { skip } from 'rxjs';
import { TimetableService } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss']
})
export class UnlockComponent implements OnInit {

  @Input() sortMethod: number = -1;
  @Output() closeWindow: EventEmitter<boolean> = new EventEmitter<boolean>;

  constructor(
    private timetableService: TimetableService
  ) {}

  ngOnInit(): void {
    // skip the initial value which will be false.
    this.timetableService.loading.pipe(skip(1)).subscribe({
      next: (result: boolean) => {
        if(result === false) {
          this.close();
        }
      }
    })
  }

  unlock(): void {
    this.timetableService.lockTimetable(false);
  }

  close(): void {
    this.closeWindow.emit(true);
  }
}
