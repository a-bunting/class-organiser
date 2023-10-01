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
        const studentList = [...timetable.students];

        for(let a = 0 ; a < MAX_ITERATIONS ; a++) {
            // for each iteration generate a new list of students, rnadomly sorted.
            let iterationStudentList = [...studentList].sort((a, b) => Math.random() - 0.5);

            // EVERY TIME BLOCK

            // now iterate over each time block, in which each student needs to appear
            for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {
                const timeBlock = timetable.schedule.blocks[i];
                let studentList = [...iterationStudentList.map(a => { return {...a, placed: false, score: []}})];

                // EVERY BLOCK
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];
                    
                    if(block.courses.length > 0) {
                        // assign the block a random one of the options.
                        const courseId = block.courses[Math.floor(Math.random() * block.courses.length)];
                        block.name = timetable.courses.find(a => +a.id === +courseId).name;
                    } else {
                        block.name = 'No Course Block';
                    }
                }

                // if this is a 'class only' block then stick everyone in there who is part of the class
                // do this first.
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];
                    
                    if(block.classOnly) {
                        block.students = studentList.filter(a => +a.classId === +block.classId);
                        studentList = studentList.filter(a => +a.classId !== +block.classId);
                        block.title = `${timetable.classes.find(a => a.id === block.classId).teacher}'s class`
                        continue; // no need to do the rest of this!
                    }
                }
                
                // then the ones that need a bit of selection...
                for(let o = 0 ; o < timeBlock.blocks.length ; o++) {
                    const block = timeBlock.blocks[o];

                    // rerandomise the students left
                    studentList.sort((a, b) => Math.random() - 0.5);
        
                    // if this is a 'class only' block then everyone should already be in, move on!
                    if(block.classOnly) {
                        continue; // no need to do the rest of this!
                    }

                    // if the block is full, continue - this is only superceded by members of the class
                    if(block.maxStudents === block.students.length) continue;

                    
                    // if this block has no restrictions then place the first x number of student in it.
                    if(block.restrictions.length === 0) {
                        // console.log(`test` );
                        let spaces = block.maxStudents - block.students.length;
                        let students = studentList.filter((a, i) => i < spaces); // take out the first x
                        studentList = studentList.filter((a, i) => i >= spaces); // remove them from the rest of the students array
                        block.students = block.students.concat(students);
                        // console.log(spaces, students.length, studentList.length, block.students.length);
                        continue;
                    }
                    
                    // now go through the student list and fit everyone in who fits, first come first served from the array, so to speak
                    // otherwise we now go through the list of students and see who fits in places
                    for(let p = 0 ; p < studentList.length ; p++) {
                        let student = studentList[p];
                        let restrictions = block.restrictions;
                        let maxScore = block.restrictions.length;
                        let score = 0;

                        // simply, if they meet the requirements, put them there!
                        for(let r = 0 ; r < restrictions.length ; r++) {
                            let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                            
                            if(studentRestriction.value === restrictions[r].optionId) {
                                score++; //yay, they match, the restriction is passed.
                            }
                        }

                        let scorePercentage = +score / +maxScore;

                        // if its a perfect match then place them!
                        if(scorePercentage === 1) {
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
        }

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
