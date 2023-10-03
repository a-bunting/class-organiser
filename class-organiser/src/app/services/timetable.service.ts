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
}

export interface SingleCourse {
  id: number; name: string; classSize: number; requirement: { required: boolean, times?: number }
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
  room: string;
  maxStudents: number;
  classOnly: boolean;
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
  room: string;
}

export interface SingleStudent {
  id: number;
  classId: number;
  name: { forename: string; surname: string; };
  data: DataValues[];
  coursePriorities: { courseId: number, priority: number }[];
  schedule?: { classId: number, blockId: number }
}

export interface DataValues {
  restrictionId: number; // refers to a restriction
  value: number; // id for that restriction option
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
}

/**
 *
 *
 * every studentList student
 *
 * Listening on port 3002
{
  id: 0,
  classId: 0,
  name: { forename: 'Katherine', surname: 'Worf' },
  data: [
    { restrictionId: 0, value: 0 },
    { restrictionId: 8, value: 0 },
    { restrictionId: 9, value: 1 }
  ],
  coursePriorities: [
    { courseId: 3, priority: 1 },
    { courseId: 0, priority: 0 },
    { courseId: 2, priority: 2 },
    { courseId: 1, priority: 0 },
    { courseId: 5, priority: 3 },
    { courseId: 6, priority: 4 },
    { courseId: 7, priority: 5 },
    { courseId: 4, priority: 6 },
    { courseId: 8, priority: 7 }
  ],
  requiredCourses: [
    { id: 0, timesLeft: 1, required: true },
    { id: 3, timesLeft: 1, required: false },
    { id: 8, timesLeft: 1, required: false },
    { id: 1, timesLeft: 1, required: true },
    { id: 6, timesLeft: 1, required: false },
    { id: 7, timesLeft: 1, required: false },
    { id: 5, timesLeft: 1, required: false },
    { id: 2, timesLeft: 1, required: false },
    { id: 4, timesLeft: 1, required: false }
  ]
}
run timer: 6.348ms

 */
