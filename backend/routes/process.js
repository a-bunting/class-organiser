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
//savedData.push({ code, index: i, data: { ...timetable, schedule: a }});
let savedData = [];

router.post('/timetable', checkAuth, (req, res, next) => {
    console.log(userMethods.getUserDataFromToken(req))
    const timetable = req.body.timetable;
    process(timetable, res, req);
});

router.post('/selectSavedItem', checkAuth, (req, res, next) => {
    const selectionId = req.body.selectionId;
    const code = req.body.code;
    const token = req.headers.authorization.split(" ")[1];

    let data = savedData.find(a => a.code === code && a.index === selectionId && a.token === token);
    
    if(data) {
        res.status(200).json({ error: false, message: '', data: data.data })
    } else {
        res.status(400).json({ error: true, message: 'Couldnt find your saved data', data: {} })
    }
});

async function process(timetable, res, req) {
    // run the processor then return the results.
    const result = await geneticProcessor(timetable, req);
    // const result = await runTest(timetable);
    res.status(200).json({ error: false, message: '', data: result })
}

function geneticProcessor(timetable, req) {
    return new Promise((resolve) => {
        // do the stuff
        // first make a bunch of different versions of the schedule, shuffling the students each time.
        const MAX_ITERATIONS = 1;
        const ALL_REQUIRED_SCORE = 200;
        const PRIORITY_SCORING = [200, 100, 25, 20, 15, 10, 5, 4, 3, 2, 1];
        const MAX_THEORETICAL_SCORE = timetable.students.length * ALL_REQUIRED_SCORE + timetable.schedule.blocks.length * 100 + PRIORITY_SCORING.filter((a, i) => i < timetable.students[0].coursePriorities.filter(a => a.priority !== 0).length).reduce((part, a) => part + a, 0) * timetable.students.length;
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
            // clear the timetable
            iterationTimetable.schedule.blocks.map(a => a.blocks.map(b => b.students = [] ));

            // randomise the blocks
            iterationTimetable.schedule.blocks.sort((a, b) => Math.random() - 0.5);

            // now iterate over each time block, in which each student needs to appear
            let timetableProcessed = processTimetableBasedUponPriorityIterateOverPriority(iterationTimetable, iterationStudentList);

            // then measure how well each one fits the timetable, returns { score: totalScore, prioritySatisfied };
            let scores = getFitnessRating(timetableProcessed, PRIORITY_SCORING, ALL_REQUIRED_SCORE);
            getFitnessRatingByStudentPriority(timetable);

            // test to see if there is a perfect fit, if so end
            // if((scores.score / MAX_THEORETICAL_SCORE) >= 1) {
            //     resolve({ timetable: timetableProcessed, scores })
            // } else {
                generatedSchedules.push({ scores , blocks: timetableProcessed.schedule.blocks });
            // }

            // every 500 iterations reduce the generated schedules to the top 500
            // if this ever goes full genetic this will need to be removed for breeding purposes
            if(a % 500 === 0) {
                generatedSchedules = generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score).filter((a,i) => i < 5);
            }
        }

        // this bit makes it worse :) but works! but makes it worse soooo

        // while(generatedSchedules.length > 10) {
        //     generations++;
        //   // sort by how good the timetable scores are and then cull the bottom half
        //   generatedSchedules = generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score).filter((a, i) => i < generatedSchedules.length * 0.5);
          
        //   // make some baby timetables! *hug*
        //   // (not exactly like their parents)
        //   let bredTimetables = breedAndMutate(generatedSchedules.map(a => { return a.blocks }));

        //   let fullBredTimetable = bredTimetables.map(a => {
        //     let newTimetable = JSON.parse(JSON.stringify(timetable));
        //     newTimetable.schedule.blocks = a;
        //     return newTimetable;
        //   });

        //   generatedSchedules = [];

        //   fullBredTimetable.map(a => { 
        //     let scores = getFitnessRating(a, PRIORITY_SCORING);
        //     generatedSchedules.push({ scores , blocks: a.schedule.blocks });
        //   });
        // }

        // end
        console.timeEnd(`run timer`);

        generatedSchedules = generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score).filter((a, i) => i < 5);

        const code = stringMethods.generateRandomString();
        const token = req.headers.authorization.split(" ")[1];
        let statistics = []

        // print out the best three
        generatedSchedules.forEach((a, i) => {
            // do the stats
            // let stats = { nonOneOrTwo: a.scores.nonOneOrTwo, unplaced: a.blocks.reduce((sum, a) => +sum + +a.missingStudents.length, 0), missed: a.scores.nonOneOrTwo.length, oneTwo: ((a.scores.priorityOneOrTwo / studentList.length)).toFixed(2) * 100, one: ((a.scores.prioritySatisfied[0] / studentList.length)).toFixed(2) * 100, two: ((a.scores.prioritySatisfied[1] / studentList.length)).toFixed(2) * 100, three: ((a.scores.prioritySatisfied[2] / studentList.length)).toFixed(2) * 100, four: ((a.scores.prioritySatisfied[3] / studentList.length)).toFixed(2) * 100, notAllRequired: a.scores.notAllRequired }
            // sort the blocks properly as intended
            a.blocks.map(a => { return a.blocks.sort((a, b) => +a.id - +b.id ) });
            a.blocks.sort((a, b) => +a.order - +b.order);
            // strip out the data used by the backend but not part of the front end.
            timetable.students.map((b => { return { id: b.id, classId: b.classId, name: b.name, data: b.data, coursePriorities: b.coursePriorities, studentPriorities: b.studentPriorities }}));
            // save the data to be retrieved
            statistics.push({ index: i, stats: a.scores });
            // add to saved data
            savedData.push({ code, token, index: i, data: { ...timetable, schedule: a }});
            // setup a timer to get rid of the data after 20 mins
            setTimeout(() => { removeSavedItem(code); console.log(`deleting ${code}`); }, 1000*60*60);
            // log to node console
            // console.log(`(${i+1}) Total score: ${a.scores.score} - 1st or 2nd (${((a.scores.priorityOneOrTwo / studentList.length)).toFixed(2) * 100}%, ${a.scores.nonOneOrTwo.length} missed out), 1st Prio (${((a.scores.prioritySatisfied[0] / studentList.length)).toFixed(2) * 100}%), 2nd Prio (${((a.scores.prioritySatisfied[1] / studentList.length)).toFixed(2) * 100}%), 3rd Prio (${((a.scores.prioritySatisfied[2] / studentList.length)).toFixed(2) * 100}%), Missing students (${stats.unplaced})`);
        })

        console.log(`Max score: ${MAX_THEORETICAL_SCORE}`);
        console.log(`Iterations: ${MAX_ITERATIONS}`);
        
        resolve({ code, statistics }); //finished properly
    })
}

function removeSavedItem(code) {
    let data = savedData.filter(a => a.code !== code);
    savedData = data;
}

function processTimetableBasedUponPriorityIterateOverPriority(timetable, iterationStudentList) {

    // individualise the blocks array for ease of use - implement this throughout later but used first as an appropriateness tester
    let blockList = timetable.schedule.blocks.map(a => { return a.blocks }).map((a,index) => { return [].concat(a.map(b => { return { block: b, timeBlockIndex: index }} )) }).flat();
    iterationStudentList = [...iterationStudentList].map(a => { return { ...a, timeBlocksFilled: []}});

    /**
     * This does a few things
     * - get a course for each of the blocks from the options available
     * - names the course
     * - if its a classonly then it fills the class up with those students
     */
    blockList.map(b => {
        if(b.block.courses.length > 0) {
            // make sure the studentlist is empty, to prevent poisoning from previous runs
            b.block.students = [];
            // assign the block a random one of the options.
            const courseId = b.block.courses[Math.floor(Math.random() * b.block.courses.length)];
            // trim the other courses as they are no longer required this iteration;
            // b.block.courses = [courseId];
            b.block.selectedCourse = courseId
            // then rename the block by the course
            let foundCourse = timetable.courses.find(a => +a.id === +courseId);
            b.block.name = foundCourse.name;
            // and set the max students in that block
            // commented out to take the max size from the block irectly again
            // b.block.maxStudents = +foundCourse.classSize;

            // make sure the locked students are in this class
            b.block.students = [...b.block.lockedStudents];
            // now go through the locked students and make sure they are flagged for this course and time period
            // b.timeBlockIndex, b.block
            let studentsLocked = iterationStudentList.filter(z => b.block.students.includes(z.id));

            studentsLocked.map(t => {
                let stuCourse = t.requiredCourses.find(s => s.id === courseId);
                stuCourse.timesLeft -= 1;
                t.timeBlocksFilled.push({ timeBlockId: b.timeBlockIndex, filled: true })
            })
        } else {
            b.block.name = 'Free Block';
            b.block.courses = []
            b.block.selectedCourse = -1;
        }

        // If its classonly, then place the students and thats that. If it isnt classonly then 
        if(b.block.classOnly) {
            b.block.students = iterationStudentList.filter(a => +a.classId === +b.block.classId).map(a => a.id);
            b.block.name = `${timetable.classes.find(a => a.id === b.block.classId).teacher}'s class`
            b.block.maxStudents = +b.block.students.length; //no need prob but to keep it defined

            // now set this timeblock to filled and remove the student from any other class in this block (class only takes priority)
            iterationStudentList.filter(c => +c.classId === +b.block.classId).map(t => {
                let timeBlock = t.timeBlocksFilled.find(d => +d.timeBlockId === +b.timeBlockIndex);

                if(!timeBlock) {
                    t.timeBlocksFilled.push({ timeBlockId: b.timeBlockIndex, filled: true });
                } else {
                    // find where they have been placed and replace them
                    // get a list of the other blocks
                    let otherBlocksInTime = blockList.filter(u => u.timeBlockIndex === b.timeBlockIndex && u.block.id !== b.block.id);
                    // find the student in there and wipe them.
                    otherBlocksInTime.map(g => {
                        let found = g.students.findIndex(h => +h === +c.id);
                        if(found !== -1) { g.students.splice(found, 1); }
                    })
                }
            })
        }
    })

    // when courses are priorities use this function
    // THIS ONE WORKS BUT HAS NO STUDENT FALL BACK!
    // prioritiseByCourse(timetable, iterationStudentList, blockList);

    // when students prioritise working with other students
    // THIS IS THE TEST ONE
    prioritiseByStudent(timetable, iterationStudentList, blockList);
    
    // finally, for each timeblock add a list of students who are not assigned to any class, room or group
    for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {
        let studentIds = iterationStudentList.map(a => a.id );
        for(let o = 0 ; o < timetable.schedule.blocks[i].blocks.length ; o++) {
            for(let p = 0 ; p < timetable.schedule.blocks[i].blocks[o].students.length ; p++) {
                let index = studentIds.findIndex(a => +a === +timetable.schedule.blocks[i].blocks[o].students[p]);
                studentIds.splice(index, 1);
            }
        }
        timetable.schedule.blocks[i].missingStudents = [...studentIds];
    }

    return timetable;

}

function prioritiseByCourse(timetable, iterationStudentList, blockList) {

    // this function will test whether or not this is the most appropriate time for this student to do this class
    // the MOST appropriate block is the one in which the requirements are most rigorously met
    const appropriatenessTest = (blockList, courseId, student) => {
        // get the other blocks this might appear in
        // let blockWithCourse = blockList.filter(a => +a.block.courses[0] === +courseId);
        let blockWithCourse = blockList.filter(a => +a.block.selectedCourse === +courseId);
        let contenders = [];

        // and for each test the restrictions and if the student met them. 
        for(let i = 0 ; i < blockWithCourse.length ; i++) {
            let restrictions = blockWithCourse[i].block.restrictions;
            let passedRestrictions = 0;
            let restrictionsTestFailed = false;

            if(student.requiredCourses.find(a => +a.id === +courseId).timesLeft === 0) { restrictionsTestFailed = true; break; }

            for(let r = 0 ; r < restrictions.length ; r++) {
                let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                
                if(+studentRestriction.value !== +restrictions[r].optionId) {
                    restrictionsTestFailed = true;
                    break;
                } else passedRestrictions++;
            }

            if(!restrictionsTestFailed) { contenders.push({ id: blockWithCourse[i].block.id, timeBlock: blockWithCourse[i].timeBlockIndex, value: passedRestrictions })};
        }
        let sortedContenders = contenders.sort((a, b) => Math.random() - 0.5).sort((a, b) => b.value - a.value);
        return sortedContenders;
    }


    // what we need is a list of items to run through in order, which is all the students 1st priorities, then 2nd, then 3rd etc.
    let priorityListed = [ ...timetable.courses.map((a, i) => { return { priority: i, list: []}}) ];

    // iterate over the students to assign their priorities intot he right places
    for(let i = 0 ; i < iterationStudentList.length ; i++) {
        for(let o = 0 ; o < iterationStudentList[i].coursePriorities.length ; o++) {
            let listing = priorityListed.find(a => +a.priority === +iterationStudentList[i].coursePriorities[o].priority);
            let studentListing = { student: iterationStudentList[i], courseId: +iterationStudentList[i].coursePriorities[o].courseId };
            let count = timetable.courses.find(a => +a.id === +iterationStudentList[i].coursePriorities[o].courseId).requirement.times;

            if(!listing) {
                priorityListed.push({ priority: +iterationStudentList[i].coursePriorities[o].priority, list: [studentListing]});
                listing = priorityListed.find(a => +a.priority === +iterationStudentList[i].coursePriorities[o].priority);
                for(let c = 0 ; c < count - 1 ; c++) listing.list.push(studentListing); // new 
            } else {
                for(let c = 0 ; c < count ; c++) listing.list.push(studentListing); // tae me out for loop
            }
        }
    }

    // now iterate over the lists, going with the first priority first, then second etc.
    for(let i = 0 ; i < priorityListed.length ; i++) {

        priorityListed[i].list = priorityListed[i].list.sort((a, b) => Math.random() - 0.5); // { student: singslistudent object, courseid: courseid }
        
        for(let o = 0 ; o < priorityListed[i].list.length ; o++) {
            iteration = o + i * priorityListed[i].list.length;

            let list = priorityListed[i].list[o];
            // get the options for this
            let contendingBlocks = appropriatenessTest(blockList, list.courseId, list.student).filter(a => {
                // filter out timeBlocks the student is currently in.
                let finder = list.student.timeBlocksFilled.find(c => +c.timeBlockId === +a.timeBlock);
                if(finder) return false;
                else return true;
            });

            // now try and put the student into these blocks in order
            for(let p = 0 ; p < contendingBlocks.length ; p++) {
                let contendingBlock = blockList.find(a => +a.block.id === contendingBlocks[p].id);

                if(+contendingBlock.block.students.length === +contendingBlock.block.maxStudents) { continue; } // block is full

                // else it should be fine?
                contendingBlock.block.students.push(list.student.id);
                // add the student to the timeblock
                list.student.timeBlocksFilled.push({ timeBlockId: contendingBlocks[p].timeBlock, filled: true });
                // log that they are now in this course
                let req = list.student.requiredCourses.find(a => +a.id === +list.courseId);
                req.timesLeft = req.timesLeft - 1;
                break;
            }
        }
    }
}


















// starting as a carbon copy of the above for testing!

function prioritiseByStudent(timetable, iterationStudentList, blockList) {
// this function will test whether or not this is the most appropriate time for this student to do this class
    // the MOST appropriate block is the one in which the requirements are most rigorously met
    const appropriatenessTest = (blockList, courseId, student) => {
        // get the other blocks this might appear in
        // let blockWithCourse = blockList.filter(a => +a.block.courses[0] === +courseId);
        let blockWithCourse = blockList.filter(a => +a.block.selectedCourse === +courseId);
        // console.log(blockList, blockWithCourse, courseId);
        let contenders = [];

        // and for each test the restrictions and if the student met them. 
        for(let i = 0 ; i < blockWithCourse.length ; i++) {
            let restrictions = blockWithCourse[i].block.restrictions;
            let passedRestrictions = 0;
            let restrictionsTestFailed = false;

            if(student.requiredCourses.find(a => +a.id === +courseId).timesLeft === 0) { restrictionsTestFailed = true; break; }

            for(let r = 0 ; r < restrictions.length ; r++) {
                let studentRestriction = student.data.find(a => +a.restrictionId === +restrictions[r].restrictionId);
                
                if(+studentRestriction.value !== +restrictions[r].optionId) {
                    restrictionsTestFailed = true;
                    break;
                } else passedRestrictions++;
            }




            // // check who else is in the class and if there are people the student want to be with, add them too
            let studentChoices = student.studentPriorities;
            // console.log(student);
            let choiceTotal = 0;

            for(let s = 0 ; s < studentChoices.length ; s++) {
                let friendsInCourse = blockWithCourse[i].block.students.includes(studentChoices[s].studentId);
                if(friendsInCourse) {
                    choiceTotal += 1 / studentChoices[s].priority;
                }
            }




            if(!restrictionsTestFailed) { contenders.push({ id: blockWithCourse[i].block.id, timeBlock: blockWithCourse[i].timeBlockIndex, value: passedRestrictions + choiceTotal })};
            // if(!restrictionsTestFailed) { contenders.push({ id: blockWithCourse[i].block.id, timeBlock: blockWithCourse[i].timeBlockIndex, value: passedRestrictions })};
        }
        let sortedContenders = contenders.sort((a, b) => Math.random() - 0.5).sort((a, b) => b.value - a.value);
        return sortedContenders;
    }


    // what we need is a list of items to run through in order, which is all the students 1st priorities, then 2nd, then 3rd etc.
    let priorityListed = [ ...timetable.courses.map((a, i) => { return { priority: i, list: []}}) ];

    // iterate over the students to assign their priorities intot he right places
    for(let i = 0 ; i < iterationStudentList.length ; i++) {
        for(let o = 0 ; o < iterationStudentList[i].coursePriorities.length ; o++) {
            let listing = priorityListed.find(a => +a.priority === +iterationStudentList[i].coursePriorities[o].priority);
            let studentListing = { student: iterationStudentList[i], courseId: +iterationStudentList[i].coursePriorities[o].courseId };
            let count = timetable.courses.find(a => +a.id === +iterationStudentList[i].coursePriorities[o].courseId).requirement.times;

            if(!listing) {
                priorityListed.push({ priority: +iterationStudentList[i].coursePriorities[o].priority, list: [studentListing]});
                listing = priorityListed.find(a => +a.priority === +iterationStudentList[i].coursePriorities[o].priority);
                for(let c = 0 ; c < count - 1 ; c++) listing.list.push(studentListing); // new 
            } else {
                for(let c = 0 ; c < count ; c++) listing.list.push(studentListing); // tae me out for loop
            }
        }
    }

    // now iterate over the lists, going with the first priority first, then second etc.
    for(let i = 0 ; i < priorityListed.length ; i++) {

        priorityListed[i].list = priorityListed[i].list.sort((a, b) => Math.random() - 0.5); // { student: singslistudent object, courseid: courseid }
        
        for(let o = 0 ; o < priorityListed[i].list.length ; o++) {
            iteration = o + i * priorityListed[i].list.length;

            let list = priorityListed[i].list[o];
            // get the options for this
            let contendingBlocks = appropriatenessTest(blockList, list.courseId, list.student).filter(a => {
                // filter out timeBlocks the student is currently in.
                let finder = list.student.timeBlocksFilled.find(c => +c.timeBlockId === +a.timeBlock);
                if(finder) return false;
                else return true;
            });

            // now try and put the student into these blocks in order
            for(let p = 0 ; p < contendingBlocks.length ; p++) {
                let contendingBlock = blockList.find(a => +a.block.id === contendingBlocks[p].id);

                if(+contendingBlock.block.students.length === +contendingBlock.block.maxStudents) { continue; } // block is full

                // else it should be fine?
                contendingBlock.block.students.push(list.student.id);
                // add the student to the timeblock
                list.student.timeBlocksFilled.push({ timeBlockId: contendingBlocks[p].timeBlock, filled: true });
                // log that they are now in this course
                let req = list.student.requiredCourses.find(a => +a.id === +list.courseId);
                req.timesLeft = req.timesLeft - 1;
                break;
            }
        }
    }

}




















function getFitnessRatingByStudentPriority(timetable) {

    // score is based on priorities being matched.
    totalScore = 0;
    studentsInRoomWithNthPriority = Array.from({ length: timetable.students[0].studentPriorities.length }, (_, i) => { return { priority: i + 1, number: 0 }});
    const PRIORITY_SCORES = Array.from({ length: timetable.students[0].studentPriorities.length }, (_, i) => { return 200 / (i + 1) });

    // get a list of all the blocks, each block has a list of students
    const blocks = [].concat(...timetable.schedule.blocks.map(a => { return a.blocks.map(b => { return b }) }));

    for(let i = 0 ; i < timetable.students.length ; i++) {
        let student = timetable.students[i];
        let blocksWithStudent = blocks.filter(a => a.students.includes(student.id));

        for(let o = 0 ; o < blocksWithStudent.length ; o++) {
            // for each block the student is in see if their nth priority is in it too
            for(let p = 0 ; p < student.studentPriorities.length ; p++) {
                if(blocksWithStudent[o].students.includes(student.studentPriorities[p].studentId)) {
                    // this student is in the same block hurray
                    console.log(student);
                    let log = studentsInRoomWithNthPriority.find(a => +a.priority === +student.studentPriorities[p].priority);
                    console.log(log);
                    log.number++;
                } else {
                    // they are not in the same block, keep this comment for reference for now
                }
            }
        }
    }

    console.log(studentsInRoomWithNthPriority);

}

function getFitnessRating(timetable, PRIORITY_SCORING, ALL_REQUIRED_SCORE) {

    // score is based on priorities being matched.
    totalScore = 0;
    prioritySatisfied = [...Array(timetable.students[0].coursePriorities.filter(a => a.priority !== 0).length).keys()].map(a => {return 0});
    priorityOneOrTwo = 0;
    nonOneOrTwo = [];
    notAllRequired = [];

    // get a list of all the blocks...
    const blocks = [].concat(...timetable.schedule.blocks.map(a => { return a.blocks.map(b => { return b }) }));

    // give additional point sfor full timeblocks
    for(let i = 0 ; i < timetable.schedule.blocks.length ; i++) {
        let totalStudents = 0;

        for(let o = 0 ; o < timetable.schedule.blocks[i].blocks.length ; o++) {
            totalStudents += timetable.schedule.blocks[i].blocks[o].students.length;
        }

        if(totalStudents === timetable.students.length) totalScore += 500;
    }

    let requiredCourses = timetable.courses.filter(a => a.requirement.required === true).map(a => a.id);

    for(let i = 0 ; i < timetable.students.length ; i++) {
        // get non zero priorities
        let student = timetable.students[i];
        let studentPriorities = student.coursePriorities.filter(a => a.priority !== 0);
        let studentRequired = student.coursePriorities.filter(a => a.priority === 0)
        let studentScore = 0;
        let firstOrSecond = false;
        let studentRequiredCount = 0;

        // first check the required courses they have
        for(let o = 0 ; o < studentRequired.length ; o++) {
            let course = studentRequired[o];
            let blocksWithCourse = blocks.filter(a => +a.selectedCourse === +course.courseId);

            if(blocksWithCourse.length === 0) continue;

            for(let p = 0 ; p < blocksWithCourse.length ; p++) {
                let studentInCourse = blocksWithCourse[p].students.includes(+student.id);
                if(studentInCourse) {
                    studentRequiredCount++;
                    break;
                }
            }
        }

        let totalRequired = requiredCourses.length - studentRequiredCount;
        // console.log(totalRequired, requiredCourses.length, studentRequired.map(a => a.courseId ));

        if(totalRequired > 0) {
            // some required courses have not been met
            notAllRequired.push(student.id);
        } else {
           studentScore += ALL_REQUIRED_SCORE;
        }

        // then do the courses with priority
        for(let o = 0 ; o < studentPriorities.length ; o++) {
            let priority = studentPriorities[o];
            // find the blocks with this courses.
            let blocksWithCourse = blocks.filter(a => +a.selectedCourse === +priority.courseId);

            if(blocksWithCourse.length === 0) continue; // there are no blocks with this, so they dont have it

            for(let p = 0 ; p < blocksWithCourse.length ; p++) {
                let studentInCourse = blocksWithCourse[p].students.includes(+student.id);

                if(studentInCourse) {
                    // they have been found in the course! Now get the students ranking for this course and add points for it.
                    studentScore += PRIORITY_SCORING[priority.priority - 1]; 
                    prioritySatisfied[priority.priority - 1]++;

                    if(priority.priority <= 2) { firstOrSecond = true; };

                    break; // no nneed to check the other blocks with this course.
                }
            }
        }

        if(firstOrSecond) {
            priorityOneOrTwo++;
        } else {
            nonOneOrTwo.push(student.id);
        }

        totalScore += studentScore;
    }

    return { score: totalScore, prioritySatisfied, priorityOneOrTwo, nonOneOrTwo, notAllRequired, unplaced: timetable.schedule.blocks.reduce((sum, a) => +sum + +a.missingStudents.length, 0) };
}

module.exports = router;