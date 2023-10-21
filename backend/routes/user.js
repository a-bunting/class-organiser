const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const bcrypt = require('bcrypt');
const stringMethods = require('../methods/string');
const jwt = require('jsonwebtoken');
const userMethods = require('../methods/user');

const generateToken = (email, id, remainLoggedIn) => {
  return jwt.sign({
      email: email, id: id
  }, process.env.SALT, { expiresIn: remainLoggedIn ? '7d' : '1h' });
}

router.get('/tokenCheck', (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    jwt.verify(token, process.env.SALT);
    res.status(200).json({ error: false, data: {}, message: `` })
  } catch(e) {
    res.status(401).json({ error: true, data: {}, message: `Authentication Failed - Invalid Token` })
  }
});

/**
* Logs in a user...
*/
router.post('/login', (req, res, next) => {
    
  const email = req.body.email;
  const password = req.body.password;
  const remainLoggedIn = req.body.remainLoggedIn ? req.body.remainLoggedIn : req.body.remainLoggedIn ? req.body.remainLoggedIn : '7d';

  const query = `SELECT
    users.id, users.instituteId, users.forename, users.surname, users.email, users.joined, users.password,
    institutions.name AS instituteName
    FROM users
    INNER JOIN institutions ON users.instituteId = institutions.id
    WHERE users.email='${email}'`;

    // bcrypt stuff
    const saltRounds = 10;

  // hash the password to see what it matches in the db
  // get the user data to test if the password is true, and also get the admin details...
  db.query(query, (err, userDetails) => {
    console.log(userDetails);
    if(err || userDetails.length === 0) {
      // return 401, issue logging them in
      res.status(401).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.` })
    } else {
      // test the password
      bcrypt.compare(password, userDetails[0].password).then(correctPassword => {

        console.log(correctPassword);

        if(correctPassword) {

          const userData = {
            id: userDetails[0].id,
            token: generateToken(userDetails[0].email, userDetails[0].id, remainLoggedIn),
            name: {
              forename: userDetails[0].forename,
              surname: userDetails[0].surname,
            },
            email: userDetails[0].email,
            institute: { 
              id: userDetails[0].instituteId, 
              name: userDetails[0].instituteName 
            }
          };

          // successs
          console.log(`User ${userDetails[0].email} has logged in.`)
          res.status(200).json({ error: false, message: '', data: { ...userData } })
        
        } else {
            // return 401, issue logging them in
            res.status(401).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.` })
        }
          });
      }
  })
})

router.post('/saveTimetable', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const timetable = req.body.timetable;
    const deleted = req.body.deleted ?? { classes: [], courses: [], restrictions: [], students: [] };
    const scores = timetable.schedule.scores ? timetable.schedule.scores : [];
    const colors = timetable.colorPriority ? timetable.colorPriority : [];

    console.log(deleted);

    // break up the timetable into segmenets for the database;
    const code = timetable.code === "" ? stringMethods.generateRandomString(5) : timetable.code;
    const timetableQuery = `INSERT INTO timetable (dataCode, userId, name, rooms, blocks, scores, colors) VALUES (?) AS new_data ON DUPLICATE KEY UPDATE name = new_data.name, rooms = new_data.rooms, blocks = new_data.blocks, scores = new_data.scores, colors = new_data.colors`;
    const data = [code, userData.id, timetable.name, JSON.stringify(timetable.rooms), JSON.stringify(timetable.schedule.blocks), JSON.stringify(scores), JSON.stringify(colors)];
    // console.log(timetableQuery);

    db.query(timetableQuery, [data], (e, r) => {
        if(!e) {
            let compoundQuery = ``;
            // build the other parts of the database...
            const timetableId = timetable.id ?? r.insertId;

            // set up any relevant deletions
            if(deleted.classes.length > 0) {
                const query = `DELETE FROM timetable__classes WHERE id IN 
                                (SELECT id
                                    FROM (
                                        SELECT timetable__classes.id
                                        FROM timetable__classes 
                                        WHERE timetable__classes.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                                        AND timetable__classes.ttId = ${timetableId}
                                        AND timetable__classes.classId IN (${deleted.classes.join(',')})
                                    ) AS subquery
                                )`;
                compoundQuery += `${query};`;
            }

            if(deleted.courses.length > 0) {
                const query = `DELETE FROM timetable__courses WHERE id IN 
                                (SELECT id
                                    FROM (
                                        SELECT timetable__courses.id
                                        FROM timetable__courses 
                                        WHERE timetable__courses.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                                        AND timetable__courses.ttId = ${timetableId}
                                        AND timetable__courses.courseId IN (${deleted.courses.join(',')})
                                    ) AS subquery
                                )`;
                compoundQuery += `${query};`;
            }

            if(deleted.restrictions.length > 0) {
                const query = `DELETE FROM timetable__restrictions WHERE id IN 
                                (SELECT id
                                    FROM (
                                        SELECT timetable__restrictions.id
                                        FROM timetable__restrictions 
                                        WHERE timetable__restrictions.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                                        AND timetable__restrictions.ttId = ${timetableId}
                                        AND timetable__restrictions.restrictionId IN (${deleted.restrictions.join(',')})
                                    ) AS subquery
                                )`;
                compoundQuery += `${query};`;
            }

            if(deleted.students.length > 0) {
                const query = `DELETE FROM timetable__students WHERE id IN 
                                (SELECT id
                                    FROM (
                                        SELECT timetable__students.id
                                        FROM timetable__students 
                                        WHERE timetable__students.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                                        AND timetable__students.ttId = ${timetableId}
                                        AND timetable__students.studentId IN (${deleted.students.join(',')})
                                    ) AS subquery
                                )`;
                compoundQuery += `${query};`;
            }

            let clDb = [];
            let coDb = [];
            let reDb = [];
            let stDb = [];

            // classes
            for(let i = 0 ; i < timetable.classes.length ; i++) { clDb.push([timetableId, timetable.classes[i].id, timetable.classes[i].teacher]) }
            // courses
            for(let i = 0 ; i < timetable.courses.length ; i++) { coDb.push([timetableId, timetable.courses[i].id, timetable.courses[i].name, timetable.courses[i].classSize, timetable.courses[i].requirement.required, timetable.courses[i].requirement.times]) }
            // restrictions
            for(let i = 0 ; i < timetable.restrictions.length ; i++) { reDb.push([timetableId, timetable.restrictions[i].id, timetable.restrictions[i].name, timetable.restrictions[i].description, JSON.stringify(timetable.restrictions[i].options), timetable.restrictions[i].poll ]) }
            // students
            for(let i = 0 ; i < timetable.students.length ; i++) { stDb.push([timetableId, timetable.students[i].id, timetable.students[i].classId, timetable.students[i].name.forename, timetable.students[i].name.surname, timetable.students[i].email ?? '', JSON.stringify(timetable.students[i].data), JSON.stringify(timetable.students[i].coursePriorities)]) }

            let argArray = [];

            if(clDb.length > 0) { compoundQuery += `INSERT INTO timetable__classes (ttId, classId, teacher) VALUES ? as new_data ON DUPLICATE KEY UPDATE teacher = new_data.teacher;`; argArray.push(clDb); }
            if(coDb.length > 0) { compoundQuery += `INSERT INTO timetable__courses (ttId, courseId, name, classSize, required, times) VALUES ? as new_data ON DUPLICATE KEY UPDATE name = new_data.name, classSize = new_data.classSize, required = new_data.required, times = new_data.times;`; argArray.push(coDb); }
            if(reDb.length > 0) { compoundQuery += `INSERT INTO timetable__restrictions (ttId, restrictionId, name, description, options, pollInclude) VALUES ? as new_data ON DUPLICATE KEY UPDATE name = new_data.name, description = new_data.description, options = new_data.options, pollInclude = new_data.pollInclude; `; argArray.push(reDb); }
            if(stDb.length > 0) { compoundQuery += `INSERT INTO timetable__students (ttId, studentId, classId, forename, surname, email, data, priorities) VALUES ? as new_data ON DUPLICATE KEY UPDATE classId = new_data.classId, forename = new_data.forename, surname = new_data.surname, email = new_data.email, data = new_data.data, priorities = new_data.priorities; `; argArray.push(stDb); }

            if(compoundQuery !== '') {
                db.query(compoundQuery, argArray, (e, rAll) => {
                    if(!e) {
                        res.status(200).json({ error: false, message: ``, data: { id: timetableId, code } })
                    } else {
                        console.log(e);
                        res.status(400).json({ error: true, message: `Unable to save timetable components.`, data: {} })
                    }
                })
            } else {
                res.status(200).json({ error: false, message: ``, data: { id: timetableId, code } })
            }
        } else {
            console.log(e);
            res.status(400).json({ error: true, message: `Unable to save timetable.`, data: {} })
        }
    })
});

router.post('/deleteClass', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const ttId = req.body.ttId;
    const classId = req.body.classId;

    const query = `DELETE FROM timetable__classes WHERE id IN 
        (SELECT id
            FROM (
                SELECT timetable__classes.id
                FROM timetable__classes 
                WHERE timetable__classes.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                AND timetable__classes.ttId = ${ttId}
                AND timetable__classes.classId IN ${classId}
            ) AS subquery
        )`;
    
    db.query(query, (e, r) => {
        if(!e) {
            res.status(200).json({ error: false, message: ``, data: {} })
        } else {
            res.status(400).json({ error: true, message: `Unable to delete class.`, data: {} })
        }
    })
})

router.post('/emailEnquiry', (req, res, next) => {
    const email = req.body.from;
    const message = req.body.message;
    
    import('emailjs').then(({ SMTPClient }) => {

        try {
            const client = new SMTPClient({
                user: process.env.SMTP_USER, 
                password: process.env.SMTP_PASSWORD, 
                host: process.env.SMTP_HOST, 
                port: process.env.SMTP_PORT,
                ssl: true,
            })

            client.send({
                text: message,
                from: email, 
                to: process.env.MY_EMAIL, 
                subject: 'Class Organiser Enquiry'
            }, 
            (err, message) => {
                if(err) {
                    console.log(err);
                    res.status(400).json({ error: true, message, data: { } })
                } else {
                    console.log(message);
                    res.status(200).json({ error: false, message, data: { } })
                }
            })
        } catch (e) {
            console.log(`email could not be sent due to ssl stuff probs`);
        }
    
    })

});

module.exports = router;
