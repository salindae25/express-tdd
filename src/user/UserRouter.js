const express = require('express');
const { route } = require('../app');
const UserService = require('./UserService');
const { userSignupScheme, validate } = require('./UserValidator');
const router = express.Router();

router.post('/api/1.0/users', validate(userSignupScheme), async (req, res, next) => {
  try {
    await UserService.create(req.body);
    return res.send({ message: req.t('user_created') });
  } catch (ex) {
    next(ex);
  }
});

router.post('/api/1.0/users/token/:token', async (req, res, next) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
    return res.send({ message: req.t('activation_success') });
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/users', async (req, res, next) => {
  return res.status(200).send();
});
module.exports = router;
