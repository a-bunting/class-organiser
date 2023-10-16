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
    res.status(200).json({ error: true, data: {}, message: `Authentication Failed - Invalid Token` })
  }
});

/**
* Logs in a user...
*/
router.post('/login', (req, res, next) => {

  console.log(`here`);

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
    if(err) {
      // return 401, issue logging them in
      res.status(401).json({ error: true, message: `There was an issue logging you in. Please check the credentials you supplied.` })
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

module.exports = router;
