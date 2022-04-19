const { body, validationResult } = require('express-validator');
const ValidationException = require('../error/ValidationException');
const AuthenticationException = require('./AuthenticationException');

const authValidatorScheme = [body('email').isEmail()];

const validate = (schemas) => {
  return async (req, res, next) => {
    await Promise.all(schemas.map((schema) => schema.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const validationErrors = {};
    next(new AuthenticationException());
  };
};

module.exports = {
  validate,
  authValidatorScheme,
};
