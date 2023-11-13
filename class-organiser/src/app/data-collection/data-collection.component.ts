import { Component, OnInit } from '@angular/core';
import { DatabaseReturn, DatabaseService } from '../services/database.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SingleCourse, SingleStudent } from '../services/timetable.service';

interface SurveyData {
  id: number,
  studentPriorityCount: number,
  name: string,
  sortMethod: number,
  classes: { id: number, teacher: string }[],
  courses: { id: number, name: string }[],
  restrictions: { id: number, name: string, description: string, options: { id: number, value: string }[] }[],
  students: { id: number, name: { forename: string, surname: string } }[]
}

@Component({
  selector: 'app-data-collection',
  templateUrl: './data-collection.component.html',
  styleUrls: ['./data-collection.component.scss']
})
export class DataCollectionComponent implements OnInit {

  constructor(
    private dbService: DatabaseService,
    private activeRoute: ActivatedRoute
  ) {}

  code: string = '';
  codeInput: string = '';
  data: SurveyData = null!;
  error: string = '';
  thinking: boolean = false;
  complete: boolean = false;
  locked: boolean = false;

  student: SingleStudent = null!;

  ngOnInit(): void {
    this.activeRoute.paramMap.subscribe({
      next: (params: ParamMap) => {
        this.code = params.get('code') ?? '';

        if(this.code !== '') {
          this.loadNewSurvey(this.code);
        }
      }
    })
  }

  save(): void {
    if(!this.valid()) return;

    this.thinking = true;

    this.dbService.saveUser(this.code, this.data.id, this.student).subscribe({
      next: (result: DatabaseReturn) => {
        this.complete = true;
        this.thinking = false;
        this.student.id = result.data.id;
        this.finish();
      },
      error: (e: any) => {
        this.error = 'Unable to save, please try again soon...';
        this.thinking = false;
      }
    })
  }

  highlightRequired: boolean = false;
  highlightEmails: boolean = false;
  confirmedEmail: string = '';

  valid(): boolean {
    this.highlightEmails = false;
    this.highlightRequired = false;

    console.log(this.student.email);
    console.log(this.confirmedEmail);

    if(!this.student.name.forename || !this.student.name.surname || !this.student.email || !this.confirmedEmail) {
      this.error = "Please ensure you enter all required (*) data";
      this.highlightRequired = true;
      return false;
    }

    if(this.confirmedEmail !== this.student.email) {
      this.error = "Please ensure your email and confirmed email are correct";
      this.highlightEmails = true;
      return false;
    }

    if(!this.isValidEmail(this.student.email)) {
      this.error = "Please input a valid email address"
      this.highlightEmails = true;
      return false;
    }

    return true;
  }

  isValidEmail(email: string): boolean {
    const emailRegex: RegExp = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  finish(): void {
    let surveysDone: { code: string, complete: boolean, object: SingleStudent }[] = JSON.parse(window.localStorage.getItem('coComplete')!);

    if(!surveysDone) {
      surveysDone = [];
    }

    // if this has been added before update it - if it hasnt been done before add and save it.
    let preSurvey: number = surveysDone.findIndex((a: { code: string, complete: boolean, object: SingleStudent }) => a.code === this.code)!;
    if(preSurvey !== -1) { surveysDone.splice(preSurvey, 1); }

    surveysDone.push({ code: this.code, complete: true, object: this.student });
    window.localStorage.setItem('coComplete', JSON.stringify(surveysDone));
  }

  submitCode(): void {

    if(this.codeInput.length === 5) {
      let surveysDone: { code: string, complete: boolean, object: SingleStudent }[] = JSON.parse(window.localStorage.getItem('coComplete')!);

      if(surveysDone) {
        let foundObject: { code: string, complete: boolean, object: SingleStudent } = surveysDone.find((a: { code: string, complete: boolean, object: SingleStudent }) => a.code === this.codeInput)!;
        this.error = '';

        if(foundObject) {
          this.student = foundObject.object;
          this.confirmedEmail = this.student.email!;
          this.locked = true;
          this.loadNewSurvey(this.codeInput, true);
        } else {
          this.loadNewSurvey(this.codeInput, true);          
        }
      } else {
        this.error = '';
        this.loadNewSurvey(this.codeInput, true);
      }
    }


  }


  loadNewSurvey(code: string, fromInput?: boolean): void {

    this.thinking = true;

    this.dbService.getSurvey(fromInput ? this.codeInput : code).subscribe({
      next: (result: DatabaseReturn) => {

        if(result.error) {
          // error for some reason but queries succeseded
          if(result.data.locked) { this.locked = true; }
        } else {
          this.data = result.data;
          this.createStudentObject();
  
          if(fromInput) {
            this.code = this.codeInput;
            this.codeInput = '';
          }
        }


        this.thinking = false;
      },
      error: (e: any) => {
        if(!e.error.data.codeCorrect) {
          this.code = '';
          this.error = 'Incorrect code, please try again!'
        }
        this.thinking = false;
      }
    })

  }

  createStudentObject(): void {
    // if a loaded student is here, return that.
    if(this.student !== null) return;

    this.student = {
      id: -1,
      classId: 0,
      name: { forename: '', surname: '' },
      coursePriorities: [
        ...this.data.courses.map((a: { id: number, name: string }, i: number) => { return { courseId: +a.id, priority: i + 1 }})
      ],
      studentPriorities: Array.from({ length: this.data.studentPriorityCount }, (_, i) => ({ studentId: i, priority: i + 1 }))
      ,
      data: [
        ...this.data.restrictions.map((a: { id: number, name: string, description: string, options: { id: number, value: string }[] }) => { return { restrictionId: +a.id, value: 0 }})
      ]
    }
  }

  setClass(classId: any): void {
    this.student.classId = +classId.target.value;
  }

  setDataValue(restrictionId: number, option: any): void {

    let data: { restrictionId: number, value: number } = this.student.data.find((a: { restrictionId: number, value: number }) => a.restrictionId === +restrictionId)!;
    console.log(data, +restrictionId, +option.target.value);
    data.value = +option.target.value;
  }

  changeCoursePriority(destinationPriority: number, input: any): void {
    let changeToCourseId: number = +input.target.value;
    let currentPriorityOfChangingCourse: { courseId: number, priority: number } = this.student.coursePriorities!.find((a: { courseId: number, priority: number }) => changeToCourseId === +a.courseId)!;
    let between: [number, number] = [currentPriorityOfChangingCourse.priority, destinationPriority];

    if(between[0] > between[1]) {
      // its getting a higher priority
      let filtered = this.student.coursePriorities!.filter((a: { courseId: number, priority: number }) => +a.priority >= between[1] && +a.priority < between[0] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority++ );
    }

    if(between[1] > between[0]) {
      // its getting a lower priority
      let filtered = this.student.coursePriorities!.filter((a: { courseId: number, priority: number }) => +a.priority > between[0] && +a.priority <= between[1] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority-- );
    }

    let course = this.student.coursePriorities!.find((a: { courseId: number, priority: number }) => a.courseId === changeToCourseId)!;
    course.priority = destinationPriority;
  }

  setStudentPriority(priority: number, input: any): void {
    let studentId: number = +input.target.value;
    let studPrio: { studentId: number, priority: number } = this.student.studentPriorities!.find((a: { studentId: number, priority: number }) => +a.priority === +priority)!;
    studPrio.studentId = studentId;
  }

  studentAlreadySelected(studentId: number): boolean {
    return this.student.studentPriorities?.map((a: { studentId: number, priority: number }) => { return a.studentId }).includes(studentId) ?? false;
  }
  
  isStudentSelected(studentId: number, priority: number): boolean {
    return this.student.studentPriorities?.find((a: { studentId: number, priority: number }) => a.priority === priority)?.studentId === studentId ?? false;
  }

  getStudentPriorityData(priority: number): number {
    let studentData: number = this.student.coursePriorities!.find((a: { courseId: number, priority: number }) => a.priority === priority)!.courseId;
    return studentData;
  }

}
