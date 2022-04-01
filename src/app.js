const express = require('express');
const sequelize = require('./config/database');

const userRouter = require('./user/UserRouter');
const app = express();

sequelize.sync();
app.use(express.json());

app.use(userRouter);

module.exports = app;
