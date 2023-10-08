import { NumberSymbol } from '@angular/common';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  timetables: Timetable[] = []

  constructor() { }

  getTimetable(timetableId?: number): Timetable {
    return this.timetables.find((a: Timetable) => a.id === timetableId)!;
  }

  getTimetables(): Timetable[] {
    return this.timetables;
  }

  addTimeTable(timetable: Timetable): boolean {
    this.addToLocalStorage(timetable);
    return true;
  }

  saveTimetable(timetable: Timetable): void {
    this.addToLocalStorage(timetable);
  }

  addToLocalStorage(timetable: Timetable): void {
    window.localStorage.setItem('classOrganiser', JSON.stringify([timetable]));
  }

  getFromLocalStorage(): Timetable[] {
    let fromLocal: Timetable[] = JSON.parse(window.localStorage.getItem('classOrganiser')!);
    return fromLocal;
  }

  createBlank(): void {

  }

  createDuplicate(ttId: number): void {

  }
}
