import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, take, map } from 'rxjs';
import { TimetableStatistics } from '../admin/build-timetable/build-timetable.component';
import { DatabaseReturn, DatabaseService } from './database.service';

export interface Timetable {
  id: number;
  saveCode: string,
  name: string;
  code: string;
  classes: SingleClass[];
  schedule: Schedule;
  courses: SingleCourse[];
  restrictions: Restriction[];
  students: SingleStudent[];
  locked: boolean;
  sortMethod: number; // 0 = coursePriority, 1 = studentPriority, 2 = both
  shuffleStudents: boolean;
  studentPriorityCount: number;
  rooms: { id: number, name: string }[];
  colorPriority: string[]
}

export interface SingleCourse {
  id: number;
  name: string;
  classSize: number;
  requirement: { required: boolean, times?: number }
}

// schedule data
export interface Schedule {
  blocks: SingleTimeBlock[];
  scores?: TimetableStatistics;
}

export interface SingleTimeBlock {
  name: string; // identifyer of the timeblock, ie a date range or something
  teachers: number[]; // the ids of the teachers who are on this timeblock
  order: number;
  blocks: SingleBlock[];
  missingStudents: number[];
}

export interface SingleBlock {
  id: number;
  name: string;
  classId: number;
  room: number;
  maxStudents: number;
  classOnly: boolean;
  lockedStudents: number[];
  selectedCourse?: number;
  students: number[];
  courses: number[];
  restrictions: { restrictionId: number, optionId: number }[]; // value is the optionvalue
}

export interface Restriction {
  id: number;
  name: string;
  description: string;
  poll: boolean;
  options: { id: number, value: string }[];
}

// class data
export interface SingleClass {
  id: number;
  teacher: string;
}

export interface SingleStudent {
  id: number;
  classId: number;
  email?: string;
  name: { forename: string; surname: string; };
  data: DataValues[];
  coursePriorities: { courseId: number, priority: number }[];
  studentPriorities: { studentId: number, priority: number }[];
}

export interface DataValues {
  restrictionId: number; // refers to a restriction
  value: number; // id for that restriction option
  critical?: boolean; // if true, this MUST be met for you to be placed
}

export interface TimetableList {
  id: number, name: string, saveCode: string
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {

  loadedTimetable: BehaviorSubject<Timetable> = new BehaviorSubject<Timetable>(null!);
  timetableList: BehaviorSubject<TimetableList[]> = new BehaviorSubject<TimetableList[]>(null!);
  loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  loaded: Timetable = null!;
  timetables: Timetable[] = [];

  constructor(
    private databaseService: DatabaseService
  ) {
    // get the LOCAL timetables tyo start with
    this.timetables = this.getFromLocalStorage();
  }

  /**
   * Populate the timetables array with either an empty array or the contents of local.
   * @returns
   */
  getFromLocalStorage(): Timetable[] {
    let fromLocal: Timetable[] = JSON.parse(window.localStorage.getItem('classOrganiser')!);
    return fromLocal ?? [];
  }

  /**
   * Step 1 in loading, get a list from the database of the timetables attributed to this person
   * This is only a list of ids, savecodes and names
   */
  getTimetableList(): void {
    this.loading.next(true);

    this.databaseService.getTimetablesList().subscribe({
      next: (result: DatabaseReturn) => {
        this.timetableList.next(result.data);

        // now if anything exists in the local that is NOT in this list then purge it!
        let ids: number[] = result.data.map((a: TimetableList) => { return a.id });
        let local: Timetable[] = this.getFromLocalStorage().filter((a: Timetable) => ids.includes(a.id) );
        window.localStorage.setItem('classOrganiser', JSON.stringify(local));
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })
  }

  /**
   * Step 2 is when loading a timetable...
   * @param ttId
   * @returns
   */
  loadTimetableById(ttId: number, force = false): void {
    const timetable: Timetable = this.timetables.find((a: Timetable) => a.id === ttId)!;
    const timetableLoad: TimetableList = this.timetableList.value.find((a: TimetableList) => a.id === ttId)!;

    if(timetable && timetableLoad && !force) {
      // this is in the timetable array already, but it MIGHT have just come from a local copy
      // compare the loaded savecode to the downloaded database savecode
      if(timetable.saveCode === timetableLoad.saveCode) {
        // save codes match so the local version is the BEST version to send.
        // return of(timetable);
        this.loadTimetable(timetable);
        return;
      }
    }

    // now either the timetable doesnt exist locally or the savecodes didnt matchg
    // download from the database.
    this.loading.next(true);

    this.databaseService.getTimetable(ttId).subscribe({
      next: (result: DatabaseReturn) => {
        if(!timetable) {
          // doesnt exist so add it
          this.addNewToLocalStorage(result.data);
        } else {
          // savecodes didnt match so update it
          this.updateLocalStorage(result.data.id, result.data);
        }

        console.log(result.data);
        this.loadTimetable(result.data);
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })

  }

  errorThrown(e: unknown): void {

  }

  lockTimetable(value: boolean): void {
    this.loading.next(true);

    this.databaseService.setTimetableLock(this.loaded.id, value).subscribe({
      next: (result: DatabaseReturn) => {
        // lock it locally too
        this.loaded.locked = value;
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })
  }

  // literally just called by loadTimetableById to load the tmetable into the system
  loadTimetable(timetable: Timetable): void {
    this.loaded = timetable;
    this.loadedTimetable.next(timetable);
  }

  newTimetableData(blocks: Timetable): void {
    this.loaded = blocks;
    this.generateColors();
    this.updateLocalStorage(this.loaded.id, this.loaded);
    this.loadedTimetable.next(this.loaded);
  }

  updateSavedTimetable(updatedTimetable: Timetable): void {
    this.loaded = updatedTimetable;
    this.updateLocalStorage(this.loaded.id, this.loaded);
  }

  updateLocalStorage(ttId: number, updatedTimetable: Timetable): void {
    let localStorage: Timetable[] = this.getFromLocalStorage();
    let ttInStorage: Timetable[] = localStorage.map((a: Timetable) => {
      if(a.id === ttId) {
        return updatedTimetable;
      } else return a
    });
    // update the local storage
    window.localStorage.setItem('classOrganiser', JSON.stringify(ttInStorage));
  }

  fullSave(updatedTimetable: Timetable): void {
    const newCode: string = this.generateRandomString(10);
    updatedTimetable.saveCode = newCode;
    this.updateLocalStorage(updatedTimetable.id, updatedTimetable);
    this.saveToDatabase(updatedTimetable);
  }

  addNewToLocalStorage(newTimetable: Timetable): void {
    let localStorage: Timetable[] = this.getFromLocalStorage();
    localStorage.push(newTimetable);
    window.localStorage.setItem('classOrganiser', JSON.stringify(localStorage));
    // set the new timetable as the loaded one.
    this.loaded = newTimetable;
    this.loadedTimetable.next(newTimetable);
    this.timetables = localStorage;
  }

  saveToDatabase(newTimetable: Timetable): void {

    const deletedArray: { courses: number[], classes: number[], restrictions: number[], students: number[] } = {
      courses: this.deletedUnsavedCourses,
      classes: this.deletedUnsavedClasses,
      restrictions: this.deletedUnsavedRestrictions,
      students: this.deletedUnsavedStudents
    }

    this.loading.next(true);

    this.databaseService.saveTimetable(newTimetable, deletedArray).subscribe({
      next: (result: DatabaseReturn) => {
        if(!result.error) {
          this.clearTemporaryChanges();
        }
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })
  }

  deleteTimetable(): void {
    let ttId: number = this.loaded.id;
    this.loading.next(true);

    // now make sure its gone from the database, and if it is delete from local and finish up
    this.databaseService.deleteTimetable(ttId).subscribe({
      next: (result: DatabaseReturn) => {
        let localStorage: Timetable[] = this.getFromLocalStorage();
        let index: number = localStorage.findIndex((a: Timetable) => a.id === this.loadedTimetable.value.id);

        if(index === -1) {
          localStorage.splice(index, 1);
          // update the local storage
          window.localStorage.setItem('classOrganiser', JSON.stringify(localStorage));
          this.timetables = localStorage;
        }

        // update timetables list
        let ttIndex: number = this.timetableList.value.findIndex((a: TimetableList) => a.id === ttId)!;

        if(ttIndex !== -1) {
          let ttList: TimetableList[] = [...this.timetableList.value];
          ttList.splice(ttIndex, 1);
          this.timetableList.next(ttList);
        }

        this.loaded = null!;
        this.loadedTimetable.next(null!);
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })

    // if(this.timetables.value.length > 0) {
    //   this.loaded = this.timetables.value[0];
    //   this.loadedTimetable.next(this.timetables.value[0]);
    // }
  }

  /**
   * Creation and Deletion of timetables
   */

  createBlank(sortMethod: number): void {
    const timetables: Timetable[] = this.getFromLocalStorage();
    let courses: SingleCourse[] = sortMethod === 0 ? [] : [{ id: 0, name: 'StudentPriority', classSize: 24, requirement: { required: true, times: 999 }}];

    let newTimetable: Timetable = {
      id: undefined!,
      code: "",
      sortMethod: sortMethod,
      saveCode: this.generateRandomString(10),
      name: "New Timetable",
      classes: [],
      courses: courses,
      students: [],
      studentPriorityCount: sortMethod === 0 ? 0 : 3,
      shuffleStudents: false,
      rooms: [{ id: 0, name: 'New Room' }],
      restrictions: [],
      locked: false,
      schedule: { blocks: [] },
      colorPriority: []
    }

    this.loading.next(true);

    this.databaseService.saveTimetable(newTimetable).subscribe({
      next: (result: DatabaseReturn) => {
        this.timeTableCreated(result, newTimetable);
      },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })

  }

  timeTableCreated(result: DatabaseReturn, timetable: Timetable): void {
    timetable.id = result.data.id;
    timetable.code = result.data.code;
    timetable.saveCode = result.data.saveCode;
    timetable.locked = false;

    // update timetables list
    let timetableValues: TimetableList[] = [...this.timetableList.value, {id: timetable.id, name: timetable.name, saveCode: timetable.saveCode}];
    this.timetableList.next(timetableValues);

    this.clearTemporaryChanges(); // clear changes made in the old loaded sheet
    this.loadTimetable(timetable);
    this.addNewToLocalStorage(timetable);
    this.fullSave(timetable);
  }

  createDuplicate(scheduleDataCopy = true, studentDataCopy = true): void {
    // duplicate the loaded timetable
    const timetable: Timetable = JSON.parse(JSON.stringify(this.loaded));
    
    // if required remove stuent data
    if(!studentDataCopy) {
      timetable.students = [];
      timetable.schedule.blocks.forEach((a: SingleTimeBlock) => {
        a.missingStudents = [];

        a.blocks.forEach((b: SingleBlock) => {
          b.lockedStudents = [];
          b.students = [];
        })
      })
    }

    // if schedule data is not requireed
    if(!scheduleDataCopy) {
      timetable.schedule.blocks = [];
      delete timetable.schedule.scores;
    }

    timetable.code = ""; // force a new entry in the db
    timetable.name = timetable.name + ' (Copy)';
    timetable.id = undefined!;

    this.loading.next(true);

    this.databaseService.saveTimetable(timetable).subscribe({
      next: (result: DatabaseReturn) => { this.timeTableCreated(result, timetable);  },
      error: (e: unknown) => { this.errorThrown(e); this.loading.next(false); },
      complete: () => { this.loading.next(false); }
    })
  }

  // these are arrays of values to dlete from the database as opposed to updated
  // in the case of a save. They only trigger on a full save so a reload can be performed and only the
  // acts of clicking save actually impacts the database.
  // clears upon reloading of timetable o0r saving of timetable
  deletedUnsavedClasses: number[] = [];
  deletedUnsavedCourses: number[] = [];
  deletedUnsavedRestrictions: number[] = [];
  deletedUnsavedStudents: number[] = [];

  clearTemporaryChanges(): void {
    this.deletedUnsavedClasses = [];
    this.deletedUnsavedCourses = [];
    this.deletedUnsavedStudents = [];
    this.deletedUnsavedRestrictions = [];
  }

  setupClassDeletion(classId: number): void {
    this.deletedUnsavedClasses.push(classId);
  }

  setupCourseDeletion(courseId: number): void {
    this.deletedUnsavedCourses.push(courseId);
  }

  setupRestrictionDeletion(restriction: number): void {
    this.deletedUnsavedRestrictions.push(restriction);
  }

  setupStudentDeletion(studentId: number): void {
    this.deletedUnsavedStudents.push(studentId);
  }

  // colours

  generateColors(): void {
    const colorRangeQuantity: number = this.loaded.sortMethod === 0 ? this.loaded.students[0].coursePriorities!.length : this.loaded.students[0].studentPriorities!.length;

    if(colorRangeQuantity) {
      this.loaded.colorPriority = this.getColors(colorRangeQuantity);
    }
  }

  getColors(values: number): string[] {
    let red: number = 0;
    let green: number = 255;
    let stepsize: number = (255 * 2) / values;
    let returnString = [];

    while(red < 255) {
      red += stepsize;
      if(red > 255) red = 255;
      returnString.push(`rgb(${red},${green},0)`)
    }
    while(green > 0) {
      green -= stepsize;
      if(green < 0) green = 0;
      returnString.push(`rgb(${red},${green},0)`)
    }

    return returnString;
  }

  generateRandomString(characterCount: number = 10, randomWords: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'): string {
    let newCode: string = '';
    // generate an id
    for(let i = 0 ; i < characterCount ; i++) {
        let randomNumber = Math.floor(Math.random() * randomWords.length)
        newCode += randomWords.charAt(randomNumber);
    }
    return newCode;
  }


}
