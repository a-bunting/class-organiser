// const cors = require("cors");
const express = require('express');
const Stats = require('./objects/stats');
const bodyParser = require('body-parser');
const app = express();

// app.options("*", (req, res, next) => {
//     res.header('Access-Control-Allow-Origin', '*');
//     res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
//     res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');        
//     res.sendStatus(200).end();
// });

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    next();
});

// begin the stats logs
const stats = new Stats();
stats.initiateStatistics();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const userRoutes = require('./routes/user');
const exportRoutes = require('./routes/export');
const processingRoutes = require('./routes/process');
const surveyRoutes = require('./routes/survey');

// add the stats module to the request so its available to all routes.
app.use((req, res, next) => { req['stats'] = stats; next(); })

// all the various api calls...
app.use("/api/user", userRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/process", processingRoutes);
app.use("/api/survey", surveyRoutes);

module.exports = app;
