const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'https://pe.sweeto.co.uk');
    res.header('Access-Control-Allow-Methods', 'GET,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  
  const userRoutes = require('./routes/user');
  const processingRoutes = require('./routes/process');

// all the various api calls...
app.use("/api/user", userRoutes);
app.use("/api/process", processingRoutes);

module.exports = app;
