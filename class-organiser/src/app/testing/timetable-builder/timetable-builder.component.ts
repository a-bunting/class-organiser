import { Component, OnInit } from '@angular/core';
import { DataValues, Restriction, SingleBlock, SingleClass, SingleCourse, SingleStudent, SingleTimeBlock, Timetable, TimetableService } from 'src/app/services/timetable.service';

@Component({
  selector: 'app-timetable-builder',
  templateUrl: './timetable-builder.component.html',
  styleUrls: ['./timetable-builder.component.scss']
})
export class TimetableBuilderComponent implements OnInit {

  timeTable: Timetable = {
    id: 0,
    name: "Test Timetable",
    classes: [],
    courses: [],
    schedule: { blocks: [] },
    students: [],
    restrictions: [
      { id: 0, name: "Gender", optionsAreClasses: false, description: "Do you identify as Male, Female or Other?", options: [ { id: 0, value: "Male" }, { id: 1, value: "Female" }, { id: 2, value: "Other" }, ]},
      { id: 1, name: "First Priority", optionsAreClasses: true, description: "Which class is the one you want to do the most?", options: [ { id: 0, value: "Table Tennis" }, { id: 1, value: "Squash" }, { id: 2, value: "Badminton" } ]},
      { id: 2, name: "Second Priority", optionsAreClasses: true, description: "Which class is the one you want to do the secondmost?", options: [ { id: 0, value: "Table Tennis" }, { id: 1, value: "Squash" }, { id: 2, value: "Badminton" } ]},
      { id: 3, name: "Third Priority", optionsAreClasses: true, description: "Which class is the one you want to do the least?", options: [ { id: 0, value: "Table Tennis" }, { id: 1, value: "Squash" }, { id: 2, value: "Badminton" } ]},
      { id: 4, name: "Fasting", optionsAreClasses: false, description: "During Ramadan do you fast?", options: [ { id: 0, value: "Yes, I fast" }, { id: 1, value: "No, I do not fast" }]},
      { id: 5, name: "Single Sex Swimming", optionsAreClasses: false, description: "Do you require single sex swimming?", options: [ { id: 0, value: "Yes, I require single sex swimming" }, { id: 1, value: "No, I do not require single sex swimming" }]}
    ]
  }

  constructor(
    private timetableService: TimetableService
  ) {}

  ngOnInit(): void {
      this.setNumberOfTimeBlocks(null, 8);
      this.changeClassNumber(null, 4);
  }



  /**
   * schedule
   */
  setNumberOfTimeBlocks(input: any, val?: number): void {
    let value: number = input ? +input.target.value : val ?  val : 1;
    let diff: number = value - this.timeTable.schedule.blocks.length;

    if(diff === 0) return;

    if(diff > 0) {
      for(let i = 0 ; i < diff ; i++) {
        let newBlock: SingleTimeBlock = {
          name: `Block ${i+1}`,
          teachers: [],
          order: i,
          blocks: this.generateBlocks()
        }

        this.timeTable.schedule.blocks.push(newBlock);
      }
    } else {
      this.timeTable.schedule.blocks.slice(0, diff);
    }

  }

  generateBlocks(): SingleBlock[] {
    let blocks: SingleBlock[] = [];

    // number of blocks per time section is equal to the number of classes running
    for(let i = 0 ; i < this.timeTable.classes.length ; i++) {
      let singleBlock: SingleBlock = {
        id: i, name: `Section ${i+1}`, classId: this.timeTable.classes[i].id, maxStudents: 25, classOnly: false, courses: [], room: this.timeTable.classes[i].room, students: [], restrictions: []
      }

      blocks.push(singleBlock);
    }

    return blocks;
  }

  /**
   * restrcitions
   */
  addNewRestriction(): void {
    let newRestriction: Restriction = { id: this.timeTable.restrictions.length, name: "", optionsAreClasses: true, description: "", options: [] };
    this.timeTable.restrictions.push(newRestriction);
  }

  deleteRestriction(index: number): void {
    this.timeTable.restrictions.splice(index, 1);
  }

  addOption(restrictionIndex: number): void {
    this.timeTable.restrictions[restrictionIndex].options.push({ id: this.timeTable.restrictions[restrictionIndex].options.length, value: "" });
  }

  deleteOption(restrictionIndex: number, optionIndex: number): void {
    this.timeTable.restrictions[restrictionIndex].options.splice(optionIndex, 1);
  }


  changeClassNumber(input: any, val?: number): void {
    let value: number = input ? +input.target.value : val ? val : 4;
    let diff: number = value - this.timeTable.classes.length;

    if(diff === 0) return;

    if(diff > 0) {
      for(let i = 0 ; i < diff ; i++) {
        let newSingleClass: SingleClass = { id: i, teacher: this.generateRandomNameString(), room: this.generateRandomRoom() }
        this.timeTable.classes.push(newSingleClass);
        // populate with students
        this.selectClassSize(null, this.timeTable.classes.length - 1, 15 + Math.floor(Math.random() * 10))
      }
    } else {
      this.timeTable.classes = this.timeTable.classes.slice(0, diff);
    }
  }

  selectClassSize(input: any, index: number, val?: number): void {
    let value: number = input ? +input.target.value : val ? val : 1;
    // this.timeTable.classes[index].students = [];
    this.timeTable.students = [...this.timeTable.students.filter((a: SingleStudent) => +a.classId !== +index)];

    for(let i = 0 ; i < value ; i++) {
      let newStudent: SingleStudent = {
        id: i, classId: index, name:this.generateRandomName(), data: []
      }
      // this.timeTable.classes[index].students.push(newStudent);
      this.timeTable.students.push(newStudent);
    }
  }

  setTimeBlockOrder(input: any, index: number): void {
    let value: number = +input.target.value;
    this.timeTable.schedule.blocks[index].order = value;

    console.log(`Setting ${this.timeTable.schedule.blocks[index].name} to order ${value}`);

    this.timeTable.schedule.blocks.sort((a: SingleTimeBlock, b: SingleTimeBlock) => a.order - b.order);
  }

  // just makes sure all the ids are unique.
  reorderIds(): void {
    // let currentStudentId: number = 0;
    let currentBlockCount: number = 0;

    // make sure the ids are all unique
    // for(let i = 0 ; i < this.timeTable.classes.length ; i++) {
    //   let cClass: SingleClass = this.timeTable.classes[i];
    //   cClass.id = i;

    //   for(let o = 0 ; o < cClass.students.length ; o++) {
    //     cClass.students[o].id = currentStudentId;
    //     currentStudentId++;
    //   }
    // }
    for(let i = 0 ; i < this.timeTable.students.length ; i++) {
      this.timeTable.students[i].id = i;
    }

    // sort by order.
    this.timeTable.schedule.blocks.sort((a: SingleTimeBlock, b: SingleTimeBlock) => a.order - b.order);

    // schedule
    for(let i = 0 ; i < this.timeTable.schedule.blocks.length ; i++) {
      let block: SingleTimeBlock = this.timeTable.schedule.blocks[i];

      for(let o = 0 ; o < block.blocks.length ; o++) {
        block.blocks[o].id = currentBlockCount;
        currentBlockCount++;
      }
    }

    // restrictions
    for(let i = 0 ; i < this.timeTable.restrictions.length ; i++) {
      let restriction: Restriction = this.timeTable.restrictions[i];
      restriction.id = i;

      for(let o = 0 ; o < restriction.options.length ; o++) {
        restriction.options[o].id = o;
      }
    }
  }

  processRestrictions(): void {
    this.reorderIds();

    // for(let i = 0 ; i < this.timeTable.classes.length ; i++) {
    //   let cClass: SingleClass = this.timeTable.classes[i];

    //   for(let o = 0 ; o < cClass.students.length ; o++) {
    //     let student: SingleStudent = cClass.students[o];

    //     // now iterate over all the restrictions and add random values for each to all students.
    //     for(let r = 0 ; r < this.timeTable.restrictions.length ; r++) {
    //       let restriction: Restriction = this.timeTable.restrictions[r];
    //       let newValue: DataValues = { restrictionId: restriction.id, value: restriction.options[Math.floor(Math.random() * restriction.options.length)].id }
    //       student.data.push(newValue);
    //     }
    //   }
    // }

    for(let i = 0 ; i < this.timeTable.students.length ; i++) {
      let student: SingleStudent = this.timeTable.students[i];

      // now iterate over all the restrictions and add random values for each to all students.
      for(let r = 0 ; r < this.timeTable.restrictions.length ; r++) {
        let restriction: Restriction = this.timeTable.restrictions[r];
        let newValue: DataValues = { restrictionId: restriction.id, value: restriction.options[Math.floor(Math.random() * restriction.options.length)].id }
        student.data.push(newValue);
      }
    }
  }

  addBlocksToTimeBlocks(): void {
    // each time block has a nujmber of blocks equal to the number of classes
    let blockCount: number = 0;

    for(let i = 0 ; i < this.timeTable.schedule.blocks.length ; i++) {
      this.timeTable.schedule.blocks[i].blocks = [];
      let block: SingleTimeBlock = this.timeTable.schedule.blocks[i];

      for(let o = 0 ; o < this.timeTable.classes.length ; o++) {
        let cClass: SingleClass = this.timeTable.classes[o];
        let newSingleBlock: SingleBlock = {
          id: blockCount, name: `Section ${blockCount + 1} with ${cClass.teacher}`, classOnly: false, maxStudents: 25, classId: cClass.id, courses: [], room: cClass.room, students: [], restrictions: []
        }
        blockCount++;
        block.blocks.push(newSingleBlock);
      }
    }
  }

  generateCoursesFromRestrictions(): void {
    let courses: string[] = [];

    for(let i = 0 ; i < this.timeTable.restrictions.length ; i++) {
      let restriction: Restriction = this.timeTable.restrictions[i];

      if(!restriction.optionsAreClasses) continue;

      for(let o = 0 ; o < restriction.options.length ; o++) {
        let newCourse: string = restriction.options[o].value;
        courses.push(newCourse);
      }
    }

    let uniqueCourses: Set<string> = new Set(courses);

    // now add to an array with proper ids:
    let newCourses: SingleCourse[] = Array.from(uniqueCourses).map((a: string, i: number) => { return { id: i, name: a, requirement: { required: true, times: 1 } }});
    this.timeTable.courses = newCourses;
  }

  save(): void {
    this.addBlocksToTimeBlocks();
    this.processRestrictions();
    this.generateCoursesFromRestrictions();

    console.log(this.timeTable);

    // now do the db to put in localhost
    this.timetableService.addTimeTable(this.timeTable);
  }

  generateRandomName(): { forename: string, surname: string } {
    let forenames: string[] = ["Stanley", "Evelyn", "Leia", "Luke", "Anakin", "Ahsoka", "Han", "Chewwie", "Boba", "Jean Luc", "Seven", "Katherine", "Johnathan", "Chris", "James", "Din", "Miya", "Olive", "Sansa", "Jackie", "Prim", "Katniss", "Bella"];
    let surnames: string[] = ["Kubrick", "Lawrence", "Organa", "Skywalker", "Tako", "Solo", "Bacca", "Fett", "Picard", "Worf", "Of Nine", "Janeway", "Potter", "Weasley", "Granger", "Chang", "Archer", "Pine", "Djarin", "Bunting", "Oyl", "Stark", "Kelso", "Everden", "Swan"];

    return { forename: forenames[Math.floor(Math.random() * forenames.length)], surname: surnames[Math.floor(Math.random() * surnames.length)]}
  }

  generateRandomNameString(): string {
    let name: { forename: string, surname: string } = this.generateRandomName();
    return `${name.forename} ${name.surname}`;
  }

  generateRandomRoom(): string {
    let pre: string[] = ["HS", "MS"];
    let place: string[] = ["Gym", "Pool", "AuxGym", "Wall", "Field"];

    return `${pre[Math.floor(Math.random() * pre.length)]} ${place[Math.floor(Math.random() * place.length)]}`;
  }

  getClassSize(classId: number): number {
    return this.timeTable.students.filter((a: SingleStudent) => a.classId === classId).length;
  }

}