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
        const MAX_ITERATIONS = 1000;
        const PRIORITY_SCORING = [100, 50, 25, 20, 15, 10, 5, 4, 3, 2, 1];
        const MAX_THEORETICAL_SCORE = PRIORITY_SCORING.filter((a, i) => i < timetable.students[0].coursePriorities.filter(a => a.priority !== 0).length).reduce((part, a) => part + a, 0) * timetable.students.length;
        const MUTATION_FACTOR = 0.1;

        let generatedSchedules = [];
        
        // this is what should be appended to each student. It is what is required of them by the organiser and takes no optional things into account.
        let requiredCourses = timetable.courses.map(a => { 
            return { id: +a.id, timesLeft: +a.requirement.times, required: a.requirement.required } 
        }).filter(a => a !== undefined);
        
        const studentList = [...timetable.students.map(a => { return { ...a, requiredCourses }})];

        // set a timer - comment here rather than have this look odd on its own.
        console.time(`run timer`);

        for(let a = 0 ; a < MAX_ITERATIONS ; a++) {
            // for each iteration generate a new timetable and a new list of students, rnadomly sorted.
            let iterationStudentList = JSON.parse(JSON.stringify(studentList)).sort((a, b) => Math.random() - 0.5);
            let iterationTimetable = JSON.parse(JSON.stringify(timetable));

            // randomise the blocks
            iterationTimetable.schedule.blocks.sort((a, b) => Math.random() - 0.5);

            // now iterate over each time block, in which each student needs to appear
            let timetableProcessed = processTimetable(iterationTimetable, iterationStudentList);

            // then measure how well each one fits the timetable, returns { score: totalScore, prioritySatisfied };
            let scores = getFitnessRating(timetableProcessed, PRIORITY_SCORING);

            // test to see if there is a perfect fit, if so end
            if((scores.score / MAX_THEORETICAL_SCORE) >= 1) {
                resolve({ timetable: timetableProcessed, scores })
            } else {
                generatedSchedules.push({ scores , blocks: timetableProcessed.schedule.blocks });
            }
            // mutate some low percetnage of them and recalculate the scores of those

            // then cull the worst half

            // rinse and repeat until you have one left 
        }

        // end
        console.timeEnd(`run timer`);

        generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score);
        
        const bestTimetable = generatedSchedules[0];
        bestTimetable.blocks.map(a => { return a.blocks.sort((a, b) => +a.id - +b.id ) });
        bestTimetable.blocks.sort((a, b) => +a.order - +b.order);

        // print out the best three
        generatedSchedules.forEach((a, i) => {
            if(i < 3) { console.log(`(${i}) Total score: ${a.scores.score} - 1st Prio (${((a.scores.prioritySatisfied[0] / studentList.length)).toFixed(2) * 100}%), 2nd Prio (${((a.scores.prioritySatisfied[1] / studentList.length)).toFixed(2) * 100}%), 3rd Prio (${((a.scores.prioritySatisfied[2] / studentList.length)).toFixed(2) * 100}%), 4th Prio (${((a.scores.prioritySatisfied[3] / studentList.length)).toFixed(2) * 100}%)`); }
        })

        console.log(`Max score: ${MAX_THEORETICAL_SCORE}`);
        
        // console.log(bestTimetable.blocks);

        
        resolve({ ...timetable, schedule: bestTimetable }); //finished properly
        // resolve(false); // did not finish
    })
}

function processTimetable(timetable, iterationStudentList) {

    let numberOfStudents = iterationStudentList.length;

    for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {

        // rerandomise the order of the blocks
        timetable.schedule.blocks[i].blocks.sort((a, b) => Math.random() - 0.5);

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
            let restrictions = block.restrictions;
            let courseId = block.courses.length === 0 ? -1 : block.courses[0];
            let maxScore = block.restrictions.length + 1; // +1 is for required or prioty

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
            
            // now go through the student list and fit everyone in who fits, first come first served from the array, so to speak
            // otherwise we now go through the list of students and see who fits in places
            for(let p = 0 ; p < studentList.length ; p++) {
                // student and score
                let student = studentList[p];
                let score = 0;

                // NEW COURSES.
                let studentPriorities = student.coursePriorities.find(a => +a.courseId === +courseId);
                // // if the course is not required by the student then this student does not need this course
                let studentCourseRequirement = student.requiredCourses.find(a => +a.id === +courseId);

                // build a score from the restrictions and the courses.
                // commented out is score based restriction - but this maybe isnt heavy enough?
                // for(let r = 0 ; r < restrictions.length ; r++) {
                //     let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                    
                //     if(studentRestriction.value === restrictions[r].optionId) {
                //         score++; // yay, they match, the restriction is passed.
                //     }
                // }
                // failing a restriction eliminates you from this block.
                for(let r = 0 ; r < restrictions.length ; r++) {
                    let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                    
                    if(studentRestriction.value === restrictions[r].optionId) {
                        student.placed = false; // tag as not passed, no score assigned - they cannot be in this block
                        continue;
                    }
                }

                // they are already in this course somewhere so skip this student
                if(studentCourseRequirement.timesLeft === 0) { continue; }

                // just place students if its a required course or 1st or 2nd prioity and they need it
                if(studentPriorities.priority <= 2) {
                    student.placed = true;
                    studentCourseRequirement.timesLeft = +(studentCourseRequirement.timesLeft - (+1));
                    block.students.push(student);
                    
                    // remove form the overall array
                    let studentIndex = studentList.findIndex(a => +a.id === +student.id);
                    studentList.splice(studentIndex, 1);
                    continue;                
                } else {
                    // add 1 if this is top priority and less and less if it is not highest priority
                    score += (1 / studentPriorities.priority);
                }

                let scorePercentage = +score / +maxScore;

                // if its a perfect match then place them!
                if(scorePercentage >= 1) {
                    student.placed = true;
                    studentCourseRequirement.timesLeft = +(studentCourseRequirement.timesLeft - (+1));
                    block.students.push(student);
                    // remove form the overall array
                    let studentIndex = studentList.findIndex(a => +a.id === +student.id);
                    studentList.splice(studentIndex, 1);
                    continue;
                } else {
                    // Now assign the score to the student and it will be reiterated over at the end.
                    student.placed = false;
                    student.score.push({ blockId: block.id, score: scorePercentage }); 
                    continue;
                }
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

                    let courseId = block.courses.length === 0 ? -1 : block.courses[0];
                    let studentCourseRequirement = unplacedStudents[p].requiredCourses.find(a => +a.id === +courseId);
                    studentCourseRequirement.timesLeft = +(studentCourseRequirement.timesLeft - (+1));
                    break;
                }
            }
        }

        
        // at the end of the block replace the student object with student ids.
        timeBlock.blocks.map(a => { a.students = a.students.map(b => { return +b.id }); })
        // console.log(`unplaced students: ${numberOfStudents - timeBlock.blocks.reduce((conc, a) => +conc + a.students.length, 0)}`);
    }

    return timetable;
}

function getFitnessRating(timetable, PRIORITY_SCORING) {

    // score is based on priorities being matched.
    totalScore = 0;
    prioritySatisfied = [...Array(timetable.students[0].coursePriorities.length).keys()].map(a => {return 0});

    // get a list of all the blocks...
    const blocks = [].concat(...timetable.schedule.blocks.map(a => { return a.blocks.map(b => { return b }) }));

    for(let i = 0 ; i < timetable.students.length ; i++) {
        // get non zero priorities
        let student = timetable.students[i];
        let studentPriorities = student.coursePriorities.filter(a => a.priority !== 0);
        let studentScore = 0;

        for(let o = 0 ; o < studentPriorities.length ; o++) {
            let priority = studentPriorities[o];
            // find the blocks with this courses.
            let blocksWithCourse = blocks.filter(a => !!a.courses.find(b => +b === +priority.courseId));

            if(blocksWithCourse.length === 0) continue; // there are no blocks with this, so they dont have it

            for(let p = 0 ; p < blocksWithCourse.length ; p++) {
                let studentInCourse = blocksWithCourse[p].students.find(a => +a === +student.id);

                if(studentInCourse) {
                    // they have been found in the course! Now get the students ranking for this course and add points for it.
                    switch(priority.priority) {
                        case 1: studentScore += PRIORITY_SCORING[0]; prioritySatisfied[0]++; break;
                        case 2: studentScore += PRIORITY_SCORING[1]; prioritySatisfied[1]++; break;
                        case 3: studentScore += PRIORITY_SCORING[2]; prioritySatisfied[2]++; break;
                        case 4: studentScore += PRIORITY_SCORING[3]; prioritySatisfied[3]++; break;
                        case 5: studentScore += PRIORITY_SCORING[4]; prioritySatisfied[4]++; break;
                        case 6: studentScore += PRIORITY_SCORING[5]; prioritySatisfied[5]++; break;
                        case 7: studentScore += PRIORITY_SCORING[6]; prioritySatisfied[6]++; break;
                        case 8: studentScore += PRIORITY_SCORING[7]; prioritySatisfied[7]++; break;
                        case 9: studentScore += PRIORITY_SCORING[8]; prioritySatisfied[8]++; break;
                        case 10: studentScore += PRIORITY_SCORING[9]; prioritySatisfied[9]++; break;
                        case 11: studentScore += PRIORITY_SCORING[10]; prioritySatisfied[10]++; break;
                        default: break;
                    }

                    break; // no nneed to check the other blocks with this course.
                }
            }
        }

        totalScore += studentScore;
    }

    return { score: totalScore, prioritySatisfied };
}

module.exports = router;
