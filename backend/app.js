const express = require('express');
const bodyParser = require('body-parser');

const userRoutes = require('./routes/user');
const processingRoutes = require('./routes/process');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  next();
})

// all the various api calls...
app.use("/api/user", userRoutes);
app.use("/api/process", processingRoutes);

module.exports = app;
