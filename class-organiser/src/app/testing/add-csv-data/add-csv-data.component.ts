import { Component } from '@angular/core';
import { SingleStudent, SingleCourse, SingleTimeBlock, SingleBlock, Restriction, DataValues } from 'src/app/services/timetable.service';
import { TimetableService, Timetable } from 'src/app/services/timetable.service';

interface CsvObject {
  [key: string]: string;
}

@Component({
  selector: 'app-add-csv-data',
  templateUrl: './add-csv-data.component.html',
  styleUrls: ['./add-csv-data.component.scss']
})
export class AddCsvDataComponent {

  constructor(
    private timetableService: TimetableService
  ) {}

  data: CsvObject[] = [];

  // thanks chatgpt!
  parseCsvString(): void {
    let csvData = (document.getElementById('csvData') as HTMLTextAreaElement).value;

    const rows = csvData.trim().split('\n');
    const headers = rows[0].split(',');

    const results: CsvObject[] = [];

    for (let i = 1; i < rows.length; i++) {
      const values = rows[i].split(',');
      const entry: CsvObject = {};

      for (let j = 0; j < headers.length; j++) {
        entry[headers[j]] = values[j];
      }

      results.push(entry);
    }

    this.generateClasses(results);
    this.generateCourses(results);

    console.log(results);

    this.students = results.map((a, i) => { return {
      id: i,
      classId: this.getClassId(a['Teacher']),
      name: { forename: a['Name'].split(' ')[0], surname: a['Name'].split(' ')[1] },
      data: [
        { restrictionId: 0, value: a['Girl'] === "x" ? 1 : 0 },
        { restrictionId: 1, value: a['Fasting'] === "x" ? 0 : 1 },
        { restrictionId: 2, value: a['Girls'] === "x" ? 0 : 1 }
      ],
      coursePriorities: [
        { priority: 1, courseId: this.getCourseId(a['one']) },
        { priority: 2, courseId: this.getCourseId(a['two']) },
        { priority: 3, courseId: this.getCourseId(a['three']) },
        { priority: 4, courseId: this.getCourseId(a['four']) },
        { priority: 5, courseId: this.getCourseId(a['five']) },
        { priority: 6, courseId: this.getCourseId(a['six']) },
        { priority: 7, courseId: this.getCourseId(a['seven']) },
        { priority: 0, courseId: 7 }
      ]
    }})

    console.log(this.students, this.courses, this.classes);

    this.saveTimetable();
  }

  classes: { teacher: string, id: number, room: string }[] = [];
  students: SingleStudent[] = [];
  courses: SingleCourse[] = [];

  getCourseId(name: string): number {
    return this.courses.find(a => a.name === name)!.id;
  }

  getClassId(teacherName: string): number {
    return this.classes.find(a => a.teacher === teacherName)!.id;
  }

  generateCourses(data: CsvObject[]): void {
    let dataSet = data[0];

    this.courses.push({ id: 0, name: dataSet['one'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 1, name: dataSet['two'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 2, name: dataSet['three'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 3, name: dataSet['four'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 4, name: dataSet['five'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 5, name: dataSet['six'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 6, name: dataSet['seven'], classSize: 25, requirement: { required: false, times: 1 }});
    this.courses.push({ id: 7, name: 'Swimming', classSize: 25, requirement: { required: true, times: 1 }});
  }

  generateClasses(data: CsvObject[]): void {
    let teachers = Array.from(new Set(data.map(a => { return a['Teacher'] })));

    for(let i = 0 ; i < teachers.length ; i++) {
      this.classes.push({ teacher: teachers[i], id: i, room: ''});
    }
  }

  saveTimetable(): void {
    let newTimetable: Timetable = {
      id: 0,
      name: "Test block",
      classes: this.classes,
      courses: this.courses,
      students: this.students,
      restrictions: [
        { id: 0, name: "Gender",              optionsAreClasses: false, priority: 0, description: "Do you identify as Male, Female or Other?", options: [ { id: 0, value: "Male" }, { id: 1, value: "Female" }, { id: 2, value: "Other" }, ]},
        { id: 1, name: "Fasting",             optionsAreClasses: false, priority: 1, description: "During Ramadan do you fast?", options: [ { id: 0, value: "Yes, I fast" }, { id: 1, value: "No, I do not fast" }]},
        { id: 2, name: "Single Sex Swimming", optionsAreClasses: false, priority: 0, description: "Do you require single sex swimming?", options: [ { id: 0, value: "Yes, I require single sex swimming" }, { id: 1, value: "No, I do not require single sex swimming" }]}
      ],
      schedule: { blocks: [] }
    }

    // doi tyhe blocks
    for(let i = 0 ; i < 8 ; i++) {
      let newBlock: SingleTimeBlock = {
        name: `Block ${i+1}`,
        teachers: [],
        order: i,
        blocks: []
      }

      for(let o = 0 ; o < this.classes.length ; o++) {
        let singleBlock: SingleBlock = {
          id: i * this.classes.length + o, name: `Section ${i * this.classes.length + o}`, classId: this.classes[o].id, maxStudents: 25, classOnly: false, courses: [], room: this.classes[o].room, students: [], restrictions: []
        }

        newBlock.blocks.push(singleBlock);
      }

      newTimetable.schedule.blocks.push(newBlock);
    }

    this.timetableService.addTimeTable(newTimetable);
  }

  newData: string = `
  Timestamp,Email Address,Name,Girl,Girls,Fasting,Teacher,one,two,three,four,five,six,seven
9/19/2023 12:30:16,28acurrie@asd.edu.qa,Aisha Currie,x,,,Mr. Anand,Mindful Movement,Combatives,Striking (T-ball Softball),Invasion,Nets (Volleyball),Fitness Bootcamp,Track & Field
9/19/2023 12:30:11,28abutt@asd.edu.qa,Areeba Butt,x,x,,Mr. Anand,Mindful Movement,Combatives,Striking (T-ball Softball),Invasion,Nets (Volleyball),Fitness Bootcamp,Track & Field
9/19/2023 12:31:34,28aelsakaan@asd.edu.qa,Asser Elsakaan,,,x,Mr. Anand,Invasion,Track & Field,Nets (Volleyball),Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 12:30:29,28achaturvedi@asd.edu.qa,Atharv Chaturvedi,,,,Mr. Anand,Nets (Volleyball),Striking (T-ball Softball),Invasion,Track & Field,Combatives,Fitness Bootcamp,Mindful Movement
9/19/2023 12:32:03,28amoore@asd.edu.qa,Autumn Moore,x,x,,Mr. Anand,Nets (Volleyball),Invasion,Mindful Movement,Combatives,Track & Field,Striking (T-ball Softball),Fitness Bootcamp
9/19/2023 12:32:21,28edhalluin@asd.edu.qa,Emilie Dhalluin,x,,,Mr. Anand,Nets (Volleyball),Combatives,Invasion,Mindful Movement,Striking (T-ball Softball),Fitness Bootcamp,Track & Field
9/19/2023 12:30:44,28ghowell@asd.edu.qa,Gabe Howell,,,,Mr. Anand,Nets (Volleyball),Combatives,Fitness Bootcamp,Striking (T-ball Softball),Track & Field,Invasion,Mindful Movement
9/19/2023 12:31:35,28hlughmani@asd.edu.qa,Haris Lughmani,,,,Mr. Anand,Nets (Volleyball),Invasion,Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement,Track & Field
9/19/2023 12:30:52,28jmugambwa@asd.edu.qa,Jason Mugambwa,,,,Mr. Anand,Nets (Volleyball),Combatives,Track & Field,Striking (T-ball Softball),Invasion,Fitness Bootcamp,Mindful Movement
9/19/2023 12:32:14,28jryu@asd.edu.qa,Jocelyn Ryu,x,,,Mr. Anand,Nets (Volleyball),Track & Field,Fitness Bootcamp,Invasion,Striking (T-ball Softball),Mindful Movement,Combatives
9/19/2023 12:31:23,28jcamargo@asd.edu.qa,Juan Camargo,,,,Mr. Anand,Invasion,Track & Field,Nets (Volleyball),Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 12:31:52,28ladas@asd.edu.qa,Lamar Adas,x,x,,Mr. Anand,Invasion,Nets (Volleyball),Striking (T-ball Softball),Track & Field,Combatives,Fitness Bootcamp,Mindful Movement
9/19/2023 12:32:02,28melgamiel@asd.edu.qa,Maryam Elgamiel,x,x,,Mr. Anand,Nets (Volleyball),Invasion,Mindful Movement,Striking (T-ball Softball),Track & Field,Combatives,Fitness Bootcamp
9/19/2023 12:31:25,28nmolina@asd.edu.qa,Natalia Molina Luna,x,,,Mr. Anand,Invasion,Fitness Bootcamp,Combatives,Striking (T-ball Softball),Mindful Movement,Nets (Volleyball),Track & Field
9/19/2023 12:30:47,28nchen@asd.edu.qa,Nathaniel Chen,,,,Mr. Anand,Nets (Volleyball),Combatives,Track & Field,Striking (T-ball Softball),Invasion,Fitness Bootcamp,Mindful Movement
9/19/2023 12:30:59,28ngururani@asd.edu.qa,Neehar Gururani,x,,,Mr. Anand,Nets (Volleyball),Combatives,Striking (T-ball Softball),Invasion,Track & Field,Fitness Bootcamp,Mindful Movement
9/19/2023 12:33:37,28rrouhana@asd.edu.qa,Raphael Rouhana,,,,Mr. Anand,Nets (Volleyball),Combatives,Fitness Bootcamp,Track & Field,Invasion,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:31:11,28rhakkim@asd.edu.qa,Ryan Hakkim,,,,Mr. Anand,Combatives,Nets (Volleyball),Fitness Bootcamp,Mindful Movement,Track & Field,Invasion,Striking (T-ball Softball)
9/19/2023 12:31:09,28sakharma@asd.edu.qa,Saif Kharma,,,x,Mr. Anand,Nets (Volleyball),Invasion,Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement,Track & Field
9/19/2023 12:30:18,28srehman@asd.edu.qa,Saif Rehman,,,x,Mr. Anand,Invasion,Striking (T-ball Softball),Nets (Volleyball),Mindful Movement,Combatives,Track & Field,Fitness Bootcamp
9/19/2023 12:30:18,28sshrivastava@asd.edu.qa,Saksham Shrivastava,,,,Mr. Anand,Invasion,Striking (T-ball Softball),Nets (Volleyball),Mindful Movement,Combatives,Track & Field,Fitness Bootcamp
9/19/2023 12:32:11,28sdakkak@asd.edu.qa,Selma Dakkak,x,,,Mr. Anand,Striking (T-ball Softball),Nets (Volleyball),Mindful Movement,Invasion,Track & Field,Combatives,Fitness Bootcamp
9/19/2023 12:31:46,28yshtayyeh@asd.edu.qa,Yasmine Shtayyeh,x,x,,Mr. Anand,Fitness Bootcamp,Mindful Movement,Nets (Volleyball),Invasion,Striking (T-ball Softball),Track & Field,Combatives
9/19/2023 12:30:55,28ywali@asd.edu.qa,Yusuf Wali,,,x,Mr. Anand,Nets (Volleyball),Combatives,Track & Field,Striking (T-ball Softball),Invasion,Fitness Bootcamp,Mindful Movement
9/20/2023 14:36:36,28aaljaidah@asd.edu.qa,Abdulla Aljaidah,,,x,Mr. Bowyer,Invasion,Nets (Volleyball),Combatives,Striking (T-ball Softball),Mindful Movement,Track & Field,Fitness Bootcamp
9/21/2023 10:11:18,28aalkhater@asd.edu.qa,Abdullah Al Khater,,,x,Mr. Bowyer,Combatives,Track & Field,Nets (Volleyball),Invasion,Striking (T-ball Softball),Fitness Bootcamp,Mindful Movement
9/19/2023 15:53:00,28aledwon@asd.edu.qa,Aleksandra Ledwon,x,,,Mr. Bowyer,Combatives,Striking (T-ball Softball),Track & Field,Nets (Volleyball),Invasion,Fitness Bootcamp,Mindful Movement
9/20/2023 6:38:48,28amclawhon@asd.edu.qa,Ari McLawhon,,,,Mr. Bowyer,Striking (T-ball Softball),Track & Field,Invasion,Nets (Volleyball),Combatives,Fitness Bootcamp,Mindful Movement
9/19/2023 16:41:03,28cjeon@asd.edu.qa,Camilla Jeon,x,x,x,Mr. Bowyer,Invasion,Fitness Bootcamp,Mindful Movement,Combatives,Nets (Volleyball),Track & Field,Striking (T-ball Softball)
9/21/2023 10:16:39,28fshatat@asd.edu.qa,Fahmi Shatat,,,x,Mr. Bowyer,Nets (Volleyball),Track & Field,Fitness Bootcamp,Striking (T-ball Softball),Invasion,Combatives,Mindful Movement
9/20/2023 13:45:20,28halremithi@asd.edu.qa,Hamad Alremithi,,,x,Mr. Bowyer,Invasion,Combatives,Striking (T-ball Softball),Nets (Volleyball),Fitness Bootcamp,Mindful Movement,Track & Field
9/20/2023 10:17:59,28halthani@asd.edu.qa,Hessa Althani,x,x,x,Mr. Bowyer,Nets (Volleyball),Combatives,Invasion,Mindful Movement,Track & Field,Fitness Bootcamp,Striking (T-ball Softball)
9/21/2023 10:16:24,28ibethenod@asd.edu.qa,Ignacio Bethenod,,,,Mr. Bowyer,Nets (Volleyball),Track & Field,Fitness Bootcamp,Striking (T-ball Softball),Invasion,Combatives,Mindful Movement
9/19/2023 18:37:14,28jkhatib@asd.edu.qa,Jenna Khatib,x,x,x,Mr. Bowyer,Nets (Volleyball),Track & Field,Invasion,Fitness Bootcamp,Mindful Movement,Combatives,Striking (T-ball Softball)
9/22/2023 15:34:36,28malnaddaf@asd.edu.qa,Marc AL Naddaf,,,x,Mr. Bowyer,Nets (Volleyball),Track & Field,Invasion,Fitness Bootcamp,Striking (T-ball Softball),Combatives,Mindful Movement
9/19/2023 18:49:48,28mdaher@asd.edu.qa,Mohamad Ali Daher,,,x,Mr. Bowyer,Track & Field,Invasion,Combatives,Striking (T-ball Softball),Nets (Volleyball),Fitness Bootcamp,Mindful Movement
9/20/2023 18:09:26,28nayoub@asd.edu.qa,Nada Ayoub,x,x,x,Mr. Bowyer,Fitness Bootcamp,Combatives,Striking (T-ball Softball),Nets (Volleyball),Invasion,Track & Field,Mindful Movement
9/23/2023 10:31:40,28nalkhulaifi@asd.edu.qa,Nasser Al Khulaifi,,,x,Mr. Bowyer,Invasion,Nets (Volleyball),Combatives,Striking (T-ball Softball),Mindful Movement,Track & Field,Fitness Bootcamp
9/20/2023 22:47:59,28nleigh@asd.edu.qa,Nathan Leigh,,,,Mr. Bowyer,Invasion,Track & Field,Fitness Bootcamp,Striking (T-ball Softball),Mindful Movement,Nets (Volleyball),Combatives
9/19/2023 15:53:34,28oalyafei@asd.edu.qa,Omar Al-Yafei,,,x,Mr. Bowyer,Invasion,Striking (T-ball Softball),Nets (Volleyball),Mindful Movement,Track & Field,Fitness Bootcamp,Combatives
9/19/2023 14:34:16,28rahmad@asd.edu.qa,Rania Ahmad,x,x,x,Mr. Bowyer,Invasion,Combatives,Nets (Volleyball),Striking (T-ball Softball),Mindful Movement,Track & Field,Fitness Bootcamp
9/19/2023 22:26:15,28skim@asd.edu.qa,Regina Kim,x,,,Mr. Bowyer,Nets (Volleyball),Invasion,Combatives,Fitness Bootcamp,Track & Field,Striking (T-ball Softball),Mindful Movement
9/19/2023 15:56:49,28sdarweesh@asd.edu.qa,Sarah Darwish,x,x,x,Mr. Bowyer,Nets (Volleyball),Invasion,Striking (T-ball Softball),Mindful Movement,Fitness Bootcamp,Track & Field,Combatives
9/19/2023 20:39:05,28sgupta@asd.edu.qa,Shreyas Gupta,x,,,Mr. Bowyer,Invasion,Nets (Volleyball),Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 18:07:25,28ssharief@asd.edu.qa,Sofia Sharief,x,x,x,Mr. Bowyer,Invasion,Combatives,Striking (T-ball Softball),Track & Field,Nets (Volleyball),Fitness Bootcamp,Mindful Movement
9/21/2023 10:15:34,28sshurtliff@asd.edu.qa,Syler Shurtliff,,,,Mr. Bowyer,Striking (T-ball Softball),Nets (Volleyball),Invasion,Mindful Movement,Fitness Bootcamp,Track & Field,Combatives
9/19/2023 22:27:16,28yalhassani@asd.edu.qa,Yosor Al-Hassani,x,x,x,Mr. Bowyer,Nets (Volleyball),Invasion,Combatives,Fitness Bootcamp,Track & Field,Striking (T-ball Softball),Mindful Movement
9/20/2023 17:05:30,28znahawi@asd.edu.qa,Zafer nahawi,,,x,Mr. Bowyer,Invasion,Nets (Volleyball),Combatives,Striking (T-ball Softball),Track & Field,Mindful Movement,Fitness Bootcamp
9/19/2023 12:46:39,28anazeer@asd.edu.qa,Aamna Nazeer,x,x,x,Mr. Howell,Track & Field,Invasion,Nets (Volleyball),Combatives,Fitness Bootcamp,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:43:19,28aabualsaud@asd.edu.qa,Ali Abualsaud,,,x,Mr. Howell,Invasion,Track & Field,Striking (T-ball Softball),Combatives,Nets (Volleyball),Mindful Movement,Fitness Bootcamp
9/19/2023 13:04:41,28bboulfrad@asd.edu.qa,Bilel Boulfrad,,,x,Mr. Howell,Combatives,Fitness Bootcamp,Track & Field,Nets (Volleyball),Invasion,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:43:05,28badrover@asd.edu.qa,Blanca Adrover Alvarez,,,,Mr. Howell,Invasion,Nets (Volleyball),Track & Field,Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 12:39:05,28calmy@asd.edu.qa,Carson Almy,,,,Mr. Howell,Nets (Volleyball),Combatives,Fitness Bootcamp,Invasion,Striking (T-ball Softball),Mindful Movement,Track & Field
9/19/2023 12:42:15,28dmalek@asd.edu.qa,Daniel Malek,,,,Mr. Howell,Nets (Volleyball),Fitness Bootcamp,Striking (T-ball Softball),Track & Field,Invasion,Combatives,Mindful Movement
9/20/2023 8:25:15,28rsolomon@asd.edu.qa,Dominic Solomon,,,,Mr. Howell,Invasion,Nets (Volleyball),Fitness Bootcamp,Combatives,Striking (T-ball Softball),Mindful Movement,Track & Field
9/19/2023 20:35:26,28ebercovici@asd.edu.qa,Emma Bercovici,x,,,Mr. Howell,Invasion,Track & Field,Striking (T-ball Softball),Nets (Volleyball),Combatives,Mindful Movement,Fitness Bootcamp
9/19/2023 12:43:35,28fhernandez@asd.edu.qa,Fabiana Hernandez,,,,Mr. Howell,Track & Field,Nets (Volleyball),Fitness Bootcamp,Invasion,Striking (T-ball Softball),Combatives,Mindful Movement
9/19/2023 12:38:54,28fhaddadeen@asd.edu.qa,Faris Haddadeen,x,,,Mr. Howell,Fitness Bootcamp,Nets (Volleyball),Combatives,Track & Field,Invasion,Striking (T-ball Softball),Mindful Movement
9/24/2023 8:02:25,28gcalfat@asd.edu.qa,Gabriel Calfat,,,,Mr. Howell,Invasion,Track & Field,Nets (Volleyball),Fitness Bootcamp,Combatives,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:39:10,28gsmith@asd.edu.qa,Gideon Smith,,,,Mr. Howell,Combatives,Striking (T-ball Softball),Nets (Volleyball),Invasion,Track & Field,Mindful Movement,Fitness Bootcamp
9/21/2023 10:27:59,28ksaifan@asd.edu.qa,Kristy Saifan,x,x,,Mr. Howell,Nets (Volleyball),Invasion,Fitness Bootcamp,Striking (T-ball Softball),Track & Field,Combatives,Mindful Movement
9/19/2023 12:39:21,28lyu@asd.edu.qa,Leonard Yu,,,,Mr. Howell,Nets (Volleyball),Combatives,Fitness Bootcamp,Invasion,Striking (T-ball Softball),Track & Field,Mindful Movement
9/19/2023 12:43:03,28ldinnie@asd.edu.qa,Lucia Dinnie,x,x,,Mr. Howell,Invasion,Nets (Volleyball),Track & Field,Fitness Bootcamp,Combatives,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:44:20,28mvallasciani@asd.edu.qa,Margherita Vallasciani,x,x,,Mr. Howell,Invasion,Nets (Volleyball),Mindful Movement,Combatives,Fitness Bootcamp,Striking (T-ball Softball),Track & Field
9/19/2023 15:21:43,28mchedid@asd.edu.qa,Michael Chedid,,,,Mr. Howell,Invasion,Track & Field,Nets (Volleyball),Striking (T-ball Softball),Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 12:53:14,28malkhulaifi@asd.edu.qa,Mohammed Al-Khulaifi,,,x,Mr. Howell,Invasion,Fitness Bootcamp,Combatives,Nets (Volleyball),Striking (T-ball Softball),Mindful Movement,Track & Field
9/19/2023 12:38:49,28malolan@asd.edu.qa,Mubarak Al Olan,,,x,Mr. Howell,Fitness Bootcamp,Nets (Volleyball),Combatives,Track & Field,Invasion,Striking (T-ball Softball),Mindful Movement
9/19/2023 12:38:43,28rjain@asd.edu.qa,Rhidam Jain,,,,Mr. Howell,Combatives,Invasion,Nets (Volleyball),Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Mindful Movement
9/19/2023 12:38:03,28sbawa@asd.edu.qa,Saab Bawa,x,x,x,Mr. Howell,Invasion,Striking (T-ball Softball),Combatives,Mindful Movement,Nets (Volleyball),Fitness Bootcamp,Track & Field
9/19/2023 13:04:40,28tbondarev@asd.edu.qa,Timothy Bondarev,,,,Mr. Howell,Nets (Volleyball),Fitness Bootcamp,Invasion,Striking (T-ball Softball),Track & Field,Combatives,Mindful Movement
9/19/2023 13:06:29,28vsaenz@asd.edu.qa,Valeria Saenz,x,,,Mr. Howell,Striking (T-ball Softball),Invasion,Nets (Volleyball),Mindful Movement,Fitness Bootcamp,Track & Field,Combatives
9/19/2023 12:39:52,28zalbataineh@asd.edu.qa,Zaid Bataineh,,,x,Mr. Howell,Invasion,Nets (Volleyball),Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Combatives,Mindful Movement
9/20/2023 8:34:35,28ahalwani@asd.edu.qa,Aboodi halwani ,,,x,Mrs. Magee,Invasion,Combatives,Nets (Volleyball),Track & Field,Fitness Bootcamp,Striking (T-ball Softball),Mindful Movement
9/19/2023 13:34:44,28aabdul@asd.edu.qa,Adam Abdulqader,,,x,Mrs. Magee,Invasion,Striking (T-ball Softball),Mindful Movement,Nets (Volleyball),Track & Field,Fitness Bootcamp,Combatives
9/19/2023 13:34:42,28aalrashid@asd.edu.qa,Ahmed Al-Rashid,,,x,Mrs. Magee,Invasion,Striking (T-ball Softball),Mindful Movement,Nets (Volleyball),Track & Field,Fitness Bootcamp,Combatives
9/19/2023 13:34:43,28akim@asd.edu.qa,Allison Kim,x,,,Mrs. Magee,Striking (T-ball Softball),Invasion,Combatives,Mindful Movement,Track & Field,Fitness Bootcamp,Nets (Volleyball)
9/19/2023 13:34:05,28awichert@asd.edu.qa,Amelie Wichert,x,,,Mrs. Magee,Invasion,Nets (Volleyball),Fitness Bootcamp,Striking (T-ball Softball),Track & Field,Mindful Movement,Combatives
9/19/2023 13:33:29,28fsanchez@asd.edu.qa,Fidel Sanchez,,,,Mrs. Magee,Track & Field,Invasion,Striking (T-ball Softball),Nets (Volleyball),Combatives,Fitness Bootcamp,Mindful Movement
9/19/2023 15:49:06,28halkasawneh@asd.edu.qa,Hala Alkasawneh,x,x,x,Mrs. Magee,Invasion,Nets (Volleyball),Mindful Movement,Striking (T-ball Softball),Fitness Bootcamp,Combatives,Track & Field
9/19/2023 13:33:49,28halneama@asd.edu.qa,Hessa Al Neama ,x,x,x,Mrs. Magee,Nets (Volleyball),Mindful Movement,Invasion,Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Combatives
9/19/2023 13:34:49,28ibermak@asd.edu.qa,Ilyas Bermak,,,x,Mrs. Magee,Nets (Volleyball),Invasion,Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Combatives,Mindful Movement
9/19/2023 13:34:44,28jhassan@asd.edu.qa,Jana Hassan,x,x,x,Mrs. Magee,Mindful Movement,Combatives,Invasion,Striking (T-ball Softball),Nets (Volleyball),Track & Field,Fitness Bootcamp
9/19/2023 13:34:36,28jtupamahu@asd.edu.qa,Jayden Tupamahu,,,,Mrs. Magee,Invasion,Striking (T-ball Softball),Mindful Movement,Nets (Volleyball),Track & Field,Fitness Bootcamp,Combatives
9/19/2023 13:35:11,28jbae@asd.edu.qa,Jinsol Bae,,,,Mrs. Magee,Invasion,Mindful Movement,Nets (Volleyball),Striking (T-ball Softball),Combatives,Fitness Bootcamp,Track & Field
9/19/2023 13:34:26,28laljaidah@asd.edu.qa,lulwa al jaidah,x,x,x,Mrs. Magee,Invasion,Nets (Volleyball),Combatives,Mindful Movement,Striking (T-ball Softball),Track & Field,Fitness Bootcamp
9/19/2023 13:34:10,28malsulaiti@asd.edu.qa,manna alsulaiti,,,x,Mrs. Magee,Invasion,Combatives,Striking (T-ball Softball),Nets (Volleyball),Fitness Bootcamp,Mindful Movement,Track & Field
9/19/2023 13:34:01,28mtoro@asd.edu.qa,Miranda Toro Rincon,x,,,Mrs. Magee,Invasion,Nets (Volleyball),Track & Field,Striking (T-ball Softball),Combatives,Mindful Movement,Fitness Bootcamp
9/19/2023 13:33:38,28mkalash@asd.edu.qa,Mohamad Kalash,,,x,Mrs. Magee,Nets (Volleyball),Invasion,Striking (T-ball Softball),Fitness Bootcamp,Combatives,Track & Field,Mindful Movement
9/19/2023 13:34:14,28mabdelmoaty@asd.edu.qa,Mohamed Abdelmoaty,,,x,Mrs. Magee,Invasion,Striking (T-ball Softball),Nets (Volleyball),Combatives,Fitness Bootcamp,Mindful Movement,Track & Field
9/19/2023 13:34:46,28mkhatib@asd.edu.qa,Mohammad Khatib,,,x,Mrs. Magee,Invasion,Combatives,Striking (T-ball Softball),Nets (Volleyball),Fitness Bootcamp,Mindful Movement,Track & Field
9/19/2023 13:39:11,28nhudhud@asd.edu.qa,naim hudhud,,,x,Mrs. Magee,Invasion,Combatives,Striking (T-ball Softball),Nets (Volleyball),Fitness Bootcamp,Mindful Movement,Track & Field
9/19/2023 13:34:24,28rkapoor@asd.edu.qa,Renee kapoor,x,x,,Mrs. Magee,Invasion,Nets (Volleyball),Striking (T-ball Softball),Combatives,Mindful Movement,Fitness Bootcamp,Track & Field
9/19/2023 13:33:54,28swadhawan@asd.edu.qa,Sana Wadhawan,x,x,x,Mrs. Magee,Invasion,Mindful Movement,Combatives,Fitness Bootcamp,Nets (Volleyball),Striking (T-ball Softball),Track & Field
9/19/2023 13:33:52,28szomonita@asd.edu.qa,Sara Zomonita,x,,,Mrs. Magee,Nets (Volleyball),Mindful Movement,Invasion,Striking (T-ball Softball),Track & Field,Fitness Bootcamp,Combatives
9/19/2023 13:33:50,28sbeck@asd.edu.qa,Sebastian Beck,,,,Mrs. Magee,Invasion,Fitness Bootcamp,Track & Field,Combatives,Nets (Volleyball),Striking (T-ball Softball),Mindful Movement

`

}
