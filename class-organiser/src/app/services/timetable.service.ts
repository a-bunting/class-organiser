import { NumberSymbol } from '@angular/common';
import { Injectable } from '@angular/core';
import { BehaviorSubject, last, Observable } from 'rxjs';
import { DatabaseService } from './database.service';

export interface Timetable {
  id: number;
  name: string;
  classes: SingleClass[];
  schedule: Schedule;
  courses: SingleCourse[];
  restrictions: Restriction[];
  students: SingleStudent[];
  rooms: { id: number, name: string }[];
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
}

export interface SingleTimeBlock {
  name: string; // identifyer of the timeblock, ie a date range or something
  teachers: number[]; // the ids of the teachers who are on this timeblock
  order: number;
  blocks: SingleBlock[];
  missingStudents?: number[];
}

export interface SingleBlock {
  id: number;
  name: string;
  classId: number;
  room: number;
  maxStudents: number;
  classOnly: boolean;
  lockedStudents: number[]
  students: number[];
  courses: number[];
  restrictions: { restrictionId: number, optionId: number }[]; // value is the optionvalue
}

export interface Restriction {
  id: number;
  name: string;
  description: string;
  optionsAreClasses: boolean;
  priority: number;
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

  addNewToLocalStorage(newTimetable: Timetable): void {
    let localStorage: Timetable[] = this.getFromLocalStorage();
    localStorage.push(newTimetable);
    window.localStorage.setItem('classOrganiser', JSON.stringify(localStorage));
    // set the new timetable as the loaded one.
    this.loaded = newTimetable;
    this.loadedTimetable.next(newTimetable);
    this.timetables.next(localStorage);
  }

  getFromLocalStorage(): Timetable[] {
    let fromLocal: Timetable[] = JSON.parse(window.localStorage.getItem('classOrganiser')!);
    return fromLocal ?? [];
  }

  createBlank(): void {
    const lastId: number = this.timetables.value[this.timetables.value.length - 1].id;
    console.log(`new`);

    let newTimetable: Timetable = {
      id: lastId +1,
      name: "New Timetable",
      classes: [],
      courses: [],
      students: [],
      rooms: [],
      restrictions: [
        { id: 0, name: "Gender",              optionsAreClasses: false, priority: 0, description: "Do you identify as Male, Female or Other?", options: [ { id: 0, value: "Male" }, { id: 1, value: "Female" }, { id: 2, value: "Other" }, ]},
        { id: 1, name: "Fasting",             optionsAreClasses: false, priority: 1, description: "During Ramadan do you fast?", options: [ { id: 0, value: "Yes, I fast" }, { id: 1, value: "No, I do not fast" }]},
        { id: 2, name: "Single Sex Swimming", optionsAreClasses: false, priority: 0, description: "Do you require single sex swimming?", options: [ { id: 0, value: "Yes, I require single sex swimming" }, { id: 1, value: "No, I do not require single sex swimming" }]}
      ],
      schedule: { blocks: [] }
    }

    this.addNewToLocalStorage(newTimetable);
  }

  createDuplicate(): void {
    // duplicate the loaded timetable
    const timetable: Timetable = JSON.parse(JSON.stringify(this.loadedTimetable.value));
    const lastId: number = this.timetables.value[this.timetables.value.length - 1].id;
    timetable.id = lastId + 1;
    this.addNewToLocalStorage(timetable);
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
