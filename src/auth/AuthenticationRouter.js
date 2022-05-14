const express = require('express');
const UserService = require('../user/UserService');
const AuthenticationException = require('./AuthenticationException');
const router = express.Router();
const bcrypt = require('bcrypt');
const ForbiddenException = require('../error/ForbiddenException');
const { validate, authValidatorScheme } = require('./AuthenticationValidator');
const jwt = require('jsonwebtoken');
const TokenService = require('./tokenService');

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
    const token = await TokenService.createToken(user);
    return res.send({
      id: user.id,
      username: user.username,
      token,
    });
  }
);

router.post('/api/1.0/logout', async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) return res.send();
  const token = authorization.substring(7);
  await TokenService.remove(token);
  return res.send();
});

module.exports = router;
