const express = require('express');
const res = require('express/lib/response');
const UserService = require('../user/UserService');
const AuthenticationException = require('./AuthenticationException');
const router = express.Router();
const bcrypt = require('bcrypt');
const ForbiddenException = require('./ForbiddenException');
const { validate, authValidatorScheme } = require('./AuthenticationValidator');

router.post(
  '/api/1.0/auth',
  validate(authValidatorScheme),
  async (req, res, next) => {
    const { email, password } = req.body;
    const user = await UserService.findByEmail(email);
    if (!user) {
      return next(new AuthenticationException());
    }
    if (user.inactive) {
      return next(new ForbiddenException());
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return next(new AuthenticationException());
    }
    return res.send({
      id: user.id,
      username: user.username,
    });
  }
);

module.exports = router;
