const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const db = require('../database');
const stringMethods = require('../methods/string');
const userMethods = require('../methods/user');
const googleExport = require('../exports/google-spreadsheet');

router.post('/gSheet', checkAuth, (req, res, next) => {
    googleSheetExport(res, req);    
});

async function googleSheetExport(res, req) {
    // run the processor then return the results.
    const timetable = req.body.timetable;
    const newSpreadsheet = await googleExport.createNewSpreadsheet(timetable);
    res.status(200).json({ error: false, message: '', data: newSpreadsheet })
}


module.exports = router;