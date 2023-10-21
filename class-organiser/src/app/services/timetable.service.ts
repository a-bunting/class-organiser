import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { TimetableStatistics } from '../admin/build-timetable/build-timetable.component';
import { DatabaseReturn, DatabaseService } from './database.service';

export interface Timetable {
  id: number;
  name: string;
  code: string;
  classes: SingleClass[];
  schedule: Schedule;
  courses: SingleCourse[];
  restrictions: Restriction[];
  students: SingleStudent[];
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
}

export interface DataValues {
  restrictionId: number; // refers to a restriction
  value: number; // id for that restriction option
  critical?: boolean; // if true, this MUST be met for you to be placed
}

@Injectable({
  providedIn: 'root'
})
export class TimetableService {

  loadedTimetable: BehaviorSubject<Timetable> = new BehaviorSubject<Timetable>(null!);
  timetables: BehaviorSubject<Timetable[]> = new BehaviorSubject<Timetable[]>(null!);

  loaded: Timetable = null!;

  constructor(
    private databaseService: DatabaseService
  ) {
    this.timetables.next(this.getTimetables());
  }

  getTimetables(): Timetable[] {
    return this.getFromLocalStorage();
  }

  getTimetableById(ttId: number): Timetable {
    return this.timetables.value.find((a: Timetable) => a.id === ttId)!;
  }

  loadTimetable(ttId: number): void {
    const timetable: Timetable = this.getTimetableById(ttId);
    this.loaded = timetable;
    this.loadedTimetable.next(timetable);
  }

  newTimetableData(blocks: Timetable): void {
    this.loaded = blocks;
    this.generateColors();
    this.updateLocalStorage(this.loaded.id, this.loaded);
    this.loadedTimetable.next(this.loaded);
  }

  generateColors(): void {
    const courseNumber: number = this.loaded.students[0].coursePriorities.length;
    this.loaded.colorPriority = this.getColors(courseNumber);
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
    this.timetables.next(localStorage);
  }

  saveToDatabase(newTimetable: Timetable): void {

    const deletedArray: { courses: number[], classes: number[], restrictions: number[], students: number[] } = {
      courses: this.deletedUnsavedCourses,
      classes: this.deletedUnsavedClasses,
      restrictions: this.deletedUnsavedRestrictions,
      students: this.deletedUnsavedStudents
    }

    this.databaseService.saveTimetable(newTimetable, deletedArray).subscribe({
      next: (result: DatabaseReturn) => {
        console.log(result);
        if(!result.error) {
          this.clearTemporaryChanges();
        }
      },
      error: (e: any) => {
        console.log(`Error: ${e}`);
      }
    })
  }

  getFromLocalStorage(): Timetable[] {
    let fromLocal: Timetable[] = JSON.parse(window.localStorage.getItem('classOrganiser')!);
    return fromLocal ?? [];
  }


  /**
   * Creation and Deletion of timetables
   */

  createBlank(): void {
    const timetables: Timetable[] = this.getFromLocalStorage();

    let newTimetable: Timetable = {
      id: undefined!,
      code: "",
      name: "New Timetable",
      classes: [],
      courses: [],
      students: [],
      rooms: [{ id: 0, name: 'New Room' }],
      restrictions: [
      ],
      schedule: { blocks: [] },
      colorPriority: []
    }

    this.databaseService.saveTimetable(newTimetable).subscribe({
      next: (result: DatabaseReturn) => {
        newTimetable.id = result.data.id;
        newTimetable.code = result.data.code;
        this.addNewToLocalStorage(newTimetable);
        this.clearTemporaryChanges(); // clear changes made in the old loaded sheet
      },
      error: (e: any) => { console.log(`Error: ${e}`) }
    })

  }

  createDuplicate(): void {
    // duplicate the loaded timetable
    const timetable: Timetable = JSON.parse(JSON.stringify(this.loadedTimetable.value));
    timetable.code = ""; // force a new entry in the db
    timetable.name = timetable.name + ' (Copy)';

    this.databaseService.saveTimetable(timetable).subscribe({
      next: (result: DatabaseReturn) => {
        timetable.id = result.data.id;
        timetable.code = result.data.code;
        this.addNewToLocalStorage(timetable);
        this.clearTemporaryChanges(); // clear changes made in the old loaded sheet
      },
      error: (e: any) => { console.log(`Error: ${e}`) }
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

  deleteTimetable(): void {
    console.log(`delete`);
    let localStorage: Timetable[] = this.getFromLocalStorage();
    let index: number = localStorage.findIndex((a: Timetable) => a.id === this.loadedTimetable.value.id);
    localStorage.splice(index, 1);
    // update the local storage
    window.localStorage.setItem('classOrganiser', JSON.stringify(localStorage));
    this.timetables.next(localStorage);

    if(this.timetables.value.length > 0) {
      this.loaded = this.timetables.value[0];
      this.loadedTimetable.next(this.timetables.value[0]);
    }
  }

}
