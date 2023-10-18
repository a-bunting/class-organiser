const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const stringMethods = require('../methods/string');
const userMethods = require('../methods/user');
const googleExport = require('../exports/google-spreadsheet');

router.post('/gSheet', checkAuth, (req, res, next) => {

    const newSpreadsheet = googleExport.createNewSpreadsheet();

    res.status(200).json({ error: false, message: '', data: newSpreadsheet })

});

module.exports = router;