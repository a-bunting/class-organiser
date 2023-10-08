import { Component, OnInit, provideZoneChangeDetection } from '@angular/core';
import { filter } from 'rxjs';
import { DataValues, Restriction, SingleCourse, SingleStudent, Timetable, TimetableService } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-student-data',
  templateUrl: './student-data.component.html',
  styleUrls: ['./student-data.component.scss']
})
export class StudentDataComponent implements OnInit {

  timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!;

  constructor(
    private timetableService: TimetableService
  ) {
  }

  ngOnInit(): void {
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
    // subscribe to chnages in the loaded timetable.
    this.timetableService.loadedTimetable.subscribe({
      next: (tt: Timetable) => {
        this.loadedTimetable = tt;
      },
      error: (e: any) => { console.log(`Error: ${e}`)}
    })
  }

  getOptionalUnits(): SingleCourse[] {
    return this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === false);
  }

  getStudentRestrictionData(student: SingleStudent, restriction: Restriction): { id: number, value: string } {
    let studentData: number = student.data.find((a: DataValues) => a.restrictionId === restriction.id )!.value;
    let value: { id: number, value: string } = restriction.options.find((a: { id: number, value: string }) => a.id === studentData)!;
    return value;
  }

  getStudentPriorityData(student: SingleStudent, priority: number): number {
    let studentData: number = student.coursePriorities.find((a: { courseId: number, priority: number }) => a.priority === priority)!.courseId;
    let courseName: SingleCourse = this.loadedTimetable.courses.find((a: SingleCourse) => a.id === studentData)!;
    return courseName.id;
  }

  changeCoursePriority(student: SingleStudent, destinationPriority: number, input: any): void {
    let changeToCourseId: number = +input.target.value;
    let currentPriorityOfChangingCourse: { courseId: number, priority: number } = student.coursePriorities.find((a: { courseId: number, priority: number }) => changeToCourseId === a.courseId)!;

    let between: [number, number] = [currentPriorityOfChangingCourse.priority, destinationPriority];

    if(between[0] > between[1]) {
      // its getting a higher priority
      let filtered = student.coursePriorities.filter((a: { courseId: number, priority: number }) => +a.priority >= between[1] && +a.priority < between[0] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority++ );
    }

    if(between[1] > between[0]) {
      // its getting a lower priority
      let filtered = student.coursePriorities.filter((a: { courseId: number, priority: number }) => +a.priority > between[0] && +a.priority <= between[1] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority-- );
    }

    let course = student.coursePriorities.find((a: { courseId: number, priority: number }) => a.courseId === changeToCourseId)!;
    course.priority = destinationPriority;
    this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  modifyDataValue(student: SingleStudent, restrictionId: number, input: any): void {
    let dataValue: DataValues = student.data.find((a: DataValues) => a.restrictionId === restrictionId)!;
    let newValue: number = +input.target.value;
    dataValue.value = newValue;
    this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

}
