import { Component, OnInit } from '@angular/core';
import { DatabaseReturn, DatabaseService } from 'src/app/services/database.service';
import { Restriction, SingleBlock, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';

export interface SelectionData { code: string, statistics: { index: number, stats: { missed: number, oneTwo: number, one: number, two: number, three: number, four: number }}[] }

@Component({
  selector: 'app-build-timetable',
  templateUrl: './build-timetable.component.html',
  styleUrls: ['./build-timetable.component.scss']
})
export class BuildTimetableComponent implements OnInit {

  timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!;
  studentView: boolean = false;

  constructor(
    private timetableService: TimetableService,
    private databaseService: DatabaseService
  ) {
    this.setToggleCopyDataCancel = this.setToggleCopyDataCancel.bind(this);
  }

  ngOnInit(): void {
      this.timetables = this.timetableService.getFromLocalStorage();

      if(this.timetables.length > 0) {
        // auto select the first timetable
        this.selectTimetable(this.timetables[0].id);
      }
  }

  selectTimetable(value: number): void {
    this.loadedTimetable = this.timetables.find((a: Timetable) => a.id === value)!;
  }

  save(): void {
    this.lastTimetableUnRun = null!;
    this.timetableService.addTimeTable(this.loadedTimetable);
  }

  lastTimetableUnRun: Timetable = null!;

  run(): void {

    console.log(this.loadedTimetable);

    // save the unedited version
    if(this.lastTimetableUnRun === null) this.lastTimetableUnRun = JSON.parse(JSON.stringify(this.loadedTimetable));

    // run the last unedited version if available - when saved this disappears.
    this.databaseService.processTimetable(this.lastTimetableUnRun ?? this.loadedTimetable).subscribe({
      next: (result: DatabaseReturn) => {
        // this.loadedTimetable = result.data;
        // this.studentView = true;
        console.log(result.data);
        this.timetableSelectionScreen = true;
        this.timetableSelectionData = result.data;
      },
      error: (e: any) => { console.log(e.message); }
    })
  }

  chooseTimetable(index: number): void {
    this.databaseService.retrieveSelectedTimetable(this.timetableSelectionData.code, index).subscribe({
      next: (result: DatabaseReturn) => {
        this.loadedTimetable = result.data;
        this.studentView = true;
      },
      error: (e: any) => { console.log(e.message); }
    })
  }

  timetableSelectionScreen: boolean = false;
  timetableSelectionData: SelectionData = null!;

  timetableSelectionScreenToggle(): void {
    this.timetableSelectionScreen = !this.timetableSelectionScreen;
  }

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
  }

  toggleStudentView(): void { this.studentView = !this.studentView; }

  timetableSettingsChange(timetable: Timetable): void {
    // let newId: number = timetable.id;
    console.log(timetable);
    this.loadedTimetable.courses = timetable.courses;
    console.log(this.loadedTimetable);
    this.timetableService.addTimeTable(this.loadedTimetable);
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
    let students: SingleStudent[] = this.loadedTimetable.students.filter((a: SingleStudent) => !!block.students.find((b: number) => b === a.id));
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

}
