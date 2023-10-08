import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { Component, OnInit } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { Restriction, SingleBlock, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';

export interface SelectionData { code: string, statistics: { index: number, stats: { missed: number, oneTwo: number, one: number, two: number, three: number, four: number, unplaced: number }}[] }

@Component({
  selector: 'app-build-timetable',
  templateUrl: './build-timetable.component.html',
  styleUrls: ['./build-timetable.component.scss']
})
export class BuildTimetableComponent implements OnInit {

  // timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!; // this is what they see

  studentView: boolean = false;
  // loading: boolean = false;

  constructor(
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {
    this.setToggleCopyDataCancel = this.setToggleCopyDataCancel.bind(this);
  }

  ngOnInit(): void {
      // this.timetables = this.timetableService.getFromLocalStorage();

      // if(this.timetables.length > 0) {
      //   // auto select the first timetable
      //   this.selectTimetable(this.timetables[0].id);
      // }
  }

  selectTimetable(value: Timetable): void {
    // this.loadedTimetable = this.timetables.find((a: Timetable) => a.id === value)!;
    this.loadedTimetable = value;
  }

  // save(): void {
  //   // this.loadedTimetableTemplate = null!;
  //   this.timetableService.addTimeTable(this.loadedTimetable);
  // }

  // // loadedTimetableTemplate: Timetable = null!;

  // run(): void {

  //   console.log(this.loadedTimetable);

  //   // save the unedited version
  //   // if(this.loadedTimetableTemplate === null) this.loadedTimetableTemplate = JSON.parse(JSON.stringify(this.loadedTimetable));

  //   this.loading = true;

  //   // run the last unedited version if available - when saved this disappears.
  //   // this.databaseService.processTimetable(this.loadedTimetableTemplate ?? this.loadedTimetable).subscribe({
  //   this.databaseService.processTimetable(this.loadedTimetable).subscribe({
  //     next: (result: DatabaseReturn) => {
  //       // this.loadedTimetable = result.data;
  //       // this.studentView = true;
  //       console.log(result.data);
  //       this.loading = false;
  //       this.timetableSelectionScreen = true;
  //       this.timetableSelectionData = result.data;
  //     },
  //     error: (e: any) => { console.log(e.message); },
  //     complete: () => { this.loading = false; },

  //   })
  // }

  // chooseTimetable(index: number): void {
  //   this.databaseService.retrieveSelectedTimetable(this.timetableSelectionData.code, index).subscribe({
  //     next: (result: DatabaseReturn) => {
  //       this.loadedTimetable = result.data;
  //       this.studentView = true;
  //       console.log(result);
  //     },
  //     error: (e: any) => { console.log(e.message); }
  //   })
  // }

  // action 0 is to trigger student/edit modes
  // action 1 is to save
  // action 2 is to run
  // action 3 is to show options
  actionFromSettings(data: { action: number, value: any }): void {
    switch(data.action) {
      case 0: this.toggleStudentView(data.value as boolean); break;
      // case 1: this.save(); break;
      // case 2: this.run(); break;
      // case 3: this.timetableSelectionScreenToggle(); break;
    }
  }

  // timetableSelectionScreen: boolean = false;
  // timetableSelectionData: SelectionData = null!;

  // timetableSelectionScreenToggle(): void {
  //   this.timetableSelectionScreen = !this.timetableSelectionScreen;
  // }

  copyData: SingleBlock = null!;


  toggleCopyDataOn(blockId: number): void {
    this.copyData = this.findBlockFromId(blockId);

    document.addEventListener('keydown', this.setToggleCopyDataCancel, true);
  }

  setToggleCopyDataCancel(event: any): void {
    if(event.key === "Escape") {
      this.copyData = null!;
      document.removeEventListener('keydown', this.setToggleCopyDataCancel, true);
    }
  }

  pasteData(toBlock: number): void {
    let pasteBlock: SingleBlock = this.findBlockFromId(toBlock);
    pasteBlock.courses = [...this.copyData.courses];
    pasteBlock.restrictions = [...this.copyData.restrictions];
    pasteBlock.classOnly = this.copyData.classOnly;
    pasteBlock.maxStudents = this.copyData.maxStudents;
    pasteBlock.room = this.copyData.room;
  }

  lockStudent(studentId: number, blockId: number): void {
    let block: SingleBlock = this.findBlockFromId(blockId);
    let lockedAlreadyIndex = block.lockedStudents.findIndex((a: number) => a === studentId);



    if(lockedAlreadyIndex === -1) {
      block.lockedStudents.push(studentId);
    } else {
      block.lockedStudents.splice(lockedAlreadyIndex, 1);
    }
  }

  toggleStudentView(value: boolean): void { this.studentView = value; }

  timetableSettingsChange(timetable: Timetable): void {
    // let newId: number = timetable.id;
    this.loadedTimetable = timetable;
    // this.timetableService.addTimeTable(this.loadedTimetable);
  }

  getTeacherFromClassID(classId: number): string {
    let cClass: SingleClass = this.loadedTimetable.classes.find((a: SingleClass) => a.id === classId)!;

    if(cClass) {
      return cClass.teacher;
    } else {
      return 'Unknown Teacher';
    }
  }

  findBlockFromId(blockId: number): SingleBlock {
    let block: SingleBlock = this.loadedTimetable.schedule.blocks.find((a: SingleTimeBlock) => !!a.blocks.find((a: SingleBlock) => a.id === blockId))!.blocks.filter((a: SingleBlock) => a.id === blockId)[0];
    return block;
  }

  /**
   * Generic course things
   */
  setClassOnly(blockId: number): void {
    let block: SingleBlock = this.findBlockFromId(blockId);
    block.classOnly = !block.classOnly;
  }

  /**
   * select for concatenation of dropdowns
   */
  selectBlockProperty(blockId: number, input: any) : void {

    const data: string[] = input.target.value.split(',').map((a: string) => +a );
    console.log(data);

    if(+data[0] === 0) {
      this.selectCourse(blockId, null, +data[1]);
    } else {
      this.selectRestriction(blockId, null, +data[1]);
    }
  }

  /**
   * courses and blocks
   */
  selectCourse(blockId: number, input: any, val?: number): void {
    let courseId: number = val ?? input.target.value;
    // let block: SingleBlock = this.loadedTimetable.schedule.blocks.find((a: SingleTimeBlock) => !!a.blocks.find((a: SingleBlock) => a.id === blockId))!.blocks.filter((a: SingleBlock) => a.id === blockId)[0];
    let block: SingleBlock = this.findBlockFromId(blockId);
    block.courses.push(courseId);
  }

  removeCourseFromBlock(blockId: number, courseId: number): void {
    // let block: SingleBlock = this.loadedTimetable.schedule.blocks.find((a: SingleTimeBlock) => !!a.blocks.find((a: SingleBlock) => a.id === blockId))!.blocks.filter((a: SingleBlock) => a.id === blockId)[0];
    let block: SingleBlock = this.findBlockFromId(blockId);
    let index: number = block.courses.findIndex((a: number) => a === courseId);

    if(index !== -1) {
      block.courses.splice(index, 1);
    }
  }

  getCourseNameFromId(courseId: number): string {
    return this.loadedTimetable.courses.find((a: SingleCourse) => +a.id === +courseId)!.name;
  }

  /**
   * Restrictions and blocks
   */
  selectRestriction(blockId: number, input: any, val?: number): void {
    let block: SingleBlock = this.findBlockFromId(blockId);
    let restrictionId: number = val ?? input.target.value;
    let restriction: Restriction = this.loadedTimetable.restrictions.find((a: Restriction) => a.id === restrictionId)!;
    block.restrictions.push({ restrictionId: restrictionId, optionId: restriction.options[0].id })
  }

  removeRestrictionFromBlock(blockId: number, restrictionId: number): void {
    // let block: SingleBlock = this.loadedTimetable.schedule.blocks.find((a: SingleTimeBlock) => !!a.blocks.find((a: SingleBlock) => a.id === blockId))!.blocks.filter((a: SingleBlock) => a.id === blockId)[0];
    let block: SingleBlock = this.findBlockFromId(blockId);
    let index: number = block.restrictions.findIndex((a: { restrictionId: number, optionId: number }) => a.restrictionId === restrictionId);

    if(index !== -1) {
      block.restrictions.splice(index, 1);
    }
  }

  changeBlockRestrictionOption(blockId: number, restrictionId: number, input: any): void {
    let block: SingleBlock = this.findBlockFromId(blockId);
    let restriction: { restrictionId: number, optionId: number } = block.restrictions.find((a: { restrictionId: number, optionId: number }) => a.restrictionId === restrictionId)!;
    let value = +input.target.value;

    restriction.optionId = value;
  }

  getRestrictionOptions(restrictionId: number): { id: number, value: string }[] {
    let restriction: Restriction = this.loadedTimetable.restrictions.find((a: Restriction) => a.id === restrictionId)!;
    return restriction.options;
  }

  getRestrictionNameFromId(restrictionId: number): string {
    return this.loadedTimetable.restrictions.find((a: Restriction) => +a.id === +restrictionId)!.name;
  }

  getStudentNameFromId(id: number): string {
    const student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === id)!;
    return `${student.name.forename} ${student.name.surname}`;
  }

  getStudentData(blockId: number): SingleStudent[] {
    let block: SingleBlock = this.findBlockFromId(blockId);
    let students: SingleStudent[] = this.loadedTimetable.students.filter((a: SingleStudent) => !!block.students.includes(a.id));
    students.sort((a: SingleStudent, b: SingleStudent) => a.name.surname.toLowerCase().localeCompare(b.name.surname.toLowerCase()));
    return students;
  }

  getMissingStudentData(timeBlockOrder: number): SingleStudent[] {
    let timeBlock: SingleTimeBlock = this.loadedTimetable.schedule.blocks.find((a: SingleTimeBlock) => a.order === timeBlockOrder)!;
    if(!timeBlock.missingStudents) return [];
    let students: SingleStudent[] = this.loadedTimetable.students.filter((a: SingleStudent) => !!timeBlock.missingStudents!.includes(a.id));
    students.sort((a: SingleStudent, b: SingleStudent) => a.name.surname.toLowerCase().localeCompare(b.name.surname.toLowerCase()));
    return students;
  }

  getTopPriorityClass(studentId: number): string {
    let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => +a.id === studentId)!;
    let topPriorityId: number = student.coursePriorities.filter((a: { courseId: number, priority: number }) => a.priority !== 0).sort((a: { courseId: number, priority: number }, b: { courseId: number, priority: number }) => a.priority - b.priority)[0].courseId;
    return this.loadedTimetable.courses.find((a: SingleCourse) => a.id === topPriorityId)!.name;
  }

  getStudentsInTimeBlock(index: number): number {
    return this.loadedTimetable.schedule.blocks[index].blocks.reduce((total: number, block: SingleBlock) => total + block.students.length, 0);
  }

  highlightedStudent: number = -1;

  highlightStudent(studentId: number): void { this.highlightedStudent = studentId; }
  getStudentPriority(studentId: number): number {
    let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === studentId)!;
    let topPriority: number = student.coursePriorities.filter((a: { courseId: number, priority: number }) => a.priority > 0).sort((a: { courseId: number, priority: number }, b: { courseId: number, priority: number }) => a.priority - b.priority)[0].courseId;
    return topPriority;
  }

  isStudentLocked(studentId: number, blockId: number): boolean {
    let block: SingleBlock = this.findBlockFromId(blockId);
    return block.lockedStudents.includes(studentId);
  }

  selectRoom(blockId: number, input: any): void {
    let block: SingleBlock = this.findBlockFromId(blockId);
    block.room = +input.target.value;
  }

  getRoomName(roomId: number): string { return this.loadedTimetable.rooms.find((a: { id: number, name: string}) => +a.id === +roomId)!.name; }

  //drag and drop
  drop(input: CdkDragDrop<any>, timeBlock: number): void {
    // console.log(input);
    const previousGroup: number = +input.previousContainer.id.split('__')[1];
    const newGroup: number = +input.container.id.split('__')[1];
    // this next bit feels like it should be easier...
    const studentId: number = +input.item.element.nativeElement.attributes[3].value;

    if(previousGroup && newGroup) {
      // group to group
      const fromBlock: SingleBlock = this.loadedTimetable.schedule.blocks[timeBlock].blocks.find((a: SingleBlock) => a.id === previousGroup)!;
      const toBlock: SingleBlock = this.loadedTimetable.schedule.blocks[timeBlock].blocks.find((a: SingleBlock) => a.id === newGroup)!;

      let fromBlockId: number = fromBlock.students.findIndex((a: number) => a === studentId);

      if(fromBlockId !== -1) {
        fromBlock.students.splice(fromBlockId, 1);
        toBlock.students.push(studentId);

        // if they were locked in the previous block, unlock them!
        let lockIndex: number = fromBlock.lockedStudents.findIndex((a: number) => a === studentId);
        if(lockIndex !== -1) { fromBlock.lockedStudents.splice(lockIndex, 1); }
      }
    } else if(!previousGroup && newGroup) {
      // no group to group, adding from missing to a group
      const missingStudentIndex: number = this.loadedTimetable.schedule.blocks[timeBlock].missingStudents?.findIndex((a : number) => a === studentId)!;

      if(missingStudentIndex !== -1) {
        const toBlock: SingleBlock = this.loadedTimetable.schedule.blocks[timeBlock].blocks.find((a: SingleBlock) => a.id === newGroup)!;
        toBlock.students.push(studentId);
        this.loadedTimetable.schedule.blocks[timeBlock].missingStudents?.splice(missingStudentIndex, 1);
      }
    } else if(previousGroup && !newGroup) {
      // no group to group, adding to missing from a group
      const fromBlock: SingleBlock = this.loadedTimetable.schedule.blocks[timeBlock].blocks.find((a: SingleBlock) => a.id === previousGroup)!;
      const studentIndex: number = fromBlock.students.findIndex((a: number) => a === studentId);

      if(studentIndex !== -1) {
        // if they were locked in the previous block, unlock them!
        let lockIndex: number = fromBlock.lockedStudents.findIndex((a: number) => a === studentId);
        if(lockIndex !== -1) { fromBlock.lockedStudents.splice(lockIndex, 1); }

        if(this.loadedTimetable.schedule.blocks[timeBlock].missingStudents) {
          this.loadedTimetable.schedule.blocks[timeBlock].missingStudents!.push(studentId);
        } else {
          this.loadedTimetable.schedule.blocks[timeBlock].missingStudents = ([studentId]);
        }

        fromBlock.students.splice(studentIndex, 1);
      }
    }
  }

  hasCourseBeenAdded(blockId: number, courseId: number, timeBlockId: number): boolean {
    let block: SingleBlock = this.loadedTimetable.schedule.blocks[timeBlockId].blocks.find((a: SingleBlock) => a.id === blockId)!;

    if(block) {
      return block.courses.includes(courseId);
    }

    return false;
  }
}

