import { Component, OnInit, provideZoneChangeDetection } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService, User } from 'src/app/services/authentication.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DataValues, Restriction, SingleClass, SingleCourse, SingleStudent, Timetable, TimetableService } from 'src/app/services/timetable.service';

interface CsvObject {
  [key: string]: string;
}

@Component({
  selector: 'app-student-data',
  templateUrl: './student-data.component.html',
  styleUrls: ['./student-data.component.scss']
})
export class StudentDataComponent implements OnInit {

  // timetables: Timetable[] = [];
  loadedTimetable: Timetable = null!;
  user: User = null!;

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private timetableService: TimetableService
  ) {
  }

  ngOnInit(): void {
    // subscribe to users and check if the user is logged in
    this.authService.user.subscribe({
      next: (user: User) => {
        if(user) { this.user = user; return }
        // not logged in
        this.router.navigate(['start']);
      },
      error: (e: any) => { console.log(`Error with your login: ${e}`)}
    })

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

  asc: boolean = true;

  sortByEmail(): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      if(this.asc) return a.email?.localeCompare(b.email ?? '')!
      else return b.email?.localeCompare(a.email ?? '')!
    });

    this.asc = !this.asc;
  }

  sortByTeacher(): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      if(this.asc) return a.classId - b.classId
      else return b.classId - a.classId
    });

    this.asc = !this.asc;
  }

  sortByForeName(): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      if(this.asc) return a.name.forename.localeCompare(b.name.forename);
      else return b.name.forename.localeCompare(a.name.forename)
    });

    this.asc = !this.asc;
  }

  sortBySurname(): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      if(this.asc) return a.name.surname.localeCompare(b.name.surname);
      else return b.name.surname.localeCompare(a.name.surname)
    });

    this.asc = !this.asc;
  }

  sortByRestriction(restrictionId: number): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      let aD: number = a.data.find((c: DataValues) => c.restrictionId === restrictionId)!.value;
      let bD: number = b.data.find((c: DataValues) => c.restrictionId === restrictionId)!.value;
      if(this.asc) return aD - bD;
      else return bD - aD;
    })
    this.asc = !this.asc;
  }

  sortByPriority(priority: number): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      let aD: number = a.coursePriorities.find((c: { courseId: number, priority: number }) => c.priority === priority)!.courseId;
      let bD: number = b.coursePriorities.find((c: { courseId: number, priority: number }) => c.priority === priority)!.courseId;
      if(this.asc) return aD - bD;
      else return bD - aD;
    })

    this.asc = !this.asc;
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

  modifyClassTeacher(studentId: number, input: any): void {
    let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === studentId)!;
    student.classId = +input.target.value;
    this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  content: string = '';

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const files = (event.dataTransfer?.files || []) as FileList;
    this.handleFiles(files);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private handleFiles(files: FileList): void {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.readFileContents(file);
    }
  }

  private readFileContents(file: File): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      const contents = e.target?.result as string;
      this.content = contents; // Do something with the CSV contents
      this.parseCsvString(contents);
    };
    reader.readAsText(file);
  }


  // thanks chatgpt!
  parseCsvString(csvData: string): void {

    const rows = csvData.trim().split('\n');
    const headers = rows[0].split('\t');
    const results: CsvObject[] = [];
    let students: SingleStudent[] = [];
    let exclusions: string[] = ['','timestamp'];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t').map(header => header.trim());
      const entry: CsvObject = {};

      for (let j = 0; j < headers.length; j++) {
        // exclude particlar columns
        if(exclusions.includes(headers[j].toLowerCase())) continue;
        // add if its proper to
        entry[headers[j].toLowerCase().trim()] = values[j];

        // build an exclusion list to filter for the restrictions;
        if(isNaN(+headers[j].toLowerCase()) && !['email', 'name', 'teacher'].includes(headers[j].toLowerCase()) && !this.restrictionInclusionList.includes(headers[j].toLowerCase())) {
          this.restrictionInclusionList.push(headers[j].toLowerCase());
        }
      }

      results.push(entry);
    }

    // build the data needed to make a student list
    this.generateRestrictions(results);
    this.generateClasses(results);
    this.generateCourses(results);

    students = results.map((a: CsvObject, i: number) => {
      return {
        id: i, classId: this.getClassId(a['teacher']),
        name: { forename: a['name'].split(' ')[0], surname: a['name'].split(' ')[1] },
        email: a['email'],
        data: this.getStudentRestrictionDataValues(a),
        coursePriorities: this.getCoursePriorities(a)
      }
    })

    this.loadedTimetable.students = students;
  }

  classes: SingleClass[] = [];
  courses: SingleCourse[] = [];

  generateClasses(data: CsvObject[]): void {
    let teachers = Array.from(new Set(data.map(a => { return a['teacher'] }))).concat(this.loadedTimetable.classes.map((a: SingleClass) => { return a.teacher }));
    let classesLastId: number = 0;

    for(let i = 0 ; i < this.loadedTimetable.classes.length ; i++) {
      if(this.loadedTimetable.classes[i].id >= classesLastId) classesLastId = this.loadedTimetable.classes[i].id + 1;
    }

    // makes a list of classes with all teachers, including new ones.
    for(let i = 0 ; i < teachers.length ; i++) {
      this.classes.push({ teacher: teachers[i], id: classesLastId + i });
    }

    this.loadedTimetable.classes = this.classes;
  }

  getClassId(teacherName: string): number {
    return this.classes.find(a => a.teacher === teacherName)!.id;
  }

  getCourseId(name: string): number {
    let courseIdIndex: number = this.courses.findIndex(a => a.name === name);

    if(courseIdIndex !== -1) {
      return this.courses[courseIdIndex].id;
    } else {
      return NaN;
    }
  }

  getCoursePriorities(a: CsvObject): { priority: number, courseId: number }[] {
    let coursePriorities: { priority: number, courseId: number }[] = [];

    for(let i = 0 ; i < 16 ; i++) {
      if(!isNaN(this.getCourseId(a[`${i}`]))) coursePriorities.push({ priority: i, courseId: this.getCourseId(a[`${i}`])})
    }

    // add in the required things.
    const requiredCourses: SingleCourse[] = this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === true );

    for(let i = 0 ; i < requiredCourses.length ; i++) {
      coursePriorities.push({ priority: 0, courseId: this.getCourseId(requiredCourses[i].name)})
    }

    return coursePriorities;
  }

  generateCourses(data: CsvObject[]): void {
    let dataSet = data[0];
    let coursesList: SingleCourse[] = this.loadedTimetable.courses;
    let courses: string[] = this.loadedTimetable.courses.map((a: SingleCourse) => a.name );
    let lastId: number = 0;
    let newCourses: number = 0;

    for(let i = 0 ; i < coursesList.length ; i++) {
      if(coursesList[i].id >= lastId) lastId = coursesList[i].id + 1;
    }

    // ifnd new courses and add them
    for(let i = 0 ; i < 16 ; i++) {
      if(!courses.includes(dataSet[`${i+1}`])) {
        // this is new
        coursesList.push({ id: lastId + newCourses, name: dataSet[`${i+1}`], classSize: 24, requirement: { required: false, times: 1 } });
        courses.push(dataSet[`${i}`]);
        newCourses++;
      }
    }


    this.courses = this.courses.concat(...coursesList);
    console.log(this.courses);
    this.loadedTimetable.courses = this.courses;
  }

  restrictionInclusionList: string[] = [];

  generateRestrictions(data: CsvObject[]): void {
    let restrictionLists: string[] = this.loadedTimetable.restrictions.map((a: Restriction) => { return a.name });
    let lastRestrictionId: number = 0;

    for(let i = 0 ; i < this.loadedTimetable.restrictions.length ; i++) {
      if(this.loadedTimetable.restrictions[i].id >= lastRestrictionId) lastRestrictionId = this.loadedTimetable.restrictions[i].id + 1;
    }

    let addedRestrictions: number = 0;

    for(let i = 0 ; i < this.restrictionInclusionList.length ; i++) {


      if(!restrictionLists.includes(this.restrictionInclusionList[i])) {
        // this is a new one, get all the options
        let optionsSet = Array.from(new Set(data.map(a => { return a[this.restrictionInclusionList[i]] }))).map((a: string, i: number) => { return { id: i, value: a}});

        let newRestriction: Restriction = {
          id: lastRestrictionId + addedRestrictions, name: this.restrictionInclusionList[i], description: '', optionsAreClasses: false, options: optionsSet, priority: 0
        }

        addedRestrictions++;
        this.loadedTimetable.restrictions.push(newRestriction);
      }
    }
  }

  getStudentRestrictionDataValues(data: CsvObject): DataValues[] {
    let restrictionData: DataValues[] = [];

    for(let i = 0 ; i < this.loadedTimetable.restrictions.length ; i++) {
      let restriction: Restriction = this.loadedTimetable.restrictions[i];
      let studentData: string = data[restriction.name];
      restrictionData.push({ restrictionId: restriction.id, value: restriction.options.find((a: { id: number, value: string }) => a.value === studentData )!.id });
    }

    return restrictionData;
  }


}
