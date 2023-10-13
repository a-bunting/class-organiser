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

router.post('/timetable', (req, res, next) => {
    const timetable = req.body.timetable;
    process(timetable, res);
});

router.post('/selectSavedItem', (req, res, next) => {
    const selectionId = req.body.selectionId;
    const code = req.body.code;

    let data = savedData.find(a => a.code === code && a.index === selectionId);
    
    if(data) {
        res.status(200).json({ error: false, message: '', data: data.data })
    } else {
        res.status(400).json({ error: true, message: 'Couldnt find your saved data', data: {} })
    }
});

async function process(timetable, res) {
    // run the processor then return the results.
    const result = await geneticProcessor(timetable);
    // const result = await runTest(timetable);
    res.status(200).json({ error: false, message: '', data: result })
}

function geneticProcessor(timetable) {
    return new Promise((resolve) => {
        // do the stuff
        // first make a bunch of different versions of the schedule, shuffling the students each time.
        const MAX_ITERATIONS = 2000;
        const PRIORITY_SCORING = [200, 100, 25, 20, 15, 10, 5, 4, 3, 2, 1];
        const MAX_THEORETICAL_SCORE = timetable.schedule.blocks.length * 100 + PRIORITY_SCORING.filter((a, i) => i < timetable.students[0].coursePriorities.filter(a => a.priority !== 0).length).reduce((part, a) => part + a, 0) * timetable.students.length;
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
            let scores = getFitnessRating(timetableProcessed, PRIORITY_SCORING);

            // test to see if there is a perfect fit, if so end
            if((scores.score / MAX_THEORETICAL_SCORE) >= 1) {
                resolve({ timetable: timetableProcessed, scores })
            } else {
                generatedSchedules.push({ scores , blocks: timetableProcessed.schedule.blocks });
            }

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
        let statistics = []

        // print out the best three
        generatedSchedules.forEach((a, i) => {
            // do the stats
            let stats = { nonOneOrTwo: a.scores.nonOneOrTwo, unplaced: a.blocks.reduce((sum, a) => +sum + +a.missingStudents.length, 0), missed: a.scores.nonOneOrTwo.length, oneTwo: ((a.scores.priorityOneOrTwo / studentList.length)).toFixed(2) * 100, one: ((a.scores.prioritySatisfied[0] / studentList.length)).toFixed(2) * 100, two: ((a.scores.prioritySatisfied[1] / studentList.length)).toFixed(2) * 100, three: ((a.scores.prioritySatisfied[2] / studentList.length)).toFixed(2) * 100, four: ((a.scores.prioritySatisfied[3] / studentList.length)).toFixed(2) * 100}
            // sort the blocks properly as intended
            a.blocks.map(a => { return a.blocks.sort((a, b) => +a.id - +b.id ) });
            a.blocks.sort((a, b) => +a.order - +b.order);
            // strip out the data used by the backend but not part of the front end.
            timetable.students.map((b => { return { id: b.id, classId: b.classId, name: b.name, data: b.data, coursePriorities: b.coursePriorities }}));
            // save the data to be retrieved
            statistics.push({ index: i, stats });
            // add to saved data
            savedData.push({ code, index: i, data: { ...timetable, schedule: a }});
            // log to node console
            console.log(`(${i+1}) Total score: ${a.scores.score} - 1st or 2nd (${((a.scores.priorityOneOrTwo / studentList.length)).toFixed(2) * 100}%, ${a.scores.nonOneOrTwo.length} missed out), 1st Prio (${((a.scores.prioritySatisfied[0] / studentList.length)).toFixed(2) * 100}%), 2nd Prio (${((a.scores.prioritySatisfied[1] / studentList.length)).toFixed(2) * 100}%), 3rd Prio (${((a.scores.prioritySatisfied[2] / studentList.length)).toFixed(2) * 100}%), Missing students (${stats.unplaced})`);
        })

        console.log(`Max score: ${MAX_THEORETICAL_SCORE}`);
        console.log(`Iterations: ${MAX_ITERATIONS}`);
        
        resolve({ code, statistics }); //finished properly
    })
}

function processTimetableBasedUponPriorityIterateOverPriority(timetable, iterationStudentList) {

    // individualise the blocks array for ease of use - implement this throughout later but used first as an appropriateness tester
    let blockList = timetable.schedule.blocks.map(a => { return a.blocks }).map((a,index) => { return [].concat(a.map(b => { return { block: b, timeBlockIndex: index }} )) }).flat();
    iterationStudentList = [...iterationStudentList].map(a => { return { ...a, timeBlocksFilled: []}});

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

            // test if the student already has something in this timeblock and if so fail it.
            // this breaks it - i am not sure why but it does so... I must account for it elsewhere?
            // let inTb = student.timeBlocksFilled.find(a => +a.timeBlockId === +blockWithCourse[i].timeBlockIndex);
            // if(inTb) { console.log(+blockWithCourse[i].timeBlockIndex, inTb); restrictionsTestFailed = true; break; }
            // if(inTb) { restrictionsTestFailed = true; break; }

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
            b.block.maxStudents = +foundCourse.classSize;
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



    // what we need is a list of items to run through in order, which is all the students 1st priorities, then 2nd, then 3rd etc.
    let priorityListed = [ ...timetable.courses.map((a, i) => { return { priority: i, list: []}}) ];

    // iterate over the students to assign their priorities intot he right places
    for(let i = 0 ; i < iterationStudentList.length ; i++) {
        for(let o = 0 ; o < iterationStudentList[i].coursePriorities.length ; o++) {
            let listing = priorityListed.find(a => +a.priority === +iterationStudentList[i].coursePriorities[o].priority);
            let studentListing = { student: iterationStudentList[i], courseId: +iterationStudentList[i].coursePriorities[o].courseId };

            if(!listing) {
                priorityListed.push({ priority: +iterationStudentList[i].coursePriorities[o].priority, list: [studentListing]})
            } else {
                listing.list.push(studentListing);
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

    
    // for each timeblock add a list of students who are not assigned to any class
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

function getFitnessRating(timetable, PRIORITY_SCORING) {

    // score is based on priorities being matched.
    totalScore = 0;
    prioritySatisfied = [...Array(timetable.students[0].coursePriorities.length).keys()].map(a => {return 0});
    priorityOneOrTwo = 0;
    nonOneOrTwo = [];

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

    for(let i = 0 ; i < timetable.students.length ; i++) {
        // get non zero priorities
        let student = timetable.students[i];
        let studentPriorities = student.coursePriorities.filter(a => a.priority !== 0);
        let studentScore = 0;
        let firstOrSecond = false;

        for(let o = 0 ; o < studentPriorities.length ; o++) {
            let priority = studentPriorities[o];
            // find the blocks with this courses.
            let blocksWithCourse = blocks.filter(a => +a.selectedCourse === +priority.courseId);

            if(blocksWithCourse.length === 0) continue; // there are no blocks with this, so they dont have it

            for(let p = 0 ; p < blocksWithCourse.length ; p++) {
                let studentInCourse = blocksWithCourse[p].students.includes(+student.id);

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

    return { score: totalScore, prioritySatisfied, priorityOneOrTwo, nonOneOrTwo };
}

// function breedAndMutate(parentTimetables) {

//   const BREEDING_RATIO = 0.3;

//   let availableTimetables = parentTimetables.map((a, i) => { return +i });
//   let parentPairs = [];

//   // make some parent timetable pairs
//   while(availableTimetables.length >= 2) {
//     let parent1 = availableTimetables.splice(Math.floor(Math.random() * availableTimetables.length), 1);
//     let parent2 = availableTimetables.splice(Math.floor(Math.random() * availableTimetables.length), 1);

//     // do we allow inbreeding? An intersting extra maybe!
//     if(parent1 && parent2) {
//       parentPairs.push({ parent1: parentTimetables[parent1[0]], parent2: parentTimetables[parent2[0]]});
//     }
//   }

//   // find the ids of the timeblocks which have random stuff going on in them
//   let allowableBlocksToBreed = [];
//   let children = [];

//   // now we breed them, by mixing up some of the timeblocks which have optional stuff in them
//   for(let i = 0 ; i < parentPairs.length - 1 ; i++) {
//     let p1Switch = [];
//     let p2Switch = [];

//     if(Math.random() > BREEDING_RATIO) {
//         // add the adults back and continue onto the next pair
//         children.push(parentPairs[i].parent1);
//         children.push(parentPairs[i].parent2);
//         continue; 
//     }// no offspring for these
    
//     for(let o = 0 ; o < parentPairs[i].parent1.length ; o++) {
//         // assumption is they are the same lenght! Can a cat breed with a frog?
//         let timeBlockP1 = parentPairs[i].parent1.map((a,i) => { 
//             let blockNumber = a.blocks.filter(b => b.courses.length > 0 && !b.classOnly).length;

//             if(blockNumber > 0) return i;
//         }).filter(a => a !== undefined).sort((a, b) => Math.random() - 0.5);

//         let timeBlockP2 = parentPairs[i].parent2.map((a,i) => { 
//             let blockNumber = a.blocks.filter(b => b.courses.length > 0 && !b.classOnly).length;

//             if(blockNumber > 0) return i;
//         }).filter(a => a !== undefined).sort((a, b) => Math.random() - 0.5);

        
//         allowableBlocksToBreed = timeBlockP1.map((a, i) => { return [a, timeBlockP2[i]] })
//         // console.log(timeBlockP1 + `can switch with ` + timeBlockP2 + ` so: ` + allowableBlocksToBreed);
//     }

//     // how many to switch
//     const howManyToSwitch = Math.floor(Math.random() * allowableBlocksToBreed.length);
//     // randomise the order
//     allowableBlocksToBreed = allowableBlocksToBreed.sort((a, b) => Math.random());
//     // make a child start as a copy of parent1
//     let child = JSON.parse(JSON.stringify(parentPairs[i].parent1));
    
//     // then switch in elements of parent2
//     for(let p = 0 ; p < howManyToSwitch ; p++) {
//         // console.log(`0: ${allowableBlocksToBreed[p][0]}, 1: ${allowableBlocksToBreed[p][1]}`)
//         child[+allowableBlocksToBreed[p][0]] = { ...parentPairs[i].parent2[+allowableBlocksToBreed[p][1]] };
//         // console.log(child[allowableBlocksToBreed[p][0]]);
//     }

//     child = mutateChild(child);
//     children.push(child);
//   }

//   return children;

// }

// function mutateChild(child) {

//     const MUTATION_FACTOR = 0.1;
//     let randomNumber = Math.random();

//     // only mutate a certain percent
//     if(randomNumber > MUTATION_FACTOR) return child;

//     // mutate depending upon the value
//     // just two for now, try more later!
//     if(randomNumber < 0.5) {

//     } else {

//     }

//     return child;

// }



function runTest(timetable) {
    return new Promise((resolve) => {
        let MAX_ITERATIONS_ARRAY = [1, 5, 10, 50, 100, 500, 1000, 2500, 5000, 10000, 15000, 20000, 50000];
        let averagesArray = [];
        const PRIORITY_SCORING = [200, 100, 25, 20, 15, 10, 5, 4, 3, 2, 1];
        
        for(let n = 0 ; n < MAX_ITERATIONS_ARRAY.length ;n++) {
            
            let iterationScore = 0;
            const MAX_ITERATIONS = MAX_ITERATIONS_ARRAY[n];
            
            for(let m = 0 ; m < 20 ; m++) {
                // run each 20 times
                // first make a bunch of different versions of the schedule, shuffling the students each time.
                
                let generatedSchedules = [];
                
                // this is what should be appended to each student. It is what is required of them by the organiser and takes no optional things into account.
                let requiredCourses = timetable.courses.map(a => { 
                    return { id: +a.id, timesLeft: +a.requirement.times, required: a.requirement.required } 
                }).filter(a => a !== undefined);
                
                const studentList = [...timetable.students.map(a => { return { ...a, requiredCourses }})];
                
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
                    let scores = getFitnessRating(timetableProcessed, PRIORITY_SCORING);
        
                    generatedSchedules.push({ scores , blocks: timetableProcessed.schedule.blocks });
        
                    // every 500 iterations reduce the generated schedules to the top 500
                    // if this ever goes full genetic this will need to be removed for breeding purposes
                    if(a % 500 === 0) {
                        generatedSchedules = generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score).filter((a,i) => i < 5);
                    }
                }
        
                generatedSchedules = generatedSchedules.sort((a, b) => +b.scores.score - +a.scores.score).filter((a, i) => i === 1);

                // print out the best three
                generatedSchedules.forEach((a, i) => { iterationScore += a.scores.score; })
            }

            iterationScore = iterationScore / 10;
            averagesArray.push({ iterations: MAX_ITERATIONS_ARRAY[n], averageScore: iterationScore});
        }
        
        console.log(averagesArray);
        resolve({ averagesArray }); //finished properly
    })
}


module.exports = router;