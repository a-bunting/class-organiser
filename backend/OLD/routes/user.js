const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const bcrypt = require('bcrypt');
const stringMethods = require('../methods/string');
const jwt = require('jsonwebtoken');
const userMethods = require('../methods/user');

const generateToken = (email, strId, id, remainLoggedIn) => {
  return jwt.sign({
      email: email, sid: strId, id: id
  }, process.env.SALT, { expiresIn: remainLoggedIn ? '7d' : '1h' });
}

router.get('/tokenCheck', (req, res, next) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    jwt.verify(token, process.env.SALT);
    res.status(200).json({ error: false, data: {}, message: `` })
  } catch(e) {
    res.status(200).json({ error: true, data: {}, message: `Authentication Failed - Invalid Token` })
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
    users.*,
    users__schools.name as schoolName,
    users__schools__admins.schoolId as adminSchoolId,
    GROUP_CONCAT(users__classes.name SEPARATOR ',') as classes,
    GROUP_CONCAT(users__classes__members.status SEPARATOR ',') as classStatus,
    GROUP_CONCAT(users__classes__members.classId SEPARATOR ',') as classId
    FROM users
    LEFT JOIN users__schools 					ON users__schools.id = users.schoolId
    LEFT JOIN users__classes__members	ON users__classes__members.userId = users.id
    LEFT JOIN users__classes 			    ON users__classes.id = users__classes__members.classId
    LEFT JOIN users__schools__admins  ON users__schools__admins.userId = users.id
    WHERE users.email='${email}'`;

  // hash the password to see what it matches in the db
  // get the user data to test if the password is true, and also get the admin details...
  db.query(query, (err, userDetails) => {
    console.log(userDetails);
    if(err) {
      // return 401, issue logging them in
      res.status(401).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.` })
    } else {
      // test the password
      bcrypt.compare(password, userDetails[0].password).then(correctPassword => {

        if(correctPassword) {

          const classNames = userDetails[0].classes.split(',');
          const classStatus = userDetails[0].classStatus.split(',');
          const classId = userDetails[0].classId.split(',');

          let classes = [];

          for(let i = 0 ; i < classNames.length ; i++) {
            classes.push({ name: classNames[i], status: classStatus[i], id: classId[i]});
          }

          const userData = {
            token: generateToken(userDetails[0].email, userDetails[0].strId, userDetails[0].id, remainLoggedIn),
            forename: userDetails[0].forename,
            surname: userDetails[0].surname,
            email: userDetails[0].email,
            strId: userDetails[0].strId,
            image: JSON.parse(userDetails[0].image)[0],
            school: { id: userDetails[0].schoolId, name: userDetails[0].schoolName, admin: userDetails[0].adminSchoolId && userDetails[0].adminSchoolId === userDetails[0].schoolId },
            classes
          };

            // successs
            console.log(`User ${userDetails[0].email} has logged in.`)
            res.status(200).json({ error: false, message: '', data: { ...userData } })
          } else {
              // return 401, issue logging them in
              res.status(200).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.` })
          }
          });
      }
  })
})

router.post('/register', (req, res, next) => {
  // pseudo registration whilst testing
  console.log(stringMethods.generateRandomString(30));

  bcrypt.hash('pies', 10, (err, hashPass) => {
    console.log(hashPass);
    res.status(200).json({ error: false, message: '', data: {  } })
  });
});

// selects NON USER data data, such as login and activity, not email, name etc
router.post('/updateAvatar', checkAuth, (req, res, next) => {
  const userData = userMethods.getUserDataFromToken(req);
  let data = req.body.avatar;
  data.background = '#6599FF';

  console.log(JSON.stringify(data));

  let query = `UPDATE users SET users.image = '[${JSON.stringify(data)}]' WHERE id = ${userData.id}`;

  console.log(query);

  db.query(query, (e, r) => {
    if(!e) {
      res.status(200).json({ error: false, message: '', data: {} })
    } else {
      res.status(400).json({ error: false, message: 'Unable to update avatar', data: {} })
    }
  })
});


// selects NON USER data data, such as login and activity, not email, name etc
router.get('/userData', checkAuth, (req, res, next) => {
  const userData = userMethods.getUserDataFromToken(req);

  let query = `
    SELECT
    GROUP_CONCAT(t2.time SEPARATOR ',') as accessLogs,
    users__classes__members.status, users__classes__members.joined, users__classes__members.classId,
    users__classes.name as className, users__classes.id as classId,
    GROUP_CONCAT(DISTINCT structure__courses.id SEPARATOR ',') as courseId, GROUP_CONCAT(DISTINCT structure__courses.name SEPARATOR ',') as courseName, GROUP_CONCAT(DISTINCT structure__courses.description SEPARATOR ',') as courseDesc, GROUP_CONCAT(DISTINCT structure__courses.level SEPARATOR ',') as courseLevel
    FROM
      users
    INNER JOIN (SELECT uid, time FROM users__access__logs WHERE uid = ${userData.id} LIMIT 5) as t2 ON t2.uid = users.id
    INNER JOIN users__classes__members ON users__classes__members.userId = users.id
    INNER JOIN users__classes ON users__classes.id = users__classes__members.classId
    INNER JOIN structure__courses ON structure__courses.id
        IN (SELECT courseId FROM users__course__access WHERE classId IN (SELECT classId FROM users__classes__members WHERE userId = ${userData.id}))
    WHERE
      users.id = ${userData.id}
    GROUP BY users__classes.id;

    SELECT t1.objId, t1.current, ROUND(AVG(t3.current), 2) as averageNew, ROUND(AVG(t2.current), 2) as averageOld
    FROM userdata__objectives t1
        LEFT JOIN userdata__objectives t2 ON t2.uId = 1 AND t1.objId = t2.objId AND t2.date < DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        LEFT JOIN userdata__objectives t3 ON t3.uId = 1 AND t1.objId = t3.objId AND t3.date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
    WHERE t1.uId  = ${userData.id}
    AND t1.date IN (SELECT max(t4.date) FROM userdata__objectives t4 WHERE (t4.objId = t1.objId) AND (t4.uId = t1.uId))
    GROUP BY objId;

    SELECT tasks.id as taskId, tasks.type, unix_timestamp(tasks.start) as start, unix_timestamp(tasks.end) as end, tasks.aim, tasks.aimValue, tasks.objCount, tasks.low, tasks.high, tasks.allObj, tasks.timeExpectation,
    tasks__set.id as setWorkId, tasks__set.objectives, tasks__set.attempts, tasks__set.complete,
    users.forename as madeByForename, users.surname as madeBySurname
    FROM tasks__set
    INNER JOIN tasks ON tasks.id = tasks__set.taskId
    INNER JOIN users ON users.id = tasks.ownerId
    WHERE tasks__set.userId = ${userData.id}
  `

  db.query(query, (e, r) => {


    let tasks = r[2].map(a => { return {
      id: a.setWorkId,
      type: a.type,
      task: { id: a.taskId, user: a.madeByForename + ' ' + a.madeBySurname },
      date: { start: a.start * 1000, end: a.end * 1000, timeExpectation: +a.timeExpectation },
      aim: { type: a.aim, value: a.aimValue, low: !!a.low, high: !!a.high, all: !!a.allObj },
      attempts: a.attempts,
      objectives: JSON.parse(a.objectives).map(b => { return +b }),
      completion: !!a.complete
    }})

    console.log(tasks.date);

    let data = { objectives: r[1], tasks, access: [], classes: []};

    if(r[0][0].accessLogs) { data.access = r[0][0].accessLogs.split(','); }

    for(let i = 0 ; i < r[0].length ; i++) {
      let newClass = {
        id: r[0][i].classId,
        name: r[0][i].className,
        course: {
          id: r[0][i].courseId,
          name: r[0][i].courseName,
          desc: r[0][i].courseDesc,
          level: r[0][i].courseLevel
        }
      }
      data.classes.push(newClass);
    }

    if(!e) {
      res.status(200).json({ error: false, message: '', data: data })
    } else {
      res.status(400).json({ error: true, message: 'Unable to collect dashboard data', data: e })
    }
  })

});

module.exports = router;
