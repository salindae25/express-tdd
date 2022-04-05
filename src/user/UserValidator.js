const { body, validationResult } = require('express-validator');
const User = require('./User');

const userSignupScheme = [
  body('username')
    .notEmpty()
    .withMessage('username_null')
    .bail()
    .isLength({ min: 4, max: 32 })
    .withMessage('username_length'),
  body('email')
    .notEmpty()
    .withMessage('email_null')
    .bail()
    .isEmail()
    .withMessage('email_not_valid')
    .bail()
    .custom(async (email) => {
      const user = await User.findOne({ where: { email: email } });
      if (user) throw new Error('email_inuse');
    }),
  ,
  body('password')
    .notEmpty()
    .withMessage('password_null')
    .bail()
    .isLength({ min: 6 })
    .withMessage('password_length')
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage('passwor_valid'),
];

const validate = (schemas) => {
  return async (req, res, next) => {
    await Promise.all(schemas.map((schema) => schema.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) {
      return next();
    }

    const validationErrors = {};
    result.array().forEach((err) => {
      validationErrors[err.param] = req.t(err.msg);
    });
    return res.status(400).send({ validationErrors });
  };
};

module.exports = {
  userSignupScheme,
  validate,
};
