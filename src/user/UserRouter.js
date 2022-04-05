const express = require('express');
const UserService = require('./UserService');
const { userSignupScheme, validate } = require('./UserValidator');
const router = express.Router();

router.post('/api/1.0/users', validate(userSignupScheme), async (req, res) => {
  try {
    await UserService.create(req.body);
    return res.send({ message: req.t('user_created') });
  } catch (ex) {
    return res.status(502).send({ message: req.t(ex.message) });
  }
});

router.post('/api/1.0/users/token/:token', async (req, res) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
    return res.send({ message: req.t('activation_success') });
  } catch (err) {
    return res.status(400).send({ message: req.t(err.message) });
  }
});
module.exports = router;
