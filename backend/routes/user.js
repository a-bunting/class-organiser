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
  
  console.log(email, password, query);
  // bcrypt stuff
    const saltRounds = 10;

  // hash the password to see what it matches in the db
  // get the user data to test if the password is true, and also get the admin details...
  db.query(query, (err, userDetails) => {
    if(err || userDetails.length === 0) {
      // return 401, issue logging them in
      console.log(err);
      res.status(401).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.`, data: err })
    } else {
      // test the password
      bcrypt.compare(password, userDetails[0].password).then(correctPassword => {

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

          let stats = req.stats;
          stats.userLoggedIn(userData);

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

router.get('/logout', (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    let stats = req.stats;
    stats.userLoggedOut(userData.id);
    userMethods.setInvalidToken(req.headers.authorization.split(" ")[1]);
    res.status(200).json({ error: false, message: '', data: {} })
});

router.post('/joinList', (req, res, next) => {
    const email = req.body.email;
    const verificationCode = stringMethods.generateRandomString(10);
    const subject = `SmartSort Mailing List - Verify your Email`;
    const htmlMessage = `
    <p>Dear user,</p> 

    <p>Thank you for signing up to the SmartSort mailing list. To verify your email address please click on the link below.</p>
    
    <a href="https://www.smartsort.org/#/verify/${email}&${verificationCode}">Verify your email</a>
    
    <p>Yours kindly,</p>
    <p>Alex</p>`;
    const textMessage = `
    Dear user, 

    Thank you for signing up to the SmartSort mailing list. To verify your email address please click on the link below.
    
    https://www.smartsort.org/#/verify/${email}&${verificationCode}
    
    Yours kindly,
    Alex`;
    
    
    const query = `INSERT INTO mailList (email, code) VALUES (?) ON DUPLICATE KEY UPDATE code = VALUES(code)`;
    
    console.log(email, verificationCode, query);

    db.query(query, [[email, verificationCode]], (e, r) => {
        if(!e) {
            // send the verification email
            userMethods.sendEmail(email, subject, textMessage, htmlMessage)
            .then((result) => { res.status(200).json({ error: false, message: '', data: { emailSent: result} }) })
            .catch((e) => { res.status(400).json({ error: true, message: e, data: {} }) });
        } else {
            console.log(e);
            res.status(400).json({ error: true, message: '', data: {} })
        }
    })

});

router.post('/verifyEmail', (req, res, next) => {
    const email = req.body.email;
    const code = req.body.code;

    const query = `UPDATE mailList SET code = '', verified = 1 WHERE email = ? AND code = ?`;

    db.query(query, [email, code], (e, r) => {
        console.log(e, r);
        if(!e) {
            if(r.affectedRows === 1) {
                res.status(200).json({ error: false, message: '', data: { complete: true } });
            } else {
                res.status(200).json({ error: false, message: '', data: { complete: false } });
            }
        }
        else res.status(400).json({ error: true, message: '', data: {} })
    })

    
});

router.post('/lockTimetable', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const ttId = req.body.ttId;
    const lock = req.body.lock;

    const query = `UPDATE timetable SET locked = ${lock} WHERE id = ${ttId} and userId = ${userData.id}`;

    db.query(query, (e, r) => {
        if(!e) {
            res.status(200).json({ error: false, message: '', data: { } })
        } else {
            res.status(400).json({ error: true, message: `Unable to alter lock`, data: {} })
        }
    })
});

router.post('/deleteTimetable', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const ttId = req.body.ttId;

    console.log(`deleting timetable ${ttId} for user ${userData.id}`);

    const query = `
    
    DELETE FROM timetable__classes WHERE id IN 
            (SELECT id FROM (
                SELECT timetable__classes.id
                FROM timetable__classes 
                WHERE timetable__classes.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                AND timetable__classes.ttId = ${ttId}
                ) AS subquery
                );
                
                DELETE FROM timetable__courses WHERE id IN 
                (SELECT id FROM (
                SELECT timetable__courses.id
                FROM timetable__courses 
                WHERE timetable__courses.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                AND timetable__courses.ttId = ${ttId}
                ) AS subquery
        );

        DELETE FROM timetable__restrictions WHERE id IN 
        (SELECT id FROM (
                SELECT timetable__restrictions.id
                FROM timetable__restrictions 
                WHERE timetable__restrictions.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                AND timetable__restrictions.ttId = ${ttId}
                ) AS subquery
                );
                
        DELETE FROM timetable__students WHERE id IN 
            (SELECT id FROM (
                SELECT timetable__students.id
                FROM timetable__students 
                WHERE timetable__students.ttId IN (SELECT timetable.id FROM timetable WHERE userId = ${userData.id})
                AND timetable__students.ttId = ${ttId}
                ) AS subquery
            );
        
            DELETE FROM timetable WHERE id = ${ttId};
    `;

    db.query(query, (e, r) => {
        if(!e) {
            res.status(200).json({ error: false, message: '', data: { } })
        } else {
            res.status(400).json({ error: true, message: `Unable to delete`, data: {} })
        }
    })
});

router.post('/saveTimetable', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const timetable = req.body.timetable;
    const deleted = req.body.deleted ?? { classes: [], courses: [], restrictions: [], students: [] };
    const scores = timetable.schedule.scores ? timetable.schedule.scores : [];
    const colors = timetable.colorPriority ? timetable.colorPriority : [];

    // break up the timetable into segmenets for the database;
    const code = timetable.code === "" ? stringMethods.generateRandomString(5) : timetable.code;
    const timetableQuery = `INSERT INTO timetable (dataCode, saveCode, sortMethod, studentPriorityCount, shuffle, userId, name, rooms, blocks, scores, colors) VALUES (?) ON DUPLICATE KEY UPDATE name = VALUES(name), saveCode = VALUES(saveCode), sortMethod = VALUES(sortMethod), studentPriorityCount = VALUES(studentPriorityCount), shuffle = VALUES(shuffle), rooms = VALUES(rooms), blocks = VALUES(blocks), scores = VALUES(scores), colors = VALUES(colors)`;
    const data = [code, timetable.saveCode, timetable.sortMethod, timetable.studentPriorityCount, timetable.shuffleStudents ?? 0, userData.id, timetable.name, JSON.stringify(timetable.rooms), JSON.stringify(timetable.schedule.blocks), JSON.stringify(scores), JSON.stringify(colors)];

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
            for(let i = 0 ; i < timetable.classes.length ; i++) { clDb.push([timetableId, timetable.classes[i].id, timetable.classes[i].teacher ? timetable.classes[i].teacher : 'Unnamed Teacher']) }
            // courses
            for(let i = 0 ; i < timetable.courses.length ; i++) { coDb.push([timetableId, timetable.courses[i].id, timetable.courses[i].name ? timetable.courses[i].name : 'New Course', timetable.courses[i].classSize, timetable.courses[i].requirement.required, timetable.courses[i].requirement.times]) }
            // restrictions
            for(let i = 0 ; i < timetable.restrictions.length ; i++) { reDb.push([timetableId, timetable.restrictions[i].id, timetable.restrictions[i].name, timetable.restrictions[i].description, JSON.stringify(timetable.restrictions[i].options), timetable.restrictions[i].poll ]) }
            // students
            for(let i = 0 ; i < timetable.students.length ; i++) { stDb.push([timetableId, timetable.students[i].id, timetable.students[i].classId, timetable.students[i].name.forename, timetable.students[i].name.surname, timetable.students[i].email ?? '', JSON.stringify(timetable.students[i].data), JSON.stringify(timetable.students[i].coursePriorities.length > 0 ? timetable.students[i].coursePriorities : []), JSON.stringify(timetable.students[i].studentPriorities.length > 0 ? timetable.students[i].studentPriorities : [])]) }

            let argArray = [];

            if(clDb.length > 0) { compoundQuery += `INSERT INTO timetable__classes (ttId, classId, teacher) VALUES ? ON DUPLICATE KEY UPDATE teacher = VALUES(teacher);`; argArray.push(clDb); }
            if(coDb.length > 0) { compoundQuery += `INSERT INTO timetable__courses (ttId, courseId, name, classSize, required, times) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), classSize = VALUES(classSize), required = VALUES(required), times = VALUES(times);`; argArray.push(coDb); }
            if(reDb.length > 0) { compoundQuery += `INSERT INTO timetable__restrictions (ttId, restrictionId, name, description, options, pollInclude) VALUES ? ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), options = VALUES(options), pollInclude = VALUES(pollInclude); `; argArray.push(reDb); }
            if(stDb.length > 0) { compoundQuery += `INSERT INTO timetable__students (ttId, studentId, classId, forename, surname, email, data, priorities, studentPriorities) VALUES ? ON DUPLICATE KEY UPDATE classId = VALUES(classId), forename = VALUES(forename), surname = VALUES(surname), email = VALUES(email), data = VALUES(data), priorities = VALUES(priorities), studentPriorities = VALUES(studentPriorities); `; argArray.push(stDb); }

            if(compoundQuery !== '') {
                db.query(compoundQuery, argArray, (e, rAll) => {
                    if(!e) {
                        res.status(200).json({ error: false, message: ``, data: { id: timetableId, code, saveCode: timetable.saveCode } })
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

router.post('/getTimetable', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const ttId = req.body.ttId;

    const query = `
    SELECT
    timetable.id, timetable.dataCode, timetable.saveCode, timetable.sortMethod, timetable.studentPriorityCount, timetable.shuffle, timetable.locked, timetable.name, timetable.rooms, timetable.blocks, timetable.scores, timetable.colors,
    GROUP_CONCAT(DISTINCT CONCAT(timetable__classes.classId, "|", timetable__classes.teacher) SEPARATOR '$') as classes,
    GROUP_CONCAT(DISTINCT CONCAT(timetable__courses.courseId, "|", timetable__courses.name, "|", timetable__courses.classSize, "|", timetable__courses.required, "|", timetable__courses.times) SEPARATOR '$') as courses,
    GROUP_CONCAT(DISTINCT CONCAT(timetable__restrictions.restrictionId, "|", timetable__restrictions.name, "|", timetable__restrictions.description, "|", timetable__restrictions.options, "|", timetable__restrictions.pollInclude) SEPARATOR '$') as restrictions
    FROM
    timetable
    LEFT JOIN timetable__classes ON timetable__classes.ttId = timetable.id
    LEFT JOIN timetable__courses ON timetable__courses.ttId = timetable.id
    LEFT JOIN timetable__restrictions ON timetable__restrictions.ttId = timetable.id
    WHERE 
    timetable.id = ${ttId} AND timetable.userId = ${userData.id}
    GROUP BY timetable.id;

    SELECT * FROM timetable__students WHERE timetable__students.ttId IN 
	(SELECT id
		FROM ( SELECT timetable.id FROM timetable WHERE timetable.userId = ${userData.id}) AS subquery
	)
    AND timetable__students.ttId = ${ttId}    
    `

    db.query(query, (e, r) => {
        if(!e) {
            
            let classes = r[0][0].classes === null ? [] : r[0][0].classes.split('$').map(a => {
                let data = a.split('|');
                return { id: +data[0], teacher: data[1] }
            })
            let courses = r[0][0].courses === null ? [] : r[0][0].courses.split('$').map(a => {
                let data = a.split('|');
                return { id: +data[0], name: data[1], classSize: +data[2], requirement: { required: +data[3] === 0 ? false : true, times: +data[4] } }
            })
            let restrictions = r[0][0].restrictions === null ? [] : r[0][0].restrictions.split('$').map(a => {
                let data = a.split('|');
                return { id: +data[0], name: data[1], description: data[2], options: JSON.parse(data[3]), poll: +data[4] === 0 ? false : true }
            })
            let students = r[1].length === 0 ? [] : r[1].map(a => {
                return {
                    id: a.studentId, 
                    classId: a.classId, 
                    email: a.email, 
                    name: { forename: a.forename, surname: a.surname },
                    data: JSON.parse(a.data),
                    coursePriorities: JSON.parse(a.priorities),
                    studentPriorities: JSON.parse(a.studentPriorities)
                }
            })

            let blocks = JSON.parse(r[0][0].blocks) ?? [];
            let scores = JSON.parse(r[0][0].scores) ?? [];
            let colors = JSON.parse(r[0][0].colors) ?? [];
            let rooms = JSON.parse(r[0][0].rooms) ?? [];

            let foundTimetable = {
                id: r[0][0].id,
                saveCode: r[0][0].saveCode,
                name: r[0][0].name, 
                code: r[0][0].dataCode,
                classes: classes,
                schedule: { blocks: blocks, scores: scores },
                courses: courses,
                restrictions: restrictions,
                students: students,
                locked: r[0][0].locked, 
                rooms: rooms,
                colorPriority: colors,
                studentPriorityCount: r[0][0].studentPriorityCount,
                studentShuffle: r[0][0].shuffle, 
                sortMethod: r[0][0].sortMethod
            }
            res.status(200).json({ error: false, message: ``, data: foundTimetable })

        } else {
            console.log(e);
            res.status(400).json({ error: true, message: ``, data: {} })
        }
    })
})

router.get('/getList', checkAuth, (req, res, next) => {
    const userData = userMethods.getUserDataFromToken(req);
    const query = `SELECT id, saveCode, name FROM timetable WHERE userId = ${userData.id}`;

    db.query(query, (e, r) => {
        if(!e) {
            res.status(200).json({ error: false, message: ``, data: r })
        } else {
            console.log(e);
            res.status(400).json({ error: true, message: `Unable to find users timetables`, data: {} })  
        }
    })

})


router.post('/emailEnquiry', (req, res, next) => {
    const message = req.body.message;
    const subject = `SmartSort Interest Submission`;
    const textMessage = `
        SmartSort Interest Submission:
        ---------------
        ${message}
        ---------------
    `;
    const htmlMessage = `
        SmartSort Interest Submission:
        ---------------
        ${message}
        ---------------
    `;
    
    userMethods.sendEmail('alex.bunting@gmail.com', subject, textMessage, htmlMessage)
    .then((result) => { res.status(200).json({ error: false, message: '', data: { emailSent: result} }) })
    .catch((e) => { res.status(400).json({ error: true, message: e, data: {} }) });

});

router.post('/emailMessage', (req, res, next) => {
    const message = req.body.message;
    const subject = `SmartSort Message`;
    const textMessage = `
        SmartSort Message from ${req.body.from}:
        ---------------
        ${message}
        ---------------
    `;
    const htmlMessage = `
        SmartSort Message from ${req.body.from}:
        ---------------
        ${message}
        ---------------
    `;
    
    userMethods.sendEmail('alex.bunting@gmail.com', subject, textMessage, htmlMessage)
    .then((result) => { res.status(200).json({ error: false, message: '', data: { emailSent: result} }) })
    .catch((e) => { res.status(400).json({ error: true, message: e, data: {} }) });

});


router.post('/getSaveCode', checkAuth, (req, res, next) => {
    const ttId = req.body.ttId;
    const query = `SELECT saveCode FROM timetable WHERE id = ?`;

    db.query(query, [ttId], (e, r) => {
        if(!e) {
            res.status(200).json({ error: false, message: ``, data: { code: r[0].saveCode } })
        } else {
            console.log(e);
            res.status(400).json({ error: true, message: `Unable to get new savecode`, data: {} })  
        }
    }) 
});

module.exports = router;