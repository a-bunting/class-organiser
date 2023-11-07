const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const stringMethods = require('../methods/string');
const userMethods = require('../methods/user');
const googleExport = require('../exports/google-spreadsheet');

router.post('/get', (req, res, next) => {
    const code = req.body.code;

    if(!code) {
        res.status(400).json({ error: true, message: '', data: { codeCorrect: false } });
        return;
    }

    const query = `
        SELECT 
        timetable.id, timetable.name, timetable.studentPriorityCount,
        GROUP_CONCAT(
            DISTINCT CONCAT(timetable__classes.classId, "|", timetable__classes.teacher) 
            SEPARATOR '$'
        ) AS classes,
        GROUP_CONCAT(
            DISTINCT CONCAT(timetable__courses.courseId, "|",timetable__courses.name)
            SEPARATOR '$'
        ) AS courses,
        GROUP_CONCAT(
            DISTINCT CONCAT(timetable__restrictions.restrictionId, "|", timetable__restrictions.name, "|", timetable__restrictions.description, "|", timetable__restrictions.options)
            SEPARATOR '$'
        ) as restrictions,
        GROUP_CONCAT(
            DISTINCT CONCAT(timetable__students.studentId, "|", timetable__students.forename, "|", timetable__students.surname)
            SEPARATOR '$'
        ) as students
        FROM timetable
        LEFT JOIN timetable__classes ON timetable__classes.ttId = timetable.id
        LEFT JOIN timetable__courses ON timetable__courses.ttId = timetable.id AND timetable__courses.required = 0 AND timetable.sortMethod != 1
        LEFT JOIN timetable__restrictions ON timetable__restrictions.ttId = timetable.id AND timetable__restrictions.pollInclude = 1
        LEFT JOIN timetable__students ON timetable__students.ttId = timetable.id AND timetable.sortMethod > 0
        WHERE timetable.dataCode = '${code}'
        GROUP BY timetable.id
    `;

    db.query(query, (e, r) => {
        if(!e && r.length > 0) {
            try {
                let timetableId = r[0].id;
                let classes = !r[0].classes ? [] : r[0].classes.split('$').map(a => {
                    let components = a.split('|');
                    return { id: +components[0], teacher: components[1] }
                })
                let courses = !r[0].courses ? [] : r[0].courses.split('$').map(a => {
                    let components = a.split('|');
                    return { id: +components[0], name: components[1] }
                })
                let restrictions = !r[0].restrictions ? [] : r[0].restrictions.split('$').map(a => {
                    let components = a.split('|');
                    return { id: +components[0], name: components[1], description: components[2], options: JSON.parse(components[3]) }
                })
                let students = !r[0].students ? [] : r[0].students.split('$').map(a => {
                    let components = a.split('|');
                    return { id: +components[0], name: { forename: components[1], surname: components[2] } }
                })
                let studentPriorityCount = students.length > 0 ? r[0].studentPriorityCount : 0;

                courses.sort((a, b) => { return a.name.localeCompare(b.name) });
                students.sort((a, b) => { return a.name.forename.localeCompare(b.name.forename) });

                let survey = { id: +timetableId, studentPriorityCount, name: r[0].name, classes, courses, restrictions, students }

                res.status(200).json({ error: false, message: '', data: survey })
            } catch(e) {
                res.status(400).json({ error: true, message: '', data: { codeCorrect: true } })
            }
        } else {
            console.log(e);
            res.status(400).json({ error: true, message: '', data: { codeCorrect: false } })
        }
    })

});

router.post('/save', (req, res, next) => {
    const code = req.body.code;
    const ttId = req.body.ttId;
    const student = req.body.student;
    const newSid = req.body.student.id === -1 ? true : false;

    const query = `
        SELECT id, locked FROM timetable WHERE dataCode = '${code}';
        SELECT COALESCE(max(studentId), maxid + 1) AS NextAvailableId
        FROM timetable__students CROSS JOIN
            (SELECT MAX(id) AS maxid FROM timetable__students) x
        WHERE ttId = ${ttId}
    `
    db.query(query, (e, r) => {
        if(!e && r[0][0].id === ttId) {
            if(r[0][0].locked === 0) {
                const insertQuery = `
                    INSERT INTO timetable__students
                    (ttId, studentId, classId, forename, surname, email, data, priorities, studentPriorities)
                    VALUES
                    (?) as new_data
                    ON DUPLICATE KEY UPDATE
                    forename = new_data.forename, surname = new_data.surname, data = new_data.data, priorities = new_data.priorities, studentPriorities = new_data.studentPriorities
                `;

                const nextId = +r[1][0].NextAvailableId + 1;
                
                db.query(insertQuery, [[r[0][0].id, newSid ? nextId : req.body.student.id, student.classId, student.name.forename, student.name.surname, student.email, JSON.stringify(student.data), JSON.stringify(student.coursePriorities), JSON.stringify(student.studentPriorities)]], (e2, r2) => {
                    console.log(r2); // check to see whether to run update or add
                    
                    if(!e2) {
                        let stats = req.stats;
                        stats.addSurveyData(code);
                        res.status(200).json({ error: false, message: '', data: { id: nextId } })
                    } else {
                        res.status(400).json({ error: true, message: 'Unable to add data.', data: { codeCorrect: true } })
                    }
                })
            } else {
                res.status(400).json({ error: true, message: 'Data for this course is locked.', data: { codeCorrect: true, locked: true } })
            }      
        } else {
            res.status(400).json({ error: true, message: 'Unable to find timetable with this code.', data: { codeCorrect: false } })
        }
    })
})

module.exports = router;