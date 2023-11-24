// check sif a token is attached...
// validate token...
const jwt = require('jsonwebtoken');
const db = require('../database');
const userMethods = require('../methods/user');

// middleware simple returns a function...
module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const userData = userMethods.getUserDataFromToken(req);
        jwt.verify(token, process.env.SALT);

        const query = `SELECT COUNT(*) AS cnt, id FROM users WHERE id="${userData.id}" AND email="${userData.email}"`;

        db.query(query, (e, result) => {
          if(result[0].cnt === 1) {
            // req.body['uidNumeric'] = result[0].id;
            next();
          } else {
            // more than one result. Broke. My problem probably.
            res.status(200).json({
              error: true,
              data: {},
              message: `Authentication Failed - Multiple Users Authenticated! Server issue, please try again.`
          })
          }
        });

        // next();
    } catch (error) {
        res.status(200).json({
            error: true,
            data: {},
            message: `Authentication Failed - No Token: ${error}`
        })
    }
}
