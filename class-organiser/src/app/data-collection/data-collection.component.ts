import { Component, OnInit } from '@angular/core';
import { DatabaseReturn, DatabaseService } from '../services/database.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { SingleStudent } from '../services/timetable.service';

interface SurveyData {
  id: number, 
  name: string,
  classes: { id: number, teacher: string }[],
  courses: { id: number, name: string }[],
  restrictions: { id: number, name: string, description: string, options: { id: number, value: string }[] }[]
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

  submitCode(): void {
    if(this.codeInput.length === 5) {
      this.loadNewSurvey(this.code, true);
    }
  }

  loadNewSurvey(code: string, fromInput?: boolean): void {

    this.dbService.getSurvey(fromInput ? this.codeInput : code).subscribe({
      next: (result: DatabaseReturn) => {
        
        this.data = result.data;
        this.createStudentObject();

        console.log(this.data);

        if(fromInput) {
          this.code = this.codeInput;
          this.codeInput = '';
        }
      },
      error: (e: any) => { 
        if(!e.error.data.codeCorrect) {
          this.code = '';
          this.error = 'Incorrect code, please try again!'
        }
      }
    })

  }

  createStudentObject(): void {
    this.student = {
      id: -1, 
      classId: 0, 
      name: { forename: '', surname: '' },
      coursePriorities: [
        ...this.data.courses.map((a: { id: number, name: string }, i: number) => { return { courseId: a.id, priority: i }})
      ],
      data: [
        ...this.data.restrictions.map((a: { id: number, name: string, description: string, options: { id: number, value: string }[] }) => { return { restrictionId: a.id, value: 0 }})
      ]
    }
  }

}
