import { Component, OnInit, provideZoneChangeDetection } from '@angular/core';
import { NumberValueAccessor } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService, User } from 'src/app/services/authentication.service';
import { DatabaseService } from 'src/app/services/database.service';
import { DataValues, Restriction, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';

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

  generateRandomData(input: any): void {
    let selection: number = +input.target.value;
    if(selection === 0) this.generateStudentsData(0, 100, true);
    if(selection === 1) this.generateStudentsData(1, 90);
    if(selection === 2) this.generateStudentsData(1, 21, false);
  }

  generateStudentsData(sortMethod: number, studentCount: number, genderTest: boolean = true): void {
    let forenamesMale = ['Albus','Harry','Ron','Fred','George','Neville','Finneus','Sirius','Remus','Lord','Arthur','Charlie','Bill','Rubeus','Severus'];
    let forenamesFemale = ['HERMIONE','MOLLY','FLEUR','MINERVA','GINNY','CHO','LAVENDER','PARVATI','PADMA','LILLY','LUNA','BELLATRIX','NARCISSA','NYMPHADORA','RITA'];
    let surnames = ['Dumbledore','McGonagall','Weasley','Longbottom','Sprout','Flitwick','Black','Lupin','Voldemort','Delacour','Tonks','Moody','Shacklebolt','Lovegood','Malfoy','Hagrid'];

    let courses: { courseId: number, priority: number }[] = [...this.loadedTimetable.courses.filter((a: SingleCourse) => !a.requirement.required ).map((a: SingleCourse, i: number) => { return { courseId: a.id, priority: i + 1 }}), ...this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === true ).map((a: SingleCourse) => { return { courseId: a.id, priority: 0 } })];
    let students: { studentId: number, priority: number }[] = this.loadedTimetable.sortMethod === 1 ? [...new Array(this.loadedTimetable.studentPriorityCount).fill(0).map((a: number, i: number) => { return { studentId: -1, priority: i + 1 }})] : [];

    let genderReestriction: Restriction = {
      id: 0,
      options: [ {id: 0, value: 'Male'}, {id: 1, value: 'Female'} ],
      name: 'Gender',
      description: 'This is the gender of the student, useful for rooming situations',
      poll: true
    }

    for(let i = 0 ; i < studentCount ; i++) {

      let gender = Math.floor(Math.random() * 2);
      let forename = gender === 0 ? forenamesMale[Math.floor(Math.random() * forenamesMale.length)] : forenamesFemale[Math.floor(Math.random() * forenamesFemale.length)].toUpperCase();
      let surname = surnames[Math.floor(Math.random() * surnames.length)];

      let newStudent: SingleStudent = {
        id: i, classId: -1,
        name: { forename: forename, surname: surname },
        email: `${forename}.${surname}@hogwarts.com`,
        data: [{ restrictionId: 0, value: gender }],
        coursePriorities: [],
        studentPriorities: []
      }

      this.loadedTimetable.students.push(newStudent);
    }

    // is gender likely a thing to concern ourselves with?
    this.loadedTimetable.restrictions = genderTest ? [genderReestriction] : [];

    if(sortMethod === 0) this.generateRandomDataForCoursePriority();
    if(sortMethod === 1) this.generateRandomDataForStudentPriority(genderTest);

  }

  generateRandomDataForStudentPriority(genderTest: boolean): void {
    for(let i = 0 ; i < this.loadedTimetable.students.length ; i++) {
      let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === i )!;
      let gender: number = genderTest ? +student.data[0].value : -1;
      let others: SingleStudent[] = this.loadedTimetable.students.filter((a: SingleStudent) => (gender === -1 || a.data[0].value === gender) && a.id !== i );

      for(let m = 0 ; m < this.loadedTimetable.studentPriorityCount ; m++) {
        if(others.length <= 1) {
          student.studentPriorities.push({ studentId: -1, priority: m + 1 });
        } else {
          let random: SingleStudent = others.sort((a: SingleStudent, b:SingleStudent) => Math.random() -0.5 )[0];
          student.studentPriorities.push({ studentId: random.id, priority: m + 1 });
          others = others.filter((a: SingleStudent) => a.id !== random.id);
        }
      }
    }
  }

  generateRandomDataForCoursePriority(): void {
    // create a course if none exist
    if(this.loadedTimetable.courses.length == 0) {
      this.loadedTimetable.courses.push({
        id: 0,
        name: 'test course',
        classSize: 25,
        requirement: { required: false, times: 1 }
      })
    }

    for(let i = 0 ; i < this.loadedTimetable.students.length ; i++) {
      let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === i )!;
      let optionalCourses: SingleCourse[] = this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === false);
      let numberOfOptionalCourses: number = optionalCourses.length;

      for(let m = 0 ; m < numberOfOptionalCourses ; m++) {
        let random: SingleCourse = optionalCourses.sort((a: SingleCourse, b: SingleCourse) => Math.random() - 0.5)[0];
        student.coursePriorities.push({ courseId: random.id, priority: m + 1 });
        optionalCourses = optionalCourses.filter((a: SingleCourse) => a.id !== random.id );
      }
    }
  }

  ngOnInit(): void {
    // subscribe to users and check if the user is logged in
    this.authService.user.subscribe({
      next: (user: User) => {
        if(user) { this.user = user; return }
        // not logged in
        this.router.navigate(['']);
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
    let studentData: number = student.coursePriorities!.find((a: { courseId: number, priority: number }) => a.priority === priority)!.courseId;
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
      let aD: number = a.coursePriorities!.find((c: { courseId: number, priority: number }) => c.priority === priority)!.courseId;
      let bD: number = b.coursePriorities!.find((c: { courseId: number, priority: number }) => c.priority === priority)!.courseId;
      if(this.asc) return aD - bD;
      else return bD - aD;
    })

    this.asc = !this.asc;
  }

  sortByStudentPriority(priority: number): void {
    this.loadedTimetable.students.sort((a: SingleStudent, b: SingleStudent) => {
      let aD: number = a.studentPriorities!.find((c: { studentId: number, priority: number }) => c.priority === priority)!.studentId;
      let bD: number = b.studentPriorities!.find((c: { studentId: number, priority: number }) => c.priority === priority)!.studentId;
      if(this.asc) return aD - bD;
      else return bD - aD;
    })

    this.asc = !this.asc;
  }

  deleteStudent(studentId: number): void {
    this.loadedTimetable.students = this.loadedTimetable.students.filter((a: SingleStudent) => a.id !== studentId);

    // remove them from all blocks in the timetable
    for(let i = 0 ; i < this.loadedTimetable.schedule.blocks.length ; i++) {
     let timeBlock: SingleTimeBlock = this.loadedTimetable.schedule.blocks[i];

     timeBlock.missingStudents = timeBlock.missingStudents.filter((a: number) => a !== studentId);

      for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
        timeBlock.blocks[o].students = timeBlock.blocks[o].students.filter((a: number) => a !== studentId);
      }
    }

    this.timetableService.setupStudentDeletion(studentId);
  }

  newStudent: SingleStudent = null!;
  lockNewStudent: boolean = false;

  addStudentToggle(): void {

    // get the first unused id in the series:
    let id: number = 0;

    while(this.loadedTimetable.students.find((a: SingleStudent) => a.id === id)) {
      id++;
    }

    let courses: { courseId: number, priority: number }[] = [...this.loadedTimetable.courses.filter((a: SingleCourse) => !a.requirement.required ).map((a: SingleCourse, i: number) => { return { courseId: a.id, priority: i + 1 }}), ...this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === true ).map((a: SingleCourse) => { return { courseId: a.id, priority: 0 } })];
    let students: { studentId: number, priority: number }[] = this.loadedTimetable.sortMethod === 1 ? [...new Array(this.loadedTimetable.studentPriorityCount).fill(0).map((a: number, i: number) => { return { studentId: -1, priority: i + 1 }})] : [];

    let newStudent: SingleStudent = {
      id,
      name: { forename: '', surname: '' },
      classId: 0,
      data: [...this.loadedTimetable.restrictions.map((a: Restriction) => { return { restrictionId: a.id, value: a.options[0].id }})],
      coursePriorities: courses,
      studentPriorities: students
    }

    this.newStudent = newStudent;
  }

  getRandomStudentId(): number {
    const random: number = Math.floor(Math.random() * this.loadedTimetable.students.length);
    return random;
  }

  submitNewStudent(): void {
    this.loadedTimetable.students.push({ ...this.newStudent });
    this.newStudent = null!;
  }

  deleteNewStudent(): void {
    this.newStudent = null!;
  }

  changeCoursePriority(student: SingleStudent, destinationPriority: number, input: any): void {
    let changeToCourseId: number = +input.target.value;
    let currentPriorityOfChangingCourse: { courseId: number, priority: number } = student.coursePriorities!.find((a: { courseId: number, priority: number }) => changeToCourseId === a.courseId)!;

    let between: [number, number] = [currentPriorityOfChangingCourse.priority, destinationPriority];

    if(between[0] > between[1]) {
      // its getting a higher priority
      let filtered = student.coursePriorities!.filter((a: { courseId: number, priority: number }) => +a.priority >= between[1] && +a.priority < between[0] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority++ );
    }

    if(between[1] > between[0]) {
      // its getting a lower priority
      let filtered = student.coursePriorities!.filter((a: { courseId: number, priority: number }) => +a.priority > between[0] && +a.priority <= between[1] )
      filtered.map((a: { courseId: number, priority: number }) => a.priority-- );
    }

    let course = student.coursePriorities!.find((a: { courseId: number, priority: number }) => a.courseId === changeToCourseId)!;
    course.priority = destinationPriority;
    //this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  changeStudentPriority(student: SingleStudent, priority: number, input: any): void {
    let curPrio: { studentId: number, priority: number } = student.studentPriorities.find((a: { studentId: number, priority: number }) => a.priority === priority)!;
    if(curPrio) { curPrio.studentId = +input.target.value; }
  }

  modifyDataValue(student: SingleStudent, restrictionId: number, input: any): void {
    let dataValue: DataValues = student.data.find((a: DataValues) => a.restrictionId === restrictionId)!;
    let newValue: number = +input.target.value;
    dataValue.value = newValue;
    //this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  modifyClassTeacher(studentId: number, input: any): void {
    let student: SingleStudent = this.loadedTimetable.students.find((a: SingleStudent) => a.id === studentId)!;
    student.classId = +input.target.value;
    //this.timetableService.updateSavedTimetable(this.loadedTimetable);
  }

  content: string = '';
  addTsvData: boolean = false;
  tsvError: string[] = [];

  toggleTsvData(): void { this.addTsvData  = !this.addTsvData };

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.tsvError = [];
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
      this.parseTsvString(contents);
    };
    reader.readAsText(file);
  }

  // thanks chatgpt!
  parseTsvString(csvData: string): void {

    const rows = csvData.trim().split('\n');
    const headers = rows[0].split('\t').map(header => header.trim());

    if(headers[0].toLowerCase() !== "forename" || headers[1].toLowerCase() !== 'surname' || headers[2].toLowerCase() !== 'email') {
      this.tsvError.push(`Your TSV file is incorrectly formatted. You must have three columns only: forename, surname and email.`);
      return;
    }

    const results: CsvObject[] = [];
    let students: SingleStudent[] = [];
    let exclusions: string[] = ['','timestamp'];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split('\t').map(value => value.trim());
      const entry: CsvObject = {};

      for (let j = 0; j < headers.length; j++) {
        // exclude particlar columns
        if(exclusions.includes(headers[j].toLowerCase())) continue;
        // add if its proper to
        entry[headers[j].toLowerCase().trim()] = values[j];

        // build an exclusion list to filter for the restrictions;
        if(isNaN(+headers[j].toLowerCase()) && !['email', 'forename', 'surname', 'teacher'].includes(headers[j].toLowerCase()) && !this.restrictionInclusionList.includes(headers[j].toLowerCase())) {
          this.restrictionInclusionList.push(headers[j].toLowerCase());
        }
      }

      results.push(entry);
    }

    // build the data needed to make a student list
    this.generateRestrictions(results);
    let studentPrios: { studentId: number, priority: number }[] = this.loadedTimetable.sortMethod === 1 ? new Array(this.loadedTimetable.studentPriorityCount).fill(0).map((a: number, i: number) => { return { studentId: -1, priority: i + 1 }}) : [];
    let courses: { courseId: number, priority: number }[] = [...this.loadedTimetable.courses.filter((a: SingleCourse) => !a.requirement.required ).map((a: SingleCourse, i: number) => { return { courseId: a.id, priority: i + 1 }}), ...this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === true ).map((a: SingleCourse) => { return { courseId: a.id, priority: 0 } })];

    students = results.map((a: CsvObject, i: number) => {
      return {
        id: i, classId: -1,
        name: { forename: a['forename'], surname: a['surname'] },
        email: a['email'],
        data: this.getStudentRestrictionDataValues(a),
        coursePriorities: [...courses],
        studentPriorities: [...studentPrios]
      }
    })

    this.loadedTimetable.students = students;
  }

  // classes: SingleClass[] = [];
  // courses: SingleCourse[] = [];

  // generateClasses(data: CsvObject[]): void {
  //   let teachers = Array.from(new Set(data.map(a => { return a['teacher'] }))).concat(this.loadedTimetable.classes.map((a: SingleClass) => { return a.teacher }));
  //   let classesLastId: number = 0;

  //   if(!teachers) return;

  //   for(let i = 0 ; i < this.loadedTimetable.classes.length ; i++) {
  //     if(this.loadedTimetable.classes[i].id >= classesLastId) classesLastId = this.loadedTimetable.classes[i].id + 1;
  //   }

  //   // makes a list of classes with all teachers, including new ones.
  //   for(let i = 0 ; i < teachers.length ; i++) {
  //     this.classes.push({ teacher: teachers[i], id: classesLastId + i });
  //   }

  //   console.log(this.classes);
  //   this.loadedTimetable.classes = this.classes;
  // }

  // getClassId(teacherName: string): number {
  //   return this.classes.find(a => a.teacher === teacherName)!.id;
  // }

  // getCourseId(name: string): number {
  //   let courseIdIndex: number = this.courses.findIndex(a => a.name === name);

  //   if(courseIdIndex !== -1) {
  //     return this.courses[courseIdIndex].id;
  //   } else {
  //     return NaN;
  //   }
  // }

  // getCoursePriorities(a: CsvObject): { priority: number, courseId: number }[] {
  //   let coursePriorities: { priority: number, courseId: number }[] = [];

  //   for(let i = 0 ; i < 16 ; i++) {
  //     if(!isNaN(this.getCourseId(a[`${i}`]))) coursePriorities.push({ priority: i, courseId: this.getCourseId(a[`${i}`])})
  //   }

  //   // add in the required things.
  //   const requiredCourses: SingleCourse[] = this.loadedTimetable.courses.filter((a: SingleCourse) => a.requirement.required === true );

  //   for(let i = 0 ; i < requiredCourses.length ; i++) {
  //     coursePriorities.push({ priority: 0, courseId: this.getCourseId(requiredCourses[i].name)})
  //   }

  //   return coursePriorities;
  // }

  // generateCourses(data: CsvObject[]): void {
  //   let dataSet = data[0];
  //   let coursesList: SingleCourse[] = this.loadedTimetable.courses;
  //   let courses: string[] = this.loadedTimetable.courses.map((a: SingleCourse) => a.name );
  //   let lastId: number = 0;
  //   let newCourses: number = 0;

  //   for(let i = 0 ; i < coursesList.length ; i++) {
  //     if(coursesList[i].id >= lastId) lastId = coursesList[i].id + 1;
  //   }

  //   // ifnd new courses and add them
  //   for(let i = 0 ; i < 16 ; i++) {
  //     if(!courses.includes(dataSet[`${i+1}`])) {
  //       // this is new
  //       coursesList.push({ id: lastId + newCourses, name: dataSet[`${i+1}`], classSize: 24, requirement: { required: false, times: 1 } });
  //       courses.push(dataSet[`${i}`]);
  //       newCourses++;
  //     }
  //   }


  //   this.courses = this.courses.concat(...coursesList);
  //   console.log(this.courses);
  //   this.loadedTimetable.courses = this.courses;
  // }

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
          id: lastRestrictionId + addedRestrictions, name: this.restrictionInclusionList[i], description: '', poll: true, options: optionsSet
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

  getStudentPriorityList(number: number): number[] {
    return new Array(number);
  }

  // returns the student id of prioirty X for this student
  getStudentStudentPriorityData(student: SingleStudent, priority: number): number {
    let prio: { studentId: number, priority: number } = student.studentPriorities.find((a: { studentId: number, priority: number }) => a.priority === priority )!;
    return prio.studentId;
  }

  alreadySelected(student: SingleStudent, studentIdToCheck: number): boolean {
    return !!student.studentPriorities.find((a: { studentId: number, priority: number }) => a.studentId === studentIdToCheck);
  }

}
