import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { SingleBlock, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';
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

    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => { this.loadedTimetable = tt; },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })
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

  }

  save(): void {
    // this.loadedTimetableTemplate = null!;
    this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  loading: boolean = false;

  run(): void {

    console.log(this.loadedTimetable);
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
        console.log(result.data);
        this.timetableService.newTimetableData(result.data);
        this.studentEditMode(0, true);
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
      this.timetableService.loadTimetable(value);
  }

  // selectTimetable(input: any, val?: number): void {
  //   let value: number = input ? +input.target.value : val ? val : 0;
  //   this.loadedTimetable = this.timetables[value];
  //   this.savedTimetable = JSON.parse(JSON.stringify(this.timetables[value]));
  //   this.selectedTimetable.emit(this.loadedTimetable);
  // }

  changeRequired(courseId: number, input: any) : void {
    let status: boolean = input.target.checked;
    console.log(status, input.target.checked);

    this.loadedTimetable.students.map((a: SingleStudent) => {
      let priority: { courseId: number, priority: number } = a.coursePriorities.find((b: { courseId: number, priority: number }) => b.courseId === courseId)!;
      priority.priority = status === true ? 0 : a.coursePriorities.filter((b: { priority: number, courseId: number }) => b.priority !== 0).length + 1;
    })

    this.reSortStudentPriorities();
  }

  addCourse(): void {
    let newCourse: SingleCourse;

    if(this.loadedTimetable.courses.length > 0) {
      newCourse = { id: this.loadedTimetable.courses[this.loadedTimetable.courses.length - 1].id + 1, name: '', classSize: 25,  requirement: { required: true, times: 1 }};
    } else {
      newCourse = { id: 0, name: '', classSize: 25,  requirement: { required: true, times: 1 }};
    }

    // add it to each student
    let newCoursePriority: { priority: number, courseId: number } = { courseId: newCourse.id, priority: 0 };
    this.loadedTimetable.students.map((a: SingleStudent) => a.coursePriorities.push({...newCoursePriority}));

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

    this.loadedTimetable.students.map((a: SingleStudent) => {
      a.coursePriorities = a.coursePriorities.filter((b: { courseId: number, priority: number }) => b.courseId !== courseId);
    })

    this.reSortStudentPriorities();
    console.log(this.loadedTimetable.students);

    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  // fill in gaps in the student priority list so they go from 1 to x
  reSortStudentPriorities(): void {
    this.loadedTimetable.students.map((a: SingleStudent) => {
      let required: { courseId: number, priority: number }[] = a.coursePriorities.filter((b: { courseId: number, priority: number }) => b.priority === 0);
      let optional: { courseId: number, priority: number }[] = a.coursePriorities.filter((b: { courseId: number, priority: number }) => b.priority > 0).sort((a: { courseId: number, priority: number }, b: { courseId: number, priority: number }) => a.priority - b.priority ).map((a: { courseId: number, priority: number }, i: number) => { return { courseId: a.courseId, priority: i + 1 } });
      a.coursePriorities = required.concat(...optional)
    })
  }


  addRoom(): void {
    let newRoom: { id: number, name: string };

    if(this.loadedTimetable.rooms.length > 0) {
      newRoom = { id: this.loadedTimetable.rooms[this.loadedTimetable.rooms.length - 1].id + 1, name: '' };
    } else {
      newRoom = { id: 0, name: '' };
    }

    this.loadedTimetable.rooms.push(newRoom);
    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  deleteRoom(roomId: number): void {
    let roomIndex: number = this.loadedTimetable.rooms.findIndex((a: { id: number, name: string }) => a.id === roomId);

    if(roomIndex !== -1) {
      this.loadedTimetable.rooms.splice(roomIndex, 1);
    }

    if(this.loadedTimetable.rooms.length === 0) { this.loadedTimetable.rooms.push({ id: 0, name: 'New Room' })};

    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  addClass(): void {
    let newClass: SingleClass;

    if(this.loadedTimetable.classes.length > 0) {
      newClass = { id: this.loadedTimetable.classes[this.loadedTimetable.classes.length - 1].id + 1, teacher: '' };
    } else {
      newClass = { id: 0, teacher: '' };
    }

    // adding a teacher/class also adds a new block for each of the rows.
    let newClassId: number = newClass.id;
    let highestId: number = 0;

    // get the highest ID already created
    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      for(let o = 0 ; o < this.loadedTimetable.schedule.blocks[i].blocks.length ; o++) {
        highestId = highestId > this.loadedTimetable.schedule.blocks[i].blocks[o].id ? highestId : this.loadedTimetable.schedule.blocks[i].blocks[o].id
      }
    }

    highestId += 1; // add 1 to make this the new highest

    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      let newBlock: SingleBlock = { id: highestId + i, name: 'New Block', classId: newClassId, room: this.loadedTimetable.rooms[0].id, maxStudents: 25, classOnly: false, lockedStudents: [], students: [], courses: [], restrictions: [] };
      this.loadedTimetable.schedule.blocks[i].blocks.push(newBlock);
    }

    this.loadedTimetable.classes.push(newClass);
    this.currentTimetableChange.emit(this.loadedTimetable);
  }


  deleteClass(classId: number): void {
    let classIndex: number = this.loadedTimetable.classes.findIndex((a: SingleClass) => a.id === classId);

    if(classIndex !== -1) {
      // go through and delete the blocks relating tot his class
      let classId: number = this.loadedTimetable.classes[classIndex].id;

      for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
        let findId: number = this.loadedTimetable.schedule.blocks[i].blocks.findIndex((a: SingleBlock) => a.classId === classId);

        if(findId !== -1) {
          this.loadedTimetable.schedule.blocks[i].blocks.splice(findId, 1);
        }
      }

      // and then remove the class.
      this.loadedTimetable.classes.splice(classIndex, 1);
    }

    this.currentTimetableChange.emit(this.loadedTimetable);
  }

  addTimeBlock(): void {

    let newTimeBlock: SingleTimeBlock = {
      name: 'New Time Block',
      teachers: [],
      order: this.loadedTimetable.schedule.blocks.length,
      blocks: [
      ],
      missingStudents: [...this.loadedTimetable.students.map((a: SingleStudent) => { return a.id })]
    }

    let highestId: number = 0;

    // get the highest ID already created for a block
    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      for(let o = 0 ; o < this.loadedTimetable.schedule.blocks[i].blocks.length ; o++) {
        highestId = highestId > this.loadedTimetable.schedule.blocks[i].blocks[o].id ? highestId : this.loadedTimetable.schedule.blocks[i].blocks[o].id
      }
    }

    highestId += 1; // add 1 to make this the new highest

    // create the blocks
    for(let i = 0 ; i < this.loadedTimetable.classes.length ; i++) {
      let newBlock: SingleBlock = { id: highestId + i, name: 'New Block', classId: this.loadedTimetable.classes[i].id, room: this.loadedTimetable.rooms[0].id, maxStudents: 25, classOnly: false, lockedStudents: [], students: [], courses: [], restrictions: [] };
      newTimeBlock.blocks.push(newBlock);
    }

    this.loadedTimetable.schedule.blocks.push(newTimeBlock);
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
    this.timetableService.createDuplicate();
  }

  deleteTimetable(): void {
    this.timetableService.deleteTimetable();
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
