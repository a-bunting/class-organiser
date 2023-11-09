import { Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, Renderer2, SimpleChanges } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { DataValues, Restriction, SingleBlock, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';
import { SelectionData } from '../build-timetable.component';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-timetable-settings',
  templateUrl: './timetable-settings.component.html',
  styleUrls: ['./timetable-settings.component.scss']
})
export class TimetableSettingsComponent implements OnInit {

  timetables: Timetable[] = [];
  selectionData: SelectionData = null!;

  @Output() triggerAction: EventEmitter<{ action: number, value: boolean }> = new EventEmitter<{ action: number, value: boolean }>;

  savedTimetable: Timetable = null!;
  loadedTimetable: Timetable = null!;

  showCourses: boolean = true;
  showRooms: boolean = true;
  showClasses: boolean = true;
  showRestrictions: boolean = true;

  showUnlockScreen: boolean = false;

  constructor(
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {
    this.boundRemoveDownloadMenu = this.removeDownloadMenu.bind(this);
  }

  ngOnInit(): void {

    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => { this.loadedTimetable = tt; },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })

  }

  save(): void {
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

  selectedTimetableLoading: boolean = false;

  chooseTimetable(index: number): void {
    this.selectedTimetableLoading = true;

    this.databaseService.retrieveSelectedTimetable(this.timetableSelectionData.code, index).subscribe({
      next: (result: DatabaseReturn) => {
        console.log(result.data);
        this.selectedTimetableLoading = false;
        this.studentViewMode = true;
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

  changeRequired(courseId: number, input: any) : void {
    let status: boolean = input.target.checked;
    console.log(status, input.target.checked);

    this.loadedTimetable.students.map((a: SingleStudent) => {
      let priority: { courseId: number, priority: number } = a.coursePriorities!.find((b: { courseId: number, priority: number }) => b.courseId === courseId)!;
      priority.priority = status === true ? 0 : a.coursePriorities!.filter((b: { priority: number, courseId: number }) => b.priority !== 0).length + 1;
    })

    this.reSortStudentPriorities();
  }

  addRestriction(): void {
    let newRestriction: Restriction;

    if(this.loadedTimetable.restrictions.length > 0) {
      newRestriction = { id: this.loadedTimetable.restrictions[this.loadedTimetable.restrictions.length - 1].id + 1, name: '', description: '', poll: true, options: []};
    } else {
      newRestriction = { id: 0, name: '', description: '', poll: true, options: []};
    }

    // add a data value for this to each student
    let dataValue: DataValues = { restrictionId: newRestriction.id, value: 0 };
    this.loadedTimetable.students.map((a: SingleStudent) => a.data.push({...dataValue}));

    this.loadedTimetable.restrictions.push(newRestriction);
  }

  deleteRestriction(restrictionId: number): void {
    this.loadedTimetable.restrictions = this.loadedTimetable.restrictions.filter((a: Restriction) => a.id !== restrictionId);

    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      this.loadedTimetable.schedule.blocks[i].blocks = this.loadedTimetable.schedule.blocks[i].blocks.map((a: SingleBlock) => { return { ...a, restrictions: a.restrictions.filter((a: { restrictionId: number, optionId: number }) => +a.restrictionId !== +restrictionId )}});
    }

    this.loadedTimetable.students.map((a: SingleStudent) => { a.data = a.data.filter((b: DataValues) => b.restrictionId !== restrictionId); })

    this.timetableService.setupRestrictionDeletion(restrictionId);
  }

  editingRestriction: Restriction = null!;

  setEditRestriction(restrictionId: number): void {
    // check if we are closing
    if(this.editingRestriction) {
      if(this.editingRestriction.id === restrictionId) { this.editingRestriction = null!; return; }
    }
    // otherwise new one beign added
    let restriction: Restriction = this.loadedTimetable.restrictions.find((a: Restriction) => a.id === restrictionId)!;
    if(restriction) this.editingRestriction = restriction;
  }

  /*
  / deprecated?
  */
  editRestriction(bypass: boolean, input?: any): void {
    if(bypass) {
        return;
    }

    if(input.keyCode === 13) {
      }
  }

  addOption(restrictionId: number): void {
    let restriction: Restriction = this.loadedTimetable.restrictions.find((a: Restriction) => +a.id === restrictionId)!;
    let value: string = (document.getElementById(`restrictionOption${restrictionId}`)! as HTMLInputElement).value;
    restriction.options.push({ id: restriction.options.length, value });
  }

  deleteOption(optionId: number): void {
    let optionIndex: number = this.editingRestriction.options.findIndex(((a: { id: number, value: string }) => a.id === optionId ))!;

    if(optionIndex !== -1) {
      this.editingRestriction.options.splice(optionIndex, 1);
    }
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
    this.loadedTimetable.students.map((a: SingleStudent) => a.coursePriorities!.push({...newCoursePriority}));

    this.loadedTimetable.courses.push(newCourse);
  }

  editCourse(bypass: boolean, input?: any): void {
    if(bypass) {
        return;
    }

    if(input.keyCode === 13) {
      }
  }

  deleteCourse(courseId: number): void {
    this.loadedTimetable.courses = this.loadedTimetable.courses.filter((a: SingleCourse) => a.id !== courseId);

    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
      this.loadedTimetable.schedule.blocks[i].blocks = this.loadedTimetable.schedule.blocks[i].blocks.map((a: SingleBlock) => { return { ...a, courses: a.courses.filter((a: number) => +a !== +courseId )}});
    }

    this.loadedTimetable.students.map((a: SingleStudent) => {
      a.coursePriorities = a.coursePriorities!.filter((b: { courseId: number, priority: number }) => b.courseId !== courseId);
    })

    this.timetableService.setupCourseDeletion(courseId);
    this.reSortStudentPriorities();

  }

  // fill in gaps in the student priority list so they go from 1 to x
  reSortStudentPriorities(): void {
    this.loadedTimetable.students.map((a: SingleStudent) => {
      let required: { courseId: number, priority: number }[] = a.coursePriorities!.filter((b: { courseId: number, priority: number }) => b.priority === 0);
      let optional: { courseId: number, priority: number }[] = a.coursePriorities!.filter((b: { courseId: number, priority: number }) => b.priority > 0).sort((a: { courseId: number, priority: number }, b: { courseId: number, priority: number }) => a.priority - b.priority ).map((a: { courseId: number, priority: number }, i: number) => { return { courseId: a.courseId, priority: i + 1 } });
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
  }

  deleteRoom(roomId: number): void {
    let roomIndex: number = this.loadedTimetable.rooms.findIndex((a: { id: number, name: string }) => a.id === roomId);

    if(roomIndex !== -1) {
      this.loadedTimetable.rooms.splice(roomIndex, 1);
    }

    if(this.loadedTimetable.rooms.length === 0) { this.loadedTimetable.rooms.push({ id: 0, name: 'New Room' })};

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
      let courses: number[] = this.loadedTimetable.sortMethod === 0 ? [] : [0];
      let newBlock: SingleBlock = { id: highestId + i, name: 'New Block', classId: newClassId, room: this.loadedTimetable.rooms[0].id, maxStudents: 25, classOnly: false, lockedStudents: [], students: [], courses, restrictions: [] };
      this.loadedTimetable.schedule.blocks[i].blocks.push(newBlock);
    }

    this.loadedTimetable.classes.push(newClass);
  }


  deleteClass(classId: number): void {
    let classIndex: number = this.loadedTimetable.classes.findIndex((a: SingleClass) => a.id === classId);

    if(classIndex !== -1) {
      // go through and delete the blocks relating tot his class
      let classId: number = this.loadedTimetable.classes[classIndex].id;

      // moving any students into the missing students box for the timeslowt and remoing the block
      for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
        let findId: number = this.loadedTimetable.schedule.blocks[i].blocks.findIndex((a: SingleBlock) => a.classId === classId);

        if(findId !== -1) {
          let students: number[] = [...this.loadedTimetable.schedule.blocks[i].blocks[findId].students];
          this.loadedTimetable.schedule.blocks[i].missingStudents.push(...students);
          this.loadedTimetable.schedule.blocks[i].blocks.splice(findId, 1);
        }
      }

      // and then remove the class
      this.timetableService.setupClassDeletion(classId);
      this.loadedTimetable.classes.splice(classIndex, 1);
    }
  }

  // calculateBlocksRequired(): number {
  //   let total: number = 0;

  //   for(let i = 0 ; i < this.loadedTimetable.courses.length ; i++) {
  //     let course: SingleCourse = this.loadedTimetable.courses[i];
  //     total += (course.requirement.times ? +course.requirement.times : +0);
  //   }

  //   return total;
  // }

  changeCourseTimes(courseId: number, input: any): void {
    let course: SingleCourse = this.loadedTimetable.courses.find((a: SingleCourse) => a.id === courseId)!;
    if(course) {
      course.requirement.times = +input.target.value;
    }
  }

  saveButtonDisabled(): boolean {
    return JSON.stringify(this.savedTimetable) === JSON.stringify(this.loadedTimetable);
  }

  print(): void {
    window.print();
  }

  studentViewMode: boolean = false;

  studentEditMode(action: number, value?: any ): void {
    // action 0 is to trigger student/edit modes
    // action 1 is to highlight students
    if(action === 0 && value === undefined) {
      this.studentViewMode = !this.studentViewMode;
      value = this.studentViewMode;
    }
    this.triggerAction.emit({ action , value });
  }

  getStudentNamesFromArray(names: number[]): string {
    let output: string = '';
    const MAX_NAMES: number = 5;
    if(names.length === 0) return 'None';

    for(let i = 0 ; i < (names.length > MAX_NAMES ? MAX_NAMES : names.length) ; i++) {
      let name: string = this.loadedTimetable.students.find((a: SingleStudent) => a.id === names[i])!.name.forename + ' ' + this.loadedTimetable.students.find((a: SingleStudent) => a.id === names[i])!.name.surname;
      output += name;

      if(i !== names.length - 1) output += ', ';
    }

    if(names.length > MAX_NAMES) { output += `... and ${names.length - MAX_NAMES} more.`};

    return output;
  }

  removeFromNonOneOrTwo(studentId: number): void {
    this.loadedTimetable.schedule.scores!.nonOneOrTwo = this.loadedTimetable.schedule.scores!.nonOneOrTwo.filter((a: number) => a !== studentId);
  }

  removeFromNotAllRequired(studentId: number): void {
    this.loadedTimetable.schedule.scores!.notAllRequired = this.loadedTimetable.schedule.scores!.notAllRequired.filter((a: number) => a !== studentId);
  }

  toggleSection(sectionName: string): void {
    switch(sectionName) {
      case 'courses': this.showCourses = !this.showCourses; break;
      case 'rooms': this.showRooms = !this.showRooms; break;
      case 'classes': this.showClasses = !this.showClasses; break;
      case 'restrictions': this.showRestrictions = !this.showRestrictions; break;
    }
  }

  /**
   * Experimental
   */

  downloadLink: string = '';
  downloadMessage: string = '';
  processingDownloadLink: boolean = false;

  googleExport(): void {

    this.processingDownloadLink = true;
    this.downloadMessage = `Working on it, this might take a minute...`;

    this.databaseService.googleSheet(this.loadedTimetable).subscribe({
      next: (result: DatabaseReturn) => {
        this.processingDownloadLink = false;
        this.downloadLink = (result.data as string).slice(0, -4) + "copy";
        this.downloadMessage = '';
      },
      error: (e: any) => {
        console.log(e);
        this.processingDownloadLink = false;
        this.downloadMessage = `I failed to make the sheet, try again soon or report it to me at <a href="mailto:alex.bunting@gmail.com">alex.bunting@gmail.com</a>.`;
      }
    })
  }

  closeDownloadLink(): void { this.downloadLink = ''; this.downloadMessage = ''; }


  private boundRemoveDownloadMenu: (event: Event) => void;
  downloadMenuOpened: boolean = false;

  toggleDownloadMenu(event: Event): void {
    if(!this.downloadMenuOpened) {
      this.downloadMenuOpened = true;
      window.addEventListener('click', this.boundRemoveDownloadMenu);
      event.stopPropagation();
    } else {
      this.removeDownloadMenu();
    }
  }

  removeDownloadMenu(): void {
    window.removeEventListener('click', this.boundRemoveDownloadMenu);

    let usermenuElement: HTMLElement = document.getElementById('downloadMenu')!;
    usermenuElement.classList.add('menu__unload');

    setTimeout(() => {
      this.downloadMenuOpened = false;
    }, 500);
  }

  lockTimetable(value: boolean): void {
    if(!value) {
      this.showUnlockScreen = true;
    } else {
      // just lock it!
      this.timetableService.lockTimetable(value);
    }
  }

  closeUnlockWindow(input: any): void {
    if(input === true) {
      this.showUnlockScreen = false;
    }
  }

  copyLink(): void {
    console.log(this.loadedTimetable);
    navigator.clipboard.writeText(`http://localhost:4200/#/survey/${this.loadedTimetable.code}`)
  }

  changeSortingMethod(input: any): void {
    this.loadedTimetable.sortMethod = +input.target.value;
    console.log(this.loadedTimetable.sortMethod);
  }

  enableShuffle(): void {
    this.loadedTimetable.shuffleStudents = !this.loadedTimetable.shuffleStudents;
  }

  setStudentPriorityCount(input: any): void {
    const quantity: number = +input.target.value;
    this.loadedTimetable.studentPriorityCount = quantity;

    // check how many students already have and if its less than the new value add more
    if(this.loadedTimetable.students.length > 0) {
      let studentCurrent: number = this.loadedTimetable.students[0].studentPriorities.length;

      if(studentCurrent < quantity) {
        const difference: number = quantity - studentCurrent;
        const newPriorities: { studentId: number, priority: number }[] = new Array(difference).fill({ studentId: -1, priority: 0 }).map((a: { studentId: number, priority: number }, i: number) => { return { studentId: -1, priority: a.priority = studentCurrent + i + 1 }});

        for(let i = 0 ; i < this.loadedTimetable.students.length ; i++) {
          this.loadedTimetable.students[i].studentPriorities.push(...newPriorities);
        }
      }
    }
  }

}
