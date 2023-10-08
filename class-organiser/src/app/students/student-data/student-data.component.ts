import { Component, OnInit } from '@angular/core';
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

  getStudentPriorityData(student: SingleStudent, course: SingleCourse): SingleCourse {
    let studentData: number = student.coursePriorities.find((a: { courseId: number, priority: number }) => a.courseId === course.id)!.priority;
    let courseName: SingleCourse = this.loadedTimetable.courses.find((a: SingleCourse) => a.id === studentData)!;
    return courseName;
  }

}
