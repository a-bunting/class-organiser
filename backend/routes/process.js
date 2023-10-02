const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const stringMethods = require('../methods/string');
const userMethods = require('../methods/user');

/**
 * 
 * ADD CHECK AUTH WHEN ALL IS DONE
 * 
 * 
 * ADD CHECK AUTH WHEN ALL IS DONE!
 * 
 */

router.post('/timetable', (req, res, next) => {
    const timetable = req.body.timetable;
    process(timetable, res);
});

async function process(timetable, res) {
    // run the processor then return the results.
    const result = await geneticProcessor(timetable);
    res.status(200).json({ error: false, message: '', data: result })
}

function geneticProcessor(timetable) {
    return new Promise((resolve) => {
        // do the stuff
        // first make a bunch of different versions of the schedule, shuffling the students each time.
        const MAX_ITERATIONS = 1;
        const MUTATION_FACTOR = 0.1;
        const generatedSchedules = [];
        
        // this is what should be appended to each student. It is what is required of them by the organiser and takes no optional things into account.
        let requiredCourses = timetable.courses.map(a => { 
                return { id: +a.id, timesLeft: +a.requirement.times, required: a.requirement.required } 
        }).filter(a => a !== undefined);
        
        const studentList = [...timetable.students.map(a => { return { ...a, requiredCourses }})];
        // const restrictionPriorityList = timetable.restrictions.filter(c => c.optionsAreClasses === true).sort((a, b) => a.priority - b.priority);

        // YAK! SOME THINGS WITH IDS THAT FEEL VERY POOR HERE!
        // NOT SURE THIS WORKS BUT IT WILL DO FOR NOW!
        // studentList.map(a => {
        //   restrictionPriorityList.forEach(c => {
        //     // or each course int eh restriction list, get the prioity of the restriction id
        //     let restPrio = c.priority;
        //     let restId = c.id;
            
        //     // find the restriction on the student
        //     let sData = a.data.find(b => b.restrictionId === restId);

        //     // get the priority for that course
        //     let studentPrio = sData.value === 0 ? 1 : sData.value;

        //     // then append to the students course list
        //     a.requiredCourses.find(d => +d.id === restId).priority = studentPrio;
        //   });  
        // })


        console.log(studentList[0])

        console.time(`run timer`);
        for(let a = 0 ; a < MAX_ITERATIONS ; a++) {
            // for each iteration generate a new list of students, rnadomly sorted.
            let iterationStudentList = [...studentList].sort((a, b) => Math.random() - 0.5);
            // console.time(`iteration timer`);

            // EVERY TIME BLOCK

            // now iterate over each time block, in which each student needs to appear
            for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {
                const timeBlock = timetable.schedule.blocks[i];
                let studentList = [...iterationStudentList.map(a => { return {...a, placed: false, score: []}})];

                // EVERY BLOCK

                // this just assigns a course to a block and renames it. Must be done before its populated by students
                // and is randomly assigned any of the course options available.
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];
                    
                    if(block.courses.length > 0) {
                        // assign the block a random one of the options.
                        const courseId = block.courses[Math.floor(Math.random() * block.courses.length)];
                        // trim the other courses as they are no longer required this iteration;
                        block.courses = [courseId];
                        // then rename the block by the course
                        block.name = timetable.courses.find(a => +a.id === +courseId).name;
                    } else {
                        block.name = 'Free Block';
                        block.courses = []
                    }
                }

                // if this is a 'class only' block then stick everyone in there who is part of the class
                // do this first.
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];
                    
                    if(block.classOnly) {
                        block.students = studentList.filter(a => +a.classId === +block.classId);
                        studentList = studentList.filter(a => +a.classId !== +block.classId);
                        block.name = `${timetable.classes.find(a => a.id === block.classId).teacher}'s class`
                        continue; // no need to do the rest of this!
                    }
                }
                
                // then the ones that need a bit of selection...
                // this is where priorities and required courses get sorted, as well as other things like generder selected etc.
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];

                    // rerandomise the students left
                    studentList.sort((a, b) => Math.random() - 0.5);
        
                    // if this is a 'class only' block then everyone should already be in, move on!
                    if(block.classOnly) { continue; }
                    
                    // if the block is full, continue - this is only superceded by members of the class
                    if(block.maxStudents === block.students.length) continue;
                    
                    // if this block has no restrictions or assigned courses then place the first x number of students in it.
                    if(block.restrictions.length === 0 && block.courses.length === 0) {
                        let spaces = block.maxStudents - block.students.length;
                        let students = studentList.filter((a, i) => i < spaces); // take out the first x
                        studentList = studentList.filter((a, i) => i >= spaces); // remove them from the rest of the students array
                        block.students = block.students.concat(students);
                        continue;
                    }
                    
                    let restrictions = block.restrictions;
                    let courseId = block.courses.length === 0 ? -1 : block.courses[0];
                    let maxScore = block.restrictions.length + 2; // +1 is for required or prioty

                    // now go through the student list and fit everyone in who fits, first come first served from the array, so to speak
                    // otherwise we now go through the list of students and see who fits in places
                    for(let p = 0 ; p < studentList.length ; p++) {
                        let student = studentList[p];
                        let score = 0;

                        // build a score from the restrictions and the courses.
                        for(let r = 0 ; r < restrictions.length ; r++) {
                            let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                            
                            if(studentRestriction.value === restrictions[r].optionId) {
                                score++; //yay, they match, the restriction is passed.
                            }
                        }




                        // NEW COURSES.
                        let studentPriorities = student.coursePriorities.find(a => +a.courseId === +courseId);

                        // // if the course is not required by the student then this student does not need this course
                        let studentCourseRequirement = student.requiredCourses.find(a => +a.id === +courseId);

                        // they are already in this course somewhere so skip this student
                        if(studentCourseRequirement.timesLeft === 0) {
                            score = 0;
                            continue;
                        }

                        // give it some extra score for being required and ignore priority
                        // this helps just get students into required courses.
                        if(studentCourseRequirement.required) {
                            score++;
                        } else {
                        // add 1 if this is top priority and less and less if it is not highest priority
                        // heavily favours placing students in their first priority
                            score += (1 / studentPriorities.priority);
                        }

                        let scorePercentage = +score / +maxScore;

                        // if its a perfect match then place them!
                        if(scorePercentage >= 1) {
                            student.placed = true;
                            block.students.push(student);
                            // remove form the overall array
                            let studentIndex = studentList.findIndex(a => +a.id === +student.id);
                            studentList.splice(studentIndex, 1);
                            continue;
                        } else {
                            // Now assign the score to the student and it will be reiterated over at the end.
                            student.placed = false;
                            student.score.push({ blockId: block.id, score: scorePercentage }); 
                        }
                    }





                    // now go through the list of students and see who isnt placed.
                    // if they arent placed find the place that was BEST for them and if there is space, put them there!
                    let unplacedStudents = studentList.filter(a => !a.placed);
    
                    for(let p = 0 ; p < unplacedStudents.length ; p++) {
                        // sort by score
                        let scoreList = unplacedStudents[p].score.sort((a, b) => +a.score - +b.score);
                        // get the best
                        // get the related block
                        
                        for(let m = 0 ; m < scoreList.length ; m++) {
                            let bestScore = scoreList[m];
                            let block = timeBlock.blocks.find(a => a.id === bestScore.blockId);

                            if(block.students.length < block.maxStudents) {
                                unplacedStudents[p].placed = true;
                                block.students.push(unplacedStudents[p]);
                                break;
                            }
                        }
                    }
                }

                // at the end of the block replace the student object with student ids.
                timeBlock.blocks.map(a => { a.students = a.students.map(b => { return +b.id }); })
            }
            
            // console.timeEnd(`iteration timer`);
        }
        console.timeEnd(`run timer`);

        // then measure how well each one fits the timetable

        // test to see if there is a perfect fit, if so end

        // mutate some low percetnage of them and recalculate the scores of those

        // then cull the worst half

        // rinse and repeat until you have one left
        
        resolve(timetable); //finished properly
        // resolve(false); // did not finish
    })
}

module.exports = router;
