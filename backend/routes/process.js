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

  res.status(200).json({ error: false, message: '', data: {  } })
});

module.exports = router;
