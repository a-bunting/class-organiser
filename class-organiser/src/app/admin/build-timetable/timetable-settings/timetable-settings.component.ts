import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { SingleBlock, SingleCourse, Timetable, TimetableService } from 'src/app/services/timetable.service';
import { SelectionData } from '../build-timetable.component';

@Component({
  selector: 'app-timetable-settings',
  templateUrl: './timetable-settings.component.html',
  styleUrls: ['./timetable-settings.component.scss']
})
export class TimetableSettingsComponent implements OnInit {

  // @Input() timetables: Timetable[] = [];
  timetables: Timetable[] = [];
  selectionData: SelectionData = null!;

  @Output() selectedTimetable: EventEmitter<Timetable> = new EventEmitter<Timetable>;
  @Output() currentTimetableChange: EventEmitter<Timetable> = new EventEmitter<Timetable>;
  @Output() triggerAction: EventEmitter<{ action: number, value: boolean }> = new EventEmitter<{ action: number, value: boolean }>;

  savedTimetable: Timetable = null!;
  loadedTimetable: Timetable = null!;

  constructor(
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {}

  ngOnInit(): void {
    this.timetables = this.timetableService.getFromLocalStorage();

    if(this.timetables.length > 0) {
      // auto select the first timetable
      this.selectTimetable(null, this.timetables[0].id);
      this.currentTimetableChange.emit(this.loadedTimetable);
    }
  }

  save(): void {
    // this.loadedTimetableTemplate = null!;
    this.timetableService.addTimeTable(this.loadedTimetable);
  }

  loading: boolean = false;

  run(): void {

    this.loading = true;

    // run the last unedited version if available - when saved this disappears.
    // this.databaseService.processTimetable(this.loadedTimetableTemplate ?? this.loadedTimetable).subscribe({
    this.databaseService.processTimetable(this.loadedTimetable).subscribe({
      next: (result: DatabaseReturn) => {
        // this.loadedTimetable = result.data;
        // this.studentView = true;
        console.log(result.data);
        this.loading = false;
        this.timetableSelectionScreen = true;
        this.timetableSelectionData = result.data;
      },
      error: (e: any) => { console.log(e.message); },
      complete: () => { this.loading = false; },

    })
  }

  chooseTimetable(index: number): void {
    this.databaseService.retrieveSelectedTimetable(this.timetableSelectionData.code, index).subscribe({
      next: (result: DatabaseReturn) => {
        this.loadedTimetable = result.data;
        this.studentEditMode(0, true);
        console.log(result);
        this.currentTimetableChange.emit(this.loadedTimetable);
      },
      error: (e: any) => { console.log(e.message); }
    })
  }

  timetableSelectionScreen: boolean = false;
  timetableSelectionData: SelectionData = null!;

  timetableSelectionScreenToggle(status: boolean): void {
    this.timetableSelectionScreen = status;
  }






  selectTimetable(input: any, val?: number): void {
    let value: number = input ? +input.target.value : val ? val : 0;
    this.loadedTimetable = this.timetables[value];
    this.savedTimetable = JSON.parse(JSON.stringify(this.timetables[value]));
    this.selectedTimetable.emit(this.loadedTimetable);
  }


  addCourse(): void {
    let newCourse: SingleCourse = { id: this.loadedTimetable.courses[this.loadedTimetable.courses.length - 1].id + 1, name: '', classSize: 25,  requirement: { required: true, times: 1 }};
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

    this.currentTimetableChange.emit(this.loadedTimetable);
  }


  addRoom(): void {
    let newRoom: { id: number, name: string } = { id: this.loadedTimetable.rooms[this.loadedTimetable.rooms.length - 1].id + 1, name: '' };
    this.loadedTimetable.rooms.push(newRoom);
    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  deleteRoom(roomId: number): void {
    let roomIndex: number = this.loadedTimetable.rooms.findIndex((a: { id: number, name: string }) => a.id === roomId);

    if(roomIndex !== -1) {
      this.loadedTimetable.rooms.splice(roomIndex, 1);
    }

    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  calculateBlocksRequired(): number {
    let total: number = 0;

    for(let i = 0 ; i < this.loadedTimetable.courses.length ; i++) {
      let course: SingleCourse = this.loadedTimetable.courses[i];
      total += (course.requirement.times ? +course.requirement.times : +0);
    }

    return total;
  }

  saveButtonDisabled(): boolean {
    return JSON.stringify(this.savedTimetable) === JSON.stringify(this.loadedTimetable);
  }

  print(): void {
    window.print();
  }

  createNewTimetable(): void {
    this.timetableService.createBlank();
  }

  createDuplicateTimetable(): void {

  }

  studentViewMode: boolean = false;

  studentEditMode(action: number, value?: any ): void {
    // action 0 is to trigger student/edit modes
    // action 1 is to save
    // action 2 is to run
    // action 3 is to show options
    // action 4 is for a new timetable
    // action 5 is to duplicate
    // action 6 is to delete
    if(action === 0 && value === undefined) {
      this.studentViewMode = !this.studentViewMode;
      value = this.studentViewMode;
    }
    this.triggerAction.emit({ action , value });
  }
}
