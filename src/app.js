const express = require('express');
const i18next = require('i18next');
const i18next_fs = require('i18next-fs-backend');
const i18next_middleware = require('i18next-http-middleware');
const sequelize = require('./config/database');
const ErrorHandler = require('./error/ErrorHandler');
const userRouter = require('./user/UserRouter');
const authRouter = require('./auth/AuthenticationRouter');

i18next
  .use(i18next_fs)
  .use(i18next_middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    lng: 'en',
    ns: ['translation'],
    defaultNS: 'translation',
    backend: {
      loadPath: './locales/{{lng}}/{{ns}}.json',
    },
    detection: {
      lookupHeader: 'accept-language',
    },
  });

const app = express();
app.use(i18next_middleware.handle(i18next));
sequelize.sync();
app.use(express.json());

app.use(userRouter);

app.use(authRouter);

app.use(ErrorHandler);

module.exports = app;
