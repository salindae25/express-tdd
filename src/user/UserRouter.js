const express = require('express');
const router = express.Router();
const pagination = require('../middleware/pagination');
const UserService = require('./UserService');
const { userSignupScheme, validate } = require('./UserValidator');

router.post(
  '/api/1.0/users',
  validate(userSignupScheme),
  async (req, res, next) => {
    try {
      await UserService.create(req.body);
      return res.send({ message: req.t('user_created') });
    } catch (ex) {
      next(ex);
    }
  }
);

router.post('/api/1.0/users/token/:token', async (req, res, next) => {
  const token = req.params.token;
  try {
    await UserService.activate(token);
    return res.send({ message: req.t('activation_success') });
  } catch (err) {
    next(err);
  }
});

router.get('/api/1.0/users', pagination, async (req, res, next) => {
  const { page, size } = req.pagination;
  const users = await UserService.getUsers(page, size);
  return res.status(200).send(users);
});

router.get('/api/1.0/users/:id', async (req, res, next) => {
  const id = req.params.id;
  try {
    const user = await UserService.getUser(id);
    return res.send(user);
  } catch (err) {
    next(err);
  }
});
router.put('/api/1.0/users/:id', async (req, res, next) => {
  const id = req.params.id;
  return res.status(403).send({ message: req.t('unauthorized_user_update') });
});
module.exports = router;
